import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authAPI } from "../utils/api";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("bharat_user")) || null);
  const [token, setToken] = useState(localStorage.getItem("bharat_token"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check backend session on mount or token change
  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [token]);

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

      return { success: true };
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
      // 1. Get nonce from server
      const nonceRes = await authAPI.getNonce();
      const { message } = nonceRes.data.data;

      // 2. Sign message in browser wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify on server and link
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

  // Logout
  const logout = () => {
    localStorage.removeItem("bharat_token");
    localStorage.removeItem("bharat_user");
    setToken(null);
    setUser(null);
  };

  // Refresh user data from API
  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      const fetchedUser = res.data.data;
      setUser(fetchedUser);
      localStorage.setItem("bharat_user", JSON.stringify(fetchedUser));
    } catch {
      // Token might be expired
      logout();
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    hasWallet: !!user?.walletAddress,
    error,
    register,
    login,
    linkWallet,
    logout,
    refreshUser,
    isAdmin: user?.role === "admin",
    isVerifier: user?.role === "verifier" || user?.role === "admin",
    isRegistrar: user?.role === "registrar" || user?.role === "admin" || user?.role === "super_admin",
    isBank: user?.role === "bank" || user?.role === "super_admin",
    isSuperAdmin: user?.role === "super_admin",
  };
}
