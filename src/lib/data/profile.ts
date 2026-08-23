import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { PortfolioProfile, SocialLink } from "@/types/profile";

type ProfileRow = {
  id: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  avatar_public_id: string | null;
  headline: string;
  intro: string;
  location: string;
  about: string;
  social_links: unknown;
};

const fallbackProfile: PortfolioProfile = {
  id: "",
  name: "ZulkyAV",
  bio: "",
  avatarUrl: null,
  avatarPublicId: null,
  headline: "",
  intro:
    "Tempat gw keep progress, nyimpen ide, dan dokumentasiin hal-hal yang lagi gw build pelan-pelan.",
  location: "",
  about: "",
  socials: [],
};

function readSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is SocialLink => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate.label === "string" &&
      typeof candidate.href === "string"
    );
  });
}

export async function getPortfolioProfile(): Promise<PortfolioProfile> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    return fallbackProfile;
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id,name,bio,avatar_url,avatar_public_id,headline,intro,location,about,social_links",
      )
      .limit(1)
      .maybeSingle<ProfileRow>();

    if (error || !data) {
      return fallbackProfile;
    }

    const socials = readSocialLinks(data.social_links);

    return {
      id: data.id,
      name: data.name || fallbackProfile.name,
      bio: data.bio || fallbackProfile.bio,
      avatarUrl: data.avatar_url,
      avatarPublicId: data.avatar_public_id,
      headline: data.headline || fallbackProfile.headline,
      intro: data.intro || fallbackProfile.intro,
      location: data.location || fallbackProfile.location,
      about: data.about || fallbackProfile.about,
      socials: socials.length > 0 ? socials : fallbackProfile.socials,
    };
  } catch {
    return fallbackProfile;
  }
}
