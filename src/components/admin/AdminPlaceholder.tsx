/**
 * 管理員頁面佔位符組件
 * 用於尚未完成的管理員頁面
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import { DesignSystem } from '@/theme/designSystem';

interface AdminPlaceholderProps {
  title: string;
  description: string;
  icon?: string;
}

export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({
  title,
  description,
  icon = 'construct-outline'
}) => {
  return (
    <Layout style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={64} color={DesignSystem.colors.gray[400]} />
        </View>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.subtitle}>此功能正在開發中，敬請期待！</Text>
      </View>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background.primary },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl },
  iconContainer: {
    marginBottom: DesignSystem.spacing.xl },
  description: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.text.primary,
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.md },
  subtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center' } });