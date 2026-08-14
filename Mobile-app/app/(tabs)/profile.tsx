import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { User, MapPin, Package, PhoneCall, LogOut, Plus, Check, Trash2 } from "lucide-react-native";

import { useAuthStore } from "../../store/useAuthStore";
import { useShopStore } from "../../store/useShopStore";
import { Toast } from "../../components/Toast";
import type { Address } from "../../lib/types";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const addresses = useShopStore((s) => s.addresses);
  const addAddress = useShopStore((s) => s.addAddress);
  const deleteAddress = useShopStore((s) => s.deleteAddress);
  const setDefaultAddress = useShopStore((s) => s.setDefaultAddress);

  const [modalVisible, setModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Address Form State
  const [label, setLabel] = useState("Home");
  const [name, setName] = useState(user?.name || "Demo Shopper");
  const [phone, setPhone] = useState(user?.phone || "9000000000");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("734001");

  const handleSaveAddress = () => {
    if (!line1 || !pincode) {
      setToastMessage("Please enter street address and pincode");
      return;
    }

    addAddress({
      label,
      name,
      phone,
      line1,
      landmark,
      city: "Siliguri",
      state: "West Bengal",
      pincode,
      isDefault: addresses.length === 0,
    });

    setToastMessage("Address added successfully! 🏡");
    setModalVisible(false);
    setLine1("");
    setLandmark("");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <User size={20} color="#ea580c" />
        <Text style={styles.headerTitle}>Account & Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : "Q"}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Demo Shopper"}</Text>
            <Text style={styles.userContact}>{user?.email || user?.phone || "+91 90000 00000"}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>CUSTOMER</Text>
            </View>
          </View>
        </View>

        {/* Saved Addresses Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <MapPin size={18} color="#ea580c" />
              <Text style={styles.sectionTitle}>Saved Delivery Addresses</Text>
            </View>
            <TouchableOpacity style={styles.addAddrBtn} onPress={() => setModalVisible(true)}>
              <Plus size={14} color="#ea580c" />
              <Text style={styles.addAddrText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {addresses.map((addr) => (
            <View key={addr.id} style={[styles.addrBox, addr.isDefault && styles.addrBoxDefault]}>
              <View style={styles.addrHeader}>
                <View style={styles.labelRow}>
                  <Text style={styles.addrLabel}>{addr.label || "Address"}</Text>
                  {addr.isDefault ? (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.addrActions}>
                  {!addr.isDefault ? (
                    <TouchableOpacity
                      onPress={() => setDefaultAddress(addr.id)}
                      style={styles.setDefBtn}
                    >
                      <Check size={14} color="#16a34a" />
                    </TouchableOpacity>
                  ) : null}

                  {addresses.length > 1 ? (
                    <TouchableOpacity onPress={() => deleteAddress(addr.id)}>
                      <Trash2 size={14} color="#dc2626" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <Text style={styles.addrName}>{addr.name} ({addr.phone})</Text>
              <Text style={styles.addrText}>
                {addr.line1}, {addr.landmark ? `${addr.landmark}, ` : ""}{addr.city} - {addr.pincode}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Links Section */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push("/(tabs)/orders")}
          >
            <Package size={18} color="#0f172a" />
            <Text style={styles.linkText}>Order History & Live Tracking</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.linkRow}>
            <PhoneCall size={18} color="#0f172a" />
            <Text style={styles.linkText}>Support: +91 90000 00000</Text>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout();
            router.push("/login");
          }}
          activeOpacity={0.8}
        >
          <LogOut size={16} color="#dc2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Delivery Address</Text>

            <TextInput
              style={styles.input}
              placeholder="Address Label (Home / Work)"
              value={label}
              onChangeText={setLabel}
            />

            <TextInput
              style={styles.input}
              placeholder="House No., Building / Street Name *"
              value={line1}
              onChangeText={setLine1}
            />

            <TextInput
              style={styles.input}
              placeholder="Landmark (Optional)"
              value={landmark}
              onChangeText={setLandmark}
            />

            <TextInput
              style={styles.input}
              placeholder="Pincode (e.g. 734001) *"
              keyboardType="number-pad"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAddress}>
                <Text style={styles.saveBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
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
    gap: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#ea580c",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  userContact: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ffedd5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#ea580c",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  addAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  addAddrText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#ea580c",
  },
  addrBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 8,
  },
  addrBoxDefault: {
    borderColor: "#ea580c",
    backgroundColor: "#fff7ed",
  },
  addrHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addrLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#0f172a",
  },
  defaultBadge: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
  },
  addrActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  setDefBtn: {
    padding: 2,
  },
  addrName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },
  addrText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 4,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "800",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#ea580c",
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});
