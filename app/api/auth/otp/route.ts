import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mailer";
import { rateLimit } from "@/lib/rateLimit";

/**
 * Alias route: POST /api/auth/otp
 * Delegated from legacy mobile APK builds that call /api/auth/otp.
 * Forwards to the canonical /api/auth/send-otp logic.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!rateLimit(`send-otp:${cleanEmail}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.emailOtp.deleteMany({ where: { email: cleanEmail } });
    await db.emailOtp.create({ data: { email: cleanEmail, otp, expiresAt } });

    await sendOtpEmail(cleanEmail, otp);

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${cleanEmail}`,
    });
  } catch (error) {
    console.error("POST /api/auth/otp (alias) error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP email" },
      { status: 500 }
    );
  }
}
