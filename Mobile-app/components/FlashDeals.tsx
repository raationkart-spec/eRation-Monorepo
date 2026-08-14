import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Flame, Clock } from "lucide-react-native";
import type { FlashDeal } from "../lib/types";
import { ProductCard } from "./ProductCard";

interface FlashDealsProps {
  deals: FlashDeal[];
}

export function FlashDeals({ deals }: FlashDealsProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!deals || deals.length === 0) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Flame size={20} color="#dc2626" fill="#fca5a5" />
          <Text style={styles.title}>Flash Deals</Text>
        </View>

        <View style={styles.timerBadge}>
          <Clock size={12} color="#dc2626" />
          <Text style={styles.timerText}>
            Ends in {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
          </Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {deals.map((deal) => {
          // If deal has associated product object, render it with special deal price
          const product = deal.product ? { ...deal.product, price: deal.salePrice } : null;
          if (!product) return null;
          return (
            <View key={deal.id} style={styles.cardWrapper}>
              <ProductCard product={product} />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#991b1b",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  timerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#dc2626",
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  cardWrapper: {
    width: 165,
  },
});
