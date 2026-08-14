import React from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView, Image } from "react-native";
import { Zap } from "lucide-react-native";
import type { Banner } from "../lib/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const activeBanners = banners.filter((b) => b.isActive);

  if (activeBanners.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
      >
        {activeBanners.map((banner) => (
          <View key={banner.id} style={styles.slideWrapper}>
            <View style={styles.card}>
              {banner.imageUrl ? (
                <Image source={{ uri: banner.imageUrl }} style={styles.bgImage} resizeMode="cover" />
              ) : null}
              <View style={styles.overlay} />
              <View style={styles.textContent}>
                <View style={styles.badge}>
                  <Zap size={12} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.badgeText}>QUICKCART EXPRESS</Text>
                </View>
                <Text style={styles.title} numberOfLines={2}>
                  {banner.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {banner.subtitle}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: "100%",
  },
  slideWrapper: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: CARD_WIDTH,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#c2410c",
    justifyContent: "flex-end",
    position: "relative",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  textContent: {
    padding: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    marginBottom: 6,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 22,
  },
  subtitle: {
    color: "#f1f5f9",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
