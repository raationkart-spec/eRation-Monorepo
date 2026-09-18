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

    // Normalize phone number to standard E.164 (+91...)
    const digitsOnly = rawPhone.replace(/\D/g, "");
    let cleanPhone: string | null = null;
    if (digitsOnly.length === 10) {
      cleanPhone = `+91${digitsOnly}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
      cleanPhone = `+91${digitsOnly.slice(1)}`;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      cleanPhone = `+${digitsOnly}`;
    } else if (digitsOnly.length > 0) {
      cleanPhone = `+${digitsOnly}`;
    }

    if (!cleanPhone) {
      return NextResponse.json(
        { error: "Truecaller profile does not contain a valid phone number" },
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

    // 3. Smart User Linking & Collision Resolution
    let user = null;

    const userByPhone = await db.user.findUnique({
      where: { phone: cleanPhone },
    });

    const userByEmail = cleanEmail
      ? await db.user.findUnique({
          where: { email: cleanEmail },
        })
      : null;

    if (userByPhone && userByEmail && userByPhone.id !== userByEmail.id) {
      // Account collision: user previously logged in via Google/Email on email,
      // and via Truecaller on phone. Merge phone account into primary email account.
      console.log(
        `Merging Truecaller user ${userByPhone.id} into primary email user ${userByEmail.id}`
      );

      // Reassign orders and addresses to primary user
      await db.order.updateMany({
        where: { userId: userByPhone.id },
        data: { userId: userByEmail.id },
      });
      await db.address.updateMany({
        where: { userId: userByPhone.id },
        data: { userId: userByEmail.id },
      });

      // Sum token balances
      const combinedTokens =
        (userByEmail.tokenBalance || 0) + (userByPhone.tokenBalance || 0);

      // Delete phone user to free unique constraint
      await db.account.deleteMany({ where: { userId: userByPhone.id } });
      await db.user.delete({ where: { id: userByPhone.id } });

      // Update primary user with phone and merged token balance
      user = await db.user.update({
        where: { id: userByEmail.id },
        data: {
          phone: cleanPhone,
          tokenBalance: combinedTokens,
          name: userByEmail.name || fullName,
          emailVerified: userByEmail.emailVerified || new Date(),
        },
      });
    } else if (userByPhone) {
      // User found by phone: link email if provided and not yet set
      user = await db.user.update({
        where: { id: userByPhone.id },
        data: {
          ...(cleanEmail && !userByPhone.email
            ? { email: cleanEmail, emailVerified: new Date() }
            : {}),
          name: userByPhone.name || fullName,
        },
      });
    } else if (userByEmail) {
      // User found by email: link verified phone
      user = await db.user.update({
        where: { id: userByEmail.id },
        data: {
          phone: cleanPhone,
          name: userByEmail.name || fullName,
          emailVerified: userByEmail.emailVerified || new Date(),
        },
      });
    } else {
      // Completely new user registration
      user = await db.user.create({
        data: {
          phone: cleanPhone,
          email: cleanEmail,
          name: fullName,
          emailVerified: cleanEmail ? new Date() : null,
          role: "CUSTOMER",
          tokenBalance: 0,
        },
      });
    }

    // Link Account record for Truecaller
    await db.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "truecaller",
          providerAccountId: cleanPhone,
        },
      },
      update: { userId: user.id },
      create: {
        userId: user.id,
        type: "oauth",
        provider: "truecaller",
        providerAccountId: cleanPhone,
      },
    }).catch(() => {});

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
