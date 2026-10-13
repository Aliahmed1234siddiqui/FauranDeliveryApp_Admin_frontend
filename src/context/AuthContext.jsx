import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/authApi";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCurrentAdmin = useCallback(async () => {
    const token = localStorage.getItem("furan_admin_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authApi.me();
      if (data.data.user.role !== "admin") {
        throw new Error("Not an admin account");
      }
      setAdmin(data.data.user);
    } catch {
      localStorage.removeItem("furan_admin_token");
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentAdmin();
  }, [loadCurrentAdmin]);

  const login = async (identifier, password) => {
    const { data } = await authApi.login(identifier, password);
    if (data.data.user.role !== "admin") {
      throw new Error("This portal is for admin accounts only");
    }
    localStorage.setItem("furan_admin_token", data.data.accessToken);
    setAdmin(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore network errors on logout - clear local state regardless
    }
    localStorage.removeItem("furan_admin_token");
    setAdmin(null);
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
