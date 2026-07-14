"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const GOOGLE_CLIENT_ID =
  "583445389963-a8aksvfphg9gd8cbvadimlivke54f4a7.apps.googleusercontent.com";

interface SavedAccount {
  email: string;
  nombre: string;
  apellido: string;
  avatar: string;
  token: string;
}

interface Props {
  onLogin: (token: string) => void;
}

export default function LoginForm({ onLogin }: Props) {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleInitRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("zammpy_accounts");
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const saveAccount = (data: {
    token: string;
    email?: string;
    nombre?: string;
    apellido?: string;
    avatar?: string;
  }) => {
    const account: SavedAccount = {
      email: data.email || "",
      nombre: data.nombre || "",
      apellido: data.apellido || "",
      avatar: data.avatar || "",
      token: data.token,
    };
    const updated = accounts.filter((a) => a.email !== account.email);
    updated.unshift(account);
    localStorage.setItem("zammpy_accounts", JSON.stringify(updated));
    setAccounts(updated);
  };

  const handleGoogleResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError("No se pudo obtener credencial de Google");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "google_token",
            idToken: response.credential,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al autenticar con Google");
        }
        saveAccount(data);
        localStorage.setItem("zammpy_token", data.token);
        onLogin(data.token);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [accounts, onLogin]
  );

  useEffect(() => {
    if (googleInitRef.current) return;
    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(checkGoogle);
        googleInitRef.current = true;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
        });
      }
    }, 200);
    return () => clearInterval(checkGoogle);
  }, [handleGoogleResponse]);

  const openGooglePopup = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification?.notDisplayed || notification?.skipped) {
          setError(
            "No se pudo abrir el popup de Google. Intenta desbloquear popups para este sitio."
          );
        }
      });
    } else {
      setError("Google Identity Services no se ha cargado. Recarga la página.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }
      saveAccount(data);
      localStorage.setItem("zammpy_token", data.token);
      onLogin(data.token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (account: SavedAccount) => {
    localStorage.setItem("zammpy_token", account.token);
    onLogin(account.token);
  };

  const removeAccount = (accountEmail: string) => {
    const updated = accounts.filter((a) => a.email !== accountEmail);
    setAccounts(updated);
    localStorage.setItem("zammpy_accounts", JSON.stringify(updated));
  };

  const initials = (nombre: string, apellido: string) => {
    return ((nombre?.[0] || "") + (apellido?.[0] || "")).toUpperCase() || "?";
  };

  if (accounts.length > 0 && !showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
          <div className="text-center mb-8">
            <svg viewBox="0 0 100 100" className="w-12 h-12 mx-auto mb-3">
              <rect width="100" height="100" rx="20" fill="#4A37F2" />
              <text x="50" y="68" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="56" fill="white" textAnchor="middle">Z</text>
            </svg>
            <h1 className="text-xl font-bold text-gray-900">Selecciona una cuenta</h1>
            <p className="text-sm text-gray-500 mt-1">para continuar a Zammpy</p>
          </div>

          <div className="space-y-2 mb-4">
            {accounts.map((acc) => (
              <button key={acc.email} onClick={() => selectAccount(acc)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group">
                {acc.avatar ? (
                  <img src={acc.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
                    {initials(acc.nombre, acc.apellido)}
                  </div>
                )}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{acc.nombre} {acc.apellido}</p>
                  <p className="text-xs text-gray-500">{acc.email}</p>
                </div>
                <svg onClick={(e) => { e.stopPropagation(); removeAccount(acc.email); }} className="w-4 h-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>

          <button onClick={() => setShowForm(true)} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Usar otra cuenta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <svg viewBox="0 0 100 100" className="w-12 h-12 mx-auto mb-3">
            <rect width="100" height="100" rx="20" fill="#4A37F2" />
            <text x="50" y="68" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="56" fill="white" textAnchor="middle">Z</text>
          </svg>
          <h1 className="text-xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="text-sm text-gray-500 mt-1">Continúa con Zammpy</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-indigo-600 mb-4">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Procesando...</span>
          </div>
        )}

        <button onClick={openGooglePopup} disabled={loading} className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar con Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-400">o</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        {accounts.length > 0 && (
          <button onClick={() => setShowForm(false)} className="w-full mt-4 text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
            Volver a cuentas
          </button>
        )}
      </div>
    </div>
  );
}
