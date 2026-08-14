import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ArrowRight, RefreshCw } from "lucide-react-native";
import { useAuthStore } from "../store/useAuthStore";
import { api } from "../lib/api";

export default function VerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email } = useLocalSearchParams<{ email: string }>();
  const loginWithBackend = useAuthStore((s) => s.loginWithBackend);

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(45);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleDigitChange = (index: number, text: string) => {
    const clean = text.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = clean;
    setDigits(updated);
    if (error) setError("");

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (updated.every((d) => d !== "") && updated.join("").length === 6) {
      submitCode(updated.join(""));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (code: string) => {
    if (!/^\d{6}$/.test(code) || verifying) return;

    setVerifying(true);
    setError("");

    const res = await api.verifyOtp(email || "", code);
    setVerifying(false);

    if (res.success && res.user) {
      loginWithBackend(res.user);
      router.replace("/(tabs)");
    } else {
      setError(res.error || "Invalid or expired OTP code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;
    setSeconds(45);
    setError("");
    await api.sendOtp(email);
  };

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Hero Section */}
          <View style={styles.heroHeader}>
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
              }}
              style={styles.heroBg}
              resizeMode="cover"
            >
              <View style={styles.heroOverlay} />

              <View style={[styles.navRow, { paddingTop: topPadding + 6 }]}>
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backButton}
                  activeOpacity={0.8}
                >
                  <ChevronLeft size={22} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.brandTitle}>QuickCart</Text>
                <View style={{ width: 40 }} />
              </View>
            </ImageBackground>
          </View>

          {/* Verification Card */}
          <View style={styles.bottomCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Verify your Email</Text>
              <Text style={styles.cardSubtitle}>
                Enter 6-digit code sent to{"\n"}
                <Text style={styles.emailHighlight}>{email || "your email"}</Text>
              </Text>
            </View>

            {/* 6 Digit Code Inputs */}
            <View style={styles.digitsRow}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  style={[
                    styles.digitBox,
                    digit !== "" && styles.digitBoxFilled,
                    error ? styles.digitBoxError : null,
                  ]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(i, text)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              disabled={verifying}
              onPress={() => submitCode(digits.join(""))}
              style={[styles.verifyBtn, verifying && styles.disabledBtn]}
              activeOpacity={0.85}
            >
              {verifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.verifyBtnText}>Verify & Continue</Text>
                  <ArrowRight size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.resendWrapper}>
              {seconds > 0 ? (
                <Text style={styles.resendSubText}>
                  Resend code in <Text style={styles.countdownText}>{seconds}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} style={styles.resendBtnRow}>
                  <RefreshCw size={14} color="#f97316" />
                  <Text style={styles.resendLinkText}>Resend OTP Code</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.demoHintText}>
              Check spam folder if email isn't in inbox. Demo code{" "}
              <Text style={styles.codeBadge}>123456</Text> also works.
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
  },
  heroHeader: {
    height: 180,
    width: "100%",
  },
  heroBg: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
  },
  bottomCard: {
    flex: 1,
    marginTop: -20,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "center",
    elevation: 8,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 19,
  },
  emailHighlight: {
    fontWeight: "900",
    color: "#0f172a",
  },
  digitsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    marginBottom: 16,
  },
  digitBox: {
    width: 44,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    textAlign: "center",
  },
  digitBoxFilled: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  digitBoxError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 12,
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ea580c",
    height: 50,
    borderRadius: 25,
    width: "100%",
    gap: 8,
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  verifyBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  resendWrapper: {
    marginTop: 18,
  },
  resendSubText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  countdownText: {
    fontWeight: "900",
    color: "#0f172a",
  },
  resendBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resendLinkText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#ea580c",
  },
  demoHintText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 20,
    textAlign: "center",
    lineHeight: 16,
  },
  codeBadge: {
    fontWeight: "900",
    color: "#0f172a",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 4,
  },
});
