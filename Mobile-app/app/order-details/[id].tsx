import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, MapPin, CreditCard, Ban } from "lucide-react-native";

import { useShopStore } from "../../store/useShopStore";
import { OrderStatusTimeline } from "../../components/OrderStatusTimeline";
import { Toast } from "../../components/Toast";
import { ORDER_STATUS_CONFIG, formatMoney, formatDate } from "../../lib/format";
import { api } from "../../lib/api";
import type { Order, OrderStatus } from "../../lib/types";

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const orders = useShopStore((s) => s.orders);
  const cancelOrderInStore = useShopStore((s) => s.cancelOrder);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      const local = orders.find((o) => o.id === id);
      if (local) {
        setOrder(local);
        setLoading(false);
        return;
      }
      try {
        const fetched = await api.getOrder(id);
        if (fetched) setOrder(fetched);
      } catch (e) {
        console.log("Error fetching order detail:", e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id, orders]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundBox}>
          <Text style={styles.notFoundText}>Order not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)/orders")}>
            <Text style={styles.backBtnText}>Go to Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];
  const canCancel = order.status === "PLACED";

  const handleCancelOrder = () => {
    cancelOrderInStore(order.id);
    setToastMessage("Order cancelled successfully");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtnPadding} onPress={() => router.push("/(tabs)/orders")}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
          <Text style={styles.headerSub}>{formatDate(order.createdAt)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Header Badge */}
        <View style={[styles.statusCard, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            STATUS: {statusConfig.label.toUpperCase()}
          </Text>
        </View>

        {/* Live Timeline */}
        <OrderStatusTimeline status={order.status} statusHistory={order.statusHistory} />

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={18} color="#ea580c" />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addrName}>{order.address.name} ({order.address.phone})</Text>
          <Text style={styles.addrText}>
            {order.address.line1}, {order.address.landmark ? `${order.address.landmark}, ` : ""}{order.address.city} - {order.address.pincode}
          </Text>
        </View>

        {/* Ordered Items List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items ({order.items.length})</Text>
          <View style={styles.itemsList}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemImageWrapper}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.itemEmoji}>{item.emoji || "📦"}</Text>
                  )}
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemUnit}>{item.unit} x {item.quantity}</Text>
                </View>

                <Text style={styles.itemSubtotal}>{formatMoney(item.subtotal)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment & Bill Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CreditCard size={18} color="#ea580c" />
            <Text style={styles.cardTitle}>Payment Details</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Method</Text>
            <Text style={styles.billValue}>{order.paymentMethod}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Status</Text>
            <Text style={styles.billValue}>{order.paymentStatus}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billValue}>{formatMoney(order.subtotal)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {order.deliveryFee === 0 ? "FREE" : formatMoney(order.deliveryFee)}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>{formatMoney(order.platformFee)}</Text>
          </View>

          {order.discount > 0 ? (
            <View style={styles.billRow}>
              <Text style={styles.discountLabel}>Coupon Discount ({order.couponCode})</Text>
              <Text style={styles.discountValue}>-{formatMoney(order.discount)}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatMoney(order.total)}</Text>
          </View>
        </View>

        {/* Self-Cancel Action */}
        {canCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancelOrder}
            activeOpacity={0.8}
          >
            <Ban size={16} color="#dc2626" />
            <Text style={styles.cancelBtnText}>CANCEL ORDER</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Toast message={toastMessage} onHide={() => setToastMessage(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  backBtn: {
    marginTop: 12,
    backgroundColor: "#ea580c",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
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
  backBtnPadding: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 11,
    color: "#94a3b8",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
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
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 8,
  },
  addrName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
  },
  addrText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  itemsList: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemImageWrapper: {
    width: 40,
    height: 40,
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
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
  },
  itemUnit: {
    fontSize: 10,
    color: "#94a3b8",
  },
  itemSubtotal: {
    fontSize: 13,
    fontWeight: "900",
    color: "#0f172a",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 3,
  },
  billLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  billValue: {
    fontSize: 12,
    color: "#0f172a",
    fontWeight: "800",
  },
  discountLabel: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "700",
  },
  discountValue: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 6,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#ea580c",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  cancelBtnText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
