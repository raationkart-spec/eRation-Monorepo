"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "@/lib/store";
import { OrderStatusBadge } from "@/components/misc";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { Order, OrderStatus } from "@/lib/types";
import { ShoppingBag, RefreshCw, Search } from "lucide-react";

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
  const shopOrders = useShop((s) => s.orders);
  const addOrder = useShop((s) => s.addOrder);

  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  const [q, setQ] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setDbOrders(data.orders);
          // Sync with local shop store
          data.orders.forEach((o: Order) => addOrder(o));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch database orders, fallback to local store:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated) {
      fetchOrders();
    }
  }, [hydrated]);

  if (!hydrated || loading) return <AdminTableSkeleton />;

  // Combine DB orders with local shop store orders without duplicates
  const allOrdersMap = new Map<string, Order>();
  shopOrders.forEach((o) => allOrdersMap.set(o.id, o));
  dbOrders.forEach((o) => allOrdersMap.set(o.id, o));
  const combinedOrders = Array.from(allOrdersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = combinedOrders.filter(
    (o) =>
      (filter === "ALL" || o.status === filter) &&
      (!q ||
        o.orderNumber.toLowerCase().includes(q.toLowerCase()) ||
        o.customerName.toLowerCase().includes(q.toLowerCase()) ||
        o.customerPhone.includes(q))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="text-brand" /> Order Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time customer orders from Database, change statuses &amp; manage fulfillments.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh DB Orders
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand">
            <Search size={16} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search order # / customer name / phone..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pt-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold transition ${
                filter === s
                  ? "bg-brand text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "ALL" ? "All Orders" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm font-semibold text-slate-400">
          No database orders {filter !== "ALL" ? `with status ${filter}` : "found"}.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-2xs uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="font-bold text-slate-900">{o.customerName}</div>
                      <div className="text-2xs text-slate-400 font-medium">
                        📞 {o.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {o.items.reduce((n, i) => n + i.quantity, 0)} item
                      {o.items.reduce((n, i) => n + i.quantity, 0) > 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      {formatMoney(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-2xs font-extrabold ${
                          o.paymentStatus === "COLLECTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {o.paymentMethod} · {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-2xs text-slate-500 font-semibold">
                      {formatDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-brand hover:text-white transition"
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
