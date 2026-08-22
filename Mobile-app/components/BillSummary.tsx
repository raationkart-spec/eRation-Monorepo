import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Truck, CheckCircle2 } from "lucide-react-native";
import { formatMoney } from "../lib/format";
import type { CartItem, Product } from "../lib/types";

interface BillSummaryProps {
  items: CartItem[];
  products: Product[];
  appliedDiscount?: number;
  appliedTokenDiscount?: number;
  appliedTokens?: number;
  deliveryFee?: number;
  freeDeliveryThreshold?: number;
  platformFee?: number;
}

export function BillSummary({
  items,
  products,
  appliedDiscount = 0,
  appliedTokenDiscount = 0,
  appliedTokens = 0,
  deliveryFee = 3900, // ₹39
  freeDeliveryThreshold = 39900, // ₹399
  platformFee = 500, // ₹5
}: BillSummaryProps) {
  const itemTotal = items.reduce((acc, item) => {
    const prod = products.find((p) => p.id === item.productId);
    const price = item.overridePrice ?? prod?.price ?? 0;
    return acc + price * item.quantity;
  }, 0);

  const isFreeDelivery = itemTotal >= freeDeliveryThreshold;
  const actualDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const progressPercent = Math.min(100, Math.round((itemTotal / freeDeliveryThreshold) * 100));
  const remainingForFree = Math.max(0, freeDeliveryThreshold - itemTotal);

  const grandTotal = Math.max(
    0,
    itemTotal + actualDeliveryFee + platformFee - appliedDiscount - appliedTokenDiscount
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Bill Details</Text>

      {/* Free Delivery Nudge */}
      <View style={styles.nudgeBox}>
        <View style={styles.nudgeHeader}>
          <Truck size={16} color={isFreeDelivery ? "#16a34a" : "#ea580c"} />
          <Text style={[styles.nudgeText, isFreeDelivery && styles.freeText]}>
            {isFreeDelivery
              ? "🎉 You unlocked FREE Delivery!"
              : `Add ${formatMoney(remainingForFree)} more for FREE Delivery`}
          </Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Item Total</Text>
        <Text style={styles.value}>{formatMoney(itemTotal)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Delivery Fee</Text>
        <Text style={[styles.value, isFreeDelivery && styles.freeText]}>
          {isFreeDelivery ? "FREE" : formatMoney(deliveryFee)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Handling & Platform Fee</Text>
        <Text style={styles.value}>{formatMoney(platformFee)}</Text>
      </View>

      {appliedDiscount > 0 ? (
        <View style={styles.row}>
          <Text style={styles.discountLabel}>Coupon Savings</Text>
          <Text style={styles.discountValue}>-{formatMoney(appliedDiscount)}</Text>
        </View>
      ) : null}

      {appliedTokenDiscount > 0 ? (
        <View style={styles.row}>
          <Text style={styles.tokenDiscountLabel}>QuickCoins ({appliedTokens} coins)</Text>
          <Text style={styles.tokenDiscountValue}>-{formatMoney(appliedTokenDiscount)}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>To Pay</Text>
        <Text style={styles.totalValue}>{formatMoney(grandTotal)}</Text>
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
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },
  nudgeBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ffedd5",
  },
  nudgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  nudgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ea580c",
  },
  freeText: {
    color: "#16a34a",
    fontWeight: "900",
  },
  progressBg: {
    height: 6,
    backgroundColor: "#ffedd5",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ea580c",
    borderRadius: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  value: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "800",
  },
  discountLabel: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "700",
  },
  discountValue: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "900",
  },
  tokenDiscountLabel: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "700",
  },
  tokenDiscountValue: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ea580c",
  },
});
