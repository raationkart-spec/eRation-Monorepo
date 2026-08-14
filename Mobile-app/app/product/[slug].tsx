import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ShieldCheck, Truck, RefreshCw } from "lucide-react-native";

import { AddToCartButton } from "../../components/AddToCartButton";
import { ProductCard } from "../../components/ProductCard";
import { api } from "../../lib/api";
import { discountPercent, formatMoney } from "../../lib/format";
import type { Product } from "../../lib/types";

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);


  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        const allProducts = await api.getProducts();
        const found = allProducts.find((p) => p.slug === slug);
        if (found) {
          setProduct(found);
          const related = allProducts.filter(
            (p) => p.categorySlug === found.categorySlug && p.id !== found.id
          );
          setRelatedProducts(related);
        }
      } catch (e) {
        console.log("Error loading product details:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundText}>Product not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const discount = discountPercent(product.mrp, product.price);
  const savings = Math.max(0, product.mrp - product.price);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: topPadding + 6 }]}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Product Image Section */}
        <View style={styles.imageContainer}>
          {discount > 0 ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          ) : null}

          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.mainImage} resizeMode="contain" />
          ) : (
            <Text style={styles.mainEmoji}>{product.emoji || "🛍️"}</Text>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.productTitle}>{product.name}</Text>
          <Text style={styles.unitText}>{product.unit}</Text>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatMoney(product.price)}</Text>
              {discount > 0 ? (
                <Text style={styles.mrpText}>{formatMoney(product.mrp)}</Text>
              ) : null}
            </View>

            {savings > 0 ? (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>You Save {formatMoney(savings)}</Text>
              </View>
            ) : null}
          </View>

          {/* Add to Cart Bar */}
          <View style={styles.addBar}>
            <Text style={styles.addBarLabel}>Select Quantity</Text>
            <View style={styles.stepperWrapper}>
              <AddToCartButton product={product} size="md" />
            </View>
          </View>
        </View>

        {/* Trust Badges */}
        <View style={styles.trustCard}>
          <View style={styles.trustItem}>
            <Truck size={18} color="#ea580c" />
            <Text style={styles.trustText}>10-Min Superfast Delivery</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <ShieldCheck size={18} color="#16a34a" />
            <Text style={styles.trustText}>100% Quality Guaranteed</Text>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionHeader}>Product Details</Text>
          <Text style={styles.descriptionText}>
            {product.description ||
              `Fresh, high-quality ${product.name} delivered directly to your doorstep in 10 minutes. Sourced daily from trusted suppliers.`}
          </Text>
        </View>

        {/* Related Products Section */}
        {relatedProducts.length > 0 ? (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionHeader}>You Might Also Like</Text>
            <View style={styles.relatedGrid}>
              {relatedProducts.slice(0, 4).map((rel) => (
                <View key={rel.id} style={styles.gridItem}>
                  <ProductCard product={rel} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: "#ea580c",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  imageContainer: {
    height: 220,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  discountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#ea580c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  discountText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  mainImage: {
    width: "80%",
    height: "80%",
  },
  mainEmoji: {
    fontSize: 80,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginBottom: 12,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  unitText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  mrpText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#94a3b8",
    textDecorationLine: "line-through",
  },
  savingsBadge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "900",
  },
  addBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  addBarLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  stepperWrapper: {
    width: 100,
  },
  trustCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffedd5",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#c2410c",
  },
  trustDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#fed7aa",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },
  relatedSection: {
    marginTop: 8,
  },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  gridItem: {
    width: "50%",
  },
});
