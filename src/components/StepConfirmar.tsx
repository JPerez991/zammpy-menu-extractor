"use client";

import type { ExtractedMenu, ZammpyMenu } from "@/types";

interface Props {
  menu: ExtractedMenu;
  selectedMenu: ZammpyMenu | null;
  creating: boolean;
  onUpdate: () => void;
}

export default function StepConfirmar({
  menu,
  selectedMenu,
  creating,
  onUpdate,
}: Props) {
  const totalProducts = menu.categories.reduce(
    (s, c) => s + c.products.length,
    0
  );

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">
        Resumen del menú
      </h2>

      {selectedMenu && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-xs text-indigo-600 font-medium">Menú destino</p>
          <p className="text-sm font-semibold text-indigo-800">
            {selectedMenu.menName || "Sin nombre"}
          </p>
          <p className="text-xs text-indigo-500">{selectedMenu.menSlug}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Categorías</p>
            <p className="text-sm font-medium text-gray-800">
              {menu.categories.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Productos</p>
            <p className="text-sm font-medium text-gray-800">
              {totalProducts}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Grupos</p>
            <p className="text-sm font-medium text-gray-800">
              {menu.grupos.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Vista previa por categoría
        </h3>
        {menu.categories.map((cat, i) => (
          <div key={i} className="mb-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              {cat.name}
            </p>
            <ul className="text-xs text-gray-500 ml-2">
              {cat.products.map((p, j) => (
                <li key={j}>
                  {p.name} —{" "}
                  {p.price ? `$${p.price.toLocaleString()}` : "Sin precio"}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={onUpdate}
        disabled={creating || totalProducts === 0}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {creating
          ? "Actualizando menú..."
          : `Actualizar ${selectedMenu?.menName || "menú"}`}
      </button>

      {totalProducts === 0 && (
        <p className="text-xs text-red-500 text-center">
          No hay productos para agregar
        </p>
      )}
    </div>
  );
}
