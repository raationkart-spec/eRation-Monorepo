"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Package,
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Download,
  Percent,
  Trash2,
} from "lucide-react";
import { useCatalog } from "@/lib/store";
import { formatMoney } from "@/lib/format";
import { AdminTableSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import { useToast } from "@/components/toast";

export default function AdminProducts() {
  const hydrated = useHydrated();
  const showToast = useToast((s) => s.show);
  const products = useCatalog((s) => s.products);
  const categories = useCatalog((s) => s.categories);
  const upsertProduct = useCatalog((s) => s.upsertProduct);
  const deleteProduct = useCatalog((s) => s.deleteProduct);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all, low, out, instock
  const [discountFilter, setDiscountFilter] = useState("all"); // all, discounted, fullmrp
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(q.toLowerCase())) ||
        p.tags.some((t) => t.toLowerCase().includes(q.toLowerCase()));

      const matchCat = !cat || p.categorySlug === cat;

      let matchStock = true;
      if (stockFilter === "low") {
        matchStock = p.stockQty > 0 && p.stockQty <= p.lowStockThreshold;
      } else if (stockFilter === "out") {
        matchStock = p.stockQty === 0;
      } else if (stockFilter === "instock") {
        matchStock = p.stockQty > 0;
      }

      let matchDiscount = true;
      if (discountFilter === "discounted") {
        matchDiscount = p.mrp > p.price;
      } else if (discountFilter === "fullmrp") {
        matchDiscount = p.mrp <= p.price;
      }

      return matchQ && matchCat && matchStock && matchDiscount;
    });
  }, [products, q, cat, stockFilter, discountFilter]);

  if (!hydrated) return <AdminTableSkeleton />;

  // Pagination slice
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Bulk Actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const updateProductRemote = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Update failed");
    upsertProduct(json.product);
  };

  const handleBulkToggleActive = async (activeState: boolean) => {
    await Promise.all(
      selectedIds.map((id) => updateProductRemote(id, { isActive: activeState }))
    );
    showToast(`Updated ${selectedIds.length} items to ${activeState ? "Active" : "Hidden"}`);
    setSelectedIds([]);
  };

  const handleBulkApplyDiscount = async (pct: number) => {
    const targets = selectedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is (typeof products)[number] => !!p && p.mrp > 0);
    await Promise.all(
      targets.map((prod) =>
        updateProductRemote(prod.id, { price: Math.round(prod.mrp * (1 - pct / 100)) })
      )
    );
    showToast(`Applied ${pct}% discount to ${selectedIds.length} items`);
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Name",
      "Category",
      "Brand",
      "Unit",
      "MRP (₹)",
      "Selling Price (₹)",
      "Stock Qty",
      "Is Active",
    ];
    const rows = filtered.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.categorySlug,
      p.brand || "",
      p.unit,
      (p.mrp / 100).toFixed(2),
      (p.price / 100).toFixed(2),
      p.stockQty,
      p.isActive ? "Yes" : "No",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quickcart_products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalCount = products.length;
  const lowStockCount = products.filter(
    (p) => p.stockQty > 0 && p.stockQty <= p.lowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQty === 0).length;

  return (
    <div className="space-y-4">
      {/* Desktop Page Title & Top Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="text-brand" /> Product Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage product catalog, inventory, pricing discounts &amp; media assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Download size={15} /> Export CSV
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:from-orange-600 hover:to-amber-700"
          >
            <Plus size={16} /> Add New Product
          </Link>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Total Catalog SKUs
          </p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">
            Active Products
          </p>
          <p className="text-xl font-black text-emerald-600 mt-0.5">
            {products.filter((p) => p.isActive).length}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-amber-700">
            Low Stock Alerts
          </p>
          <p className="text-xl font-black text-amber-600 mt-0.5">
            {lowStockCount}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-3 shadow-2xs">
          <p className="text-2xs font-bold uppercase tracking-wider text-red-700">
            Out of Stock
          </p>
          <p className="text-xl font-black text-red-600 mt-0.5">
            {outOfStockCount}
          </p>
        </div>
      </div>

      {/* Search & Multifaceted Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Main Search Bar */}
          <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-brand focus-within:bg-white">
            <Search size={16} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search products by name, brand, or tag..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Category Selector */}
          <select
            value={cat}
            onChange={(e) => {
              setCat(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand"
          >
            <option value="all">Stock: All</option>
            <option value="instock">In Stock Only</option>
            <option value="low">⚠️ Low Stock Alerts</option>
            <option value="out">🚫 Out of Stock</option>
          </select>

          {/* Discount Filter */}
          <select
            value={discountFilter}
            onChange={(e) => {
              setDiscountFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-brand"
          >
            <option value="all">Pricing: All</option>
            <option value="discounted">🔥 Discounted Items Only</option>
            <option value="fullmrp">Full MRP Items</option>
          </select>
        </div>

        {/* Bulk Action Controls Bar (Appears when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between rounded-lg bg-orange-50 border border-orange-200 px-3.5 py-2 text-xs animate-fadeIn">
            <span className="font-bold text-orange-900">
              ⚡ {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkToggleActive(true)}
                className="flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 font-bold text-white hover:bg-emerald-700"
              >
                <CheckCircle size={13} /> Make Active
              </button>
              <button
                onClick={() => handleBulkToggleActive(false)}
                className="flex items-center gap-1 rounded bg-slate-700 px-2.5 py-1 font-bold text-white hover:bg-slate-800"
              >
                <EyeOff size={13} /> Hide Items
              </button>
              <button
                onClick={() => handleBulkApplyDiscount(10)}
                className="flex items-center gap-1 rounded bg-orange-600 px-2.5 py-1 font-bold text-white hover:bg-orange-700"
              >
                <Percent size={13} /> Apply 10% Off
              </button>
              <button
                onClick={() => handleBulkApplyDiscount(20)}
                className="flex items-center gap-1 rounded bg-orange-600 px-2.5 py-1 font-bold text-white hover:bg-orange-700"
              >
                <Percent size={13} /> Apply 20% Off
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs font-semibold text-slate-500 hover:underline ml-2"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-2xs uppercase tracking-wider font-extrabold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedProducts.length > 0 &&
                      paginatedProducts.every((p) => selectedIds.includes(p.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3">Product Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">MRP</th>
                <th className="px-4 py-3">Selling Price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Stock Status</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedProducts.map((p) => {
                const savings = p.mrp > p.price ? p.mrp - p.price : 0;
                const discountPct =
                  p.mrp > 0 && savings > 0
                    ? Math.round((savings / p.mrp) * 100)
                    : 0;

                return (
                  <tr
                    key={p.id}
                    className={`transition hover:bg-slate-50/80 ${
                      selectedIds.includes(p.id) ? "bg-orange-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelectOne(p.id)}
                        className="h-4 w-4 rounded accent-brand cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                          {p.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-contain p-0.5"
                            />
                          ) : (
                            <span className="text-2xl">{p.emoji}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate max-w-xs">
                            {p.name}
                          </p>
                          <p className="text-2xs text-slate-400 font-medium">
                            {p.unit} {p.brand ? `• ${p.brand}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-2xs font-bold text-slate-600">
                        {p.categorySlug}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-400 line-through text-xs">
                      {formatMoney(p.mrp)}
                    </td>
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      {formatMoney(p.price)}
                    </td>
                    <td className="px-4 py-3">
                      {discountPct > 0 ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-800">
                          {discountPct}% OFF
                        </span>
                      ) : (
                        <span className="text-2xs font-medium text-slate-400">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.stockQty === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-2xs font-extrabold text-red-700">
                          <AlertTriangle size={11} /> Out of Stock
                        </span>
                      ) : p.stockQty <= p.lowStockThreshold ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-2xs font-extrabold text-amber-800">
                          <AlertTriangle size={11} /> Low: {p.stockQty} left
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-bold text-slate-700">
                          {p.stockQty} in stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.isActive ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-2xs font-extrabold text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-bold text-slate-400">
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-brand hover:text-white transition"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-12 text-center space-y-2">
            <Package size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">
              No products found matching your filters
            </p>
            <p className="text-xs text-slate-400">
              Try adjusting your search terms or filters above.
            </p>
          </div>
        )}

        {/* Pagination & Footer controls */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs gap-3">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <span>
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(currentPage * pageSize, filtered.length)}
                </span>{" "}
                of <span className="font-bold text-slate-900">{filtered.length}</span> items
              </span>
              <span className="text-slate-300">•</span>
              <label className="flex items-center gap-1">
                Per Page:
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-800"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1 font-bold">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2 text-slate-500 font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
