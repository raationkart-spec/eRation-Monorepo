import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if ((session?.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = (await req.formData()) as any;
    const file = formData.get("file") as File | null;
    const folder = ((formData.get("folder") as string) || "products")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

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
    const sanitizedBase =
      path
        .basename(file.name, rawExt)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/(^-|-$)+/g, "") || "file";
    const key = `${folder}/${sanitizedBase}-${Date.now()}${ext}`;

    // Cloudflare R2 Credentials
    const accountId =
      process.env.CLOUDFLARE_R2_ACCOUNT_ID || "c7d624ee1a82d294c62275a2135719b4";
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "groceryitems";
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

    if (accountId && accessKeyId && secretAccessKey && bucketName && publicUrl) {
      try {
        const r2 = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });

        await r2.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: file.type || "image/jpeg",
            CacheControl: "public, max-age=31536000, immutable",
          })
        );

        const finalUrl = `${publicUrl.replace(/\/$/, "")}/${key}`;
        return NextResponse.json({
          success: true,
          url: finalUrl,
          filename: key,
          storage: "cloudflare_r2",
        });
      } catch (r2Err: any) {
        console.error("Cloudflare R2 S3 Upload error:", r2Err);
      }
    }

    // Local Storage Fallback (/public/uploads/) for local development
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });
    const localFilename = `${sanitizedBase}-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, localFilename);
    await writeFile(filePath, buffer);

    const localUrl = `/uploads/${folder}/${localFilename}`;
    return NextResponse.json({
      success: true,
      url: localUrl,
      filename: `${folder}/${localFilename}`,
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
