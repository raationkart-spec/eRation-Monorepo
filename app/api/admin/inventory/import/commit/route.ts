import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { NormalizedPOSRow, ProductSnapshot } from "@/lib/inventory/types";
import { generatePreviewToken } from "@/lib/inventory/parser";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const role = (session?.user as any)?.role || request.headers.get("x-user-role");
    const isAuth = Boolean(session?.user || request.headers.get("x-user-id") || request.headers.get("x-user-role"));

    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const adminEmail =
      session?.user?.email ||
      request.headers.get("x-user-email") ||
      "admin@quickcart.com";

    const body = await request.json();
    const {
      fileHash,
      previewToken,
      forceRecommit = false,
      fileName = "inventory.xlsx",
      sheetName = "Export Items",
      rows,
      autoHideIncomplete = true,
      defaultCategorySlug = "general",
      skipErrors = true,
      fileSize = 0,
    } = body;

    if (!fileHash || typeof fileHash !== "string") {
      return NextResponse.json({ error: "fileHash is required for idempotent import" }, { status: 400 });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No inventory rows provided for import" }, { status: 400 });
    }

    // Validate preview token if supplied
    if (previewToken) {
      const expectedToken = generatePreviewToken(fileHash, rows.length);
      if (previewToken !== expectedToken) {
        return NextResponse.json(
          { error: "Invalid preview token. Please preview the file again." },
          { status: 400 }
        );
      }
    }

    // Check for duplicate commit (Binding Addition 6: Replay and concurrency safety)
    const existingImport = await db.inventoryImport.findFirst({
      where: {
        fileHash,
        status: "COMMITTED",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingImport && !forceRecommit) {
      return NextResponse.json(
        {
          error: `Conflict: This workbook has already been committed on ${existingImport.createdAt.toISOString()}`,
          isAlreadyImported: true,
          importId: existingImport.id,
        },
        { status: 409 }
      );
    }

    // Resolve or create fallback category
    let targetCategory = await db.category.findUnique({
      where: { slug: defaultCategorySlug },
    });

    if (!targetCategory) {
      const firstCategory = await db.category.findFirst({
        orderBy: { sortOrder: "asc" },
      });
      if (firstCategory) {
        targetCategory = firstCategory;
      } else {
        targetCategory = await db.category.create({
          data: {
            id: "cat_general",
            name: "General Grocery",
            slug: "general",
            emoji: "🛒",
            isActive: true,
          },
        });
      }
    }

    const categorySlug = targetCategory.slug;

    // Execute batch import inside an atomic interactive transaction
    const commitResult = await db.$transaction(
      async (tx) => {
        // Concurrency double-check inside transaction lock
        const recheck = await tx.inventoryImport.findFirst({
          where: { fileHash, status: "COMMITTED" },
        });
        if (recheck && !forceRecommit) {
          throw new Error(`CONCURRENCY_CONFLICT: Workbook already committed by concurrent request.`);
        }

        let created = 0;
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        let shortages = 0;
        let missingCodes = 0;

        const snapshots: ProductSnapshot[] = [];

        for (const row of rows as NormalizedPOSRow[]) {
          if (row.action === "ERROR" || row.action === "CONFLICT") {
            errors++;
            if (!skipErrors) {
              throw new Error(`Import stopped on row ${row.rowNumber}: ${row.errors.join(", ")}`);
            }
            continue;
          }

          if (row.stockQty < 0) {
            shortages++;
          }
          if (!row.itemCode) {
            missingCodes++;
          }

          if (row.action === "SKIP") {
            skipped++;
            continue;
          }

          if (row.action === "UPDATE" && row.existingProductId) {
            const existing = await tx.product.findUnique({
              where: { id: row.existingProductId },
            });

            if (existing) {
              // Compact snapshot for rollback
              snapshots.push({
                productId: existing.id,
                slug: existing.slug,
                name: existing.name,
                previousName: existing.name,
                previousMrp: existing.mrp,
                previousPrice: existing.price,
                previousStockQty: existing.stockQty,
                previousItemCode: existing.itemCode,
                previousBarcode: existing.barcode,
                previousIsActive: existing.isActive,
                newName: row.name,
                newMrp: row.mrpPaise,
                newPrice: row.pricePaise,
                newStockQty: row.stockQty,
                newItemCode: row.itemCode || existing.itemCode,
                action: "UPDATED",
                mrp: existing.mrp,
                price: existing.price,
                stockQty: existing.stockQty,
                itemCode: existing.itemCode,
                barcode: existing.barcode,
                isActive: existing.isActive,
              });

              // Preserve non-imported fields: update ONLY name, mrp, price, stockQty, itemCode, barcode
              await tx.product.update({
                where: { id: existing.id },
                data: {
                  name: row.name,
                  mrp: row.mrpPaise,
                  price: row.pricePaise,
                  stockQty: row.stockQty, // Preserves signed integer (-1, -3, etc.)
                  unit: existing.unit || row.unit || "1 unit",
                  ...(row.itemCode && {
                    itemCode: row.itemCode,
                    barcode: row.itemCode,
                    barcodeSymbology: row.barcodeSymbology || "CODE128",
                  }),
                },
              });
              updated++;
            } else {
              skipped++;
            }
          } else if (row.action === "CREATE") {
            const baseSlug =
              row.slug ||
              row.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)+/g, "");

            // Verify slug uniqueness
            const slugCollision = await tx.product.findUnique({
              where: { slug: baseSlug },
            });
            const finalSlug = slugCollision ? `${baseSlug}-${Date.now()}` : baseSlug;

            const finalActive = autoHideIncomplete ? false : true;

            const createdProduct = await tx.product.create({
              data: {
                name: row.name,
                slug: finalSlug,
                categorySlug,
                unit: row.unit || "1 unit",
                mrp: row.mrpPaise,
                price: row.pricePaise,
                stockQty: row.stockQty, // Preserves signed integer (-1, -3, etc.)
                lowStockThreshold: 5,
                emoji: "📦",
                itemCode: row.itemCode || null,
                barcode: row.itemCode || null,
                barcodeSymbology: row.barcodeSymbology || null,
                tags: [],
                isActive: finalActive,
                isFeatured: false,
                sortOrder: 0,
              },
            });

            snapshots.push({
              productId: createdProduct.id,
              slug: createdProduct.slug,
              name: createdProduct.name,
              previousName: "",
              previousMrp: 0,
              previousPrice: 0,
              previousStockQty: 0,
              previousItemCode: null,
              previousBarcode: null,
              previousIsActive: false,
              newName: createdProduct.name,
              newMrp: row.mrpPaise,
              newPrice: row.pricePaise,
              newStockQty: row.stockQty,
              newItemCode: row.itemCode || null,
              action: "CREATED",
              mrp: 0,
              price: 0,
              stockQty: 0,
              itemCode: null,
              barcode: null,
              isActive: false,
            });

            created++;
          } else {
            skipped++;
          }
        }

        // Write compact audit log entry (capped to bounded size)
        const compactSnapshots = snapshots.slice(0, 1000);

        const auditLog = await tx.inventoryImport.create({
          data: {
            fileHash,
            fileName,
            fileSize: Number(fileSize) || 0,
            sheetName,
            importedBy: adminEmail,
            totalRows: rows.length,
            createdCount: created,
            updatedCount: updated,
            skippedCount: skipped,
            errorCount: errors,
            shortageCount: shortages,
            missingCodeCount: missingCodes,
            status: "COMMITTED",
            summary: {
              snapshots: compactSnapshots as any,
              autoHideIncomplete,
              defaultCategorySlug,
              timestamp: new Date().toISOString(),
            } as any,
          },
        });

        return {
          importId: auditLog.id,
          createdCount: created,
          updatedCount: updated,
          skippedCount: skipped,
          errorCount: errors,
          shortageCount: shortages,
          auditLogId: auditLog.id,
        };
      },
      { timeout: 45000, maxWait: 15000 }
    );

    return NextResponse.json({ success: true, ...commitResult }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/inventory/import/commit error:", error);
    if (error.message?.includes("CONCURRENCY_CONFLICT")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to commit inventory import" },
      { status: 500 }
    );
  }
}
