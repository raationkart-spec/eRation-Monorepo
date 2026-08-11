import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch today's metrics
    const todayOrders = await db.order.findMany({
      where: {
        createdAt: { gte: todayStart },
        status: { not: "CANCELLED" },
      },
    });

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const todayOrderCount = todayOrders.length;

    const pendingOrdersCount = await db.order.count({
      where: {
        status: { in: ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY"] },
      },
    });

    // Low stock products
    const lowStockProducts = await db.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: db.product.fields.lowStockThreshold },
      },
      take: 10,
    });

    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    return NextResponse.json({
      todayRevenue,
      todayOrderCount,
      pendingOrdersCount,
      lowStockProducts,
      recentOrders,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin metrics" },
      { status: 500 }
    );
  }
}
