"use client";
import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { ProductImage } from "@/components/ProductImage";
import type { Category } from "@/lib/types";

const EMOJIS = ["🥦","🥛","🍞","🥤","🧼","🧴","🧊","🌾","🍎","🍫","🧀","🥚","🍟","🧺"];

export default function AdminCategories() {
  const hydrated = useHydrated();
  const categories = useCatalog((s) => s.categories);
  const products = useCatalog((s) => s.products);
  const upsertCategory = useCatalog((s) => s.upsertCategory);
  const show = useToast((s) => s.show);

  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🥦");
  const [imageUrl, setImageUrl] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!hydrated) return <AdminTableSkeleton />;

  const startNew = () => {
    setEditing(null);
    setName("");
    setEmoji("🥦");
    setImageUrl("");
    setOpen(true);
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setEmoji(c.emoji);
    setImageUrl(c.imageUrl || "");
    setOpen(true);
  };

  const save = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    const slug =
      editing?.slug ??
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const payload = {
      id: editing?.id,
      name: name.trim(),
      slug,
      emoji,
      imageUrl: imageUrl.trim() || null,
      sortOrder: editing?.sortOrder ?? categories.length + 1,
      isActive: editing?.isActive ?? true,
    };

    try {
      const res = await fetch("/api/admin/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      upsertCategory(data.category);
      show(editing ? "Category updated ✅" : "Category created ✅");
      setOpen(false);
    } catch (err: any) {
      console.warn("Category save DB error:", err);
      // Fallback local update
      upsertCategory({
        id: editing?.id ?? "cat_" + Date.now(),
        name: name.trim(),
        slug,
        emoji,
        imageUrl: imageUrl.trim() || null,
        sortOrder: editing?.sortOrder ?? categories.length + 1,
        isActive: editing?.isActive ?? true,
      });
      show("Saved locally (DB sync notice: " + err.message + ")");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Category) => {
    const nextState = !c.isActive;
    // Immediate local update
    upsertCategory({ ...c, isActive: nextState });

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, isActive: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.category) {
        upsertCategory(data.category);
        show(`Category ${nextState ? "shown" : "hidden"} ✅`);
      }
    } catch (err: any) {
      console.warn("Toggle category DB error:", err);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
          <p className="text-xs text-slate-500">Manage categories and showcase images on storefront</p>
        </div>
        <button onClick={startNew} className="btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => {
          const count = products.filter(
            (p) => p.categorySlug === c.slug && p.isActive
          ).length;
          return (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 border border-slate-100">
                {c.imageUrl ? (
                  <ProductImage
                    imageUrl={c.imageUrl}
                    emoji={c.emoji}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl select-none">{c.emoji}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-bold text-slate-900">
                    {c.name}
                  </p>
                  {!c.isActive && (
                    <span className="rounded-sm bg-amber-100 px-1.5 py-0.5 text-3xs font-bold text-amber-800">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium">{count} active products</p>
                <p className="text-2xs text-slate-400 font-mono">/{c.slug}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => startEdit(c)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-50 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className={`text-2xs font-semibold px-2 py-0.5 rounded-sm transition ${
                    c.isActive ? "text-slate-500 hover:text-red-600" : "text-emerald-700 bg-emerald-50"
                  }`}
                >
                  {c.isActive ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              {editing ? "Edit Category" : "New Category"}
            </h2>
            
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dairy & Eggs"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />

            <div className="mb-3">
              <ImageUploader
                imageUrl={imageUrl}
                onChange={setImageUrl}
                label="Category Banner/Thumbnail (Cloudflare R2)"
                folder="categories"
              />
            </div>

            <label className="mb-1 block text-sm font-medium text-slate-700">Fallback Icon</label>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition ${
                    emoji === em ? "bg-brand-100 ring-2 ring-brand" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={save}
                disabled={saving || name.trim().length < 2}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save Category"
                )}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
