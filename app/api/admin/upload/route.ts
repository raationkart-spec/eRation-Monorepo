import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Clean filename and create unique timestamp suffix
    const rawExt = path.extname(file.name).toLowerCase();
    const ext = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : ".jpg";
    const sanitizedBase = path
      .basename(file.name, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    const filename = `${sanitizedBase}-${Date.now()}${ext}`;

    // Cloudflare R2 credentials check
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (r2AccountId && r2Bucket && r2PublicUrl) {
      try {
        const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${filename}`;
        const cfRes = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "image/jpeg",
          },
          body: buffer,
        });

        if (cfRes.ok) {
          const publicUrl = `${r2PublicUrl.replace(/\/$/, "")}/${filename}`;
          return NextResponse.json({
            success: true,
            url: publicUrl,
            filename,
            storage: "cloudflare_r2",
          });
        }
      } catch (r2Err) {
        console.warn("Cloudflare R2 upload fallback to local storage:", r2Err);
      }
    }

    // Local Storage Fallback (/public/uploads/)
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/${filename}`;
    return NextResponse.json({
      success: true,
      url: localUrl,
      filename,
      storage: "local",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
