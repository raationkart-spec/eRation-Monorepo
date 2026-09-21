import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as previewHandler } from "@/app/api/admin/inventory/import/preview/route";
import { POST as commitHandler } from "@/app/api/admin/inventory/import/commit/route";
import { POST as rollbackHandler } from "@/app/api/admin/inventory/import/[id]/rollback/route";
import { GET as barcodeHandler } from "@/app/api/products/barcode/[code]/route";

// Mock auth module
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock db module
vi.mock("@/lib/db", () => {
  const mockDb: any = {
    product: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    inventoryImport: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => await cb(mockDb)),
  };
  return { db: mockDb };
});

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { resetRateLimit } from "@/lib/rateLimit";

describe("API Server-Side Authorization Gates & Workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimit();
  });

  describe("POST /api/admin/inventory/import/preview", () => {
    it("rejects unauthenticated requests with 401", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const formData = new FormData();
      formData.append("file", new Blob(["mock content"]), "test.xlsx");

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/preview", {
        method: "POST",
        body: formData,
      });

      const res = await previewHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("rejects non-admin requests with 403", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      const formData = new FormData();
      formData.append("file", new Blob(["mock content"]), "test.xlsx");

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/preview", {
        method: "POST",
        body: formData,
      });

      const res = await previewHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });
  });

  describe("POST /api/admin/inventory/import/commit", () => {
    it("rejects unauthenticated requests with 401", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/commit", {
        method: "POST",
        body: JSON.stringify({ fileHash: "hash123", rows: [] }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await commitHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("rejects non-admin requests with 403", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/commit", {
        method: "POST",
        body: JSON.stringify({ fileHash: "hash123", rows: [] }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await commitHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    it("returns 409 Conflict when replaying an already committed fileHash without forceRecommit", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_admin", email: "admin@quickcart.com", role: "ADMIN" },
      } as any);

      vi.mocked(db.inventoryImport.findFirst).mockResolvedValue({
        id: "imp_existing_1",
        fileHash: "duplicate_hash_abc",
        status: "COMMITTED",
        createdAt: new Date("2026-09-20T12:00:00Z"),
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/commit", {
        method: "POST",
        body: JSON.stringify({
          fileHash: "duplicate_hash_abc",
          rows: [{ rowNumber: 2, action: "CREATE", name: "Item", stockQty: 10, mrpPaise: 1000, pricePaise: 900 }],
        }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await commitHandler(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.isAlreadyImported).toBe(true);
      expect(data.error).toContain("already been committed");
    });
  });

  describe("POST /api/admin/inventory/import/[id]/rollback", () => {
    it("rejects unauthenticated requests with 401", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/imp_123/rollback", {
        method: "POST",
      });

      const res = await rollbackHandler(req, {
        params: Promise.resolve({ id: "imp_123" }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("rejects non-admin requests with 403", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/imp_123/rollback", {
        method: "POST",
      });

      const res = await rollbackHandler(req, {
        params: Promise.resolve({ id: "imp_123" }),
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Forbidden");
    });

    it("executes snapshot rollback successfully for authorized admin", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_admin", email: "admin@quickcart.com", role: "ADMIN" },
      } as any);

      vi.mocked(db.inventoryImport.findUnique).mockResolvedValue({
        id: "imp_123",
        status: "COMMITTED",
        summary: {
          snapshots: [
            {
              productId: "prod_1",
              action: "UPDATED",
              previousName: "Old Name",
              previousMrp: 15000,
              previousPrice: 14000,
              previousStockQty: 10,
              previousItemCode: "001122",
              previousBarcode: "001122",
              previousIsActive: true,
            },
          ],
        },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/admin/inventory/import/imp_123/rollback", {
        method: "POST",
      });

      const res = await rollbackHandler(req, {
        params: Promise.resolve({ id: "imp_123" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.revertedCount).toBe(1);
      expect(db.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "prod_1" },
          data: expect.objectContaining({
            mrp: 15000,
            price: 14000,
            stockQty: 10,
            itemCode: "001122",
          }),
        })
      );
    });
  });

  describe("GET /api/products/barcode/[code]", () => {
    it("rejects unauthenticated (anonymous) requests with 401", async () => {
      vi.mocked(auth).mockResolvedValue(null as any);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/00491823");

      const res = await barcodeHandler(req, {
        params: Promise.resolve({ code: "00491823" }),
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("Unauthorized");
    });

    it("allows authenticated CUSTOMER read-only lookup with sanitized fields", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      const mockDbProduct = {
        id: "prod_123",
        name: "Fortune Refined Oil 1L",
        slug: "fortune-oil-1l",
        unit: "1L",
        mrp: 14500,
        price: 13850,
        stockQty: 24, // Internal warehouse count
        itemCode: "00491823", // Admin POS code
        barcode: "00491823",
        barcodeSymbology: "CODE128",
        emoji: "🛢️",
        imageUrl: "https://example.com/oil.jpg",
        isActive: true,
        category: { id: "cat_oils", name: "Oils", slug: "oils" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.product.findFirst).mockResolvedValue(mockDbProduct as any);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/00491823");

      const res = await barcodeHandler(req, {
        params: Promise.resolve({ code: "00491823" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.product).toBeDefined();

      // Safe storefront fields present
      expect(data.product.id).toBe("prod_123");
      expect(data.product.name).toBe("Fortune Refined Oil 1L");
      expect(data.product.slug).toBe("fortune-oil-1l");
      expect(data.product.price).toBe(13850);
      expect(data.product.mrp).toBe(14500);
      expect(data.product.unit).toBe("1L");
      expect(data.product.imageUrl).toBe("https://example.com/oil.jpg");
      expect(data.product.image).toBe("https://example.com/oil.jpg");
      expect(data.product.availability).toBe("IN_STOCK");
      expect(data.product.isAvailable).toBe(true);

      // Sensitive internal & audit fields strictly withheld from customer
      expect(data.product.stockQty).toBeUndefined();
      expect(data.product.itemCode).toBeUndefined();
      expect(data.product.barcode).toBeUndefined();
      expect(data.product.barcodeSymbology).toBeUndefined();
      expect(data.product.category).toBeUndefined();
      expect(data.product.createdAt).toBeUndefined();
      expect(data.product.updatedAt).toBeUndefined();
    });

    it("resolves richer product details for ADMIN requests including stockQty and barcodes", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_admin", email: "admin@quickcart.com", role: "ADMIN" },
      } as any);

      const mockProduct = {
        id: "prod_123",
        name: "Fortune Refined Oil 1L",
        slug: "fortune-oil-1l",
        itemCode: "00491823",
        barcode: "00491823",
        barcodeSymbology: "CODE128",
        mrp: 14500,
        price: 13850,
        stockQty: -4, // Physical dark-store shortage visible to admin
        isActive: true,
        category: { id: "cat_oils", name: "Oils", slug: "oils" },
      };

      vi.mocked(db.product.findFirst).mockResolvedValue(mockProduct as any);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/00491823");

      const res = await barcodeHandler(req, {
        params: Promise.resolve({ code: "00491823" }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.product).toEqual(mockProduct);
      expect(data.product.stockQty).toBe(-4);
      expect(data.product.itemCode).toBe("00491823");
    });

    it("returns 400 Bad Request for empty or invalid code parameter", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/%20%20");

      const res = await barcodeHandler(req, {
        params: Promise.resolve({ code: "   " }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Barcode or item code");
    });

    it("returns 404 Not Found when product does not exist in database", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      vi.mocked(db.product.findFirst).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/UNKNOWN999");

      const res = await barcodeHandler(req, {
        params: Promise.resolve({ code: "UNKNOWN999" }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("Product not found");
    });

    it("returns 404 Not Found for CUSTOMER when product is marked inactive", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_cust", email: "customer@example.com", role: "CUSTOMER" },
      } as any);

      vi.mocked(db.product.findFirst).mockResolvedValue({
        id: "prod_inactive",
        name: "Inactive Item",
        isActive: false,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/INACTIVE123");

      const res = await barcodeHandler(req, {
        params: Promise.resolve({ code: "INACTIVE123" }),
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.error).toContain("Product not found");
    });

    it("enforces rate/abuse limits (429) on excessive barcode queries", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u_spammer", email: "spammer@example.com", role: "CUSTOMER" },
      } as any);

      vi.mocked(db.product.findFirst).mockResolvedValue({
        id: "prod_ok",
        name: "Test Product",
        isActive: true,
        stockQty: 10,
      } as any);

      const req = new NextRequest("http://localhost:3000/api/products/barcode/00491823");

      // Send 60 allowed requests
      for (let i = 0; i < 60; i++) {
        const res = await barcodeHandler(req, {
          params: Promise.resolve({ code: "00491823" }),
        });
        expect(res.status).toBe(200);
      }

      // 61st request triggers 429 Too Many Requests
      const blockedRes = await barcodeHandler(req, {
        params: Promise.resolve({ code: "00491823" }),
      });
      expect(blockedRes.status).toBe(429);
      const data = await blockedRes.json();
      expect(data.error).toContain("Too many requests");
    });
  });
});
