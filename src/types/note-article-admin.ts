export type AdminNoteArticle = {
  id: string;
  folderId: string | null;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  readTime: string;
  published: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};
