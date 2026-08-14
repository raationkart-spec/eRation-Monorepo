import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { CheckCircle2 } from "lucide-react-native";

interface ToastProps {
  message: string | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2200),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toastContainer, { opacity }]}>
      <CheckCircle2 size={18} color="#ffffff" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
});
