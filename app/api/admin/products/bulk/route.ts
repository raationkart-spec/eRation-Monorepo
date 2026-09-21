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
    const results = await db.$transaction(async (tx) => {
      const upserted = [];
      for (const p of products) {
        const slug =
          p.slug ||
          p.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

        const itemCode = p.itemCode ? String(p.itemCode).trim() : null;
        const barcode = p.barcode || itemCode || null;
        const barcodeSymbology = p.barcodeSymbology || (itemCode ? "CODE128" : null);

        // Check if matching by itemCode or slug
        let existing = null;
        if (itemCode) {
          existing = await tx.product.findUnique({ where: { itemCode } });
        }
        if (!existing) {
          existing = await tx.product.findUnique({ where: { slug } });
        }

        let imageUrls: string[] = [];
        if (Array.isArray(p.imageUrls)) {
          imageUrls = p.imageUrls.map((u: any) => String(u).trim()).filter(Boolean);
        } else if (typeof p.imageUrls === "string") {
          imageUrls = p.imageUrls.split(/[,|]+/).map((u: string) => u.trim()).filter(Boolean);
        }
        if (imageUrls.length === 0 && p.imageUrl) {
          imageUrls = [String(p.imageUrl).trim()];
        }
        const imageUrl = imageUrls.length > 0 ? imageUrls[0] : (p.imageUrl || null);

        const dataPayload = {
          name: p.name,
          categorySlug: p.categorySlug,
          brand: p.brand || null,
          unit: p.unit || "1 unit",
          mrp: Number(p.mrp),
          price: Number(p.price),
          stockQty: Number(p.stockQty ?? 0), // Signed integer preserved
          lowStockThreshold: Number(p.lowStockThreshold ?? 5),
          emoji: p.emoji || "📦",
          imageUrl,
          imageUrls,
          description: p.description || null,
          tags: Array.isArray(p.tags) ? p.tags : [],
          isActive: Boolean(p.isActive),
          isFeatured: Boolean(p.isFeatured ?? false),
          sortOrder: Number(p.sortOrder ?? 0),
          ...(itemCode && { itemCode, barcode, barcodeSymbology }),
        };

        if (existing) {
          const res = await tx.product.update({
            where: { id: existing.id },
            data: dataPayload,
          });
          upserted.push(res);
        } else {
          const res = await tx.product.create({
            data: {
              ...dataPayload,
              slug,
            },
          });
          upserted.push(res);
        }
      }

      // Record audit log entry
      await tx.inventoryImport.create({
        data: {
          fileHash: `bulk_api_${Date.now()}`,
          fileName: "bulk_api_upsert.json",
          fileSize: 0,
          sheetName: "API_BULK",
          importedBy: session?.user?.email || "admin@quickcart.com",
          totalRows: products.length,
          createdCount: upserted.length,
          updatedCount: 0,
          skippedCount: 0,
          errorCount: 0,
          shortageCount: upserted.filter((p) => p.stockQty < 0).length,
          missingCodeCount: upserted.filter((p) => !p.itemCode).length,
          status: "COMMITTED",
          summary: {
            upsertedCount: upserted.length,
            timestamp: new Date().toISOString(),
          },
        },
      });

      return upserted;
    });

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
