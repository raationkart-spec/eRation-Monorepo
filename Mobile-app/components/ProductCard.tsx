import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
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
          <Text style={styles.emojiPlaceholder}>{product.emoji || "🛍️"}</Text>
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
    borderRadius: 16,
    padding: 10,
    flex: 1,
    margin: 4,
    minWidth: 150,
  },
  imageContainer: {
    height: 110,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  discountBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ea580c",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 2,
  },
  discountText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },
  productImage: {
    width: "85%",
    height: "85%",
  },
  emojiPlaceholder: {
    fontSize: 48,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
    minHeight: 34,
    lineHeight: 17,
  },
  unitText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 2,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#d97706",
    marginTop: 2,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 4,
  },
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  mrpText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  buttonWrapper: {
    width: 76,
  },
});
