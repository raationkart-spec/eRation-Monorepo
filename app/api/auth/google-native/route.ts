import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: "Google idToken is required" },
        { status: 400 }
      );
    }

    // Verify token with Google TokenInfo API
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!googleRes.ok) {
      const err = await googleRes.json().catch(() => ({}));
      console.error("Google token verification failed:", err);
      return NextResponse.json(
        { error: err.error_description || "Invalid Google token" },
        { status: 401 }
      );
    }

    const payload = await googleRes.json();

    if (!payload.email) {
      return NextResponse.json(
        { error: "Google account does not contain a verified email" },
        { status: 400 }
      );
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || cleanEmail.split("@")[0];
    const image = payload.picture || null;

    // Upsert user in database
    const user = await db.user.upsert({
      where: { email: cleanEmail },
      update: {
        name,
        ...(image ? { image } : {}),
      },
      create: {
        email: cleanEmail,
        name,
        image,
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
  } catch (error: any) {
    console.error("POST /api/auth/google-native error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Google" },
      { status: 500 }
    );
  }
}
