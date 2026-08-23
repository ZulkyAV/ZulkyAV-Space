import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { profile as mockProfile } from "@/data/mock-data";
import type { PortfolioProfile, SocialLink } from "@/types/profile";

type ProfileRow = {
  id: string;
  name: string;
  bio: string;
  avatar_url: string | null;
  headline: string;
  intro: string;
  location: string;
  about: string;
  social_links: unknown;
};

const fallbackProfile: PortfolioProfile = {
  id: "",
  name: mockProfile.name,
  bio: mockProfile.about,
  avatarUrl: null,
  headline: "Building a quieter, more useful way to notice progress.",
  intro: mockProfile.intro,
  location: "Open to thoughtful collaborations",
  about: mockProfile.about,
  socials: mockProfile.socials.filter(
    (social) =>
      social.href.startsWith("https://") || social.href.startsWith("http://"),
  ),
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
        "id,name,bio,avatar_url,headline,intro,location,about,social_links",
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
