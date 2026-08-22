import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, image } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanName = name || cleanEmail.split("@")[0];

    const user = await db.user.upsert({
      where: { email: cleanEmail },
      update: {
        name: cleanName,
        ...(image ? { image } : {}),
      },
      create: {
        email: cleanEmail,
        name: cleanName,
        image: image || null,
        role: "CUSTOMER",
        tokenBalance: 0,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        tokenBalance: user.tokenBalance,
      },
    });
  } catch (e: any) {
    console.error("Supabase sync error:", e);
    return NextResponse.json({ error: e.message || "Failed to sync user" }, { status: 500 });
  }
}
