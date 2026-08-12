import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { makeOrderNumber } from "@/lib/orderNumber";

export async function GET() {
  try {
    const session = await auth();
    const isDbAdmin = (session?.user as any)?.role === "ADMIN";

    const orders = await db.order.findMany({
      where: isDbAdmin ? {} : session?.user?.id ? { userId: session.user.id } : {},
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

    // Strict Backend Pincode Validation
    const dbPincodes = await db.serviceablePincode.findMany({
      select: { pincode: true },
    });
    const allowedPincodes = new Set(
      dbPincodes.length > 0
        ? dbPincodes.map((p) => p.pincode.trim())
        : ["734001", "734003", "734004", "734005", "734006", "734008"]
    );

    const userPincode = address.pincode ? String(address.pincode).trim() : "";
    if (!userPincode || !allowedPincodes.has(userPincode)) {
      return NextResponse.json(
        {
          error: `Delivery is not available to pincode "${userPincode}". We deliver only to serviceable Siliguri pincodes (${Array.from(allowedPincodes).join(", ")}).`,
        },
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
        // 1. Try finding product by ID
        let product = item.productId
          ? await tx.product.findUnique({ where: { id: item.productId } })
          : null;

        // 2. If not found by ID, search by slug or name
        if (!product && item.name) {
          const possibleSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          product = await tx.product.findFirst({
            where: {
              OR: [
                { slug: possibleSlug },
                { name: { equals: item.name, mode: "insensitive" } },
              ],
            },
          });
        }

        // 3. If product STILL doesn't exist in DB, create it in Product table so FK constraint is satisfied!
        if (!product) {
          const catSlug = item.categorySlug || "fruits-veg";
          let category = await tx.category.findUnique({ where: { slug: catSlug } });
          if (!category) {
            category = await tx.category.create({
              data: {
                id: "cat_" + Date.now(),
                name: "Grocery",
                slug: catSlug,
                emoji: "🛒",
              },
            });
          }

          const prodId = item.productId || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const prodSlug = (item.name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now();

          product = await tx.product.create({
            data: {
              id: prodId,
              name: item.name || "Grocery Item",
              slug: prodSlug,
              categorySlug: category.slug,
              unit: item.unit || "1 unit",
              mrp: item.mrp || item.price || 1000,
              price: item.price || 1000,
              stockQty: 999,
              emoji: item.emoji || "🛒",
              imageUrl: item.imageUrl || null,
              tags: [],
              isActive: true,
            },
          });
        }

        const itemPrice = item.price || product.price;
        const itemMrp = item.mrp || product.mrp;
        const itemSubtotal = itemPrice * item.quantity;
        subtotal += itemSubtotal;

        orderItemsData.push({
          productId: product.id, // Guaranteed to exist in Product table!
          name: item.name || product.name,
          unit: item.unit || product.unit,
          emoji: item.emoji || product.emoji,
          price: itemPrice,
          mrp: itemMrp,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });

        // Reduce stock if stock is tracked
        if (product.stockQty >= item.quantity) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQty: { decrement: item.quantity },
            },
          });
        }
      }

      const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryFeeRate;
      const total = subtotal + deliveryFee;

      const orderCount = await tx.order.count();
      const orderNumber = makeOrderNumber(orderCount + 1);

      const addressLine = `${address.line1}${
        address.line2 ? ", " + address.line2 : ""
      }, ${address.city}, ${address.state} - ${userPincode}`;

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
    }, { timeout: 20000, maxWait: 10000 });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
