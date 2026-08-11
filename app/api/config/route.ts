import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    let config = await db.storeConfig.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await db.storeConfig.create({
        data: { id: "default" },
      });
    }

    const pincodeRecords = await db.serviceablePincode.findMany();
    const pincodes = pincodeRecords.map((p) => p.pincode);

    return NextResponse.json({ config, pincodes });
  } catch (error) {
    console.error("GET /api/config error:", error);
    return NextResponse.json(
      { error: "Failed to fetch store configuration" },
      { status: 500 }
    );
  }
}
