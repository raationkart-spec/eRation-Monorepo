import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, RefreshCw } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../lib/api";

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const loginWithBackend = useAuthStore((s) => s.loginWithBackend);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      setErrorMsg("Please enter the 6-digit OTP code");
      return;
    }

    setErrorMsg("");
    setLoading(true);

    const res = await api.verifyOtp(email || "", otp.trim());
    setLoading(false);

    if (res.success && res.user) {
      loginWithBackend(res.user);
      router.replace("/(tabs)");
    } else {
      setErrorMsg(res.error || "Invalid or expired OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setInfoMsg("");
    setErrorMsg("");

    const res = await api.sendOtp(email);
    setResending(false);

    if (res.success) {
      setInfoMsg(`A new OTP has been sent to ${email}`);
    } else {
      setErrorMsg(res.error || "Failed to resend OTP.");
    }
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
            We sent a 6-digit verification code to{"\n"}
            <Text style={{ fontWeight: "800", color: "#0f172a" }}>{email || "your email"}</Text>
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {infoMsg ? <Text style={styles.infoText}>{infoMsg}</Text> : null}

          <TextInput
            style={styles.otpInput}
            placeholder="123456"
            placeholderTextColor="#cbd5e1"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, ""));
              if (errorMsg) setErrorMsg("");
            }}
          />

          <TouchableOpacity
            style={[styles.verifyBtn, loading && styles.disabledBtn]}
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.verifyBtnText}>VERIFY & CONTINUE</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resending}
            activeOpacity={0.7}
          >
            {resending ? (
              <ActivityIndicator color="#ea580c" size="small" />
            ) : (
              <View style={styles.resendRow}>
                <RefreshCw size={14} color="#ea580c" />
                <Text style={styles.resendText}>Resend OTP Email</Text>
              </View>
            )}
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
    lineHeight: 18,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
    width: "100%",
    textAlign: "center",
  },
  infoText: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    backgroundColor: "#f0fdf4",
    padding: 8,
    borderRadius: 8,
    width: "100%",
    textAlign: "center",
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
    marginBottom: 16,
  },
  verifyBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  resendBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resendText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ea580c",
  },
});
