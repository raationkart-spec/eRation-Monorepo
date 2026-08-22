import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ tokenBalance: 0 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { tokenBalance: true },
  });

  return NextResponse.json({ tokenBalance: user?.tokenBalance ?? 0 });
}
