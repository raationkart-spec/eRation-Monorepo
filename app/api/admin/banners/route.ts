import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const banners = await db.banner.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ banners });
  } catch (error: any) {
    console.error("GET /api/admin/banners error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      subtitle,
      emoji = "🍓",
      imageUrl,
      bg = "from-brand to-brand-dark",
      linkUrl,
      isActive = true,
      sortOrder = 0,
    } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || "",
        emoji,
        imageUrl: imageUrl || null,
        bg,
        linkUrl: linkUrl?.trim() || null,
        isActive: Boolean(isActive),
        sortOrder: Number(sortOrder),
      },
    });

    return NextResponse.json({ banner }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/banners error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create banner" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Banner ID is required" }, { status: 400 });
    }

    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.subtitle !== undefined && { subtitle: data.subtitle.trim() }),
        ...(data.emoji !== undefined && { emoji: data.emoji }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.bg !== undefined && { bg: data.bg }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl ? data.linkUrl.trim() : null }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) }),
      },
    });

    return NextResponse.json({ banner });
  } catch (error: any) {
    console.error("PUT /api/admin/banners error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update banner" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Banner ID is required" }, { status: 400 });
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/banners error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete banner" },
      { status: 500 }
    );
  }
}
