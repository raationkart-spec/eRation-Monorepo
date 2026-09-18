import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, image, uid } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const userName = name || cleanEmail.split("@")[0];
    const userImage = image || null;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    let user;

    if (existingUser) {
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: existingUser.name || userName,
          image: existingUser.image || userImage,
          emailVerified: existingUser.emailVerified || new Date(),
        },
      });
    } else {
      user = await db.user.create({
        data: {
          email: cleanEmail,
          name: userName,
          image: userImage,
          emailVerified: new Date(),
          role: "CUSTOMER",
          tokenBalance: 0,
        },
      });
    }

    // Link account if uid is present
    if (uid) {
      await db.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "firebase",
            providerAccountId: uid,
          },
        },
        update: {},
        create: {
          userId: user.id,
          type: "oauth",
          provider: "firebase",
          providerAccountId: uid,
        },
      }).catch(() => {});
    }

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
    console.error("POST /api/auth/firebase-sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
