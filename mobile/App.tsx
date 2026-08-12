import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  Text,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

const WEB_URL = 'https://quickcart-nu-nine.vercel.app';

// Standard mobile Chrome UA (no "; wv" marker) so Google's Sign-In doesn't
// reject the flow with "This browser or app may not be secure" /
// disallowed_useragent, which it does for any WebView-flagged user agent.
const CHROME_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

// Flags every page as loaded inside the app so the site can skip the
// Google button (its device-account picker never works in a WebView) and
// default straight to Email OTP login instead. Injected before content
// loads and set via localStorage since it must survive the client-side
// redirect from "/" to "/login", which drops any query params.
const INJECTED_APP_FLAG_SCRIPT = `
  try { window.localStorage.setItem('quickcart_is_app', '1'); } catch (e) {}
  true;
`;

const isAuthUrl = (url: string) =>
  url.includes('accounts.google.com') ||
  url.includes('/api/auth') ||
  url.includes('/login') ||
  url.includes('/signin');

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const wasOnAuthUrl = useRef(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const onAuthUrl = isAuthUrl(navState.url);
    // Once we leave the login/OAuth redirect chain, drop it from history so
    // the hardware back button can't walk back through Google's consent
    // screens and land the user back on the login page.
    if (wasOnAuthUrl.current && !onAuthUrl) {
      webViewRef.current?.clearHistory?.();
      setCanGoBack(false);
    } else {
      setCanGoBack(navState.canGoBack);
    }
    wasOnAuthUrl.current = onAuthUrl;
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    const { url } = request;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      Linking.openURL(url).catch((err) => console.warn('Could not open external app:', err));
      return false;
    }
    return true;
  };

  const retry = () => {
    setHasError(false);
    webViewRef.current?.reload();
  };

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View style={styles.centered}>
          <Text style={styles.messageText}>No internet connection</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      {hasError ? (
        <View style={styles.centered}>
          <Text style={styles.messageText} onPress={retry}>
            Something went wrong. Tap to retry.
          </Text>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onError={() => setHasError(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 500) setHasError(true);
          }}
          style={styles.webview}
          userAgent={CHROME_USER_AGENT}
          injectedJavaScriptBeforeContentLoaded={INJECTED_APP_FLAG_SCRIPT}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          startInLoadingState
          pullToRefreshEnabled
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  messageText: {
    color: '#f1f5f9',
    fontSize: 16,
    textAlign: 'center',
  },
});
