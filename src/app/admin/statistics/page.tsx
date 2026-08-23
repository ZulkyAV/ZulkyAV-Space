import { AdminShell } from "@/components/admin-shell";
import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { getAdminStatistics } from "@/lib/data/statistics";

export const dynamic = "force-dynamic";

export default async function AdminStatisticsPage() {
  const { snapshots, settings, error } = await getAdminStatistics();
  return <AdminShell title="Statistics" description="Review exact private sales performance for the supported periods.">
    {error ? <p className="mb-6 rounded-xl bg-error-50 p-4 text-sm text-error-700">{error}</p> : null}
    <StatisticsDashboard snapshots={snapshots} settings={settings} admin />
  </AdminShell>;
}
