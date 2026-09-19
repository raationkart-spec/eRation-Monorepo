import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const emailParam = searchParams.get("email")?.toLowerCase().trim();
  const phoneParam = searchParams.get("phone")?.trim();

  const session = await auth();

  const orConditions: any[] = [];
  if (session?.user?.id) orConditions.push({ id: session.user.id });
  if (session?.user?.email) orConditions.push({ email: session.user.email.toLowerCase().trim() });
  if (emailParam) orConditions.push({ email: emailParam });
  if (phoneParam) {
    const digits = phoneParam.replace(/\D/g, "");
    orConditions.push({
      phone: { in: [`+91${digits.slice(-10)}`, digits.slice(-10), `+${digits}`] },
    });
  }

  // Resolve user by session ID first, then session email, query email, or query phone
  const user =
    orConditions.length > 0
      ? await db.user.findFirst({
          where: { OR: orConditions },
          select: { tokenBalance: true },
        })
      : null;

  return NextResponse.json({ tokenBalance: user?.tokenBalance ?? 0 });
}
