"use client";

import { useState } from "react";
import MenuSelector from "./MenuSelector";
import StepFoto from "./StepFoto";
import StepPreview from "./StepPreview";
import StepConfirmar from "./StepConfirmar";
import type { ExtractedMenu, ZammpyDraft, ZammpyMenu } from "@/types";

const STEPS = ["Menú", "Foto", "Preview", "Crear"];

interface Props {
  token: string;
  onLogout: () => void;
  user?: {
    nombre?: string;
    apellido?: string;
    email?: string;
    avatar?: string;
  };
}

export default function MenuWizard({ token, onLogout, user }: Props) {
  const [step, setStep] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const [selectedMenu, setSelectedMenu] = useState<ZammpyMenu | null>(null);
  const [menu, setMenu] = useState<ExtractedMenu>({
    categories: [],
    grupos: [],
  });

  const initials = (
    (user?.nombre?.[0] || "") + (user?.apellido?.[0] || "")
  ).toUpperCase() || "?";

  const handleMenuSelect = (m: ZammpyMenu) => {
    setSelectedMenu(m);
    setStep(1);
  };

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
      const extracted: ExtractedMenu = await res.json();
      setMenu(extracted);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setExtracting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedMenu) return;
    setUpdating(true);
    setError("");
    try {
      const { mapToDraft } = await import("@/lib/mapper");
      const draft: ZammpyDraft = mapToDraft(menu);

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_menu",
          token,
          menId: selectedMenu.menId,
          draft,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar menú");
      }

      window.open(
        `https://app.zammpy.com/menus/${selectedMenu.menId}/edit`,
        "_blank"
      );
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
              <text
                x="50"
                y="68"
                fontFamily="Arial,sans-serif"
                fontWeight="800"
                fontSize="56"
                fill="white"
                textAnchor="middle"
              >
                Z
              </text>
            </svg>
            <div className="flex items-center gap-2 ml-2">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                  {initials}
                </div>
              )}
              <span className="text-xs text-gray-600 hidden sm:inline">
                {user?.nombre} {user?.apellido}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Paso {step + 1} de {STEPS.length}
            </span>
            <button
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-1 mb-6">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  i <= step ? "bg-indigo-500" : "bg-gray-200"
                }`}
              />
              <span
                className={`text-[10px] ${
                  i === step
                    ? "text-indigo-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-5">
          {step === 0 && (
            <MenuSelector token={token} onSelect={handleMenuSelect} />
          )}
          {step === 1 && (
            <StepFoto onFileSelected={handleImage} loading={extracting} />
          )}
          {step === 2 && <StepPreview menu={menu} onChange={setMenu} />}
          {step === 3 && (
            <StepConfirmar
              menu={menu}
              selectedMenu={selectedMenu}
              creating={updating}
              onUpdate={handleUpdate}
            />
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
          {step > 0 && step < STEPS.length - 1 && (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
