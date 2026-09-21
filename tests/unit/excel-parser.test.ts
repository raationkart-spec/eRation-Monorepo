import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parsePOSWorkbook } from "@/lib/inventory/parser";

function createWorkbookBuffer(sheetName: string, rows: (string | number)[][]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("Excel POS Parser Engine", () => {
  it("targets 'Export Items' worksheet over other sheets", () => {
    const wb = XLSX.utils.book_new();
    const otherSheet = XLSX.utils.aoa_to_sheet([["Ignored Sheet", "Data"]]);
    const exportSheet = XLSX.utils.aoa_to_sheet([
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Tata Salt 1kg", "00491823", "50", "28.00", "26.00"],
    ]);
    XLSX.utils.book_append_sheet(wb, otherSheet, "Instructions");
    XLSX.utils.book_append_sheet(wb, exportSheet, "Export Items");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const result = parsePOSWorkbook(buffer, []);
    expect(result.summary.totalRows).toBe(1);
    expect(result.rows[0].name).toBe("Tata Salt 1kg");
    expect(result.rows[0].itemCode).toBe("00491823");
  });

  it("handles truncated POS headers like 'Default M' and 'Selling P'", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Maggi Masala 70g", "8901058852331", "100", "14.00", "12.50"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.rows.length).toBe(1);
    const item = result.rows[0];
    expect(item.name).toBe("Maggi Masala 70g");
    expect(item.mrpPaise).toBe(1400); // 14.00 -> 1400 paise
    expect(item.pricePaise).toBe(1250); // 12.50 -> 1250 paise
    expect(item.stockQty).toBe(100);
    expect(item.unit).toBe("70g");
    expect(item.action).toBe("CREATE");
  });

  it("preserves leading zeros in item codes (e.g. 00491823)", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Parle-G Biscuit", "00491823", "20", "10.00", "9.50"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.rows[0].itemCode).toBe("00491823");
    expect(result.rows[0].itemCode?.startsWith("00")).toBe(true);
  });

  it("preserves negative stock as shortage warning", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Amul Gold Milk 500ml", "100PB349", "-3", "33.00", "33.00"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.summary.shortageCount).toBe(1);
    expect(result.rows[0].stockQty).toBe(-3);
    expect(result.rows[0].warnings.some((i) => i.includes("Negative inventory"))).toBe(true);
  });

  it("identifies intra-sheet duplicate item codes as errors", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Item Alpha", "DUP123", "10", "50.00", "45.00"],
      ["Item Beta", "DUP123", "15", "60.00", "55.00"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.summary.errors).toBe(1);
    expect(result.rows[1].errors.some((e) => e.includes("Duplicate item code"))).toBe(true);
    expect(result.rows[1].action).toBe("ERROR");
  });

  it("detects UPDATE action when item matches an existing database product", () => {
    const existing = [
      {
        id: "prod_1",
        slug: "amul-butter-500g",
        name: "Amul Butter 500g",
        itemCode: "00889911",
        mrp: 27500,
        price: 27000,
        stockQty: 5,
        isActive: true,
      },
    ];

    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Amul Butter 500g", "00889911", "25", "280.00", "275.00"],
    ]);

    const result = parsePOSWorkbook(buffer, existing);
    expect(result.summary.toUpdate).toBe(1);
    expect(result.summary.toCreate).toBe(0);
    expect(result.rows[0].action).toBe("UPDATE");
    expect(result.rows[0].existingProductId).toBe("prod_1");
  });

  it("detects SKIP action when existing product already matches price, stock, and itemCode", () => {
    const existing = [
      {
        id: "prod_1",
        slug: "amul-butter-500g",
        name: "Amul Butter 500g",
        itemCode: "00889911",
        mrp: 28000,
        price: 27500,
        stockQty: 25,
        isActive: true,
      },
    ];

    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Amul Butter 500g", "00889911", "25", "280.00", "275.00"],
    ]);

    const result = parsePOSWorkbook(buffer, existing);
    expect(result.summary.skipped).toBe(1);
    expect(result.rows[0].action).toBe("SKIP");
  });

  it("computes deterministic SHA-256 file hash for idempotency", () => {
    const buffer1 = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Test 1", "T001", "10", "100.00", "90.00"],
    ]);

    const res1 = parsePOSWorkbook(buffer1, []);
    const res2 = parsePOSWorkbook(buffer1, []);
    expect(res1.summary.fileHash).toBe(res2.summary.fileHash);
    expect(res1.summary.fileHash.length).toBe(64); // SHA-256 hex length
  });

  it("flags CONFLICT when blank-code item matches product that already has registered itemCode", () => {
    const existing = [
      {
        id: "prod_barcoded",
        slug: "fortune-refined-oil-1l",
        name: "Fortune Refined Oil 1L",
        itemCode: "00491823",
        mrp: 14500,
        price: 13850,
        stockQty: 24,
        isActive: true,
      },
    ];

    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Fortune Refined Oil 1L", "", "30", "145.00", "140.00"], // Blank code
    ]);

    const result = parsePOSWorkbook(buffer, existing);
    expect(result.summary.conflictCount).toBe(1);
    expect(result.rows[0].action).toBe("CONFLICT");
    expect(result.rows[0].errors.some((e) => e.includes("CONFLICT"))).toBe(true);
  });

  it("flags CONFLICT when item code in sheet matches product name that has a different code in DB", () => {
    const existing = [
      {
        id: "prod_other",
        slug: "fortune-oil-1l",
        name: "Fortune Oil 1L",
        itemCode: "OLD_CODE_99",
        mrp: 14500,
        price: 13850,
        stockQty: 24,
        isActive: true,
      },
    ];

    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Fortune Oil 1L", "NEW_CODE_01", "30", "145.00", "140.00"],
    ]);

    const result = parsePOSWorkbook(buffer, existing);
    expect(result.summary.conflictCount).toBe(1);
    expect(result.rows[0].action).toBe("CONFLICT");
  });

  it("issues visible MRP_FALLBACK_TO_SALE warning when Default M is blank or 0", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Promo Salt 1kg", "SALT01", "10", "0", "20.00"],
      ["Promo Sugar 1kg", "SUG01", "10", "", "45.00"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.rows[0].mrpPaise).toBe(2000);
    expect(result.rows[0].warnings.some((w) => w.includes("MRP_FALLBACK_TO_SALE"))).toBe(true);
    expect(result.rows[1].mrpPaise).toBe(4500);
    expect(result.rows[1].warnings.some((w) => w.includes("MRP_FALLBACK_TO_SALE"))).toBe(true);
  });

  it("never extracts embedded numbers from item name into itemCode", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Maggi Noodles 70g 89010588", "", "150", "14.00", "14.00"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.rows[0].name).toBe("Maggi Noodles 70g 89010588");
    expect(result.rows[0].itemCode).toBeNull();
    expect(result.rows[0].barcodeSymbology).toBeNull();
  });

  it("handles wrong sheet gracefully by falling back to first sheet", () => {
    const buffer = createWorkbookBuffer("Items Sheet", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Item One", "C001", "5", "50.00", "45.00"],
    ]);

    const result = parsePOSWorkbook(buffer, []);
    expect(result.summary.totalRows).toBe(1);
    expect(result.summary.sheetName).toBe("Items Sheet");
  });

  it("throws clear error on malformed or empty spreadsheet", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.book_append_sheet(wb, ws, "Export Items");
    const emptyBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    expect(() => parsePOSWorkbook(emptyBuffer, [])).toThrow("Spreadsheet is empty or missing data rows.");
  });

  it("detects idempotent replay with isAlreadyImported: true", () => {
    const buffer = createWorkbookBuffer("Export Items", [
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Replay Item", "R001", "10", "100.00", "90.00"],
    ]);

    const hash = parsePOSWorkbook(buffer, []).summary.fileHash;
    const priorImports = [{ fileHash: hash, createdAt: new Date("2026-09-20T10:00:00Z") }];

    const result = parsePOSWorkbook(buffer, [], "replay.xlsx", priorImports);
    expect(result.summary.isAlreadyImported).toBe(true);
    expect(result.summary.lastImportedAt).toBe("2026-09-20T10:00:00.000Z");
  });
});
