"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
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
  const [editing, setEditing] = useState<Banner | null>(null);
  const [f, setF] = useState({
    title: "",
    subtitle: "",
    emoji: "🍓",
    bg: BGS[0].value,
    linkUrl: "",
  });

  if (!hydrated) return <AdminTableSkeleton />;

  const startNew = () => {
    setEditing(null);
    setF({ title: "", subtitle: "", emoji: "🍓", bg: BGS[0].value, linkUrl: "" });
    setOpen(true);
  };
  const startEdit = (b: Banner) => {
    setEditing(b);
    setF({
      title: b.title,
      subtitle: b.subtitle,
      emoji: b.emoji,
      bg: b.bg,
      linkUrl: b.linkUrl ?? "",
    });
    setOpen(true);
  };
  const save = () => {
    if (!f.title.trim()) return;
    upsertBanner({
      id: editing?.id ?? "ban_" + Date.now(),
      title: f.title.trim(),
      subtitle: f.subtitle.trim(),
      emoji: f.emoji,
      bg: f.bg,
      linkUrl: f.linkUrl.trim() || undefined,
      isActive: editing?.isActive ?? true,
      sortOrder: editing?.sortOrder ?? banners.length + 1,
    });
    show(editing ? "Banner updated" : "Banner created");
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Banners</h1>
        <button onClick={startNew} className="btn-primary">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      <div className="space-y-3">
        {banners.map((b) => (
          <div
            key={b.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white"
          >
            <div
              className={clsx(
                "flex h-28 items-center justify-between bg-gradient-to-r px-5 text-white",
                b.bg
              )}
            >
              <div>
                <p className="text-lg font-bold">{b.title}</p>
                <p className="text-sm opacity-90">{b.subtitle}</p>
              </div>
              <span className="text-4xl">{b.emoji}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-xs text-slate-400">
                {b.linkUrl ?? "no link"} ·{" "}
                {b.isActive ? "Active" : "Hidden"}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    upsertBanner({ ...b, isActive: !b.isActive })
                  }
                  className="text-xs font-semibold text-slate-500"
                >
                  {b.isActive ? "Hide" : "Show"}
                </button>
                <button
                  onClick={() => startEdit(b)}
                  className="text-sm font-semibold text-brand-dark"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    deleteBanner(b.id);
                    show("Banner deleted");
                  }}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <h2 className="mb-3 text-lg font-bold">
              {editing ? "Edit Banner" : "New Banner"}
            </h2>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <input
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <label className="mb-1 block text-sm font-medium">Subtitle</label>
            <input
              value={f.subtitle}
              onChange={(e) => setF({ ...f, subtitle: e.target.value })}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <label className="mb-1 block text-sm font-medium">
              Link (e.g. /category/fruits-vegetables)
            </label>
            <input
              value={f.linkUrl}
              onChange={(e) => setF({ ...f, linkUrl: e.target.value })}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <label className="mb-1 block text-sm font-medium">Colour</label>
            <div className="mb-3 flex gap-2">
              {BGS.map((bg) => (
                <button
                  key={bg.value}
                  onClick={() => setF({ ...f, bg: bg.value })}
                  className={clsx(
                    "h-8 w-8 rounded-full bg-gradient-to-r",
                    bg.value,
                    f.bg === bg.value && "ring-2 ring-offset-2 ring-slate-900"
                  )}
                />
              ))}
            </div>
            <label className="mb-1 block text-sm font-medium">Icon</label>
            <div className="mb-4 flex flex-wrap gap-1">
              {EMOJIS.map((em) => (
                <button
                  key={em}
                  onClick={() => setF({ ...f, emoji: em })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl ${
                    f.emoji === em ? "bg-brand-100 ring-2 ring-brand" : "bg-slate-50"
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
