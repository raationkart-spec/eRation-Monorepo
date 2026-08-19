import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await db.category.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const { name, slug, emoji = "📦", imageUrl, sortOrder = 0, isActive = true } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const category = await db.category.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        emoji,
        imageUrl: imageUrl || null,
        sortOrder: Number(sortOrder),
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
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
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.emoji !== undefined && { emoji: data.emoji }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
        ...(data.sortOrder !== undefined && { sortOrder: Number(data.sortOrder) }),
        ...(data.isActive !== undefined && { isActive: Boolean(data.isActive) }),
      },
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("PUT /api/admin/categories error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
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
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category has products
    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category._count.products > 0) {
      // Soft delete: disable category
      const updated = await db.category.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ category: updated, softDeleted: true });
    }

    await db.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
