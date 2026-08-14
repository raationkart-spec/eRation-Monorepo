import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type { Category } from "../lib/types";

interface CategoryChipsProps {
  categories: Category[];
  selectedSlug?: string;
  onSelect?: (slug: string) => void;
}

export function CategoryChips({ categories, selectedSlug, onSelect }: CategoryChipsProps) {
  const router = useRouter();
  const activeCats = categories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activeCats.map((cat) => {
          const isSelected = selectedSlug === cat.slug;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => {
                if (onSelect) {
                  onSelect(cat.slug);
                } else {
                  router.push(`/category/${cat.slug}`);
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={[styles.name, isSelected && styles.nameSelected]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: "#fff7ed",
    borderColor: "#ea580c",
  },
  emoji: {
    fontSize: 14,
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  nameSelected: {
    color: "#c2410c",
    fontWeight: "900",
  },
});
