import "server-only";

import { getApprovedAdminClient } from "@/lib/admin-session";

export async function getAdminOverview() {
  const supabase = await getApprovedAdminClient();
  const empty = { folders: 0, notes: 0, projects: 0, products: 0, stock: 0, todaySales: 0, todayRevenue: 0, lowStock: [] as string[], error: "" };
  if (!supabase) return { ...empty, error: "Admin session expired." };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [folderResult, noteResult, projectResult, productResult, saleResult] = await Promise.all([
    supabase.from("folders").select("id", { count: "exact", head: true }).neq("status", "archived"),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("products").select("name,current_stock,is_active"),
    supabase.from("sales").select("total_amount").gte("sold_at", today.toISOString()),
  ]);
  if (folderResult.error || noteResult.error || projectResult.error || productResult.error || saleResult.error) return { ...empty, error: "Overview could not be loaded." };
  const products = productResult.data ?? [];
  const sales = saleResult.data ?? [];
  return {
    folders: folderResult.count ?? 0, notes: noteResult.count ?? 0, projects: projectResult.count ?? 0,
    products: products.length, stock: products.reduce((sum, product) => sum + Number(product.current_stock ?? 0), 0),
    todaySales: sales.length, todayRevenue: sales.reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0),
    lowStock: products.filter((product) => product.is_active && Number(product.current_stock) <= 5).map((product) => String(product.name)),
    error: "",
  };
}
