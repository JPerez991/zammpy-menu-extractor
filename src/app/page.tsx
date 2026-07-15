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

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);

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
    setShowLogin(false);
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

  if (showLogin) {
    return (
      <div>
        <LoginForm onLogin={handleLogin} />
        <button
          onClick={() => setShowLogin(false)}
          className="fixed top-4 left-4 text-sm text-gray-500 hover:text-gray-700 bg-white rounded-lg px-3 py-1.5 shadow-sm border border-gray-200 z-50"
        >
          ← Volver al extractor
        </button>
      </div>
    );
  }

  return (
    <MenuWizard
      token={token || undefined}
      onLogout={token ? handleLogout : undefined}
      onLogin={() => setShowLogin(true)}
      user={user || undefined}
    />
  );
}
