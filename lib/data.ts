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
export const PRODUCTS: Product[] = [
  // Fruits & Vegetables
  p("Fresh Bananas", "fruits-vegetables", "6 pcs", 6000, 4900, "🍌", "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["banana", "fruit"] }),
  p("Red Apples", "fruits-vegetables", "1 kg", 18000, 14900, "🍎", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["apple", "fruit"] }),
  p("Tomatoes", "fruits-vegetables", "500 g", 4000, 2900, "🍅", "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["tomato", "vegetable"] }),
  p("Baby Spinach", "fruits-vegetables", "250 g", 3500, 2500, "🥬", "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&auto=format&fit=crop&q=80", { tags: ["spinach", "greens"] }),
  p("Carrots", "fruits-vegetables", "500 g", 4500, 3500, "🥕", "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["carrot"] }),
  p("Fresh Broccoli", "fruits-vegetables", "1 pc", 8000, 5900, "🥦", "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=500&auto=format&fit=crop&q=80", { tags: ["broccoli"] }),
  p("Alphonso Mangoes", "fruits-vegetables", "1 kg", 40000, 34900, "🥭", "https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["mango"] }),
  p("Green Grapes", "fruits-vegetables", "500 g", 9000, 6900, "🍇", "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80", { tags: ["grapes"] }),
  p("Lemons", "fruits-vegetables", "4 pcs", 3000, 2400, "🍋", "https://images.unsplash.com/photo-1534531141161-e4ea2720d200?w=500&auto=format&fit=crop&q=80", { tags: ["lemon"] }),
  p("Potatoes", "fruits-vegetables", "1 kg", 4000, 3200, "🥔", "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80", { tags: ["potato"], stockQty: 3 }),

  // Dairy & Eggs
  p("Amul Full Cream Milk", "dairy-eggs", "1 L", 7200, 6800, "🥛", "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80", { isFeatured: true, brand: "Amul", tags: ["milk"] }),
  p("Farm Eggs", "dairy-eggs", "6 pcs", 6500, 5400, "🥚", "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["eggs"] }),
  p("Amul Butter", "dairy-eggs", "100 g", 5800, 5500, "🧈", "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80", { brand: "Amul", tags: ["butter"] }),
  p("Cheese Slices", "dairy-eggs", "200 g", 14500, 12900, "🧀", "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=500&auto=format&fit=crop&q=80", { tags: ["cheese"] }),
  p("Greek Yogurt", "dairy-eggs", "400 g", 9000, 7500, "🍶", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["yogurt", "curd"] }),
  p("Paneer", "dairy-eggs", "200 g", 9500, 8500, "🧀", "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80", { tags: ["paneer"], stockQty: 4 }),

  // Bakery & Breads
  p("Whole Wheat Bread", "bakery-breads", "400 g", 5500, 4500, "🍞", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["bread"] }),
  p("Butter Croissant", "bakery-breads", "2 pcs", 12000, 9900, "🥐", "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=80", { tags: ["croissant"] }),
  p("Multigrain Bagel", "bakery-breads", "4 pcs", 14000, 11900, "🥯", "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?w=500&auto=format&fit=crop&q=80", { tags: ["bagel"] }),
  p("Chocolate Muffin", "bakery-breads", "2 pcs", 10000, 8500, "🧁", "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["muffin"] }),

  // Snacks & Beverages
  p("Potato Chips Classic", "snacks-beverages", "90 g", 5000, 4000, "🥔", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["chips"] }),
  p("Cola Soft Drink", "snacks-beverages", "750 ml", 4500, 4000, "🥤", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80", { tags: ["cola", "drink"] }),
  p("Dark Chocolate Bar", "snacks-beverages", "80 g", 15000, 12500, "🍫", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["chocolate"] }),
  p("Salted Popcorn", "snacks-beverages", "70 g", 4000, 3500, "🍿", "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500&auto=format&fit=crop&q=80", { tags: ["popcorn"] }),
  p("Orange Juice", "snacks-beverages", "1 L", 12000, 9900, "🧃", "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["juice"] }),
  p("Roasted Almonds", "snacks-beverages", "200 g", 32000, 27900, "🥜", "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=500&auto=format&fit=crop&q=80", { tags: ["almonds", "nuts"] }),

  // Household & Cleaning
  p("Dishwash Liquid", "household-cleaning", "500 ml", 12000, 9900, "🧽", "https://images.unsplash.com/photo-1585421514738-01798e348b17?w=500&auto=format&fit=crop&q=80", { tags: ["dishwash"] }),
  p("Floor Cleaner", "household-cleaning", "1 L", 18000, 14900, "🧴", "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["cleaner"] }),
  p("Garbage Bags", "household-cleaning", "30 pcs", 15000, 11900, "🗑️", "https://images.unsplash.com/photo-1610141160723-d2d346e73766?w=500&auto=format&fit=crop&q=80", { tags: ["bags"] }),
  p("Laundry Detergent", "household-cleaning", "1 kg", 22000, 18900, "🧺", "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=500&auto=format&fit=crop&q=80", { tags: ["detergent"] }),

  // Personal Care
  p("Herbal Shampoo", "personal-care", "340 ml", 34000, 28900, "🧴", "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["shampoo"] }),
  p("Bath Soap Pack", "personal-care", "4 x 100 g", 16000, 13500, "🧼", "https://images.unsplash.com/photo-1607006482172-23c7c2514eb5?w=500&auto=format&fit=crop&q=80", { tags: ["soap"] }),
  p("Toothpaste", "personal-care", "150 g", 11000, 9500, "🪥", "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500&auto=format&fit=crop&q=80", { tags: ["toothpaste"] }),
  p("Hand Sanitizer", "personal-care", "200 ml", 15000, 11900, "🧴", "https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=500&auto=format&fit=crop&q=80", { tags: ["sanitizer"], stockQty: 0 }),

  // Frozen Foods
  p("Frozen Green Peas", "frozen-foods", "500 g", 9000, 7500, "🫛", "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["peas"] }),
  p("Veg Spring Rolls", "frozen-foods", "10 pcs", 20000, 16900, "🥟", "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80", { tags: ["spring roll"] }),
  p("French Fries", "frozen-foods", "420 g", 14000, 11500, "🍟", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["fries"] }),

  // Staples & Grains
  p("Basmati Rice", "staples-grains", "5 kg", 65000, 54900, "🍚", "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["rice"] }),
  p("Whole Wheat Atta", "staples-grains", "5 kg", 32000, 27900, "🌾", "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80", { tags: ["atta", "flour"] }),
  p("Toor Dal", "staples-grains", "1 kg", 18000, 15900, "🫘", "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=500&auto=format&fit=crop&q=80", { isFeatured: true, tags: ["dal", "lentil"] }),
  p("Sunflower Oil", "staples-grains", "1 L", 16000, 13900, "🛢️", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80", { tags: ["oil"] }),
];

// ─── Banners ───
export const BANNERS: Banner[] = [
  {
    id: "b1",
    title: "Fresh Vegetables & Fruits",
    subtitle: "Flat 20% Off — Morning Fresh Picked",
    emoji: "🥦",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1000&auto=format&fit=crop&q=80",
    bg: "from-orange-500 to-amber-600",
    linkUrl: "/category/fruits-vegetables",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "b2",
    title: "Dairy Essentials & Milk",
    subtitle: "Farm fresh milk, eggs & butter delivered in 10 mins",
    emoji: "🥛",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=1000&auto=format&fit=crop&q=80",
    bg: "from-sky-500 to-blue-600",
    linkUrl: "/category/dairy-eggs",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "b3",
    title: "Free Delivery Above ₹499",
    subtitle: "Stock up on kitchen staples & household grains",
    emoji: "🚚",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1000&auto=format&fit=crop&q=80",
    bg: "from-emerald-500 to-teal-700",
    linkUrl: "/category/staples-grains",
    isActive: true,
    sortOrder: 3,
  },
];

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
