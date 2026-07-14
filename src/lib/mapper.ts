import type {
  ExtractedMenu,
  ZammpyDraft,
  ZammpyCategory,
  ZammpyProduct,
  ZammpyGrupo,
} from "@/types";

let counter = 0;
function uid(): string {
  counter++;
  return `ext_${Date.now()}_${counter}`;
}

export function mapToDraft(extracted: ExtractedMenu): ZammpyDraft {
  const categories: ZammpyCategory[] = extracted.categories.map((cat) => ({
    id: uid(),
    name: cat.name,
    tipoContenido: "con_imagenes",
    isVisible: true,
  }));

  const products: ZammpyProduct[] = [];
  const grupos: ZammpyGrupo[] = extracted.grupos.map((g) => ({
    id: uid(),
    name: g.name,
    items: g.items,
    isActive: true,
  }));

  for (const cat of extracted.categories) {
    const catObj = categories.find((c) => c.name === cat.name);
    for (const p of cat.products) {
      products.push({
        id: uid(),
        categoryId: catObj?.id || "",
        name: p.name,
        description: p.description || "",
        price: p.price || 0,
        isVisible: true,
        tags: [],
        grupoIds: [],
      });
    }
  }

  return { categories, products, grupos };
}
