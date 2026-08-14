import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";

import { Header } from "../../components/Header";
import { ProductCard } from "../../components/ProductCard";
import { PincodeModal } from "../../components/PincodeModal";
import { Toast } from "../../components/Toast";

import { api } from "../../lib/api";
import type { Category, Product } from "../../lib/types";

export default function CategoriesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");

  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          api.getCategories(),
          api.getProducts(),
        ]);
        setCategories(catsRes);
        setProducts(prodsRes);

        const activeCats = catsRes
          .filter((c) => c.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (activeCats.length > 0) {
          setSelectedCategorySlug(activeCats[0].slug);
        }
      } catch (e) {
        console.log("Error loading categories screen:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeCategories = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const selectedCategory = activeCategories.find((c) => c.slug === selectedCategorySlug);
  const filteredProducts = products.filter(
    (p) => p.categorySlug === selectedCategorySlug && p.isActive
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header onOpenLocationModal={() => setLocationModalVisible(true)} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <View style={styles.mainLayout}>
          {/* Left Category Sidebar */}
          <ScrollView
            style={styles.sidebar}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarContent}
          >
            {activeCategories.map((cat) => {
              const isSelected = cat.slug === selectedCategorySlug;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.sidebarItem, isSelected && styles.sidebarItemActive]}
                  onPress={() => setSelectedCategorySlug(cat.slug)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sidebarEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.sidebarText, isSelected && styles.sidebarTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Right Product Grid */}
          <View style={styles.productArea}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{selectedCategory?.name}</Text>
              <Text style={styles.itemCountText}>
                {filteredProducts.length} {filteredProducts.length === 1 ? "Item" : "Items"}
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContent}
            >
              <View style={styles.productGrid}>
                {filteredProducts.map((product) => (
                  <View key={product.id} style={styles.gridItem}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Pincode & Location Modal */}
      <PincodeModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onToast={(msg) => setToastMessage(msg)}
      />

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
  },
  mainLayout: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    width: 100,
    backgroundColor: "#f8fafc",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  sidebarContent: {
    paddingVertical: 8,
  },
  sidebarItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sidebarItemActive: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#ea580c",
  },
  sidebarEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  sidebarText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    textAlign: "center",
  },
  sidebarTextActive: {
    color: "#ea580c",
    fontWeight: "900",
  },
  productArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
  },
  gridContent: {
    padding: 8,
    paddingBottom: 24,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "50%",
  },
});
