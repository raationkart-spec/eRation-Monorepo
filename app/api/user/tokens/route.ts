import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailParam = searchParams.get("email")?.toLowerCase().trim();

  const session = await auth();

  // Resolve user by session ID first, then by session email, then by query param email
  const user = await db.user.findFirst({
    where: {
      OR: [
        ...(session?.user?.id ? [{ id: session.user.id }] : []),
        ...(session?.user?.email ? [{ email: session.user.email.toLowerCase().trim() }] : []),
        ...(emailParam ? [{ email: emailParam }] : []),
      ],
    },
    select: { tokenBalance: true },
  });

  return NextResponse.json({ tokenBalance: user?.tokenBalance ?? 0 });
}
