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
import { useRouter } from "expo-router";
import { Zap, Mail, ArrowRight } from "lucide-react-native";
import { api } from "../lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleContinue = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid email address (e.g. user@example.com)");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    const res = await api.sendOtp(cleanEmail);
    setLoading(false);

    if (res.success) {
      router.push({ pathname: "/verify", params: { email: cleanEmail } });
    } else {
      setErrorMsg(res.error || "Failed to send OTP. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandBox}>
          <View style={styles.logoCircle}>
            <Zap size={32} color="#ffffff" fill="#ffffff" />
          </View>
          <Text style={styles.brandTitle}>QuickCart</Text>
          <Text style={styles.brandTagline}>Groceries delivered in 10 minutes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Login or Sign Up</Text>
          <Text style={styles.cardSubtitle}>
            Enter your email to receive a 6-digit verification code
          </Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.inputWrapper}>
            <Mail size={18} color="#ea580c" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMsg) setErrorMsg("");
              }}
            />
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, loading && styles.disabledBtn]}
            onPress={handleContinue}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.continueBtnText}>SEND OTP</Text>
                <ArrowRight size={16} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to QuickCart's Terms of Service & Privacy Policy.
          </Text>
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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  brandBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ea580c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#0f172a",
  },
  brandTagline: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ea580c",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#fed7aa",
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  continueBtn: {
    backgroundColor: "#ea580c",
    borderRadius: 14,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  continueBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
  },
});
