"use client";

import { useState } from "react";
import StepFoto from "./StepFoto";
import StepPreview from "./StepPreview";
import MenuSelector from "./MenuSelector";
import type { MenuData, ZammpyMenu } from "@/types";

const STEPS = ["Subir", "Revisar", "Enviar"];

interface Props {
  token?: string;
  onLogout?: () => void;
  onLogin?: () => void;
  user?: {
    nombre?: string;
    apellido?: string;
    email?: string;
    avatar?: string;
  };
}

export default function MenuWizard({ token, onLogout, onLogin, user }: Props) {
  const [step, setStep] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState<MenuData>({ categories: [], products: [] });
  const [selectedMenu, setSelectedMenu] = useState<ZammpyMenu | null>(null);
  const [showZammpy, setShowZammpy] = useState(false);

  const initials = (
    (user?.nombre?.[0] || "") + (user?.apellido?.[0] || "")
  ).toUpperCase() || "?";

  const handleImage = async (base64: string, mimeType: string) => {
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, mimeType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al extraer menú");
      }
      const extracted: MenuData = await res.json();
      setMenu(extracted);
      setStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setExtracting(false);
    }
  };

  const handleMenuSelect = (m: ZammpyMenu) => {
    setSelectedMenu(m);
  };

  const handlePush = async () => {
    if (!token || !selectedMenu) return;
    setUpdating(true);
    setError("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_menu",
          token,
          menId: selectedMenu.menId,
          draft: menu,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar menú");
      }

      window.open(`https://app.zammpy.com/menus/${selectedMenu.menId}/edit`, "_blank");
      alert("Menú actualizado exitosamente.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <rect width="100" height="100" rx="20" fill="#4A37F2" />
              <text x="50" y="68" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="56" fill="white" textAnchor="middle">Z</text>
            </svg>
            <span className="text-sm font-semibold text-gray-800 hidden sm:inline">Menu Extractor</span>
          </div>
          <div className="flex items-center gap-3">
            {token && user && (
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold">{initials}</div>
                )}
                <span className="text-xs text-gray-500 hidden sm:inline">{user.nombre}</span>
              </div>
            )}
            {token && onLogout && (
              <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors" title="Cerrar sesión">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-1 mb-6">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? "bg-indigo-500" : "bg-gray-200"}`} />
              <span className={`text-[10px] ${i === step ? "text-indigo-600 font-medium" : "text-gray-400"}`}>{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5">
          {step === 0 && (
            <StepFoto onFileSelected={handleImage} loading={extracting} />
          )}
          {step === 1 && (
            <StepPreview data={menu} onChange={setMenu} />
          )}
          {step === 2 && (
            <div className="space-y-4">
              {token ? (
                <>
                  {!selectedMenu ? (
                    <MenuSelector token={token} onSelect={handleMenuSelect} />
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                        <p className="text-xs text-indigo-600 font-medium">Menú destino</p>
                        <p className="text-sm font-semibold text-indigo-800">{selectedMenu.menName}</p>
                        <p className="text-xs text-indigo-500">{selectedMenu.menSlug}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-sm">
                        <p><strong>Categorías:</strong> {menu.categories.length}</p>
                        <p><strong>Productos:</strong> {menu.products.length}</p>
                      </div>
                      <button
                        onClick={handlePush}
                        disabled={updating || menu.products.length === 0}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {updating ? "Enviando..." : `Enviar a ${selectedMenu.menName}`}
                      </button>
                      <button onClick={() => setSelectedMenu(null)} className="w-full text-sm text-gray-500 hover:text-gray-700">Cambiar menú</button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-4">Para enviar el menú a Zammpy, inicia sesión.</p>
                  {onLogin && (
                    <button onClick={onLogin} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Conectar con Zammpy
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-30 transition-colors"
          >
            Atrás
          </button>
          {step === 0 && <div />}
          {step === 1 && (
            <button onClick={() => setStep(2)} className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
