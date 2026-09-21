import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parsePOSWorkbook } from "@/lib/inventory/parser";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No spreadsheet file provided" }, { status: 400 });
    }

    const fileName = file.name || "inventory.xlsx";
    const ext = fileName.toLowerCase().split(".").pop();
    if (ext !== "xlsx" && ext !== "xls") {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload an Excel (.xlsx or .xls) spreadsheet." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit (uploaded: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Fetch existing catalog products for deterministic comparison
    const existingProducts = await db.product.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        itemCode: true,
        mrp: true,
        price: true,
        stockQty: true,
        isActive: true,
      },
    });

    // Fetch prior imports to check SHA-256 idempotency
    const priorImports = await db.inventoryImport.findMany({
      select: {
        fileHash: true,
        createdAt: true,
      },
    });

    const previewResult = parsePOSWorkbook(buffer, fileName, existingProducts, priorImports);

    return NextResponse.json(previewResult);
  } catch (error: any) {
    console.error("POST /api/admin/inventory/import/preview error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process spreadsheet preview" },
      { status: 500 }
    );
  }
}
