import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getApprovedAdminClient } from "@/lib/admin-session";
import type { PublicStatisticsSettings, StatisticsPeriod, StatisticsSnapshot } from "@/types/statistics";

const periods: StatisticsPeriod[] = ["Today", "7 Days", "30 Days", "Current Month"];
const defaultSettings: PublicStatisticsSettings = { isPublic: true, showBestSeller: true, showRecommended: true, maskExactValues: true };

function startOf(period: StatisticsPeriod, now: Date) {
  const date = new Date(now);
  if (period === "Today") date.setHours(0, 0, 0, 0);
  if (period === "7 Days") {
    date.setDate(date.getDate() - 6);
    date.setHours(0, 0, 0, 0);
  }
  if (period === "30 Days") {
    date.setDate(date.getDate() - 29);
    date.setHours(0, 0, 0, 0);
  }
  if (period === "Current Month") {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function stockLabel(value: number): StatisticsSnapshot["recommendedStock"] {
  return value <= 0 ? "Sold out" : value <= 5 ? "Low stock" : "In stock";
}

async function buildStatistics(useAdminSession: boolean): Promise<{
  snapshots: Record<StatisticsPeriod, StatisticsSnapshot>;
  settings: PublicStatisticsSettings;
  error: string;
}> {
  const empty = Object.fromEntries(periods.map((period) => [period, { period, bars: Array(12).fill(0), saleCount: 0, revenue: 0, itemCount: 0, bestSeller: "No sales yet", bestSellerQuantity: 0, recommended: "No recommendation yet", recommendedStock: "Sold out" as const }])) as Record<StatisticsPeriod, StatisticsSnapshot>;
  let supabase;
  try {
    supabase = useAdminSession ? await getApprovedAdminClient() : createAdminClient();
  } catch {
    return {
      snapshots: empty,
      settings: defaultSettings,
      error: "Statistics are unavailable until the environment is configured.",
    };
  }
  if (!supabase) return { snapshots: empty, settings: defaultSettings, error: "Admin session expired." };
  const now = new Date();
  const earliest = startOf("30 Days", now);
  const [saleResult, productResult, settingsResult] = await Promise.all([
    supabase.from("sales").select("id,sold_at,total_amount").gte("sold_at", earliest.toISOString()).order("sold_at"),
    supabase.from("products").select("id,name,current_stock,labels,is_active").eq("is_active", true).order("sort_order"),
    supabase.from("public_statistics_settings").select("is_public,show_best_seller,show_recommended,mask_exact_values").eq("id", 1).maybeSingle(),
  ]);
  if (saleResult.error || productResult.error || settingsResult.error) return { snapshots: empty, settings: defaultSettings, error: "Statistics could not be loaded." };
  const sales = saleResult.data ?? [];
  const saleIds = sales.map((sale) => String(sale.id));
  let items: Array<{ sale_id: string; product_id: string | null; product_name_snapshot: string; quantity: number }> = [];
  if (saleIds.length) {
    const itemResult = await supabase.from("sale_items").select("sale_id,product_id,product_name_snapshot,quantity").in("sale_id", saleIds);
    if (itemResult.error) return { snapshots: empty, settings: defaultSettings, error: "Statistics items could not be loaded." };
    items = (itemResult.data ?? []).map((item) => ({ sale_id: String(item.sale_id), product_id: item.product_id ? String(item.product_id) : null, product_name_snapshot: String(item.product_name_snapshot), quantity: Number(item.quantity) }));
  }
  const products = productResult.data ?? [];
  const recommendedRow = products.find((product) => Array.isArray(product.labels) && product.labels.some((label) => String(label).toLowerCase() === "recommended")) ?? products[0];
  for (const period of periods) {
    const start = startOf(period, now);
    const periodSales = sales.filter((sale) => new Date(String(sale.sold_at)) >= start);
    const ids = new Set(periodSales.map((sale) => String(sale.id)));
    const periodItems = items.filter((item) => ids.has(item.sale_id));
    const quantities = new Map<string, number>();
    for (const item of periodItems) quantities.set(item.product_name_snapshot, (quantities.get(item.product_name_snapshot) ?? 0) + item.quantity);
    const best = [...quantities.entries()].sort((a, b) => b[1] - a[1])[0];
    const bars = Array(12).fill(0) as number[];
    const span = Math.max(1, now.getTime() - start.getTime());
    for (const sale of periodSales) {
      const position = Math.min(11, Math.max(0, Math.floor(((new Date(String(sale.sold_at)).getTime() - start.getTime()) / span) * 12)));
      bars[position] += Number(sale.total_amount ?? 0);
    }
    const max = Math.max(...bars, 1);
    empty[period] = {
      period, bars: bars.map((value) => value === 0 ? 0 : Math.max(8, Math.round((value / max) * 100))),
      saleCount: periodSales.length, revenue: periodSales.reduce((sum, sale) => sum + Number(sale.total_amount ?? 0), 0),
      itemCount: periodItems.reduce((sum, item) => sum + item.quantity, 0), bestSeller: best?.[0] ?? "No sales yet",
      bestSellerQuantity: best?.[1] ?? 0, recommended: recommendedRow ? String(recommendedRow.name) : "No recommendation yet",
      recommendedStock: stockLabel(Number(recommendedRow?.current_stock ?? 0)),
    };
  }
  const settingRow = settingsResult.data;
  return { snapshots: empty, error: "", settings: settingRow ? {
    isPublic: Boolean(settingRow.is_public), showBestSeller: Boolean(settingRow.show_best_seller),
    showRecommended: Boolean(settingRow.show_recommended), maskExactValues: Boolean(settingRow.mask_exact_values),
  } : defaultSettings };
}

export function getAdminStatistics() { return buildStatistics(true); }
export function getPublicStatistics() { return buildStatistics(false); }
