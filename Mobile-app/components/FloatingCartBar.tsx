import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { ShoppingBag, ArrowRight } from "lucide-react-native";
import { useCartStore } from "../store/useCartStore";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Product } from "../lib/types";

export function FloatingCartBar() {
  const router = useRouter();
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.getProducts();
        setProducts(res);
      } catch (e) {
        console.log("FloatingCartBar getProducts error:", e);
      }
    }
    if (items.length > 0) {
      loadProducts();
    }
  }, [items.length]);

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalItemPrice = items.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.productId);
    const price = item.overridePrice ?? (prod ? prod.price : 1000);
    return sum + price * item.quantity;
  }, 0);

  // Hide floating cart bar on cart, checkout, login, verify screens or when cart is empty
  const isHiddenRoute =
    pathname.includes("/cart") ||
    pathname.includes("/checkout") ||
    pathname.includes("/login") ||
    pathname.includes("/verify");

  if (totalCount === 0 || isHiddenRoute) {
    return null;
  }

  return (
    <View style={styles.floatingContainer} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.cartBar}
        onPress={() => router.push("/(tabs)/cart")}
        activeOpacity={0.9}
      >
        <View style={styles.leftSection}>
          <View style={styles.bagIconBox}>
            <ShoppingBag size={18} color="#ffffff" />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.badgeRow}>
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeText}>
                  {totalCount} {totalCount === 1 ? "ITEM" : "ITEMS"}
                </Text>
              </View>
              <Text style={styles.subText}>• 10-Min Delivery</Text>
            </View>

            <Text style={styles.priceText}>{formatMoney(totalItemPrice)}</Text>
          </View>
        </View>

        <View style={styles.viewCartButton}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <ArrowRight size={14} color="#15803d" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: 64,
    left: 12,
    right: 12,
    zIndex: 999,
    elevation: 10,
  },
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#15803d",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#052e16",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  bagIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    justifyContent: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subText: {
    color: "#dcfce7",
    fontSize: 10,
    fontWeight: "700",
  },
  priceText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 1,
  },
  viewCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  viewCartText: {
    color: "#15803d",
    fontSize: 12,
    fontWeight: "900",
  },
});
