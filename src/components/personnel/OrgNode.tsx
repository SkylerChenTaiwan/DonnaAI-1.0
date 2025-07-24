/**
 * 組織節點元件 - 顯示單個人員節點
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrgNode } from '@/types/organization';
import { StatusIndicator } from './StatusIndicator';
import { PermissionBadge } from './PermissionBadge';
import { DragDropHandler } from './DragDropHandler';
import { DesignSystem } from '@/theme/DesignSystem';

interface OrgNodeComponentProps {
  node: OrgNode;
  onPress?: () => void;
  onExpand?: () => void;
  draggable?: boolean;
  onDragStart?: (node: OrgNode) => void;
  onDrop?: (sourceNode: OrgNode, targetNode: OrgNode) => void;
}

export function OrgNodeComponent({ 
  node, 
  onPress,
  onExpand,
  draggable = false,
  onDragStart,
  onDrop
}: OrgNodeComponentProps) {
  const user = node.user;
  const hasChildren = node.children.length > 0;
  
  const nodeContent = (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* 頭部資訊 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name || '未命名'}
          </Text>
          <PermissionBadge user={user} compact />
        </View>
        
        {hasChildren && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={onExpand}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={node.expanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={DesignSystem.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 職位和部門 */}
      <View style={styles.info}>
        <Text style={styles.role} numberOfLines={1}>
          {user.jobTitle || getRoleText(user.role)}
        </Text>
        {user.department && (
          <Text style={styles.department} numberOfLines={1}>
            {user.department}
          </Text>
        )}
      </View>

      {/* 狀態和統計 */}
      <View style={styles.footer}>
        <StatusIndicator user={user} size="small" />
        
        {hasChildren && (
          <View style={styles.stats}>
            <Ionicons 
              name="people" 
              size={12} 
              color={DesignSystem.colors.text.tertiary} 
            />
            <Text style={styles.statsText}>
              {node.children.length}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  // 如果可拖動，包裹 DragDropHandler
  if (draggable) {
    return (
      <DragDropHandler
        node={node}
        onDragStart={onDragStart}
        onDrop={onDrop}
        enabled={draggable}
      >
        {nodeContent}
      </DragDropHandler>
    );
  }
  
  return nodeContent;
}

// 角色文字轉換
function getRoleText(role?: string): string {
  switch (role) {
    case 'admin':
      return '管理員';
    case 'manager':
      return '主管';
    case 'salesperson':
      return '業務';
    default:
      return role || '成員';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.surface,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  expandButton: {
    padding: 4,
    marginLeft: 8,
  },
  info: {
    marginBottom: 8,
  },
  role: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary,
    marginBottom: 2,
  },
  department: {
    fontSize: 12,
    color: DesignSystem.colors.text.tertiary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: DesignSystem.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsText: {
    fontSize: 11,
    fontWeight: '500',
    color: DesignSystem.colors.text.tertiary,
  },
});