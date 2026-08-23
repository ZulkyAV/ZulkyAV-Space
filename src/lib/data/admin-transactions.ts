import "server-only";

import { getApprovedAdminClient } from "@/lib/admin-session";
import type { RecentSale, TransactionProduct } from "@/types/transactions";

export async function getAdminTransactions(): Promise<{
  products: TransactionProduct[];
  sales: RecentSale[];
  error: string;
}> {
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { products: [], sales: [], error: "Admin session expired." };

  const [productResult, saleResult] = await Promise.all([
    supabase.from("products").select("id,name,selling_price,current_stock,is_active")
      .order("name"),
    supabase.from("sales").select("id,sold_at,total_amount,payment_method,notes")
      .order("sold_at", { ascending: false }).limit(50),
  ]);
  if (productResult.error || saleResult.error) {
    return { products: [], sales: [], error: "Transaction data could not be loaded." };
  }

  const productIds = (productResult.data ?? []).map((product) => String(product.id));
  let privateProducts: Array<{ product_id: string; sku: string | null }> = [];
  if (productIds.length) {
    const privateResult = await supabase.from("product_private").select("product_id,sku").in("product_id", productIds);
    if (!privateResult.error) privateProducts = privateResult.data ?? [];
  }
  const skuByProduct = new Map(privateProducts.map((row) => [row.product_id, row.sku ?? ""]));

  const saleRows = saleResult.data ?? [];
  const saleIds = saleRows.map((sale) => String(sale.id));
  let itemRows: Array<{ sale_id: string; product_name_snapshot: string; quantity: number; unit_price: number; subtotal: number }> = [];
  if (saleIds.length) {
    const itemResult = await supabase.from("sale_items")
      .select("sale_id,product_name_snapshot,quantity,unit_price,subtotal")
      .in("sale_id", saleIds).order("created_at");
    if (itemResult.error) return { products: [], sales: [], error: "Sale items could not be loaded." };
    itemRows = (itemResult.data ?? []).map((item) => ({
      sale_id: String(item.sale_id), product_name_snapshot: String(item.product_name_snapshot),
      quantity: Number(item.quantity), unit_price: Number(item.unit_price), subtotal: Number(item.subtotal),
    }));
  }

  return {
    error: "",
    products: (productResult.data ?? []).map((product) => ({
      id: String(product.id), name: String(product.name), sku: skuByProduct.get(String(product.id)) ?? "",
      sellingPrice: Number(product.selling_price ?? 0), currentStock: Number(product.current_stock ?? 0),
      isActive: Boolean(product.is_active),
    })),
    sales: saleRows.map((sale) => ({
      id: String(sale.id), soldAt: String(sale.sold_at), totalAmount: Number(sale.total_amount ?? 0),
      paymentMethod: String(sale.payment_method), notes: String(sale.notes ?? ""),
      items: itemRows.filter((item) => item.sale_id === String(sale.id)).map((item) => ({
        name: item.product_name_snapshot, quantity: item.quantity, unitPrice: item.unit_price, subtotal: item.subtotal,
      })),
    })),
  };
}
