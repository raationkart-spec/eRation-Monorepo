"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function AdminProducts() {
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);
  const categories = useCatalog((s) => s.categories);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  if (!hydrated) return <AdminTableSkeleton />;

  const filtered = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (!cat || p.categorySlug === cat)
  );

  return (
    <div className="content-in">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.emoji}</span>
                      <div>
                        <p className="font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatMoney(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.stockQty === 0
                          ? "font-semibold text-red-600"
                          : p.stockQty <= p.lowStockThreshold
                          ? "font-semibold text-amber-600"
                          : "text-slate-700"
                      }
                    >
                      {p.stockQty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-2xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-slate-500">
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-sm font-semibold text-brand-dark"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            No products found
          </p>
        )}
      </div>
    </div>
  );
}
