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
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DesignSystem } from '@/theme/designSystem';
import { shadows, transitions, webOnly } from '@/styles/web';
import { isDesktopWeb } from '@/utils/web-detector';
import { useAuthStore } from '@/stores/authStore';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { MainTabParamList, RootStackParamList } from '@/types/navigation';
import { ActionPopover } from '@/components/common/ActionPopover';
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
  const [databaseExpanded, setDatabaseExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  
  // 計算用戶權限
  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'super_admin' || user?.role === 'system-admin';
  const isEnterpriseAdmin = user?.role === 'admin';
  const hasAdminAccess = isSuperAdmin || isEnterpriseAdmin;
  
  // 導航項目配置
  const menuItems = [
    { 
      id: 'Home', 
      label: '首頁', 
      icon: 'analytics-outline' as const,
      activeIcon: 'analytics' as const,
      hasChildren: false
    },
    { 
      id: 'Database', 
      label: '資料庫', 
      icon: 'people-outline' as const,
      activeIcon: 'people' as const,
      hasChildren: true,
      subItems: [
        { id: 'customers', label: '客戶', icon: 'person' },
        { id: 'records', label: '紀錄', icon: 'document-text' },
        { id: 'tasks', label: '任務', icon: 'checkbox' }
      ]
    },
    { 
      id: 'Tools', 
      label: mode === 'manager' ? '人事' : '小工具', 
      icon: (mode === 'manager' ? 'people-circle-outline' : 'build-outline') as const,
      activeIcon: (mode === 'manager' ? 'people-circle' : 'build') as const,
      hasChildren: false
    },
    { 
      id: 'Settings', 
      label: '設定', 
      icon: 'person-outline' as const,
      activeIcon: 'person' as const,
      hasChildren: false
    },
    // Admin 項目（僅管理員可見）
    ...(hasAdminAccess ? [{
      id: 'Admin',
      label: '管理',
      icon: 'settings-outline' as const,
      activeIcon: 'settings' as const,
      hasChildren: true,
      subItems: isSuperAdmin ? [
        { id: 'OrganizationsScreen', label: '組織管理', icon: 'business' },
        { id: 'SuperAdminDashboard', label: 'Super Admin', icon: 'shield' },
        { id: 'PlatformDashboard', label: '平台統計', icon: 'stats-chart' },
      ] : [
        { id: 'AdminDashboard', label: '管理中心', icon: 'grid' },
        { id: 'UserManagementScreen', label: '用戶管理', icon: 'people' },
        { id: 'DataImportScreen', label: '資料匯入', icon: 'cloud-upload' },
        { id: 'UsageReportsScreen', label: '使用報表', icon: 'bar-chart' },
      ]
    }] : []),
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
            const isHovered = hoveredItem === item.id;
            const isExpanded = (item.id === 'Database' && databaseExpanded) || 
                              (item.id === 'Admin' && adminExpanded);
            
            return (
              <View key={item.id}>
                <Pressable
                  style={({ pressed, hovered }) => [
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                    Platform.OS === 'web' && hovered && styles.menuItemHover,
                    pressed && styles.menuItemPressed,
                    collapsed && styles.menuItemCollapsed,
                  ]}
                  onPress={() => {
                    if (item.hasChildren) {
                      if (item.id === 'Database') {
                        setDatabaseExpanded(!databaseExpanded);
                      } else if (item.id === 'Admin') {
                        setAdminExpanded(!adminExpanded);
                      }
                    } else {
                      // 修復導航邏輯 - 確保導航到正確的路由
                      try {
                        if (navigation && navigation.navigate) {
                          navigation.navigate(item.id as never);
                          console.log(`[Sidebar] Navigating to: ${item.id}`);
                        } else {
                          console.error('[Sidebar] Navigation not available');
                        }
                      } catch (error) {
                        console.error(`[Sidebar] Navigation failed for ${item.id}:`, error);
                      }
                    }
                  }}
                  onHoverIn={() => setHoveredItem(item.id)}
                  onHoverOut={() => setHoveredItem(null)}
                >
                  <Icon 
                    name={isActive ? item.activeIcon : item.icon} 
                    size={20} 
                    color={isActive ? '#37352f' : '#787774'}
                  />
                  {!collapsed && (
                    <>
                      <Text style={[
                        styles.menuLabel,
                        isActive && styles.menuLabelActive
                      ]}>
                        {item.label}
                      </Text>
                      {item.hasChildren && isHovered && (
                        <TouchableOpacity
                          style={styles.expandButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (item.id === 'Database') {
                              setDatabaseExpanded(!databaseExpanded);
                            } else if (item.id === 'Admin') {
                              setAdminExpanded(!adminExpanded);
                            }
                          }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icon 
                            name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                            size={16} 
                            color="#91918e" 
                          />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </Pressable>
                
                {/* 子項目 */}
                {!collapsed && isExpanded && item.subItems && (
                  <View style={styles.subMenuContainer}>
                    {item.subItems.map(subItem => (
                      <TouchableOpacity
                        key={subItem.id}
                        style={styles.subMenuItem}
                        onPress={() => {
                          // 導航到具體的分頁
                          try {
                            if (item.id === 'Database') {
                              navigation.navigate('Database' as never, { 
                                activeTab: subItem.id 
                              } as never);
                            } else if (item.id === 'Admin') {
                              // 直接導航到 Admin 頁面
                              navigation.navigate(subItem.id as never);
                            }
                            console.log(`[Sidebar] Navigating to Database tab: ${subItem.id}`);
                          } catch (error) {
                            console.error(`[Sidebar] Database navigation failed:`, error);
                          }
                        }}
                      >
                        <Icon 
                          name={subItem.icon} 
                          size={16} 
                          color="#91918e"
                        />
                        <Text style={styles.subMenuLabel}>
                          {subItem.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
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
              <Icon name="search" size={16} color={DesignSystem.colors.text.inverse} />
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
        
        {/* 底部區域容器 */}
        <View style={styles.bottomSection}>
          {/* 使用者資訊 */}
          {!collapsed && user && (
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Icon name="person-circle" size={32} color={DesignSystem.colors.text.tertiary} />
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
              <Icon name="key-outline" size={16} color={DesignSystem.colors.text.tertiary} />
              <Text style={styles.shortcutsText}>快捷鍵說明</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* 收合按鈕（桌面和平板都顯示） */}
        {onToggle && (
          <TouchableOpacity 
            style={[
              styles.collapseButton,
              collapsed && styles.collapseButtonCollapsed
            ]}
            onPress={onToggle}
          >
            <Icon 
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
    width: 220,
    height: '100%',
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e9e9e7',
    paddingVertical: 24,
    flexDirection: 'column',
    flex: 1,
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
    color: '#787774',
    flex: 1,
  },
  menuLabelActive: {
    color: '#37352f',
    fontWeight: '600',
  },
  actionButtonContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: DesignSystem.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...transitions.default,
  },
  actionButtonManager: {
    backgroundColor: DesignSystem.colors.gray700,
  },
  actionButtonHover: {
    transform: Platform.OS === 'web' ? `scale(${1.05})` : [{ scale: 1.05 }],
  },
  actionButtonPressed: {
    transform: Platform.OS === 'web' ? `scale(${0.95})` : [{ scale: 0.95 }],
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
  },
  plusIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  plusHorizontal: {
    position: 'absolute',
    left: 0,
    top: '50%',
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    transform: Platform.OS === 'web' ? `translateY(${-1}px)` : [{ translateY: -1 }],
  },
  plusVertical: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2,
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    transform: Platform.OS === 'web' ? `translateX(${-1}px)` : [{ translateX: -1 }],
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
    transform: Platform.OS === 'web' ? `translateY(${-12}px)` : [{ translateY: -12 }],
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
  collapseButtonCollapsed: {
    // 側邊欄收合時，按鈕位置需要調整
    right: -12,
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
  expandButton: {
    position: 'absolute',
    right: 8,
    padding: 4,
  },
  subMenuContainer: {
    paddingLeft: 32,
    marginTop: 4,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderRadius: DesignSystem.borderRadius.sm,
    marginHorizontal: 8,
    ...transitions.default,
  },
  subMenuLabel: {
    fontSize: 13,
    color: '#91918e',
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: 16,
  },
});