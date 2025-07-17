/**
 * 新增紀錄 Modal
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/common/Button';
import { Layout } from '@/components/common/Layout';
import { useNavigation } from '@react-navigation/native';

export const CreateRecordModal: React.FC = () => {
  const navigation = useNavigation();

  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>新增紀錄</Text>
        <Text style={styles.placeholder}>紀錄建立表單將在此處實作</Text>
        <Button
          title="取消"
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.button}
        />
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
  },
  button: {
    width: 200,
  },
});