import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

const STORIES = [
  { id: "s1", title: "10m Delivery", emoji: "⚡", bg: "#ea580c" },
  { id: "s2", title: "Farm Fresh", emoji: "🥦", bg: "#16a34a" },
  { id: "s3", title: "Super Deals", emoji: "🔥", bg: "#dc2626" },
  { id: "s4", title: "Breakfast", emoji: "🍞", bg: "#ca8a04" },
  { id: "s5", title: "Snack Time", emoji: "🍿", bg: "#9333ea" },
  { id: "s6", title: "Daily Milk", emoji: "🥛", bg: "#2563eb" },
];

export function QuickStories() {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {STORIES.map((story) => (
          <TouchableOpacity key={story.id} style={styles.storyItem} activeOpacity={0.8}>
            <View style={[styles.avatarRing, { borderColor: story.bg }]}>
              <View style={[styles.avatarInner, { backgroundColor: story.bg }]}>
                <Text style={styles.emoji}>{story.emoji}</Text>
              </View>
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {story.title}
            </Text>
          </TouchableOpacity>
        ))}
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
    gap: 12,
  },
  storyItem: {
    alignItems: "center",
    width: 64,
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
    marginTop: 4,
    textAlign: "center",
  },
});
