"use server";

import { revalidatePath } from "next/cache";
import { getApprovedAdminClient, isUuid, readFormText } from "@/lib/admin-session";

export type TransactionState = { status: "idle" | "success" | "error"; message: string };
type RequestedItem = { productId: string; quantity: number };

export async function recordSale(
  _state: TransactionState,
  formData: FormData,
): Promise<TransactionState> {
  const paymentMethod = readFormText(formData, "paymentMethod", 20);
  const notes = readFormText(formData, "notes", 1000);
  const soldAtInput = readFormText(formData, "soldAt", 40);
  if (!["cash", "qris", "transfer", "ewallet", "other"].includes(paymentMethod)) {
    return { status: "error", message: "Choose a valid payment method." };
  }
  let rawItems: unknown;
  try { rawItems = JSON.parse(readFormText(formData, "itemsJson", 20000)); }
  catch { return { status: "error", message: "Sale items are invalid." }; }
  if (!Array.isArray(rawItems)) return { status: "error", message: "Add at least one product." };

  const combined = new Map<string, number>();
  for (const value of rawItems) {
    if (!value || typeof value !== "object") continue;
    const productId = String((value as Record<string, unknown>).productId ?? "");
    const quantity = Number((value as Record<string, unknown>).quantity ?? 0);
    if (isUuid(productId) && Number.isInteger(quantity) && quantity > 0 && quantity <= 9999) {
      combined.set(productId, (combined.get(productId) ?? 0) + quantity);
    }
  }
  const items: RequestedItem[] = [...combined].map(([productId, quantity]) => ({ productId, quantity }));
  if (!items.length) return { status: "error", message: "Add at least one valid product." };

  const soldAt = soldAtInput ? new Date(soldAtInput) : new Date();
  if (Number.isNaN(soldAt.getTime())) return { status: "error", message: "Sale date is invalid." };
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const ids = items.map((item) => item.productId);
  const { data: products, error: productError } = await supabase.from("products")
    .select("id,name,selling_price,current_stock").in("id", ids);
  if (productError || !products || products.length !== ids.length) {
    return { status: "error", message: "One or more products were not found." };
  }
  const productById = new Map(products.map((product) => [String(product.id), product]));
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || Number(product.current_stock) < item.quantity) {
      return { status: "error", message: `${String(product?.name ?? "Product")} does not have enough stock.` };
    }
  }
  const total = items.reduce((sum, item) => sum + Number(productById.get(item.productId)?.selling_price ?? 0) * item.quantity, 0);
  const { data: sale, error: saleError } = await supabase.from("sales").insert({
    sold_at: soldAt.toISOString(), total_amount: total, payment_method: paymentMethod, notes,
  }).select("id").single();
  if (saleError || !sale) return { status: "error", message: "Sale could not be created." };

  const itemResult = await supabase.from("sale_items").insert(items.map((item) => {
    const product = productById.get(item.productId)!;
    const unitPrice = Number(product.selling_price ?? 0);
    return { sale_id: sale.id, product_id: item.productId, product_name_snapshot: String(product.name), quantity: item.quantity, unit_price: unitPrice, subtotal: unitPrice * item.quantity };
  }));
  if (itemResult.error) {
    await supabase.from("sales").delete().eq("id", sale.id);
    return { status: "error", message: "Sale items could not be saved." };
  }

  const updated: Array<{ id: string; oldStock: number }> = [];
  for (const item of items) {
    const product = productById.get(item.productId)!;
    const oldStock = Number(product.current_stock);
    const { data, error } = await supabase.from("products").update({ current_stock: oldStock - item.quantity })
      .eq("id", item.productId).eq("current_stock", oldStock).select("id").maybeSingle();
    if (error || !data) {
      for (const previous of updated) await supabase.from("products").update({ current_stock: previous.oldStock }).eq("id", previous.id);
      await supabase.from("sales").delete().eq("id", sale.id);
      return { status: "error", message: "Stock changed during checkout. Try recording the sale again." };
    }
    updated.push({ id: item.productId, oldStock });
  }

  const movementResult = await supabase.from("stock_movements").insert(items.map((item) => ({
    product_id: item.productId, sale_id: sale.id, movement_type: "sale", quantity_delta: -item.quantity,
    notes: `Sale ${sale.id}`,
  })));
  revalidatePath("/admin/transactions"); revalidatePath("/admin/jualan");
  revalidatePath("/admin/statistics"); revalidatePath("/jualan"); revalidatePath("/statistics");
  return movementResult.error
    ? { status: "success", message: "Sale recorded and stock updated. Stock audit log needs checking." }
    : { status: "success", message: "Sale recorded and stock updated." };
}
