"use client";
import { useState } from "react";
import clsx from "clsx";

export function ProductImage({
  imageUrl,
  src,
  emoji,
  alt = "Product photo",
  className,
  size = "text-5xl",
}: {
  imageUrl?: string | null;
  src?: string | null;
  emoji?: string;
  alt?: string;
  className?: string;
  size?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const activeSrc = imageUrl || src;

  if (activeSrc && !imgError) {
    return (
      <div className={clsx("relative overflow-hidden bg-slate-50", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeSrc}
          alt={alt}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover object-center transition-opacity duration-200"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-center bg-slate-100/80",
        className
      )}
    >
      <span className={clsx(size, "select-none")}>{emoji || "🛒"}</span>
    </div>
  );
}
