"use client";

import { useRef, useState } from "react";

interface FileItem {
  id: string;
  file: File;
  base64: string;
  preview: string | null;
  fileName: string;
  isPDF: boolean;
}

interface Props {
  onFilesSelected: (files: { file: string; mimeType: string; fileName: string }[]) => void;
  onDemo?: () => void;
  loading: boolean;
}

export default function StepFoto({ onFilesSelected, onDemo, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);

  const processFile = (file: File): Promise<FileItem> => {
    return new Promise((resolve) => {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) {
        resolve({ id: "", file, base64: "", preview: null, fileName: file.name, isPDF: false });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          base64,
          preview: isPdf ? null : (reader.result as string),
          fileName: file.name,
          isPDF: isPdf,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (newFiles: FileList | File[]) => {
    const items: FileItem[] = [];
    for (const f of Array.from(newFiles)) {
      const item = await processFile(f);
      if (item.base64) items.push(item);
    }
    setFiles((prev) => [...prev, ...items]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleAnalyze = () => {
    const payload = files.map((f) => ({
      file: f.base64,
      mimeType: f.isPDF ? "application/pdf" : f.file.type || "image/jpeg",
      fileName: f.fileName,
    }));
    onFilesSelected(payload);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Sube el menú de tu restaurante
      </h2>
      <p className="text-sm text-gray-500 text-center">
        Puedes subir una o varias fotos. La IA analizará cada imagen y extraerá los platos, precios y categorías
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
      >
        <svg
          className="w-10 h-10 mx-auto mb-2 text-gray-400"
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
        <p className="text-sm text-gray-600">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — puedes seleccionar varios</p>
      </div>

      {files.length > 0 && (
        <div className="w-full space-y-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
            >
              {f.preview ? (
                <img src={f.preview} alt="" className="w-12 h-12 object-cover rounded" />
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
              )}
              <span className="text-sm text-gray-700 truncate flex-1">{f.fileName}</span>
              <button
                onClick={() => removeFile(f.id)}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && !loading && (
        <button
          onClick={handleAnalyze}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Analizar {files.length} {files.length === 1 ? "archivo" : "archivos"}
        </button>
      )}

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
              Esto puede tomar 10-30 segundos por archivo
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) addFiles(e.target.files);
          e.target.value = "";
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
