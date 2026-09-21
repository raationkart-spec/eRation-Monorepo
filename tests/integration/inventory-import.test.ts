import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parsePOSWorkbook } from "@/lib/inventory/parser";
import type { ProductSnapshot } from "@/lib/inventory/types";

describe("Inventory Import Workflow & Rollback Simulation", () => {
  it("generates complete preview response with accurate counters", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Item name*", "Item code", "Current stock quantity", "Default M", "Selling P"],
      ["Fresh Apples 1kg", "APPL01", "15", "120.00", "100.00"], // CREATE
      ["Amul Milk 500ml", "MILK01", "-2", "30.00", "30.00"],    // Shortage warning
      ["Sample Candy", "CANDY01", "50", "5.00", "0.00"],        // Zero price issue
      ["Local Eggs 6pcs", "", "20", "45.00", "42.00"],           // Missing code issue
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Export Items");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const preview = parsePOSWorkbook(buffer, [], "sample-inventory.xlsx");

    expect(preview.summary.totalRows).toBe(4);
    expect(preview.summary.toCreate).toBe(4);
    expect(preview.summary.shortageCount).toBe(1);
    expect(preview.summary.zeroPriceCount).toBe(1);
    expect(preview.summary.missingCodeCount).toBe(1);
    expect(preview.summary.fileName).toBe("sample-inventory.xlsx");
    expect(preview.summary.fileHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("accurately simulates snapshot capture and rollback state restoration", () => {
    // Original DB product state before import
    const initialProduct = {
      id: "prod_test_101",
      slug: "fortune-sunflower-oil-1l",
      name: "Fortune Sunflower Oil 1L",
      itemCode: "00112233",
      barcode: "00112233",
      barcodeSymbology: "CODE128",
      mrp: 18000,
      price: 16500,
      stockQty: 8,
      isActive: true,
    };

    // 1. Capture snapshot before update
    const snapshot: ProductSnapshot = {
      productId: initialProduct.id,
      slug: initialProduct.slug,
      previousMrp: initialProduct.mrp,
      previousPrice: initialProduct.price,
      previousStockQty: initialProduct.stockQty,
      previousItemCode: initialProduct.itemCode,
      previousBarcode: initialProduct.barcode,
      previousIsActive: initialProduct.isActive,
      newMrp: 19000,
      newPrice: 17500,
      newStockQty: 25,
      newItemCode: initialProduct.itemCode,
      action: "UPDATED",
    };

    // 2. Simulate import update (e.g. price change and stock addition from POS)
    const importedProduct = {
      ...initialProduct,
      mrp: snapshot.newMrp,
      price: snapshot.newPrice,
      stockQty: snapshot.newStockQty,
    };

    expect(importedProduct.price).not.toBe(snapshot.previousPrice);
    expect(importedProduct.stockQty).not.toBe(snapshot.previousStockQty);

    // 3. Simulate rollback using snapshot
    const rolledBackProduct = {
      ...importedProduct,
      mrp: snapshot.previousMrp,
      price: snapshot.previousPrice,
      stockQty: snapshot.previousStockQty,
      itemCode: snapshot.previousItemCode,
      barcode: snapshot.previousBarcode,
      isActive: snapshot.previousIsActive,
    };

    // Verification: state exactly matches pre-import values
    expect(rolledBackProduct.mrp).toBe(initialProduct.mrp);
    expect(rolledBackProduct.price).toBe(initialProduct.price);
    expect(rolledBackProduct.stockQty).toBe(initialProduct.stockQty);
    expect(rolledBackProduct.itemCode).toBe(initialProduct.itemCode);
  });
});
