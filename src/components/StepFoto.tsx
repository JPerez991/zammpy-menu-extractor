"use client";

import { useRef, useState } from "react";

interface Props {
  onFileSelected: (base64: string, mimeType: string) => void;
  onDemo?: () => void;
  loading: boolean;
}

export default function StepFoto({ onFileSelected, onDemo, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPDF, setIsPDF] = useState(false);

  const handleFile = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) return;

    setFileName(file.name);
    setIsPDF(isPdf);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (isPdf) {
        setPreview(null);
      } else {
        setPreview(reader.result as string);
      }
      onFileSelected(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Sube el menú de tu restaurante
      </h2>
      <p className="text-sm text-gray-500 text-center">
        La IA analizará el archivo y extraerá los platos, precios y categorías
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          preview || fileName
            ? "border-indigo-300 bg-indigo-50"
            : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Menú"
            className="max-h-80 mx-auto rounded-lg shadow-sm"
          />
        ) : fileName && isPDF ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-16 h-20 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{fileName}</p>
              <p className="text-xs text-gray-400">PDF listo para analizar</p>
            </div>
          </div>
        ) : (
          <div className="text-gray-400">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-sm">
              Arrastra un archivo aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Analizando menú con IA...</span>
          </div>
          <div className="w-full max-w-xs">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1">
              Esto puede tomar 10-30 segundos
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {onDemo && (
        <>
          <div className="relative w-full my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">o</span>
            </div>
          </div>
          <button
            onClick={onDemo}
            className="w-full border border-dashed border-indigo-300 bg-indigo-50 text-indigo-700 py-3 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            Cargar datos de prueba
          </button>
        </>
      )}
    </div>
  );
}
