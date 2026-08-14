import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Mail, ArrowRight, Zap } from "lucide-react-native";
import { api } from "../lib/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const h = e.endCoordinates.height;
      setKeyboardHeight(h);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const isValidEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const handleSendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail || loading) return;

    setErrorMsg("");
    setLoading(true);

    const res = await api.sendOtp(cleanEmail);
    setLoading(false);

    if (res.success) {
      router.push({ pathname: "/verify", params: { email: cleanEmail } });
    } else {
      setErrorMsg(res.error || "Failed to send OTP email.");
    }
  };

  const topPadding = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 28 : 12);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight : 0 },
          ]}
          bounces={false}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80",
              }}
              style={styles.heroBg}
              resizeMode="cover"
            >
              {/* Dark Gradient Overlay */}
              <View style={styles.heroOverlay} />

              {/* Brand Header Badge */}
              <View style={[styles.brandHeader, { paddingTop: topPadding + 12 }]}>
                <View style={styles.badgePill}>
                  <Zap size={11} color="#ffffff" fill="#ffffff" />
                  <Text style={styles.badgeText}>DELIVERED ALL ACROSS SILIGURI</Text>
                </View>
                <Text style={styles.brandTitle}>QuickCart</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Bottom Sheet Card */}
          <View style={[styles.bottomCard, showEmailInput && styles.bottomCardTight]}>
            <View style={styles.contentBox}>
              <View style={styles.textGroup}>
                <Text style={styles.mainTitle}>
                  Groceries delivered{"\n"}
                  <Text style={styles.orangeTitle}>across Siliguri.</Text>
                </Text>

                {!showEmailInput ? (
                  <Text style={styles.subText}>
                    Freshness delivered right to your doorstep in Siliguri. Sign in to start shopping.
                  </Text>
                ) : null}
              </View>

              {/* CTA Section */}
              <View style={styles.actionContainer}>
                {!showEmailInput ? (
                  <TouchableOpacity
                    style={styles.mainOrangeBtn}
                    onPress={() => {
                      setShowEmailInput(true);
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }}
                    activeOpacity={0.85}
                  >
                    <Mail size={18} color="#ffffff" />
                    <Text style={styles.mainBtnText}>Login using Email</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.emailInputWrapper}>
                    <View style={styles.inputPill}>
                      <Mail size={16} color="#f97316" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email address"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoFocus
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errorMsg) setErrorMsg("");
                        }}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                          }, 100);
                        }}
                        onSubmitEditing={handleSendOtp}
                        returnKeyType="done"
                      />
                    </View>

                    {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                    <TouchableOpacity
                      style={[styles.mainOrangeBtn, (!isValidEmail || loading) && styles.disabledBtn]}
                      onPress={handleSendOtp}
                      disabled={!isValidEmail || loading}
                      activeOpacity={0.85}
                    >
                      {loading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.mainBtnText}>Get OTP Code</Text>
                          <ArrowRight size={16} color="#ffffff" />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service & Privacy Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#090d16",
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#090d16",
  },
  heroSection: {
    height: SCREEN_HEIGHT * 0.70,
    width: "100%",
    position: "relative",
  },
  heroBg: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.45)",
  },
  brandHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 8,
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  bottomCard: {
    flex: 1,
    marginTop: -32,
    backgroundColor: "#0f172a",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  bottomCardTight: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  contentBox: {
    flex: 1,
    justifyContent: "space-between",
  },
  textGroup: {
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 30,
    textAlign: "center",
  },
  orangeTitle: {
    color: "#f97316",
    fontWeight: "900",
  },
  subText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#cbd5e1",
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 10,
    lineHeight: 17,
  },
  actionContainer: {
    marginVertical: 10,
    width: "100%",
  },
  mainOrangeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f97316",
    height: 48,
    borderRadius: 24,
    gap: 8,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  mainBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  emailInputWrapper: {
    gap: 8,
  },
  inputPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderWidth: 1.5,
    borderColor: "#f97316",
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: "#f87171",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  termsText: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 14,
  },
});
