import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native";
import { Utensils } from "lucide-react-native";
import type { Bundle } from "../lib/types";
import { formatMoney } from "../lib/format";
import { useCartStore } from "../store/useCartStore";
import { api } from "../lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// Exactly 2 cards fit side-by-side with equal margins without getting cut off
const BUNDLE_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 56) / 2);

interface ChefsChoiceBundleProps {
  bundles?: Bundle[];
}

export function ChefsChoiceBundle({ bundles: initialBundles }: ChefsChoiceBundleProps) {
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const [bundles, setBundles] = useState<Bundle[]>(initialBundles || []);

  useEffect(() => {
    if (initialBundles && initialBundles.length > 0) {
      setBundles(initialBundles);
      return;
    }
    async function loadBundles() {
      try {
        const res = await api.getBundles();
        setBundles(res);
      } catch (e) {
        console.log("Error loading bundles in ChefsChoiceBundle:", e);
      }
    }
    loadBundles();
  }, [initialBundles]);

  if (!bundles || bundles.length === 0) {
    return null;
  }

  const handleAddBundle = (bundle: Bundle) => {
    if (!bundle.items || bundle.items.length === 0) return;

    const originalTotal = bundle.items.reduce(
      (sum, i) => sum + (i.product?.price ?? 0) * i.quantity,
      0
    );
    const ratio = originalTotal > 0 ? bundle.price / originalTotal : 1;

    let cumulativeDiscountedPriceSum = 0;
    bundle.items.forEach((item, index) => {
      let discountedUnitPrice = Math.round((item.product?.price ?? 0) * ratio);
      if (index === bundle.items.length - 1) {
        const previousTotal = cumulativeDiscountedPriceSum;
        discountedUnitPrice = Math.max(0, Math.floor((bundle.price - previousTotal) / item.quantity));
      }
      cumulativeDiscountedPriceSum += discountedUnitPrice * item.quantity;

      const existingItem = items.find((i) => i.productId === item.productId);
      const existingQty = existingItem?.quantity ?? 0;
      setQty(item.productId, existingQty + item.quantity, item.product, discountedUnitPrice);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Utensils size={16} color="#0284c7" />
          <Text style={styles.title}>Chef's Choice Bundles</Text>
        </View>
        <Text style={styles.subtitle}>Curated Meal Kits</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {bundles.map((bundle) => (
          <View key={bundle.id} style={styles.bundleCard}>
            <View style={styles.imageWrapper}>
              {bundle.imageUrl ? (
                <Image source={{ uri: bundle.imageUrl }} style={styles.image} resizeMode="cover" />
              ) : null}
              {bundle.tag ? (
                <View style={styles.tagBadge}>
                  <Text style={styles.tagText}>{bundle.tag}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.bundleName} numberOfLines={1}>
                {bundle.name}
              </Text>
              <Text style={styles.bundleDesc} numberOfLines={2}>
                {bundle.description}
              </Text>

              <View style={styles.actionRow}>
                <Text style={styles.price}>{formatMoney(bundle.price)}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => handleAddBundle(bundle)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: "#f0f9ff",
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginHorizontal: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0369a1",
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0284c7",
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  bundleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    width: BUNDLE_CARD_WIDTH,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  imageWrapper: {
    height: 90,
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  tagBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#0284c7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
  infoBox: {
    padding: 8,
  },
  bundleName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0f172a",
  },
  bundleDesc: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 13,
    minHeight: 26,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  price: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  addBtn: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
});
