import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView } from 'react-native';

// 嘗試不同的圖片引入方式
const donnaLogoSrc = require('../../../assets/donna-logo.png');

export const UltimateImageTest = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>終極圖片測試</Text>
      
      {/* 測試 1: 直接使用數字 (React Native 內建圖片) */}
      <View style={styles.test}>
        <Text>測試 1: 使用內建圖片資源</Text>
        <Image 
          source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
          style={styles.image}
        />
      </View>
      
      {/* 測試 2: 使用已存儲的變數 */}
      <View style={styles.test}>
        <Text>測試 2: 使用變數引用</Text>
        <Image 
          source={donnaLogoSrc}
          style={styles.image}
        />
        <Text style={styles.debug}>Source: {JSON.stringify(donnaLogoSrc)}</Text>
      </View>
      
      {/* 測試 3: 使用 assets 根目錄 */}
      <View style={styles.test}>
        <Text>測試 3: Assets 根目錄</Text>
        <Image 
          source={require('../../../assets/icon.png')}
          style={styles.image}
        />
      </View>
      
      {/* 測試 4: 使用 adaptive-icon */}
      <View style={styles.test}>
        <Text>測試 4: Adaptive Icon (已知存在)</Text>
        <Image 
          source={require('../../../assets/adaptive-icon.png')}
          style={styles.image}
        />
      </View>
      
      {/* 測試 5: 測試資料夾中的圖片 */}
      <View style={styles.test}>
        <Text>測試 5: Test 資料夾圖片</Text>
        <Image 
          source={require('../../../assets/test/test-rgb.png')}
          style={styles.image}
        />
      </View>
      
      {/* 測試 6: 使用 Image.resolveAssetSource */}
      <View style={styles.test}>
        <Text>測試 6: 解析資源資訊</Text>
        <Text style={styles.debug}>
          {JSON.stringify(Image.resolveAssetSource(require('../../../assets/donna-logo.png')), null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  test: {
    marginBottom: 30,
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  image: {
    width: 150,
    height: 150,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },
  debug: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontFamily: 'monospace',
  },
});