"use client";

import { useState } from "react";
import StepFoto from "./StepFoto";
import StepPreview from "./StepPreview";
import type { MenuData } from "@/types";

const STEPS = ["Subir", "Revisar"];

export default function MenuWizard() {
  const [step, setStep] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState<MenuData>({ categories: [], products: [] });

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
        throw new Error(data.detail || data.error || "Error al extraer menú");
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

  const handleDemo = async () => {
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo" }),
      });
      if (!res.ok) throw new Error("Error al cargar datos de prueba");
      const data: MenuData = await res.json();
      setMenu(data);
      setStep(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <svg viewBox="0 0 100 100" className="w-8 h-8">
            <rect width="100" height="100" rx="20" fill="#4A37F2" />
            <text x="50" y="68" fontFamily="Arial,sans-serif" fontWeight="800" fontSize="56" fill="white" textAnchor="middle">Z</text>
          </svg>
          <span className="text-sm font-semibold text-gray-800">Menu Extractor</span>
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
            <StepFoto onFileSelected={handleImage} onDemo={handleDemo} loading={extracting} />
          )}
          {step === 1 && (
            <StepPreview data={menu} onChange={setMenu} />
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
        </div>
      </div>
    </div>
  );
}
