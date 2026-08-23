import "server-only";

import { getApprovedAdminClient } from "@/lib/admin-session";
import type { AdminProduct, AdminShopFolder } from "@/types/jualan-admin";

export async function getAdminShopData(): Promise<{
  folders: AdminShopFolder[];
  products: AdminProduct[];
  error: string;
}> {
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { folders: [], products: [], error: "Admin session expired." };

  const [folderResult, productResult] = await Promise.all([
    supabase
      .from("folders")
      .select("id,slug,name,description,accent,status,sort_order")
      .eq("section", "jualan")
      .order("sort_order")
      .order("created_at"),
    supabase
      .from("products")
      .select("id,folder_id,slug,name,description,image_url,image_public_id,selling_price,show_price,current_stock,labels,is_active,sort_order")
      .order("sort_order")
      .order("created_at", { ascending: false }),
  ]);

  if (folderResult.error || productResult.error) {
    return { folders: [], products: [], error: "Shop data could not be loaded." };
  }

  const productRows = productResult.data ?? [];
  const productIds = productRows.map((product) => String(product.id));
  let privateRows: Array<{
    product_id: string;
    cost_price: number | string | null;
    sku: string | null;
    private_notes: string;
  }> = [];

  if (productIds.length) {
    const privateResult = await supabase
      .from("product_private")
      .select("product_id,cost_price,sku,private_notes")
      .in("product_id", productIds);
    if (privateResult.error) {
      return { folders: [], products: [], error: "Private product data could not be loaded." };
    }
    privateRows = privateResult.data ?? [];
  }

  const privateByProduct = new Map(privateRows.map((row) => [row.product_id, row]));
  const countByFolder = new Map<string, number>();
  for (const product of productRows) {
    const folderId = String(product.folder_id);
    countByFolder.set(folderId, (countByFolder.get(folderId) ?? 0) + 1);
  }

  return {
    error: "",
    folders: (folderResult.data ?? []).map((folder) => ({
      id: String(folder.id),
      slug: String(folder.slug),
      name: String(folder.name),
      description: String(folder.description ?? ""),
      accent: String(folder.accent ?? "blue"),
      status: folder.status as AdminShopFolder["status"],
      sortOrder: Number(folder.sort_order ?? 0),
      productCount: countByFolder.get(String(folder.id)) ?? 0,
    })),
    products: productRows.map((product) => {
      const privateRow = privateByProduct.get(String(product.id));
      return {
        id: String(product.id),
        folderId: String(product.folder_id),
        slug: String(product.slug),
        name: String(product.name),
        description: String(product.description ?? ""),
        imageUrl: String(product.image_url ?? ""),
        imagePublicId: String(product.image_public_id ?? ""),
        sellingPrice: product.selling_price == null ? "" : String(product.selling_price),
        showPrice: Boolean(product.show_price),
        currentStock: Number(product.current_stock ?? 0),
        labels: Array.isArray(product.labels) ? product.labels.map(String) : [],
        isActive: Boolean(product.is_active),
        sortOrder: Number(product.sort_order ?? 0),
        costPrice: privateRow?.cost_price == null ? "" : String(privateRow.cost_price),
        sku: privateRow?.sku ?? "",
        privateNotes: privateRow?.private_notes ?? "",
      };
    }),
  };
}
