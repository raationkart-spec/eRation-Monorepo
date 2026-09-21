import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id || request.headers.get("x-user-id");
    const role = (session?.user as any)?.role || request.headers.get("x-user-role");
    const isAuth = Boolean(session?.user || userId || role);

    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    // Rate limiting: 60 requests per minute per user/client to protect catalog and prevent abuse
    const rateKey = `barcode-lookup:${userId || (session?.user as any)?.email || "auth_user"}`;
    if (!rateLimit(rateKey, 60, 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { code } = await params;
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Barcode or item code required" }, { status: 400 });
    }

    const decoded = decodeURIComponent(code).trim();
    if (!decoded) {
      return NextResponse.json({ error: "Barcode or item code cannot be empty" }, { status: 400 });
    }

    const product = await db.product.findFirst({
      where: {
        OR: [
          { itemCode: decoded },
          { barcode: decoded },
          { slug: decoded.toLowerCase() },
        ],
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Hide inactive catalog products from non-admin storefront customers
    if (role !== "ADMIN" && !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Admins receive the rich internal view (category, stockQty, itemCode, barcode, timestamps)
    if (role === "ADMIN") {
      return NextResponse.json({ product });
    }

    // Customers receive strictly sanitized storefront fields:
    // (id, name, slug, price, mrp, image, unit, availability).
    // Audit fields, raw stock shortage details, and internal IDs are strictly withheld.
    const isAvailable = Boolean(product.isActive && product.stockQty > 0);
    const safeProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      mrp: product.mrp,
      image: product.imageUrl || null,
      imageUrl: product.imageUrl || null,
      emoji: product.emoji || "📦",
      unit: product.unit,
      availability: isAvailable ? "IN_STOCK" : "OUT_OF_STOCK",
      isAvailable,
    };

    return NextResponse.json({ product: safeProduct });
  } catch (error: any) {
    console.error("GET /api/products/barcode/[code] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to lookup product by barcode" },
      { status: 500 }
    );
  }
}
