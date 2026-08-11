"use client";
import { Suspense, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useShop } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/misc";
import { ProductImage } from "@/components/ProductImage";
import { useToast, ToastHost } from "@/components/toast";
import {
  formatDateTime,
  formatMoney,
  ORDER_STATUS_LABEL,
} from "@/lib/format";
import { useHydrated } from "@/lib/useHydrated";
import { Skel } from "@/components/skeletons";
import type { OrderStatus } from "@/lib/types";
import { Check, XCircle } from "lucide-react";

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
      <div className="mx-auto min-h-screen max-w-2xl bg-slate-50">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <Skel className="h-6 w-6 rounded-full" />
          <Skel className="h-5 w-40" />
        </div>
        <div className="space-y-3 p-4">
          <Skel className="h-48 w-full rounded-2xl" />
          <Skel className="h-24 w-full rounded-2xl" />
          <Skel className="h-32 w-full rounded-2xl" />
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
    <div className="mx-auto min-h-screen max-w-2xl bg-slate-50 pb-36">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        subtitle={formatDateTime(order.createdAt)}
        fallbackHref="/orders"
      />

      <div className="space-y-4 p-4">
        {/* Timeline Status Card matching Stitch */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-slate-900">
            {cancelled ? "Order Status: Cancelled" : "Tracking & Status"}
          </h2>
          {cancelled ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 flex items-center gap-2">
              <XCircle size={18} className="shrink-0 text-red-600" />
              <span>This order was cancelled. Stock has been restored.</span>
            </div>
          ) : (
            <div className="relative pl-1">
              {TIMELINE.map((s, i) => {
                const done = i <= currentIdx;
                const current = i === currentIdx;
                const at = reached(s);
                return (
                  <div key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          done ? "bg-orange-600 text-white shadow-xs" : "bg-slate-200 text-slate-500"
                        } ${current ? "ring-4 ring-orange-100" : ""}`}
                      >
                        {done && <Check size={13} />}
                      </span>
                      {i < TIMELINE.length - 1 && (
                        <span
                          className={`w-0.5 flex-1 ${
                            i < currentIdx ? "bg-orange-600" : "bg-slate-200"
                          }`}
                          style={{ minHeight: 28 }}
                        />
                      )}
                    </div>
                    <div className="pb-5">
                      <p
                        className={`text-xs ${
                          done ? "font-extrabold text-slate-900" : "font-medium text-slate-400"
                        }`}
                      >
                        {ORDER_STATUS_LABEL[s]}
                      </p>
                      {at && (
                        <p className="text-2xs font-semibold text-slate-400">
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

        {/* Address Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-1">
          <h2 className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">Delivery Address</h2>
          <p className="text-sm font-bold text-slate-900">{order.address.name}</p>
          <p className="text-xs font-medium text-slate-600">
            {order.address.line1}, {order.address.line2 ? order.address.line2 + ", " : ""}
            {order.address.landmark ? order.address.landmark + ", " : ""}
            {order.address.city}, {order.address.state} - {order.address.pincode}
          </p>
          <p className="text-xs font-semibold text-slate-500 pt-0.5">{order.address.phone}</p>
        </section>

        {/* Items List Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Items Ordered ({order.items.length})
          </h2>
          <div className="divide-y divide-slate-100 space-y-3">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 pt-3 first:pt-0">
                <ProductImage
                  imageUrl={it.imageUrl}
                  emoji={it.emoji}
                  alt={it.name}
                  className="h-12 w-12 rounded-xl border border-slate-100 shrink-0"
                  size="text-2xl"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{it.name}</p>
                  <p className="text-2xs font-semibold text-slate-500">
                    {it.unit} · Qty {it.quantity}
                  </p>
                </div>
                <p className="text-xs font-black text-slate-900">{formatMoney(it.subtotal)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Payment Summary */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Payment</h2>
              <p className="text-xs font-bold text-slate-800">
                {order.paymentMethod === "COD" ? "Pay on Delivery (COD)" : "Google Pay / UPI"}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-2xs font-extrabold ${
                order.paymentStatus === "COLLECTED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.paymentStatus === "COLLECTED" ? "Paid" : "Pending"}
            </span>
          </div>

          <div className="space-y-1 text-xs font-semibold text-slate-600 pt-1">
            <div className="flex justify-between">
              <span>Item total</span>
              <span className="text-slate-900">{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery fee</span>
              <span className="text-slate-900">
                {order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
              <span>Grand Total</span>
              <span className="text-orange-600">{formatMoney(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Cancel Order Action Button - Properly Padded & Prominent */}
        {order.status === "PLACED" && (
          <div className="pt-2">
            <button
              onClick={() => {
                cancelOrder(order.id);
                show("Order cancelled");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 py-3.5 text-sm font-bold text-red-600 shadow-sm transition hover:bg-red-100 active:scale-95"
            >
              <XCircle size={18} /> Cancel Order
            </button>
          </div>
        )}
      </div>
      <ToastHost />
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
