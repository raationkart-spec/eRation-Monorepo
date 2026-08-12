import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeCouponDiscount } from "@/lib/coupon";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json({ error: "Coupon code and subtotal are required" }, { status: 400 });
    }

    const coupon = await db.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });
    }

    const result = computeCouponDiscount(coupon, subtotal);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ coupon, discount: result.discount });
  } catch (error) {
    console.error("POST /api/coupons/validate error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
