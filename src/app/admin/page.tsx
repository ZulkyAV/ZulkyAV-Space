import { AdminShell } from "@/components/admin-shell";
import { getAdminOverview } from "@/lib/data/admin-overview";

export const dynamic = "force-dynamic";
const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function AdminPage() {
  const data = await getAdminOverview();
  const cards = [
    ["Folders", data.folders], ["Notes", data.notes], ["Projects", data.projects],
    ["Products", data.products], ["Total stock", data.stock], ["Sales today", data.todaySales],
  ] as const;
  return <AdminShell title="Overview" description="A live private summary of content, shop stock, and today's sales.">
    {data.error ? <p className="mb-6 rounded-xl bg-error-50 p-4 text-sm text-error-700">{data.error}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#14141A] p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-5 md:grid-cols-2"><section className="rounded-2xl border border-white/10 bg-[#14141A] p-6"><p className="text-xs uppercase tracking-wider text-neutral-500">Revenue today</p><p className="mt-3 text-3xl font-bold">{money.format(data.todayRevenue)}</p></section><section className="rounded-2xl border border-white/10 bg-[#14141A] p-6"><p className="text-xs uppercase tracking-wider text-neutral-500">Low / empty stock</p>{data.lowStock.length ? <ul className="mt-3 space-y-1 text-sm text-warning-700">{data.lowStock.map((name) => <li key={name}>• {name}</li>)}</ul> : <p className="mt-3 text-sm text-success-700">No low-stock products.</p>}</section></div>
  </AdminShell>;
}
