export interface ExtractedCategory {
  name: string;
  products: ExtractedProduct[];
}

export interface ExtractedProduct {
  name: string;
  description: string | null;
  price: number | null;
}

export interface ExtractedGrupo {
  name: string;
  items: string[];
}

export interface ExtractedMenu {
  categories: ExtractedCategory[];
  grupos: ExtractedGrupo[];
}

export interface ZammpyMenu {
  menId: number;
  menName: string;
  menSlug: string;
  menStatus: string;
  hasDraftChanges: boolean;
  thumbnailUrl?: string;
  [key: string]: unknown;
}

export interface ZammpyCategory {
  id: string;
  name: string;
  tipoContenido: string;
  isVisible: boolean;
}

export interface ZammpyProduct {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isVisible: boolean;
  tags: string[];
  grupoIds: string[];
}

export interface ZammpyGrupo {
  id: string;
  name: string;
  items: string[];
  isActive: boolean;
}

export interface ZammpyDraft {
  categories: ZammpyCategory[];
  products: ZammpyProduct[];
  grupos: ZammpyGrupo[];
}

export interface AuthResponse {
  token: string;
  [key: string]: unknown;
}
