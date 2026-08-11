import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note }: { status: OrderStatus; note?: string } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isDelivered = status === "DELIVERED";
    const isCancelled = status === "CANCELLED";

    const updatedOrder = await db.$transaction(async (tx) => {
      // If order is cancelled by admin, restore product stock
      if (isCancelled && order.status !== "CANCELLED") {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { increment: item.quantity } },
            });
          }
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          status,
          ...(isDelivered && {
            deliveredAt: new Date(),
            paymentStatus: "COLLECTED",
          }),
          ...(isCancelled && {
            paymentStatus: order.paymentStatus === "COLLECTED" ? "REFUNDED" : "FAILED",
          }),
          statusHistory: {
            create: {
              status,
              note: note || `Status updated to ${status} by admin`,
            },
          },
        },
        include: {
          items: true,
          statusHistory: { orderBy: { at: "asc" } },
        },
      });
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id]/status error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
