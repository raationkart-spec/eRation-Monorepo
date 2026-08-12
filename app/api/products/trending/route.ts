import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const grouped = await db.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 12,
    });

    const ids = grouped
      .map((g) => g.productId)
      .filter((id): id is string => !!id);

    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
    });

    const order = new Map(ids.map((id, i) => [id, i]));
    products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products/trending error:", error);
    return NextResponse.json({ error: "Failed to fetch trending products" }, { status: 500 });
  }
}
