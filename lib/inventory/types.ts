export type ImportAction = "CREATE" | "UPDATE" | "SKIP" | "CONFLICT" | "ERROR";

export type SymbologyType = "CODE128" | "EAN13" | "CODE-128" | "EAN-13" | "NONE";

export interface RawPOSRow {
  [key: string]: any;
}

export interface NormalizedPOSRow {
  rowNumber: number;
  raw: Record<string, string>;
  name: string;
  slug: string;
  itemCode: string | null;
  hasLeadingZero: boolean;
  defaultMrpRupees: number;
  salePriceRupees: number;
  mrpPaise: number;
  pricePaise: number;
  mrp: number; // alias to mrpPaise for testing and legacy consumers
  price: number; // alias to pricePaise
  stockQty: number; // Signed integer (supports -1, -3, -89)
  unit: string;
  barcodeSymbology: SymbologyType | null;
  action: ImportAction;
  existingProductId?: string;
  matchedProductId?: string; // alias to existingProductId
  existingSlug?: string;
  diff?: {
    name?: { from: string; to: string };
    price?: { from: number; to: number };
    mrp?: { from: number; to: number };
    stockQty?: { from: number; to: number };
    itemCode?: { from: string | null; to: string | null };
  };
  stockDiff?: number;
  warnings: string[];
  issues: string[]; // alias to warnings
  errors: string[];
  conflictReason?: string;
}

export interface ImportSummary {
  totalRows: number;
  toCreate: number;
  createdCount: number; // alias
  toUpdate: number;
  updatedCount: number; // alias
  skipped: number;
  skippedCount: number; // alias
  errors: number;
  errorsCount: number; // alias
  shortageCount: number; // rows with stockQty < 0
  shortagesCount: number; // alias
  missingCodeCount: number; // rows with itemCode == null
  duplicateCodeCount: number;
  zeroPriceCount: number;
  conflictCount: number;
  fileHash: string;
  fileName: string;
  fileSize: number;
  sheetName: string;
  isAlreadyImported: boolean;
  lastImportedAt?: string | null;
  previewToken?: string;
}

export interface ImportPreviewResponse {
  summary: ImportSummary;
  rows: NormalizedPOSRow[];
  items: NormalizedPOSRow[]; // alias to rows
  detectedFormat: "POS_EXPORT_ITEMS" | "LEGACY_CATALOG";
  fileHash: string;
  fileName: string;
  filename: string; // alias to fileName
  previewToken?: string;
}

export interface ImportCommitOptions {
  fileHash: string;
  previewToken?: string;
  forceRecommit?: boolean;
  fileName: string;
  sheetName: string;
  autoHideIncomplete?: boolean;
  defaultCategorySlug?: string;
  skipErrors?: boolean;
  rows?: NormalizedPOSRow[];
  fileSize?: number;
}

export interface ImportCommitResponse {
  success: boolean;
  importId: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  shortageCount: number;
  auditLogId: string;
}

export interface ProductSnapshot {
  id?: string;
  productId: string;
  name?: string;
  slug: string;
  previousName?: string;
  previousMrp: number;
  previousPrice: number;
  previousStockQty: number;
  previousItemCode: string | null;
  previousBarcode: string | null;
  previousSymbology?: string | null;
  previousIsActive: boolean;
  newName?: string;
  newMrp: number;
  newPrice: number;
  newStockQty: number;
  newItemCode: string | null;
  newBarcode?: string | null;
  newSymbology?: string | null;
  action?: "CREATED" | "UPDATED";
  mrp?: number;
  price?: number;
  stockQty?: number;
  itemCode?: string | null;
  barcode?: string | null;
  barcodeSymbology?: string | null;
  isActive?: boolean;
}
