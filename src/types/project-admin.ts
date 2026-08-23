export const projectFolderStatuses = [
  "published",
  "maintenance",
  "draft",
  "archived",
] as const;

export const projectFolderAccents = ["blue", "amber", "green", "slate"] as const;

export type ProjectFolderStatus = (typeof projectFolderStatuses)[number];
export type ProjectFolderAccent = (typeof projectFolderAccents)[number];

export type AdminProjectFolder = {
  id: string;
  slug: string;
  name: string;
  description: string;
  accent: ProjectFolderAccent;
  status: ProjectFolderStatus;
  sortOrder: number;
  projectCount: number;
};
