/**
 * 權限標籤元件
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { EnhancedUser } from '@/types/personnel';

interface PermissionBadgeProps {
  user: Partial<EnhancedUser>;
  compact?: boolean;
}

export function PermissionBadge({ user, compact = false }: PermissionBadgeProps) {
  const role = user.role || 'salesperson';
  
  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          icon: 'shield-checkmark' as keyof typeof Ionicons.glyphMap,
          label: '管理員',
          color: '#FF3B30',
          bgColor: '#FF3B301A',
        };
      case 'manager':
        return {
          icon: 'people' as keyof typeof Ionicons.glyphMap,
          label: '主管',
          color: '#007AFF',
          bgColor: '#007AFF1A',
        };
      case 'salesperson':
      default:
        return {
          icon: 'person' as keyof typeof Ionicons.glyphMap,
          label: '業務',
          color: '#34C759',
          bgColor: '#34C7591A',
        };
    }
  };

  const config = getRoleConfig();
  const dataAccess = user.permissions?.dataAccess;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
        <Icon name={config.icon} size={14} color={config.color} />
        {!compact && <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>}
      </View>
      
      {!compact && dataAccess && (
        <View style={styles.accessBadge}>
          <Icon 
            name={dataAccess === 'organization' ? 'globe' : dataAccess === 'team' ? 'git-network' : 'person'} 
            size={12} 
            color={DesignSystem.colors.text.secondary} 
          />
          <Text style={styles.accessText}>
            {dataAccess === 'organization' ? '全組織' : dataAccess === 'team' ? '團隊' : '個人'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: DesignSystem.colors.background,
    borderRadius: 8,
    gap: 2,
  },
  accessText: {
    fontSize: 10,
    color: DesignSystem.colors.text.secondary,
  },
});