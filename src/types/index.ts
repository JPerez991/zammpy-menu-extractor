export const VALID_ICONS = [
  "burger", "cup", "cake", "ice", "box", "pizza", "bag",
  "soup", "star", "heart", "bread", "croissant", "cookie",
  "sandwich", "beef", "fish", "salad", "leaf", "wine",
  "beer", "chef", "fork",
] as const;

export type ZammpyIcon = (typeof VALID_ICONS)[number];

export interface MenuCategory {
  name: string;
  icon: ZammpyIcon;
}

export interface MenuProduct {
  categoryName: string;
  name: string;
  description: string;
  price: number;
  components: string[];
  imageUrl: string;
}

export interface MenuData {
  categories: MenuCategory[];
  products: MenuProduct[];
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

export interface AuthResponse {
  token: string;
  [key: string]: unknown;
}
