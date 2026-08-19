"use client";
import { useState } from "react";
import { Plus, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import clsx from "clsx";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { Banner } from "@/lib/types";

const BGS = [
  { label: "Brand", value: "from-brand to-brand-dark" },
  { label: "Sky", value: "from-sky-400 to-sky-600" },
  { label: "Orange", value: "from-amber-400 to-orange-500" },
  { label: "Violet", value: "from-violet-400 to-violet-600" },
  { label: "Pink", value: "from-pink-400 to-rose-500" },
];
const EMOJIS = ["🍓","🥛","🚚","🍎","🥦","🍫","🎉","🛒","🧊","🥭"];

export default function AdminBanners() {
  const hydrated = useHydrated();
  const banners = useCatalog((s) => s.banners);
  const upsertBanner = useCatalog((s) => s.upsertBanner);
  const deleteBanner = useCatalog((s) => s.deleteBanner);
  const show = useToast((s) => s.show);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [f, setF] = useState({
    title: "",
    subtitle: "",
    emoji: "🍓",
    imageUrl: "",
    bg: BGS[0].value,
    linkUrl: "",
  });

  if (!hydrated) return <AdminTableSkeleton />;

  const startNew = () => {
    setEditing(null);
    setF({ title: "", subtitle: "", emoji: "🍓", imageUrl: "", bg: BGS[0].value, linkUrl: "" });
    setOpen(true);
  };

  const startEdit = (b: Banner) => {
    setEditing(b);
    setF({
      title: b.title,
      subtitle: b.subtitle,
      emoji: b.emoji,
      imageUrl: b.imageUrl || "",
      bg: b.bg,
      linkUrl: b.linkUrl ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!f.title.trim()) return;
    setSaving(true);

    const bannerPayload = {
      id: editing?.id,
      title: f.title.trim(),
      subtitle: f.subtitle.trim(),
      emoji: f.emoji,
      imageUrl: f.imageUrl.trim() || null,
      bg: f.bg,
      linkUrl: f.linkUrl.trim() || undefined,
      isActive: editing?.isActive ?? true,
      sortOrder: editing?.sortOrder ?? banners.length + 1,
    };

    try {
      const res = await fetch("/api/admin/banners", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bannerPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save banner");

      upsertBanner(data.banner);
      show(editing ? "Banner updated ✅" : "Banner created ✅");
      setOpen(false);
    } catch (err: any) {
      console.warn("Banner save DB error:", err);
      upsertBanner({
        id: editing?.id ?? "ban_" + Date.now(),
        title: f.title.trim(),
        subtitle: f.subtitle.trim(),
        emoji: f.emoji,
        imageUrl: f.imageUrl.trim() || null,
        bg: f.bg,
        linkUrl: f.linkUrl.trim() || undefined,
        isActive: editing?.isActive ?? true,
        sortOrder: editing?.sortOrder ?? banners.length + 1,
      });
      show("Saved locally (DB notice: " + err.message + ")");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    deleteBanner(id);
    try {
      await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
      show("Banner deleted ✅");
    } catch (err: any) {
      show("Banner deleted locally");
    }
  };

  const toggleActive = async (b: Banner) => {
    const nextState = !b.isActive;
    upsertBanner({ ...b, isActive: nextState });

    try {
      const res = await fetch("/api/admin/banners", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: b.id, isActive: nextState }),
      });
      const data = await res.json();
      if (res.ok && data.banner) {
        upsertBanner(data.banner);
      }
    } catch (err) {
      console.warn("Banner toggle error:", err);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Banners</h1>
          <p className="text-xs text-slate-500">Manage promotional banners for the storefront carousel</p>
        </div>
        <button onClick={startNew} className="btn-primary">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="space-y-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs"
          >
            <div
              className={clsx(
                "relative flex h-28 items-center justify-between bg-gradient-to-r px-5 text-white overflow-hidden",
                b.bg
              )}
            >
              {b.imageUrl && (
                <div className="absolute inset-0 z-0 opacity-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="relative z-10">
                <p className="text-lg font-bold">{b.title}</p>
                <p className="text-sm opacity-90">{b.subtitle}</p>
              </div>
              <span className="relative z-10 text-4xl">{b.emoji}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                {b.linkUrl ? `Link: ${b.linkUrl}` : "No link"} ·{" "}
                <span className={b.isActive ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
                  {b.isActive ? "Active" : "Hidden"}
                </span>
                {b.imageUrl && " · 🖼️ Custom Image"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleActive(b)}
                  className={`text-xs font-semibold ${
                    b.isActive ? "text-slate-500 hover:text-red-600" : "text-emerald-700 font-bold"
                  }`}
                >
                  {b.isActive ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => startEdit(b)}
                  className="text-sm font-semibold text-brand-dark hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="mb-3 text-lg font-bold text-slate-900">
              {editing ? "Edit Banner" : "New Banner"}
            </h2>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="e.g. Fresh Mangoes Season"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <label className="mb-1 block text-sm font-medium text-slate-700">Subtitle</label>
            <input
              value={f.subtitle}
              onChange={(e) => setF({ ...f, subtitle: e.target.value })}
              placeholder="e.g. Up to 40% OFF this week"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            
            <div className="mb-3">
              <ImageUploader
                imageUrl={f.imageUrl}
                onChange={(url) => setF({ ...f, imageUrl: url })}
                label="Banner Image (Cloudflare R2)"
                folder="banners"
              />
            </div>

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Link (e.g. /category/fruits-vegetables)
            </label>
            <input
              value={f.linkUrl}
              onChange={(e) => setF({ ...f, linkUrl: e.target.value })}
              placeholder="/category/fruits-vegetables"
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <label className="mb-1 block text-sm font-medium text-slate-700">Background Gradient</label>
            <div className="mb-3 flex gap-2">
              {BGS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setF({ ...f, bg: bg.value })}
                  className={clsx(
                    "h-8 w-8 rounded-full bg-gradient-to-r",
                    bg.value,
                    f.bg === bg.value && "ring-2 ring-offset-2 ring-slate-900"
                  )}
                />
              ))}
            </div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Icon</label>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setF({ ...f, emoji: em })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition ${
                    f.emoji === em ? "bg-brand-100 ring-2 ring-brand" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={save}
                disabled={saving || !f.title.trim()}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Loader2 size={15} className="animate-spin" /> Saving...
                  </span>
                ) : (
                  "Save Banner"
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
