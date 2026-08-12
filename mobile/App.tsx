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

export default function App() {
  const webViewRef = useRef<WebView>(null);
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
    setCanGoBack(navState.canGoBack);
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
          javaScriptEnabled
          domStorageEnabled
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
    ...StyleSheet.absoluteFillObject,
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
