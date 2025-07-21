import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export const SimpleImageTest = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>簡單圖片測試</Text>
      
      {/* 測試 1: 使用 require 直接載入 */}
      <View style={styles.test}>
        <Text>測試 1: Require 載入</Text>
        <Image 
          source={require('../../../assets/donna-logo.png')}
          style={styles.image}
        />
      </View>
      
      {/* 測試 2: 使用絕對大小 */}
      <View style={styles.test}>
        <Text>測試 2: 絕對大小 (200x200)</Text>
        <Image 
          source={require('../../../assets/donna-logo.png')}
          style={{ width: 200, height: 200, backgroundColor: 'red' }}
        />
      </View>
      
      {/* 測試 3: 使用 flex */}
      <View style={styles.test}>
        <Text>測試 3: Flex 佈局</Text>
        <View style={{ width: 200, height: 200, backgroundColor: 'blue' }}>
          <Image 
            source={require('../../../assets/donna-logo.png')}
            style={{ flex: 1 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
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
  },
  image: {
    width: 150,
    height: 150,
    backgroundColor: 'lightgray',
  },
});