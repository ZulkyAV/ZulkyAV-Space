export const noteFolderStatuses = [
  "published",
  "maintenance",
  "draft",
  "archived",
] as const;

export const noteFolderAccents = ["blue", "amber", "green", "slate"] as const;

export type NoteFolderStatus = (typeof noteFolderStatuses)[number];
export type NoteFolderAccent = (typeof noteFolderAccents)[number];

export type AdminNoteFolder = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: NoteFolderAccent;
  status: NoteFolderStatus;
  sortOrder: number;
  noteCount: number;
};
