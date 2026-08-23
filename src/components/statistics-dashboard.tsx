"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui";
import type { PublicStatisticsSettings, StatisticsPeriod, StatisticsSnapshot } from "@/types/statistics";

const periods: StatisticsPeriod[] = ["Today", "7 Days", "30 Days", "Current Month"];
const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function StatisticsDashboard({ snapshots, settings, admin = false }: { snapshots: Record<StatisticsPeriod, StatisticsSnapshot>; settings: PublicStatisticsSettings; admin?: boolean }) {
  const [period, setPeriod] = useState<StatisticsPeriod>("7 Days");
  const snapshot = snapshots[period];
  const hideExact = !admin && settings.maskExactValues;
  return <div>
    <div className="mb-8 flex flex-wrap gap-2">{periods.map((option) => <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} className={`rounded-full px-4 py-2 text-sm font-semibold ${period === option ? "bg-primary-700 text-white" : "border border-white/15 bg-[#14141A] text-neutral-400"}`}>{option}</button>)}</div>
    <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
      <section className="rounded-2xl border border-white/10 bg-[#14141A] p-6 shadow-sm"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-neutral-500">Sales activity · {period}</p><p className="mt-2 text-3xl font-bold">{hideExact ? "•••••" : money.format(snapshot.revenue)}</p></div><div className="text-right text-sm text-neutral-400"><p>{hideExact ? "••" : snapshot.saleCount} sales</p><p>{hideExact ? "••" : snapshot.itemCount} items</p></div></div><div className="mt-10 flex h-48 items-end gap-2 border-b border-white/10">{snapshot.bars.map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-primary-300 transition hover:bg-primary-600" style={{ height: `${Math.max(2, height)}%` }} />)}</div><p className="mt-3 text-xs text-neutral-500">Relative activity for this period</p></section>
      <section className="rounded-2xl border border-white/10 bg-[#14141A] p-6 shadow-sm"><p className="text-xs uppercase tracking-wider text-neutral-500">Summary</p><p className="mt-8 text-5xl font-bold text-primary-300">{snapshot.saleCount > 0 ? "↑" : "–"}</p><p className="mt-4 text-sm leading-6 text-neutral-400">{snapshot.saleCount > 0 ? "Recorded sales are visible in this period." : "No recorded sales in this period yet."}</p></section>
    </div>
    <div className="mt-6 grid gap-5 md:grid-cols-2">
      {(admin || settings.showBestSeller) ? <section className="rounded-2xl border border-white/10 bg-[#14141A] p-6"><h2 className="font-bold">Best Seller</h2><p className="mt-5 text-lg font-semibold">{snapshot.bestSeller}</p><p className="mt-2 text-xs text-neutral-500">Units sold: {hideExact ? "••••" : snapshot.bestSellerQuantity}</p></section> : null}
      {(admin || settings.showRecommended) ? <section className="rounded-2xl border border-white/10 bg-[#14141A] p-6"><div className="flex justify-between gap-3"><h2 className="font-bold">Recommended</h2><StatusBadge status={snapshot.recommendedStock} /></div><p className="mt-5 text-lg font-semibold">{snapshot.recommended}</p></section> : null}
    </div>
  </div>;
}
