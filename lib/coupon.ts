import { formatMoney } from "./format";

export interface CouponRow {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
}

export function computeCouponDiscount(
  coupon: CouponRow,
  subtotal: number
): { discount: number } | { error: string } {
  if (!coupon.isActive) return { error: "This coupon is no longer active" };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { error: "This coupon has expired" };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { error: "This coupon has reached its usage limit" };
  }
  if (subtotal < coupon.minOrderValue) {
    return {
      error: `Add ${formatMoney(coupon.minOrderValue - subtotal)} more to use this coupon`,
    };
  }

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);

  return { discount };
}
