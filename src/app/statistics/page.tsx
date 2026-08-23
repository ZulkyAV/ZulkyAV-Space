import { PageShell } from "@/components/page-shell";
import { StatisticsDashboard } from "@/components/statistics-dashboard";
import { getPublicStatistics } from "@/lib/data/statistics";

export const revalidate = 300;

export default async function StatisticsPage() {
  const { snapshots, settings, error } = await getPublicStatistics();
  return <PageShell eyebrow="Quick insights" title="What’s moving lately." description="Quick overview buat lihat produk yang lagi banyak diminati, tanpa membuka angka dan data private.">
    {!settings.isPublic ? <div className="rounded-2xl border border-white/10 bg-[#14141A] p-10 text-center"><p className="font-semibold">Public statistics are currently hidden.</p></div> : <>{error ? <p className="mb-6 rounded-xl bg-warning-50 p-4 text-sm text-warning-700">{error}</p> : null}<StatisticsDashboard snapshots={snapshots} settings={settings} /></>}
  </PageShell>;
}
