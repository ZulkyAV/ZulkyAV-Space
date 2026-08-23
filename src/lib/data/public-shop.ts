import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { Folder, Product } from "@/types/content";

function stockLabel(stock: number): Product["stock"] {
  if (stock <= 0) return "Sold out";
  if (stock <= 5) return "Low stock";
  return "In stock";
}

function priceLabel(value: number | string | null, showPrice: boolean) {
  if (!showPrice || value == null) return "Price hidden";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function mapProduct(row: Record<string, unknown>, folderSlug: string): Product {
  const currentStock = Number(row.current_stock ?? 0);
  return {
    slug: String(row.slug),
    folderSlug,
    name: String(row.name),
    description: String(row.description ?? ""),
    priceLabel: priceLabel(row.selling_price as number | string | null, Boolean(row.show_price)),
    stock: stockLabel(currentStock),
    image: String(row.image_url ?? ""),
    labels: Array.isArray(row.labels) ? row.labels.map(String) : [],
  };
}

function featuredScore(row: Record<string, unknown>) {
  const labels = Array.isArray(row.labels)
    ? row.labels.map((label) => String(label).toLowerCase())
    : [];
  if (labels.includes("best seller")) return 3;
  if (labels.includes("recommended")) return 2;
  return row.image_url ? 1 : 0;
}

export async function getPublicShopIndex(): Promise<{
  folders: Folder[];
  products: Product[];
  error: string;
}> {
  try {
    const supabase = createPublicClient();
    const [folderResult, productResult] = await Promise.all([
      supabase.from("folders").select("id,slug,name,description,accent,status,sort_order")
        .eq("section", "jualan").in("status", ["published", "maintenance"]).order("sort_order"),
      supabase.from("products").select("folder_id,slug,name,description,image_url,selling_price,show_price,current_stock,labels,sort_order")
        .eq("is_active", true).order("sort_order"),
    ]);
    if (folderResult.error || productResult.error) throw new Error("query");
    const folderRows = folderResult.data ?? [];
    const folderById = new Map(folderRows.map((folder) => [String(folder.id), folder]));
    const products = (productResult.data ?? []).flatMap((row) => {
      const folder = folderById.get(String(row.folder_id));
      return folder?.status === "published" ? [mapProduct(row, String(folder.slug))] : [];
    });
    const counts = new Map<string, number>();
    for (const product of products) counts.set(product.folderSlug, (counts.get(product.folderSlug) ?? 0) + 1);
    const featuredByFolder = new Map<string, Record<string, unknown>>();
    for (const row of productResult.data ?? []) {
      const folder = folderById.get(String(row.folder_id));
      if (folder?.status !== "published" || !row.image_url) continue;
      const current = featuredByFolder.get(String(row.folder_id));
      if (!current || featuredScore(row) > featuredScore(current)) {
        featuredByFolder.set(String(row.folder_id), row);
      }
    }
    return {
      error: "",
      folders: folderRows.map((folder) => {
        const featured = featuredByFolder.get(String(folder.id));
        return {
          slug: String(folder.slug), name: String(folder.name), description: String(folder.description ?? ""),
          accent: String(folder.accent ?? "blue"), status: folder.status as Folder["status"],
          count: counts.get(String(folder.slug)) ?? 0,
          coverImage: featured ? String(featured.image_url) : undefined,
          coverLabel: featured ? String(featured.name) : undefined,
        };
      }),
      products,
    };
  } catch {
    return { folders: [], products: [], error: "The shop could not be loaded right now." };
  }
}

export async function getPublicShopFolder(slug: string) {
  try {
    const supabase = createPublicClient();
    const { data: folder, error } = await supabase.from("folders")
      .select("id,slug,name,description,accent,status").eq("section", "jualan")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    if (error || !folder) return null;
    const { data, error: productError } = await supabase.from("products")
      .select("slug,name,description,image_url,selling_price,show_price,current_stock,labels,sort_order")
      .eq("folder_id", folder.id).eq("is_active", true).order("sort_order");
    if (productError) return null;
    const products = (data ?? []).map((row) => mapProduct(row, String(folder.slug)));
    return {
      folder: { slug: String(folder.slug), name: String(folder.name), description: String(folder.description ?? ""), accent: String(folder.accent ?? "blue"), status: "published" as const, count: products.length },
      products,
    };
  } catch { return null; }
}

export async function getPublicProduct(folderSlug: string, productSlug: string) {
  const result = await getPublicShopFolder(folderSlug);
  if (!result) return null;
  const product = result.products.find((entry) => entry.slug === productSlug);
  return product ? { folder: result.folder, product } : null;
}
