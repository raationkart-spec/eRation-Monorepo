import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      deliveryFee,
      freeDeliveryThreshold,
      minOrderValue,
      storeName,
      isStoreOpen,
      pincodesToAdd,
      pincodeToRemove,
    } = body;

    const config = await db.storeConfig.upsert({
      where: { id: "default" },
      update: {
        ...(deliveryFee !== undefined && { deliveryFee: Number(deliveryFee) }),
        ...(freeDeliveryThreshold !== undefined && { freeDeliveryThreshold: Number(freeDeliveryThreshold) }),
        ...(minOrderValue !== undefined && { minOrderValue: Number(minOrderValue) }),
        ...(storeName && { storeName }),
        ...(isStoreOpen !== undefined && { isStoreOpen: Boolean(isStoreOpen) }),
      },
      create: {
        id: "default",
        deliveryFee: Number(deliveryFee || 2900),
        freeDeliveryThreshold: Number(freeDeliveryThreshold || 29900),
        minOrderValue: Number(minOrderValue || 9900),
        storeName: storeName || "QuickCart",
        isStoreOpen: isStoreOpen !== undefined ? Boolean(isStoreOpen) : true,
      },
    });

    if (pincodesToAdd && Array.isArray(pincodesToAdd)) {
      for (const p of pincodesToAdd) {
        await db.serviceablePincode.upsert({
          where: { pincode: String(p) },
          update: {},
          create: { pincode: String(p) },
        });
      }
    }

    if (pincodeToRemove) {
      await db.serviceablePincode.deleteMany({
        where: { pincode: String(pincodeToRemove) },
      });
    }

    const allPincodes = await db.serviceablePincode.findMany();

    return NextResponse.json({
      config,
      pincodes: allPincodes.map((p) => p.pincode),
    });
  } catch (error) {
    console.error("PUT /api/admin/config error:", error);
    return NextResponse.json(
      { error: "Failed to update store configuration" },
      { status: 500 }
    );
  }
}
