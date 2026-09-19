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
      include: { items: true, user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const emailParam = (body?.email || searchParams.get("email"))?.toLowerCase()?.trim();
    const phoneParam = (body?.phone || searchParams.get("phone"))?.trim();

    const isOwner =
      !order.userId ||
      (session?.user?.id && order.userId === session.user.id) ||
      (emailParam && order.user?.email?.toLowerCase() === emailParam) ||
      (phoneParam && order.customerPhone?.includes(phoneParam.slice(-10)));

    if ((session?.user as any)?.role !== "ADMIN" && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
