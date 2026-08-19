import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const products = await db.product.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      categorySlug,
      brand,
      unit,
      mrp,
      price,
      stockQty,
      lowStockThreshold = 5,
      emoji = "📦",
      imageUrl,
      tags = [],
      isActive = true,
      isFeatured = false,
      sortOrder = 0,
    } = body;

    if (!name || !categorySlug || !unit || mrp === undefined || price === undefined) {
      return NextResponse.json(
        { error: "Missing required product fields" },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const product = await db.product.create({
      data: {
        name,
        slug: generatedSlug,
        description,
        categorySlug,
        brand: brand || null,
        unit,
        mrp: Number(mrp),
        price: Number(price),
        stockQty: Number(stockQty || 0),
        lowStockThreshold: Number(lowStockThreshold),
        emoji,
        imageUrl: imageUrl || null,
        tags: Array.isArray(tags) ? tags : [],
        isActive: Boolean(isActive),
        isFeatured: Boolean(isFeatured),
        sortOrder: Number(sortOrder),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.mrp !== undefined && { mrp: Number(data.mrp) }),
        ...(data.price !== undefined && { price: Number(data.price) }),
        ...(data.stockQty !== undefined && { stockQty: Number(data.stockQty) }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("PUT /api/admin/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Soft delete: set isActive to false
    const product = await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("DELETE /api/admin/products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
