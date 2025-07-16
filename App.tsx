import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// 防止自動隱藏啟動畫面
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // 應用程式載入完成後隱藏啟動畫面
    const hideSplashScreen = async () => {
      await SplashScreen.hideAsync();
    };
    
    hideSplashScreen();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>歡迎使用 DonnaAI</Text>
      <Text style={styles.subtitle}>您的智能 AI 助手</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});