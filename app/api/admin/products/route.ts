import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveSymbology } from "@/lib/inventory/barcode";

function isSafeImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("vbscript:")) return false;
  return lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("/");
}

function sanitizeMedia(
  imageUrlsInput: any,
  singleImageUrlInput: any
): { imageUrls: string[]; imageUrl: string | null } {
  let urls: string[] = [];

  if (Array.isArray(imageUrlsInput)) {
    for (const item of imageUrlsInput) {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed) {
          if (!isSafeImageUrl(trimmed)) {
            throw new Error("Invalid or unsafe image URL detected");
          }
          if (!urls.includes(trimmed)) {
            urls.push(trimmed);
          }
        }
      }
    }
  }

  if (
    urls.length === 0 &&
    typeof singleImageUrlInput === "string" &&
    singleImageUrlInput.trim()
  ) {
    const trimmed = singleImageUrlInput.trim();
    if (!isSafeImageUrl(trimmed)) {
      throw new Error("Invalid or unsafe image URL detected");
    }
    urls.push(trimmed);
  }

  if (urls.length > 10) {
    urls = urls.slice(0, 10);
  }

  return {
    imageUrls: urls,
    imageUrl: urls.length > 0 ? urls[0] : null,
  };
}

function normalizeItemCode(val: any): {
  itemCode: string | null;
  barcode: string | null;
  barcodeSymbology: string | null;
} {
  if (val === undefined || val === null) {
    return { itemCode: null, barcode: null, barcodeSymbology: null };
  }
  const trimmed = String(val).trim();
  if (trimmed.length === 0) {
    return { itemCode: null, barcode: null, barcodeSymbology: null };
  }
  if (trimmed.length > 80) {
    throw new Error("Item code must be 80 characters or fewer");
  }
  if (!/^[\x20-\x7E]+$/.test(trimmed)) {
    throw new Error("Item code contains invalid characters (must be printable ASCII)");
  }
  const symbology = resolveSymbology(trimmed) || "CODE128";
  return {
    itemCode: trimmed,
    barcode: trimmed,
    barcodeSymbology: symbology,
  };
}

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
      imageUrls,
      itemCode,
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

    // Process & validate item code & barcode
    let codeData;
    try {
      codeData = normalizeItemCode(itemCode);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (codeData.itemCode) {
      const existing = await db.product.findUnique({
        where: { itemCode: codeData.itemCode },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: `Item code "${codeData.itemCode}" is already assigned to another product (${existing.name})`,
          },
          { status: 409 }
        );
      }
    }

    // Process & validate media
    let mediaData;
    try {
      mediaData = sanitizeMedia(imageUrls, imageUrl);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
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
        description: description || null,
        categorySlug,
        brand: brand || null,
        unit,
        mrp: Number(mrp),
        price: Number(price),
        stockQty: Number(stockQty || 0),
        lowStockThreshold: Number(lowStockThreshold),
        emoji,
        imageUrl: mediaData.imageUrl,
        imageUrls: mediaData.imageUrls,
        itemCode: codeData.itemCode,
        barcode: codeData.barcode,
        barcodeSymbology: codeData.barcodeSymbology,
        tags: Array.isArray(tags) ? tags : [],
        isActive: Boolean(isActive),
        isFeatured: Boolean(isFeatured),
        sortOrder: Number(sortOrder),
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/products error:", error);
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) || [];
      if (target.includes("itemCode") || String(error.message).includes("itemCode")) {
        return NextResponse.json(
          { error: "Item code is already assigned to another product" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Unique constraint failed on product " + target.join(", ") },
        { status: 409 }
      );
    }
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

    const updateData: Record<string, any> = { ...data };

    // Numerical and type conversions
    if (data.mrp !== undefined) updateData.mrp = Number(data.mrp);
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.stockQty !== undefined) updateData.stockQty = Number(data.stockQty);
    if (data.lowStockThreshold !== undefined)
      updateData.lowStockThreshold = Number(data.lowStockThreshold);
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.isFeatured !== undefined)
      updateData.isFeatured = Boolean(data.isFeatured);

    // Explicit item code & barcode handling
    if ("itemCode" in data) {
      let codeData;
      try {
        codeData = normalizeItemCode(data.itemCode);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }

      if (codeData.itemCode) {
        const conflict = await db.product.findFirst({
          where: {
            itemCode: codeData.itemCode,
            id: { not: id },
          },
        });
        if (conflict) {
          return NextResponse.json(
            {
              error: `Item code "${codeData.itemCode}" is already assigned to another product (${conflict.name})`,
            },
            { status: 409 }
          );
        }
      }

      updateData.itemCode = codeData.itemCode;
      updateData.barcode = codeData.barcode;
      updateData.barcodeSymbology = codeData.barcodeSymbology;
    }

    // Explicit media handling
    if ("imageUrls" in data || "imageUrl" in data) {
      let mediaData;
      try {
        mediaData = sanitizeMedia(data.imageUrls, data.imageUrl);
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      updateData.imageUrls = mediaData.imageUrls;
      updateData.imageUrl = mediaData.imageUrl;
    }

    const product = await db.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("PUT /api/admin/products error:", error);
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) || [];
      if (target.includes("itemCode") || String(error.message).includes("itemCode")) {
        return NextResponse.json(
          { error: "Item code is already assigned to another product" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Unique constraint failed on product " + target.join(", ") },
        { status: 409 }
      );
    }
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
