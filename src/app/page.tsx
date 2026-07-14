"use client";

import { useState, useEffect, useCallback } from "react";
import LoginForm from "@/components/LoginForm";
import MenuWizard from "@/components/MenuWizard";

interface User {
  nombre?: string;
  apellido?: string;
  email?: string;
  avatar?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          prompt: (callback?: (notification: { notDisplayed?: string; skipped?: string; dismissed?: string }) => void) => void;
        };
      };
    };
  }
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("zammpy_token");
    if (saved) {
      setToken(saved);
      const accounts = JSON.parse(localStorage.getItem("zammpy_accounts") || "[]");
      const current = accounts.find((a: { token: string }) => a.token === saved);
      if (current) {
        setUser({
          nombre: current.nombre,
          apellido: current.apellido,
          email: current.email,
          avatar: current.avatar,
        });
      }
    }
  }, []);

  const handleLogin = useCallback((newToken: string) => {
    setToken(newToken);
    const accounts = JSON.parse(localStorage.getItem("zammpy_accounts") || "[]");
    const current = accounts.find((a: { token: string }) => a.token === newToken);
    if (current) {
      setUser({
        nombre: current.nombre,
        apellido: current.apellido,
        email: current.email,
        avatar: current.avatar,
      });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("zammpy_token");
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <MenuWizard token={token} onLogout={handleLogout} user={user || undefined} />;
}
