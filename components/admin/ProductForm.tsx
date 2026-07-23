"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import type { Product } from "@/lib/types";

const EMOJI_CHOICES = [
  "🍎","🍌","🥦","🥕","🍅","🥬","🥭","🍇","🥛","🥚","🧀","🧈","🍞","🥐","🧁",
  "🥤","🍫","🍿","🧃","🥜","🧼","🧴","🪥","🍚","🌾","🫘","🛢️","🧊","🍟","🥟",
];

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

  const set = (k: string, v: string | boolean) =>
    setF((s) => ({ ...s, [k]: v }));

  const submit = () => {
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

    const product: Product = {
      id: existing?.id ?? "p_" + Date.now(),
      name: f.name.trim(),
      slug,
      categorySlug: f.categorySlug,
      brand: f.brand.trim() || undefined,
      unit: f.unit.trim(),
      emoji: f.emoji,
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
    upsertProduct(product);
    show(existing ? "Product updated" : "Product created");
    router.push("/admin/products");
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <Field label="Emoji / Image">
          <div className="flex flex-wrap gap-1">
            {EMOJI_CHOICES.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => set("emoji", em)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl ${
                  f.emoji === em ? "bg-brand-100 ring-2 ring-brand" : "bg-slate-50"
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Name" error={errors.name}>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} className="ainput" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Unit (e.g. 500g)" error={errors.unit}>
            <input value={f.unit} onChange={(e) => set("unit", e.target.value)} className="ainput" />
          </Field>
        </div>

        <Field label="Brand (optional)">
          <input value={f.brand} onChange={(e) => set("brand", e.target.value)} className="ainput" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="MRP (₹)" error={errors.mrp}>
            <input
              inputMode="decimal"
              value={f.mrp}
              onChange={(e) => set("mrp", e.target.value)}
              className="ainput"
            />
          </Field>
          <Field label="Selling Price (₹)" error={errors.price}>
            <input
              inputMode="decimal"
              value={f.price}
              onChange={(e) => set("price", e.target.value)}
              className="ainput"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock Quantity">
            <input
              inputMode="numeric"
              value={f.stockQty}
              onChange={(e) => set("stockQty", e.target.value.replace(/\D/g, ""))}
              className="ainput"
            />
          </Field>
          <Field label="Low Stock Threshold">
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

        <Field label="Description">
          <textarea
            value={f.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            className="ainput"
          />
        </Field>

        <Field label="Tags (comma separated)">
          <input value={f.tags} onChange={(e) => set("tags", e.target.value)} className="ainput" />
        </Field>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Active
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.isFeatured}
              onChange={(e) => set("isFeatured", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Featured on home
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={submit} className="btn-primary">
          {existing ? "Save changes" : "Create product"}
        </button>
        <button
          onClick={() => router.push("/admin/products")}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>

      <style jsx global>{`
        .ainput {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }
        .ainput:focus {
          border-color: #f97316;
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
    <div className="mb-3">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-0.5 text-2xs text-red-600">{error}</p>}
    </div>
  );
}
