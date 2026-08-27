export type FolderStatus = "published" | "maintenance" | "draft" | "archived";

export interface Folder {
  slug: string;
  name: string;
  description: string;
  status: FolderStatus;
  count: number;
  accent: string;
  coverImage?: string;
  coverLabel?: string;
}

export interface Note {
  slug: string;
  folderSlug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string[];
}

export interface Project {
  slug: string;
  folderSlug: string;
  title: string;
  description: string;
  status: string;
  image: string;
  galleryImages: string[];
  downloadUrl?: string;
  actionLabel?: string;
  components: string[];
  updates: string[];
}

export interface Product {
  slug: string;
  folderSlug: string;
  name: string;
  description: string;
  priceLabel: string;
  stock: "In stock" | "Low stock" | "Sold out";
  image: string;
  labels: string[];
}
