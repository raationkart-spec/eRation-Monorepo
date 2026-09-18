import type { Banner, Category, Product, Coupon, StoreConfig } from "./types";

export const DEFAULT_CONFIG: StoreConfig = {
  storeName: "Semart",
  supportPhone: "+91 90000 00000",
  supportEmail: "support@semart.com",
  deliveryFee: 3900, // ₹39
  freeDeliveryThreshold: 39900, // ₹399
  platformFee: 500, // ₹5
  minOrderValue: 9900, // ₹99
};

export const SERVICEABLE_PINCODES = [
  "734001",
  "734003",
  "734004",
  "734005",
  "734006",
  "734008",
];

export const CATEGORIES: Category[] = [
  { id: "c1", name: "Fruits & Vegetables", slug: "fruits-vegetables", emoji: "🥦", imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&auto=format&fit=crop&q=80", sortOrder: 1, isActive: true },
  { id: "c2", name: "Dairy & Eggs", slug: "dairy-eggs", emoji: "🥛", imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80", sortOrder: 2, isActive: true },
  { id: "c3", name: "Bakery & Breads", slug: "bakery-breads", emoji: "🍞", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", sortOrder: 3, isActive: true },
  { id: "c4", name: "Snacks & Beverages", slug: "snacks-beverages", emoji: "🥤", imageUrl: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=80", sortOrder: 4, isActive: true },
  { id: "c5", name: "Household & Cleaning", slug: "household-cleaning", emoji: "🧼", imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80", sortOrder: 5, isActive: true },
  { id: "c6", name: "Personal Care", slug: "personal-care", emoji: "🧴", imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80", sortOrder: 6, isActive: true },
  { id: "c7", name: "Frozen Foods", slug: "frozen-foods", emoji: "🧊", imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80", sortOrder: 7, isActive: true },
  { id: "c8", name: "Staples & Grains", slug: "staples-grains", emoji: "🌾", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80", sortOrder: 8, isActive: true },
];

export const BANNERS: Banner[] = [];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: "c_welcome20",
    code: "WELCOME20",
    description: "20% off on your first order above ₹299",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderValue: 29900,
    maxDiscount: 10000,
    usedCount: 14,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "c_flat50",
    code: "QUICK50",
    description: "Flat ₹50 off on orders above ₹499",
    discountType: "FLAT",
    discountValue: 5000,
    minOrderValue: 49900,
    usedCount: 28,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const PRODUCTS: Product[] = [];
