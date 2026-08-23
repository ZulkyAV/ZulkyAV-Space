import { AdminShell } from "@/components/admin-shell";
import { SettingsForm } from "@/app/admin/settings/settings-form";
import { getAdminStatistics } from "@/lib/data/statistics";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { settings, error } = await getAdminStatistics();
  return <AdminShell title="Settings" description="Control the public statistics view and privacy options.">
    {error ? <p className="mb-6 rounded-xl bg-error-50 p-4 text-sm text-error-700">{error}</p> : null}
    <SettingsForm settings={settings} />
  </AdminShell>;
}
