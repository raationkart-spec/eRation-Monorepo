import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Zap, ChevronDown, Search, User } from "lucide-react-native";
import { useLocationStore } from "../store/useLocationStore";

interface HeaderProps {
  onOpenLocationModal: () => void;
  showSearch?: boolean;
}

export function Header({ onOpenLocationModal, showSearch = true }: HeaderProps) {
  const router = useRouter();
  const { pincode, city } = useLocationStore();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.locationButton}
          onPress={onOpenLocationModal}
          activeOpacity={0.8}
        >
          <View style={styles.zapIconWrapper}>
            <Zap size={18} color="#ea580c" fill="#ffedd5" />
          </View>
          <View style={styles.locationTextWrapper}>
            <Text style={styles.deliveryTimeText}>10 mins</Text>
            <View style={styles.pincodeRow}>
              <Text style={styles.pincodeText} numberOfLines={1}>
                {pincode} · {city}
              </Text>
              <ChevronDown size={13} color="#64748b" />
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
  zapIconWrapper: {
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
    alignItems: "flex-start",
  },
  deliveryTimeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
    lineHeight: 18,
  },
  pincodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pincodeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    maxWidth: 160,
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
