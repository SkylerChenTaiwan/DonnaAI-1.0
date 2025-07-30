/**
 * 頂部導航欄元件
 * 用於平板和手機版的橫向導航
 */

import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Platform,
  Image
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { useRoute } from '@react-navigation/native';
import { DesignSystem } from '@/theme/designSystem';
import { shadows, webOnly } from '@/styles/web';
import { useAuthStore } from '@/stores/authStore';

interface TopBarProps {
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onMenuPress, 
  showMenu = false 
}) => {
  const route = useRoute();
  const { user, mode } = useAuthStore();
  
  // 根據當前路由獲取標題
  const getTitle = () => {
    switch (route.name) {
      case 'Home':
        return '首頁';
      case 'Database':
        return '資料庫';
      case 'Tools':
        return mode === 'manager' ? '人事' : '小工具';
      case 'Settings':
        return '設定';
      default:
        return 'DonnaAI';
    }
  };
  
  return (
    <View style={styles.container}>
      {/* 左側區域 */}
      <View style={styles.leftSection}>
        {/* 選單按鈕（平板顯示） */}
        {showMenu && onMenuPress && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={onMenuPress}
          >
            <Icon 
              name="menu" 
              size={24} 
              color={DesignSystem.colors.text.primary}
            />
          </TouchableOpacity>
        )}
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/donna-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>DonnaAI</Text>
        </View>
      </View>
      
      {/* 中間區域 - 頁面標題 */}
      <View style={styles.centerSection}>
        <Text style={styles.pageTitle}>{getTitle()}</Text>
      </View>
      
      {/* 右側區域 - 使用者資訊 */}
      <View style={styles.rightSection}>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userMode}>
              {mode === 'manager' ? '主管' : '業務'}
            </Text>
            <View style={styles.userAvatar}>
              <Icon 
                name="person-circle" 
                size={32} 
                color={DesignSystem.colors.text.secondary}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    backgroundColor: DesignSystem.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...webOnly({
      position: 'sticky' as any,
      top: 0,
      zIndex: 100,
    }),
    ...shadows.small,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userMode: {
    fontSize: 12,
    color: DesignSystem.colors.text.secondary,
    backgroundColor: DesignSystem.colors.button.secondary.default,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  userAvatar: {
    // Avatar styles
  },
});