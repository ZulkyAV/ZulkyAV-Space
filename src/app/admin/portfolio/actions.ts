"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PortfolioFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readText(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

export async function updatePortfolio(
  _previousState: PortfolioFormState,
  formData: FormData,
): Promise<PortfolioFormState> {
  const name = readText(formData, "name", 100);
  const bio = readText(formData, "bio", 500);
  const headline = readText(formData, "headline", 180);
  const intro = readText(formData, "intro", 600);
  const location = readText(formData, "location", 120);
  const about = readText(formData, "about", 1200);
  const avatarUrl = readText(formData, "avatarUrl", 1000);

  if (!name || !headline || !intro || !about) {
    return {
      status: "error",
      message: "Name, headline, intro, and about are required.",
    };
  }

  const socialLinks = [
    { label: "GitHub", href: readText(formData, "githubUrl", 1000) },
    { label: "Instagram", href: readText(formData, "instagramUrl", 1000) },
    { label: "LinkedIn", href: readText(formData, "linkedinUrl", 1000) },
  ].filter((social) => social.href.length > 0);

  const supabase = await createClient();
  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_approved_admin",
  );

  if (adminError || isAdmin !== true) {
    return {
      status: "error",
      message: "Your verified admin session is no longer valid.",
    };
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (profileError || !currentProfile) {
    return {
      status: "error",
      message: "The profile row could not be found.",
    };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      name,
      bio,
      headline,
      intro,
      location,
      about,
      avatar_url: avatarUrl || null,
      social_links: socialLinks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentProfile.id);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message,
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/portfolio");

  return {
    status: "success",
    message: "Portfolio profile saved.",
  };
}
