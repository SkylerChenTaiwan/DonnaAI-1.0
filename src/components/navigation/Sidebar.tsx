/**
 * 側邊欄導航元件
 * 用於桌面版和平板版的垂直導航
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DesignSystem } from '@/theme/designSystem';
import { shadows, transitions, webOnly } from '@/styles/web';
import { isDesktopWeb } from '@/utils/web-detector';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { MainTabParamList, RootStackParamList } from '@/types/navigation';
import ActionPopover from '@/components/common/ActionPopover';
import { getKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggle }) => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user, mode } = useAuthStore();
  const { openDialog } = useAnalyticsStore();
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionButtonRef, setActionButtonRef] = useState<View | null>(null);
  
  // 導航項目配置
  const menuItems = [
    { 
      id: 'Home' as keyof MainTabParamList, 
      label: '首頁', 
      icon: 'analytics-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'analytics' as keyof typeof Ionicons.glyphMap
    },
    { 
      id: 'Database' as keyof MainTabParamList, 
      label: '資料庫', 
      icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'people' as keyof typeof Ionicons.glyphMap
    },
    { 
      id: 'Tools' as keyof MainTabParamList, 
      label: mode === 'manager' ? '人事' : '小工具', 
      icon: mode === 'manager' ? 'people-circle-outline' : 'build-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: mode === 'manager' ? 'people-circle' : 'build' as keyof typeof Ionicons.glyphMap
    },
    { 
      id: 'Settings' as keyof MainTabParamList, 
      label: '設定', 
      icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
      activeIcon: 'person' as keyof typeof Ionicons.glyphMap
    },
  ];
  
  const handleActionPress = () => {
    if (mode === 'manager') {
      // 主管模式下開啟智能分析對話框
      openDialog();
    } else {
      // 業務模式下顯示操作選單
      setShowActionModal(true);
    }
  };
  
  const handleActionSelect = (action: { id: string; type: string }) => {
    setShowActionModal(false);
    
    switch (action.type) {
      case 'customer':
        navigation.navigate('CreateCustomerModal');
        break;
      case 'record':
        navigation.navigate('CreateRecordModal');
        break;
      case 'task':
        navigation.navigate('CreateTaskModal');
        break;
    }
  };
  
  const isActiveRoute = (itemId: string) => {
    return route.name === itemId;
  };
  
  return (
    <>
      <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
        {/* Logo 區域 */}
        <View style={styles.logoArea}>
          <Image 
            source={require('@/assets/images/donna-logo.png')} 
            style={[styles.logo, collapsed && styles.logoCollapsed]}
            resizeMode="contain"
          />
          {!collapsed && (
            <Text style={styles.logoText}>DonnaAI</Text>
          )}
        </View>
        
        {/* 導航項目 */}
        <View style={styles.menuItems}>
          {menuItems.map(item => {
            const isActive = isActiveRoute(item.id);
            
            return (
              <Pressable
                key={item.id}
                style={({ pressed, hovered }) => [
                  styles.menuItem,
                  isActive && styles.menuItemActive,
                  Platform.OS === 'web' && hovered && styles.menuItemHover,
                  pressed && styles.menuItemPressed,
                  collapsed && styles.menuItemCollapsed,
                ]}
                onPress={() => navigation.navigate(item.id as any)}
              >
                <Ionicons 
                  name={isActive ? item.activeIcon : item.icon} 
                  size={24} 
                  color={isActive ? DesignSystem.colors.primary : DesignSystem.colors.text.secondary}
                />
                {!collapsed && (
                  <Text style={[
                    styles.menuLabel,
                    isActive && styles.menuLabelActive
                  ]}>
                    {item.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
        
        {/* 中央操作按鈕 */}
        <View style={styles.actionButtonContainer}>
          <Pressable
            ref={(ref) => setActionButtonRef(ref)}
            style={({ pressed, hovered }) => [
              styles.actionButton,
              mode === 'manager' && styles.actionButtonManager,
              Platform.OS === 'web' && hovered && styles.actionButtonHover,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={handleActionPress}
          >
            {mode === 'manager' ? (
              <Ionicons name="search" size={20} color={DesignSystem.colors.text.inverse} />
            ) : (
              <View style={styles.plusIcon}>
                <View style={styles.plusHorizontal} />
                <View style={styles.plusVertical} />
              </View>
            )}
          </Pressable>
          {!collapsed && (
            <Text style={styles.actionLabel}>
              {mode === 'manager' ? '智能分析' : '新增'}
            </Text>
          )}
        </View>
        
        {/* 使用者資訊（底部） */}
        {!collapsed && user && (
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Ionicons name="person-circle" size={32} color={DesignSystem.colors.text.tertiary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.displayName || user.email}
              </Text>
              <Text style={styles.userRole} numberOfLines={1}>
                {mode === 'manager' ? '主管模式' : '業務模式'}
              </Text>
            </View>
          </View>
        )}
        
        {/* 鍵盤快捷鍵提示（桌面版） */}
        {!collapsed && isDesktopWeb() && (
          <TouchableOpacity 
            style={styles.shortcutsHint}
            onPress={() => {
              const shortcuts = getKeyboardShortcuts();
              const helpText = shortcuts
                .map(s => {
                  const keys = [];
                  if (s.ctrl) keys.push('Ctrl');
                  if (s.alt) keys.push('Alt');
                  if (s.shift) keys.push('Shift');
                  keys.push(s.key === 'Escape' ? 'Esc' : s.key.toUpperCase());
                  return `${keys.join('+')} - ${s.description}`;
                })
                .join('\n');
              
              if (typeof window !== 'undefined') {
                alert(`鍵盤快捷鍵：\n\n${helpText}`);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="key-outline" size={16} color={DesignSystem.colors.text.tertiary} />
            <Text style={styles.shortcutsText}>快捷鍵說明</Text>
          </TouchableOpacity>
        )}
        
        {/* 收合按鈕（僅平板顯示） */}
        {onToggle && (
          <TouchableOpacity 
            style={styles.collapseButton}
            onPress={onToggle}
          >
            <Ionicons 
              name={collapsed ? 'chevron-forward' : 'chevron-back'} 
              size={20} 
              color={DesignSystem.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* 操作彈出選單 */}
      <ActionPopover
        visible={showActionModal}
        onClose={() => setShowActionModal(false)}
        onAction={handleActionSelect}
        fromRef={actionButtonRef}
        tabBarHeight={0}
      />
    </>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
    paddingVertical: 24,
    flexDirection: 'column',
    ...shadows.small,
  },
  sidebarCollapsed: {
    width: 80,
  },
  logoArea: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  logoCollapsed: {
    marginBottom: 0,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  menuItems: {
    flex: 1,
    paddingTop: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 12,
    borderRadius: DesignSystem.borderRadius.sm,
    ...transitions.default,
  },
  menuItemCollapsed: {
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  menuItemActive: {
    backgroundColor: DesignSystem.colors.button.secondary.default,
    borderLeftWidth: 3,
    borderLeftColor: DesignSystem.colors.primary,
    marginLeft: 9, // 補償 border 的寬度
  },
  menuItemHover: {
    backgroundColor: DesignSystem.colors.button.secondary.hover,
  },
  menuItemPressed: {
    backgroundColor: DesignSystem.colors.button.secondary.pressed,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.secondary,
    flex: 1,
  },
  menuLabelActive: {
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
  },
  actionButtonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignSystem.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
    ...transitions.default,
  },
  actionButtonManager: {
    backgroundColor: DesignSystem.colors.gray[700],
  },
  actionButtonHover: {
    transform: [{ scale: 1.05 }],
  },
  actionButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  plusIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: '100%',
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ translateY: -1.5 }],
  },
  plusVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 3,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ translateX: -1.5 }],
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
  },
  userAvatar: {
    marginRight: 8,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
  },
  userRole: {
    fontSize: 12,
    color: DesignSystem.colors.text.tertiary,
    marginTop: 2,
  },
  collapseButton: {
    position: 'absolute',
    right: -12,
    top: '50%',
    transform: [{ translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignSystem.colors.background.surface,
    borderWidth: 1,
    borderColor: DesignSystem.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  shortcutsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: DesignSystem.borderRadius.sm,
    backgroundColor: DesignSystem.colors.background.secondary,
    ...transitions.default,
  },
  shortcutsText: {
    fontSize: 12,
    color: DesignSystem.colors.text.tertiary,
  },
});