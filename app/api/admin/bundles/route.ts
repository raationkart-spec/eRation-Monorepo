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

  const bundles = await db.bundle.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bundles });
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, tag, imageUrl, price, isActive = true, items } = body;

    if (!name || !price || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "name, price and at least one item are required" },
        { status: 400 }
      );
    }

    const bundle = await db.bundle.create({
      data: {
        name,
        description,
        tag,
        imageUrl,
        price: Number(price),
        isActive: Boolean(isActive),
        items: {
          create: items.map((i: { productId: string; quantity?: number }) => ({
            productId: i.productId,
            quantity: Number(i.quantity) || 1,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    return NextResponse.json({ bundle }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/bundles error:", error);
    return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, items, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });
    }

    const bundle = await db.$transaction(async (tx) => {
      if (Array.isArray(items)) {
        await tx.bundleItem.deleteMany({ where: { bundleId: id } });
        await tx.bundleItem.createMany({
          data: items.map((i: { productId: string; quantity?: number }) => ({
            bundleId: id,
            productId: i.productId,
            quantity: Number(i.quantity) || 1,
          })),
        });
      }

      return tx.bundle.update({
        where: { id },
        data: {
          ...data,
          ...(data.price !== undefined && { price: Number(data.price) }),
        },
        include: { items: { include: { product: true } } },
      });
    });

    return NextResponse.json({ bundle });
  } catch (error) {
    console.error("PUT /api/admin/bundles error:", error);
    return NextResponse.json({ error: "Failed to update bundle" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Bundle ID is required" }, { status: 400 });
  }

  await db.bundle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
