'use client';
import api from "@/utils/axios";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
}

interface UserData {
    email: string;
    id: string;
    role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {

            setLoading(true);
            try {
                const res = await api.get("/auth/me", {
            });
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
        try {
            const user = await api.post("/auth/login", {
                email,
                password,
            });
            setUser({
                email: user.data.email,
                id: user.data.id,
                role: user.data.role,
            });
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await api.post("/auth/logout");
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, password: string) => {
        setLoading(true);
        try {
            const user = await api.post("/auth/register", {
                email,
                password,
            });
            setUser({
                email: user.data.email,
                id: user.data.id,
                role: user.data.role,
            });
        } catch (error) {
            console.error("Register failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
    
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};