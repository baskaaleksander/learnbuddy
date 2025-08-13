"use client";
import { UserTokens } from "@/lib/definitions";
import { useAuthStore } from "@/utils/authStore";
import api from "@/utils/axios";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string
  ) => Promise<void>;
  getUserTokens: () => Promise<any>;
  userTokens: UserTokens | null;
}

export interface UserData {
  email: string;
  id: string;
  role: string;
  firstName: string;
  tokensUsed: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [userTokens, setUserTokens] = useState<UserTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (error: any): string => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  };

  useEffect(() => {
    const checkAuth = async () => {
      setError(null);
      setLoading(true);

      try {
        const res = await api.get("/auth/me");
        const tokensRes = await api.get("/billing/get-user-tokens");
        setUserTokens(tokensRes.data);
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const user = await api.post("/auth/login", {
        email,
        password,
      });
      setUser({
        email: user.data.email,
        id: user.data.id,
        role: user.data.role,
        firstName: user.data.firstName,
        tokensUsed: user.data.tokensUsed,
      });
      useAuthStore.getState().setAccessToken(user.data.accessToken);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/logout");
      setUser(null);
      useAuthStore.getState().clear();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const user = await api.post("/auth/register", {
        email,
        password,
        firstName,
      });
      setUser({
        email: user.data.email,
        id: user.data.id,
        role: user.data.role,
        firstName: user.data.firstName,
        tokensUsed: user.data.tokensUsed,
      });
      useAuthStore.getState().setAccessToken(user.data.accessToken);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const getUserTokens = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/billing/get-user-tokens");
      return response.data;
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        register,
        getUserTokens,
        userTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
