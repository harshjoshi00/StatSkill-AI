"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginApi, registerApi, fetchMeApi, User } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem("statskill_token");
    setUser(null);
    setToken(null);
  }, []);

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("statskill_token");
    if (storedToken) {
      setToken(storedToken);
      fetchMeApi(storedToken)
        .then((u) => setUser(u))
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [logout]);

  const login = async (email: string, password: string) => {
    const data = await loginApi(email, password);
    localStorage.setItem("statskill_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const data = await registerApi(firstName, lastName, email, password);
    localStorage.setItem("statskill_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
