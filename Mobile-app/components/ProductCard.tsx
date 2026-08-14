import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import type { Product } from "../lib/types";
import { discountPercent, formatMoney } from "../lib/format";
import { AddToCartButton } from "./AddToCartButton";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const discount = discountPercent(product.mrp, product.price);
  const lowStock = product.stockQty > 0 && product.stockQty <= product.lowStockThreshold;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => router.push(`/product/${product.slug}`)}
        activeOpacity={0.8}
      >
        {discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        ) : null}

        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <ShoppingBag size={34} color="#cbd5e1" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push(`/product/${product.slug}`)}
        activeOpacity={0.8}
      >
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.name}
        </Text>
      </TouchableOpacity>

      <Text style={styles.unitText}>{product.unit}</Text>

      {lowStock ? (
        <Text style={styles.lowStockText}>Only {product.stockQty} left in stock</Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{formatMoney(product.price)}</Text>
          {discount > 0 ? (
            <Text style={styles.mrpText}>{formatMoney(product.mrp)}</Text>
          ) : null}
        </View>

        <View style={styles.buttonWrapper}>
          <AddToCartButton product={product} size="sm" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 8,
    margin: 3,
    flex: 1,
  },
  imageContainer: {
    height: 95,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    marginBottom: 6,
  },
  discountBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#ea580c",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  discountText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
  productImage: {
    width: "85%",
    height: "85%",
  },
  productTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
    minHeight: 32,
    lineHeight: 16,
  },
  unitText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 1,
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#d97706",
    marginTop: 1,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 2,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  mrpText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  buttonWrapper: {
    minWidth: 62,
  },
});
