"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Trash2 } from "lucide-react";
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

  if (!hydrated) return <AdminTableSkeleton />;
  const product = products.find((p) => p.id === id);
  if (!product)
    return <p className="text-slate-500">Product not found.</p>;

  const applyStock = async (sign: number) => {
    const n = parseInt(change);
    if (!n) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          stockQty: Math.max(0, product.stockQty + sign * n),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update stock");
      upsertProduct(data.product);
      show(`Stock ${sign > 0 ? "added" : "removed"}: ${n} (${reason})`);
      setChange("");
    } catch (err: any) {
      show(err.message || "Failed to update stock");
    }
  };

  const hideProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products?id=${product.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to hide product");
      upsertProduct(data.product);
      show("Product hidden from store");
      router.push("/admin/products");
    } catch (err: any) {
      show(err.message || "Failed to hide product");
    }
  };

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500"
      >
        <ChevronLeft size={16} /> Products
      </Link>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
        <button
          onClick={hideProduct}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
        >
          <Trash2 size={15} /> Hide
        </button>
      </div>

      {/* Stock adjustment */}
      <div className="mb-4 max-w-2xl rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-1 font-semibold text-slate-900">Stock Adjustment</h2>
        <p className="mb-3 text-sm text-slate-500">
          Current stock:{" "}
          <span className="font-semibold text-slate-900">
            {product.stockQty}
          </span>
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Quantity</label>
            <input
              inputMode="numeric"
              value={change}
              onChange={(e) => setChange(e.target.value.replace(/\D/g, ""))}
              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
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
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
          >
            + Add
          </button>
          <button
            onClick={() => applyStock(-1)}
            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
          >
            − Remove
          </button>
        </div>
      </div>

      <ProductForm existing={product} />
    </div>
  );
}
