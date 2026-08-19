import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { products } = await request.json();
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "No products provided for import" },
        { status: 400 }
      );
    }

    // Process all products inside a database transaction
    const results = await db.$transaction(
      products.map((p: any) => {
        const slug =
          p.slug ||
          p.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        return db.product.upsert({
          where: { slug },
          update: {
            name: p.name,
            categorySlug: p.categorySlug,
            brand: p.brand || null,
            unit: p.unit,
            mrp: Number(p.mrp),
            price: Number(p.price),
            stockQty: Number(p.stockQty ?? 0),
            lowStockThreshold: Number(p.lowStockThreshold ?? 5),
            emoji: p.emoji || "📦",
            imageUrl: p.imageUrl || null,
            description: p.description || null,
            tags: Array.isArray(p.tags) ? p.tags : [],
            isActive: Boolean(p.isActive),
            isFeatured: Boolean(p.isFeatured ?? false),
          },
          create: {
            name: p.name,
            slug,
            categorySlug: p.categorySlug,
            brand: p.brand || null,
            unit: p.unit,
            mrp: Number(p.mrp),
            price: Number(p.price),
            stockQty: Number(p.stockQty ?? 0),
            lowStockThreshold: Number(p.lowStockThreshold ?? 5),
            emoji: p.emoji || "📦",
            imageUrl: p.imageUrl || null,
            description: p.description || null,
            tags: Array.isArray(p.tags) ? p.tags : [],
            isActive: Boolean(p.isActive),
            isFeatured: Boolean(p.isFeatured ?? false),
            sortOrder: Number(p.sortOrder ?? 0),
          },
        });
      })
    );

    return NextResponse.json(
      { imported: results.length, products: results },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/products/bulk error:", error);
    return NextResponse.json(
      { error: "Bulk import failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
