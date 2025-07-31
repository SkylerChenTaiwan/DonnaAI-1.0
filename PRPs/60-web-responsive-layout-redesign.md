# DonnaAI Web 響應式佈局重新設計

## 1. 概述

本 PRP 旨在全面改進 DonnaAI Web 版的使用者介面，針對橫式螢幕優化，並確保所有頁面都有適當的側邊欄導航。

## 2. 現有問題分析

### 2.1 目前問題
- 缺乏針對橫式螢幕的響應式設計
- 多數頁面沒有側邊欄導航
- 內容區域在寬螢幕上過於集中，浪費左右空間
- 行動優先的設計直接套用在桌面，未考慮桌面使用情境

### 2.2 影響
- 桌面使用者體驗不佳
- 導航效率低落
- 專業感不足
- 空間利用率差

## 3. 設計目標

### 3.1 主要目標
- 建立完整的響應式佈局系統
- 為 Web 版設計專屬的側邊欄導航
- 優化寬螢幕的空間利用
- 保持與 Mobile 版的設計一致性

### 3.2 設計原則
- 響應式優先：根據螢幕大小自動調整佈局
- 漸進增強：從行動版基礎上增加桌面特有功能
- 一致性：保持品牌識別和使用體驗的連貫性
- 效率：減少點擊次數，提高操作效率

## 4. 技術實作

### 4.1 響應式斷點設計
```typescript
// src/utils/responsive.ts
export const breakpoints = {
  mobile: 0,      // 0-767px
  tablet: 768,    // 768-1023px
  desktop: 1024,  // 1024-1439px
  wide: 1440      // 1440px+
};

export const useResponsive = () => {
  const { width } = useWindowDimensions();
  
  return {
    isMobile: width < breakpoints.tablet,
    isTablet: width >= breakpoints.tablet && width < breakpoints.desktop,
    isDesktop: width >= breakpoints.desktop,
    isWide: width >= breakpoints.wide,
    screenWidth: width
  };
};
```

### 4.2 Web 專用佈局元件
```typescript
// src/components/layout/WebLayout.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SidebarNavigation } from './SidebarNavigation';
import { TopBar } from './TopBar';
import { useResponsive } from '@/utils/responsive';

interface WebLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
}

export function WebLayout({ 
  children, 
  showSidebar = true,
  sidebarCollapsed = false,
  onSidebarToggle 
}: WebLayoutProps) {
  const { isDesktop } = useResponsive();
  
  if (!isDesktop) {
    // 行動版佈局
    return <>{children}</>;
  }
  
  return (
    <View style={styles.container}>
      {showSidebar && (
        <SidebarNavigation 
          collapsed={sidebarCollapsed}
          onToggle={onSidebarToggle}
        />
      )}
      <View style={[
        styles.mainContent,
        showSidebar && styles.mainContentWithSidebar,
        sidebarCollapsed && styles.mainContentWithCollapsedSidebar
      ]}>
        <TopBar />
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5'
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column'
  },
  mainContentWithSidebar: {
    marginLeft: 260  // 側邊欄寬度
  },
  mainContentWithCollapsedSidebar: {
    marginLeft: 80   // 收合的側邊欄寬度
  },
  content: {
    flex: 1,
    padding: 24,
    maxWidth: 1440,
    width: '100%',
    alignSelf: 'center'
  }
});
```

### 4.3 側邊欄導航元件
```typescript
// src/components/layout/SidebarNavigation.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from '@/components/common/Icon';
import { useAuth } from '@/services/auth/hooks';
import { useManagerMode } from '@/hooks/useManagerMode';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { key: 'home', label: '首頁', icon: 'home-outline', route: 'Home' },
  { key: 'tasks', label: '任務', icon: 'checkbox-outline', route: 'Tasks' },
  { key: 'database', label: '資料庫', icon: 'server-outline', route: 'Database' },
  { key: 'tools', label: '小工具', icon: 'build-outline', route: 'Tools' },
  { key: 'manager', label: '主管模式', icon: 'briefcase-outline', route: 'Manager', managerOnly: true },
  { key: 'settings', label: '設定', icon: 'settings-outline', route: 'Settings' }
];

interface SidebarNavigationProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function SidebarNavigation({ collapsed = false, onToggle }: SidebarNavigationProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isManagerMode } = useManagerMode();
  const [activeRoute, setActiveRoute] = React.useState('Home');
  
  const filteredItems = navItems.filter(item => {
    if (item.managerOnly && !user?.role?.includes('Manager')) {
      return false;
    }
    return true;
  });
  
  return (
    <View style={[styles.container, collapsed && styles.collapsed]}>
      {/* Logo 區域 */}
      <View style={styles.logoSection}>
        <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
          <Icon 
            name={collapsed ? 'menu' : 'menu-open'} 
            size={24} 
            color="#666"
          />
        </TouchableOpacity>
        {!collapsed && (
          <Text style={styles.logoText}>DonnaAI</Text>
        )}
      </View>
      
      {/* 導航項目 */}
      <View style={styles.navItems}>
        {filteredItems.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              activeRoute === item.route && styles.navItemActive
            ]}
            onPress={() => {
              navigation.navigate(item.route as any);
              setActiveRoute(item.route);
            }}
          >
            <Icon 
              name={item.icon} 
              size={24} 
              color={activeRoute === item.route ? '#FF6B35' : '#666'}
              style={styles.navIcon}
            />
            {!collapsed && (
              <Text style={[
                styles.navLabel,
                activeRoute === item.route && styles.navLabelActive
              ]}>
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 使用者資訊 */}
      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          {!collapsed && (
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userRole}>
                {isManagerMode ? '主管模式' : '業務模式'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    position: 'fixed',
    height: '100vh',
    left: 0,
    top: 0,
    flexDirection: 'column',
    transition: 'width 0.3s ease'
  },
  collapsed: {
    width: 80
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  toggleButton: {
    padding: 8,
    marginRight: 12
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35'
  },
  navItems: {
    flex: 1,
    paddingVertical: 20
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 8,
    transition: 'background-color 0.2s ease'
  },
  navItemActive: {
    backgroundColor: '#FFF5F0'
  },
  navIcon: {
    marginRight: 16
  },
  navLabel: {
    fontSize: 16,
    color: '#666'
  },
  navLabelActive: {
    color: '#FF6B35',
    fontWeight: '500'
  },
  userSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center'
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold'
  },
  userDetails: {
    marginLeft: 12
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  }
});
```

### 4.4 內容區域最佳化
```typescript
// src/components/layout/ContentContainer.tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useResponsive } from '@/utils/responsive';

interface ContentContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  padding?: number;
  scrollable?: boolean;
}

export function ContentContainer({ 
  children, 
  maxWidth = 1200,
  padding = 24,
  scrollable = true 
}: ContentContainerProps) {
  const { isDesktop, screenWidth } = useResponsive();
  
  const Container = scrollable ? ScrollView : View;
  
  return (
    <Container 
      style={styles.scrollContainer}
      contentContainerStyle={[
        styles.contentContainer,
        { 
          paddingHorizontal: isDesktop ? padding : 16,
          maxWidth: isDesktop ? maxWidth : screenWidth 
        }
      ]}
    >
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1
  },
  contentContainer: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center'
  }
});
```

### 4.5 頁面佈局改造示例
```typescript
// src/components/screens/LegacyDataImportScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebLayout } from '@/components/layout/WebLayout';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { useResponsive } from '@/utils/responsive';

export function LegacyDataImportScreen() {
  const { isDesktop } = useResponsive();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  const content = (
    <ContentContainer>
      <View style={styles.header}>
        <Text style={styles.title}>匯入舊系統資料的 CSV 檔案</Text>
      </View>
      
      {/* 原有內容，但使用網格佈局優化 */}
      <View style={[styles.uploadGrid, isDesktop && styles.desktopGrid]}>
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>業務代碼對照表</Text>
          {/* 上傳區域 */}
        </View>
        
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>業務人員名單</Text>
          {/* 上傳區域 */}
        </View>
        
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>客戶名單</Text>
          {/* 上傳區域 */}
        </View>
        
        <View style={styles.uploadCard}>
          <Text style={styles.cardTitle}>訪談記錄</Text>
          {/* 上傳區域 */}
        </View>
      </View>
    </ContentContainer>
  );
  
  // Web 版使用 WebLayout 包裝
  if (isDesktop) {
    return (
      <WebLayout 
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {content}
      </WebLayout>
    );
  }
  
  // 行動版直接顯示內容
  return content;
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  uploadGrid: {
    flexDirection: 'column',
    gap: 16
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24
  },
  uploadCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16
  }
});
```

### 4.6 全域佈局管理
```typescript
// src/navigation/AppNavigator.tsx
import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useResponsive } from '@/utils/responsive';
import { WebLayout } from '@/components/layout/WebLayout';

const Stack = createStackNavigator();

export function AppNavigator() {
  const { isDesktop } = useResponsive();
  
  // Web 桌面版使用不同的導航策略
  if (Platform.OS === 'web' && isDesktop) {
    return (
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false, // 使用自定義 header
          }}
        >
          {/* 所有頁面都會被 WebLayout 包裝 */}
          <Stack.Screen name="App" component={AppWithWebLayout} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  // 行動版維持原有導航
  return (
    <NavigationContainer>
      {/* 原有的行動版導航配置 */}
    </NavigationContainer>
  );
}

function AppWithWebLayout() {
  // 這裡實作 Web 版的路由邏輯
  // 所有頁面都會自動獲得側邊欄
}
```

### 4.7 響應式表格優化
```typescript
// src/components/common/ResponsiveTable.tsx
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useResponsive } from '@/utils/responsive';

interface ResponsiveTableProps {
  columns: Array<{
    key: string;
    title: string;
    width?: number;
    minWidth?: number;
  }>;
  data: any[];
  renderCell: (item: any, column: any) => React.ReactNode;
}

export function ResponsiveTable({ columns, data, renderCell }: ResponsiveTableProps) {
  const { isDesktop, screenWidth } = useResponsive();
  
  if (!isDesktop) {
    // 行動版：卡片式佈局
    return (
      <View style={styles.mobileContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.mobileCard}>
            {columns.map(column => (
              <View key={column.key} style={styles.mobileRow}>
                <Text style={styles.mobileLabel}>{column.title}:</Text>
                <View style={styles.mobileValue}>
                  {renderCell(item, column)}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  }
  
  // 桌面版：傳統表格
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* 表頭 */}
        <View style={styles.tableHeader}>
          {columns.map(column => (
            <View 
              key={column.key} 
              style={[
                styles.tableCell,
                { 
                  width: column.width || 150,
                  minWidth: column.minWidth || 100
                }
              ]}
            >
              <Text style={styles.headerText}>{column.title}</Text>
            </View>
          ))}
        </View>
        
        {/* 表格內容 */}
        {data.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            {columns.map(column => (
              <View 
                key={column.key}
                style={[
                  styles.tableCell,
                  { 
                    width: column.width || 150,
                    minWidth: column.minWidth || 100
                  }
                ]}
              >
                {renderCell(item, column)}
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mobileContainer: {
    gap: 12
  },
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  mobileRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  mobileLabel: {
    fontSize: 14,
    color: '#666',
    width: 120
  },
  mobileValue: {
    flex: 1
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  tableCell: {
    padding: 12,
    justifyContent: 'center'
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  }
});
```

## 5. 實作步驟

### 第一階段：基礎架構（Day 1）
1. 建立響應式工具函數和 hooks
2. 實作 WebLayout 和 SidebarNavigation 元件
3. 設定全域佈局管理系統

### 第二階段：頁面改造（Day 2-3）
1. 改造所有主要頁面使用新佈局系統
2. 優化表格和列表在寬螢幕的顯示
3. 調整內容區域的最大寬度和間距

### 第三階段：細節優化（Day 4）
1. 實作側邊欄收合/展開動畫
2. 優化不同螢幕尺寸的斷點
3. 測試和修復跨瀏覽器相容性問題

## 6. 測試計劃

### 6.1 響應式測試
- 測試各種螢幕尺寸（手機、平板、筆電、桌機、寬螢幕）
- 測試視窗大小調整時的即時響應
- 測試橫豎屏切換

### 6.2 功能測試
- 側邊欄導航的所有連結
- 側邊欄收合/展開功能
- 內容區域的滾動和互動

### 6.3 相容性測試
- Chrome、Firefox、Safari、Edge
- 不同解析度和 DPI 設定

## 7. 預期成果

### 7.1 使用者體驗改善
- 桌面使用者獲得專業的工作環境
- 導航更直覺快速
- 空間利用更有效率

### 7.2 技術成果
- 完整的響應式佈局系統
- 可重用的佈局元件
- 統一的設計語言

## 8. 後續優化

### 8.1 進階功能
- 側邊欄項目的拖放排序
- 自定義佈局偏好設定
- 深色模式支援

### 8.2 效能優化
- 虛擬滾動大型列表
- 懶加載非當前頁面
- 響應式圖片載入

## 9. 成功指標

- 所有頁面在寬螢幕上都有側邊欄
- 內容區域適當利用螢幕空間
- 響應式斷點正確切換
- 使用者滿意度提升