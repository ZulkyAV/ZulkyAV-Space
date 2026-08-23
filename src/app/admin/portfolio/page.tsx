import { AdminShell } from "@/components/admin-shell";
import { PortfolioForm } from "@/app/admin/portfolio/profile-form";
import { getPortfolioProfile } from "@/lib/data/profile";

export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  const profile = await getPortfolioProfile();

  return (
    <AdminShell
      title="Portfolio"
      description="Manage your public profile and featured work."
    >
      <PortfolioForm profile={profile} />
    </AdminShell>
  );
}
