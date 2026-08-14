import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { X, Crosshair } from "lucide-react-native";
import { useLocationStore } from "../store/useLocationStore";

const SILIGURI_PINCODES = [
  { pin: "734001", area: "Hill Cart Road, Siliguri" },
  { pin: "734003", area: "Hakim Para, Siliguri" },
  { pin: "734004", area: "Deshbandhu Para, Siliguri" },
  { pin: "734005", area: "Pradhan Nagar, Siliguri" },
  { pin: "734006", area: "Sevoke Road, Siliguri" },
  { pin: "734008", area: "Matigara, Siliguri" },
];

interface PincodeModalProps {
  visible: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function PincodeModal({ visible, onClose, onToast }: PincodeModalProps) {
  const { pincode, setPincode, detectLocation, isDetecting } = useLocationStore();
  const [inputPin, setInputPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAutoDetect = async () => {
    setErrorMsg("");
    const res = await detectLocation();
    if (res) {
      onToast(`Location set to ${res.pincode} (${res.city}) 🎉`);
      onClose();
    } else {
      setErrorMsg("Unable to detect location automatically. Please select below.");
    }
  };

  const handleApply = () => {
    const pin = inputPin.trim();
    if (!/^\d{6}$/.test(pin)) {
      setErrorMsg("Please enter a valid 6-digit pincode");
      return;
    }
    const match = SILIGURI_PINCODES.find((s) => s.pin === pin);
    const areaName = match ? match.area : "Siliguri Area";
    setPincode(pin, areaName);
    onToast(`Pincode set to ${pin} 👍`);
    setInputPin("");
    setErrorMsg("");
    onClose();
  };

  const handleSelectArea = (pin: string, area: string) => {
    setPincode(pin, area);
    onToast(`Pincode set to ${pin} (${area})`);
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Delivery Location</Text>
              <Text style={styles.subtitle}>Delivered All Across Siliguri</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity
              style={styles.detectBtn}
              onPress={handleAutoDetect}
              disabled={isDetecting}
              activeOpacity={0.8}
            >
              {isDetecting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Crosshair size={18} color="#ffffff" />
              )}
              <Text style={styles.detectBtnText}>
                {isDetecting ? "Detecting Location..." : "Auto-Detect Current Location"}
              </Text>
            </TouchableOpacity>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>OR ENTER PINCODE</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                value={inputPin}
                onChangeText={(text) => setInputPin(text.replace(/\D/g, ""))}
              />
              <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Siliguri Service Areas</Text>
            <View style={styles.areaGrid}>
              {SILIGURI_PINCODES.map((item) => (
                <TouchableOpacity
                  key={item.pin}
                  style={[
                    styles.areaCard,
                    pincode === item.pin && styles.areaCardActive,
                  ]}
                  onPress={() => handleSelectArea(item.pin, item.area)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.areaPin}>{item.pin}</Text>
                  <Text style={styles.areaName} numberOfLines={1}>
                    {item.area}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  detectBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  detectBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  applyBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  applyBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  areaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaCard: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 10,
  },
  areaCardActive: {
    borderColor: "#ea580c",
    backgroundColor: "#fff7ed",
  },
  areaPin: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  areaName: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
});
