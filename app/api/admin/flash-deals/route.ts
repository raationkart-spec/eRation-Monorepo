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

  const deals = await db.flashDeal.findMany({
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ deals });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { productId, salePrice, startsAt, endsAt, isActive = true } = body;

    if (!productId || !salePrice || !endsAt) {
      return NextResponse.json(
        { error: "productId, salePrice and endsAt are required" },
        { status: 400 }
      );
    }

    const deal = await db.flashDeal.create({
      data: {
        productId,
        salePrice: Number(salePrice),
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: new Date(endsAt),
        isActive: Boolean(isActive),
      },
      include: { product: true },
    });

    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/flash-deals error:", error);
    return NextResponse.json({ error: "Failed to create flash deal" }, { status: 500 });
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
      return NextResponse.json({ error: "Flash deal ID is required" }, { status: 400 });
    }

    const deal = await db.flashDeal.update({
      where: { id },
      data: {
        ...data,
        ...(data.salePrice !== undefined && { salePrice: Number(data.salePrice) }),
        ...(data.startsAt !== undefined && { startsAt: new Date(data.startsAt) }),
        ...(data.endsAt !== undefined && { endsAt: new Date(data.endsAt) }),
      },
      include: { product: true },
    });

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("PUT /api/admin/flash-deals error:", error);
    return NextResponse.json({ error: "Failed to update flash deal" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Flash deal ID is required" }, { status: 400 });
  }

  await db.flashDeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
