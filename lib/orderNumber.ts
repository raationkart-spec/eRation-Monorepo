// ─── Order number generator: QC-YYYYMMDD-NNNN ───
export function makeOrderNumber(seq: number): string {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return `QC-${dateStr}-${String(seq).padStart(4, "0")}`;
}
