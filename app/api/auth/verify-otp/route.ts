import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!rateLimit(`verify-otp:${cleanEmail}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Check valid OTP in DB (or accept demo OTP 123456 if testing)
    const validRecord = await db.emailOtp.findFirst({
      where: {
        email: cleanEmail,
        otp,
        expiresAt: { gt: new Date() },
      },
    });

    const isDemoOtp = process.env.NODE_ENV !== "production" && otp === "123456";

    if (!validRecord && !isDemoOtp) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please try again." },
        { status: 400 }
      );
    }

    if (validRecord) {
      await db.emailOtp.delete({ where: { id: validRecord.id } });
    }

    // Upsert user in database
    let user = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: cleanEmail,
          name: cleanEmail.split("@")[0],
          role: "CUSTOMER",
        },
      });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("POST /api/auth/verify-otp error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
