import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

export type Role = "ADMIN" | "PORTEIRO" | "MORADOR";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  apartment?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get<AuthUser>("/auth/me");
      setUser(data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("condo-token")) {
      refresh();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
    localStorage.setItem("condo-token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("condo-token");
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser utilizado dentro de AuthProvider");
  }
  return context;
};
