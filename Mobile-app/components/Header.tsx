import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, ChevronDown, Search, User } from "lucide-react-native";
import { useLocationStore } from "../store/useLocationStore";

interface HeaderProps {
  onOpenLocationModal: () => void;
  showSearch?: boolean;
}

export function Header({ onOpenLocationModal, showSearch = true }: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pincode, city } = useLocationStore();

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);

  return (
    <View style={[styles.container, { paddingTop: topPadding + 6 }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={onOpenLocationModal}
          activeOpacity={0.8}
        >
          <View style={styles.pinIconWrapper}>
            <MapPin size={18} color="#ea580c" />
          </View>
          <View style={styles.locationTextWrapper}>
            <View style={styles.pincodeRow}>
              <Text style={styles.pincodeText} numberOfLines={1}>
                {pincode} · {city}
              </Text>
              <ChevronDown size={14} color="#ea580c" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.actionsRow}>
          {showSearch && (
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => router.push("/search")}
              activeOpacity={0.8}
            >
              <Search size={18} color="#ea580c" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.8}
          >
            <User size={19} color="#ea580c" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTextWrapper: {
    justifyContent: "center",
  },
  pincodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pincodeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    maxWidth: 200,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
});
