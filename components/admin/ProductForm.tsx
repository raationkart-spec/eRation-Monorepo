"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import type { Product } from "@/lib/types";
import { ImageUploader } from "./ImageUploader";
import { Percent, Sparkles } from "lucide-react";

const EMOJI_CHOICES = [
  "🍎","🍌","🥦","🥕","🍅","🥬","🥭","🍇","🥛","🥚","🧀","🧈","🍞","🥐","🧁",
  "🥤","🍫","🍿","🧃","🥜","🧼","🧴","🪥","🍚","🌾","🫘","🛢️","🧊","🍟","🥟",
];

const DISCOUNT_PRESETS = [5, 10, 15, 20, 25, 30, 40, 50];

export function ProductForm({ existing }: { existing?: Product }) {
  const router = useRouter();
  const categories = useCatalog((s) => s.categories);
  const upsertProduct = useCatalog((s) => s.upsertProduct);
  const show = useToast((s) => s.show);

  const [f, setF] = useState({
    name: existing?.name ?? "",
    categorySlug: existing?.categorySlug ?? categories[0]?.slug ?? "",
    brand: existing?.brand ?? "",
    unit: existing?.unit ?? "",
    emoji: existing?.emoji ?? "🛒",
    imageUrl: existing?.imageUrl ?? "",
    mrp: existing ? String(existing.mrp / 100) : "",
    price: existing ? String(existing.price / 100) : "",
    stockQty: existing ? String(existing.stockQty) : "0",
    lowStockThreshold: existing ? String(existing.lowStockThreshold) : "5",
    description: existing?.description ?? "",
    tags: existing?.tags.join(", ") ?? "",
    isActive: existing?.isActive ?? true,
    isFeatured: existing?.isFeatured ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string | boolean) =>
    setF((s) => ({ ...s, [k]: v }));

  // Calculated discount metrics
  const numericMrp = parseFloat(f.mrp) || 0;
  const numericPrice = parseFloat(f.price) || 0;
  const savingsAmount = numericMrp > numericPrice ? numericMrp - numericPrice : 0;
  const discountPercent =
    numericMrp > 0 && savingsAmount > 0
      ? Math.round((savingsAmount / numericMrp) * 100)
      : 0;

  const applyDiscountPreset = (pct: number) => {
    if (!numericMrp || numericMrp <= 0) return;
    const discountedPrice = numericMrp * (1 - pct / 100);
    set("price", (Math.round(discountedPrice * 100) / 100).toFixed(2));
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = "Name required";
    if (!f.unit.trim()) e.unit = "Unit required";
    const mrp = Math.round(parseFloat(f.mrp) * 100);
    const price = Math.round(parseFloat(f.price) * 100);
    if (!mrp || mrp <= 0) e.mrp = "Enter MRP";
    if (!price || price <= 0) e.price = "Enter price";
    if (price > mrp) e.price = "Price cannot exceed MRP";
    setErrors(e);
    if (Object.keys(e).length) return;

    const slug =
      existing?.slug ??
      f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const payload = {
      id: existing?.id,
      name: f.name.trim(),
      slug,
      categorySlug: f.categorySlug,
      brand: f.brand.trim() || undefined,
      unit: f.unit.trim(),
      emoji: f.emoji,
      imageUrl: f.imageUrl.trim() || undefined,
      mrp,
      price,
      stockQty: parseInt(f.stockQty) || 0,
      lowStockThreshold: parseInt(f.lowStockThreshold) || 5,
      description: f.description.trim() || undefined,
      tags: f.tags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      isActive: f.isActive,
      isFeatured: f.isFeatured,
      sortOrder: existing?.sortOrder ?? 0,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      upsertProduct(data.product as Product);
      show(existing ? "Product updated" : "Product created");
      router.push("/admin/products");
    } catch (err: any) {
      show(err.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Basic Info Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          1. General Product Info
        </h2>

        <Field label="Product Name" error={errors.name}>
          <input
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Amul Taaza Toned Milk"
            className="ainput"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Category">
            <select
              value={f.categorySlug}
              onChange={(e) => set("categorySlug", e.target.value)}
              className="ainput"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Unit / Pack Size" error={errors.unit}>
            <input
              value={f.unit}
              onChange={(e) => set("unit", e.target.value)}
              placeholder="e.g. 500 ml, 1 kg, Pack of 6"
              className="ainput"
            />
          </Field>
        </div>

        <Field label="Brand (optional)">
          <input
            value={f.brand}
            onChange={(e) => set("brand", e.target.value)}
            placeholder="e.g. Amul, Nestle, Fortune"
            className="ainput"
          />
        </Field>
      </div>

      {/* Image & Icon Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          2. Product Visuals &amp; Media
        </h2>

        <ImageUploader
          imageUrl={f.imageUrl}
          onChange={(url) => set("imageUrl", url)}
          label="Product Image (Uploaded or URL)"
        />

        <Field label="Fallback Emoji Icon">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {EMOJI_CHOICES.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => set("emoji", em)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition ${
                  f.emoji === em
                    ? "bg-brand-100 ring-2 ring-brand scale-105"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Pricing & Discount Assistant Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Percent size={18} className="text-brand" /> 3. Pricing &amp; Item Discount Calculator
          </h2>
          {discountPercent > 0 && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 animate-pulse">
              🔥 {discountPercent}% OFF (Save ₹{savingsAmount.toFixed(2)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Maximum Retail Price - MRP (₹)" error={errors.mrp}>
            <input
              inputMode="decimal"
              value={f.mrp}
              onChange={(e) => set("mrp", e.target.value)}
              placeholder="e.g. 100"
              className="ainput text-base font-semibold"
            />
          </Field>

          <Field label="Final Selling Price (₹)" error={errors.price}>
            <input
              inputMode="decimal"
              value={f.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. 80"
              className="ainput text-base font-semibold text-brand-dark"
            />
          </Field>
        </div>

        {/* Preset Discount Assistant Buttons */}
        <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-amber-500" /> Apply Quick Discount Preset from MRP:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {DISCOUNT_PRESETS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => applyDiscountPreset(pct)}
                disabled={!numericMrp}
                className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-brand hover:text-white hover:border-brand disabled:opacity-40 transition"
              >
                {pct}% OFF
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory & Metadata Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          4. Stock &amp; Metadata
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Available Stock Quantity">
            <input
              inputMode="numeric"
              value={f.stockQty}
              onChange={(e) => set("stockQty", e.target.value.replace(/\D/g, ""))}
              className="ainput font-semibold"
            />
          </Field>

          <Field label="Low Stock Threshold Alert">
            <input
              inputMode="numeric"
              value={f.lowStockThreshold}
              onChange={(e) =>
                set("lowStockThreshold", e.target.value.replace(/\D/g, ""))
              }
              className="ainput"
            />
          </Field>
        </div>

        <Field label="Description (optional)">
          <textarea
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder="Detailed description or ingredients..."
            className="ainput"
          />
        </Field>

        <Field label="Tags (comma separated)">
          <input
            value={f.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder="fresh, dairy, breakfast, organic"
            className="ainput"
          />
        </Field>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={f.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            Active (Visible in store)
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={f.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            Featured on Storefront Banner
          </label>
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={submit} disabled={saving} className="btn-primary py-2.5 px-6 disabled:opacity-60">
          {saving ? "Saving..." : existing ? "Save product changes" : "Publish new product"}
        </button>
        <button
          onClick={() => router.push("/admin/products")}
          className="btn-secondary py-2.5 px-5"
        >
          Cancel
        </button>
      </div>

      <style jsx global>{`
        .ainput {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
          transition: border-color 0.15s ease-in-out;
        }
        .ainput:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-2xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
