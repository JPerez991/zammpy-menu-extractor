"use client";

import { useState, useEffect } from "react";
import type { ZammpyMenu } from "@/types";

interface Props {
  token: string;
  onSelect: (menu: ZammpyMenu) => void;
}

export default function MenuSelector({ token, onSelect }: Props) {
  const [menus, setMenus] = useState<ZammpyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "fetch_menus", token }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Error al obtener menús");
        }

        const data = await res.json();
        setMenus(Array.isArray(data) ? data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error al cargar menús");
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [token]);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: "bg-green-100 text-green-700",
      draft: "bg-amber-100 text-amber-700",
    };
    return styles[status] || "bg-gray-100 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando tus menús...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">
          Selecciona un menú
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Elige el menú al que quieres agregar los platillos
        </p>
      </div>

      {menus.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-500">
            No tienes menús creados todavía.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Crea un menú en{" "}
            <a
              href="https://app.zammpy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              app.zammpy.com
            </a>{" "}
            y vuelve aquí para agregar platillos.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {menus.map((menu) => (
            <button
              key={menu.menId}
              onClick={() => onSelect(menu)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
            >
              {menu.thumbnailUrl ? (
                <img
                  src={menu.thumbnailUrl}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {menu.menName || "Sin nombre"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {menu.menSlug}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(
                    menu.menStatus
                  )}`}
                >
                  {menu.menStatus === "published" ? "Publicado" : "Borrador"}
                </span>
                <svg
                  className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
