export type SocialLink = {
  label: string;
  href: string;
};

export type PortfolioProfile = {
  id: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
  headline: string;
  intro: string;
  location: string;
  about: string;
  socials: SocialLink[];
};
