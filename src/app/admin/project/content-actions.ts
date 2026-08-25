"use server";

import { revalidatePath } from "next/cache";
import {
  getApprovedAdminClient,
  isSlug,
  isUuid,
  readFormText,
} from "@/lib/admin-session";
import { destroyManagedImage } from "@/lib/cloudinary";

export type ProjectContentState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ParsedProject = {
  folderId: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  downloadUrl: string;
  galleryImages: Array<{
    imageUrl: string;
    imagePublicId: string;
  }>;
  projectType: string;
  stage: string;
  isPublished: boolean;
  sortOrder: number;
  components: Array<{
    name: string;
    kind: string;
    quantity: number | null;
    unit: string;
    privateNotes: string;
  }>;
  updates: Array<{
    updateDate: string;
    isPublished: boolean;
    title: string;
    content: string;
  }>;
};

function parseLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseProject(formData: FormData): ParsedProject | ProjectContentState {
  const folderId = readFormText(formData, "folderId", 36);
  const title = readFormText(formData, "title", 160);
  const slug = readFormText(formData, "slug", 140).toLowerCase();
  const description = readFormText(formData, "description", 12000);
  const imageUrl = readFormText(formData, "imageUrl", 2000);
  const imagePublicId = readFormText(formData, "imagePublicId", 500);
  const downloadUrl = readFormText(formData, "downloadUrl", 2000);
  const projectType = readFormText(formData, "projectType", 20);
  const stage = readFormText(formData, "stage", 20);
  const isPublished = readFormText(formData, "publication", 20) === "published";
  const sortOrder = Number(readFormText(formData, "sortOrder", 6));
  const galleryImages = Array.from({ length: 4 }, (_, index) => ({
    imageUrl: readFormText(formData, `galleryImageUrl${index}`, 2000),
    imagePublicId: readFormText(formData, `galleryImagePublicId${index}`, 500),
  })).filter((image) => image.imageUrl);

  if (!isUuid(folderId) || !title || !slug || !isSlug(slug)) {
    return { status: "error", message: "Folder, title, and a valid slug are required." };
  }
  if (!["food", "drink", "iot", "web", "other"].includes(projectType)) {
    return { status: "error", message: "Project type is invalid." };
  }
  if (!["idea", "experiment", "active", "paused", "completed"].includes(stage)) {
    return { status: "error", message: "Project stage is invalid." };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return { status: "error", message: "Sort order must be 0–9999." };
  }
  if (downloadUrl) {
    try {
      const parsedUrl = new URL(downloadUrl);
      if (parsedUrl.protocol !== "https:") throw new Error("Invalid protocol");
    } catch {
      return { status: "error", message: "Download URL must be a valid HTTPS link." };
    }
  }
  for (const image of galleryImages) {
    try {
      const parsedUrl = new URL(image.imageUrl);
      if (parsedUrl.protocol !== "https:") throw new Error("Invalid protocol");
    } catch {
      return { status: "error", message: "Every gallery image must use a valid HTTPS URL." };
    }
  }

  const components = parseLines(readFormText(formData, "components", 30000)).map(
    (line) => {
      const [name = "", kind = "component", quantity = "", unit = "", ...notes] =
        line.split("|").map((part) => part.trim());
      const parsedQuantity = quantity === "" ? null : Number(quantity);
      return {
        name: name.slice(0, 160),
        kind: ["ingredient", "component", "material", "tool", "other"].includes(kind)
          ? kind
          : "other",
        quantity:
          parsedQuantity !== null && Number.isFinite(parsedQuantity) && parsedQuantity >= 0
            ? parsedQuantity
            : null,
        unit: unit.slice(0, 50),
        privateNotes: notes.join(" | ").slice(0, 1000),
      };
    },
  ).filter((component) => component.name);

  const updates = parseLines(readFormText(formData, "updates", 30000)).map(
    (line) => {
      const [date = "", visibility = "public", titleValue = "", ...content] =
        line.split("|").map((part) => part.trim());
      return {
        updateDate: /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? date
          : new Date().toISOString().slice(0, 10),
        isPublished: visibility !== "private",
        title: titleValue.slice(0, 160),
        content: content.join(" | ").slice(0, 3000),
      };
    },
  ).filter((update) => update.title);

  return {
    folderId,
    title,
    slug,
    description,
    imageUrl,
    imagePublicId,
    downloadUrl,
    galleryImages,
    projectType,
    stage,
    isPublished,
    sortOrder,
    components,
    updates,
  };
}

async function validateFolder(
  supabase: NonNullable<Awaited<ReturnType<typeof getApprovedAdminClient>>>,
  folderId: string,
  publishing: boolean,
) {
  const { data, error } = await supabase
    .from("folders")
    .select("id,status")
    .eq("id", folderId)
    .eq("section", "project")
    .maybeSingle();
  if (error || !data) return "Project folder not found.";
  if (publishing && data.status !== "published") {
    return "Publish the folder before publishing this project.";
  }
  return "";
}

async function syncDetails(
  supabase: NonNullable<Awaited<ReturnType<typeof getApprovedAdminClient>>>,
  projectId: string,
  parsed: ParsedProject,
) {
  const currentGalleryResult = await supabase
    .from("project_images")
    .select("image_public_id")
    .eq("project_id", projectId);
  if (currentGalleryResult.error) return "Existing gallery could not be loaded.";

  const deleteGallery = await supabase
    .from("project_images")
    .delete()
    .eq("project_id", projectId);
  const deleteComponents = await supabase
    .from("project_components")
    .delete()
    .eq("project_id", projectId);
  const deleteUpdates = await supabase
    .from("project_updates")
    .delete()
    .eq("project_id", projectId);
  if (deleteGallery.error || deleteComponents.error || deleteUpdates.error) {
    return "Existing details could not be replaced.";
  }

  if (parsed.galleryImages.length) {
    const galleryResult = await supabase.from("project_images").insert(
      parsed.galleryImages.map((image, index) => ({
        project_id: projectId,
        image_url: image.imageUrl,
        image_public_id: image.imagePublicId || null,
        alt_text: `${parsed.title} gallery photo ${index + 1}`,
        sort_order: index,
      })),
    );
    if (galleryResult.error) return "Gallery photos could not be saved.";
  }

  const nextPublicIds = new Set(
    parsed.galleryImages.map((image) => image.imagePublicId).filter(Boolean),
  );
  await Promise.all(
    (currentGalleryResult.data ?? []).map((image) =>
      nextPublicIds.has(String(image.image_public_id ?? ""))
        ? Promise.resolve()
        : destroyManagedImage(image.image_public_id, "project"),
    ),
  );

  if (parsed.components.length) {
    const { data, error } = await supabase
      .from("project_components")
      .insert(
        parsed.components.map((component, index) => ({
          project_id: projectId,
          name: component.name,
          kind: component.kind,
          sort_order: index,
        })),
      )
      .select("id,sort_order");
    if (error || !data) return "Components could not be saved.";

    const privateRows = data.flatMap((row) => {
      const component = parsed.components[row.sort_order];
      if (!component) return [];
      return [{
        component_id: row.id,
        quantity: component.quantity,
        unit: component.unit,
        private_notes: component.privateNotes,
      }];
    });
    if (privateRows.length) {
      const privateResult = await supabase
        .from("project_component_private")
        .insert(privateRows);
      if (privateResult.error) return "Private quantities could not be saved.";
    }
  }

  if (parsed.updates.length) {
    const updateResult = await supabase.from("project_updates").insert(
      parsed.updates.map((update) => ({
        project_id: projectId,
        title: update.title,
        content: update.content,
        update_date: update.updateDate,
        is_published: update.isPublished,
      })),
    );
    if (updateResult.error) return "Project updates could not be saved.";
  }
  return "";
}

function refresh() {
  revalidatePath("/admin/project");
  revalidatePath("/project");
}

export async function createProjectContent(
  _state: ProjectContentState,
  formData: FormData,
): Promise<ProjectContentState> {
  const parsed = parseProject(formData);
  if ("message" in parsed) return parsed;
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const folderError = await validateFolder(supabase, parsed.folderId, parsed.isPublished);
  if (folderError) return { status: "error", message: folderError };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      folder_id: parsed.folderId,
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description,
      image_url: parsed.imageUrl || null,
      image_public_id: parsed.imagePublicId || null,
      download_url: parsed.downloadUrl || null,
      project_type: parsed.projectType,
      stage: parsed.stage,
      is_published: parsed.isPublished,
      sort_order: parsed.sortOrder,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.code === "23505" ? "That project slug already exists in this folder." : "Project could not be created." };
  }
  const detailsError = await syncDetails(supabase, data.id, parsed);
  refresh();
  return detailsError
    ? { status: "error", message: `Project created, but ${detailsError}` }
    : { status: "success", message: "Project created." };
}

export async function updateProjectContent(
  _state: ProjectContentState,
  formData: FormData,
): Promise<ProjectContentState> {
  const id = readFormText(formData, "id", 36);
  const parsed = parseProject(formData);
  if (!isUuid(id)) return { status: "error", message: "Invalid project ID." };
  if ("message" in parsed) return parsed;
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const folderError = await validateFolder(supabase, parsed.folderId, parsed.isPublished);
  if (folderError) return { status: "error", message: folderError };

  const { data: currentProject, error: currentProjectError } = await supabase
    .from("projects")
    .select("id,image_public_id")
    .eq("id", id)
    .maybeSingle();
  if (currentProjectError || !currentProject) {
    return { status: "error", message: "Project could not be found." };
  }

  const { data: savedProject, error } = await supabase
    .from("projects")
    .update({
      folder_id: parsed.folderId,
      title: parsed.title,
      slug: parsed.slug,
      description: parsed.description,
      image_url: parsed.imageUrl || null,
      image_public_id: parsed.imagePublicId || null,
      download_url: parsed.downloadUrl || null,
      project_type: parsed.projectType,
      stage: parsed.stage,
      is_published: parsed.isPublished,
      sort_order: parsed.sortOrder,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !savedProject) return { status: "error", message: "Project could not be saved." };
  const detailsError = await syncDetails(supabase, id, parsed);
  if (currentProject.image_public_id !== parsed.imagePublicId) {
    await destroyManagedImage(currentProject.image_public_id, "project");
  }
  refresh();
  return detailsError
    ? { status: "error", message: detailsError }
    : { status: "success", message: "Project saved." };
}

export async function archiveProjectContent(
  _state: ProjectContentState,
  formData: FormData,
): Promise<ProjectContentState> {
  const id = readFormText(formData, "id", 36);
  if (!isUuid(id)) return { status: "error", message: "Invalid project ID." };
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { error } = await supabase
    .from("projects")
    .update({ is_published: false, stage: "paused" })
    .eq("id", id);
  if (error) return { status: "error", message: "Project could not be archived." };
  refresh();
  return { status: "success", message: "Project unpublished and paused." };
}
