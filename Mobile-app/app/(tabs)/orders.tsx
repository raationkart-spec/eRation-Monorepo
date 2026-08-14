import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Package, ChevronRight, Clock } from "lucide-react-native";

import { useShopStore } from "../../store/useShopStore";
import { ORDER_STATUS_CONFIG, formatMoney, formatDate } from "../../lib/format";
import type { OrderStatus } from "../../lib/types";

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useShopStore((s) => s.orders);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED">("ALL");

  const filteredOrders = orders.filter((o) => {
    if (filter === "ACTIVE")
      return o.status !== "DELIVERED" && o.status !== "CANCELLED";
    if (filter === "DELIVERED") return o.status === "DELIVERED";
    if (filter === "CANCELLED") return o.status === "CANCELLED";
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Package size={20} color="#ea580c" />
        <Text style={styles.headerTitle}>Your Orders ({orders.length})</Text>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(["ALL", "ACTIVE", "DELIVERED", "CANCELLED"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Package size={40} color="#ea580c" />
          </View>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySubtitle}>
            When you place orders, they will appear here with live tracking.
          </Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/(tabs)")}
          >
            <Text style={styles.shopBtnText}>BROWSE PRODUCTS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {filteredOrders.map((order) => {
            const statusConfig = ORDER_STATUS_CONFIG[order.status as OrderStatus];
            const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order-details/${order.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
                    <Text style={[styles.statusText, { color: statusConfig.text }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.orderDetailsRow}>
                  <View>
                    <Text style={styles.itemsCount}>
                      {itemCount} {itemCount === 1 ? "Item" : "Items"}
                    </Text>
                    <Text style={styles.paymentMethodText}>Paid via {order.paymentMethod}</Text>
                  </View>

                  <View style={styles.totalWrapper}>
                    <Text style={styles.totalText}>{formatMoney(order.total)}</Text>
                    <ChevronRight size={16} color="#94a3b8" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
  },
  filterChipActive: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ea580c",
  },
  filterText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  filterTextActive: {
    color: "#ea580c",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  shopBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  shopBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderNum: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
  },
  orderDate: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "900",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 10,
  },
  orderDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemsCount: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  paymentMethodText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  totalWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ea580c",
  },
});
