"use client";
import { Suspense, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useShop } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/misc";
import { useToast, ToastHost } from "@/components/toast";
import {
  formatDateTime,
  formatMoney,
  ORDER_STATUS_LABEL,
} from "@/lib/format";
import { useHydrated } from "@/lib/useHydrated";
import { Skel } from "@/components/skeletons";
import type { OrderStatus } from "@/lib/types";
import { Check } from "lucide-react";

const TIMELINE: OrderStatus[] = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function OrderDetail({ orderId }: { orderId: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const params = useSearchParams();
  const orders = useShop((s) => s.orders);
  const cancelOrder = useShop((s) => s.cancelOrder);
  const show = useToast((s) => s.show);
  const placed = params.get("placed") === "true";

  useEffect(() => {
    if (placed) show("Order placed! 🎉");
  }, [placed, show]);

  if (!hydrated)
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-surface-muted">
        <div className="flex items-center gap-3 border-b border-surface-border bg-white px-4 py-3">
          <Skel className="h-6 w-6 rounded-full" />
          <Skel className="h-5 w-40" />
        </div>
        <div className="space-y-2 p-3">
          <Skel className="h-48 w-full rounded-lg" />
          <Skel className="h-24 w-full rounded-lg" />
          <Skel className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white">
        <PageHeader title="Order" fallbackHref="/orders" />
        <EmptyState emoji="🔍" title="Order not found" ctaLabel="My Orders" ctaHref="/orders" />
      </div>
    );
  }

  const cancelled = order.status === "CANCELLED";
  const currentIdx = TIMELINE.indexOf(order.status);
  const reached = (s: OrderStatus) => {
    const found = order.statusHistory.find((h) => h.status === s);
    return found?.at;
  };

  return (
    <div className="content-in mx-auto min-h-screen max-w-2xl bg-surface-muted pb-10">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={formatDateTime(order.createdAt)}
        fallbackHref="/orders"
      />

      {/* Timeline */}
      <section className="mt-2 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold">
          {cancelled ? "Order cancelled" : "Order status"}
        </h2>
        {cancelled ? (
          <p className="rounded bg-red-50 px-3 py-2 text-sm font-medium text-status-error">
            This order was cancelled. Stock has been restored.
          </p>
        ) : (
          <div className="relative">
            {TIMELINE.map((s, i) => {
              const done = i <= currentIdx;
              const current = i === currentIdx;
              const at = reached(s);
              return (
                <div key={s} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        done ? "bg-brand text-white" : "bg-surface-border"
                      } ${current ? "ring-4 ring-brand-100" : ""}`}
                    >
                      {done && <Check size={13} />}
                    </span>
                    {i < TIMELINE.length - 1 && (
                      <span
                        className={`w-0.5 flex-1 ${
                          i < currentIdx ? "bg-brand" : "bg-surface-border"
                        }`}
                        style={{ minHeight: 24 }}
                      />
                    )}
                  </div>
                  <div className="pb-4">
                    <p
                      className={`text-sm ${
                        done ? "font-semibold text-ink" : "text-ink-subtle"
                      }`}
                    >
                      {ORDER_STATUS_LABEL[s]}
                    </p>
                    {at && (
                      <p className="text-2xs text-ink-subtle">
                        {formatDateTime(at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Address */}
      <section className="mt-2 bg-white p-4">
        <h2 className="mb-1 text-sm font-semibold">Delivery Address</h2>
        <p className="text-sm font-medium">{order.address.name}</p>
        <p className="text-xs text-ink-muted">
          {order.address.line1}, {order.address.line2 ? order.address.line2 + ", " : ""}
          {order.address.landmark ? order.address.landmark + ", " : ""}
          {order.address.city}, {order.address.state} - {order.address.pincode}
        </p>
        <p className="text-xs text-ink-subtle">{order.address.phone}</p>
      </section>

      {/* Items */}
      <section className="mt-2 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold">
          Items ({order.items.length})
        </h2>
        <div className="space-y-2">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-muted text-xl">
                {it.emoji}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{it.name}</p>
                <p className="text-2xs text-ink-subtle">
                  {it.unit} · Qty {it.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold">{formatMoney(it.subtotal)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Payment + bill */}
      <section className="mt-2 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Payment</h2>
            <p className="text-xs text-ink-muted">Cash on Delivery</p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
              order.paymentStatus === "COLLECTED"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {order.paymentStatus === "COLLECTED" ? "Paid" : "Pending"}
          </span>
        </div>
        <Row label="Item total" value={formatMoney(order.subtotal)} />
        <Row
          label="Delivery fee"
          value={order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)}
        />
        <div className="my-2 border-t border-dashed border-surface-border" />
        <Row label="Total" value={formatMoney(order.total)} bold />
      </section>

      {order.status === "PLACED" && (
        <div className="p-4">
          <button
            onClick={() => {
              cancelOrder(order.id);
              show("Order cancelled");
            }}
            className="w-full rounded-md border border-status-error py-2.5 text-sm font-semibold text-status-error active:scale-[0.98]"
          >
            Cancel Order
          </button>
        </div>
      )}
      <ToastHost />
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

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  return (
    <Suspense fallback={null}>
      <OrderDetail orderId={orderId} />
    </Suspense>
  );
}
