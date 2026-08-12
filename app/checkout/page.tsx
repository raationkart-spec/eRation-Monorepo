"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Wallet, MapPin, Receipt, ShieldCheck, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProductImage } from "@/components/ProductImage";
import { EmptyState } from "@/components/misc";
import {
  useAuth,
  useCart,
  useCatalog,
  useShop,
  makeOrderNumber,
  seedAddress,
} from "@/lib/store";
import { useCartComputed } from "@/lib/hooks";
import { formatMoney } from "@/lib/format";
import { CartSkeleton } from "@/components/skeletons";
import { useHydrated } from "@/lib/useHydrated";
import type { Address, Order } from "@/lib/types";

export default function CheckoutPage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const addresses = useShop((s) => s.addresses);
  const orders = useShop((s) => s.orders);
  const addOrder = useShop((s) => s.addOrder);
  const pincodes = useCatalog((s) => s.pincodes);
  const clearCart = useCart((s) => s.clear);
  const { lines, subtotal, deliveryFee, platformFee, total } = useCartComputed();

  const [selectedId, setSelectedId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "GPAY">("COD");
  const [placing, setPlacing] = useState(false);
  const appliedCoupon = useShop((s) => s.appliedCoupon);
  const setAppliedCoupon = useShop((s) => s.setAppliedCoupon);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const storeAddresses = (Array.isArray(addresses) ? addresses : [])
    .filter((a): a is Address => Boolean(a && typeof a === "object" && a.id && a.pincode));
  const validAddresses = storeAddresses.length > 0 ? storeAddresses : [seedAddress];

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login?returnTo=/checkout");
      return;
    }
    if (useShop.getState().addresses.length === 0) {
      useShop.getState().addAddress({
        label: seedAddress.label,
        name: user.name || seedAddress.name,
        phone: user.phone || seedAddress.phone,
        line1: seedAddress.line1,
        line2: seedAddress.line2,
        landmark: seedAddress.landmark,
        city: seedAddress.city,
        state: seedAddress.state,
        pincode: seedAddress.pincode,
        isDefault: true,
      });
    }
    fetch("/api/user/addresses")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.addresses && Array.isArray(data.addresses) && data.addresses.length > 0) {
            useShop.getState().setAddresses(data.addresses);
          }
        }
      })
      .catch(() => {});
  }, [hydrated, user, router]);

  useEffect(() => {
    if (validAddresses.length > 0) {
      const def = validAddresses.find((a) => a?.isDefault) ?? validAddresses[0];
      if (def && (!selectedId || !validAddresses.some((a) => a.id === selectedId))) {
        setSelectedId(def.id);
      }
    }
  }, [validAddresses, selectedId]);

  if (!hydrated || !user) return <CartSkeleton />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white">
        <PageHeader title="Checkout" />
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          ctaLabel="Start shopping"
          ctaHref="/"
        />
      </div>
    );
  }

  const selected = validAddresses.find((a) => a?.id === selectedId) ?? validAddresses.find((a) => Boolean(a?.id)) ?? seedAddress;
  const activeSelectedId = selectedId || selected?.id || seedAddress.id;
  const serviceable = selected
    ? pincodes.length === 0 || pincodes.includes(selected.pincode) || selected.pincode.startsWith("734")
    : false;
  const discount = appliedCoupon?.discount ?? 0;
  const grandTotal = Math.max(0, total - discount);

  const applyCoupon = () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponInput.trim(), subtotal }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid coupon");
        setAppliedCoupon({ code: data.coupon.code, discount: data.discount });
      })
      .catch((err) => {
        setAppliedCoupon(null);
        setCouponError(err.message || "Failed to apply coupon");
      })
      .finally(() => setApplyingCoupon(false));
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const placeOrder = () => {
    const targetAddress = selected || seedAddress;
    setPlacing(true);
    const order: Order = {
      id: "ord_" + Date.now(),
      orderNumber: makeOrderNumber(orders.length + 1),
      items: lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        unit: l.product.unit,
        emoji: l.product.emoji,
        imageUrl: l.product.imageUrl,
        price: l.unitPrice,
        mrp: l.product.mrp,
        quantity: l.quantity,
        subtotal: l.lineTotal,
      })),
      address: {
        label: targetAddress.label,
        name: targetAddress.name,
        phone: targetAddress.phone,
        line1: targetAddress.line1,
        line2: targetAddress.line2,
        landmark: targetAddress.landmark,
        city: targetAddress.city,
        state: targetAddress.state,
        pincode: targetAddress.pincode,
      },
      status: "PLACED",
      paymentMethod: paymentMethod === "GPAY" ? "UPI" : "COD",
      paymentStatus: "PENDING",
      subtotal,
      deliveryFee,
      platformFee,
      discount,
      couponCode: appliedCoupon?.code,
      total: grandTotal,
      createdAt: new Date().toISOString(),
      statusHistory: [{ status: "PLACED", at: new Date().toISOString() }],
      customerName: user.name,
      customerPhone: user.phone ?? targetAddress.phone,
    };
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          unit: l.product.unit,
          emoji: l.product.emoji,
          imageUrl: l.product.imageUrl,
          price: l.unitPrice,
          mrp: l.product.mrp,
          quantity: l.quantity,
          subtotal: l.lineTotal,
          categorySlug: l.product.categorySlug,
          dealId: l.dealId,
        })),
        address: {
          label: targetAddress.label,
          name: targetAddress.name,
          phone: targetAddress.phone,
          line1: targetAddress.line1,
          line2: targetAddress.line2,
          landmark: targetAddress.landmark,
          city: targetAddress.city,
          state: targetAddress.state,
          pincode: targetAddress.pincode,
        },
        paymentMethod: paymentMethod === "GPAY" ? "UPI" : "COD",
        customerName: user.name,
        customerPhone: user.phone ?? targetAddress.phone,
        couponCode: appliedCoupon?.code,
      }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          const dbOrder = data.order;
          const formatted: Order = {
            id: dbOrder.id,
            orderNumber: dbOrder.orderNumber,
            items: dbOrder.items.map((i: any) => ({
              productId: i.productId || i.id,
              name: i.name,
              unit: i.unit,
              emoji: i.emoji,
              imageUrl: i.imageUrl,
              price: i.price,
              mrp: i.mrp,
              quantity: i.quantity,
              subtotal: i.subtotal,
            })),
            address: order.address,
            status: dbOrder.status,
            paymentMethod: dbOrder.paymentMethod,
            paymentStatus: dbOrder.paymentStatus,
            subtotal: dbOrder.subtotal,
            deliveryFee: dbOrder.deliveryFee,
            platformFee: dbOrder.platformFee,
            discount: dbOrder.discount,
            couponCode: dbOrder.couponCode ?? undefined,
            total: dbOrder.total,
            createdAt: dbOrder.createdAt,
            statusHistory: dbOrder.statusHistory?.map((h: any) => ({
              status: h.status,
              at: h.at,
              note: h.note,
            })) || [{ status: "PLACED", at: new Date().toISOString() }],
            customerName: dbOrder.customerName,
            customerPhone: dbOrder.customerPhone,
          };
          addOrder(formatted);
          setAppliedCoupon(null);
          clearCart();
          router.replace(`/orders/${formatted.id}?placed=true`);
        } else {
          addOrder(order);
          setAppliedCoupon(null);
          clearCart();
          router.replace(`/orders/${order.id}?placed=true`);
        }
      })
      .catch(() => {
        addOrder(order);
        clearCart();
        router.replace(`/orders/${order.id}?placed=true`);
      });
  };

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-slate-50 pb-32">
      <PageHeader title="Checkout" />

      <div className="space-y-4 p-4">
        {/* Delivery Address Section matching Stitch */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MapPin size={18} className="text-orange-600 fill-orange-600/20" /> Deliver to Address
            </h2>
            <Link
              href="/account/addresses/new?returnTo=/checkout"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-orange-600 hover:underline"
            >
              <Plus size={14} /> Add New
            </Link>
          </div>

          {validAddresses.length === 0 ? (
            <Link
              href="/account/addresses/new?returnTo=/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <Plus size={16} /> Add Delivery Address
            </Link>
          ) : (
            <div className="space-y-2.5">
              {validAddresses.map((a) => {
                if (!a || !a.id) return null;
                const isSel = activeSelectedId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    aria-label={`Deliver to ${a.name}, ${a.line1}, ${a.city} ${a.pincode}`}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      isSel
                        ? "border-orange-500 bg-orange-50/40 shadow-xs"
                        : "border-slate-200/80 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isSel
                          ? "border-orange-600 bg-orange-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {isSel && <Check size={12} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-2xs font-extrabold uppercase text-slate-700">
                          {a.label ?? "Home"}
                        </span>
                        <p className="text-xs font-bold text-slate-900">{a.name}</p>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 font-medium line-clamp-2">
                        {a.line1}, {a.line2 ? a.line2 + ", " : ""}
                        {a.city}, {a.state} - {a.pincode}
                      </p>
                      <p className="mt-0.5 text-2xs text-slate-400 font-semibold">{a.phone}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selected && !serviceable && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 space-y-1">
              <p className="font-extrabold text-red-800 flex items-center gap-1.5 text-sm">
                🚫 Delivery Blocked: Pincode {selected.pincode} Unserviceable
              </p>
              <p className="text-2xs font-medium text-red-600">
                We currently deliver only to serviceable Siliguri pincodes:{" "}
                <span className="font-bold">{pincodes.join(", ")}</span>.
                Please select or add a Siliguri address to place your order.
              </p>
            </div>
          )}
        </section>

        {/* Payment Method Section matching Stitch */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Wallet size={18} className="text-slate-500" /> Pay Using
          </h2>

          <div
            onClick={() => setPaymentMethod("GPAY")}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
              paymentMethod === "GPAY"
                ? "border-orange-500 bg-orange-50/40"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-10 items-center justify-center rounded border border-slate-200 bg-white font-extrabold text-blue-600 text-2xs">
                GPay
              </div>
              <span className="text-xs font-bold text-slate-900">Google Pay / UPI</span>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "GPAY" ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300"}`}>
              {paymentMethod === "GPAY" && <Check size={12} />}
            </div>
          </div>

          <div
            onClick={() => setPaymentMethod("COD")}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
              paymentMethod === "COD"
                ? "border-orange-500 bg-orange-50/40"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet size={20} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-900">Pay on Delivery (Cash/UPI)</span>
            </div>
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300"}`}>
              {paymentMethod === "COD" && <Check size={12} />}
            </div>
          </div>
        </section>

        {/* Coupon Section */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-2.5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            🏷️ Apply Coupon
          </h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <div>
                <p className="text-xs font-extrabold text-emerald-800">{appliedCoupon.code} applied</p>
                <p className="text-2xs text-emerald-600 font-semibold">
                  You saved {formatMoney(appliedCoupon.discount)}
                </p>
              </div>
              <button
                onClick={removeCoupon}
                className="text-2xs font-bold text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold uppercase outline-none focus:border-orange-500"
              />
              <button
                onClick={applyCoupon}
                disabled={applyingCoupon || !couponInput.trim()}
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {applyingCoupon ? "Checking..." : "Apply"}
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-2xs font-semibold text-red-600">{couponError}</p>
          )}
        </section>

        {/* Order Items & Bill Details */}
        <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Receipt size={18} className="text-slate-500" /> Bill Summary
          </h2>
          <div className="space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Item Subtotal ({lines.length} items)</span>
              <span className="text-slate-900">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-slate-900"}>
                {deliveryFee === 0 ? "FREE" : formatMoney(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform & Handling Fee</span>
              <span className="text-slate-900">{formatMoney(platformFee)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span className="text-emerald-600 font-bold">-{formatMoney(discount)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-slate-200 pt-2.5 flex justify-between text-sm font-black text-slate-900">
              <span>Grand Total</span>
              <span className="text-orange-600">{formatMoney(grandTotal)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Place Order Bar matching Stitch */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl border-t border-slate-200 bg-white/95 p-4 shadow-[0_-8px_20px_-6px_rgba(0,0,0,0.1)] backdrop-blur-lg rounded-t-2xl">
        <button
          disabled={placing}
          onClick={placeOrder}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-orange-700 disabled:opacity-50 active:scale-95"
        >
          <span>{placing ? "Placing Order..." : `Pay ${formatMoney(grandTotal)} & Place Order`}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
