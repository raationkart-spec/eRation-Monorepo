"use client";
import { useEffect, useState } from "react";
import { Zap, Plus, Trash2, Clock } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/components/toast";
import { useHydrated } from "@/lib/useHydrated";
import type { FlashDeal } from "@/lib/types";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminFlashDealsPage() {
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);
  const showToast = useToast((s) => s.show);

  const [deals, setDeals] = useState<FlashDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    salePrice: "",
    endsAt: "",
  });

  const loadDeals = () => {
    fetch("/api/admin/flash-deals")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.deals)) setDeals(data.deals);
      })
      .catch(() => showToast("Failed to load flash deals"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated || loading) return <div className="p-6">Loading flash deals...</div>;

  const openNewModal = () => {
    const in3Hours = new Date(Date.now() + 3 * 60 * 60 * 1000);
    setForm({ productId: products[0]?.id ?? "", salePrice: "", endsAt: toLocalInputValue(in3Hours.toISOString()) });
    setShowModal(true);
  };

  const handleSave = async () => {
    const product = products.find((p) => p.id === form.productId);
    const salePrice = Math.round(parseFloat(form.salePrice) * 100);
    if (!product || !salePrice || salePrice <= 0 || salePrice >= product.price) {
      showToast("Enter a sale price lower than the product's current price");
      return;
    }
    if (!form.endsAt) {
      showToast("Set an end time for the deal");
      return;
    }

    try {
      const res = await fetch("/api/admin/flash-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: form.productId,
          salePrice,
          endsAt: new Date(form.endsAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create flash deal");
      showToast("Flash deal created");
      setShowModal(false);
      loadDeals();
    } catch (err: any) {
      showToast(err.message || "Failed to create flash deal");
    }
  };

  const toggleActive = async (deal: FlashDeal) => {
    try {
      const res = await fetch("/api/admin/flash-deals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deal.id, isActive: !deal.isActive }),
      });
      if (!res.ok) throw new Error();
      loadDeals();
    } catch {
      showToast("Failed to update deal");
    }
  };

  const removeDeal = async (deal: FlashDeal) => {
    try {
      const res = await fetch(`/api/admin/flash-deals?id=${deal.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Flash deal removed");
      loadDeals();
    } catch {
      showToast("Failed to remove deal");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <Zap className="text-brand" /> Flash Deals
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Time-boxed discounts on individual products. Ends automatically at the set time.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-orange-600 hover:to-amber-700"
        >
          <Plus size={16} /> New Flash Deal
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal) => {
          const expired = new Date(deal.endsAt).getTime() < Date.now();
          return (
            <div
              key={deal.id}
              className={`rounded-xl border bg-white p-4 shadow-2xs ${
                deal.isActive && !expired ? "border-slate-200" : "border-slate-200 bg-slate-50/60 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">{deal.product.name}</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {formatMoney(deal.salePrice)}{" "}
                    <span className="text-slate-400 line-through">{formatMoney(deal.product.price)}</span>
                  </p>
                </div>
                <button
                  onClick={() => toggleActive(deal)}
                  className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
                    deal.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {deal.isActive ? "Active" : "Disabled"}
                </button>
              </div>
              <p className="mt-2 flex items-center gap-1 text-2xs font-semibold text-slate-400">
                <Clock size={12} /> {expired ? "Expired" : `Ends ${new Date(deal.endsAt).toLocaleString()}`}
              </p>
              <button
                onClick={() => removeDeal(deal)}
                className="mt-3 flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          );
        })}
        {deals.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No flash deals yet. Click "New Flash Deal" above.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">New Flash Deal</h2>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Product</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatMoney(p.price)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Sale Price (₹)</label>
              <input
                inputMode="decimal"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                placeholder="e.g. 145"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Ends At</label>
              <input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-dark"
              >
                Create Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
