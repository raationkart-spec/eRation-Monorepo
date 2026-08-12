"use client";
import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Link2, Check, Loader2 } from "lucide-react";

interface ImageUploaderProps {
  imageUrl?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({
  imageUrl,
  onChange,
  label = "Product Image",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, SVG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload image");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const applyCustomUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setShowUrlInput(false);
      setCustomUrl("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <Link2 size={13} /> {showUrlInput ? "Upload File" : "Paste Image URL"}
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex items-center gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={applyCustomUrl}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-dark"
          >
            <Check size={14} /> Apply
          </button>
        </div>
      ) : imageUrl ? (
        <div className="relative group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">
              {imageUrl}
            </p>
            <p className="mt-0.5 text-2xs text-slate-400">
              Image uploaded successfully
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Change image
              </button>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition ${
            dragOver
              ? "border-brand bg-orange-50/50"
              : "border-slate-300 hover:border-brand hover:bg-slate-50"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-brand">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-xs font-bold">Uploading image to server...</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-brand">
                <Upload size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click or drag &amp; drop product image here
              </p>
              <p className="mt-1 text-2xs text-slate-400">
                Supports PNG, JPG, WEBP or SVG (Max 5MB)
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {error && <p className="text-2xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
