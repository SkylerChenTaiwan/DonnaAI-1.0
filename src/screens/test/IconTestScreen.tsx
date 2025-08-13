import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Icon } from '@/components/common/Icon';

const testIcons = [
  'analytics',
  'analytics-outline',
  'people',
  'people-outline',
  'people-circle',
  'people-circle-outline',
  'build',
  'build-outline',
  'person',
  'person-outline',
  'search',
  'add',
  'ellipse-outline'
];

export const IconTestScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>圖標測試頁面</Text>
      {testIcons.map((iconName) => (
        <View key={iconName} style={styles.row}>
          <Icon name={iconName} size={24} color="#000" />
          <Text style={styles.label}>{iconName}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee' },
  label: {
    marginLeft: 20,
    fontSize: 16 } });