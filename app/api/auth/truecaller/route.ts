import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const TRUECALLER_CLIENT_ID =
  process.env.TRUECALLER_CLIENT_ID || "oewpqo0wlybxpjhi3tcjsb5a1nhjoaszzh988n6zamc";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorizationCode, codeVerifier } = body;

    if (!authorizationCode || !codeVerifier) {
      return NextResponse.json(
        { error: "authorizationCode and codeVerifier are required" },
        { status: 400 }
      );
    }

    // 1. Exchange authorization code with Truecaller OAuth Token API (PKCE)
    const tokenParams = new URLSearchParams();
    tokenParams.append("grant_type", "authorization_code");
    tokenParams.append("client_id", TRUECALLER_CLIENT_ID);
    tokenParams.append("code", authorizationCode);
    tokenParams.append("code_verifier", codeVerifier);

    const tokenRes = await fetch(
      "https://oauth-account-noneu.truecaller.com/v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: tokenParams.toString(),
      }
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      console.error("Truecaller token exchange failed:", err);
      return NextResponse.json(
        { error: err.error_description || "Failed to verify Truecaller code" },
        { status: 401 }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Truecaller did not return an access token" },
        { status: 401 }
      );
    }

    // 2. Fetch user profile from Truecaller userinfo API
    const userinfoRes = await fetch(
      "https://oauth-account-noneu.truecaller.com/v1/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!userinfoRes.ok) {
      const err = await userinfoRes.json().catch(() => ({}));
      console.error("Truecaller userinfo failed:", err);
      return NextResponse.json(
        { error: err.error_description || "Failed to fetch Truecaller profile" },
        { status: 401 }
      );
    }

    const profile = await userinfoRes.json();

    const rawPhone =
      profile.phone_number || profile.phoneNumber || profile.phone || "";
    const cleanPhone = rawPhone ? rawPhone.replace(/\s+/g, "").trim() : null;

    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Truecaller profile does not contain a verified phone number" },
        { status: 400 }
      );
    }

    const givenName = profile.given_name || profile.firstName || "";
    const familyName = profile.family_name || profile.lastName || "";
    const fullName =
      profile.name ||
      `${givenName} ${familyName}`.trim() ||
      `User ${cleanPhone.slice(-4)}`;

    const rawEmail = profile.email || null;
    const cleanEmail = rawEmail ? rawEmail.toLowerCase().trim() : null;

    // 3. Upsert user in Postgres database
    let user = null;

    // Search by phone first
    user = await db.user.findUnique({
      where: { phone: cleanPhone },
    });

    // If not found by phone and email exists, search by email
    if (!user && cleanEmail) {
      user = await db.user.findUnique({
        where: { email: cleanEmail },
      });
    }

    if (user) {
      // Update missing phone, email, or name
      user = await db.user.update({
        where: { id: user.id },
        data: {
          ...(cleanPhone && !user.phone ? { phone: cleanPhone } : {}),
          ...(cleanEmail && !user.email ? { email: cleanEmail } : {}),
          ...(!user.name && fullName ? { name: fullName } : {}),
        },
      });
    } else {
      // Create new user with verified phone
      user = await db.user.create({
        data: {
          phone: cleanPhone,
          email: cleanEmail,
          name: fullName,
          role: "CUSTOMER",
          tokenBalance: 0,
        },
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
    console.error("POST /api/auth/truecaller error:", error);
    return NextResponse.json(
      { error: "Failed to authenticate with Truecaller" },
      { status: 500 }
    );
  }
}
