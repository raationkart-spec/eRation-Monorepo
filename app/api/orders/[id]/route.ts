import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { at: "asc" } },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check authorization: user must own order or be admin
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email");
    const phoneParam = searchParams.get("phone");

    const isOwner =
      !order.userId ||
      (session?.user?.id && order.userId === session.user.id) ||
      (emailParam && order.user?.email?.toLowerCase() === emailParam.trim().toLowerCase()) ||
      (phoneParam && order.customerPhone?.includes(phoneParam.trim().slice(-10)));

    if ((session?.user as any)?.role !== "ADMIN" && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
