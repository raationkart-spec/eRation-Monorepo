import { describe, it, expect } from "vitest";
import {
  rupeeToPaise,
  paiseToRupee,
  formatRupeeFromPaise,
  parseSignedStock,
  slugify,
  extractUnitFromName,
  hasLeadingZero,
} from "@/lib/inventory/validator";

describe("Currency & Stock Validation Engine", () => {
  describe("rupeeToPaise", () => {
    it("converts standard rupee floats to exact integer paise without floating point error", () => {
      expect(rupeeToPaise(72.36)).toBe(7236);
      expect(rupeeToPaise(19.99)).toBe(1999);
      expect(rupeeToPaise(10.05)).toBe(1005);
      expect(rupeeToPaise(0.01)).toBe(1);
      expect(rupeeToPaise(0)).toBe(0);
      expect(rupeeToPaise(250)).toBe(25000);
    });

    it("handles string representations with currency symbols or commas", () => {
      expect(rupeeToPaise("72.36")).toBe(7236);
      expect(rupeeToPaise("₹ 1,250.50")).toBe(125050);
      expect(rupeeToPaise("1,000")).toBe(100000);
    });

    it("handles null, undefined, or empty values as 0", () => {
      expect(rupeeToPaise(null)).toBe(0);
      expect(rupeeToPaise(undefined)).toBe(0);
      expect(rupeeToPaise("")).toBe(0);
    });

    it("clamps negative rupee prices to 0 (prices cannot be negative)", () => {
      expect(rupeeToPaise(-10)).toBe(0);
    });
  });

  describe("paiseToRupee and formatRupeeFromPaise", () => {
    it("converts integer paise back to rupee float", () => {
      expect(paiseToRupee(7236)).toBe(72.36);
      expect(paiseToRupee(1005)).toBe(10.05);
      expect(paiseToRupee(0)).toBe(0);
    });

    it("formats paise into currency string", () => {
      expect(formatRupeeFromPaise(7236)).toBe("₹72.36");
      expect(formatRupeeFromPaise(10000)).toBe("₹100");
    });
  });

  describe("parseSignedStock", () => {
    it("preserves signed negative inventory for dark-store shortages", () => {
      expect(parseSignedStock(-1)).toBe(-1);
      expect(parseSignedStock(-3)).toBe(-3);
      expect(parseSignedStock(-89)).toBe(-89);
      expect(parseSignedStock("-5")).toBe(-5);
      expect(parseSignedStock("-12.0")).toBe(-12);
    });

    it("preserves positive integer stock and zero", () => {
      expect(parseSignedStock(0)).toBe(0);
      expect(parseSignedStock("0")).toBe(0);
      expect(parseSignedStock(45)).toBe(45);
      expect(parseSignedStock("120")).toBe(120);
    });

    it("handles invalid or missing values with fallback to 0", () => {
      expect(parseSignedStock(null)).toBe(0);
      expect(parseSignedStock(undefined)).toBe(0);
      expect(parseSignedStock("N/A")).toBe(0);
      expect(parseSignedStock("abc")).toBe(0);
    });
  });

  describe("slugify", () => {
    it("normalizes product names into clean URL-safe slugs", () => {
      expect(slugify("Amul Butter 500g")).toBe("amul-butter-500g");
      expect(slugify("Lay's Classic Salted 50g")).toBe("lay-s-classic-salted-50g");
      expect(slugify("  Tata Tea Gold (250g)  ")).toBe("tata-tea-gold-250g");
    });

    it("strips trailing or repeated hyphens", () => {
      expect(slugify("Brand --- Super *** Special")).toBe("brand-super-special");
    });
  });

  describe("extractUnitFromName", () => {
    it("extracts common weight and volume units from product names", () => {
      expect(extractUnitFromName("Tata Salt 1kg")).toBe("1kg");
      expect(extractUnitFromName("Amul Taaza Milk 500ml")).toBe("500ml");
      expect(extractUnitFromName("Coca Cola 1.5L")).toBe("1.5L");
      expect(extractUnitFromName("Parle-G Biscuit 250g")).toBe("250g");
      expect(extractUnitFromName("Aashirvaad Atta 5 kg")).toBe("5 kg");
      expect(extractUnitFromName("Fortune Refined Oil 1 Ltr")).toBe("1 Ltr");
    });

    it("falls back to default unit when no quantity pattern is found", () => {
      expect(extractUnitFromName("Cadbury Dairy Milk Silk")).toBe("1 unit");
      expect(extractUnitFromName("Matchbox")).toBe("1 unit");
    });
  });

  describe("hasLeadingZero", () => {
    it("detects whether a string code has leading zeros", () => {
      expect(hasLeadingZero("00491823")).toBe(true);
      expect(hasLeadingZero("01234")).toBe(true);
      expect(hasLeadingZero("491823")).toBe(false);
      expect(hasLeadingZero("100PB349")).toBe(false);
      expect(hasLeadingZero("")).toBe(false);
    });
  });
});
