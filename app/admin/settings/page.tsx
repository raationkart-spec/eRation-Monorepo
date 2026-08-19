"use client";
import { useState } from "react";
import { Trash2, RotateCcw, Loader2 } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function AdminSettings() {
  const hydrated = useHydrated();
  const config = useCatalog((s) => s.config);
  const setConfig = useCatalog((s) => s.setConfig);
  const pincodes = useCatalog((s) => s.pincodes);
  const setPincodesFull = useCatalog((s) => s.setPincodesFull);
  const addPincodes = useCatalog((s) => s.addPincodes);
  const removePincode = useCatalog((s) => s.removePincode);
  const resetCatalog = useCatalog((s) => s.resetCatalog);
  const show = useToast((s) => s.show);

  const [form, setForm] = useState({
    store_name: config.store_name,
    store_phone: config.store_phone,
    store_address: config.store_address,
    delivery_fee: String(config.delivery_fee / 100),
    free_delivery_above: String(config.free_delivery_above / 100),
  });
  const [newPins, setNewPins] = useState("");
  const [saving, setSaving] = useState(false);

  if (!hydrated) return <AdminTableSkeleton />;

  const saveConfig = async () => {
    setSaving(true);
    const deliveryFeePaise = Math.round(parseFloat(form.delivery_fee || "0") * 100);
    const freeAbovePaise = Math.round(
      parseFloat(form.free_delivery_above || "0") * 100
    );

    // 1. Local Zustand update
    setConfig({
      store_name: form.store_name,
      store_phone: form.store_phone,
      store_address: form.store_address,
      delivery_fee: deliveryFeePaise,
      free_delivery_above: freeAbovePaise,
    });

    // 2. Persist to DB
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.store_name,
          deliveryFee: deliveryFeePaise,
          freeDeliveryThreshold: freeAbovePaise,
        }),
      });
      if (!res.ok) throw new Error("Failed to persist to database");
      show("Settings saved to database ✅");
    } catch (err: any) {
      show("Saved locally (DB notice: " + err.message + ")");
    } finally {
      setSaving(false);
    }
  };

  const addPins = async () => {
    const codes = newPins
      .split(/[\s,]+/)
      .map((c) => c.trim())
      .filter((c) => /^\d{6}$/.test(c));

    if (!codes.length) return;

    addPincodes(codes);
    setNewPins("");

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincodesToAdd: codes }),
      });
      const data = await res.json();
      if (res.ok && data.pincodes) {
        setPincodesFull(data.pincodes);
      }
      show(`${codes.length} pincode(s) added & saved ✅`);
    } catch (err) {
      show(`${codes.length} pincode(s) added locally`);
    }
  };

  const handleRemovePin = async (pin: string) => {
    removePincode(pin);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincodeToRemove: pin }),
      });
      const data = await res.json();
      if (res.ok && data.pincodes) {
        setPincodesFull(data.pincodes);
      }
      show(`Pincode ${pin} removed`);
    } catch (err) {
      show(`Pincode ${pin} removed locally`);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* App config */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h2 className="mb-3 font-semibold text-slate-900">Store Settings</h2>
        <div className="space-y-3">
          <SField label="Store Name">
            <input
              value={form.store_name}
              onChange={(e) => setForm({ ...form, store_name: e.target.value })}
              className="sinput"
            />
          </SField>
          <SField label="Support Phone">
            <input
              value={form.store_phone}
              onChange={(e) => setForm({ ...form, store_phone: e.target.value })}
              className="sinput"
            />
          </SField>
          <SField label="Store Address">
            <textarea
              value={form.store_address}
              onChange={(e) =>
                setForm({ ...form, store_address: e.target.value })
              }
              rows={2}
              className="sinput"
            />
          </SField>
          <div className="grid grid-cols-2 gap-3">
            <SField label="Delivery Fee (₹)">
              <input
                inputMode="decimal"
                value={form.delivery_fee}
                onChange={(e) =>
                  setForm({ ...form, delivery_fee: e.target.value })
                }
                className="sinput"
              />
            </SField>
            <SField label="Free Delivery Above (₹)">
              <input
                inputMode="decimal"
                value={form.free_delivery_above}
                onChange={(e) =>
                  setForm({ ...form, free_delivery_above: e.target.value })
                }
                className="sinput"
              />
            </SField>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <Loader2 size={15} className="animate-spin" /> Saving...
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>

      {/* Pincodes */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h2 className="mb-1 font-semibold text-slate-900">
          Serviceable Pincodes
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          Orders can only be delivered to these pincodes.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {pincodes.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200"
            >
              {p}
              <button
                type="button"
                onClick={() => handleRemovePin(p)}
                className="text-slate-400 hover:text-red-600 ml-0.5"
              >
                <Trash2 size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newPins}
            onChange={(e) => setNewPins(e.target.value)}
            placeholder="Add 6-digit pincodes (e.g. 734001, 734002)"
            className="sinput flex-1"
          />
          <button onClick={addPins} className="btn-primary">
            Add
          </button>
        </div>
      </div>

      {/* Demo reset */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <h2 className="mb-1 font-semibold text-slate-900">Demo Controls</h2>
        <p className="mb-3 text-sm text-slate-500">
          Reset catalog, categories, banners &amp; settings back to the seeded
          demo data.
        </p>
        <button
          onClick={() => {
            resetCatalog();
            show("Catalog reset to demo defaults");
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <RotateCcw size={15} /> Reset demo data
        </button>
      </div>

      <style jsx global>{`
        .sinput {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }
        .sinput:focus {
          border-color: #f97316;
        }
      `}</style>
    </div>
  );
}

function SField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}
