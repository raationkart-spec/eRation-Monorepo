"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { ProductForm } from "@/components/admin/ProductForm";
import { useToast } from "@/components/toast";
import { useHydrated } from "@/lib/useHydrated";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useRouter } from "next/navigation";

const REASONS: { value: string; label: string }[] = [
  { value: "RESTOCK", label: "Restock" },
  { value: "DAMAGE", label: "Damage" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CORRECTION", label: "Correction" },
];

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const router = useRouter();
  const products = useCatalog((s) => s.products);
  const upsertProduct = useCatalog((s) => s.upsertProduct);
  const show = useToast((s) => s.show);

  const [change, setChange] = useState("");
  const [reason, setReason] = useState("RESTOCK");
  const [togglingVisibility, setTogglingVisibility] = useState(false);

  if (!hydrated) return <AdminTableSkeleton />;
  const product = products.find((p) => p.id === id);
  if (!product)
    return <p className="text-slate-500">Product not found.</p>;

  const applyStock = async (sign: number) => {
    const n = parseInt(change);
    if (!n) return;
    try {
      const nextStock = Math.max(0, product.stockQty + sign * n);
      upsertProduct({ ...product, stockQty: nextStock });
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          stockQty: nextStock,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");
      upsertProduct(data.product);
      show(`Stock ${sign > 0 ? "added" : "removed"}: ${n} (${reason}) ✅`);
      setChange("");
    } catch (err: any) {
      show(err.message || "Failed to update stock");
    }
  };

  const toggleVisibility = async () => {
    const nextState = !product.isActive;
    setTogglingVisibility(true);
    upsertProduct({ ...product, isActive: nextState });

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      upsertProduct(data.product);
      show(
        nextState
          ? "Product is now live on storefront ✅"
          : "Product hidden from storefront"
      );
    } catch (err: any) {
      show(err.message || "Failed to update product visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition"
      >
        <ChevronLeft size={16} /> Back to Products
      </Link>

      {/* Hidden Status Banner */}
      {!product.isActive && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>
              <strong>Draft / Hidden Product:</strong> This item is currently hidden from customers on the storefront.
            </span>
          </div>
          <button
            onClick={toggleVisibility}
            className="font-bold text-amber-900 underline hover:text-amber-950 ml-2 shrink-0"
          >
            Make Visible Now
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
              product.isActive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {product.isActive ? "Live in Store" : "Hidden Draft"}
          </span>
        </div>

        <button
          onClick={toggleVisibility}
          disabled={togglingVisibility}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold shadow-2xs transition ${
            product.isActive
              ? "border-red-200 text-red-600 hover:bg-red-50"
              : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          {product.isActive ? (
            <>
              <EyeOff size={14} /> Hide from Storefront
            </>
          ) : (
            <>
              <Eye size={14} /> Show in Storefront
            </>
          )}
        </button>
      </div>

      {/* Stock adjustment */}
      <div className="mb-4 max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h2 className="mb-1 font-semibold text-slate-900">Inventory &amp; Stock Adjustment</h2>
        <p className="mb-3 text-sm text-slate-500">
          Current live stock:{" "}
          <span className="font-bold text-slate-900 text-base">
            {product.stockQty} {product.unit}
          </span>
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Quantity</label>
            <input
              inputMode="numeric"
              value={change}
              onChange={(e) => setChange(e.target.value.replace(/\D/g, ""))}
              placeholder="Qty"
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => applyStock(1)}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs"
          >
            + Add Stock
          </button>
          <button
            onClick={() => applyStock(-1)}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-2xs"
          >
            − Deduct Stock
          </button>
        </div>
      </div>

      <ProductForm existing={product} />
    </div>
  );
}
