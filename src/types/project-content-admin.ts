export type AdminProjectContent = {
  id: string;
  folderId: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  projectType: "food" | "drink" | "iot" | "web" | "other";
  stage: "idea" | "experiment" | "active" | "paused" | "completed";
  isPublished: boolean;
  sortOrder: number;
  componentsText: string;
  updatesText: string;
};

export type AdminProjectFolderOption = {
  id: string;
  name: string;
  status: string;
};
