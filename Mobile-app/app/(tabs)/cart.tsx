import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShoppingBag, Tag, Trash2, ArrowRight } from "lucide-react-native";

import { useCartStore } from "../../store/useCartStore";
import { useShopStore } from "../../store/useShopStore";
import { BillSummary } from "../../components/BillSummary";
import { Toast } from "../../components/Toast";

import { api } from "../../lib/api";
import { formatMoney } from "../../lib/format";
import type { Product, Coupon } from "../../lib/types";

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);

  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);

  const appliedCoupon = useShopStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useShopStore((s) => s.setAppliedCoupon);

  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodsRes, couponsRes] = await Promise.all([
          api.getProducts(),
          api.getCoupons(),
        ]);
        setProducts(prodsRes);
        setCoupons(couponsRes);
      } catch (e) {
        console.log("Error loading cart metadata:", e);
      }
    }
    loadData();
  }, []);

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

  const handleApplyCoupon = () => {
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find((c) => c.code === code && c.isActive);
    if (!coupon) {
      setToastMessage("Invalid coupon code ❌");
      return;
    }

    if (itemTotal < coupon.minOrderValue) {
      setToastMessage(`Minimum order value for ${code} is ${formatMoney(coupon.minOrderValue)}`);
      return;
    }

    let discount = 0;
    if (coupon.discountType === "FLAT") {
      discount = coupon.discountValue;
    } else {
      discount = Math.round((itemTotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    setAppliedCoupon({ code: coupon.code, discount });
    setToastMessage(`Applied ${coupon.code}! You saved ${formatMoney(discount)} 🎉`);
    setCouponCodeInput("");
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={48} color="#ea580c" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Looks like you haven't added anything to your cart yet.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push("/(tabs)")}
            activeOpacity={0.8}
          >
            <Text style={styles.browseBtnText}>START SHOPPING</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const deliveryFee = 2900;
  const freeThreshold = 49900;
  const platformFee = 500;
  const isFreeDelivery = itemTotal >= freeThreshold;
  const grandTotal = Math.max(
    0,
    itemTotal + (isFreeDelivery ? 0 : deliveryFee) + platformFee - (appliedCoupon?.discount || 0)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: topPadding + 6 }]}>
        <View style={styles.headerTitleRow}>
          <ShoppingBag size={20} color="#ea580c" />
          <Text style={styles.headerTitle}>Shopping Cart ({items.length})</Text>
        </View>
        <TouchableOpacity onPress={clear} activeOpacity={0.7}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cart Item Cards */}
        <View style={styles.itemsCard}>
          {cartProductMap.map(({ item, product }) => {
            const price = item.overridePrice ?? product.price;
            return (
              <View key={product.id} style={styles.cartRow}>
                <View style={styles.itemImageWrapper}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.itemImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.itemEmoji}>{product.emoji || "🛍️"}</Text>
                  )}
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.itemUnit}>{product.unit}</Text>
                  <Text style={styles.itemPrice}>{formatMoney(price)}</Text>
                </View>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setQty(product.id, item.quantity - 1)}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityNum}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setQty(product.id, Math.min(20, item.quantity + 1))}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Coupons Box */}
        <View style={styles.couponCard}>
          <View style={styles.couponHeader}>
            <Tag size={16} color="#ea580c" />
            <Text style={styles.couponTitle}>Apply Coupon Code</Text>
          </View>

          {appliedCoupon ? (
            <View style={styles.appliedBanner}>
              <View>
                <Text style={styles.appliedCode}>{appliedCoupon.code} Applied!</Text>
                <Text style={styles.appliedSavings}>
                  Saved {formatMoney(appliedCoupon.discount)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAppliedCoupon(null)}>
                <Trash2 size={16} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Try WELCOME20 or QUICK50"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={couponCodeInput}
                onChangeText={setCouponCodeInput}
              />
              <TouchableOpacity style={styles.applyCouponBtn} onPress={handleApplyCoupon}>
                <Text style={styles.applyCouponBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}
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

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalBox}>
          <Text style={styles.totalTitle}>Grand Total</Text>
          <Text style={styles.totalValue}>{formatMoney(grandTotal)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push("/checkout")}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutBtnText}>CHECKOUT</Text>
          <ArrowRight size={16} color="#ffffff" />
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  browseBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  clearText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#dc2626",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },
  itemsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  itemImage: {
    width: "80%",
    height: "80%",
  },
  itemEmoji: {
    fontSize: 24,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  itemUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ea580c",
    marginTop: 2,
  },
  stepperBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ea580c",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  quantityNum: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 6,
  },
  couponCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginVertical: 8,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  couponTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  appliedBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 10,
    borderRadius: 10,
  },
  appliedCode: {
    fontSize: 12,
    fontWeight: "900",
    color: "#16a34a",
  },
  appliedSavings: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803d",
  },
  couponInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  applyCouponBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  applyCouponBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
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
  checkoutBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkoutBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
