"use client";
import { use, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Info, ShieldCheck, ChevronDown } from "lucide-react";
import { useCatalog } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductCard } from "@/components/ProductCard";
import { EmptyState } from "@/components/misc";
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

  const [nutritionalOpen, setNutritionalOpen] = useState(false);
  const [benefitsOpen, setBenefitsOpen] = useState(false);

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
    <div className="content-in pb-12 max-w-2xl mx-auto">
      {/* Back button */}
      <Link
        href={category ? `/category/${category.slug}` : "/"}
        className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft size={20} /> Back
      </Link>

      {/* Main Image Header matching Stitch */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
        {discount > 0 && (
          <span className="absolute left-4 top-4 z-10 rounded-full bg-red-600 px-3 py-1 text-2xs font-extrabold text-white shadow-sm">
            {discount}% OFF
          </span>
        )}
        <ProductImage
          imageUrl={product.imageUrl}
          emoji={product.emoji}
          alt={product.name}
          className="aspect-square w-full rounded-xl"
          size="text-[120px]"
        />
      </div>

      {/* Details Section Container matching Stitch rounded-t-3xl -mt-6 */}
      <section className="relative z-10 -mt-6 rounded-t-3xl border-t border-slate-200/80 bg-white p-6 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="mb-4">
          <p className="text-2xs font-extrabold uppercase tracking-widest text-orange-600">
            {product.brand || "Fresh Quality"}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
            {product.name}
          </h1>
          <p className="mt-0.5 text-sm font-medium text-slate-500">{product.unit}</p>
        </div>

        {/* Price & Quantity Selector */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">
                {formatMoney(product.price)}
              </span>
              {discount > 0 && (
                <span className="text-sm font-medium text-slate-400 line-through">
                  {formatMoney(product.mrp)}
                </span>
              )}
              {discount > 0 && (
                <span className="rounded bg-orange-100 px-2 py-0.5 text-2xs font-extrabold text-orange-700">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="mt-1 text-2xs font-semibold text-slate-400">
              (Inclusive of all taxes)
            </p>
          </div>

          <div className="w-36">
            <AddToCartButton product={product} />
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mb-6">
            <h3 className="mb-2 text-base font-bold text-slate-900">Product Description</h3>
            <p className="text-sm leading-relaxed font-medium text-slate-600">
              {product.description}
            </p>
          </div>
        )}

        {/* Expandable Accordions matching Stitch */}
        <div className="space-y-3 mb-8">
          {/* Accordion 1: Nutritional Info */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50">
            <button
              onClick={() => setNutritionalOpen(!nutritionalOpen)}
              className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-slate-800 hover:bg-slate-100/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Info size={18} className="text-orange-600" /> Nutritional Information
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${
                  nutritionalOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {nutritionalOpen && (
              <div className="border-t border-slate-200/60 p-4 pt-3 text-xs font-semibold text-slate-600">
                <ul className="space-y-2">
                  <li className="flex justify-between border-b border-slate-200/40 pb-1">
                    <span>Energy</span> <span>87 kcal</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200/40 pb-1">
                    <span>Total Fat</span> <span>6.0 g</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200/40 pb-1">
                    <span>Protein</span> <span>3.3 g</span>
                  </li>
                  <li className="flex justify-between border-b border-slate-200/40 pb-1">
                    <span>Calcium</span> <span>150 mg</span>
                  </li>
                </ul>
                <p className="mt-2.5 text-2xs text-slate-400">*Per 100g approximate values</p>
              </div>
            )}
          </div>

          {/* Accordion 2: Product Benefits */}
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50">
            <button
              onClick={() => setBenefitsOpen(!benefitsOpen)}
              className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-slate-800 hover:bg-slate-100/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Product Quality & Benefits
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${
                  benefitsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {benefitsOpen && (
              <div className="border-t border-slate-200/60 p-4 pt-3 text-xs font-semibold text-slate-600">
                <ul className="list-disc list-inside space-y-2">
                  <li>Handpicked fresh daily for maximum nutrition</li>
                  <li>Strict quality standards with zero synthetic preservatives</li>
                  <li>Hygienically packed and stored at optimum temperatures</li>
                  <li>100% Satisfaction or instant return policy</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {related.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Similar Products</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </section>

      {/* Sticky Bottom Action Bar matching Stitch */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl border-t border-slate-200/90 bg-white/95 p-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900">{formatMoney(product.price)}</span>
              {discount > 0 && (
                <span className="text-xs font-semibold text-slate-400 line-through">
                  {formatMoney(product.mrp)}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-400">Unit: {product.unit}</p>
          </div>
          <div className="w-36">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
