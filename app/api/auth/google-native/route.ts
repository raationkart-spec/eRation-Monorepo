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

    // Verify token audience to prevent cross-app token reuse
    const expectedClientId =
      process.env.GOOGLE_CLIENT_ID ||
      process.env.AUTH_GOOGLE_ID ||
      "148639493611-8ufhbmietb8higbfk0cgge6jijmn7j4o.apps.googleusercontent.com";

    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(expectedClientId)) {
      console.warn("Google token audience mismatch:", payload.aud, "expected:", expectedClientId);
      return NextResponse.json(
        { error: "Google token was not issued for this application" },
        { status: 401 }
      );
    }

    // Ensure Google has verified the email address
    const isVerified =
      payload.email_verified === true || payload.email_verified === "true";
    if (!isVerified) {
      return NextResponse.json(
        { error: "Google account email is not verified by Google." },
        { status: 403 }
      );
    }

    const cleanEmail = payload.email.toLowerCase().trim();
    const name = payload.name || payload.given_name || cleanEmail.split("@")[0];
    const image = payload.picture || null;
    const providerAccountId = payload.sub;

    // Check if user already exists (e.g. from previous Email OTP or Truecaller with email)
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { accounts: true },
    });

    let user;

    if (existingUser) {
      // Seamlessly link to existing account, preserving phone/orders/addresses/tokenBalance
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: existingUser.name || name,
          image: existingUser.image || image,
          emailVerified: existingUser.emailVerified || new Date(),
        },
      });
    } else {
      // New user registration via verified Google OAuth
      user = await db.user.create({
        data: {
          email: cleanEmail,
          name,
          image,
          emailVerified: new Date(),
          role: "CUSTOMER",
          tokenBalance: 0,
        },
      });
    }

    // Upsert Account record for provider linking
    if (providerAccountId) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId,
        },
      }).catch(() => {
        // Ignore if already linked or schema constraint
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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
