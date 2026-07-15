"use client";

import { useState, useMemo } from "react";
import type { MenuData, MenuCategory, MenuProduct, ZammpyIcon } from "@/types";
import { VALID_ICONS } from "@/types";

interface Props {
  data: MenuData;
  onChange: (data: MenuData) => void;
}

const ICON_LABELS: Record<ZammpyIcon, string> = {
  burger: "🍔 Hamburguesas",
  cup: "☕ Café/Bebidas",
  cake: "🎂 Postres",
  ice: "🍦 Helados",
  box: "📦 Combos",
  pizza: "🍕 Pizza",
  bag: "🛍️ Para llevar",
  soup: "🥣 Sopas",
  star: "⭐ Especiales",
  heart: "❤️ Favoritos",
  bread: "🍞 Panadería",
  croissant: "🥐 Croissantería",
  cookie: "🍪 Galletas",
  sandwich: "🥪 Sándwiches",
  beef: "🥩 Carnes",
  fish: "🐟 Mariscos",
  salad: "🥗 Ensaladas",
  leaf: "🥬 Vegano",
  wine: "🍷 Vinos",
  beer: "🍺 Cervezas",
  chef: "👨‍🍳 Chef",
  fork: "🍴 Genérico",
};

const formatPrice = (p: number) =>
  "$" + p.toLocaleString("es-CO");

export default function StepPreview({ data, onChange }: Props) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disabledProducts, setDisabledProducts] = useState<Set<number>>(new Set());

  const enabledProducts = useMemo(
    () => data.products.filter((_, i) => !disabledProducts.has(i)),
    [data.products, disabledProducts]
  );

  const enabledData: MenuData = useMemo(
    () => ({
      categories: data.categories,
      products: enabledProducts,
    }),
    [data.categories, enabledProducts]
  );

  const jsonStr = useMemo(
    () => JSON.stringify(enabledData, null, 2),
    [enabledData]
  );

  const toggleProduct = (idx: number) => {
    setDisabledProducts((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleCat = (name: string) => {
    setOpenCats((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const updateCategory = (idx: number, field: keyof MenuCategory, value: string) => {
    const cats = [...data.categories];
    cats[idx] = { ...cats[idx], [field]: value };
    onChange({ ...data, categories: cats });
  };

  const addCategory = () => {
    const name = "Nueva categoría";
    onChange({
      ...data,
      categories: [...data.categories, { name, icon: "fork" }],
    });
    setOpenCats((prev) => ({ ...prev, [name]: true }));
  };

  const removeCategory = (idx: number) => {
    const catName = data.categories[idx].name;
    onChange({
      categories: data.categories.filter((_, i) => i !== idx),
      products: data.products.filter((p) => p.categoryName !== catName),
    });
  };

  const updateProduct = (idx: number, field: keyof MenuProduct, value: string | number | string[]) => {
    const products = [...data.products];
    products[idx] = { ...products[idx], [field]: value };
    onChange({ ...data, products });
  };

  const addProduct = (categoryName: string) => {
    onChange({
      ...data,
      products: [
        ...data.products,
        { categoryName, name: "", description: "", price: 0, components: [], imageUrl: "" },
      ],
    });
  };

  const removeProduct = (idx: number) => {
    onChange({
      ...data,
      products: data.products.filter((_, i) => i !== idx),
    });
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Menú extraído
        </h2>
        <div className="flex gap-2 text-xs">
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
            {data.categories.length} categorías
          </span>
          <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
            {enabledProducts.length}/{data.products.length} productos
          </span>
        </div>
      </div>

      {/* === Categorías === */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Categorías</h3>
        <div className="space-y-1.5">
          {data.categories.map((cat, ci) => (
            <div key={ci} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <button onClick={() => toggleCat(cat.name)} className="text-gray-400 hover:text-gray-600 text-xs w-4">
                {openCats[cat.name] ? "▼" : "▶"}
              </button>
              <select
                value={cat.icon}
                onChange={(e) => updateCategory(ci, "icon", e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {VALID_ICONS.map((icon) => (
                  <option key={icon} value={icon}>{ICON_LABELS[icon]}</option>
                ))}
              </select>
              <input
                value={cat.name}
                onChange={(e) => updateCategory(ci, "name", e.target.value)}
                className="flex-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-gray-300 focus:border-indigo-500 outline-none"
              />
              <span className="text-xs text-gray-400">
                {data.products.filter((p) => p.categoryName === cat.name).length}
              </span>
              <button onClick={() => addProduct(cat.name)} className="text-xs text-indigo-600 hover:text-indigo-800">+Prod</button>
              <button onClick={() => removeCategory(ci)} className="text-xs text-red-500 hover:text-red-700">×</button>
            </div>
          ))}
        </div>
        <button onClick={addCategory} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Categoría</button>
      </div>

      {/* === Productos === */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Productos</h3>
        <div className="space-y-1.5">
          {data.products.map((prod, pi) => {
            const disabled = disabledProducts.has(pi);
            return (
              <div key={pi} className={`bg-white border rounded-xl px-3 py-2.5 transition-colors ${disabled ? "border-gray-200 opacity-50" : "border-gray-200"}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!disabled}
                    onChange={() => toggleProduct(pi)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <input
                    value={prod.name}
                    onChange={(e) => updateProduct(pi, "name", e.target.value)}
                    placeholder="Nombre del producto"
                    className="flex-1 text-sm font-medium bg-transparent outline-none border-b border-transparent focus:border-indigo-500"
                  />
                  <input
                    value={prod.price || ""}
                    onChange={(e) => updateProduct(pi, "price", e.target.value ? Number(e.target.value) : 0)}
                    placeholder="Precio"
                    type="number"
                    className="w-24 text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button onClick={() => removeProduct(pi)} className="text-red-400 hover:text-red-600 text-sm">×</button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    value={prod.description}
                    onChange={(e) => updateProduct(pi, "description", e.target.value)}
                    placeholder="Descripción (opcional)"
                    className="flex-1 text-xs text-gray-500 bg-transparent outline-none border-b border-transparent focus:border-indigo-300"
                  />
                  <select
                    value={prod.categoryName}
                    onChange={(e) => updateProduct(pi, "categoryName", e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {data.categories.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-1.5">
                  <input
                    value={prod.components.join(", ")}
                    onChange={(e) => updateProduct(pi, "components", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                    placeholder="Ingredientes (separados por coma)"
                    className="w-full text-xs text-gray-400 bg-transparent outline-none border-b border-transparent focus:border-indigo-300"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === JSON Preview === */}
      <div>
        <button
          onClick={() => setShowJson(!showJson)}
          className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
        >
          {showJson ? "▼" : "▶"} JSON
          <span className="text-xs text-gray-400 font-normal">
            (solo productos habilitados)
          </span>
        </button>

        {showJson && (
          <div className="mt-2 relative">
            <pre className="bg-gray-900 text-green-400 text-xs rounded-xl p-4 overflow-auto max-h-96 font-mono whitespace-pre-wrap">
              {jsonStr}
            </pre>
            <button
              onClick={copyJson}
              className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {copied ? "✓ Copiado" : "Copiar JSON"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
