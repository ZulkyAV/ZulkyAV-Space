"use client";

import { useActionState } from "react";
import { saveStatisticsSettings, type SettingsState } from "@/app/admin/settings/actions";
import type { PublicStatisticsSettings } from "@/types/statistics";

const initialState: SettingsState = { status: "idle", message: "" };

export function SettingsForm({ settings }: { settings: PublicStatisticsSettings }) {
  const [state, action, pending] = useActionState(saveStatisticsSettings, initialState);
  const options = [
    { name: "isPublic", label: "Show public Statistics page", description: "If disabled, visitors only see that statistics are private.", checked: settings.isPublic },
    { name: "showBestSeller", label: "Show Best Seller", description: "Display the leading product name publicly.", checked: settings.showBestSeller },
    { name: "showRecommended", label: "Show Recommended", description: "Display the product marked Recommended.", checked: settings.showRecommended },
    { name: "maskExactValues", label: "Mask exact totals", description: "Keep revenue, sale count, and quantities private.", checked: settings.maskExactValues },
  ];
  return <form action={action} className="rounded-2xl border border-white/10 bg-[#14141A] p-6 shadow-sm">
    <h2 className="text-xl font-bold">Public statistics</h2><p className="mt-2 text-sm text-neutral-400">These controls change what visitors can see. Private admin statistics always stay exact.</p>
    <div className="mt-6 divide-y divide-white/10">{options.map((option) => <label key={option.name} className="flex cursor-pointer items-start justify-between gap-5 py-5"><span><span className="block text-sm font-semibold text-neutral-200">{option.label}</span><span className="mt-1 block text-xs leading-5 text-neutral-400">{option.description}</span></span><input name={option.name} type="checkbox" defaultChecked={option.checked} className="mt-1 h-5 w-5" /></label>)}</div>
    {state.message ? <p className={`mt-5 rounded-xl p-4 text-sm ${state.status === "success" ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"}`}>{state.message}</p> : null}
    <button disabled={pending} className="mt-6 rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving..." : "Save settings"}</button>
  </form>;
}

