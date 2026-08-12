import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const bundles = await db.bundle.findMany({
      where: { isActive: true },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bundles });
  } catch (error) {
    console.error("GET /api/bundles error:", error);
    return NextResponse.json({ error: "Failed to fetch bundles" }, { status: 500 });
  }
}
