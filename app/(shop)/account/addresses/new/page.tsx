"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useShop } from "@/lib/store";
import { INDIA_STATES } from "@/lib/data";

function AddressForm() {
  const router = useRouter();
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/account/addresses";
  const addAddress = useShop((s) => s.addAddress);

  const [form, setForm] = useState({
    label: "Home",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "Karnataka",
    pincode: "",
    isDefault: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Enter full name";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter valid 10-digit mobile";
    if (form.line1.trim().length < 5) e.line1 = "Enter house/flat & building";
    if (!form.city.trim()) e.city = "Enter city";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter 6-digit pincode";
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
    <div>
      <h1 className="mb-4 text-2xl font-bold">Add Address</h1>

      <div className="space-y-3">
        <div className="flex gap-2">
          {["Home", "Office", "Other"].map((l) => (
            <button
              key={l}
              onClick={() => set("label", l)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                form.label === l
                  ? "border-brand bg-brand-50 text-brand-dark"
                  : "border-surface-border text-ink-muted"
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
            className="input"
            placeholder="Recipient name"
          />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
            className="input"
            placeholder="10-digit mobile"
          />
        </Field>
        <Field label="House / Flat No., Building" error={errors.line1}>
          <input
            value={form.line1}
            onChange={(e) => set("line1", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Street / Area (optional)">
          <input
            value={form.line2}
            onChange={(e) => set("line2", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Landmark (optional)">
          <input
            value={form.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            className="input"
          />
        </Field>
        <div className="flex gap-3">
          <Field label="City" error={errors.city} className="flex-1">
            <input
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Pincode" error={errors.pincode} className="flex-1">
            <input
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
              className="input"
              placeholder="560001"
            />
          </Field>
        </div>
        <Field label="State">
          <select
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            className="input"
          >
            {INDIA_STATES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Set as default address
        </label>

        <button onClick={submit} className="btn-primary w-full">
          Save Address
        </button>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border: 1px solid #eaecee;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
        }
        :global(.input:focus) {
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
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-2xs text-status-error">{error}</p>}
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
