"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useCatalog, useShop } from "@/lib/store";
import { OrderStatusBadge } from "@/components/misc";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { Order } from "@/lib/types";

export default function AdminDashboard() {
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);
  const shopOrders = useShop((s) => s.orders);
  const addOrder = useShop((s) => s.addOrder);

  const [dbOrders, setDbOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        if (data.orders && Array.isArray(data.orders)) {
          setDbOrders(data.orders);
          data.orders.forEach((o: Order) => addOrder(o));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch database orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hydrated) {
      fetchOrders();
    }
  }, [hydrated]);

  if (!hydrated || loading) return <AdminDashboardSkeleton />;

  // Combine DB orders & local shop orders
  const allOrdersMap = new Map<string, Order>();
  shopOrders.forEach((o) => allOrdersMap.set(o.id, o));
  dbOrders.forEach((o) => allOrdersMap.set(o.id, o));
  const orders = Array.from(allOrdersMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const todayRevenue = todayOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((n, o) => n + o.total, 0);
  const pending = orders.filter(
    (o) => o.status === "PLACED" || o.status === "CONFIRMED" || o.status === "PACKED"
  ).length;
  const lowStock = products.filter(
    (p) => p.isActive && p.stockQty <= p.lowStockThreshold
  );

  const monthRevenue = orders
    .filter((o) => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return (
        o.status !== "CANCELLED" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time overview of database sales, orders &amp; inventory activity.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sync Database
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Today's Orders"
          value={String(todayOrders.length)}
          icon={<ShoppingBag size={18} />}
          color="text-blue-600 bg-blue-50"
        />
        <Stat
          label="Today's Revenue"
          value={formatMoney(todayRevenue)}
          icon={<IndianRupee size={18} />}
          color="text-emerald-600 bg-emerald-50"
        />
        <Stat
          label="Pending Fulfillments"
          value={String(pending)}
          icon={<Package size={18} />}
          color="text-amber-600 bg-amber-50"
        />
        <Stat
          label="Low Stock Alerts"
          value={String(lowStock.length)}
          icon={<AlertTriangle size={18} />}
          color="text-red-600 bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Stat
          label="This Month Total Revenue"
          value={formatMoney(monthRevenue)}
          icon={<IndianRupee size={18} />}
          color="text-emerald-600 bg-emerald-50"
        />
        <Stat
          label="Total Active Products"
          value={String(products.filter((p) => p.isActive).length)}
          icon={<Package size={18} />}
          color="text-slate-600 bg-slate-100"
        />
      </div>

      {/* Recent orders */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900">Recent Database Orders</h2>
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-brand hover:underline"
          >
            View all orders →
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-xs font-semibold text-slate-400">
            No orders found in database yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-2xs uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                  <th className="pb-2 font-bold">Order #</th>
                  <th className="pb-2 font-bold">Customer</th>
                  <th className="pb-2 font-bold">Total</th>
                  <th className="pb-2 font-bold">Status</th>
                  <th className="pb-2 font-bold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-bold text-slate-900 hover:text-brand"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2.5 font-medium text-slate-700">{o.customerName}</td>
                    <td className="py-2.5 font-extrabold text-slate-900">{formatMoney(o.total)}</td>
                    <td className="py-2.5">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="py-2.5 text-2xs font-semibold text-slate-400">
                      {formatDate(o.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low stock */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h2 className="mb-3 font-extrabold text-slate-900">Low Stock Inventory Alerts</h2>
        {lowStock.length === 0 ? (
          <p className="py-4 text-center text-xs font-semibold text-slate-400">
            All products are well stocked ✅
          </p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 border border-slate-200/60"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <span className="text-lg">{p.emoji}</span>
                  {p.name}{" "}
                  <span className="text-2xs text-slate-400 font-normal">({p.unit})</span>
                </span>
                <span
                  className={`text-xs font-extrabold ${
                    p.stockQty === 0 ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {p.stockQty} left
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div
        className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
      >
        {icon}
      </div>
      <p className="text-xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
