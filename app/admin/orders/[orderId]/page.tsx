"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react";
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
import type { Order, OrderStatus } from "@/lib/types";

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
  const shopOrders = useShop((s) => s.orders);
  const updateStatus = useShop((s) => s.updateOrderStatus);
  const showToast = useToast((s) => s.show);

  const [dbOrder, setDbOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        const found = (data.orders || []).find((o: Order) => o.id === orderId);
        if (found) {
          setDbOrder(found);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch order detail from API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated) {
      fetchOrderDetail();
    }
  }, [hydrated, orderId]);

  if (!hydrated || loading) return <AdminTableSkeleton />;

  const order = dbOrder || shopOrders.find((o) => o.id === orderId);
  if (!order) {
    return (
      <div className="py-12 text-center">
        <p className="text-base font-bold text-slate-700">Order not found in Database.</p>
        <Link href="/admin/orders" className="text-xs font-bold text-brand hover:underline mt-2 inline-block">
          ← Return to Orders List
        </Link>
      </div>
    );
  }

  const next = NEXT[order.status];
  const canCancel = order.status !== "DELIVERED" && order.status !== "CANCELLED";

  const handleUpdateStatus = async (newStatus: OrderStatus, note?: string) => {
    setUpdating(true);
    try {
      // 1. Send update to Database API
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update status in database");
      }

      const resData = await res.json();
      if (resData.order) {
        setDbOrder((prev) => ({
          ...prev!,
          status: newStatus,
          statusHistory: resData.order.statusHistory || prev?.statusHistory,
        }));
      }

      // 2. Update local state
      updateStatus(order.id, newStatus, note);
      showToast(`Database updated: Marked as ${ORDER_STATUS_LABEL[newStatus]}`);
    } catch (err: any) {
      showToast(err.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
      >
        <ChevronLeft size={16} /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Order #{order.orderNumber}
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Action Control Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Order Status Controls (Database Action)
        </h3>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {next && (
            <button
              disabled={updating}
              onClick={() => handleUpdateStatus(next)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-orange-600 hover:to-amber-700 disabled:opacity-50"
            >
              <CheckCircle size={15} /> Advance to {ORDER_STATUS_LABEL[next]}
            </button>
          )}

          {canCancel && (
            <button
              disabled={updating}
              onClick={() => handleUpdateStatus("CANCELLED", "Cancelled by Admin")}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle size={15} /> Cancel Order &amp; Restore Stock
            </button>
          )}

          {!next && !canCancel && (
            <p className="text-xs font-bold text-slate-500">
              This order is completed ({ORDER_STATUS_LABEL[order.status]}). No further changes.
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Customer & Delivery Details */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Customer Information
          </h2>
          <div>
            <p className="text-sm font-extrabold text-slate-900">{order.customerName}</p>
            <p className="text-xs font-semibold text-slate-500">📞 {order.customerPhone}</p>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Delivery Address</h2>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {order.address.line1},{" "}
              {order.address.line2 ? order.address.line2 + ", " : ""}
              {order.address.landmark ? order.address.landmark + ", " : ""}
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </p>
          </div>

          <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Payment Method: {order.paymentMethod}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-2xs font-extrabold ${
                order.paymentStatus === "COLLECTED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Order Items & Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Purchased Items ({order.items.length})
          </h2>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{it.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate max-w-xs">{it.name}</p>
                    <p className="text-2xs text-slate-400">
                      {formatMoney(it.price)} × {it.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-slate-900">
                  {formatMoney(it.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span>{order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)}</span>
            </div>
            {(order.tokenDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>QuickCoins discount ({order.tokensRedeemed} coins):</span>
                <span className="text-amber-600">-{formatMoney(order.tokenDiscount ?? 0)}</span>
              </div>
            )}
            {(order.tokensEarned ?? 0) > 0 && (
              <div className="flex justify-between text-slate-500 italic">
                <span>QuickCoins awarded:</span>
                <span className="text-amber-500">+{order.tokensEarned} coins</span>
              </div>
            )}
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Amount:</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
          Order Status History &amp; Audit Log
        </h2>
        <div className="space-y-2">
          {order.statusHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand" />
                <span className="font-bold text-slate-800">
                  {ORDER_STATUS_LABEL[h.status]}
                </span>
                {h.note && <span className="text-slate-400">• {h.note}</span>}
              </div>
              <span className="text-2xs font-semibold text-slate-400">
                {formatDateTime(h.at)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
