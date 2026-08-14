import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { MapPin, MapPinOff } from "lucide-react-native";
import { useLocationStore } from "../store/useLocationStore";

interface Props {
  onOpenPincodeModal: () => void;
}

export function UnserviceableLocationView({ onOpenPincodeModal }: Props) {
  const { pincode, city } = useLocationStore();

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        {/* Clean Icon Badge */}
        <View style={styles.iconCircle}>
          <MapPinOff size={34} color="#ea580c" />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Sorry, currently not available at your location
        </Text>

        {/* Subtitle */}
        <Text style={styles.subText}>
          QuickCart is not delivering to <Text style={styles.boldPin}>{pincode}</Text> ({city}) yet. Please change your delivery location to continue.
        </Text>

        {/* Single Change Location Action */}
        <TouchableOpacity
          style={styles.changeLocationBtn}
          onPress={onOpenPincodeModal}
          activeOpacity={0.85}
        >
          <MapPin size={18} color="#ffffff" />
          <Text style={styles.btnText}>Change Delivery Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  contentWrapper: {
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#fff7ed",
    borderWidth: 1.5,
    borderColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 27,
    marginBottom: 10,
  },
  subText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  boldPin: {
    color: "#ea580c",
    fontWeight: "800",
  },
  changeLocationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ea580c",
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 24,
    width: "100%",
    gap: 8,
    shadowColor: "#ea580c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
});
