import * as XLSX from "xlsx";
import crypto from "crypto";
import type {
  ImportAction,
  ImportPreviewResponse,
  ImportSummary,
  NormalizedPOSRow,
} from "./types";
import {
  extractUnitFromName,
  hasLeadingZero,
  parseSignedStock,
  rupeeToPaise,
  slugify,
} from "./validator";
import { resolveSymbology } from "./barcode";

export interface ExistingProductBrief {
  id: string;
  slug: string;
  name: string;
  itemCode: string | null;
  barcode?: string | null;
  mrp: number;
  price: number;
  stockQty: number;
  isActive: boolean;
}

const POS_ALIASES: Record<string, string[]> = {
  name: [
    "item name*",
    "item name",
    "item_name",
    "product name",
    "product_name",
    "product",
    "name",
    "title",
  ],
  itemCode: [
    "item code",
    "item_code",
    "itemcode",
    "barcode",
    "pos sku",
    "sku",
    "code",
  ],
  mrp: [
    "default m",
    "default mrp",
    "default_mrp",
    "mrp",
    "mrp (₹)",
    "mrp(₹)",
    "maximum retail price",
    "original price",
  ],
  price: [
    "sale price",
    "selling price",
    "selling p",
    "sale_price",
    "selling_price",
    "rate",
    "price",
    "price (₹)",
    "price(₹)",
  ],
  stockQty: [
    "current stock quantity",
    "current stock",
    "stock quantity",
    "stock_qty",
    "stock",
    "quantity",
    "qty",
  ],
};

function resolveHeaderKey(headers: string[], field: string): string | null {
  const aliases = POS_ALIASES[field] || [field];
  for (const h of headers) {
    const norm = h.trim().toLowerCase();
    if (aliases.includes(norm)) {
      return h;
    }
  }
  return null;
}

export function computeFileHash(buffer: Buffer | ArrayBuffer): string {
  const nodeBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  return crypto.createHash("sha256").update(nodeBuf).digest("hex");
}

export function generatePreviewToken(fileHash: string, totalRows: number): string {
  return crypto
    .createHash("sha256")
    .update(`${fileHash}:${totalRows}:QuickCartSecureToken`)
    .digest("hex");
}

/**
 * Parses an Excel workbook exported from physical POS countertop terminals.
 * Polymorphic parameters support both web route handlers and unit/integration test calls.
 */
export function parsePOSWorkbook(
  buffer: Buffer | ArrayBuffer,
  param2?: string | ExistingProductBrief[],
  param3?: ExistingProductBrief[] | string,
  param4?: { fileHash: string; createdAt: Date }[]
): ImportPreviewResponse {
  let fileName = "inventory.xlsx";
  let existingProducts: ExistingProductBrief[] = [];
  let priorImports: { fileHash: string; createdAt: Date }[] = [];

  if (typeof param2 === "string") {
    fileName = param2;
    if (Array.isArray(param3)) existingProducts = param3;
    if (Array.isArray(param4)) priorImports = param4;
  } else if (Array.isArray(param2)) {
    existingProducts = param2;
    if (typeof param3 === "string") fileName = param3;
    if (Array.isArray(param4)) priorImports = param4;
  }

  const fileHash = computeFileHash(buffer);
  const fileSize = buffer.byteLength;

  // Safe SheetJS read options
  const wb = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
    cellFormula: false,
    raw: false,
  });

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error("Workbook contains no worksheets.");
  }

  // Target sheet selection
  const exportItemsSheetName = wb.SheetNames.find(
    (s) => s.trim().toLowerCase() === "export items"
  );
  const targetSheetName = exportItemsSheetName || wb.SheetNames[0];

  const ws = wb.Sheets[targetSheetName];
  if (!ws) {
    throw new Error(`Worksheet "${targetSheetName}" could not be loaded.`);
  }

  // Convert to JSON with raw strings preserved
  const sheetRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
    header: 1,
    defval: "",
    raw: false,
  }) as any[][];

  if (sheetRows.length < 2) {
    throw new Error("Spreadsheet is empty or missing data rows.");
  }

  const rawHeaders = (sheetRows[0] || []).map((h) => String(h || "").trim());
  const headerKeys = {
    name: resolveHeaderKey(rawHeaders, "name"),
    itemCode: resolveHeaderKey(rawHeaders, "itemCode"),
    mrp: resolveHeaderKey(rawHeaders, "mrp"),
    price: resolveHeaderKey(rawHeaders, "price"),
    stockQty: resolveHeaderKey(rawHeaders, "stockQty"),
  };

  const detectedFormat =
    targetSheetName.toLowerCase() === "export items" ||
    (headerKeys.name?.toLowerCase().includes("item name") ?? false)
      ? "POS_EXPORT_ITEMS"
      : "LEGACY_CATALOG";

  // Index existing products for fast deterministic matching
  const byItemCode = new Map<string, ExistingProductBrief>();
  const bySlug = new Map<string, ExistingProductBrief>();

  for (const p of existingProducts) {
    if (p.itemCode) {
      byItemCode.set(p.itemCode.trim(), p);
    }
    bySlug.set(p.slug, p);
  }

  const normalizedRows: NormalizedPOSRow[] = [];
  const seenItemCodesInSheet = new Map<string, number>(); // code -> first rowNumber
  const seenSlugsInSheet = new Map<string, number>(); // slug -> first rowNumber

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let shortageCount = 0;
  let missingCodeCount = 0;
  let duplicateCodeCount = 0;
  let zeroPriceCount = 0;
  let conflictCount = 0;

  for (let rIndex = 1; rIndex < sheetRows.length; rIndex++) {
    const rowValues = sheetRows[rIndex];
    if (!rowValues || rowValues.every((c) => String(c || "").trim() === "")) {
      continue; // Skip entirely blank rows
    }

    const rowNumber = rIndex + 1;
    const rawMap: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      rawMap[h] = rowValues[idx] !== undefined ? String(rowValues[idx]).trim() : "";
    });

    const rawName = headerKeys.name ? rawMap[headerKeys.name] || "" : "";
    const rawItemCode = headerKeys.itemCode ? rawMap[headerKeys.itemCode] || "" : "";
    const rawMrp = headerKeys.mrp ? rawMap[headerKeys.mrp] || "" : "";
    const rawPrice = headerKeys.price ? rawMap[headerKeys.price] || "" : "";
    const rawStock = headerKeys.stockQty ? rawMap[headerKeys.stockQty] || "" : "";

    const name = rawName.trim();
    const slug = slugify(name);
    const itemCode = rawItemCode.trim().length > 0 ? rawItemCode.trim() : null;
    const isLeadingZero = hasLeadingZero(itemCode);

    const pricePaise = rupeeToPaise(rawPrice);
    const parsedMrpPaise = rupeeToPaise(rawMrp);

    const issues: string[] = [];
    const errors: string[] = [];

    // Blank / Zero MRP policy: Visible warning MRP_FALLBACK_TO_SALE
    let mrpPaise = parsedMrpPaise;
    if (mrpPaise === 0) {
      mrpPaise = pricePaise;
      issues.push(
        `MRP_FALLBACK_TO_SALE: Default MRP is blank or 0; defaulting MRP to sale price (₹${(pricePaise / 100).toFixed(2)}).`
      );
    }

    const salePriceRupees = pricePaise / 100;
    const defaultMrpRupees = mrpPaise / 100;
    const stockQty = parseSignedStock(rawStock);
    const unit = extractUnitFromName(name);
    const barcodeSymbology = resolveSymbology(itemCode);

    // Validation 1: Name
    if (!name || name.length < 2) {
      errors.push("Item name is required (min 2 characters).");
    }

    // Validation 2: Price
    if (pricePaise === 0 && rawPrice.trim() !== "0" && rawPrice.trim() !== "0.00") {
      errors.push("Valid sale price is required.");
    } else if (pricePaise === 0) {
      issues.push("Sale price is ₹0.00 (marked as promotional sample).");
      zeroPriceCount++;
    }

    if (mrpPaise > 0 && pricePaise > mrpPaise) {
      issues.push(`Sale price (₹${salePriceRupees}) exceeds MRP (₹${defaultMrpRupees}).`);
    }

    // Validation 3: Negative Stock (Shortage)
    if (stockQty < 0) {
      issues.push(
        `Negative inventory detected (${stockQty} units). Represents physical dark-store shortage.`
      );
      shortageCount++;
    }

    // Validation 4: Barcode / Item Code presence
    if (!itemCode) {
      missingCodeCount++;
      issues.push("No item code provided; picking will be manual (no barcode generated).");
    }

    // Duplicate check within sheet
    let isDuplicateInSheet = false;
    if (itemCode) {
      if (seenItemCodesInSheet.has(itemCode)) {
        errors.push(
          `Duplicate item code "${itemCode}" found in row ${seenItemCodesInSheet.get(itemCode)}.`
        );
        duplicateCodeCount++;
        isDuplicateInSheet = true;
      } else {
        seenItemCodesInSheet.set(itemCode, rowNumber);
      }
    } else if (slug) {
      if (seenSlugsInSheet.has(slug)) {
        errors.push(
          `Duplicate item title without item code matching row ${seenSlugsInSheet.get(slug)}.`
        );
        duplicateCodeCount++;
        isDuplicateInSheet = true;
      } else {
        seenSlugsInSheet.set(slug, rowNumber);
      }
    }

    // Deterministic matching against database
    let action: ImportAction = "CREATE";
    let existingProductId: string | undefined = undefined;
    let existingSlug: string | undefined = undefined;
    let diff: NormalizedPOSRow["diff"] = undefined;
    let conflictReason: string | undefined = undefined;

    if (errors.length > 0 || isDuplicateInSheet) {
      action = "ERROR";
      errorCount++;
    } else if (itemCode) {
      // Primary: match by itemCode
      const existingByCode = byItemCode.get(itemCode);
      if (existingByCode) {
        existingProductId = existingByCode.id;
        existingSlug = existingByCode.slug;

        const isIdentical =
          existingByCode.price === pricePaise &&
          existingByCode.mrp === mrpPaise &&
          existingByCode.stockQty === stockQty &&
          existingByCode.name === name;

        if (isIdentical) {
          action = "SKIP";
          skippedCount++;
        } else {
          action = "UPDATE";
          diff = {
            ...(existingByCode.name !== name && {
              name: { from: existingByCode.name, to: name },
            }),
            ...(existingByCode.price !== pricePaise && {
              price: { from: existingByCode.price, to: pricePaise },
            }),
            ...(existingByCode.mrp !== mrpPaise && {
              mrp: { from: existingByCode.mrp, to: mrpPaise },
            }),
            ...(existingByCode.stockQty !== stockQty && {
              stockQty: { from: existingByCode.stockQty, to: stockQty },
            }),
          };
          updatedCount++;
        }
      } else {
        // Fallback: check if product exists by slug
        const existingBySlug = bySlug.get(slug);
        if (existingBySlug) {
          if (!existingBySlug.itemCode) {
            action = "UPDATE";
            existingProductId = existingBySlug.id;
            existingSlug = existingBySlug.slug;
            diff = {
              itemCode: { from: null, to: itemCode },
              ...(existingBySlug.price !== pricePaise && {
                price: { from: existingBySlug.price, to: pricePaise },
              }),
              ...(existingBySlug.mrp !== mrpPaise && {
                mrp: { from: existingBySlug.mrp, to: mrpPaise },
              }),
              ...(existingBySlug.stockQty !== stockQty && {
                stockQty: { from: existingBySlug.stockQty, to: stockQty },
              }),
            };
            updatedCount++;
          } else {
            action = "CONFLICT";
            conflictReason = `CONFLICT: Item name matches existing product "${existingBySlug.name}" which already has a different item code "${existingBySlug.itemCode}".`;
            errors.push(conflictReason);
            conflictCount++;
            errorCount++;
          }
        } else {
          action = "CREATE";
          createdCount++;
        }
      }
    } else {
      // Fallback matching when itemCode is blank: match by slug
      const existingBySlug = bySlug.get(slug);
      if (existingBySlug) {
        if (!existingBySlug.itemCode) {
          existingProductId = existingBySlug.id;
          existingSlug = existingBySlug.slug;

          const isIdentical =
            existingBySlug.price === pricePaise &&
            existingBySlug.mrp === mrpPaise &&
            existingBySlug.stockQty === stockQty &&
            existingBySlug.name === name;

          if (isIdentical) {
            action = "SKIP";
            skippedCount++;
          } else {
            action = "UPDATE";
            diff = {
              ...(existingBySlug.name !== name && {
                name: { from: existingBySlug.name, to: name },
              }),
              ...(existingBySlug.price !== pricePaise && {
                price: { from: existingBySlug.price, to: pricePaise },
              }),
              ...(existingBySlug.mrp !== mrpPaise && {
                mrp: { from: existingBySlug.mrp, to: mrpPaise },
              }),
              ...(existingBySlug.stockQty !== stockQty && {
                stockQty: { from: existingBySlug.stockQty, to: stockQty },
              }),
            };
            updatedCount++;
          }
        } else {
          // Binding Addition 2: conflict when blank code matches barcoded product
          action = "CONFLICT";
          conflictReason = `CONFLICT: Row has blank item code, but product name matches existing item "${existingBySlug.name}" with registered code "${existingBySlug.itemCode}". Explicit confirmation required.`;
          errors.push(conflictReason);
          conflictCount++;
          errorCount++;
        }
      } else {
        action = "CREATE";
        createdCount++;
      }
    }

    // Calculate stock diff for tests and UI
    let stockDiff: number | undefined = undefined;
    if (diff?.stockQty) {
      stockDiff = diff.stockQty.to - diff.stockQty.from;
    }

    // Truncate issues and errors to 200 chars to keep audit payload bounded
    const safeIssues = issues.map((i) => i.slice(0, 200));
    const safeErrors = errors.map((e) => e.slice(0, 200));

    normalizedRows.push({
      rowNumber,
      raw: rawMap,
      name,
      slug,
      itemCode,
      hasLeadingZero: isLeadingZero,
      defaultMrpRupees,
      salePriceRupees,
      mrpPaise,
      pricePaise,
      mrp: mrpPaise,
      price: pricePaise,
      stockQty,
      unit,
      barcodeSymbology,
      action,
      existingProductId,
      matchedProductId: existingProductId,
      existingSlug,
      diff,
      stockDiff,
      warnings: safeIssues,
      issues: safeIssues,
      errors: safeErrors,
      conflictReason,
    });
  }

  // Idempotency check against prior import hashes
  const priorImport = priorImports.find((p) => p.fileHash === fileHash);
  const previewToken = generatePreviewToken(fileHash, normalizedRows.length);

  const summary: ImportSummary = {
    totalRows: normalizedRows.length,
    toCreate: createdCount,
    createdCount,
    toUpdate: updatedCount,
    updatedCount,
    skipped: skippedCount,
    skippedCount,
    errors: errorCount,
    errorsCount: errorCount,
    shortageCount,
    shortagesCount: shortageCount,
    missingCodeCount,
    duplicateCodeCount,
    zeroPriceCount,
    conflictCount,
    fileHash,
    fileName,
    fileSize,
    sheetName: targetSheetName,
    isAlreadyImported: Boolean(priorImport),
    lastImportedAt: priorImport ? priorImport.createdAt.toISOString() : null,
    previewToken,
  };

  return {
    summary,
    rows: normalizedRows,
    items: normalizedRows,
    detectedFormat,
    fileHash,
    fileName,
    filename: fileName,
    previewToken,
  };
}
