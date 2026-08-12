"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PageHeader({
  title,
  subtitle,
  fallbackHref = "/",
  onBack,
}: {
  title: string;
  subtitle?: string;
  fallbackHref?: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-surface-border bg-white px-4 py-3">
      <button
        aria-label="Back"
        onClick={() => {
          if (onBack) {
            onBack();
          } else if (window.history.length > 1) {
            router.back();
          } else {
            router.push(fallbackHref);
          }
        }}
        className="-ml-1 p-1 active:scale-90"
      >
        <ChevronLeft size={24} />
      </button>
      <div>
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>
    </header>
  );
}
