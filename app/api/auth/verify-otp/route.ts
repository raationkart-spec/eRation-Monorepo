import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    // Accept both `otp` (standard) and `code` (legacy mobile client key)
    const otp: string = body.otp || body.code;

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
    const isTestAccount = cleanEmail === "test@google.com" && otp === "123456";

    if (!validRecord && !isDemoOtp && !isTestAccount) {
      return NextResponse.json(
        { error: "Invalid or expired OTP. Please try again." },
        { status: 400 }
      );
    }

    // Preserve OTP for test account so it can be reused infinitely
    if (validRecord && !isTestAccount) {
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
          emailVerified: new Date(),
        },
      });
    } else if (!user.emailVerified) {
      user = await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
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
