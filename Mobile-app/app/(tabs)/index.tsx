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
import {
  ChevronRight,
  Apple,
  Milk,
  Coffee,
  Sparkles,
  Package,
  Snowflake,
  Wheat,
  LayoutGrid,
} from "lucide-react-native";

import { Header } from "../../components/Header";
import { PincodeModal } from "../../components/PincodeModal";
import { BannerCarousel } from "../../components/BannerCarousel";
import { CategoryChips } from "../../components/CategoryChips";
import { QuickStories } from "../../components/QuickStories";
import { BuyItAgain } from "../../components/BuyItAgain";
import { FlashDeals } from "../../components/FlashDeals";
import { ChefsChoiceBundle } from "../../components/ChefsChoiceBundle";
import { ProductCard } from "../../components/ProductCard";
import { UnserviceableLocationView } from "../../components/UnserviceableLocationView";
import { Toast } from "../../components/Toast";

import { useLocationStore } from "../../store/useLocationStore";
import { api } from "../../lib/api";
import type { Banner, Category, FlashDeal, Product } from "../../lib/types";

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  "fruits-vegetables": Apple,
  "fruits-veg": Apple,
  "dairy-eggs": Milk,
  "dairy": Milk,
  "bakery-breads": Coffee,
  "bakery": Coffee,
  "snacks-beverages": Sparkles,
  "snacks": Sparkles,
  "household-cleaning": Package,
  "household": Package,
  "personal-care": Sparkles,
  "frozen-foods": Snowflake,
  "staples-grains": Wheat,
  "staples": Wheat,
};

export default function HomeScreen() {
  const router = useRouter();
  const { isServiceable, initLocationOnAppLaunch } = useLocationStore();

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
    // Only detect location once when user initially opens the app
    initLocationOnAppLaunch();
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // Refresh products data without resetting location
    loadData();
  };

  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Group products by category
  const categorySections = activeCategories.map((cat) => ({
    category: cat,
    products: products.filter(
      (p) => (p.categorySlug === cat.slug || (cat.slug === "fruits-vegetables" && p.categorySlug === "fruits-veg")) && p.isActive
    ),
  })).filter((s) => s.products.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onOpenLocationModal={() => setLocationModalVisible(true)} />

      {!isServiceable ? (
        <UnserviceableLocationView
          onOpenPincodeModal={() => setLocationModalVisible(true)}
        />
      ) : loading ? (
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
          {categorySections.map((section) => {
            const IconComp = CATEGORY_ICON_MAP[section.category.slug] || Apple;
            return (
              <View key={section.category.id} style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleWrapper}>
                    <IconComp size={18} color="#ea580c" />
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
            );
          })}
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
