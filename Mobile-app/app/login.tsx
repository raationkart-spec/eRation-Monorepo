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
import Svg, { Path } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store/useAuthStore";

WebBrowser.maybeCompleteAuthSession();

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const loginWithBackend = useAuthStore((s) => s.loginWithBackend);

  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setErrorMsg("");

      const redirectUrl = makeRedirectUri({
        scheme: "quickcart",
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (res.type === "success" && res.url) {
          // Parse hash or search params from callback URL
          const urlString = res.url;
          const hashIndex = urlString.indexOf("#");
          const queryIndex = urlString.indexOf("?");
          const paramString =
            hashIndex !== -1
              ? urlString.substring(hashIndex + 1)
              : queryIndex !== -1
              ? urlString.substring(queryIndex + 1)
              : "";

          const params = new URLSearchParams(paramString);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          const code = params.get("code");

          let authUser: any = null;

          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionErr } =
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
            if (!sessionErr && sessionData.user) {
              authUser = sessionData.user;
            }
          } else if (code) {
            const { data: sessionData, error: sessionErr } =
              await supabase.auth.exchangeCodeForSession(code);
            if (!sessionErr && sessionData.user) {
              authUser = sessionData.user;
            }
          }

          if (authUser) {
            const cleanEmail = authUser.email || "";
            const meta = authUser.user_metadata || {};
            const name = meta.full_name || meta.name || cleanEmail.split("@")[0];
            const image = meta.avatar_url || meta.picture;

            const syncRes = await api.syncSupabaseUser({
              id: authUser.id,
              email: cleanEmail,
              name,
              image,
            });

            if (syncRes.success && syncRes.user) {
              loginWithBackend(syncRes.user);
            } else {
              loginWithBackend({
                id: authUser.id,
                email: cleanEmail,
                name,
                image,
                role: "CUSTOMER",
              });
            }
            router.replace("/(tabs)");
            return;
          }
        }
      }
    } catch (e: any) {
      console.error("Google sign-in error:", e);
      setErrorMsg(e.message || "Failed to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

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
                  <View style={styles.btnStack}>
                    <TouchableOpacity
                      style={styles.googleBtn}
                      onPress={handleGoogleSignIn}
                      disabled={googleLoading}
                      activeOpacity={0.85}
                    >
                      {googleLoading ? (
                        <ActivityIndicator color="#0f172a" size="small" />
                      ) : (
                        <>
                          <Svg width={20} height={20} viewBox="0 0 24 24">
                            <Path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <Path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <Path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <Path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </Svg>
                          <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </>
                      )}
                    </TouchableOpacity>

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
                  </View>
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
  btnStack: {
    width: "100%",
    gap: 10,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    height: 48,
    borderRadius: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  googleBtnText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
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
