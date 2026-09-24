import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as apiLogin, register as apiRegister, getMe } from "../api";

const AuthContext = createContext(null);

const STORAGE_KEY_USER = "user";
const STORAGE_KEY_TOKEN = "token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiLogin({ email, password });
    const { access_token, user: userData } = data;

    localStorage.setItem(STORAGE_KEY_TOKEN, access_token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    setToken(access_token);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(
    async ({ full_name, email, password, mobile, city, state, country, role }) => {
      const data = await apiRegister({
        full_name,
        email,
        password,
        mobile,
        city,
        state,
        country,
        role,
      });
      return data;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const userData = await getMe();
      setUser(userData);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    } catch {
      logout();
    }
  }, [token, logout]);

  const isAdmin = user?.role?.name === "ADMIN";
  const isCustomer = user?.role?.name === "BUYER" || user?.role?.name === "CUSTOMER";
  const isEndUser = user?.role?.name === "SELLER" || user?.role?.name === "ENDUSER";
  const isBuyer = isCustomer;
  const isSeller = isEndUser;
  const isAuthenticated = !!token && !!user;

  const value = {
    user,
    token,
    loading,
    isAdmin,
    isCustomer,
    isEndUser,
    isBuyer,
    isSeller,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
