import type { OrderStatus } from "./types";

/**
 * Format money in paise to Indian Rupees formatted string (e.g. 14900 -> ₹149)
 */
export function formatMoney(paise: number): string {
  const rupees = (paise || 0) / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  })}`;
}

/**
 * Calculate discount percentage between MRP and Price
 */
export function discountPercent(mrp: number, price: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

/**
 * Order status configuration for labels, colors, and badge styles
 */
export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PLACED: {
    label: "Order Placed",
    bg: "#eff6ff",
    text: "#1d4ed8",
    dot: "#3b82f6",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "#faf5ff",
    text: "#7e22ce",
    dot: "#a855f7",
  },
  PACKED: {
    label: "Packed & Ready",
    bg: "#fff7ed",
    text: "#c2410c",
    dot: "#f97316",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    bg: "#fefce8",
    text: "#a16207",
    dot: "#eab308",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "#f0fdf4",
    text: "#15803d",
    dot: "#22c55e",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "#fef2f2",
    text: "#b91c1c",
    dot: "#ef4444",
  },
};

export function formatDate(isoString?: string): string {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
