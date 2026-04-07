"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

/**
 * Auto Drive auth provider.
 *
 * The exact third-party auth pattern is TBD (see spec §4.3).
 * This provider abstracts the auth state so the rest of the app
 * works regardless of which approach is chosen (OAuth2, SDK key, redirect).
 */

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  userToken: string | null;
  walletAddress: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, userId: string) => void;
  logout: () => void;
  setWalletAddress: (address: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    userToken: null,
    walletAddress: null,
  });

  const login = useCallback((token: string, userId: string) => {
    setAuth((prev) => ({
      ...prev,
      isAuthenticated: true,
      userId,
      userToken: token,
    }));
  }, []);

  const logout = useCallback(() => {
    setAuth({
      isAuthenticated: false,
      userId: null,
      userToken: null,
      walletAddress: null,
    });
  }, []);

  const setWalletAddress = useCallback((address: string | null) => {
    setAuth((prev) => ({ ...prev, walletAddress: address }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, setWalletAddress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
