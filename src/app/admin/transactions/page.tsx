import { AdminShell } from "@/components/admin-shell";
import { TransactionManager } from "@/app/admin/transactions/transaction-manager";
import { getAdminTransactions } from "@/lib/data/admin-transactions";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const { products, sales, error } = await getAdminTransactions();
  return <AdminShell title="Transactions" description="Record sales, reduce stock automatically, and review recent activity.">
    <TransactionManager products={products} sales={sales} loadError={error} />
  </AdminShell>;
}
