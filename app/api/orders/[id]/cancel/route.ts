import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PLACED") {
      return NextResponse.json(
        { error: `Order cannot be cancelled as it is already ${order.status}` },
        { status: 400 }
      );
    }

    // Atomic cancellation transaction: revert stock & set status
    const updatedOrder = await db.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }

      return await tx.order.update({
        where: { id },
        data: {
          status: "CANCELLED",
          statusHistory: {
            create: {
              status: "CANCELLED",
              note: "Cancelled by customer",
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
    console.error("POST /api/orders/[id]/cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}
