"use client";

import { useState } from "react";
import { Eyebrow, StatusBadge } from "@/components/ui";
import { PageShell } from "@/components/page-shell";

const periods = ["Today", "7 Days", "30 Days", "Current Month"] as const;
type Period = (typeof periods)[number];

type StatisticsSnapshot = {
  bars: number[];
  bestSeller: string;
  bestSellerStock: "In stock" | "Low stock" | "Sold out";
  recommended: string;
  interest: string;
};

const snapshots: Record<Period, StatisticsSnapshot> = {
  Today: { bars: [34, 48, 42, 64, 57, 76, 62, 82, 68, 56, 74, 63], bestSeller: "Brass page marker", bestSellerStock: "Low stock", recommended: "Field notebook set", interest: "Steady interest" },
  "7 Days": { bars: [42, 58, 46, 74, 62, 88, 69, 94, 78, 66, 86, 72], bestSeller: "Field notebook set", bestSellerStock: "In stock", recommended: "Atlas of Small Wins", interest: "High interest" },
  "30 Days": { bars: [58, 64, 72, 61, 78, 84, 69, 88, 92, 76, 86, 95], bestSeller: "Weekly reset kit", bestSellerStock: "In stock", recommended: "The Reading Room", interest: "Growing interest" },
  "Current Month": { bars: [48, 66, 55, 82, 74, 91, 78, 86, 70, 88, 80, 96], bestSeller: "Field notebook set", bestSellerStock: "In stock", recommended: "Atlas of Small Wins", interest: "High interest" },
};

export default function StatisticsPage() {
  const [period, setPeriod] = useState<Period>("7 Days");
  const snapshot = snapshots[period];

  return <PageShell eyebrow="A public pulse" title="The numbers, at a distance." description="A lightweight view of what is being read, explored, and quietly enjoyed. Exact figures stay private.">
    <div className="mb-8 flex flex-wrap gap-2">{periods.map((option) => <button key={option} type="button" aria-pressed={period === option} onClick={() => setPeriod(option)} className={`rounded-full px-4 py-2 text-sm font-semibold ${period === option ? "bg-neutral-900 text-white" : "border border-neutral-300 bg-white text-neutral-600 hover:border-primary-400 hover:text-primary-700"}`}>{option}</button>)}</div>
    <div className="grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Views over time · {period}</p><p className="mt-2 text-3xl font-bold text-neutral-950">•••••</p><p className="mt-1 text-sm text-neutral-500">Exact numbers are private</p></div><span className="rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700">+ improving</span></div><div className="mt-12 flex h-48 items-end gap-2 border-b border-neutral-200">{snapshot.bars.map((height, index) => <div key={`${period}-${index}`} className="group relative flex-1"><div style={{ height: `${height}%` }} className="rounded-t-md bg-primary-200 transition-colors group-hover:bg-primary-500" /></div>)}</div><div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-400"><span>Mon</span><span>Wed</span><span>Fri</span><span>Sun</span></div></div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"><Eyebrow>Signal</Eyebrow><p className="mt-8 text-5xl font-bold text-neutral-950">↑</p><p className="mt-3 text-sm leading-6 text-neutral-500">More people are finding their way into the archive during this period.</p><div className="mt-8 border-t border-neutral-200 pt-5"><p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">Top interest</p><p className="mt-2 font-semibold text-neutral-800">{snapshot.interest}</p></div></div>
    </div>
    <div className="mt-6 grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-neutral-200 bg-white p-6"><div className="flex justify-between"><h2 className="font-bold text-neutral-900">Best Seller</h2><StatusBadge status={snapshot.bestSellerStock} /></div><p className="mt-5 text-lg font-semibold text-neutral-800">{snapshot.bestSeller}</p><p className="mt-2 font-mono text-xs text-neutral-400">Sales: ••••• · Revenue: •••••</p></div><div className="rounded-2xl border border-neutral-200 bg-white p-6"><div className="flex justify-between"><h2 className="font-bold text-neutral-900">Recommended</h2><span className="text-primary-600">✦</span></div><p className="mt-5 text-lg font-semibold text-neutral-800">{snapshot.recommended}</p><p className="mt-2 font-mono text-xs text-neutral-400">Interest: {snapshot.interest.toLowerCase()} · Status: active</p></div></div>
  </PageShell>;
}
