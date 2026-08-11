import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { makeOrderNumber } from "@/lib/store";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDbAdmin = (session.user as any).role === "ADMIN";

    const orders = await db.order.findMany({
      where: isDbAdmin ? {} : { userId: session.user.id },
      include: {
        items: true,
        statusHistory: { orderBy: { at: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      items,
      address,
      paymentMethod = "COD",
      customerName,
      customerPhone,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    if (!address || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Address and customer details are required" },
        { status: 400 }
      );
    }

    // Fetch store config for delivery fee calculation
    const config = await db.storeConfig.findUnique({
      where: { id: "default" },
    });
    const deliveryFeeRate = config?.deliveryFee ?? 2900;
    const freeThreshold = config?.freeDeliveryThreshold ?? 29900;

    // Use interactive transaction for atomic stock check + order creation
    const order = await db.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.isActive) {
          throw new Error(`Product "${item.productId}" is not available.`);
        }

        if (product.stockQty < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stockQty} available.`
          );
        }

        const itemSubtotal = product.price * item.quantity;
        subtotal += itemSubtotal;

        orderItemsData.push({
          productId: product.id,
          name: product.name,
          unit: product.unit,
          emoji: product.emoji,
          price: product.price,
          mrp: product.mrp,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });

        // Reduce stock atomically
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQty: { decrement: item.quantity },
          },
        });
      }

      const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryFeeRate;
      const total = subtotal + deliveryFee;

      const orderCount = await tx.order.count();
      const orderNumber = makeOrderNumber(orderCount + 1);

      const addressLine = `${address.line1}${
        address.line2 ? ", " + address.line2 : ""
      }, ${address.city}, ${address.state} - ${address.pincode}`;

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session?.user?.id ?? null,
          customerName,
          customerPhone,
          addressLine,
          status: "PLACED",
          paymentMethod,
          paymentStatus: paymentMethod === "COD" ? "PENDING" : "COLLECTED",
          subtotal,
          deliveryFee,
          discount: 0,
          total,
          notes,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: [
              {
                status: "PLACED",
                note: "Order placed successfully",
              },
            ],
          },
        },
        include: {
          items: true,
          statusHistory: { orderBy: { at: "asc" } },
        },
      });

      return newOrder;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
