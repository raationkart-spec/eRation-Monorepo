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
    const t = setInterval(() => setIdx((i) => (i + 1) % active.length), 4500);
    return () => clearInterval(t);
  }, [active.length]);

  if (active.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {active.map((b) => {
            const inner = (
              <div
                className={clsx(
                  "relative flex h-44 w-full items-center overflow-hidden px-6 text-white bg-gradient-to-r",
                  b.bg
                )}
              >
                {b.imageUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: `url('${b.imageUrl}')` }}
                  />
                )}
                <div className="relative z-10 max-w-[65%] space-y-1">
                  <span className="inline-block rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-2xs font-extrabold text-white">
                    SPECIAL OFFER
                  </span>
                  <p className="text-xl font-extrabold tracking-tight leading-tight drop-shadow-sm">
                    {b.title}
                  </p>
                  <p className="text-xs font-medium text-white/90 drop-shadow-sm">
                    {b.subtitle}
                  </p>
                  <button className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-slate-100 active:scale-95">
                    Shop Now →
                  </button>
                </div>
                {b.imageUrl ? (
                  <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-transparent" />
                  </div>
                ) : (
                  <span className="relative z-10 text-6xl drop-shadow">{b.emoji}</span>
                )}
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
        <div className="mt-2.5 flex justify-center gap-1.5">
          {active.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIdx(i)}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i === idx ? "w-5 bg-orange-600" : "w-1.5 bg-slate-300"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
