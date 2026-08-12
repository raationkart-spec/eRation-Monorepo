"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, MapPin, Receipt, Tag, ArrowRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductImage } from "@/components/ProductImage";
import { EmptyState } from "@/components/misc";
import { ToastHost } from "@/components/toast";
import { useCart, useShop } from "@/lib/store";
import { useCartComputed } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { CartSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";

export default function CartPage() {
  const hydrated = useHydrated();
  const setQty = useCart((s) => s.setQty);
  const addresses = useShop((s) => s.addresses);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const { lines, itemCount, subtotal, deliveryFee, freeDeliveryAbove, total } =
    useCartComputed();

  if (!hydrated) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white">
        <PageHeader title="My Cart" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add fresh groceries to get started"
          ctaLabel="Start shopping"
          ctaHref="/"
        />
      </div>
    );
  }

  const remaining = freeDeliveryAbove - subtotal;
  const savings = lines.reduce((sum, l) => sum + (l.product.mrp - l.unitPrice) * l.quantity, 0);

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-slate-50 pb-28">
      <PageHeader title="Checkout Cart" subtitle={`${itemCount} items`} />

      {deliveryFee > 0 && remaining > 0 && (
        <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 text-center text-xs font-bold text-emerald-800">
          Add {formatMoney(remaining)} more for FREE 10-Min delivery ⚡
        </div>
      )}

      <div className="space-y-4 p-4">
        {/* Items List matching Stitch */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Order Items</h2>
          <div className="divide-y divide-slate-100 space-y-3">
            {lines.map((line) => {
              const stockIssue = line.product.stockQty < line.quantity;
              return (
                <div key={line.product.id} className="pt-3 first:pt-0">
                  <div className="flex items-center gap-3.5">
                    <Link href={`/product/${line.product.slug}`} className="shrink-0">
                      <ProductImage
                        imageUrl={line.product.imageUrl}
                        emoji={line.product.emoji}
                        alt={line.product.name}
                        className="h-16 w-16 rounded-xl border border-slate-100"
                        size="text-3xl"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-slate-900">
                        {line.product.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">{line.product.unit}</p>
                      <p className="mt-1 text-sm font-black text-slate-900">
                        {formatMoney(line.unitPrice)}
                        {line.dealId && (
                          <span className="ml-1.5 text-xs font-semibold text-slate-400 line-through">
                            {formatMoney(line.product.price)}
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Circular Stepper matching Stitch */}
                    <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1 shadow-2xs">
                      <button
                        aria-label="Decrease"
                        onClick={() => setQty(line.product.id, line.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-white active:scale-95 transition-transform"
                      >
                        {line.quantity === 1 ? (
                          <Trash2 size={14} className="text-red-600" />
                        ) : (
                          <Minus size={14} />
                        )}
                      </button>
                      <span className="w-7 text-center text-xs font-extrabold text-slate-900 tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        aria-label="Increase"
                        onClick={() => setQty(line.product.id, line.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-700 hover:bg-white active:scale-95 transition-transform"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {stockIssue && (
                    <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1 text-2xs font-bold text-red-600">
                      Only {line.product.stockQty} left in stock.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Delivery Address Card */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MapPin size={18} className="text-orange-600 fill-orange-600/20" /> Delivery Address
            </h2>
            <Link
              href={defaultAddress ? "/account/addresses" : "/account/addresses/new?returnTo=/cart"}
              className="text-2xs font-extrabold uppercase text-orange-600 hover:underline"
            >
              {defaultAddress ? "Change" : "+ Add Address"}
            </Link>
          </div>

          {defaultAddress ? (
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs font-extrabold uppercase text-slate-700">
                  {defaultAddress.label ?? "Home"}
                </span>
                <span className="text-xs font-bold text-slate-900">{defaultAddress.name}</span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 font-medium">
                {defaultAddress.line1}, {defaultAddress.line2 ? defaultAddress.line2 + ", " : ""}
                {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
              </p>
              <p className="text-2xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                ⚡ Delivery in 10 - 15 minutes in Siliguri
              </p>
            </div>
          ) : (
            <div className="ml-6 pt-1">
              <p className="text-xs font-semibold text-slate-500">
                No delivery address added yet.
              </p>
              <Link
                href="/account/addresses/new?returnTo=/cart"
                className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-orange-600 hover:underline"
              >
                + Add Delivery Address in Siliguri
              </Link>
            </div>
          )}
        </section>

        {/* Bill Details Section matching Stitch */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Receipt size={18} className="text-slate-500" /> Bill Details
          </h2>
          <div className="space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Item Total</span>
              <span className="text-slate-900">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-slate-900"}>
                {deliveryFee === 0 ? "FREE" : formatMoney(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Handling & Platform Fee</span>
              <span className="text-slate-900">{formatMoney(200)}</span>
            </div>
            <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between text-sm font-black text-slate-900">
              <span>To Pay</span>
              <span className="text-orange-600">{formatMoney(total + 200)}</span>
            </div>
          </div>

          {savings > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs font-extrabold text-emerald-800 flex items-center gap-2">
              <Tag size={16} className="text-emerald-700 shrink-0" />
              <span>You are saving {formatMoney(savings)} on this order!</span>
            </div>
          )}
        </section>
      </div>

      {/* Fixed Bottom Checkout Bar matching Stitch */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)] backdrop-blur-lg rounded-t-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-2xs font-extrabold uppercase text-slate-400">Total Bill</span>
            <p className="text-xl font-black text-slate-900 leading-tight">
              {formatMoney(total + 200)}
            </p>
          </div>
          <Link
            href="/checkout"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700 active:scale-95"
          >
            <span>Proceed to Checkout</span> <ArrowRight size={18} />
          </Link>
        </div>
      </div>
      <ToastHost />
    </div>
  );
}
