import Link from "next/link";
import clsx from "clsx";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-2 mt-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-brand-dark">
          See all
        </Link>
      )}
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-0.5 text-2xs font-semibold",
        ORDER_STATUS_COLOR[status]
      )}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  emoji,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="text-6xl">{emoji}</span>
      <p className="mt-4 text-lg font-semibold text-ink">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="btn-primary mt-5">
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
