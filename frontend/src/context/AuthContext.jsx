import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authAPI } from "../utils/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const getInitialUser = () => {
    try {
      const savedUser = localStorage.getItem("bharat_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      return null;
    }
  };

  const [user, setUser] = useState(getInitialUser());
  const [token, setToken] = useState(localStorage.getItem("bharat_token"));
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkWalletRegistration = useCallback(async () => {
    if (!address) {
      setIsRegistered(false);
      return false;
    }

    try {
      const res = await authAPI.checkWallet(address);
      const registered = res.data.data.registered;
      setIsRegistered(registered);
      return registered;
    } catch (err) {
      setIsRegistered(false);
      return false;
    }
  }, [address]);

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await authAPI.getMe();
      const fetchedUser = res.data.data;
      setUser(fetchedUser);
      localStorage.setItem("bharat_user", JSON.stringify(fetchedUser));
    } catch {
      // Token might be expired
      logout();
    }
  }, [token, logout]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("bharat_token");
    localStorage.removeItem("bharat_user");
    setToken(null);
    setUser(null);
    setIsRegistered(false);
  }, []);

  // Sync state on mount or change
  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
      if (isConnected) {
        checkWalletRegistration();
      } else {
        setIsRegistered(false);
      }
    }
  }, [token, address, isConnected, refreshUser, checkWalletRegistration]);

  // Register a new user with email and password
  const register = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(formData);
      return { success: true, data: res.data };
    } catch (err) {
      let message = err.response?.data?.message;
      if (!message && err?.code === "ERR_NETWORK") {
        message = "Cannot reach backend server. Please ensure API is running on port 5000.";
      }
      setError(message || "Registration failed");
      return { success: false, error: message || "Registration failed" };
    } finally {
      setIsLoading(false);
    }
  };

  // Login with email and password
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.login(email, password);
      const { token: newToken, user: newUser } = res.data.data;

      localStorage.setItem("bharat_token", newToken);
      localStorage.setItem("bharat_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Link Wagmi wallet to current account
  const linkWallet = async () => {
    if (!address) {
      setError("No wallet connected in MetaMask/WalletConnect");
      return { success: false, error: "No wallet connected" };
    }

    setIsLoading(true);
    setError(null);
    try {
      const nonceRes = await authAPI.getNonce();
      const { message } = nonceRes.data.data;

      const signature = await signMessageAsync({ message });

      const verifyRes = await authAPI.verify(address, signature);
      const { token: newToken, user: newUser } = verifyRes.data.data;

      localStorage.setItem("bharat_token", newToken);
      localStorage.setItem("bharat_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (err) {
      let message = err.response?.data?.message;
      if (!message) {
        const walletError = err?.shortMessage || err?.message || "";
        if (/rejected|denied|user rejected/i.test(walletError)) {
          message = "Wallet signature was rejected. Please approve the signature to link wallet.";
        }
      }
      setError(message || "Wallet linking failed");
      return { success: false, error: message || "Wallet linking failed" };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isRegistered,
    isAuthenticated: !!user && !!token,
    hasWallet: !!user?.walletAddress,
    error,
    register,
    login,
    linkWallet,
    logout,
    refreshUser,
    isAdmin: user?.role === "admin",
    isVerifier: user?.role === "verifier",
    isRegistrar: user?.role === "registrar",
    isBank: user?.role === "bank",
    isSuperAdmin: user?.role === "super_admin",
    isUserRole: user?.role === "user",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
