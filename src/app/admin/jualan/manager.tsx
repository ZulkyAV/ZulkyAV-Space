"use client";

import { useActionState, useState } from "react";
import { AdminImageUploader } from "@/components/admin-image-uploader";
import {
  archiveShopFolder,
  createProduct,
  createShopFolder,
  deactivateProduct,
  updateProduct,
  updateShopFolder,
  type ShopActionState,
} from "@/app/admin/jualan/actions";
import type { AdminProduct, AdminShopFolder } from "@/types/jualan-admin";

const initialState: ShopActionState = { status: "idle", message: "" };
const input = "mt-2 w-full rounded-xl border border-white/15 bg-[#14141A] px-4 py-3 text-sm text-neutral-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100";
const accents = ["blue", "amber", "green", "slate"];
const statuses = ["published", "maintenance", "draft", "archived"];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function Message({ state }: { state: ShopActionState }) {
  return state.message ? <p role="status" className={`rounded-xl px-4 py-3 text-sm ${state.status === "success" ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"}`}>{state.message}</p> : null;
}

function FolderFields({ folder }: { folder?: AdminShopFolder }) {
  return <>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-neutral-300">Folder name<input className={input} name="name" required maxLength={100} defaultValue={folder?.name} placeholder="Rice Bowl" /></label>
      <label className="text-sm font-semibold text-neutral-300">Slug<input className={input} name="slug" required maxLength={100} defaultValue={folder?.slug} placeholder="rice-bowl" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
    </div>
    <label className="block text-sm font-semibold text-neutral-300">Description<textarea className={input} name="description" rows={3} maxLength={500} defaultValue={folder?.description} /></label>
    <div className="grid gap-5 sm:grid-cols-3">
      <label className="text-sm font-semibold text-neutral-300">Accent<select className={input} name="accent" defaultValue={folder?.accent ?? "blue"}>{accents.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="text-sm font-semibold text-neutral-300">Status<select className={input} name="status" defaultValue={folder?.status ?? "draft"}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="text-sm font-semibold text-neutral-300">Sort order<input className={input} name="sortOrder" type="number" min={0} max={9999} defaultValue={folder?.sortOrder ?? 0} /></label>
    </div>
  </>;
}

function CreateFolder() {
  const [state, action, pending] = useActionState(createShopFolder, initialState);
  return <details className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 sm:p-6">
    <summary className="cursor-pointer font-semibold text-primary-200">＋ Add shop folder</summary>
    <form action={action} className="mt-6 space-y-5"><FolderFields /><Message state={state} /><button disabled={pending} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Creating..." : "Create folder"}</button></form>
  </details>;
}

function FolderEditor({ folder }: { folder: AdminShopFolder }) {
  const [state, action, pending] = useActionState(updateShopFolder, initialState);
  const [archiveState, archiveAction, archiving] = useActionState(archiveShopFolder, initialState);
  return <article className="rounded-2xl border border-white/10 bg-[#14141A] p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold text-neutral-100">{folder.name}</h3><p className="mt-1 font-mono text-[11px] text-neutral-500">/jualan/{folder.slug}</p></div><div className="flex gap-2"><span className="rounded-full bg-[#1B1B23] px-3 py-1 text-xs font-semibold">{folder.productCount} products</span><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-300">{folder.status}</span></div></div>
    <details className="mt-5 border-t border-white/10 pt-5"><summary className="cursor-pointer text-sm font-semibold text-primary-300">Edit folder</summary>
      <form action={action} className="mt-5 space-y-5"><input type="hidden" name="id" value={folder.id} /><FolderFields folder={folder} /><Message state={state} /><button disabled={pending} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving..." : "Save folder"}</button></form>
      {folder.status !== "archived" ? <form action={archiveAction} className="mt-5 border-t border-white/10 pt-5"><input type="hidden" name="id" value={folder.id} /><Message state={archiveState} /><button disabled={archiving} className="mt-3 rounded-xl border border-error-200 px-4 py-2.5 text-sm font-semibold text-error-700 disabled:opacity-60">{archiving ? "Archiving..." : "Archive folder"}</button></form> : null}
    </details>
  </article>;
}

function ProductFields({ folders, product }: { folders: AdminShopFolder[]; product?: AdminProduct }) {
  return <>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-neutral-300">Folder<select className={input} name="folderId" required defaultValue={product?.folderId ?? folders[0]?.id ?? ""}>{folders.filter((folder) => folder.status !== "archived").map((folder) => <option key={folder.id} value={folder.id}>{folder.name} ({folder.status})</option>)}</select></label>
      <label className="text-sm font-semibold text-neutral-300">Product name<input className={input} name="name" required maxLength={160} defaultValue={product?.name} placeholder="Teriyaki Rice Bowl" /></label>
      <label className="text-sm font-semibold text-neutral-300">Slug<input className={input} name="slug" required maxLength={140} defaultValue={product?.slug} placeholder="teriyaki-rice-bowl" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
      <label className="text-sm font-semibold text-neutral-300">Labels (comma separated)<input className={input} name="labels" maxLength={500} defaultValue={product?.labels.join(", ")} placeholder="Best Seller, Recommended" /></label>
    </div>
    <label className="block text-sm font-semibold text-neutral-300">Description<textarea className={input} name="description" rows={3} maxLength={3000} defaultValue={product?.description} /></label>
    <AdminImageUploader scope="product" initialUrl={product?.imageUrl} initialPublicId={product?.imagePublicId} />
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold text-neutral-300">Selling price<input className={input} name="sellingPrice" type="number" min={0} step="0.01" defaultValue={product?.sellingPrice} placeholder="15000" /></label>
      <label className="text-sm font-semibold text-neutral-300">Current stock<input className={input} name="currentStock" type="number" min={0} step={1} defaultValue={product?.currentStock ?? 0} /></label>
      <label className="text-sm font-semibold text-neutral-300">Sort order<input className={input} name="sortOrder" type="number" min={0} max={9999} defaultValue={product?.sortOrder ?? 0} /></label>
      <label className="text-sm font-semibold text-neutral-300">SKU (private)<input className={input} name="sku" maxLength={120} defaultValue={product?.sku} /></label>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm font-semibold text-neutral-300">Cost price (private)<input className={input} name="costPrice" type="number" min={0} step="0.01" defaultValue={product?.costPrice} /></label>
      <label className="text-sm font-semibold text-neutral-300">Private notes<textarea className={input} name="privateNotes" rows={2} maxLength={2000} defaultValue={product?.privateNotes} /></label>
    </div>
    <div className="flex flex-wrap gap-6">
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300"><input type="checkbox" name="showPrice" defaultChecked={product?.showPrice ?? true} /> Show selling price publicly</label>
      <label className="flex items-center gap-2 text-sm font-semibold text-neutral-300"><input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? false} /> Active in public shop</label>
    </div>
  </>;
}

function CreateProduct({ folders }: { folders: AdminShopFolder[] }) {
  const [state, action, pending] = useActionState(createProduct, initialState);
  if (!folders.some((folder) => folder.status !== "archived")) return <p className="rounded-xl bg-warning-50 p-4 text-sm text-warning-700">Create a shop folder before adding products.</p>;
  return <details className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 sm:p-6"><summary className="cursor-pointer font-semibold text-primary-200">＋ Add product</summary><form action={action} className="mt-6 space-y-5"><ProductFields folders={folders} /><Message state={state} /><button disabled={pending} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Creating..." : "Create product"}</button></form></details>;
}

function ProductEditor({ folders, product }: { folders: AdminShopFolder[]; product: AdminProduct }) {
  const [state, action, pending] = useActionState(updateProduct, initialState);
  const [offState, offAction, turningOff] = useActionState(deactivateProduct, initialState);
  return <article className="rounded-2xl border border-white/10 bg-[#14141A] p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-neutral-100">{product.name}</h3><p className="mt-1 font-mono text-[11px] text-neutral-500">{product.sku || "No SKU"} · stock {product.currentStock}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.isActive ? "bg-success-50 text-success-700" : "bg-[#1B1B23] text-neutral-400"}`}>{product.isActive ? "active" : "hidden"}</span></div>
    <details className="mt-5 border-t border-white/10 pt-5"><summary className="cursor-pointer text-sm font-semibold text-primary-300">Edit product</summary><form action={action} className="mt-5 space-y-5"><input type="hidden" name="id" value={product.id} /><ProductFields folders={folders} product={product} /><Message state={state} /><button disabled={pending} className="rounded-xl bg-primary-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Saving..." : "Save product"}</button></form>
      {product.isActive ? <form action={offAction} className="mt-5 border-t border-white/10 pt-5"><input type="hidden" name="id" value={product.id} /><Message state={offState} /><button disabled={turningOff} className="mt-3 rounded-xl border border-error-200 px-4 py-2.5 text-sm font-semibold text-error-700 disabled:opacity-60">{turningOff ? "Hiding..." : "Hide product publicly"}</button></form> : null}
    </details>
  </article>;
}

export function ShopManager({ folders, products, loadError }: { folders: AdminShopFolder[]; products: AdminProduct[]; loadError: string }) {
  const [tab, setTab] = useState<"folders" | "products">("products");
  return <div className="space-y-7">
    <div className="grid gap-4 sm:grid-cols-3"><Summary label="Folders" value={folders.length} /><Summary label="Products" value={products.length} /><Summary label="Total stock" value={products.reduce((sum, product) => sum + product.currentStock, 0)} /></div>
    <div className="flex gap-2"><button type="button" onClick={() => setTab("products")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "products" ? "bg-primary-700 text-white" : "bg-[#14141A] text-neutral-400"}`}>Products & stock</button><button type="button" onClick={() => setTab("folders")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "folders" ? "bg-primary-700 text-white" : "bg-[#14141A] text-neutral-400"}`}>Folders</button></div>
    {loadError ? <p className="rounded-xl bg-error-50 p-4 text-sm text-error-700">{loadError}</p> : null}
    {tab === "folders" ? <><CreateFolder /><div className="space-y-4">{folders.map((folder) => <FolderEditor key={folder.id} folder={folder} />)}</div></> : <><CreateProduct folders={folders} /><div className="space-y-4">{products.map((product) => <ProductEditor key={product.id} folders={folders} product={product} />)}</div></>}
  </div>;
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-white/10 bg-[#14141A] p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p><p className="mt-2 text-2xl font-bold text-neutral-100">{value}</p></div>;
}
