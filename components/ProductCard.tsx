"use client";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { discountPercent, formatMoney } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  const discount = discountPercent(product.mrp, product.price);
  const low = product.stockQty > 0 && product.stockQty <= product.lowStockThreshold;

  return (
    <div className="flex flex-col rounded-lg border border-surface-border bg-white p-2 shadow-card">
      <Link href={`/product/${product.slug}`} className="relative block">
        {discount > 0 && (
          <span className="absolute left-0 top-0 z-10 rounded-br-md rounded-tl-md bg-brand px-1.5 py-0.5 text-2xs font-bold text-white">
            {discount}% OFF
          </span>
        )}
        <ProductImage
          emoji={product.emoji}
          className="aspect-square rounded-md"
          size="text-6xl"
        />
      </Link>
      <div className="mt-2 flex flex-1 flex-col">
        <Link href={`/product/${product.slug}`}>
          <p className="line-clamp-2 min-h-[36px] text-sm font-medium text-ink">
            {product.name}
          </p>
        </Link>
        <p className="mt-0.5 text-xs text-ink-subtle">{product.unit}</p>
        {low && (
          <p className="mt-0.5 text-2xs font-semibold text-status-warning">
            Only {product.stockQty} left
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-1 pt-2">
          <div className="min-w-0">
            <p className="text-md font-bold leading-tight text-ink">
              {formatMoney(product.price)}
            </p>
            {discount > 0 && (
              <p className="text-2xs text-ink-subtle line-through">
                {formatMoney(product.mrp)}
              </p>
            )}
          </div>
          <div className="w-[92px] shrink-0">
            <AddToCartButton product={product} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg border border-surface-border bg-white p-2">
      <div className="aspect-square animate-pulse rounded-md bg-surface-muted" />
      <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-surface-muted" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface-muted" />
      <div className="mt-3 h-8 w-full animate-pulse rounded bg-surface-muted" />
    </div>
  );
}
