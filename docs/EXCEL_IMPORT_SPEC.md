# QuickCart — POS Excel Bulk Inventory Import Specification

> **Single Source of Truth**: This document details the exact technical specification, column schemas, data transformation rules, barcode policies, and Prisma database mapping for bulk inventory spreadsheets exported from Point-of-Sale (POS) and ERP systems.

---

## 1. Source Workbook Format & Structure

Based on physical POS export samples, the source workbook adheres to the following structural layout:

- **File Format**: Microsoft Excel OpenXML Spreadsheet (`.xlsx` or `.xls`).
- **Target Worksheet**: `Export Items` (case-sensitive matching with case-insensitive fallback).
- **Header Row**: **Row 1** contains the exact column headers.
  > [!NOTE]
  > There is **no extra title row, metadata block, or empty padding row** above Row 1. Parsing begins immediately on Row 1, with data records starting on Row 2. The parser must validate Row 1 upon upload.

```
+---+----------------------------+-------------+-------------+------------+------------------------+
|   |             A              |      B      |      C      |     D      |           E            |
+---+----------------------------+-------------+-------------+------------+------------------------+
| 1 | Item name*                 | Item code   | Default M   | Sale price | Current stock quantity |
| 2 | Fortune Refined Oil 1L     | 00491823    | 145.00      | 138.50     | 24                     |
| 3 | Tata Salt 1kg              |             | 28          | 25         | -3                     |
| 4 | Maggi Noodles 70g 89010588 |             | 14          | 14         | 150                    |
| 5 | Cadbury Dairy Milk 13.2g   | 89012330    | 10          | 10         | 0                      |
| 6 | Fresh Tomato Hybrid 1kg    |             | 40.00       | 35.00      | -89                    |
+---+----------------------------+-------------+-------------+------------+------------------------+
```

---

## 2. Source Column Schema & Data Validation Rules

| Column | Header Name | Type / Format | Required? | Validation & Business Rules |
| :---: | :--- | :--- | :---: | :--- |
| **A** | `Item name*` | String (text) | **Mandatory** | Minimum 2 characters. Represents the display title of the product. |
| **B** | `Item code` | String (text) | **Optional** | POS SKU or barcode number. **MUST be read and preserved strictly as Text** (e.g. `String(cell.w \|\| cell.v)`) to prevent dropping leading zeros (e.g. `00491` must not become `491`). |
| **C** | `Default M` | Numeric (rupees) | Optional / Warning | Visibly truncated in source POS export. Corresponds to **Default MRP**. May contain decimals (e.g. `72.36`) or zero. If zero or missing, defaults to Sale Price. |
| **D** | `Sale price` | Numeric (rupees) | **Mandatory** | Actual selling price to consumers in Rupees. Supports floating-point decimals (e.g. `72.36`, `138.50`) and whole integers. Must be $\ge 0$. |
| **E** | `Current stock quantity` | Signed Integer | **Mandatory** | Physical inventory on hand. **Signed integer**. Negative values (e.g. `-1`, `-3`, `-89`) represent valid shortage / oversold retail states and **MUST NOT be converted to 0**. |

---

## 3. Critical Data Transformation & Parsing Rules

### A. Strict Text Preservation for `Item code` (Leading Zeros)
Many retail product codes and barcodes start with leading zeros (e.g. `0012948271`).
```typescript
// Correct: preserve formatting as string from SheetJS formatted text (.w)
const itemCode = (cell.w ? String(cell.w) : String(cell.v || "")).trim();

// Prohibited: casting to Number drops leading zeros:
// const itemCode = String(Number(cell.v)); // Corrupts 00491 -> 491!
```

### B. Truncated Header Handling (`Default M`)
The source POS export truncates "Default MRP" to `Default M`.
- **Parsing Policy**: The parser resolves column aliases:
  `["default m", "default mrp", "mrp", "maximum retail price", "original price"]`.
- The parser verifies that `Default M` exists on Row 1. If present, it maps to `mrp`.

### C. Decimal Rupee to Integer Paise Conversion
All QuickCart pricing fields in the database and API are stored as **integer paise** (₹1 = 100 paise).
```typescript
function rupeeToPaise(rupeeValue: number | string): number {
  const numeric = typeof rupeeValue === "number" ? rupeeValue : parseFloat(String(rupeeValue).replace(/[₹,\s]/g, ""));
  if (isNaN(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}

// Examples:
// rupeeToPaise(72.36)  => 7236
// rupeeToPaise(138.50) => 13850
// rupeeToPaise(0)      => 0
```

### D. Signed Integer Stock Handling (Negative Stock Preservation)
In retail POS data, negative stock is not an error; it is a vital indicator of an oversold dark-store condition or unrecorded inventory receipt.
```typescript
function parseStock(stockValue: any): number {
  const raw = String(stockValue).trim();
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 0 : parsed; // Preserves -1, -3, -89 as negative integers
}
```
> [!CAUTION]
> Under no circumstances should `Math.max(0, parsedStock)` be applied during import. Physical retail shortages must remain visible to inventory managers.

### E. Appended Numbers in Item Names vs. Item Codes
In the source POS system, many rows have a blank `Item code` column, while some barcodes or internal numbers are embedded at the end of the item name (e.g. `"Maggi Noodles 70g 8901058852271"`).
- **Strict Separation Policy**: The parser **MUST NOT guess or extract** numbers from the item name into the `Item code` column unless an explicit, user-approved extraction rule is defined.
- **Rationale**: An appended number could be a pack count, gram weight, batch number, or manufacturer code. Guessing introduces incorrect barcode data that causes scanning failures during fulfillment.

---

## 4. Barcode Display & Scanning Policy

```mermaid
flowchart TD
    Row[Imported Product Record] --> CheckCode{Is itemCode non-empty?}
    CheckCode -->|Yes (e.g. '89012330')| RenderBarcode["Generate & Display Barcode<br/>(EAN-13 / Code-128)"]
    CheckCode -->|No (Blank / Null)| NoBarcode["Do NOT Render Barcode<br/>Display 'No Barcode Assigned'"]
    RenderBarcode --> Scanner["Supported in Warehouse Scanner"]
```

> [!IMPORTANT]
> **Barcode Generation Policy**:
> 1. QuickCart **only** generates and renders a barcode (in admin packaging lists or product sheets) when `itemCode` is non-empty and contains valid alphanumeric barcode characters.
> 2. QuickCart **never invents, generates fake, or auto-assigns placeholder barcodes** when `Item code` is blank.
> 3. If an item lacks an `Item code`, it is picked and fulfilled manually by item name and pack size.

---

## 5. Database Mapping & Prisma Schema Gap Analysis

### Target Mapping: Spreadsheet to Prisma `Product` Model

| Source POS Column | Target Field in Prisma | Target Data Type | Transformation / Default Rule |
| :--- | :--- | :--- | :--- |
| `Item name*` | `Product.name` | `String` | Raw string trimmed. Used to generate `slug` if new. |
| `Item code` | *(Schema Gap)* | `String?` | **Gap**: Does not exist in current schema. Target: `itemCode String? @unique`. |
| `Default M` | `Product.mrp` | `Int` (paise) | `rupeeToPaise(cell)`. If zero, fall back to `Product.price`. |
| `Sale price` | `Product.price` | `Int` (paise) | `rupeeToPaise(cell)`. |
| `Current stock quantity` | `Product.stockQty` | `Int` (signed) | `parseInt(cell, 10)`. Signed integer preserved. |
| *(Derived)* | `Product.slug` | `String` (UK) | `name.toLowerCase().replace(/[^a-z0-9]+/g, "-")`. |
| *(Derived)* | `Product.unit` | `String` | Extracted from name (e.g. `1L`, `1kg`, `500g`) or default `"1 unit"`. |
| *(Derived)* | `Product.categorySlug`| `String` (FK) | Fuzzy matched against active categories; falls back to `"general"`. |
| *(Derived)* | `Product.isActive` | `Boolean` | `true` if valid and has image; can be defaulted to `false` for incomplete items. |
| *(Derived)* | `Product.lowStockThreshold`| `Int` | Default `5`. |
| *(Derived)* | `Product.emoji` | `String` | Default `"📦"`. |

### Database Schema Migration Required
To fully support this POS import specification, a Prisma migration is required:
```prisma
// Planned addition to prisma/schema.prisma
model Product {
  // ... existing fields ...
  itemCode String? @unique
  barcode  String?
}
```

---

## 6. Current Implementation vs. Planned Implementation vs. Known Limitations

### Current Implementation
- `components/admin/ImportProductsModal.tsx` supports generic `.xlsx` parsing via SheetJS (`xlsx@0.18.5`) with alias matching and bulk upserting to `/api/admin/products/bulk`.
- The current implementation expects columns such as `Name`, `Category Slug`, `Brand`, `Unit`, `MRP (₹)`, `Selling Price (₹)`.
- The current implementation flags prices $\le 0$ as errors and does not yet handle negative stock values gracefully.

### Planned Implementation
- Add dedicated mode or automatic detection for the `Export Items` worksheet format.
- Support `Default M` as Default MRP and signed integer stock quantities.
- Apply migration adding `itemCode` to `Product` model and update `POST /api/admin/products/bulk` to upsert by `itemCode` (when present) or `slug`.
- Add dry-run summary modal displaying count of newly created items, updated items, negative stock warnings, and items lacking images.

### Known Limitations
- **No `itemCode` Column in Database**: Attempting to persist `itemCode` today will be rejected by Prisma ORM until a migration adds the column.
- **Stock Floor Guard**: In current order placement (`/api/orders`), negative stock items cannot be decremented further because of `if (product.stockQty >= item.quantity)`.

---

## 7. Documentation Maintenance Rule

> [!IMPORTANT]
> **Documentation Maintenance Rule**:
> Any change to POS workbook formats, column mappings, barcode policies, or stock validation rules must be documented in this specification and recorded in `docs/CHANGELOG.md` in the same pull request.
