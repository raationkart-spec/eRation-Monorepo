"use client";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useShop } from "@/lib/store";
import { OrderStatusBadge } from "@/components/misc";
import { useToast } from "@/components/toast";
import {
  formatDateTime,
  formatMoney,
  ORDER_STATUS_LABEL,
} from "@/lib/format";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { OrderStatus } from "@/lib/types";

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PACKED",
  PACKED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
};

export default function AdminOrderDetail({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const hydrated = useHydrated();
  const orders = useShop((s) => s.orders);
  const updateStatus = useShop((s) => s.updateOrderStatus);
  const show = useToast((s) => s.show);

  if (!hydrated) return <AdminTableSkeleton />;
  const order = orders.find((o) => o.id === orderId);
  if (!order) return <p className="text-slate-500">Order not found.</p>;

  const next = NEXT[order.status];
  const canCancel =
    order.status !== "DELIVERED" && order.status !== "CANCELLED";

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/orders"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500"
      >
        <ChevronLeft size={16} /> Orders
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-slate-500">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Actions */}
      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
        {next && (
          <button
            onClick={() => {
              updateStatus(order.id, next);
              show(`Marked as ${ORDER_STATUS_LABEL[next]}`);
            }}
            className="btn-primary"
          >
            Mark as {ORDER_STATUS_LABEL[next]}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => {
              updateStatus(order.id, "CANCELLED", "Cancelled by admin");
              show("Order cancelled");
            }}
            className="rounded-md border border-red-300 px-4 py-2.5 text-base font-semibold text-red-600"
          >
            Cancel Order
          </button>
        )}
        {!next && !canCancel && (
          <p className="text-sm text-slate-500">
            This order is {ORDER_STATUS_LABEL[order.status].toLowerCase()}. No
            further actions.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Customer + address */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-slate-900">Customer</h2>
          <p className="text-sm font-medium">{order.customerName}</p>
          <p className="text-sm text-slate-500">{order.customerPhone}</p>
          <div className="my-3 border-t border-slate-100" />
          <h2 className="mb-1 font-semibold text-slate-900">
            Delivery Address
          </h2>
          <p className="text-sm text-slate-600">
            {order.address.line1},{" "}
            {order.address.line2 ? order.address.line2 + ", " : ""}
            {order.address.landmark ? order.address.landmark + ", " : ""}
            {order.address.city}, {order.address.state} -{" "}
            {order.address.pincode}
          </p>
          <div className="my-3 border-t border-slate-100" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Payment · {order.paymentMethod}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
                order.paymentStatus === "COLLECTED"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Items + bill */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-semibold text-slate-900">
            Items ({order.items.length})
          </h2>
          <div className="space-y-2">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{it.emoji}</span>
                <span className="flex-1">
                  {it.name}{" "}
                  <span className="text-slate-400">× {it.quantity}</span>
                </span>
                <span className="font-medium">{formatMoney(it.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-dashed border-slate-200" />
          <Row label="Subtotal" value={formatMoney(order.subtotal)} />
          <Row
            label="Delivery"
            value={
              order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)
            }
          />
          <Row label="Total" value={formatMoney(order.total)} bold />
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 font-semibold text-slate-900">Status History</h2>
        <div className="space-y-2">
          {order.statusHistory.map((h, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="h-2 w-2 rounded-full bg-brand" />
              <span className="font-medium">{ORDER_STATUS_LABEL[h.status]}</span>
              {h.note && <span className="text-slate-400">· {h.note}</span>}
              <span className="ml-auto text-xs text-slate-400">
                {formatDateTime(h.at)}
              </span>
            </div>
          ))}
        </div>
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
        bold ? "font-bold text-slate-900" : "text-slate-500"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
