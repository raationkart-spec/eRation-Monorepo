// Domain types — exact mirror of QuickCart Next.js domain types.
// Money values are integers in paise (e.g. 100 paise = ₹1).

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
  createdAt?: string;
}

export interface FlashDeal {
  id: string;
  productId: string;
  product: Product;
  salePrice: number; // paise
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface BundleItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Bundle {
  id: string;
  name: string;
  description?: string;
  tag?: string;
  imageUrl?: string | null;
  price: number; // paise
  isActive: boolean;
  items: BundleItem[];
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
  bg: string;
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
  dealId?: string;
  overridePrice?: number;
  bundleId?: string;
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
  at: string; // ISO string
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

export interface StoreConfig {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  deliveryFee: number; // paise
  freeDeliveryThreshold: number; // paise
  platformFee: number; // paise
  minOrderValue: number; // paise
}
