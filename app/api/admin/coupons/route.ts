import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as any)?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderValue = 0,
      maxDiscount,
      expiresAt,
      usageLimit,
      isActive = true,
    } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required coupon fields" }, { status: 400 });
    }

    const coupon = await db.coupon.create({
      data: {
        code: String(code).trim().toUpperCase(),
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue),
        maxDiscount: maxDiscount != null ? Number(maxDiscount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        usageLimit: usageLimit != null ? Number(usageLimit) : null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const coupon = await db.coupon.update({
      where: { id },
      data: {
        ...data,
        ...(data.code !== undefined && { code: String(data.code).trim().toUpperCase() }),
        ...(data.discountValue !== undefined && { discountValue: Number(data.discountValue) }),
        ...(data.minOrderValue !== undefined && { minOrderValue: Number(data.minOrderValue) }),
        ...(data.maxDiscount !== undefined && {
          maxDiscount: data.maxDiscount != null ? Number(data.maxDiscount) : null,
        }),
        ...(data.usageLimit !== undefined && {
          usageLimit: data.usageLimit != null ? Number(data.usageLimit) : null,
        }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("PUT /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
  }

  await db.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
