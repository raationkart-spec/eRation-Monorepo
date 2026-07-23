import type { Banner, Category, Product } from "./types";

// ─── Categories (PRD Part 5 default top-level categories) ───
export const CATEGORIES: Category[] = [
  { id: "c1", name: "Fruits & Vegetables", slug: "fruits-vegetables", emoji: "🥦", sortOrder: 1, isActive: true },
  { id: "c2", name: "Dairy & Eggs", slug: "dairy-eggs", emoji: "🥛", sortOrder: 2, isActive: true },
  { id: "c3", name: "Bakery & Breads", slug: "bakery-breads", emoji: "🍞", sortOrder: 3, isActive: true },
  { id: "c4", name: "Snacks & Beverages", slug: "snacks-beverages", emoji: "🥤", sortOrder: 4, isActive: true },
  { id: "c5", name: "Household & Cleaning", slug: "household-cleaning", emoji: "🧼", sortOrder: 5, isActive: true },
  { id: "c6", name: "Personal Care", slug: "personal-care", emoji: "🧴", sortOrder: 6, isActive: true },
  { id: "c7", name: "Frozen Foods", slug: "frozen-foods", emoji: "🧊", sortOrder: 7, isActive: true },
  { id: "c8", name: "Staples & Grains", slug: "staples-grains", emoji: "🌾", sortOrder: 8, isActive: true },
];

// helper to build a product
let pid = 0;
function p(
  name: string,
  categorySlug: string,
  unit: string,
  mrp: number,
  price: number,
  emoji: string,
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

// ─── Products (prices in paise) ───
export const PRODUCTS: Product[] = [
  // Fruits & Vegetables
  p("Fresh Bananas", "fruits-vegetables", "6 pcs", 6000, 4900, "🍌", { isFeatured: true, tags: ["banana", "fruit"] }),
  p("Red Apples", "fruits-vegetables", "1 kg", 18000, 14900, "🍎", { isFeatured: true, tags: ["apple", "fruit"] }),
  p("Tomatoes", "fruits-vegetables", "500 g", 4000, 2900, "🍅", { isFeatured: true, tags: ["tomato", "vegetable"] }),
  p("Baby Spinach", "fruits-vegetables", "250 g", 3500, 2500, "🥬", { tags: ["spinach", "greens"] }),
  p("Carrots", "fruits-vegetables", "500 g", 4500, 3500, "🥕", { isFeatured: true, tags: ["carrot"] }),
  p("Fresh Broccoli", "fruits-vegetables", "1 pc", 8000, 5900, "🥦", { tags: ["broccoli"] }),
  p("Alphonso Mangoes", "fruits-vegetables", "1 kg", 40000, 34900, "🥭", { isFeatured: true, tags: ["mango"] }),
  p("Green Grapes", "fruits-vegetables", "500 g", 9000, 6900, "🍇", { tags: ["grapes"] }),
  p("Lemons", "fruits-vegetables", "4 pcs", 3000, 2400, "🍋", { tags: ["lemon"] }),
  p("Potatoes", "fruits-vegetables", "1 kg", 4000, 3200, "🥔", { tags: ["potato"], stockQty: 3 }),

  // Dairy & Eggs
  p("Amul Full Cream Milk", "dairy-eggs", "1 L", 7200, 6800, "🥛", { isFeatured: true, brand: "Amul", tags: ["milk"] }),
  p("Farm Eggs", "dairy-eggs", "6 pcs", 6500, 5400, "🥚", { isFeatured: true, tags: ["eggs"] }),
  p("Amul Butter", "dairy-eggs", "100 g", 5800, 5500, "🧈", { brand: "Amul", tags: ["butter"] }),
  p("Cheese Slices", "dairy-eggs", "200 g", 14500, 12900, "🧀", { tags: ["cheese"] }),
  p("Greek Yogurt", "dairy-eggs", "400 g", 9000, 7500, "🍶", { isFeatured: true, tags: ["yogurt", "curd"] }),
  p("Paneer", "dairy-eggs", "200 g", 9500, 8500, "🧀", { tags: ["paneer"], stockQty: 4 }),

  // Bakery & Breads
  p("Whole Wheat Bread", "bakery-breads", "400 g", 5500, 4500, "🍞", { isFeatured: true, tags: ["bread"] }),
  p("Butter Croissant", "bakery-breads", "2 pcs", 12000, 9900, "🥐", { tags: ["croissant"] }),
  p("Multigrain Bagel", "bakery-breads", "4 pcs", 14000, 11900, "🥯", { tags: ["bagel"] }),
  p("Chocolate Muffin", "bakery-breads", "2 pcs", 10000, 8500, "🧁", { isFeatured: true, tags: ["muffin"] }),

  // Snacks & Beverages
  p("Potato Chips Classic", "snacks-beverages", "90 g", 5000, 4000, "🥔", { isFeatured: true, tags: ["chips"] }),
  p("Cola Soft Drink", "snacks-beverages", "750 ml", 4500, 4000, "🥤", { tags: ["cola", "drink"] }),
  p("Dark Chocolate Bar", "snacks-beverages", "80 g", 15000, 12500, "🍫", { isFeatured: true, tags: ["chocolate"] }),
  p("Salted Popcorn", "snacks-beverages", "70 g", 4000, 3500, "🍿", { tags: ["popcorn"] }),
  p("Orange Juice", "snacks-beverages", "1 L", 12000, 9900, "🧃", { isFeatured: true, tags: ["juice"] }),
  p("Roasted Almonds", "snacks-beverages", "200 g", 32000, 27900, "🥜", { tags: ["almonds", "nuts"] }),

  // Household & Cleaning
  p("Dishwash Liquid", "household-cleaning", "500 ml", 12000, 9900, "🧽", { tags: ["dishwash"] }),
  p("Floor Cleaner", "household-cleaning", "1 L", 18000, 14900, "🧴", { isFeatured: true, tags: ["cleaner"] }),
  p("Garbage Bags", "household-cleaning", "30 pcs", 15000, 11900, "🗑️", { tags: ["bags"] }),
  p("Laundry Detergent", "household-cleaning", "1 kg", 22000, 18900, "🧺", { tags: ["detergent"] }),

  // Personal Care
  p("Herbal Shampoo", "personal-care", "340 ml", 34000, 28900, "🧴", { isFeatured: true, tags: ["shampoo"] }),
  p("Bath Soap Pack", "personal-care", "4 x 100 g", 16000, 13500, "🧼", { tags: ["soap"] }),
  p("Toothpaste", "personal-care", "150 g", 11000, 9500, "🪥", { tags: ["toothpaste"] }),
  p("Hand Sanitizer", "personal-care", "200 ml", 15000, 11900, "🧴", { tags: ["sanitizer"], stockQty: 0 }),

  // Frozen Foods
  p("Frozen Green Peas", "frozen-foods", "500 g", 9000, 7500, "🫛", { isFeatured: true, tags: ["peas"] }),
  p("Veg Spring Rolls", "frozen-foods", "10 pcs", 20000, 16900, "🥟", { tags: ["spring roll"] }),
  p("French Fries", "frozen-foods", "420 g", 14000, 11500, "🍟", { isFeatured: true, tags: ["fries"] }),

  // Staples & Grains
  p("Basmati Rice", "staples-grains", "5 kg", 65000, 54900, "🍚", { isFeatured: true, tags: ["rice"] }),
  p("Whole Wheat Atta", "staples-grains", "5 kg", 32000, 27900, "🌾", { tags: ["atta", "flour"] }),
  p("Toor Dal", "staples-grains", "1 kg", 18000, 15900, "🫘", { isFeatured: true, tags: ["dal", "lentil"] }),
  p("Sunflower Oil", "staples-grains", "1 L", 16000, 13900, "🛢️", { tags: ["oil"] }),
];

// ─── Banners ───
export const BANNERS: Banner[] = [
  {
    id: "b1",
    title: "Fresh fruits, delivered fast",
    subtitle: "Up to 30% off on seasonal picks",
    emoji: "🍓",
    bg: "from-brand to-brand-dark",
    linkUrl: "/category/fruits-vegetables",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "b2",
    title: "Dairy essentials",
    subtitle: "Milk, eggs & more at your door",
    emoji: "🥛",
    bg: "from-sky-400 to-sky-600",
    linkUrl: "/category/dairy-eggs",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "b3",
    title: "Free delivery above ₹499",
    subtitle: "Stock up & save on delivery",
    emoji: "🚚",
    bg: "from-amber-400 to-orange-500",
    linkUrl: "/category/staples-grains",
    isActive: true,
    sortOrder: 3,
  },
];

// ─── Default app config (PRD AppConfig) ───
export const DEFAULT_CONFIG = {
  store_name: "QuickCart",
  store_phone: "+91 98765 43210",
  store_address: "12 MG Road, Bengaluru, Karnataka 560001",
  delivery_fee: 4900, // paise
  free_delivery_above: 49900, // paise
};

export const SERVICEABLE_PINCODES = ["560001", "560002", "560034", "110001", "400001", "500001"];

export const INDIA_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

// ─── Lookups ───
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
