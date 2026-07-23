"use client";
import Link from "next/link";
import { useState } from "react";
import { useShop } from "@/lib/store";
import { OrderStatusBadge } from "@/components/misc";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { OrderStatus } from "@/lib/types";

const STATUSES: (OrderStatus | "ALL")[] = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrders() {
  const hydrated = useHydrated();
  const orders = useShop((s) => s.orders);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");

  if (!hydrated) return <AdminTableSkeleton />;

  const filtered = orders.filter(
    (o) =>
      (filter === "ALL" || o.status === filter) &&
      (!q ||
        o.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
        o.customerName.toLowerCase().includes(q.toLowerCase()) ||
        o.customerPhone.includes(q))
  );

  return (
    <div className="content-in">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">Orders</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search order # / customer / phone"
        className="mb-3 w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === s
                ? "bg-brand text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200"
            }`}
          >
            {s === "ALL" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-400">
          No orders {filter !== "ALL" ? `with status ${filter}` : "yet"}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-slate-400">
                        {o.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {o.items.reduce((n, i) => n + i.quantity, 0)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatMoney(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-sm font-semibold text-brand-dark"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
