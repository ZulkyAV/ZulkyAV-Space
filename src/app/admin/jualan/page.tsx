import { AdminShell } from "@/components/admin-shell";
import { ShopManager } from "@/app/admin/jualan/manager";
import { getAdminShopData } from "@/lib/data/admin-jualan";

export const dynamic = "force-dynamic";

export default async function AdminJualanPage() {
  const { folders, products, error } = await getAdminShopData();
  return <AdminShell title="Jualan" description="Manage shop folders, products, images, prices, private costs, labels, and stock.">
    <ShopManager folders={folders} products={products} loadError={error} />
  </AdminShell>;
}
