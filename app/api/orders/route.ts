import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { makeOrderNumber } from "@/lib/orderNumber";
import { computeCouponDiscount } from "@/lib/coupon";

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
      couponCode,
    } = body;
    const tokensToRedeem: number = Math.max(0, Number(body.tokensToRedeem) || 0);

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
    const platformFee = config?.platformFee ?? 200;

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

        // Never trust client-sent price. Use the catalog price, unless the
        // item references an active flash deal for this exact product.
        let itemPrice = product.price;
        if (item.dealId) {
          const deal = await tx.flashDeal.findUnique({ where: { id: item.dealId } });
          const now = new Date();
          if (
            deal &&
            deal.productId === product.id &&
            deal.isActive &&
            deal.startsAt <= now &&
            deal.endsAt > now
          ) {
            itemPrice = deal.salePrice;
          }
        }
        const itemMrp = product.mrp;
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

      let discount = 0;
      let appliedCouponCode: string | null = null;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: String(couponCode).trim().toUpperCase() },
        });
        if (!coupon) {
          throw new Error("Invalid coupon code");
        }
        const result = computeCouponDiscount(coupon, subtotal);
        if ("error" in result) {
          throw new Error(result.error);
        }
        discount = result.discount;
        appliedCouponCode = coupon.code;
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }


      // ── Token redemption ──────────────────────────────────────────────────
      let tokenDiscount = 0;
      let actualTokensRedeemed = 0;
      if (tokensToRedeem >= 100 && session?.user?.id) {
        const dbUser = await tx.user.findUnique({
          where: { id: session.user.id },
          select: { tokenBalance: true },
        });
        const userTokens = dbUser?.tokenBalance ?? 0;
        // Redeem only whole 100-token blocks, capped to what user actually has
        const redeemableBlocks = Math.floor(Math.min(tokensToRedeem, userTokens) / 100);
        actualTokensRedeemed = redeemableBlocks * 100;
        tokenDiscount = redeemableBlocks * 2500; // 100 tokens = ₹25 = 2500 paise
      }

      const total = subtotal + deliveryFee + platformFee - discount - tokenDiscount;

      // ── Tokens earned on this order (10 coins per ₹100 = floor(subtotal/10000)*100) ──
      const tokensEarned = Math.floor(subtotal / 10000) * 100;

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
          platformFee,
          discount,
          couponCode: appliedCouponCode,
          tokenDiscount,
          tokensEarned,
          tokensRedeemed: actualTokensRedeemed,
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

      // ── Deduct redeemed tokens atomically ───────────────────────────────
      if (actualTokensRedeemed > 0 && session?.user?.id) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { tokenBalance: { decrement: actualTokensRedeemed } },
        });
      }

      // ── Award earned tokens atomically ───────────────────────────────────
      if (tokensEarned > 0 && session?.user?.id) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { tokenBalance: { increment: tokensEarned } },
        });
      }

      return newOrder;
    }, { timeout: 20000, maxWait: 10000 });

    return NextResponse.json({ order, tokensEarned: order.tokensEarned }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 400 }
    );
  }
}
