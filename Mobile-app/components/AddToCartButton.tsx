import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Plus, Minus } from "lucide-react-native";
import { useCartStore } from "../store/useCartStore";
import type { Product } from "../lib/types";

interface AddToCartButtonProps {
  product: Product;
  size?: "sm" | "md" | "lg";
}

export function AddToCartButton({ product, size = "md" }: AddToCartButtonProps) {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const add = useCartStore((s) => s.add);

  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stockQty <= 0;

  if (isOutOfStock) {
    return (
      <View style={[styles.outOfStockBadge, size === "sm" && styles.smHeight]}>
        <Text style={styles.outOfStockText}>NO STOCK</Text>
      </View>
    );
  }

  if (quantity === 0) {
    return (
      <TouchableOpacity
        style={[styles.addBtn, size === "sm" && styles.smHeight]}
        onPress={() => add(product.id)}
        activeOpacity={0.8}
      >
        <Text style={styles.addBtnText}>ADD</Text>
        <Plus size={14} color="#ea580c" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.stepperContainer, size === "sm" && styles.smHeight]}>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => setQty(product.id, quantity - 1)}
        activeOpacity={0.7}
      >
        <Minus size={14} color="#ffffff" />
      </TouchableOpacity>
      <Text style={styles.quantityText}>{quantity}</Text>
      <TouchableOpacity
        style={styles.stepperBtn}
        onPress={() => setQty(product.id, Math.min(20, quantity + 1))}
        activeOpacity={0.7}
      >
        <Plus size={14} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#ea580c",
    borderRadius: 10,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  addBtnText: {
    color: "#ea580c",
    fontSize: 12,
    fontWeight: "900",
  },
  stepperContainer: {
    backgroundColor: "#ea580c",
    borderRadius: 10,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    paddingHorizontal: 4,
  },
  outOfStockBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  outOfStockText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "800",
  },
  smHeight: {
    height: 28,
  },
});
