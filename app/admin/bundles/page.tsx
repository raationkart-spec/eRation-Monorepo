"use client";
import { useEffect, useState } from "react";
import { UtensilsCrossed, Plus, Trash2, X } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/components/toast";
import { useHydrated } from "@/lib/useHydrated";
import type { Bundle } from "@/lib/types";

interface ItemDraft {
  productId: string;
  quantity: string;
}

export default function AdminBundlesPage() {
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);
  const showToast = useToast((s) => s.show);

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    tag: "",
    price: "",
  });
  const [itemDrafts, setItemDrafts] = useState<ItemDraft[]>([]);

  const loadBundles = () => {
    fetch("/api/admin/bundles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.bundles)) setBundles(data.bundles);
      })
      .catch(() => showToast("Failed to load bundles"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBundles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated || loading) return <div className="p-6">Loading bundles...</div>;

  const openNewModal = () => {
    setForm({ name: "", description: "", tag: "", price: "" });
    setItemDrafts([{ productId: products[0]?.id ?? "", quantity: "1" }]);
    setShowModal(true);
  };

  const addItemRow = () =>
    setItemDrafts((d) => [...d, { productId: products[0]?.id ?? "", quantity: "1" }]);

  const removeItemRow = (idx: number) =>
    setItemDrafts((d) => d.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const price = Math.round(parseFloat(form.price) * 100);
    if (!form.name.trim()) {
      showToast("Bundle name is required");
      return;
    }
    if (!price || price <= 0) {
      showToast("Enter a valid bundle price");
      return;
    }
    const items = itemDrafts
      .filter((i) => i.productId)
      .map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity) || 1 }));
    if (items.length === 0) {
      showToast("Add at least one item to the bundle");
      return;
    }

    try {
      const res = await fetch("/api/admin/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          tag: form.tag.trim() || undefined,
          price,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create bundle");
      showToast("Bundle created");
      setShowModal(false);
      loadBundles();
    } catch (err: any) {
      showToast(err.message || "Failed to create bundle");
    }
  };

  const toggleActive = async (bundle: Bundle) => {
    try {
      const res = await fetch("/api/admin/bundles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bundle.id, isActive: !bundle.isActive }),
      });
      if (!res.ok) throw new Error();
      loadBundles();
    } catch {
      showToast("Failed to update bundle");
    }
  };

  const removeBundle = async (bundle: Bundle) => {
    try {
      const res = await fetch(`/api/admin/bundles?id=${bundle.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast("Bundle removed");
      loadBundles();
    } catch {
      showToast("Failed to remove bundle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
            <UtensilsCrossed className="text-brand" /> Bundles
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Multi-item recipe bundles customers can add to cart in one tap.
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-orange-600 hover:to-amber-700"
        >
          <Plus size={16} /> New Bundle
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <div
            key={bundle.id}
            className={`rounded-xl border bg-white p-4 shadow-2xs ${
              bundle.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/60 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{bundle.name}</p>
                <p className="text-xs font-semibold text-slate-500">{formatMoney(bundle.price)}</p>
              </div>
              <button
                onClick={() => toggleActive(bundle)}
                className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
                  bundle.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {bundle.isActive ? "Active" : "Disabled"}
              </button>
            </div>
            <ul className="mt-2 space-y-0.5 text-2xs text-slate-500">
              {bundle.items.map((i) => (
                <li key={i.id}>
                  {i.quantity} × {i.product.name}
                </li>
              ))}
            </ul>
            <button
              onClick={() => removeBundle(bundle)}
              className="mt-3 flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        ))}
        {bundles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No bundles yet. Click "New Bundle" above.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">New Bundle</h2>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Bundle Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sunday Breakfast Bundle"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Eggs, Bread, Butter, and fresh Orange Juice."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Tag (optional)</label>
                <input
                  value={form.tag}
                  onChange={(e) => setForm({ ...form, tag: e.target.value })}
                  placeholder="Bundle Save 15%"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Bundle Price (₹)</label>
                <input
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="299"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Items</label>
              <div className="space-y-2">
                {itemDrafts.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) =>
                        setItemDrafts((d) =>
                          d.map((it, i) => (i === idx ? { ...it, productId: e.target.value } : it))
                        )
                      }
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-brand"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      inputMode="numeric"
                      value={item.quantity}
                      onChange={(e) =>
                        setItemDrafts((d) =>
                          d.map((it, i) =>
                            i === idx ? { ...it, quantity: e.target.value.replace(/\D/g, "") } : it
                          )
                        )
                      }
                      className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-bold outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => removeItemRow(idx)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addItemRow}
                className="mt-2 text-xs font-bold text-brand-dark hover:underline"
              >
                + Add item
              </button>
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
                Create Bundle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
