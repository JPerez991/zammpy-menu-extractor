"use client";

import { useState } from "react";
import type { ExtractedMenu, ExtractedCategory, ExtractedGrupo } from "@/types";

interface Props {
  menu: ExtractedMenu;
  onChange: (menu: ExtractedMenu) => void;
}

export default function StepPreview({ menu, onChange }: Props) {
  const [openCats, setOpenCats] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    menu.categories.forEach((_, i) => {
      init[i] = true;
    });
    return init;
  });

  const totalProducts = menu.categories.reduce(
    (s, c) => s + c.products.length,
    0
  );
  const withPrice = menu.categories.reduce(
    (s, c) => s + c.products.filter((p) => p.price !== null).length,
    0
  );
  const withoutPrice = totalProducts - withPrice;

  const updateCategoryName = (ci: number, name: string) => {
    const updated = { ...menu };
    updated.categories = updated.categories.map((c, i) =>
      i === ci ? { ...c, name } : c
    );
    onChange(updated);
  };

  const updateProduct = (
    ci: number,
    pi: number,
    field: string,
    value: string | number | null
  ) => {
    const updated = { ...menu };
    const cats = [...updated.categories];
    const products = [...cats[ci].products];
    products[pi] = { ...products[pi], [field]: value };
    cats[ci] = { ...cats[ci], products };
    updated.categories = cats;
    onChange(updated);
  };

  const removeProduct = (ci: number, pi: number) => {
    const updated = { ...menu };
    const cats = [...updated.categories];
    cats[ci] = {
      ...cats[ci],
      products: cats[ci].products.filter((_, i) => i !== pi),
    };
    updated.categories = cats;
    onChange(updated);
  };

  const removeCategory = (ci: number) => {
    const updated = { ...menu };
    updated.categories = updated.categories.filter((_, i) => i !== ci);
    onChange(updated);
  };

  const addCategory = () => {
    const updated = { ...menu };
    const idx = updated.categories.length;
    updated.categories = [
      ...updated.categories,
      { name: "Nueva categoría", products: [] },
    ];
    onChange(updated);
    setOpenCats((prev) => ({ ...prev, [idx]: true }));
  };

  const addProduct = (ci: number) => {
    const updated = { ...menu };
    const cats = [...updated.categories];
    cats[ci] = {
      ...cats[ci],
      products: [
        ...cats[ci].products,
        { name: "", description: null, price: null },
      ],
    };
    updated.categories = cats;
    onChange(updated);
  };

  const moveProduct = (fromCi: number, fromPi: number, toCi: number) => {
    const updated = { ...menu };
    const cats = updated.categories.map((c) => ({
      ...c,
      products: [...c.products],
    }));
    const [moved] = cats[fromCi].products.splice(fromPi, 1);
    cats[toCi].products.push(moved);
    updated.categories = cats;
    onChange(updated);
  };

  const updateGrupo = (
    idx: number,
    field: keyof ExtractedGrupo,
    value: string | string[]
  ) => {
    const updated = { ...menu };
    updated.grupos = updated.grupos.map((g, i) =>
      i === idx ? { ...g, [field]: value } : g
    );
    onChange(updated);
  };

  const removeGrupo = (idx: number) => {
    const updated = { ...menu };
    updated.grupos = updated.grupos.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const addGrupo = () => {
    const updated = { ...menu };
    updated.grupos = [...updated.grupos, { name: "", items: [] }];
    onChange(updated);
  };

  const toggleCat = (ci: number) => {
    setOpenCats((prev) => ({ ...prev, [ci]: !prev[ci] }));
  };

  const formatPrice = (p: number | null) =>
    p !== null ? `$${p.toLocaleString("es-CO")}` : "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Menú extraído
        </h2>
        <button
          onClick={addCategory}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Categoría
        </button>
      </div>

      <div className="flex gap-3 text-xs">
        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
          {menu.categories.length} categorías
        </span>
        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
          {totalProducts} productos
        </span>
        {withoutPrice > 0 && (
          <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">
            {withoutPrice} sin precio
          </span>
        )}
      </div>

      {menu.categories.map((cat, ci) => {
        const isOpen = openCats[ci] !== false;
        return (
          <div
            key={ci}
            className="border border-gray-200 rounded-xl bg-white overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <button
                onClick={() => toggleCat(ci)}
                className="text-gray-400 hover:text-gray-600 text-xs w-5"
              >
                {isOpen ? "▼" : "▶"}
              </button>
              <input
                value={cat.name}
                onChange={(e) => updateCategoryName(ci, e.target.value)}
                className="font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none text-sm flex-1"
              />
              <span className="text-xs text-gray-400">
                {cat.products.length}
              </span>
              <div className="flex gap-2 ml-1">
                <button
                  onClick={() => addProduct(ci)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  +Prod
                </button>
                <button
                  onClick={() => removeCategory(ci)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="p-3">
                {cat.products.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Sin productos
                  </p>
                )}
                <div className="space-y-2">
                  {cat.products.map((prod, pi) => (
                    <div key={pi} className="group">
                      <div className="flex items-start gap-2 text-sm">
                        <input
                          value={prod.name}
                          onChange={(e) =>
                            updateProduct(ci, pi, "name", e.target.value)
                          }
                          placeholder="Nombre"
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <input
                          value={prod.price ?? ""}
                          onChange={(e) =>
                            updateProduct(
                              ci,
                              pi,
                              "price",
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          placeholder="Precio"
                          type="number"
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-1 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          value=""
                          onChange={(e) => {
                            const target = Number(e.target.value);
                            if (target !== ci) {
                              moveProduct(ci, pi, target);
                            }
                            e.target.value = "";
                          }}
                        >
                          <option value="">Mover</option>
                          {menu.categories.map((c, cIdx) =>
                            cIdx !== ci ? (
                              <option key={cIdx} value={cIdx}>
                                → {c.name}
                              </option>
                            ) : null
                          )}
                        </select>
                        <button
                          onClick={() => removeProduct(ci, pi)}
                          className="text-red-400 hover:text-red-600 text-lg leading-none mt-1"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        value={prod.description ?? ""}
                        onChange={(e) =>
                          updateProduct(
                            ci,
                            pi,
                            "description",
                            e.target.value || null
                          )
                        }
                        placeholder="Descripción (opcional)"
                        className="w-full border border-gray-100 rounded-lg px-2 py-1 text-xs text-gray-500 outline-none focus:ring-1 focus:ring-indigo-500 mt-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {menu.grupos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Grupos de opciones
            </h3>
            <button
              onClick={addGrupo}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              + Grupo
            </button>
          </div>
          {menu.grupos.map((grupo, gi) => (
            <div
              key={gi}
              className="border border-gray-200 rounded-xl p-3 bg-white mb-2"
            >
              <div className="flex items-center justify-between mb-2">
                <input
                  value={grupo.name}
                  onChange={(e) => updateGrupo(gi, "name", e.target.value)}
                  className="font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none flex-1"
                />
                <button
                  onClick={() => removeGrupo(gi)}
                  className="text-xs text-red-500 hover:text-red-700 ml-2"
                >
                  Eliminar
                </button>
              </div>
              <textarea
                value={grupo.items.join(", ")}
                onChange={(e) =>
                  updateGrupo(
                    gi,
                    "items",
                    e.target.value.split(",").map((s) => s.trim())
                  )
                }
                placeholder="Opciones separadas por coma"
                rows={2}
                className="w-full text-xs text-gray-600 border border-gray-100 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
          ))}
        </div>
      )}

      {menu.grupos.length === 0 && (
        <button
          onClick={addGrupo}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          + Agregar grupo de opciones
        </button>
      )}
    </div>
  );
}
