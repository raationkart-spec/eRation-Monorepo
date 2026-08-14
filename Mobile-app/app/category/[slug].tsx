import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { ProductCard } from "../../components/ProductCard";
import { api } from "../../lib/api";
import type { Category, Product } from "../../lib/types";

export default function SingleCategoryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        const [catsRes, prodsRes] = await Promise.all([
          api.getCategories(),
          api.getProducts({ category: slug }),
        ]);
        const foundCat = catsRes.find((c) => c.slug === slug);
        if (foundCat) setCategory(foundCat);
        setProducts(prodsRes);
      } catch (e) {
        console.log("Error loading category products:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerEmoji}>{category?.emoji || "🥦"}</Text>
          <Text style={styles.headerTitle}>{category?.name || "Category"}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Showing {products.length} {products.length === 1 ? "product" : "products"}
            </Text>
          </View>

          <View style={styles.productGrid}>
            {products.map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
  backBtn: {
    padding: 4,
  },
  headerTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerEmoji: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  metaRow: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  gridItem: {
    width: "50%",
  },
});
