"use server";

import { revalidatePath } from "next/cache";
import { getCloudinary } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export type PortfolioFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

function readText(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function readHttpsUrl(formData: FormData, key: string, maxLength: number) {
  const value = readText(formData, key, maxLength);

  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
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
  const avatarUrl = readHttpsUrl(formData, "avatarUrl", 1000);
  const avatarPublicId = readText(formData, "avatarPublicId", 500);

  if (!name || !headline || !intro || !about) {
    return {
      status: "error",
      message: "Name, headline, intro, and about are required.",
    };
  }

  if (avatarUrl === null) {
    return {
      status: "error",
      message: "The avatar URL is invalid.",
    };
  }

  if (
    avatarPublicId &&
    (!avatarUrl ||
      !avatarPublicId.startsWith("zulkyav-space/avatars/") ||
      new URL(avatarUrl).hostname !== "res.cloudinary.com")
  ) {
    return {
      status: "error",
      message: "The uploaded avatar data is invalid.",
    };
  }

  const socialLinks = [
    { label: "GitHub", href: readHttpsUrl(formData, "githubUrl", 1000) },
    {
      label: "Instagram",
      href: readHttpsUrl(formData, "instagramUrl", 1000),
    },
    {
      label: "LinkedIn",
      href: readHttpsUrl(formData, "linkedinUrl", 1000),
    },
  ];

  if (socialLinks.some((social) => social.href === null)) {
    return {
      status: "error",
      message: "Social links must use valid HTTPS URLs.",
    };
  }

  const validSocialLinks = socialLinks.filter(
    (social): social is { label: string; href: string } =>
      typeof social.href === "string" && social.href.length > 0,
  );

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
    .select("id,avatar_public_id")
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
      avatar_public_id: avatarPublicId || null,
      social_links: validSocialLinks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentProfile.id);

  if (updateError) {
    return {
      status: "error",
      message: updateError.message,
    };
  }

  const previousAvatarPublicId = currentProfile.avatar_public_id;

  if (
    previousAvatarPublicId &&
    previousAvatarPublicId !== avatarPublicId &&
    previousAvatarPublicId.startsWith("zulkyav-space/avatars/")
  ) {
    try {
      const { cloudinary } = getCloudinary();
      await cloudinary.uploader.destroy(previousAvatarPublicId, {
        invalidate: true,
        resource_type: "image",
      });
    } catch {
      // The database update is already valid. A failed cleanup must not undo it.
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/portfolio");

  return {
    status: "success",
    message: "Portfolio profile saved.",
  };
}
