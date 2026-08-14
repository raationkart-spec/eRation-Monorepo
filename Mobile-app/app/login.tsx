import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Zap, Phone, Chrome } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";

export default function LoginScreen() {
  const router = useRouter();
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleContinue = () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    setErrorMsg("");
    router.push({ pathname: "/verify", params: { phone } });
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
    router.replace("/(tabs)");
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

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.inputWrapper}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(text) => setPhone(text.replace(/\D/g, ""))}
            />
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.continueBtnText}>CONTINUE</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.85}>
            <Chrome size={18} color="#ea580c" />
            <Text style={styles.googleBtnText}>One-Tap Google Demo Login</Text>
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
    marginBottom: 30,
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
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
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
  prefix: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0f172a",
    marginRight: 8,
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
  continueBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    height: 48,
    gap: 8,
  },
  googleBtnText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800",
  },
  termsText: {
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 16,
  },
});
