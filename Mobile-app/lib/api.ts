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
   * Fetch categories with automatic deduplication by name
   */
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/categories`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const seenNames = new Set<string>();
          const uniqueCats: Category[] = [];

          for (const cat of data.categories) {
            const normName = cat.name.trim().toLowerCase();
            if (!seenNames.has(normName)) {
              seenNames.add(normName);
              uniqueCats.push(cat);
            }
          }
          return uniqueCats;
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
   * Fetch products
   */
  async getProducts(params?: { category?: string; search?: string; inStock?: boolean }): Promise<Product[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) {
        let catSlug = params.category;
        if (catSlug === "fruits-veg") catSlug = "fruits-vegetables";
        query.append("category", catSlug);
      }
      if (params?.search) query.append("search", params.search);
      if (params?.inStock) query.append("inStock", "true");

      const url = `${API_BASE_URL}/api/products?${query.toString()}`;
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          return data.products;
        }
      }
    } catch (e) {
      console.log("API products fetch fallback:", e);
    }

    let result = PRODUCTS;
    if (params?.category) {
      const targetSlug = params.category === "fruits-veg" ? "fruits-vegetables" : params.category;
      result = result.filter((p) => p.categorySlug === targetSlug);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
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
        if (Array.isArray(data.deals)) {
          return data.deals;
        }
      }
    } catch (e) {
      console.log("API flash deals fetch fallback:", e);
    }
    const allProds = PRODUCTS;
    return [
      { id: "fd1", productId: "p1", salePrice: 3900, isActive: true, product: allProds[0], startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-12-31T23:59:59.000Z" },
      { id: "fd2", productId: "p2", salePrice: 11900, isActive: true, product: allProds[1], startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-12-31T23:59:59.000Z" },
      { id: "fd3", productId: "p3", salePrice: 2800, isActive: true, product: allProds[2], startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-12-31T23:59:59.000Z" },
    ];
  },

  /**
   * Fetch active coupons
   */
  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/coupons`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.coupons) && data.coupons.length > 0) {
          return data.coupons;
        }
      }
    } catch (e) {
      console.log("API coupons fetch fallback:", e);
    }
    return INITIAL_COUPONS;
  },

  /**
   * Send OTP for Email / Phone authentication
   */
  async sendOtp(email: string): Promise<{ success: boolean; message?: string; devOtp?: string; error?: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/otp`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, message: data.message, devOtp: data.devOtp };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || errData.message || "Failed to send OTP", message: errData.message };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error sending OTP", message: e.message };
    }
  },

  /**
   * Verify OTP
   */
  async verifyOtp(email: string, code: string): Promise<{ success: boolean; token?: string; user?: any; error?: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, token: data.token, user: data.user };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || errData.message || "Invalid OTP code" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error verifying OTP" };
    }
  },

  /**
   * Create an order
   */
  async createOrder(orderPayload: Partial<Order>): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const data = await res.json();
        return { success: true, orderId: data.orderId || data.id };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || errData.error || "Failed to place order" };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error. Please try again." };
    }
  },

  /**
   * Check order status by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        return data.order || data;
      }
    } catch (e) {
      console.log("API getOrder fallback:", e);
    }
    return null;
  },

  /**
   * Validate pincode serviceability
   */
  checkPincode(pincode: string): boolean {
    return SERVICEABLE_PINCODES.includes(pincode);
  },
};
