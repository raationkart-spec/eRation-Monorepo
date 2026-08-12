"use client";
import { useEffect, useState } from "react";
import {
  Tag,
  Plus,
  Percent,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  Sparkles,
  Search,
} from "lucide-react";
import { formatMoney } from "@/lib/format";
import { useToast } from "@/components/toast";
import { useHydrated } from "@/lib/useHydrated";
import type { Coupon } from "@/lib/types";

export default function AdminDiscountsPage() {
  const hydrated = useHydrated();
  const showToast = useToast((s) => s.show);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = () => {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.coupons)) setCoupons(data.coupons);
      })
      .catch(() => showToast("Failed to load coupons"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FLAT",
    discountValue: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
  });

  if (!hydrated || loading) return <div className="p-6">Loading discounts...</div>;

  const openNewModal = () => {
    setEditingCoupon(null);
    setForm({
      code: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: "",
      minOrderValue: "0",
      maxDiscount: "",
      usageLimit: "",
    });
    setShowModal(true);
  };

  const handleSaveCoupon = async () => {
    if (!form.code.trim()) {
      showToast("Coupon code is required");
      return;
    }
    const val = parseFloat(form.discountValue);
    if (!val || val <= 0) {
      showToast("Enter a valid discount value");
      return;
    }

    const payload = {
      id: editingCoupon?.id,
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue:
        form.discountType === "PERCENTAGE" ? val : Math.round(val * 100),
      minOrderValue: form.minOrderValue
        ? Math.round(parseFloat(form.minOrderValue) * 100)
        : 0,
      maxDiscount: form.maxDiscount
        ? Math.round(parseFloat(form.maxDiscount) * 100)
        : null,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: editingCoupon ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save coupon");

      showToast(editingCoupon ? "Coupon updated" : "New coupon created!");
      setShowModal(false);
      loadCoupons();
    } catch (err: any) {
      showToast(err.message || "Failed to save coupon");
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.isActive }),
      });
      if (!res.ok) throw new Error();
      showToast(`Coupon ${coupon.code} ${coupon.isActive ? "deactivated" : "activated"}`);
      loadCoupons();
    } catch {
      showToast("Failed to update coupon status");
    }
  };

  const removeCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons?id=${coupon.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      showToast(`Deleted coupon ${coupon.code}`);
      loadCoupons();
    } catch {
      showToast("Failed to delete coupon");
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(q.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Tag className="text-brand" /> Store Discounts &amp; Promo Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create promotional coupons, percentage discounts, and order thresholds.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-orange-600 hover:to-amber-700"
        >
          <Plus size={16} /> Create New Coupon
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Total Promo Codes
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{coupons.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-emerald-800">
            Active Store Coupons
          </p>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {coupons.filter((c) => c.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Total Redemptions
          </p>
          <p className="text-2xl font-black text-brand-dark mt-1">
            {coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <Search size={16} className="text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search coupon codes..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Coupons Desktop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoupons.map((c) => (
          <div
            key={c.id}
            className={`relative flex flex-col justify-between rounded-xl border p-5 bg-white shadow-2xs transition ${
              c.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/60 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-lg bg-orange-100 px-3 py-1 text-sm font-black tracking-wider text-orange-800 border border-orange-200 inline-block">
                    {c.code}
                  </span>
                </div>
                <button
                  onClick={() => toggleCouponStatus(c)}
                  className={`rounded-full px-2.5 py-0.5 text-2xs font-bold ${
                    c.isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {c.isActive ? "Active" : "Disabled"}
                </button>
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-700">
                {c.description || "No description provided"}
              </p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Discount Value:</span>
                  <span className="font-bold text-slate-900">
                    {c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}% OFF`
                      : `${formatMoney(c.discountValue)} OFF`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min Order Value:</span>
                  <span className="font-bold text-slate-900">
                    {c.minOrderValue > 0 ? formatMoney(c.minOrderValue) : "No Minimum"}
                  </span>
                </div>
                {c.maxDiscount && (
                  <div className="flex justify-between">
                    <span>Max Discount Cap:</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(c.maxDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Uses:</span>
                  <span className="font-bold text-slate-900">
                    {c.usedCount} times
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => removeCoupon(c)}
                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}

        {filteredCoupons.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No discount coupons found. Click "Create New Coupon" above.
          </div>
        )}
      </div>

      {/* Modal for Creating Coupon */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
              Create New Store Coupon
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code (e.g. SAVE20)
                </label>
                <input
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="WELCOME20"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-extrabold uppercase outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="e.g. 20% off on first order above ₹299"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={form.discountType}
                    onChange={(e: any) =>
                      setForm({ ...form, discountType: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Value ({form.discountType === "PERCENTAGE" ? "%" : "₹"})
                  </label>
                  <input
                    inputMode="decimal"
                    value={form.discountValue}
                    onChange={(e) =>
                      setForm({ ...form, discountValue: e.target.value })
                    }
                    placeholder={form.discountType === "PERCENTAGE" ? "20" : "50"}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    inputMode="decimal"
                    value={form.minOrderValue}
                    onChange={(e) =>
                      setForm({ ...form, minOrderValue: e.target.value })
                    }
                    placeholder="299"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                </div>

                {form.discountType === "PERCENTAGE" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      inputMode="decimal"
                      value={form.maxDiscount}
                      onChange={(e) =>
                        setForm({ ...form, maxDiscount: e.target.value })
                      }
                      placeholder="100"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCoupon}
                className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-dark"
              >
                Save Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
