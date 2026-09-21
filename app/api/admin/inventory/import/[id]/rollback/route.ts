import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ProductSnapshot } from "@/lib/inventory/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role || request.headers.get("x-user-role");
    const isAuth = Boolean(session?.user || request.headers.get("x-user-id") || request.headers.get("x-user-role"));

    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const importRecord = await db.inventoryImport.findUnique({
      where: { id },
    });

    if (!importRecord) {
      return NextResponse.json({ error: "Import record not found" }, { status: 404 });
    }

    if (importRecord.status === "ROLLED_BACK") {
      return NextResponse.json(
        { error: "This import has already been rolled back" },
        { status: 400 }
      );
    }

    const summary = importRecord.summary as any;
    const snapshots = (summary?.snapshots || []) as ProductSnapshot[];

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return NextResponse.json(
        { error: "No rollback snapshot data available for this import" },
        { status: 400 }
      );
    }

    let revertedCount = 0;

    await db.$transaction(async (tx) => {
      for (const snap of snapshots) {
        const targetId = snap.productId || snap.id;
        if (!targetId) continue;

        if (snap.action === "UPDATED") {
          await tx.product.update({
            where: { id: targetId },
            data: {
              ...(snap.previousName && { name: snap.previousName }),
              mrp: snap.previousMrp ?? snap.mrp ?? 0,
              price: snap.previousPrice ?? snap.price ?? 0,
              stockQty: snap.previousStockQty ?? snap.stockQty ?? 0,
              itemCode: snap.previousItemCode ?? snap.itemCode ?? null,
              barcode: snap.previousBarcode ?? snap.barcode ?? null,
              isActive: snap.previousIsActive ?? snap.isActive ?? true,
            },
          });
          revertedCount++;
        } else if (snap.action === "CREATED") {
          // Soft deactivate newly created items to prevent broken foreign keys
          await tx.product.update({
            where: { id: targetId },
            data: { isActive: false },
          });
          revertedCount++;
        }
      }

      await tx.inventoryImport.update({
        where: { id },
        data: { status: "ROLLED_BACK" },
      });
    }, { timeout: 30000 });

    return NextResponse.json({
      success: true,
      message: `Successfully rolled back ${revertedCount} products to pre-import state`,
      revertedCount,
      importId: id,
    });
  } catch (error: any) {
    console.error("POST /api/admin/inventory/import/[id]/rollback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rollback inventory import" },
      { status: 500 }
    );
  }
}
