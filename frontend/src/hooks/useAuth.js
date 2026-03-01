import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authAPI } from "../utils/api";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("bharat_token"));
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [error, setError] = useState(null);

  // Check registration status when wallet connects
  const checkRegistration = useCallback(async () => {
    if (!address) return;

    try {
      const res = await authAPI.checkWallet(address);
      const data = res.data.data;
      setIsRegistered(data.registered);
      setRegistrationComplete(data.registrationComplete);

      if (data.registered && data.registrationComplete) {
        // Try to use existing token
        if (token) {
          try {
            const meRes = await authAPI.getMe();
            setUser(meRes.data.data);
          } catch {
            // Token expired, need to re-authenticate
            localStorage.removeItem("bharat_token");
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (err) {
      console.error("Check registration error:", err);
    }
  }, [address, token]);

  useEffect(() => {
    if (isConnected && address) {
      checkRegistration();
    } else {
      setUser(null);
      setIsRegistered(false);
      setRegistrationComplete(false);
    }
  }, [isConnected, address, checkRegistration]);

  // Register a new user
  const register = async (formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authAPI.register({
        ...formData,
        walletAddress: address,
      });

      const data = res.data.data;

      // Auto-login: sign the nonce
      const signature = await signMessageAsync({ message: data.message });
      const verifyRes = await authAPI.verify(address, signature);

      const { token: newToken, user: newUser } = verifyRes.data.data;
      localStorage.setItem("bharat_token", newToken);
      localStorage.setItem("bharat_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      setIsRegistered(true);
      setRegistrationComplete(true);

      return { success: true };
    } catch (err) {
      let message = err.response?.data?.message;

      if (!message && err?.code === "ERR_NETWORK") {
        message =
          "Cannot reach backend server. Please ensure API is running on port 5000.";
      }

      if (!message) {
        const walletError = err?.shortMessage || err?.message || "";
        if (/rejected|denied|user rejected/i.test(walletError)) {
          message =
            "Wallet signature was rejected. Please approve the signature to complete registration.";
        }
      }

      if (!message) {
        message = "Registration failed";
      }

      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  // Login (sign message)
  const login = async () => {
    if (!address) return { success: false, error: "No wallet connected" };

    setIsLoading(true);
    setError(null);
    try {
      // Get nonce
      const nonceRes = await authAPI.getNonce(address);
      const { message } = nonceRes.data.data;

      // Sign message
      const signature = await signMessageAsync({ message });

      // Verify signature
      const verifyRes = await authAPI.verify(address, signature);
      const { token: newToken, user: newUser } = verifyRes.data.data;

      localStorage.setItem("bharat_token", newToken);
      localStorage.setItem("bharat_user", JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);

      if (err.response?.data?.requiresRegistration) {
        return { success: false, error: message, requiresRegistration: true };
      }

      return { success: false, error: message };
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

  // Refresh user data
  const refreshUser = async () => {
    try {
      const res = await authAPI.getMe();
      setUser(res.data.data);
    } catch {
      // Token might be expired
      logout();
    }
  };

  return {
    user,
    token,
    isLoading,
    isRegistered,
    registrationComplete,
    isAuthenticated: !!user && !!token,
    error,
    register,
    login,
    logout,
    refreshUser,
    checkRegistration,
    isAdmin: user?.role === "admin",
    isVerifier: user?.role === "verifier" || user?.role === "admin",
    isRegistrar: user?.role === "registrar" || user?.role === "admin",
    isBank: user?.role === "bank",
  };
}
