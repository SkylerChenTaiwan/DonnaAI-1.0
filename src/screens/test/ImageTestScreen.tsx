import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { Layout } from '../../components/common/Layout';

// Base64 測試圖片（50x50 綠色方塊）
const BASE64_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAASElEQVR4nO3OMQEAAAgDoP3zWweYgQdJREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREPrEB6FcBIcrMJJoAAAAASUVORK5CYII=';

export function ImageTestScreen() {
  return (
    <Layout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>PNG 圖片診斷測試</Text>
        
        {/* 測試 1: 原始 logo */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>測試 1: 原始 Logo (require)</Text>
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../../assets/donna-logo.png')}
              style={styles.testImage}
              resizeMode="contain"
              onLoad={() => console.log('原始 logo 載入成功')}
              onError={(e) => console.error('原始 logo 載入失敗:', e.nativeEvent.error)}
            />
          </View>
          <Text style={styles.info}>檔案: assets/donna-logo.png</Text>
          <Text style={styles.info}>大小: 120x60</Text>
        </View>

        {/* 測試 2: Base64 圖片 */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>測試 2: Base64 圖片</Text>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: BASE64_IMAGE }}
              style={styles.testImage}
              resizeMode="contain"
              onLoad={() => console.log('Base64 圖片載入成功')}
              onError={(e) => console.error('Base64 圖片載入失敗:', e.nativeEvent.error)}
            />
          </View>
          <Text style={styles.info}>來源: Base64 編碼</Text>
          <Text style={styles.info}>大小: 50x50 綠色方塊</Text>
        </View>

        {/* 測試 3: 測試 PNG - RGB */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>測試 3: 測試 RGB PNG</Text>
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../../assets/test/test-rgb.png')}
              style={styles.testImage}
              resizeMode="contain"
              onLoad={() => console.log('RGB PNG 載入成功')}
              onError={(e) => console.error('RGB PNG 載入失敗:', e.nativeEvent.error)}
            />
          </View>
          <Text style={styles.info}>檔案: assets/test/test-rgb.png</Text>
          <Text style={styles.info}>格式: RGB (無透明)</Text>
        </View>

        {/* 測試 4: 測試 PNG - RGBA */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>測試 4: 測試 RGBA PNG</Text>
          <View style={styles.imageContainer}>
            <Image 
              source={require('../../../assets/test/test-rgba.png')}
              style={styles.testImage}
              resizeMode="contain"
              onLoad={() => console.log('RGBA PNG 載入成功')}
              onError={(e) => console.error('RGBA PNG 載入失敗:', e.nativeEvent.error)}
            />
          </View>
          <Text style={styles.info}>檔案: assets/test/test-rgba.png</Text>
          <Text style={styles.info}>格式: RGBA (含透明)</Text>
        </View>

        {/* 測試 5: 網路圖片 */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>測試 5: 網路圖片</Text>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/150' }}
              style={styles.testImage}
              resizeMode="contain"
              onLoad={() => console.log('網路圖片載入成功')}
              onError={(e) => console.error('網路圖片載入失敗:', e.nativeEvent.error)}
            />
          </View>
          <Text style={styles.info}>來源: https://via.placeholder.com/150</Text>
        </View>

        {/* 測試 6: 不同樣式測試 */}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>測試 6: 不同樣式測試</Text>
          <View style={styles.styleTestContainer}>
            <View>
              <Text style={styles.subTitle}>固定大小</Text>
              <Image 
                source={require('../../../assets/donna-logo.png')}
                style={{ width: 100, height: 100, backgroundColor: '#f0f0f0' }}
              />
            </View>
            <View>
              <Text style={styles.subTitle}>只設寬度</Text>
              <Image 
                source={require('../../../assets/donna-logo.png')}
                style={{ width: 100, backgroundColor: '#f0f0f0' }}
              />
            </View>
            <View>
              <Text style={styles.subTitle}>aspectRatio</Text>
              <Image 
                source={require('../../../assets/donna-logo.png')}
                style={{ width: 100, aspectRatio: 1, backgroundColor: '#f0f0f0' }}
              />
            </View>
          </View>
        </View>

        {/* 診斷資訊 */}
        <View style={styles.diagnosticSection}>
          <Text style={styles.diagnosticTitle}>診斷建議：</Text>
          <Text style={styles.diagnosticText}>1. 檢查控制台是否有載入錯誤訊息</Text>
          <Text style={styles.diagnosticText}>2. 如果 Base64 可顯示但檔案不行，可能是 Metro 問題</Text>
          <Text style={styles.diagnosticText}>3. 如果都無法顯示，可能是 Image 組件問題</Text>
          <Text style={styles.diagnosticText}>4. 確認圖片檔案權限正確（644）</Text>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center' },
  testSection: {
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8 },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12 },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8 },
  testImage: {
    width: 120,
    height: 120 },
  info: {
    fontSize: 14,
    color: '#666',
    marginTop: 4 },
  styleTestContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12 },
  subTitle: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center' },
  diagnosticSection: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32 },
  diagnosticTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8 },
  diagnosticText: {
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 8 } });