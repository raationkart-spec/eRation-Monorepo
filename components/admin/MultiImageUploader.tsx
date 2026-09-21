"use client";
import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  Link2,
  Check,
  Loader2,
  Star,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
} from "lucide-react";

interface MultiImageUploaderProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  folder?: string;
  maxImages?: number;
}

export function MultiImageUploader({
  imageUrls = [],
  onChange,
  label = "Product Images & Media Gallery",
  folder = "products",
  maxImages = 10,
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const safeUrls = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    setError("");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not a valid image (PNG, JPG, WEBP, SVG)`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 5MB file size limit`);
        return;
      }
      validFiles.push(file);
    }

    if (safeUrls.length + validFiles.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed. Please select fewer images.`);
      return;
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    const newUploadedUrls: string[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(`Uploading ${i + 1} of ${validFiles.length}: ${file.name}...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder || "products");

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
        newUploadedUrls.push(data.url);
      }

      // Combine existing URLs with newly uploaded URLs
      const updated = [...safeUrls, ...newUploadedUrls];
      onChange(updated);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to upload image(s)");
    } finally {
      setUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const applyCustomUrl = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("/")
    ) {
      setError("Image URL must begin with https://, http://, or /");
      return;
    }

    if (safeUrls.includes(trimmed)) {
      setError("This image URL is already added.");
      return;
    }

    if (safeUrls.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    onChange([...safeUrls, trimmed]);
    setCustomUrl("");
    setShowUrlInput(false);
    setError("");
  };

  const handleSetPrimary = (index: number) => {
    if (index <= 0 || index >= safeUrls.length) return;
    const target = safeUrls[index];
    const rest = safeUrls.filter((_, i) => i !== index);
    onChange([target, ...rest]);
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= safeUrls.length) return;
    const copy = [...safeUrls];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    onChange(copy);
  };

  const handleRemove = (index: number) => {
    const updated = safeUrls.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Header with counter and actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-slate-800">
            {label}
          </label>
          <p className="text-2xs text-slate-500">
            First image is the <strong>Primary</strong> thumbnail used on product cards and mobile lists.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-2xs font-bold text-slate-600">
            {safeUrls.length} / {maxImages} images
          </span>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
          >
            <Link2 size={13} /> {showUrlInput ? "Cancel URL" : "Paste Image URL"}
          </button>
          {safeUrls.length > 1 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* URL Input Box */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-3 bg-orange-50/50 rounded-xl border border-orange-200 animate-fadeIn">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setError("");
            }}
            placeholder="https://example.com/product-image.jpg"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCustomUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={applyCustomUrl}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-dark transition"
          >
            <Check size={14} /> Add Image
          </button>
        </div>
      )}

      {/* Upload Drop Zone (Available when below limit) */}
      {safeUrls.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition ${
            dragOver
              ? "border-brand bg-orange-50/60"
              : "border-slate-300 hover:border-brand hover:bg-slate-50/80"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-brand py-2">
              <Loader2 size={26} className="animate-spin" />
              <p className="text-xs font-bold">{uploadProgress || "Uploading..."}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-brand">
                <Upload size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click to browse or drag &amp; drop images
              </p>
              <p className="text-3xs text-slate-400">
                Supports multiple PNG, JPG, WEBP, or SVG files (Max 5MB each)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden Multiple File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
        }}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-1.5 rounded-lg bg-red-50 p-2.5 text-2xs font-semibold text-red-700 border border-red-200">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnails Grid & Manager */}
      {safeUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {safeUrls.map((url, idx) => {
            const isPrimary = idx === 0;
            return (
              <div
                key={`${url}-${idx}`}
                className={`group relative flex flex-col rounded-xl border bg-white p-2 shadow-2xs transition ${
                  isPrimary
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Image Preview */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Product photo ${idx + 1}`}
                    className="h-full w-full object-contain p-1"
                  />

                  {/* Primary Badge */}
                  {isPrimary ? (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-3xs font-extrabold text-white shadow-sm">
                      <Star size={10} fill="currentColor" /> PRIMARY
                    </span>
                  ) : (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-slate-800/70 px-1.5 py-0.5 text-3xs font-bold text-white backdrop-blur-2xs">
                      #{idx + 1}
                    </span>
                  )}

                  {/* Quick Preview Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewModalUrl(url);
                    }}
                    className="absolute bottom-1.5 right-1.5 rounded bg-white/80 p-1 text-slate-700 opacity-0 group-hover:opacity-100 transition shadow-xs hover:bg-white"
                    title="Enlarge preview"
                  >
                    <Eye size={12} />
                  </button>
                </div>

                {/* Card Controls */}
                <div className="mt-2 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-0.5">
                    {/* Move Left */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, idx - 1)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move earlier"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    {/* Move Right */}
                    <button
                      type="button"
                      disabled={idx === safeUrls.length - 1}
                      onClick={() => handleMove(idx, idx + 1)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Move later"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Set as Primary Button (if not primary) */}
                  {!isPrimary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-3xs font-bold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition"
                      title="Make this the primary product thumbnail"
                    >
                      <Star size={10} /> Make Primary
                    </button>
                  ) : (
                    <span className="text-3xs font-extrabold text-emerald-700">
                      Default
                    </span>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                    title="Remove image"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-h-[85vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 z-10 rounded-full bg-slate-900/70 p-1.5 text-white hover:bg-slate-900 transition"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewModalUrl}
              alt="Enlarged preview"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
