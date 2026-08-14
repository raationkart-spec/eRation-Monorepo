import React from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { RotateCcw, ShoppingBag } from "lucide-react-native";
import type { Product } from "../lib/types";
import { formatMoney } from "../lib/format";
import { AddToCartButton } from "./AddToCartButton";

interface BuyItAgainProps {
  products: Product[];
}

export function BuyItAgain({ products }: BuyItAgainProps) {
  if (!products || products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <RotateCcw size={16} color="#ea580c" />
          <Text style={styles.title}>Buy It Again</Text>
        </View>
        <Text style={styles.subtitle}>Frequently Ordered</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {products.slice(0, 6).map((product) => (
          <View key={product.id} style={styles.itemCard}>
            <View style={styles.imageBox}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
              ) : (
                <ShoppingBag size={24} color="#cbd5e1" />
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.price}>{formatMoney(product.price)}</Text>
            <View style={styles.addWrapper}>
              <AddToCartButton product={product} size="sm" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: "#fff7ed",
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#c2410c",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  itemCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 8,
    width: 110,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  imageBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  image: {
    width: "80%",
    height: "80%",
  },
  name: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
  },
  price: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
    marginVertical: 4,
  },
  addWrapper: {
    width: "100%",
  },
});
