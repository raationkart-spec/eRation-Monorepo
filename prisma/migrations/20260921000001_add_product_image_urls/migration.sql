-- QuickCart Additive Database Migration
-- Target: Product Multi-Image Support
-- Description: Adds imageUrls array column to Product table with empty array default.
-- Safety: 100% Additive. No destructive operations.

ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
