"use client";
import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import type { Category, ImportRow, ImportRowStatus, Product } from "@/lib/types";

interface ImportProductsModalProps {
  onClose: () => void;
}

const ALIASES: Record<string, string[]> = {
  name: ["name", "product name", "product_name", "item", "product", "title"],
  categorySlug: [
    "category",
    "category slug",
    "category_slug",
    "cat",
    "category name",
  ],
  unit: ["unit", "pack size", "pack_size", "size", "unit/size", "quantity unit"],
  mrp: [
    "mrp",
    "mrp (₹)",
    "mrp(₹)",
    "mrp (in rs)",
    "max price",
    "maximum retail price",
    "original price",
  ],
  price: [
    "price",
    "selling price",
    "selling_price",
    "rate",
    "price (₹)",
    "price(₹)",
    "sale price",
    "offer price",
  ],
  stockQty: [
    "stock",
    "stock qty",
    "stock_qty",
    "stock quantity",
    "quantity",
    "qty",
  ],
  lowStockThreshold: [
    "low stock",
    "low stock alert",
    "low stock threshold",
    "low_stock_threshold",
    "min stock",
  ],
  imageUrl: [
    "image",
    "image url",
    "image_url",
    "photo url",
    "photo_url",
    "picture",
    "photo",
  ],
  brand: ["brand", "company", "manufacturer"],
  description: ["description", "details", "desc", "about"],
  tags: ["tags", "keywords", "tag"],
  isActive: ["active", "is active", "is_active", "visible", "status"],
  isFeatured: ["featured", "is featured", "is_featured", "highlight"],
};

function resolveCell(row: Record<string, string>, field: string): string {
  const aliases = ALIASES[field] ?? [field];
  for (const alias of aliases) {
    const found = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === alias
    );
    if (found && row[found] !== undefined && row[found] !== null) {
      return String(row[found]).trim();
    }
  }
  return "";
}

function validateRow(
  raw: Record<string, string>,
  categories: Category[]
): ImportRow {
  const issues: string[] = [];
  const name = resolveCell(raw, "name");
  const unit = resolveCell(raw, "unit");
  const mrpStr = resolveCell(raw, "mrp").replace(/[₹,\s]/g, "");
  const priceStr = resolveCell(raw, "price").replace(/[₹,\s]/g, "");

  const mrpNum = parseFloat(mrpStr);
  const priceNum = parseFloat(priceStr);

  const mrp = isNaN(mrpNum) ? 0 : Math.round(mrpNum * 100);
  const price = isNaN(priceNum) ? 0 : Math.round(priceNum * 100);

  // Critical validation
  if (!name || name.length < 2) {
    issues.push("Product name is required (min 2 chars)");
  }
  if (!unit) {
    issues.push("Unit/pack size is required (e.g. 500g, 1L)");
  }
  if (mrp <= 0) {
    issues.push("MRP must be greater than ₹0");
  }
  if (price <= 0) {
    issues.push("Selling price must be greater than ₹0");
  }
  if (price > mrp && mrp > 0) {
    issues.push("Selling price is higher than MRP");
  }

  // Category matching
  const rawCat = resolveCell(raw, "categorySlug").toLowerCase().trim();
  let matchedCat = categories.find(
    (c) =>
      c.slug.toLowerCase() === rawCat ||
      c.name.toLowerCase() === rawCat ||
      c.name.toLowerCase().includes(rawCat)
  );

  if (!matchedCat && categories.length > 0) {
    matchedCat = categories[0];
    if (rawCat) {
      issues.push(`Unknown category "${rawCat}" → mapped to "${matchedCat.name}"`);
    }
  }

  const imageUrl = resolveCell(raw, "imageUrl");
  if (!imageUrl) {
    issues.push("No image provided (incomplete item)");
  }

  const isCriticalError =
    !name || name.length < 2 || !unit || mrp <= 0 || price <= 0;

  let status: ImportRowStatus = "valid";
  if (isCriticalError) {
    status = "error";
  } else if (!imageUrl || issues.length > 0) {
    status = "incomplete";
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const rawActive = resolveCell(raw, "isActive").toLowerCase();
  const isActiveDefault =
    rawActive === "false" || rawActive === "0" || rawActive === "no"
      ? false
      : true;

  const rawFeatured = resolveCell(raw, "isFeatured").toLowerCase();
  const isFeatured =
    rawFeatured === "true" || rawFeatured === "1" || rawFeatured === "yes";

  return {
    raw,
    status,
    issues,
    product: {
      name,
      slug,
      unit,
      categorySlug: matchedCat?.slug || "general",
      brand: resolveCell(raw, "brand") || undefined,
      mrp,
      price,
      stockQty: parseInt(resolveCell(raw, "stockQty")) || 0,
      lowStockThreshold:
        parseInt(resolveCell(raw, "lowStockThreshold")) || 5,
      imageUrl: imageUrl || undefined,
      description:
        resolveCell(raw, "description") ||
        `Quality ${name} delivered fresh to your door.`,
      tags: resolveCell(raw, "tags")
        .split(/[,;]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      emoji: "📦",
      isActive: isActiveDefault,
      isFeatured,
      sortOrder: 0,
    },
  };
}

export function ImportProductsModal({ onClose }: ImportProductsModalProps) {
  const categories = useCatalog((s) => s.categories);
  const bulkUpsertProducts = useCatalog((s) => s.bulkUpsertProducts);
  const show = useToast((s) => s.show);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "valid" | "incomplete" | "error"
  >("all");
  const [hideIncomplete, setHideIncomplete] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      show("Please select an Excel (.xlsx or .xls) file ⚠️");
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
        defval: "",
        raw: false,
      });

      if (!rawRows || rawRows.length === 0) {
        show("The selected Excel sheet is empty");
        setIsProcessing(false);
        return;
      }

      const parsedRows = rawRows
        .filter((r) => Object.values(r).some((v) => String(v).trim().length > 0))
        .map((r) => validateRow(r, categories));

      setRows(parsedRows);
    } catch (err: any) {
      console.error("Excel parse error:", err);
      show("Failed to read Excel file: " + (err.message || "Invalid file"));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const catList = categories.map((c) => c.slug).join(", ");
    const headers = [
      "Name",
      "Category Slug",
      "Brand",
      "Unit",
      "MRP (₹)",
      "Selling Price (₹)",
      "Stock Qty",
      "Low Stock Alert",
      "Image URL",
      "Description",
      "Tags",
      "Is Active",
      "Is Featured",
    ];

    const example1 = [
      "Amul Pasteurized Butter 500g",
      categories[0]?.slug || "dairy-eggs",
      "Amul",
      "500g",
      "275",
      "265",
      "50",
      "5",
      "https://pub-your-bucket.r2.dev/products/amul-butter.jpg",
      "Pure dairy butter made from fresh cream.",
      "butter, amul, dairy",
      "TRUE",
      "TRUE",
    ];

    const example2 = [
      "Fresh Robusta Bananas",
      categories[1]?.slug || "fruits-vegetables",
      "Fresh Farm",
      "6 pcs",
      "40",
      "35",
      "100",
      "10",
      "",
      "Naturally ripened fresh sweet bananas.",
      "banana, fruits, fresh",
      "TRUE",
      "FALSE",
    ];

    const wsData = [
      headers,
      example1,
      example2,
      [],
      [`Available Category Slugs: ${catList}`],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Product_Template");
    XLSX.writeFile(wb, "quickcart_product_import_template.xlsx");
  };

  const toggleRowVisibility = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const currentActive =
          r.activeOverride !== undefined
            ? r.activeOverride
            : r.status === "incomplete" && hideIncomplete
            ? false
            : Boolean(r.product.isActive);
        return { ...r, activeOverride: !currentActive };
      })
    );
  };

  const validCount = rows.filter((r) => r.status === "valid").length;
  const incompleteCount = rows.filter((r) => r.status === "incomplete").length;
  const errorCount = rows.filter((r) => r.status === "error").length;

  const filteredRows = rows.filter((r) => {
    if (activeTab === "valid") return r.status === "valid";
    if (activeTab === "incomplete") return r.status === "incomplete";
    if (activeTab === "error") return r.status === "error";
    return true;
  });

  const importableRows = rows.filter((r) => r.status !== "error");

  const handleImport = async () => {
    if (importableRows.length === 0) {
      show("No valid products to import");
      return;
    }

    setIsImporting(true);

    const finalProducts: Product[] = importableRows.map((r) => {
      let finalActive = Boolean(r.product.isActive);
      if (r.activeOverride !== undefined) {
        finalActive = r.activeOverride;
      } else if (r.status === "incomplete" && hideIncomplete) {
        finalActive = false;
      }

      return {
        id: "imp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name: r.product.name!,
        slug: r.product.slug!,
        categorySlug: r.product.categorySlug!,
        brand: r.product.brand || null,
        unit: r.product.unit!,
        mrp: Number(r.product.mrp),
        price: Number(r.product.price),
        stockQty: Number(r.product.stockQty || 0),
        lowStockThreshold: Number(r.product.lowStockThreshold || 5),
        emoji: r.product.emoji || "📦",
        imageUrl: r.product.imageUrl || null,
        description: r.product.description || null,
        tags: r.product.tags || [],
        isActive: finalActive,
        isFeatured: Boolean(r.product.isFeatured),
        sortOrder: 0,
      } as Product;
    });

    // 1. Instant local Zustand update
    bulkUpsertProducts(finalProducts);

    // 2. Persist to Postgres database via batch API
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: finalProducts }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to persist to database");
      }

      show(`Successfully imported ${data.imported} products! ✅`);
      onClose();
    } catch (err: any) {
      console.warn("DB Bulk Import error:", err);
      show(`Imported ${finalProducts.length} items locally (DB sync notice: ${err.message}) ⚠️`);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-dark">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Bulk Import Products (.xlsx)
              </h2>
              <p className="text-xs text-slate-500">
                Upload your spreadsheet to add or update items in your catalog
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {rows.length === 0 ? (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-10 text-center transition hover:border-brand hover:bg-brand-50/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand">
                  {isProcessing ? (
                    <Loader2 size={28} className="animate-spin" />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {isProcessing ? "Reading spreadsheet..." : "Click or drag & drop Excel file here"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Supports .xlsx and .xls spreadsheets with product columns
                </p>
              </div>

              {/* Template Section */}
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Need the Excel template format?
                  </h4>
                  <p className="text-xs text-slate-500">
                    Download a pre-formatted template with sample rows and your store's category list.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100"
                >
                  <Download size={15} /> Download Template (.xlsx)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info Bar & Global Settings */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <FileSpreadsheet size={16} className="text-brand-dark" />
                  <span>{fileName}</span>
                  <span className="text-slate-400">·</span>
                  <span>{rows.length} total rows</span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Hide Incomplete switch */}
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={hideIncomplete}
                      onChange={(e) => setHideIncomplete(e.target.checked)}
                      className="h-4 w-4 rounded-sm border-slate-300 text-brand accent-brand"
                    />
                    <span>Auto-hide incomplete items (e.g. missing image)</span>
                  </label>

                  <button
                    onClick={() => {
                      setRows([]);
                      setFileName(null);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                    activeTab === "all"
                      ? "border-brand text-brand-dark"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Rows ({rows.length})
                </button>
                <button
                  onClick={() => setActiveTab("valid")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                    activeTab === "valid"
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  Valid ({validCount})
                </button>
                <button
                  onClick={() => setActiveTab("incomplete")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                    activeTab === "incomplete"
                      ? "border-amber-500 text-amber-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <AlertTriangle size={13} className="text-amber-500" />
                  Incomplete ({incompleteCount})
                </button>
                <button
                  onClick={() => setActiveTab("error")}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
                    activeTab === "error"
                      ? "border-red-600 text-red-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <XCircle size={13} className="text-red-600" />
                  Invalid ({errorCount})
                </button>
              </div>

              {/* Preview Table */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-slate-200 bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Product Name</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Unit</th>
                      <th className="px-3 py-2.5">MRP / Price</th>
                      <th className="px-3 py-2.5">Stock</th>
                      <th className="px-3 py-2.5 text-center">Storefront Visibility</th>
                      <th className="px-3 py-2.5">Issues / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRows.map((r, idx) => {
                      const isRowActive =
                        r.activeOverride !== undefined
                          ? r.activeOverride
                          : r.status === "incomplete" && hideIncomplete
                          ? false
                          : Boolean(r.product.isActive);

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 ${
                            r.status === "error" ? "bg-red-50/30" : ""
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            {r.status === "valid" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                                <CheckCircle2 size={11} /> Ready
                              </span>
                            )}
                            {r.status === "incomplete" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                                <AlertTriangle size={11} /> Incomplete
                              </span>
                            )}
                            {r.status === "error" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-800">
                                <XCircle size={11} /> Error
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            {r.product.name || <span className="italic text-red-500">Missing Name</span>}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {r.product.categorySlug}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">
                            {r.product.unit || <span className="italic text-red-500">Missing</span>}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-800">
                            ₹{(r.product.mrp || 0) / 100} / ₹{(r.product.price || 0) / 100}
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            {r.product.stockQty || 0}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {r.status !== "error" ? (
                              <button
                                type="button"
                                onClick={() => toggleRowVisibility(idx)}
                                title={
                                  isRowActive
                                    ? "Visible in Storefront (Click to Hide)"
                                    : "Hidden in Storefront (Click to Show)"
                                }
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold transition ${
                                  isRowActive
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
                                    : "bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                                }`}
                              >
                                {isRowActive ? (
                                  <>
                                    <Eye size={12} /> Show
                                  </>
                                ) : (
                                  <>
                                    <EyeOff size={12} /> Hidden
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {r.issues.length > 0 ? (
                              <ul className="list-disc pl-3 space-y-0.5">
                                {r.issues.map((iss, i) => (
                                  <li
                                    key={i}
                                    className={
                                      r.status === "error"
                                        ? "text-red-600"
                                        : "text-amber-700"
                                    }
                                  >
                                    {iss}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-emerald-600">All fields valid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>

          {rows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importableRows.length === 0 || isImporting}
              className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Upload size={15} /> Import {importableRows.length} Product(s)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
