import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();
    const deals = await db.flashDeal.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
        product: { isActive: true },
      },
      include: { product: true },
      orderBy: { endsAt: "asc" },
    });

    return NextResponse.json({ deals });
  } catch (error) {
    console.error("GET /api/flash-deals error:", error);
    return NextResponse.json({ error: "Failed to fetch flash deals" }, { status: 500 });
  }
}
