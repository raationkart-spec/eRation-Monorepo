import { BANNERS, CATEGORIES, DEFAULT_CONFIG, INITIAL_COUPONS, PRODUCTS, SERVICEABLE_PINCODES } from "./data";
import type { Banner, Category, Coupon, FlashDeal, Order, Product, StoreConfig } from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://quickcart-nu-nine.vercel.app";

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export const api = {
  /**
   * Fetch store configuration
   */
  async getConfig(): Promise<StoreConfig> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/config`);
      if (res.ok) {
        const data = await res.json();
        return data.config || DEFAULT_CONFIG;
      }
    } catch (e) {
      console.log("API config fetch fallback:", e);
    }
    return DEFAULT_CONFIG;
  },

  /**
   * Fetch categories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          return data.categories;
        }
      }
    } catch (e) {
      console.log("API categories fetch fallback:", e);
    }
    return CATEGORIES;
  },

  /**
   * Fetch promotional banners
   */
  async getBanners(): Promise<Banner[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/banners`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.banners) && data.banners.length > 0) {
          return data.banners;
        }
      }
    } catch (e) {
      console.log("API banners fetch fallback:", e);
    }
    return BANNERS;
  },

  /**
   * Fetch products with query filtering
   */
  async getProducts(params?: {
    category?: string;
    search?: string;
    featured?: boolean;
    inStock?: boolean;
    sort?: string;
  }): Promise<Product[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.append("category", params.category);
      if (params?.search) query.append("search", params.search);
      if (params?.featured) query.append("featured", "true");
      if (params?.inStock) query.append("inStock", "true");
      if (params?.sort) query.append("sort", params.sort);

      const url = `${API_BASE_URL}/api/products${query.toString() ? `?${query.toString()}` : ""}`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          return data.products;
        }
      }
    } catch (e) {
      console.log("API products fetch fallback:", e);
    }

    // Fallback search & filter logic
    let result = [...PRODUCTS];
    if (params?.category) {
      result = result.filter((p) => p.categorySlug === params.category);
    }
    if (params?.featured) {
      result = result.filter((p) => p.isFeatured);
    }
    if (params?.inStock) {
      result = result.filter((p) => p.stockQty > 0);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (params?.sort === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (params?.sort === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }
    return result;
  },

  /**
   * Fetch flash deals
   */
  async getFlashDeals(): Promise<FlashDeal[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/flash-deals`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.flashDeals)) return data.flashDeals;
      }
    } catch (e) {
      console.log("API flash deals fetch fallback:", e);
    }
    return [];
  },

  /**
   * Fetch active coupons
   */
  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/coupons`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coupons)) return data.coupons;
      }
    } catch (e) {
      console.log("API coupons fetch fallback:", e);
    }
    return INITIAL_COUPONS;
  },

  /**
   * Submit new order
   */
  async createOrder(payload: Partial<Order>): Promise<Order | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return data.order || null;
      }
    } catch (e) {
      console.log("API create order fallback:", e);
    }
    return null;
  },

  /**
   * Fetch order status details by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/orders?id=${orderId}`);
      if (res.ok) {
        const data = await res.json();
        return data.order || null;
      }
    } catch (e) {
      console.log("API order detail fetch error:", e);
    }
    return null;
  },
};
