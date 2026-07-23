"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
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

  if (!hydrated) return <AdminTableSkeleton />;

  const startNew = () => {
    setEditing(null);
    setName("");
    setEmoji("🥦");
    setOpen(true);
  };
  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setEmoji(c.emoji);
    setOpen(true);
  };
  const [open, setOpen] = useState(false);

  const save = () => {
    if (name.trim().length < 2) return;
    const slug =
      editing?.slug ??
      name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    upsertCategory({
      id: editing?.id ?? "cat_" + Date.now(),
      name: name.trim(),
      slug,
      emoji,
      sortOrder: editing?.sortOrder ?? categories.length + 1,
      isActive: editing?.isActive ?? true,
    });
    show(editing ? "Category updated" : "Category created");
    setOpen(false);
  };

  const toggleActive = (c: Category) =>
    upsertCategory({ ...c, isActive: !c.isActive });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
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
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-2xl">
                {c.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">
                  {c.name}
                </p>
                <p className="text-xs text-slate-400">{count} products</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  onClick={() => startEdit(c)}
                  className="text-sm font-semibold text-brand-dark"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(c)}
                  className={`text-2xs font-semibold ${
                    c.isActive ? "text-slate-400" : "text-amber-600"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <h2 className="mb-3 text-lg font-bold">
              {editing ? "Edit Category" : "New Category"}
            </h2>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <label className="mb-1 block text-sm font-medium">Icon</label>
            <div className="mb-4 flex flex-wrap gap-1">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl ${
                    emoji === em ? "bg-brand-100 ring-2 ring-brand" : "bg-slate-50"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={save} className="btn-primary flex-1">
                Save
              </button>
              <button
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
