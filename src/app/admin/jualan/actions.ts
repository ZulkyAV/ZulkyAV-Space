"use server";

import { revalidatePath } from "next/cache";
import {
  getApprovedAdminClient,
  isSlug,
  isUuid,
  readFormText,
} from "@/lib/admin-session";
import { destroyManagedImage } from "@/lib/cloudinary";

export type ShopActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const accents = ["blue", "amber", "green", "slate"];
const statuses = ["published", "maintenance", "draft", "archived"];

function refreshShop() {
  revalidatePath("/admin/jualan");
  revalidatePath("/jualan");
}

function numberValue(value: string, allowEmpty = false) {
  if (allowEmpty && value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : NaN;
}

function mutationMessage(error: { code?: string }) {
  return error.code === "23505" ? "That slug is already used in this folder." : "The data could not be saved.";
}

export async function createShopFolder(
  _state: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  const name = readFormText(formData, "name", 100);
  const slug = readFormText(formData, "slug", 100).toLowerCase();
  const description = readFormText(formData, "description", 500);
  const accent = readFormText(formData, "accent", 20);
  const status = readFormText(formData, "status", 20);
  const sortOrder = Number(readFormText(formData, "sortOrder", 6));
  if (!name || !isSlug(slug) || !accents.includes(accent) || !statuses.includes(status)) {
    return { status: "error", message: "Complete the folder fields with a valid slug." };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return { status: "error", message: "Sort order must be 0–9999." };
  }
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { error } = await supabase.from("folders").insert({
    section: "jualan", name, slug, description, accent, status, sort_order: sortOrder,
  });
  if (error) return { status: "error", message: mutationMessage(error) };
  refreshShop();
  return { status: "success", message: "Shop folder created." };
}

export async function updateShopFolder(
  _state: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  const id = readFormText(formData, "id", 36);
  const name = readFormText(formData, "name", 100);
  const slug = readFormText(formData, "slug", 100).toLowerCase();
  const description = readFormText(formData, "description", 500);
  const accent = readFormText(formData, "accent", 20);
  const status = readFormText(formData, "status", 20);
  const sortOrder = Number(readFormText(formData, "sortOrder", 6));
  if (!isUuid(id) || !name || !isSlug(slug) || !accents.includes(accent) || !statuses.includes(status)) {
    return { status: "error", message: "Folder data is invalid." };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return { status: "error", message: "Sort order must be 0–9999." };
  }
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { data, error } = await supabase.from("folders").update({
    name, slug, description, accent, status, sort_order: sortOrder,
  }).eq("id", id).eq("section", "jualan").select("id").maybeSingle();
  if (error || !data) return { status: "error", message: error ? mutationMessage(error) : "Folder not found." };
  refreshShop();
  return { status: "success", message: "Shop folder saved." };
}

export async function archiveShopFolder(
  _state: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  const id = readFormText(formData, "id", 36);
  if (!isUuid(id)) return { status: "error", message: "Invalid folder." };
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { data, error } = await supabase.from("folders").update({ status: "archived" })
    .eq("id", id).eq("section", "jualan").select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "Folder could not be archived." };
  refreshShop();
  return { status: "success", message: "Shop folder archived." };
}

type ParsedProduct = {
  folderId: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  sellingPrice: number | null;
  showPrice: boolean;
  currentStock: number;
  labels: string[];
  isActive: boolean;
  sortOrder: number;
  costPrice: number | null;
  sku: string;
  privateNotes: string;
};

function parseProduct(formData: FormData): ParsedProduct | ShopActionState {
  const folderId = readFormText(formData, "folderId", 36);
  const name = readFormText(formData, "name", 160);
  const slug = readFormText(formData, "slug", 140).toLowerCase();
  const sellingPrice = numberValue(readFormText(formData, "sellingPrice", 30), true);
  const costPrice = numberValue(readFormText(formData, "costPrice", 30), true);
  const currentStock = Number(readFormText(formData, "currentStock", 12));
  const sortOrder = Number(readFormText(formData, "sortOrder", 6));
  if (!isUuid(folderId) || !name || !isSlug(slug)) {
    return { status: "error", message: "Folder, product name, and valid slug are required." };
  }
  if (Number.isNaN(sellingPrice) || Number.isNaN(costPrice)) {
    return { status: "error", message: "Prices must be empty or zero and above." };
  }
  if (!Number.isInteger(currentStock) || currentStock < 0 || !Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return { status: "error", message: "Stock and sort order must be valid whole numbers." };
  }
  const labels = readFormText(formData, "labels", 500).split(",")
    .map((label) => label.trim()).filter(Boolean).slice(0, 8).map((label) => label.slice(0, 40));
  return {
    folderId, name, slug,
    description: readFormText(formData, "description", 3000),
    imageUrl: readFormText(formData, "imageUrl", 2000),
    imagePublicId: readFormText(formData, "imagePublicId", 500),
    sellingPrice, showPrice: formData.get("showPrice") === "on", currentStock, labels,
    isActive: formData.get("isActive") === "on", sortOrder, costPrice,
    sku: readFormText(formData, "sku", 120),
    privateNotes: readFormText(formData, "privateNotes", 2000),
  };
}

async function savePrivateProduct(
  supabase: NonNullable<Awaited<ReturnType<typeof getApprovedAdminClient>>>,
  productId: string,
  parsed: ParsedProduct,
) {
  return supabase.from("product_private").upsert({
    product_id: productId,
    cost_price: parsed.costPrice,
    sku: parsed.sku || null,
    private_notes: parsed.privateNotes,
  }, { onConflict: "product_id" });
}

export async function createProduct(
  _state: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  const parsed = parseProduct(formData);
  if ("message" in parsed) return parsed;
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { data: folder } = await supabase.from("folders").select("id,status")
    .eq("id", parsed.folderId).eq("section", "jualan").maybeSingle();
  if (!folder) return { status: "error", message: "Shop folder not found." };
  if (parsed.isActive && folder.status !== "published") {
    return { status: "error", message: "Publish the folder before activating its product." };
  }
  const { data, error } = await supabase.from("products").insert({
    folder_id: parsed.folderId, slug: parsed.slug, name: parsed.name,
    description: parsed.description, image_url: parsed.imageUrl || null,
    image_public_id: parsed.imagePublicId || null, selling_price: parsed.sellingPrice,
    show_price: parsed.showPrice, current_stock: parsed.currentStock, labels: parsed.labels,
    is_active: parsed.isActive, sort_order: parsed.sortOrder,
  }).select("id").single();
  if (error || !data) return { status: "error", message: error ? mutationMessage(error) : "Product could not be created." };
  const privateResult = await savePrivateProduct(supabase, data.id, parsed);
  if (privateResult.error) return { status: "error", message: "Product created, but private fields could not be saved." };
  if (parsed.currentStock > 0) {
    await supabase.from("stock_movements").insert({
      product_id: data.id, movement_type: "initial", quantity_delta: parsed.currentStock,
      notes: "Initial stock from product creation",
    });
  }
  refreshShop();
  return { status: "success", message: "Product created." };
}

export async function updateProduct(
  _state: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  const id = readFormText(formData, "id", 36);
  const parsed = parseProduct(formData);
  if (!isUuid(id)) return { status: "error", message: "Invalid product ID." };
  if ("message" in parsed) return parsed;
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const [{ data: oldProduct }, { data: folder }] = await Promise.all([
    supabase.from("products").select("current_stock,image_public_id").eq("id", id).maybeSingle(),
    supabase.from("folders").select("status").eq("id", parsed.folderId).eq("section", "jualan").maybeSingle(),
  ]);
  if (!oldProduct || !folder) return { status: "error", message: "Product or folder not found." };
  if (parsed.isActive && folder.status !== "published") {
    return { status: "error", message: "Publish the folder before activating its product." };
  }
  const { data, error } = await supabase.from("products").update({
    folder_id: parsed.folderId, slug: parsed.slug, name: parsed.name,
    description: parsed.description, image_url: parsed.imageUrl || null,
    image_public_id: parsed.imagePublicId || null, selling_price: parsed.sellingPrice,
    show_price: parsed.showPrice, current_stock: parsed.currentStock, labels: parsed.labels,
    is_active: parsed.isActive, sort_order: parsed.sortOrder,
  }).eq("id", id).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: error ? mutationMessage(error) : "Product not found." };
  const privateResult = await savePrivateProduct(supabase, id, parsed);
  if (privateResult.error) return { status: "error", message: "Public product saved, but private fields failed." };
  if (oldProduct.image_public_id !== parsed.imagePublicId) {
    await destroyManagedImage(oldProduct.image_public_id, "product");
  }
  const difference = parsed.currentStock - Number(oldProduct.current_stock ?? 0);
  if (difference !== 0) {
    await supabase.from("stock_movements").insert({
      product_id: id, movement_type: difference > 0 ? "restock" : "adjustment",
      quantity_delta: difference, notes: "Manual stock edit from product manager",
    });
  }
  refreshShop();
  return { status: "success", message: "Product saved." };
}

export async function deactivateProduct(
  _state: ShopActionState,
  formData: FormData,
): Promise<ShopActionState> {
  const id = readFormText(formData, "id", 36);
  if (!isUuid(id)) return { status: "error", message: "Invalid product." };
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { data, error } = await supabase.from("products").update({ is_active: false })
    .eq("id", id).select("id").maybeSingle();
  if (error || !data) return { status: "error", message: "Product could not be deactivated." };
  refreshShop();
  return { status: "success", message: "Product hidden from public shop." };
}
