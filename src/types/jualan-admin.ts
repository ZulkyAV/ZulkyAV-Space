export type ShopFolderStatus = "published" | "maintenance" | "draft" | "archived";

export type AdminShopFolder = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: string;
  status: ShopFolderStatus;
  sortOrder: number;
  productCount: number;
};

export type AdminProduct = {
  id: string;
  folderId: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  sellingPrice: string;
  showPrice: boolean;
  currentStock: number;
  labels: string[];
  isActive: boolean;
  sortOrder: number;
  costPrice: string;
  sku: string;
  privateNotes: string;
};

