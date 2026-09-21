/**
 * Converts rupee currency inputs (numbers or strings, including decimals)
 * to exact integer Indian Paise (1 Rupee = 100 Paise).
 * Employs Number.EPSILON rounding to prevent floating-point representation bugs (e.g. 72.36 * 100).
 * Clamps negative prices to 0 (prices cannot be negative).
 */
export function rupeeToPaise(val: number | string | undefined | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) return 0;
    return Math.round((val + Number.EPSILON) * 100);
  }

  const clean = String(val).replace(/[₹,\s]/g, "").trim();
  if (!clean) return 0;
  const parsed = parseFloat(clean);
  if (isNaN(parsed) || parsed <= 0) return 0;
  return Math.round((parsed + Number.EPSILON) * 100);
}

/**
 * Converts integer paise back to a rupee float (e.g. 7236 -> 72.36).
 */
export function paiseToRupee(paise: number | undefined | null): number {
  if (!paise || typeof paise !== "number" || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Formats integer paise into a human-readable rupee string.
 * Example: 7236 -> "₹72.36", 10000 -> "₹100", 0 -> "₹0"
 */
export function formatRupeeFromPaise(paise: number | undefined | null): string {
  const rupees = paiseToRupee(paise);
  if (rupees % 1 === 0) {
    return `₹${rupees.toFixed(0)}`;
  }
  return `₹${rupees.toFixed(2)}`;
}

/**
 * Parses inventory stock quantity as a signed integer.
 * CRITICAL: Retains negative numbers (e.g. -1, -3, -89) representing physical retail shortages.
 */
export function parseSignedStock(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  const raw = String(val).trim();
  const parsed = parseFloat(raw);
  if (isNaN(parsed)) return 0;
  return Math.trunc(parsed);
}

/**
 * Deterministically generates a URL-safe lowercase slug from a product name.
 */
export function slugify(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Inspects an item code string to verify if it has preserved leading zeros.
 * Example: "00491823" -> true, "89012330" -> false, "100PB349" -> false.
 */
export function hasLeadingZero(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  return trimmed.length > 1 && trimmed.startsWith("0") && /^\d+$/.test(trimmed);
}

/**
 * Extracts a pack size / unit string embedded in an item name (e.g. "1L", "1kg", "500g", "13.2g").
 * Falls back to default "1 unit" if no explicit unit is found.
 */
export function extractUnitFromName(name: string): string {
  if (!name) return "1 unit";

  // Match patterns like: 1kg, 500ml, 1.5L, 250g, 5 kg, 1 Ltr, 70g, 6 pcs, 1 pc
  const regex = /\b(\d+(?:\.\d+)?\s*(?:kg|g|gm|gms|l|ltr|ml|pcs|pc|pack|packs|bunch|dozen|m|cm))\b/i;
  const match = name.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }

  return "1 unit";
}
