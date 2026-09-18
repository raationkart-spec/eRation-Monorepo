import type { Banner, Category, Product } from "./types";

// ─── Categories ───
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

let pid = 0;
function p(
  name: string,
  categorySlug: string,
  unit: string,
  mrp: number,
  price: number,
  emoji: string,
  imageUrl: string,
  opts: Partial<Product> = {}
): Product {
  pid += 1;
  return {
    id: `p${pid}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    categorySlug,
    unit,
    mrp,
    price,
    emoji,
    imageUrl,
    stockQty: opts.stockQty ?? 40,
    lowStockThreshold: 5,
    tags: opts.tags ?? [],
    isActive: opts.isActive ?? true,
    isFeatured: opts.isFeatured ?? false,
    sortOrder: opts.sortOrder ?? 0,
    brand: opts.brand,
    description:
      opts.description ??
      `Fresh, quality ${name.toLowerCase()} delivered to your door in minutes. Handpicked for the best value.`,
  };
}

// ─── Products ───
export const PRODUCTS: Product[] = [];

// ─── Banners ───
export const BANNERS: Banner[] = [];

export const DEFAULT_CONFIG = {
  store_name: "QuickCart Siliguri",
  store_phone: "+91 98000 12345",
  store_email: "support@quickcart.in",
  store_address: "Hill Cart Road, Siliguri, West Bengal 734001",
  support_whatsapp: "+91 98000 12345",
  delivery_fee: 3900,           // ₹39
  free_delivery_above: 39900,   // ₹399
  platform_fee: 200,
  tax_rate: 0,
};

export const SERVICEABLE_PINCODES = ["734001", "734003", "734004", "734005", "734006", "734008"];

export const INDIA_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
export function productsInCategory(slug: string): Product[] {
  return PRODUCTS.filter((p) => p.categorySlug === slug && p.isActive);
}
export function featuredSections() {
  return CATEGORIES.map((cat) => ({
    category: cat,
    products: PRODUCTS.filter((p) => p.categorySlug === cat.slug && p.isFeatured && p.isActive),
  })).filter((s) => s.products.length > 0);
}
export function searchProducts(q: string): Product[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  return PRODUCTS.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(query) ||
        p.tags.some((t) => t.includes(query)) ||
        p.brand?.toLowerCase().includes(query))
  );
}
