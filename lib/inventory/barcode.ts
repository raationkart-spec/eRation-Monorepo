import type { SymbologyType } from "./types";

/**
 * Validates whether a code can be rendered using Code 128 symbology.
 * Code 128 supports printable ASCII characters from 32 (space) to 126 (~).
 * Rejects empty/whitespace-only strings, control chars, and non-ASCII.
 */
export function isValidCode128(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  // All characters must be within printable ASCII range [\x20-\x7E]
  return /^[\x20-\x7E]+$/.test(trimmed);
}

/**
 * Calculates the standard GS1 Modulo-10 checksum digit for a 12-digit string.
 */
export function calculateEan13Checksum(digits12: string): number {
  if (!digits12 || typeof digits12 !== "string") return 0;
  const clean = digits12.replace(/\D/g, "").slice(0, 12);
  if (clean.length < 12) return 0;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(clean[i], 10);
    // 0-indexed: Even index (1st, 3rd... digit) weight 1; Odd index (2nd, 4th... digit) weight 3
    const weight = i % 2 === 0 ? 1 : 3;
    sum += digit * weight;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Validates whether a given string is a valid GS1 EAN-13 barcode
 * with a matching Modulo-10 checksum.
 */
export function isValidEan13(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  if (!/^\d{13}$/.test(trimmed)) return false;

  const check = calculateEan13Checksum(trimmed.slice(0, 12));
  return check === parseInt(trimmed[12], 10);
}

export interface BarcodeResolutionResult {
  symbology: "EAN-13" | "CODE-128" | "NONE";
  code: string | null;
}

/**
 * Resolves symbology with rich result object for UI and tests.
 */
export function resolveBarcodeSymbology(code: string | null | undefined): BarcodeResolutionResult {
  if (!code || typeof code !== "string") {
    return { symbology: "NONE", code: null };
  }
  const trimmed = code.trim();
  if (trimmed.length === 0) {
    return { symbology: "NONE", code: null };
  }

  if (isValidEan13(trimmed)) {
    return { symbology: "EAN-13", code: trimmed };
  }

  if (isValidCode128(trimmed)) {
    return { symbology: "CODE-128", code: trimmed };
  }

  return { symbology: "NONE", code: trimmed };
}

/**
 * Resolves the appropriate database symbology identifier.
 * - "EAN13" if valid GS1 EAN-13 with valid checksum.
 * - "CODE128" for valid Code 128 characters.
 * - null if blank or invalid.
 */
export function resolveSymbology(code: string | null | undefined): SymbologyType | null {
  const res = resolveBarcodeSymbology(code);
  if (res.symbology === "EAN-13") return "EAN13";
  if (res.symbology === "CODE-128") return "CODE128";
  return null;
}
