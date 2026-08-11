"use client";
import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader, EmptyState } from "@/components/misc";
import { ProductDetailSkeleton } from "@/components/skeletons";
import { discountPercent, formatMoney } from "@/lib/format";
import { useHydrated } from "@/lib/useHydrated";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const hydrated = useHydrated();
  const products = useCatalog((s) => s.products);
  const categories = useCatalog((s) => s.categories);

  if (!hydrated) return <ProductDetailSkeleton />;

  const product = products.find((p) => p.slug === slug && p.isActive);
  if (!product) {
    return (
      <EmptyState
        emoji="🔍"
        title="Product not found"
        ctaLabel="Back to home"
        ctaHref="/"
      />
    );
  }

  const category = categories.find((c) => c.slug === product.categorySlug);
  const discount = discountPercent(product.mrp, product.price);
  const related = products
    .filter(
      (p) =>
        p.categorySlug === product.categorySlug &&
        p.id !== product.id &&
        p.isActive
    )
    .slice(0, 6);

  return (
    <div className="content-in">
      <Link
        href={category ? `/category/${category.slug}` : "/"}
        className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-ink-muted"
      >
        <ChevronLeft size={18} /> Back
      </Link>

      <div className="relative overflow-hidden rounded-xl border border-surface-border">
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-md bg-brand px-2 py-1 text-xs font-bold text-white">
            {discount}% OFF
          </span>
        )}
        <ProductImage
          imageUrl={product.imageUrl}
          emoji={product.emoji}
          alt={product.name}
          className="aspect-square"
          size="text-[120px]"
        />
      </div>

      <div className="mt-4">
        {product.brand && (
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            {product.brand}
          </p>
        )}
        <h1 className="text-2xl font-bold text-ink">{product.name}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">{product.unit}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-2xl font-bold text-ink">
            {formatMoney(product.price)}
          </span>
          {discount > 0 && (
            <span className="text-md text-ink-subtle line-through">
              {formatMoney(product.mrp)}
            </span>
          )}
          {discount > 0 && (
            <span className="text-sm font-semibold text-brand-dark">
              {discount}% off
            </span>
          )}
        </div>

        <div className="mt-2">
          {product.stockQty > 0 ? (
            <span className="text-sm font-medium text-status-success">
              ● In stock
            </span>
          ) : (
            <span className="text-sm font-medium text-status-error">
              ● Out of stock
            </span>
          )}
        </div>

        <div className="mt-4 max-w-xs">
          <AddToCartButton product={product} />
        </div>

        {product.description && (
          <div className="mt-6">
            <h2 className="mb-1 text-lg font-semibold">Description</h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              {product.description}
            </p>
          </div>
        )}

        {category && (
          <p className="mt-4 text-xs text-ink-subtle">
            Category:{" "}
            <Link
              href={`/category/${category.slug}`}
              className="font-medium text-brand-dark"
            >
              {category.name}
            </Link>
          </p>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-6">
          <SectionHeader title="You might also like" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
