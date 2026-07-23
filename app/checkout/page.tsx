"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Wallet } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/misc";
import {
  useAuth,
  useCart,
  useCatalog,
  useShop,
  makeOrderNumber,
} from "@/lib/store";
import { useCartComputed } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { CartSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { Order } from "@/lib/types";

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const addresses = useShop((s) => s.addresses);
  const orders = useShop((s) => s.orders);
  const addOrder = useShop((s) => s.addOrder);
  const pincodes = useCatalog((s) => s.pincodes);
  const clearCart = useCart((s) => s.clear);
  const { lines, subtotal, deliveryFee, total } = useCartComputed();

  const [selectedId, setSelectedId] = useState<string>("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?returnTo=/checkout");
      return;
    }
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (def && !selectedId) setSelectedId(def.id);
  }, [hydrated, user, addresses, selectedId, router]);

  if (!hydrated || !user) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white">
        <PageHeader title="Checkout" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          ctaLabel="Start shopping"
          ctaHref="/"
        />
      </div>
    );
  }

  const selected = addresses.find((a) => a.id === selectedId);
  const serviceable = selected ? pincodes.includes(selected.pincode) : false;

  const placeOrder = () => {
    if (!selected || !serviceable) return;
    setPlacing(true);
    const order: Order = {
      id: "ord_" + Date.now(),
      orderNumber: makeOrderNumber(orders.length + 1),
      items: lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        unit: l.product.unit,
        emoji: l.product.emoji,
        price: l.product.price,
        mrp: l.product.mrp,
        quantity: l.quantity,
        subtotal: l.lineTotal,
      })),
      address: {
        label: selected.label,
        name: selected.name,
        phone: selected.phone,
        line1: selected.line1,
        line2: selected.line2,
        landmark: selected.landmark,
        city: selected.city,
        state: selected.state,
        pincode: selected.pincode,
      },
      status: "PLACED",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: "PLACED", at: new Date().toISOString() }],
      customerName: user.name,
      customerPhone: user.phone ?? selected.phone,
    };
    addOrder(order);
    clearCart();
    setTimeout(() => router.replace(`/orders/${order.id}?placed=true`), 400);
  };

  return (
    <div className="content-in mx-auto min-h-screen max-w-2xl bg-surface-muted pb-32">
      <PageHeader title="Checkout" />

      {/* Address */}
      <section className="mt-2 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Deliver to</h2>
        {addresses.length === 0 ? (
          <Link
            href="/account/addresses/new?returnTo=/checkout"
            className="btn-secondary w-full"
          >
            <Plus size={16} /> Add delivery address
          </Link>
        ) : (
          <div className="space-y-2">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left ${
                  selectedId === a.id
                    ? "border-brand bg-brand-50"
                    : "border-surface-border"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selectedId === a.id
                      ? "border-brand bg-brand text-white"
                      : "border-surface-border"
                  }`}
                >
                  {selectedId === a.id && <Check size={12} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {a.label ?? "Address"} · {a.name}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {a.line1}, {a.line2 ? a.line2 + ", " : ""}
                    {a.city}, {a.state} - {a.pincode}
                  </p>
                  <p className="text-xs text-ink-subtle">{a.phone}</p>
                </div>
              </button>
            ))}
            <Link
              href="/account/addresses/new?returnTo=/checkout"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark"
            >
              <Plus size={14} /> Add new address
            </Link>
          </div>
        )}
        {selected && !serviceable && (
          <p className="mt-2 rounded bg-red-50 px-2 py-1.5 text-xs font-medium text-status-error">
            Delivery not available to {selected.pincode}. Try pincode 560001.
          </p>
        )}
      </section>

      {/* Payment */}
      <section className="mt-2 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Payment</h2>
        <div className="flex items-center gap-3 rounded-lg border border-brand bg-brand-50 p-3">
          <Wallet size={20} className="text-brand-dark" />
          <span className="flex-1 text-sm font-semibold">Cash on Delivery</span>
          <Check size={18} className="text-brand-dark" />
        </div>
        <p className="mt-1.5 text-2xs text-ink-subtle">
          Online payment (UPI/Cards) coming soon.
        </p>
      </section>

      {/* Summary */}
      <section className="mt-2 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">Order Summary</h2>
        <div className="space-y-1">
          {lines.map((l) => (
            <div
              key={l.product.id}
              className="flex justify-between text-xs text-ink-muted"
            >
              <span className="truncate pr-2">
                {l.product.emoji} {l.product.name} × {l.quantity}
              </span>
              <span>{formatMoney(l.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="my-2 border-t border-dashed border-surface-border" />
        <Row label="Item total" value={formatMoney(subtotal)} />
        <Row
          label="Delivery fee"
          value={deliveryFee === 0 ? "FREE" : formatMoney(deliveryFee)}
        />
        <Row label="Total" value={formatMoney(total)} bold />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl border-t border-surface-border bg-white p-3">
        <button
          disabled={!selected || !serviceable || placing}
          onClick={placeOrder}
          className="btn-primary w-full flex-col gap-0 py-3 disabled:opacity-50"
        >
          <span>{placing ? "Placing order..." : "Place Order →"}</span>
          <span className="text-xs font-normal opacity-90">
            Pay {formatMoney(total)} on delivery
          </span>
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-0.5 text-sm ${
        bold ? "font-bold text-ink" : "text-ink-muted"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
