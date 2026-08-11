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
    <div className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden rounded-xl bg-slate-50">
        {discount > 0 && (
          <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-0.5 text-2xs font-extrabold text-white shadow-sm">
            {discount}% OFF
          </span>
        )}
        <ProductImage
          imageUrl={product.imageUrl}
          emoji={product.emoji}
          alt={product.name}
          className="aspect-square rounded-xl transition-transform duration-300 group-hover:scale-105"
          size="text-6xl"
        />
      </Link>
      <div className="mt-2.5 flex flex-1 flex-col">
        <Link href={`/product/${product.slug}`}>
          <p className="line-clamp-2 min-h-[36px] text-sm font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">
            {product.name}
          </p>
        </Link>
        <p className="mt-0.5 text-xs font-medium text-slate-400">{product.unit}</p>
        {low && (
          <p className="mt-0.5 text-2xs font-bold text-amber-600">
            Only {product.stockQty} left in stock
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-1 pt-2.5">
          <div className="min-w-0">
            <p className="text-md font-extrabold leading-tight text-slate-900">
              {formatMoney(product.price)}
            </p>
            {discount > 0 && (
              <p className="text-2xs font-medium text-slate-400 line-through">
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
    <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
      <div className="aspect-square animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-2.5 h-3.5 w-3/4 animate-pulse rounded-md bg-slate-100" />
      <div className="mt-2 h-3 w-1/3 animate-pulse rounded-md bg-slate-100" />
      <div className="mt-3 h-8 w-full animate-pulse rounded-lg bg-slate-100" />
    </div>
  );
}
