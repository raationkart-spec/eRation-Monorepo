import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";

export default function VerifyScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const loginWithPhone = useAuthStore((s) => s.loginWithPhone);

  const [otp, setOtp] = useState("123456");
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMsg("Please enter a 6-digit OTP code");
      return;
    }

    loginWithPhone(phone || "+91 90000 00000", "QuickCart Shopper");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify OTP</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={32} color="#ea580c" />
          </View>

          <Text style={styles.cardTitle}>Enter Verification Code</Text>
          <Text style={styles.cardSub}>
            We sent a 6-digit OTP to +91 {phone || "9000000000"}
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TextInput
            style={styles.otpInput}
            placeholder="123456"
            placeholderTextColor="#cbd5e1"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/\D/g, ""))}
          />

          <Text style={styles.hintText}>Demo OTP: Any 6 digits work (e.g. 123456)</Text>

          <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify} activeOpacity={0.85}>
            <Text style={styles.verifyBtnText}>VERIFY & CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff7ed",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#fed7aa",
    alignItems: "center",
    elevation: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  cardSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  otpInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#ea580c",
    borderRadius: 14,
    width: "100%",
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: 8,
  },
  hintText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ea580c",
    marginTop: 8,
    marginBottom: 20,
  },
  verifyBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
