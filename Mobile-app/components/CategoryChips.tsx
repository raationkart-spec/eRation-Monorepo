import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
  Apple,
  Milk,
  Coffee,
  Sparkles,
  Package,
  Snowflake,
  Wheat,
  LayoutGrid,
} from "lucide-react-native";
import type { Category } from "../lib/types";

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
          const IconComp = CATEGORY_ICON_MAP[cat.slug] || Apple;
          const iconColor = isSelected ? "#c2410c" : "#ea580c";

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
              <IconComp size={15} color={iconColor} />
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
