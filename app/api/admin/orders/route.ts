import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const orders = await db.order.findMany({
      include: {
        items: true,
        statusHistory: { orderBy: { at: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map DB orders to full domain Order objects
    const formattedOrders = orders.map((o) => {
      // Parse addressLine if needed or provide standard fields
      const parts = o.addressLine ? o.addressLine.split(", ") : [];
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        address: {
          name: o.customerName,
          phone: o.customerPhone,
          line1: parts[0] || o.addressLine || "Address",
          line2: parts[1] || "",
          city: "Siliguri",
          state: "West Bengal",
          pincode: o.addressLine?.slice(-6) || "734001",
        },
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        deliveryFee: o.deliveryFee,
        discount: o.discount,
        total: o.total,
        notes: o.notes || undefined,
        createdAt: o.createdAt.toISOString(),
        deliveredAt: o.deliveredAt ? o.deliveredAt.toISOString() : undefined,
        items: o.items.map((i) => ({
          productId: i.productId || i.id,
          name: i.name,
          unit: i.unit,
          emoji: i.emoji,
          price: i.price,
          mrp: i.mrp,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
        statusHistory: o.statusHistory.map((h) => ({
          status: h.status,
          note: h.note || undefined,
          at: h.at.toISOString(),
        })),
      };
    });

    return NextResponse.json({ orders: formattedOrders });
  } catch (error: any) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin orders" },
      { status: 500 }
    );
  }
}
