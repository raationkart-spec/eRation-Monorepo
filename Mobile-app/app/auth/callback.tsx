import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useGlobalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
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

        let userParam = (params.user as string) || "";

        if (!userParam && urlString) {
          const queryIdx = urlString.indexOf("?");
          const hashIdx = urlString.indexOf("#");
          const queryStr =
            queryIdx !== -1
              ? hashIdx !== -1 && hashIdx > queryIdx
                ? urlString.substring(queryIdx + 1, hashIdx)
                : urlString.substring(queryIdx + 1)
              : "";

          const queryParams = new URLSearchParams(queryStr);
          userParam = queryParams.get("user") || "";
        }

        if (userParam && isMounted) {
          setStatusText("Welcome to QuickCart! Redirecting...");
          try {
            const userData = JSON.parse(decodeURIComponent(userParam));
            loginWithBackend(userData);
          } catch {
            // fallback
          }
          router.replace("/(tabs)");
        } else {
          if (isMounted) {
            setStatusText("Returning to login...");
            setTimeout(() => {
              if (isMounted) router.replace("/login");
            }, 1000);
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (isMounted) {
          setStatusText("Returning to login...");
          setTimeout(() => {
            if (isMounted) router.replace("/login");
          }, 1000);
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
