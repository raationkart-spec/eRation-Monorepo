import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { Utensils } from "lucide-react-native";
import type { Bundle } from "../lib/types";
import { formatMoney } from "../lib/format";
import { useCartStore } from "../store/useCartStore";

interface ChefsChoiceBundleProps {
  bundles?: Bundle[];
}

export function ChefsChoiceBundle({ bundles }: ChefsChoiceBundleProps) {
  const add = useCartStore((s) => s.add);

  const defaultBundles: Bundle[] = [
    {
      id: "b1",
      name: "Super Breakfast Kit",
      description: "1L Amul Milk + 6 Eggs + Whole Wheat Bread",
      tag: "SAVE 15%",
      price: 15500, // ₹155
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
      items: [],
    },
    {
      id: "b2",
      name: "Curry Essentials Combo",
      description: "1kg Tomatoes + 1kg Potatoes + Fresh Spinach",
      tag: "BEST SELLER",
      price: 7900, // ₹79
      isActive: true,
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80",
      items: [],
    },
  ];

  const list = bundles && bundles.length > 0 ? bundles : defaultBundles;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Utensils size={18} color="#0284c7" />
          <Text style={styles.title}>Chef's Choice Bundles</Text>
        </View>
        <Text style={styles.subtitle}>Curated Meal Kits</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {list.map((bundle) => (
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
              <Text style={styles.bundleName}>{bundle.name}</Text>
              <Text style={styles.bundleDesc} numberOfLines={2}>
                {bundle.description}
              </Text>

              <View style={styles.actionRow}>
                <Text style={styles.price}>{formatMoney(bundle.price)}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => add("p4", undefined, bundle.price, bundle.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addBtnText}>ADD BUNDLE</Text>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0369a1",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  bundleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    width: 220,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0f2fe",
  },
  imageWrapper: {
    height: 100,
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
    fontSize: 9,
    fontWeight: "900",
  },
  infoBox: {
    padding: 10,
  },
  bundleName: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  bundleDesc: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  addBtn: {
    backgroundColor: "#0284c7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
});
