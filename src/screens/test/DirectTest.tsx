import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

export const DirectTest = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>直接測試</Text>
      
      <View style={styles.test}>
        <Text>1. Adaptive Icon (能顯示的)</Text>
        <Image 
          source={require('../../../assets/adaptive-icon.png')}
          style={styles.image}
        />
      </View>
      
      <View style={styles.test}>
        <Text>2. Donna Logo Test (複製自 adaptive)</Text>
        <Image 
          source={require('../../../assets/donna-logo-test.png')}
          style={styles.image}
        />
      </View>
      
      <View style={styles.test}>
        <Text>3. Donna Logo (轉換後的)</Text>
        <Image 
          source={require('../../../assets/donna-logo.png')}
          style={styles.image}
        />
      </View>
      
      <View style={styles.test}>
        <Text>4. 直接使用數字 1 測試</Text>
        <Image 
          source={1}
          style={styles.image}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    paddingTop: 60 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center' },
  test: {
    marginBottom: 30,
    alignItems: 'center' },
  image: {
    width: 150,
    height: 150,
    backgroundColor: '#e0e0e0',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'red' } });