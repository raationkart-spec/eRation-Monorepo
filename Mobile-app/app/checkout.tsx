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
import { ArrowLeft, MapPin, CreditCard, ShieldCheck, Check } from "lucide-react-native";

import { useCartStore } from "../store/useCartStore";
import { useShopStore } from "../store/useShopStore";
import { useAuthStore } from "../store/useAuthStore";

import { BillSummary } from "../components/BillSummary";
import { Toast } from "../components/Toast";
import { api } from "../lib/api";
import { formatMoney } from "../lib/format";
import type { Product, PaymentMethod, Order } from "../lib/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);


  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const addresses = useShopStore((s) => s.addresses);
  const appliedCoupon = useShopStore((s) => s.appliedCoupon);
  const addOrder = useShopStore((s) => s.addOrder);
  const setAppliedCoupon = useShopStore((s) => s.setAppliedCoupon);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
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

    const def = addresses.find((a) => a.isDefault) || addresses[0];
    if (def) setSelectedAddressId(def.id);
  }, [addresses]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

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
    if (!selectedAddress) {
      setToastMessage("Please select a delivery address");
      return;
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
        name: selectedAddress.name,
        phone: selectedAddress.phone,
        line1: selectedAddress.line1,
        line2: selectedAddress.line2,
        landmark: selectedAddress.landmark,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
        label: selectedAddress.label,
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
      customerName: user?.name || selectedAddress.name || "Customer",
      customerPhone: user?.phone || selectedAddress.phone || "9000000000",
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
            <Text style={styles.cardTitle}>Select Delivery Address</Text>
          </View>

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
                    <Text style={styles.addrLabel}>{addr.label || "Home"}</Text>
                    <Text style={styles.addrDetail}>
                      {addr.line1}, {addr.city} - {addr.pincode}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
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
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 6,
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
