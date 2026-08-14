import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Search as SearchIcon, X } from "lucide-react-native";

import { ProductCard } from "../components/ProductCard";
import { api } from "../lib/api";
import type { Product } from "../lib/types";

const RECENT_TAGS = ["Milk", "Bananas", "Apples", "Bread", "Eggs", "Chips", "Paneer"];

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getProducts({
          search: query.trim(),
          inStock: inStockOnly,
        });
        setProducts(res);
      } catch (e) {
        console.log("Search API error:", e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, inStockOnly]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <SearchIcon size={18} color="#ea580c" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search milk, eggs, bananas, bread..."
            placeholderTextColor="#94a3b8"
            autoFocus
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
              <X size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, inStockOnly && styles.filterChipActive]}
          onPress={() => setInStockOnly(!inStockOnly)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterText, inStockOnly && styles.filterTextActive]}>
            In Stock Only
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#ea580c" />
          <Text style={styles.loadingText}>Searching products...</Text>
        </View>
      ) : query.trim().length === 0 ? (
        <View style={styles.recentContainer}>
          <Text style={styles.sectionHeader}>Popular Searches</Text>
          <View style={styles.tagGrid}>
            {RECENT_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => setQuery(tag)}
                activeOpacity={0.8}
              >
                <SearchIcon size={12} color="#ea580c" />
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.resultsHeader}>
            Found {products.length} {products.length === 1 ? "result" : "results"} for "{query}"
          </Text>

          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySubtitle}>
                Try searching for something else like "apples", "milk", or "bread".
              </Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          )}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  clearBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
  },
  filterChipActive: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ea580c",
  },
  filterText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  filterTextActive: {
    color: "#ea580c",
  },
  loadingBox: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  recentContainer: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  resultsHeader: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
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
