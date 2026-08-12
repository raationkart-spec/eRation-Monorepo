"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCatalog, useShop } from "@/lib/store";
import { INDIA_STATES } from "@/lib/data";

function AddressForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/account/addresses";
  const addAddress = useShop((s) => s.addAddress);
  const pincodes = useCatalog((s) => s.pincodes);

  const [form, setForm] = useState({
    label: "Home",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "Siliguri",
    state: "West Bengal",
    pincode: "734001",
    isDefault: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter full recipient name";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter valid 10-digit mobile number";
    if (form.line1.trim().length < 4) e.line1 = "Enter house/flat & street address";
    if (!form.city.trim()) e.city = "Enter city";
    if (!/^\d{6}$/.test(form.pincode)) {
      e.pincode = "Enter a valid 6-digit pincode";
    } else if (pincodes.length > 0 && !pincodes.includes(form.pincode)) {
      e.pincode = `🚫 We do not deliver to pincode ${form.pincode}. We currently deliver only to Siliguri pincodes: ${pincodes.join(", ")}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    addAddress({
      label: form.label,
      name: form.name.trim(),
      phone: form.phone,
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      state: form.state,
      pincode: form.pincode,
      isDefault: form.isDefault,
    });
    router.replace(returnTo);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Add Siliguri Delivery Address</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enter recipient details for 10-minute grocery delivery.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          {["Home", "Office", "Other"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => set("label", l)}
              className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition ${
                form.label === l
                  ? "border-orange-500 bg-orange-50 text-orange-700 shadow-2xs"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        <Field label="Full Name" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input font-semibold"
            placeholder="Recipient name"
          />
        </Field>

        <Field label="Mobile Number" error={errors.phone}>
          <input
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
            className="input font-semibold"
            placeholder="10-digit mobile"
          />
        </Field>

        <Field label="Flat / House No. &amp; Building" error={errors.line1}>
          <input
            value={form.line1}
            onChange={(e) => set("line1", e.target.value)}
            className="input"
            placeholder="e.g. Apt 302, Pradhan Nagar"
          />
        </Field>

        <Field label="Street / Area (optional)">
          <input
            value={form.line2}
            onChange={(e) => set("line2", e.target.value)}
            className="input"
            placeholder="e.g. Hill Cart Road"
          />
        </Field>

        <Field label="Landmark (optional)">
          <input
            value={form.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            className="input"
            placeholder="e.g. Near Air View Complex"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City" error={errors.city}>
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="input font-bold"
            />
          </Field>
          <Field label="Pincode" error={errors.pincode}>
            <input
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
              className="input font-extrabold text-slate-900"
              placeholder="734001"
            />
          </Field>
        </div>

        {/* Available Serviceable Pincodes Hint */}
        <div className="rounded-xl bg-orange-50/80 p-3 border border-orange-200/80 text-2xs text-orange-900 space-y-1">
          <p className="font-extrabold uppercase tracking-wider text-orange-800">
            ⚡ Serviceable Siliguri Pincodes:
          </p>
          <p className="font-bold flex flex-wrap gap-1">
            {pincodes.map((pin) => (
              <span
                key={pin}
                onClick={() => set("pincode", pin)}
                className="cursor-pointer rounded bg-white px-1.5 py-0.5 border border-orange-300 hover:bg-orange-600 hover:text-white transition"
              >
                {pin}
              </span>
            ))}
          </p>
        </div>

        <Field label="State">
          <select
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            className="input font-semibold"
          >
            {INDIA_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="h-4 w-4 rounded accent-orange-600"
          />
          Set as default delivery address
        </label>

        <button
          type="button"
          onClick={submit}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 py-3 text-xs font-extrabold text-white shadow-md hover:from-orange-600 hover:to-amber-700 active:scale-95 transition"
        >
          Save Siliguri Delivery Address
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 9px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }
        :global(.input:focus) {
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
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-bold text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-2xs font-bold text-red-600">{error}</p>}
    </div>
  );
}

export default function NewAddressPage() {
  return (
    <Suspense fallback={null}>
      <AddressForm />
    </Suspense>
  );
}
