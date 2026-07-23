"use client";
import Link from "next/link";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { useCatalog, useShop } from "@/lib/store";
import { OrderStatusBadge } from "@/components/misc";
import { formatDate, formatMoney } from "@/lib/format";
import { AdminDashboardSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function AdminDashboard() {
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);
  const orders = useShop((s) => s.orders);

  if (!hydrated) return <AdminDashboardSkeleton />;

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );
  const todayRevenue = todayOrders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((n, o) => n + o.total, 0);
  const pending = orders.filter(
    (o) => o.status === "PLACED" || o.status === "CONFIRMED"
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
    <div className="content-in">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mb-5 text-sm text-slate-500">
        Overview of today&apos;s activity
      </p>

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
          color="text-green-600 bg-green-50"
        />
        <Stat
          label="Pending Orders"
          value={String(pending)}
          icon={<Package size={18} />}
          color="text-amber-600 bg-amber-50"
        />
        <Stat
          label="Low Stock"
          value={String(lowStock.length)}
          icon={<AlertTriangle size={18} />}
          color="text-red-600 bg-red-50"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <Stat
          label="This Month Revenue"
          value={formatMoney(monthRevenue)}
          icon={<IndianRupee size={18} />}
          color="text-green-600 bg-green-50"
        />
        <Stat
          label="Total Products"
          value={String(products.filter((p) => p.isActive).length)}
          icon={<Package size={18} />}
          color="text-slate-600 bg-slate-100"
        />
      </div>

      {/* Recent orders */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-brand-dark"
          >
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No orders yet. Place one from the storefront to see it here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="py-2">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-brand-dark"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-slate-600">{o.customerName}</td>
                    <td className="py-2 font-medium">{formatMoney(o.total)}</td>
                    <td className="py-2">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="py-2 text-slate-500">
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
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Low Stock Alerts</h2>
        {lowStock.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-400">
            All products are well stocked ✅
          </p>
        ) : (
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{p.emoji}</span>
                  {p.name}{" "}
                  <span className="text-xs text-slate-400">({p.unit})</span>
                </span>
                <span
                  className={`text-sm font-semibold ${
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div
        className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${color}`}
      >
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
