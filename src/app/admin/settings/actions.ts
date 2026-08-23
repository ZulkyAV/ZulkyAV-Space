"use server";

import { revalidatePath } from "next/cache";
import { getApprovedAdminClient } from "@/lib/admin-session";

export type SettingsState = { status: "idle" | "success" | "error"; message: string };

export async function saveStatisticsSettings(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const supabase = await getApprovedAdminClient();
  if (!supabase) return { status: "error", message: "Admin session expired." };
  const { error } = await supabase.from("public_statistics_settings").upsert({
    id: 1,
    is_public: formData.get("isPublic") === "on",
    show_best_seller: formData.get("showBestSeller") === "on",
    show_recommended: formData.get("showRecommended") === "on",
    mask_exact_values: formData.get("maskExactValues") === "on",
  }, { onConflict: "id" });
  if (error) return { status: "error", message: "Settings could not be saved." };
  revalidatePath("/admin/settings"); revalidatePath("/statistics");
  return { status: "success", message: "Public statistics settings saved." };
}

