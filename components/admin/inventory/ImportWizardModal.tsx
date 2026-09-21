"use client";
import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Barcode,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCatalog } from "@/lib/store";
import { useToast } from "@/components/toast";
import type {
  ImportPreviewResponse,
} from "@/lib/inventory/types";

interface ImportWizardModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToLegacy?: () => void;
}

export function ImportWizardModal({ onClose, onSuccess, onSwitchToLegacy }: ImportWizardModalProps) {
  const categories = useCatalog((s) => s.categories);
  const showToast = useToast((s) => s.show);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  // Preview Data
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "create" | "update" | "shortage" | "missingCode" | "conflict" | "error"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Options
  const [autoHideIncomplete, setAutoHideIncomplete] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState(categories[0]?.slug || "general");
  const [commitResult, setCommitResult] = useState<any | null>(null);

  const handleFileUpload = async (file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "xlsx" && ext !== "xls") {
      showToast("Please upload an Excel (.xlsx or .xls) file ⚠️");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/inventory/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse workbook preview");
      }

      setPreviewData(data);
      setCurrentPage(1);
      setStep(2); // Advance to preview summary
    } catch (err: any) {
      console.error("Import preview error:", err);
      showToast(err.message || "Failed to inspect Excel workbook");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommit = async () => {
    if (!previewData) return;
    setIsCommitting(true);

    try {
      const res = await fetch("/api/admin/inventory/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileHash: previewData.summary.fileHash,
          previewToken: previewData.summary.previewToken,
          fileName: previewData.summary.fileName,
          sheetName: previewData.summary.sheetName,
          rows: previewData.rows,
          autoHideIncomplete,
          defaultCategorySlug: defaultCategory,
          fileSize: previewData.summary.fileSize,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to commit inventory import");
      }

      setCommitResult(result);
      setStep(4); // Success step
      showToast(`Successfully imported ${result.createdCount + result.updatedCount} products! ✅`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Commit import error:", err);
      showToast(err.message || "Failed to commit import to database");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRollback = async () => {
    if (!commitResult?.importId) return;
    setIsRollingBack(true);

    try {
      const res = await fetch(`/api/admin/inventory/import/${commitResult.importId}/rollback`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to rollback import");
      }

      showToast(`Rollback complete: ${data.revertedCount} products restored! 🔄`);
      onClose();
    } catch (err: any) {
      console.error("Rollback error:", err);
      showToast(err.message || "Failed to rollback import");
    } finally {
      setIsRollingBack(false);
    }
  };

  const summary = previewData?.summary;
  const rows = previewData?.rows || [];

  const filteredRows = rows.filter((r) => {
    if (activeTab === "create") return r.action === "CREATE";
    if (activeTab === "update") return r.action === "UPDATE";
    if (activeTab === "shortage") return r.stockQty < 0;
    if (activeTab === "missingCode") return !r.itemCode;
    if (activeTab === "conflict") return r.action === "CONFLICT";
    if (activeTab === "error") return r.action === "ERROR" || r.action === "CONFLICT";
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE) || 1;
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header with Wizard Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">POS Inventory Bulk Import</h2>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-2xs font-bold text-slate-700">
                  Step {step} of 4
                </span>
                {onSwitchToLegacy && (
                  <button
                    onClick={onSwitchToLegacy}
                    className="text-2xs font-bold text-brand hover:underline ml-2"
                  >
                    Switch to Legacy Catalog Mode
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {step === 1 && "Upload the daily POS 'Export Items' spreadsheet"}
                {step === 2 && "Inspect dry-run summary & shortage alerts"}
                {step === 3 && "Review row-level diffs and duplicate conflicts"}
                {step === 4 && "Import complete & audit record created"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Upload & Auto-Detect */}
          {step === 1 && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-12 text-center transition hover:border-brand hover:bg-orange-50/20"
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
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-brand">
                  {isProcessing ? (
                    <Loader2 size={32} className="animate-spin" />
                  ) : (
                    <Upload size={32} />
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isProcessing ? "Inspecting workbook on server..." : "Click or drag & drop POS Excel file here"}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 max-w-md">
                  Target sheet: <strong className="text-slate-700">Export Items</strong>. Headers: Item name*, Item code, Default M, Sale price, Current stock quantity.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-2xs font-semibold text-slate-500">
                  <span className="rounded bg-slate-200 px-2 py-0.5">Leading Zeros Preserved</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5">Negative Stock Shortages</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5">Code 128 / EAN-13</span>
                  <span className="rounded bg-slate-200 px-2 py-0.5">SHA-256 Idempotency</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Summary Metrics & Shortage Highlights */}
          {step === 2 && summary && (
            <div className="space-y-6">
              {summary.isAlreadyImported && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Notice: Exact file hash already imported</p>
                    <p className="mt-0.5 text-amber-700">
                      This exact workbook (SHA-256: <code className="font-mono">{summary.fileHash.slice(0, 12)}...</code>) was previously imported on {summary.lastImportedAt ? new Date(summary.lastImportedAt).toLocaleString() : "record"}. Proceeding will perform an idempotent re-sync.
                    </p>
                  </div>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-2xs font-bold uppercase text-slate-500">Total Rows</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalRows}</p>
                  <p className="text-2xs text-slate-400 mt-0.5">{summary.sheetName}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                  <p className="text-2xs font-bold uppercase text-emerald-700">New Products</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">+{summary.toCreate}</p>
                  <p className="text-2xs text-emerald-600 mt-0.5">Will be created in DB</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
                  <p className="text-2xs font-bold uppercase text-blue-700">Existing Products</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">~{summary.toUpdate}</p>
                  <p className="text-2xs text-blue-600 mt-0.5">Price / stock updated</p>
                </div>
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5">
                  <p className="text-2xs font-bold uppercase text-purple-700">Shortage (Negative Stock)</p>
                  <p className="text-2xl font-black text-purple-700 mt-1">{summary.shortageCount}</p>
                  <p className="text-2xs text-purple-600 mt-0.5">Dark-store deficit state</p>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="font-bold text-slate-700">Missing Item Codes:</span>{" "}
                  <span className="font-extrabold text-slate-900">{summary.missingCodeCount} items</span>
                  <p className="text-2xs text-slate-500 mt-0.5">Manual picking; no barcode rendered.</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="font-bold text-slate-700">Code Conflicts:</span>{" "}
                  <span className={`font-extrabold ${summary.conflictCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {summary.conflictCount} conflicts
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    {summary.conflictCount > 0 ? "Requires confirmation." : "Zero collisions."}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="font-bold text-slate-700">Duplicates in Sheet:</span>{" "}
                  <span className={`font-extrabold ${summary.duplicateCodeCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {summary.duplicateCodeCount}
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">Duplicate codes across rows.</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-xs">
                  <span className="font-bold text-slate-700">Errors / Rejected:</span>{" "}
                  <span className={`font-extrabold ${summary.errors > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {summary.errors} rows
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">Missing name or non-numeric price.</p>
                </div>
              </div>

              {/* Import Settings */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Import Settings &amp; Default Category</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoHideIncomplete}
                      onChange={(e) => setAutoHideIncomplete(e.target.checked)}
                      className="h-4 w-4 rounded accent-brand"
                    />
                    <span>Auto-hide incomplete items (e.g. newly created without images)</span>
                  </label>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>Default Category:</span>
                    <select
                      value={defaultCategory}
                      onChange={(e) => setDefaultCategory(e.target.value)}
                      className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Detailed Row-by-Row Table with Pagination */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Filter Tabs */}
              <div className="flex border-b border-slate-200 text-xs font-bold overflow-x-auto">
                <button
                  onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "all" ? "border-brand text-brand-dark" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Rows ({rows.length})
                </button>
                <button
                  onClick={() => { setActiveTab("create"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "create" ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  New ({summary?.toCreate || 0})
                </button>
                <button
                  onClick={() => { setActiveTab("update"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "update" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Updates ({summary?.toUpdate || 0})
                </button>
                <button
                  onClick={() => { setActiveTab("shortage"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "shortage" ? "border-purple-600 text-purple-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Shortages ({summary?.shortageCount || 0})
                </button>
                <button
                  onClick={() => { setActiveTab("conflict"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "conflict" ? "border-amber-600 text-amber-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Conflicts ({summary?.conflictCount || 0})
                </button>
                <button
                  onClick={() => { setActiveTab("missingCode"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "missingCode" ? "border-slate-600 text-slate-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  No Barcode ({summary?.missingCodeCount || 0})
                </button>
                <button
                  onClick={() => { setActiveTab("error"); setCurrentPage(1); }}
                  className={`px-4 py-2 border-b-2 transition shrink-0 ${
                    activeTab === "error" ? "border-red-600 text-red-700" : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Errors ({summary?.errors || 0})
                </button>
              </div>

              {/* Table */}
              <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-12">Row</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Product Name</th>
                      <th className="px-3 py-2">Item Code / Barcode</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">MRP / Price</th>
                      <th className="px-3 py-2">Stock Qty</th>
                      <th className="px-3 py-2">Issues / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50 ${
                          r.action === "ERROR"
                            ? "bg-red-50/40"
                            : r.action === "CONFLICT"
                            ? "bg-amber-50/40"
                            : r.stockQty < 0
                            ? "bg-purple-50/30"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400 font-mono">{r.rowNumber}</td>
                        <td className="px-3 py-2">
                          {r.action === "CREATE" && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                              NEW
                            </span>
                          )}
                          {r.action === "UPDATE" && (
                            <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-800">
                              UPDATE
                            </span>
                          )}
                          {r.action === "SKIP" && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-bold text-slate-600">
                              UNCHANGED
                            </span>
                          )}
                          {r.action === "ERROR" && (
                            <span className="rounded bg-red-100 px-2 py-0.5 font-bold text-red-800">
                              ERROR
                            </span>
                          )}
                          {r.action === "CONFLICT" && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                              CONFLICT
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">{r.name}</td>
                        <td className="px-3 py-2 font-mono">
                          {r.itemCode ? (
                            <div className="flex items-center gap-1.5">
                              <Barcode size={14} className="text-slate-500" />
                              <span className="font-bold text-slate-800">{r.itemCode}</span>
                              {r.hasLeadingZero && (
                                <span className="rounded bg-slate-200 px-1 text-3xs font-bold text-slate-600" title="Leading zeros preserved">
                                  0-pad
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-slate-400">No code</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{r.unit}</td>
                        <td className="px-3 py-2 font-semibold">
                          ₹{r.defaultMrpRupees.toFixed(2)} / ₹{r.salePriceRupees.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 font-bold">
                          {r.stockQty < 0 ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-purple-100 px-2 py-0.5 text-purple-800 font-black">
                              Shortage: {r.stockQty}
                            </span>
                          ) : (
                            <span className="text-slate-800">{r.stockQty}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-2xs text-slate-500">
                          {r.errors.length > 0 && (
                            <p className="font-bold text-red-600">{r.errors.join("; ")}</p>
                          )}
                          {r.warnings.length > 0 && (
                            <p className="text-amber-700">{r.warnings.join("; ")}</p>
                          )}
                          {r.errors.length === 0 && r.warnings.length === 0 && (
                            <span className="text-emerald-600 font-medium">Valid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
                  <p>
                    Showing {(currentPage - 1) * PAGE_SIZE + 1} to{" "}
                    {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} rows
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span className="font-bold text-slate-800">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 disabled:opacity-40"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success & Audit Log Summary */}
          {step === 4 && commitResult && (
            <div className="space-y-6 text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Inventory Successfully Synchronized!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  The changes have been committed atomically to PostgreSQL with full audit tracking.
                </p>
              </div>

              <div className="max-w-md mx-auto grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-2xs font-bold text-slate-500 uppercase">Created</p>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">+{commitResult.createdCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-2xs font-bold text-slate-500 uppercase">Updated</p>
                  <p className="text-xl font-black text-blue-600 mt-0.5">~{commitResult.updatedCount}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-2xs font-bold text-slate-500 uppercase">Shortages</p>
                  <p className="text-xl font-black text-purple-700 mt-0.5">{commitResult.shortageCount}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col items-center gap-2">
                <p className="text-2xs font-mono text-slate-400">
                  Audit Record ID: {commitResult.auditLogId}
                </p>
                <button
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                >
                  {isRollingBack ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Rolling Back...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={13} /> Rollback This Import (Restore Previous State)
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          {step === 1 && (
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Upload Different File
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Inspect Rows ({rows.length})
                </button>
                <button
                  onClick={handleCommit}
                  disabled={isCommitting || (summary?.errors || 0) > 0}
                  className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Committing to DB...
                    </>
                  ) : (
                    <>
                      <Check size={15} /> Confirm &amp; Import Products
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Back to Summary
              </button>
              <button
                onClick={handleCommit}
                disabled={isCommitting || (summary?.errors || 0) > 0}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-dark disabled:opacity-50"
              >
                {isCommitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Committing...
                  </>
                ) : (
                  <>
                    <Check size={15} /> Confirm &amp; Import ({(summary?.toCreate ?? 0) + (summary?.toUpdate ?? 0)} items)
                  </>
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <button
              onClick={onClose}
              className="ml-auto rounded-lg bg-brand px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-dark"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
