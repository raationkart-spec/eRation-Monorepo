import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";

const WEB_URL = "https://quickcart-nu-nine.vercel.app";

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  // Handle Android physical back button navigation
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false; // Exit app if at root page
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => backHandler.remove();
  }, [canGoBack]);

  // Intercept external schemes (e.g. whatsapp://, tel:, mailto:, upi://)
  const handleShouldStartLoad = (request: any) => {
    const { url } = request;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Linking.openURL(url).catch((err) =>
        console.warn("Could not open external app:", err)
      );
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_URL }}
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        pullToRefreshEnabled={true}
        allowsInlineMediaPlayback={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
});
