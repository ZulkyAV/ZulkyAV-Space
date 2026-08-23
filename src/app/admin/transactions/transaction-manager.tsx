"use client";

import { useActionState, useMemo, useState } from "react";
import { recordSale, type TransactionState } from "@/app/admin/transactions/actions";
import type { RecentSale, TransactionProduct } from "@/types/transactions";

const initialState: TransactionState = { status: "idle", message: "" };
const input = "mt-2 w-full rounded-xl border border-white/15 bg-[#14141A] px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100";
const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function TransactionManager({ products, sales, loadError }: { products: TransactionProduct[]; sales: RecentSale[]; loadError: string }) {
  const available = products.filter((product) => product.currentStock > 0);
  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([{ productId: available[0]?.id ?? "", quantity: 1 }]);
  const [state, action, pending] = useActionState(recordSale, initialState);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const total = items.reduce((sum, item) => sum + (productById.get(item.productId)?.sellingPrice ?? 0) * item.quantity, 0);
  return <div className="space-y-8">
    {loadError ? <p className="rounded-xl bg-error-50 p-4 text-sm text-error-700">{loadError}</p> : null}
    <form action={action} className="rounded-2xl border border-white/10 bg-[#14141A] p-5 shadow-sm sm:p-7">
      <h2 className="text-xl font-bold text-neutral-100">Record a sale</h2><p className="mt-2 text-sm text-neutral-400">Saving a sale automatically reduces product stock.</p>
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />
      <div className="mt-6 space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-xl bg-[#101015] p-3 sm:grid-cols-[1fr_130px_auto]">
        <select className={input} value={item.productId} onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, productId: event.target.value } : entry))}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · stock {product.currentStock} · {money.format(product.sellingPrice)}</option>)}</select>
        <input className={input} aria-label="Quantity" type="number" min={1} max={productById.get(item.productId)?.currentStock ?? 1} value={item.quantity} onChange={(event) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, quantity: Math.max(1, Number(event.target.value) || 1) } : entry))} />
        <button type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} className="self-end rounded-lg border border-white/15 px-3 py-3 text-sm text-neutral-400">Remove</button>
      </div>)}</div>
      <button type="button" disabled={!available.length} onClick={() => setItems((current) => [...current, { productId: available[0]?.id ?? "", quantity: 1 }])} className="mt-3 text-sm font-semibold text-primary-300 disabled:opacity-50">＋ Add another item</button>
      <div className="mt-6 grid gap-5 sm:grid-cols-3"><label className="text-sm font-semibold text-neutral-300">Sold at<input className={input} name="soldAt" type="datetime-local" /></label><label className="text-sm font-semibold text-neutral-300">Payment<select className={input} name="paymentMethod" defaultValue="cash"><option value="cash">Cash</option><option value="qris">QRIS</option><option value="transfer">Transfer</option><option value="ewallet">E-wallet</option><option value="other">Other</option></select></label><label className="text-sm font-semibold text-neutral-300">Notes<input className={input} name="notes" maxLength={1000} /></label></div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5"><div><p className="text-xs uppercase tracking-wider text-neutral-500">Total</p><p className="mt-1 text-2xl font-bold">{money.format(total)}</p></div><button disabled={pending || !items.length || items.some((item) => !item.productId)} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Recording..." : "Record sale"}</button></div>
      {state.message ? <p role="status" className={`mt-5 rounded-xl p-4 text-sm ${state.status === "success" ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"}`}>{state.message}</p> : null}
    </form>
    <section><h2 className="text-xl font-bold text-neutral-100">Recent sales</h2><div className="mt-4 space-y-4">{sales.length ? sales.map((sale) => <article key={sale.id} className="rounded-2xl border border-white/10 bg-[#14141A] p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{new Date(sale.soldAt).toLocaleString("id-ID")}</p><p className="mt-1 text-xs uppercase text-neutral-500">{sale.paymentMethod}</p></div><p className="font-bold">{money.format(sale.totalAmount)}</p></div><ul className="mt-4 space-y-1 text-sm text-neutral-400">{sale.items.map((item, index) => <li key={`${item.name}-${index}`}>{item.quantity} × {item.name} — {money.format(item.subtotal)}</li>)}</ul>{sale.notes ? <p className="mt-3 text-xs text-neutral-400">{sale.notes}</p> : null}</article>) : <p className="text-neutral-400">No sales recorded yet.</p>}</div></section>
  </div>;
}

