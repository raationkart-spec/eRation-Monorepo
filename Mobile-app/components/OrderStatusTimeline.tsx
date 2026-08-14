import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckCircle2, Clock, Truck, Package, XCircle } from "lucide-react-native";
import type { OrderStatus, OrderStatusEvent } from "../lib/types";
import { ORDER_STATUS_CONFIG, formatDate } from "../lib/format";

interface OrderStatusTimelineProps {
  status: OrderStatus;
  statusHistory?: OrderStatusEvent[];
}

const STEPS: { key: OrderStatus; title: string; desc: string; icon: any }[] = [
  { key: "PLACED", title: "Order Placed", desc: "Received by QuickCart store", icon: Clock },
  { key: "CONFIRMED", title: "Order Confirmed", desc: "Accepted by store manager", icon: CheckCircle2 },
  { key: "PACKED", title: "Packed", desc: "Items packed in eco bag", icon: Package },
  { key: "OUT_FOR_DELIVERY", title: "Out for Delivery", desc: "Delivery partner assigned", icon: Truck },
  { key: "DELIVERED", title: "Delivered", desc: "Handed to customer", icon: CheckCircle2 },
];

export function OrderStatusTimeline({ status, statusHistory = [] }: OrderStatusTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <View style={[styles.container, styles.cancelledContainer]}>
        <XCircle size={24} color="#dc2626" />
        <View style={styles.textWrapper}>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>
          <Text style={styles.cancelledDesc}>This order was cancelled.</Text>
        </View>
      </View>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>

      <View style={styles.timeline}>
        {STEPS.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;
          const historyItem = statusHistory.find((h) => h.status === step.key);

          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={styles.leftCol}>
                <View
                  style={[
                    styles.iconCircle,
                    isDone && styles.iconCircleDone,
                    isCurrent && styles.iconCircleCurrent,
                  ]}
                >
                  <Icon
                    size={14}
                    color={isDone ? "#ffffff" : "#94a3b8"}
                  />
                </View>
                {idx < STEPS.length - 1 ? (
                  <View
                    style={[
                      styles.connectorLine,
                      idx < currentIndex && styles.connectorLineDone,
                    ]}
                  />
                ) : null}
              </View>

              <View style={styles.rightCol}>
                <Text style={[styles.stepTitle, isDone && styles.stepTitleDone]}>
                  {step.title}
                </Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
                {historyItem ? (
                  <Text style={styles.timeText}>{formatDate(historyItem.at)}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    marginVertical: 8,
  },
  cancelledContainer: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textWrapper: {
    flex: 1,
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#991b1b",
  },
  cancelledDesc: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 52,
  },
  leftCol: {
    alignItems: "center",
    marginRight: 12,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  iconCircleDone: {
    backgroundColor: "#ea580c",
  },
  iconCircleCurrent: {
    backgroundColor: "#c2410c",
    borderWidth: 3,
    borderColor: "#ffedd5",
  },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#e2e8f0",
    marginVertical: 2,
  },
  connectorLineDone: {
    backgroundColor: "#ea580c",
  },
  rightCol: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  stepTitleDone: {
    color: "#0f172a",
    fontWeight: "900",
  },
  stepDesc: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },
  timeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ea580c",
    marginTop: 2,
  },
});
