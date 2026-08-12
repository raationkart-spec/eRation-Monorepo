// Domain types — mirrors the PRD Prisma schema, trimmed for the demo.
// All money values are integers in paise.

export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "PENDING" | "COLLECTED" | "FAILED" | "REFUNDED";
export type PaymentMethod = "COD" | "RAZORPAY" | "UPI";
export type Role = "CUSTOMER" | "ADMIN";

export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categorySlug: string;
  brand?: string;
  unit: string;
  mrp: number; // paise
  price: number; // paise
  stockQty: number;
  lowStockThreshold: number;
  emoji: string;
  imageUrl?: string | null;
  images?: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  imageUrl?: string | null;
  bg: string; // tailwind gradient classes
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Address {
  id: string;
  label?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  emoji: string;
  imageUrl?: string | null;
  price: number;
  mrp: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  note?: string;
  at: string; // ISO
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  address: Omit<Address, "id" | "isDefault">;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
  statusHistory: OrderStatusEvent[];
  customerName: string;
  customerPhone: string;
}

export interface User {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  image?: string;
}
