import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";

import { Header } from "../../components/Header";
import { PincodeModal } from "../../components/PincodeModal";
import { BannerCarousel } from "../../components/BannerCarousel";
import { CategoryChips } from "../../components/CategoryChips";
import { QuickStories } from "../../components/QuickStories";
import { BuyItAgain } from "../../components/BuyItAgain";
import { FlashDeals } from "../../components/FlashDeals";
import { ChefsChoiceBundle } from "../../components/ChefsChoiceBundle";
import { ProductCard } from "../../components/ProductCard";
import { Toast } from "../../components/Toast";

import { api } from "../../lib/api";
import type { Banner, Category, FlashDeal, Product } from "../../lib/types";

export default function HomeScreen() {
  const router = useRouter();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashDeals, setFlashDeals] = useState<FlashDeal[]>([]);

  const loadData = async () => {
    try {
      const [catsRes, bannersRes, prodsRes, dealsRes] = await Promise.all([
        api.getCategories(),
        api.getBanners(),
        api.getProducts({ inStock: false }),
        api.getFlashDeals(),
      ]);
      setCategories(catsRes);
      setBanners(bannersRes);
      setProducts(prodsRes);
      setFlashDeals(dealsRes);
    } catch (e) {
      console.log("Error loading homepage data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Group products by category
  const categorySections = activeCategories.map((cat) => ({
    category: cat,
    products: products.filter(
      (p) => p.categorySlug === cat.slug && p.isActive
    ),
  })).filter((s) => s.products.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onOpenLocationModal={() => setLocationModalVisible(true)} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loadingText}>Fetching fresh groceries...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ea580c"]} />
          }
        >
          {/* Quick Stories */}
          <QuickStories />

          {/* Promotional Banners */}
          <BannerCarousel banners={banners} />

          {/* Category Chips Bar */}
          <CategoryChips categories={categories} />

          {/* Buy It Again */}
          <BuyItAgain products={products} />

          {/* Flash Deals */}
          {flashDeals.length > 0 ? <FlashDeals deals={flashDeals} /> : null}

          {/* Chef's Choice Bundles */}
          <ChefsChoiceBundle />

          {/* Category Sections */}
          {categorySections.map((section) => (
            <View key={section.category.id} style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleWrapper}>
                  <Text style={styles.sectionEmoji}>{section.category.emoji}</Text>
                  <Text style={styles.sectionTitle}>{section.category.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => router.push(`/category/${section.category.slug}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>SEE ALL</Text>
                  <ChevronRight size={14} color="#ea580c" />
                </TouchableOpacity>
              </View>

              <View style={styles.productGrid}>
                {section.products.slice(0, 6).map((product) => (
                  <View key={product.id} style={styles.gridItem}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Pincode & Location Modal */}
      <PincodeModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onToast={(msg) => setToastMessage(msg)}
      />

      {/* Toast Host */}
      <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionEmoji: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ea580c",
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
