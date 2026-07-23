"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { Banner } from "@/lib/types";

export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [idx, setIdx] = useState(0);
  const active = banners.filter((b) => b.isActive);

  useEffect(() => {
    if (active.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % active.length), 4000);
    return () => clearInterval(t);
  }, [active.length]);

  if (active.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {active.map((b) => {
            const inner = (
              <div
                className={clsx(
                  "flex h-40 w-full items-center justify-between bg-gradient-to-r px-5 text-white",
                  b.bg
                )}
              >
                <div className="max-w-[65%]">
                  <p className="text-xl font-bold leading-tight">{b.title}</p>
                  <p className="mt-1 text-sm opacity-90">{b.subtitle}</p>
                </div>
                <span className="text-6xl drop-shadow">{b.emoji}</span>
              </div>
            );
            return (
              <div key={b.id} className="w-full shrink-0">
                {b.linkUrl ? <Link href={b.linkUrl}>{inner}</Link> : inner}
              </div>
            );
          })}
        </div>
      </div>
      {active.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {active.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-4 bg-brand-dark" : "w-1.5 bg-surface-border"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
