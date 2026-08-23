import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useGlobalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { api } from "../../lib/api";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const loginWithBackend = useAuthStore((s) => s.loginWithBackend);
  const [statusText, setStatusText] = useState("Finalizing your sign in...");

  useEffect(() => {
    let isMounted = true;

    async function handleAuthRedirect() {
      try {
        const initialUrl = await Linking.getInitialURL();
        const urlString = initialUrl || "";

        let access_token = (params.access_token as string) || "";
        let refresh_token = (params.refresh_token as string) || "";
        let code = (params.code as string) || "";

        // Fallback: parse tokens from the initial deep-link URL if route params missed them
        if (!access_token && urlString) {
          const hashIdx = urlString.indexOf("#");
          const queryIdx = urlString.indexOf("?");
          const hashStr = hashIdx !== -1 ? urlString.substring(hashIdx + 1) : "";
          const queryStr =
            queryIdx !== -1
              ? hashIdx !== -1 && hashIdx > queryIdx
                ? urlString.substring(queryIdx + 1, hashIdx)
                : urlString.substring(queryIdx + 1)
              : "";

          const hashParams = new URLSearchParams(hashStr);
          const queryParams = new URLSearchParams(queryStr);

          access_token =
            hashParams.get("access_token") || queryParams.get("access_token") || "";
          refresh_token =
            hashParams.get("refresh_token") || queryParams.get("refresh_token") || "";
          code = hashParams.get("code") || queryParams.get("code") || "";
        }

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

        if (!authUser) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            authUser = session.user;
          }
        }

        if (authUser && isMounted) {
          setStatusText("Welcome to QuickCart! Redirecting...");
          const cleanEmail = authUser.email || "";
          const meta = authUser.user_metadata || {};
          const name = meta.full_name || meta.name || cleanEmail.split("@")[0];
          const image = meta.avatar_url || meta.picture;

          try {
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
          } catch (e) {
            loginWithBackend({
              id: authUser.id,
              email: cleanEmail,
              name,
              image,
              role: "CUSTOMER",
            });
          }

          router.replace("/(tabs)");
        } else {
          if (isMounted) {
            setStatusText("Sign in failed. Returning to login...");
            setTimeout(() => {
              if (isMounted) router.replace("/login");
            }, 1500);
          }
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        if (isMounted) {
          setStatusText("Sign in error. Returning to login...");
          setTimeout(() => {
            if (isMounted) router.replace("/login");
          }, 1500);
        }
      }
    }

    handleAuthRedirect();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  text: {
    marginTop: 16,
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
