-- QuickCart Additive Database Migration
-- Target: POS/ERP Inventory Import & Barcode Scanning Engine
-- Description: Adds itemCode, barcode, barcodeSymbology columns to Product, and creates InventoryImport audit table.
-- Safety: 100% Additive. No destructive operations (no DROP TABLE, no DROP COLUMN, no ALTER TYPE).

-- 1. Create ImportStatus Enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportStatus') THEN
    CREATE TYPE "ImportStatus" AS ENUM ('PREVIEW', 'COMMITTED', 'ROLLED_BACK', 'FAILED');
  END IF;
END $$;

-- 2. Add POS & Barcode fields to Product table (all nullable to preserve existing rows)
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "itemCode" TEXT,
ADD COLUMN IF NOT EXISTS "barcode" TEXT,
ADD COLUMN IF NOT EXISTS "barcodeSymbology" TEXT;

-- 3. Create unique index on Product.itemCode (allows multiple NULLs in PostgreSQL)
CREATE UNIQUE INDEX IF NOT EXISTS "Product_itemCode_key" ON "Product"("itemCode");

-- 4. Create InventoryImport Audit & Rollback Table
CREATE TABLE IF NOT EXISTS "InventoryImport" (
    "id" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "sheetName" TEXT NOT NULL,
    "importedBy" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "createdCount" INTEGER NOT NULL,
    "updatedCount" INTEGER NOT NULL,
    "skippedCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "shortageCount" INTEGER NOT NULL,
    "missingCodeCount" INTEGER NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'COMMITTED',
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryImport_pkey" PRIMARY KEY ("id")
);

-- 5. Create Performance Indexes on InventoryImport
CREATE INDEX IF NOT EXISTS "InventoryImport_fileHash_idx" ON "InventoryImport"("fileHash");
CREATE INDEX IF NOT EXISTS "InventoryImport_createdAt_idx" ON "InventoryImport"("createdAt");
