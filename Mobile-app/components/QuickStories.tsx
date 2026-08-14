import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import {
  X,
  ArrowRight,
  Zap,
  Apple,
  Flame,
  Coffee,
  Sparkles,
  Milk,
} from "lucide-react-native";

interface Story {
  id: string;
  title: string;
  IconComponent: React.ComponentType<{ size: number; color: string; fill?: string }>;
  bg: string;
  bannerTitle: string;
  bannerSub: string;
  categorySlug?: string;
  imageUrl: string;
}

const STORIES: Story[] = [
  {
    id: "s1",
    title: "10m Delivery",
    IconComponent: Zap,
    bg: "#ea580c",
    bannerTitle: "10-Minute Express Delivery",
    bannerSub: "Superfast grocery delivery across all active Siliguri areas!",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "s2",
    title: "Farm Fresh",
    IconComponent: Apple,
    bg: "#16a34a",
    bannerTitle: "Fresh Farm Greens & Organic Fruits",
    bannerSub: "Picked fresh daily from local farms around North Bengal.",
    categorySlug: "fruits-vegetables",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "s3",
    title: "Super Deals",
    IconComponent: Flame,
    bg: "#dc2626",
    bannerTitle: "Mega Savings & Lightning Flash Deals",
    bannerSub: "Up to 50% OFF on daily kitchen essentials & snacks.",
    categorySlug: "staples-grains",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "s4",
    title: "Breakfast",
    IconComponent: Coffee,
    bg: "#ca8a04",
    bannerTitle: "Morning Fresh Breads & Pastries",
    bannerSub: "Warm artisanal breads, cookies & morning breakfast items.",
    categorySlug: "bakery-breads",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "s5",
    title: "Snack Time",
    IconComponent: Sparkles,
    bg: "#9333ea",
    bannerTitle: "Chips, Beverages & Munchies",
    bannerSub: "Chilled juices, sodas, and crunchy snacks for your break.",
    categorySlug: "snacks-beverages",
    imageUrl: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "s6",
    title: "Daily Milk",
    IconComponent: Milk,
    bg: "#2563eb",
    bannerTitle: "Fresh Dairy & Farm Eggs",
    bannerSub: "Pure pouch milk, fresh paneer, curd & organic eggs.",
    categorySlug: "dairy-eggs",
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&auto=format&fit=crop&q=80",
  },
];

export function QuickStories() {
  const router = useRouter();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const handleOpenStory = (story: Story) => {
    setSelectedStory(story);
  };

  const handleAction = () => {
    if (!selectedStory) return;
    const cat = selectedStory.categorySlug;
    setSelectedStory(null);
    if (cat) {
      router.push(`/category/${cat}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {STORIES.map((story) => {
          const Icon = story.IconComponent;
          return (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              onPress={() => handleOpenStory(story)}
              activeOpacity={0.8}
            >
              <View style={[styles.avatarRing, { borderColor: story.bg }]}>
                <View style={[styles.avatarInner, { backgroundColor: story.bg }]}>
                  <Icon size={22} color="#ffffff" />
                </View>
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {story.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Story Popup Modal */}
      <Modal visible={selectedStory !== null} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          {selectedStory ? (
            <View style={styles.storyCard}>
              <Image source={{ uri: selectedStory.imageUrl }} style={styles.storyImage} />
              <View style={styles.storyGradient} />

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedStory(null)}>
                <X size={20} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.storyContent}>
                <View style={[styles.storyBadge, { backgroundColor: selectedStory.bg }]}>
                  {React.createElement(selectedStory.IconComponent, { size: 14, color: "#ffffff" })}
                  <Text style={styles.storyBadgeText}>{selectedStory.title.toUpperCase()}</Text>
                </View>

                <Text style={styles.bannerTitle}>{selectedStory.bannerTitle}</Text>
                <Text style={styles.bannerSub}>{selectedStory.bannerSub}</Text>

                <TouchableOpacity style={styles.actionBtn} onPress={handleAction} activeOpacity={0.85}>
                  <Text style={styles.actionBtnText}>EXPLORE NOW</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
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
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
    marginTop: 4,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 13, 22, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  storyCard: {
    width: "100%",
    height: 440,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    position: "relative",
    justifyContent: "flex-end",
  },
  storyImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  storyGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  storyContent: {
    padding: 24,
  },
  storyBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
    marginBottom: 10,
  },
  storyBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 28,
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 13,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ea580c",
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
