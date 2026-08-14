import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, CreditCard, ShieldCheck, Check, Plus } from "lucide-react-native";

import { useCartStore } from "../store/useCartStore";
import { useShopStore } from "../store/useShopStore";
import { useAuthStore } from "../store/useAuthStore";

import { BillSummary } from "../components/BillSummary";
import { Toast } from "../components/Toast";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Product, PaymentMethod, Order, Address } from "../lib/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const addresses = useShopStore((s) => s.addresses);
  const addAddress = useShopStore((s) => s.addAddress);
  const appliedCoupon = useShopStore((s) => s.appliedCoupon);
  const addOrder = useShopStore((s) => s.addOrder);
  const setAppliedCoupon = useShopStore((s) => s.setAppliedCoupon);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // New Address Form State (empty by default)
  const [formName, setFormName] = useState(user?.name || "");
  const [formPhone, setFormPhone] = useState(user?.phone || "");
  const [formLine1, setFormLine1] = useState("");
  const [formLandmark, setFormLandmark] = useState("");
  const [formPincode, setFormPincode] = useState("734001");
  const [formLabel, setFormLabel] = useState("Home");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const prodsRes = await api.getProducts();
        setProducts(prodsRes);
      } catch (e) {
        console.log("Checkout products load error:", e);
      }
    }
    loadData();

    if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddressId(def.id);
      setShowNewAddressForm(false);
    } else {
      setShowNewAddressForm(true);
    }
  }, [addresses]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const cartProductMap = items
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;
      return { item, product: prod };
    })
    .filter(Boolean) as { item: (typeof items)[0]; product: Product }[];

  const itemTotal = cartProductMap.reduce((acc, { item, product }) => {
    const price = item.overridePrice ?? product.price;
    return acc + price * item.quantity;
  }, 0);

  const deliveryFee = 2900;
  const freeThreshold = 49900;
  const platformFee = 500;
  const isFreeDelivery = itemTotal >= freeThreshold;
  const actualDeliveryFee = isFreeDelivery ? 0 : deliveryFee;
  const grandTotal = Math.max(
    0,
    itemTotal + actualDeliveryFee + platformFee - (appliedCoupon?.discount || 0)
  );

  const handlePlaceOrder = async () => {
    let finalAddress: Omit<Address, "id"> | Address | undefined = selectedAddress;

    // Validate phone number and address if submitting new address or if no selected address
    if (showNewAddressForm || !finalAddress) {
      if (!formName.trim()) {
        setToastMessage("Please enter your full name");
        return;
      }
      if (!formPhone.trim() || formPhone.trim().length < 10) {
        setToastMessage("Phone number is compulsory (at least 10 digits)");
        return;
      }
      if (!formLine1.trim()) {
        setToastMessage("Please enter your delivery street address");
        return;
      }
      if (!formPincode.trim() || formPincode.trim().length < 6) {
        setToastMessage("Please enter a valid 6-digit pincode");
        return;
      }

      // Save the new address
      const newAddr = addAddress({
        label: formLabel || "Home",
        name: formName.trim(),
        phone: formPhone.trim(),
        line1: formLine1.trim(),
        landmark: formLandmark.trim(),
        city: "Siliguri",
        state: "West Bengal",
        pincode: formPincode.trim(),
        isDefault: addresses.length === 0,
      });

      finalAddress = newAddr;
      setSelectedAddressId(newAddr.id);
    } else {
      // Validating phone number on existing selected address
      if (!finalAddress.phone || finalAddress.phone.trim().length < 10) {
        setToastMessage("Phone number is compulsory (at least 10 digits)");
        return;
      }
    }

    setPlacing(true);

    const orderItems = cartProductMap.map(({ item, product }) => {
      const price = item.overridePrice ?? product.price;
      return {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        emoji: product.emoji || "📦",
        imageUrl: product.imageUrl,
        price,
        mrp: product.mrp,
        quantity: item.quantity,
        subtotal: price * item.quantity,
      };
    });

    const newOrderNumber = "QC" + Math.floor(100000 + Math.random() * 900000);
    const nowIso = new Date().toISOString();

    const orderPayload: Order = {
      id: "ord_" + Date.now(),
      orderNumber: newOrderNumber,
      items: orderItems,
      address: {
        name: finalAddress.name,
        phone: finalAddress.phone,
        line1: finalAddress.line1,
        line2: finalAddress.line2 || "",
        landmark: finalAddress.landmark || "",
        city: finalAddress.city,
        state: finalAddress.state,
        pincode: finalAddress.pincode,
        label: finalAddress.label,
      },
      status: "PLACED",
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PENDING" : "COLLECTED",
      subtotal: itemTotal,
      deliveryFee: actualDeliveryFee,
      platformFee,
      discount: appliedCoupon?.discount || 0,
      couponCode: appliedCoupon?.code,
      total: grandTotal,
      notes,
      createdAt: nowIso,
      statusHistory: [
        {
          status: "PLACED",
          note: "Order received by QuickCart",
          at: nowIso,
        },
      ],
      customerName: user?.name || finalAddress.name || "Customer",
      customerPhone: user?.phone || finalAddress.phone || "",
    };

    try {
      await api.createOrder(orderPayload);
    } catch (e) {
      console.log("Create order API error, using local state:", e);
    }

    addOrder(orderPayload);
    clearCart();
    setAppliedCoupon(null);
    setPlacing(false);

    router.replace(`/order-details/${orderPayload.id}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: topPadding + 6 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Address Selection Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={18} color="#ea580c" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>

          {addresses.length > 0 && !showNewAddressForm ? (
            <View>
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.addrBox, isSelected && styles.addrBoxSelected]}
                    onPress={() => setSelectedAddressId(addr.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.addrRow}>
                      <View style={[styles.radio, isSelected && styles.radioSelected]}>
                        {isSelected ? <Check size={12} color="#ffffff" /> : null}
                      </View>
                      <View style={styles.addrTextWrapper}>
                        <Text style={styles.addrLabel}>{addr.label || "Home"} - {addr.name}</Text>
                        <Text style={styles.addrDetail}>
                          {addr.line1}, {addr.city} - {addr.pincode}
                        </Text>
                        <Text style={styles.addrPhone}>Phone: {addr.phone}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={styles.addAddrBtn}
                onPress={() => setShowNewAddressForm(true)}
              >
                <Plus size={14} color="#ea580c" />
                <Text style={styles.addAddrText}>Add Another Delivery Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={styles.formSectionSubtitle}>
                Please enter your delivery details. All fields marked with * are compulsory.
              </Text>

              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#94a3b8"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.inputLabel}>Phone Number (Compulsory) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={formPhone}
                onChangeText={setFormPhone}
              />

              <Text style={styles.inputLabel}>House No. / Building / Street Address *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 142 Hill Cart Road, Pradhan Nagar"
                placeholderTextColor="#94a3b8"
                value={formLine1}
                onChangeText={setFormLine1}
              />

              <Text style={styles.inputLabel}>Landmark (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Near Air View Complex"
                placeholderTextColor="#94a3b8"
                value={formLandmark}
                onChangeText={setFormLandmark}
              />

              <Text style={styles.inputLabel}>Pincode *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 734001"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={6}
                value={formPincode}
                onChangeText={setFormPincode}
              />

              {addresses.length > 0 ? (
                <TouchableOpacity
                  style={styles.cancelAddrBtn}
                  onPress={() => setShowNewAddressForm(false)}
                >
                  <Text style={styles.cancelAddrText}>Cancel & Use Saved Address</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        {/* Payment Method Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={18} color="#ea580c" />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.payOption, paymentMethod === "COD" && styles.payOptionActive]}
            onPress={() => setPaymentMethod("COD")}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, paymentMethod === "COD" && styles.radioSelected]}>
              {paymentMethod === "COD" ? <Check size={12} color="#ffffff" /> : null}
            </View>
            <View>
              <Text style={styles.payOptionTitle}>Cash on Delivery (COD)</Text>
              <Text style={styles.payOptionSub}>Pay cash/UPI at doorstep</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payOption, paymentMethod === "UPI" && styles.payOptionActive]}
            onPress={() => setPaymentMethod("UPI")}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, paymentMethod === "UPI" && styles.radioSelected]}>
              {paymentMethod === "UPI" ? <Check size={12} color="#ffffff" /> : null}
            </View>
            <View>
              <Text style={styles.payOptionTitle}>UPI Instant Payment (Demo)</Text>
              <Text style={styles.payOptionSub}>Google Pay, PhonePe, Paytm</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Delivery Note */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Delivery Instructions (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="e.g. Leave package at gate, ring doorbell"
            placeholderTextColor="#94a3b8"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Bill Summary */}
        <BillSummary
          items={items}
          products={products}
          appliedDiscount={appliedCoupon?.discount || 0}
          deliveryFee={deliveryFee}
          freeDeliveryThreshold={freeThreshold}
          platformFee={platformFee}
        />
      </ScrollView>

      {/* Place Order Sticky Footer */}
      <View style={styles.bottomBar}>
        <View style={styles.totalBox}>
          <Text style={styles.totalTitle}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatMoney(grandTotal)}</Text>
        </View>

        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.85}
        >
          {placing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <ShieldCheck size={18} color="#ffffff" />
          )}
          <Text style={styles.placeOrderBtnText}>
            {placing ? "PLACING ORDER..." : "PLACE ORDER"}
          </Text>
        </TouchableOpacity>
      </View>

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
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  addrBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    marginBottom: 8,
  },
  addrBoxSelected: {
    backgroundColor: "#fff7ed",
    borderColor: "#ea580c",
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: "#ea580c",
    backgroundColor: "#ea580c",
  },
  addrTextWrapper: {
    flex: 1,
  },
  addrLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  addrDetail: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  addrPhone: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ea580c",
    marginTop: 2,
  },
  addAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#ea580c",
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    marginTop: 4,
  },
  addAddrText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ea580c",
  },
  formContainer: {
    gap: 6,
  },
  formSectionSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    marginTop: 4,
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  cancelAddrBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  cancelAddrText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  payOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  payOptionActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#ea580c",
  },
  payOptionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  payOptionSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },
  noteInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: "#0f172a",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalBox: {},
  totalTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#ea580c",
  },
  placeOrderBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeOrderBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
