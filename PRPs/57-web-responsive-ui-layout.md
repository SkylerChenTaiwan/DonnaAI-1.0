# PRP-57: Web 響應式 UI/UX 橫式佈局實作

## 概述
將 DonnaAI 的行動裝置 UI 佈局適配為適合桌面瀏覽器的橫式響應式設計，提供更好的 Web 使用體驗。

## 背景
- 目前的 UI 設計以行動裝置為主，使用底部標籤導航
- Web 版本已部署到 Firebase Hosting（PRP-56）
- 現有響應式工具和 Web 檢測功能已建立（PRP-54）
- 需要針對桌面瀏覽器優化橫式佈局

## 目標
1. 實作桌面版橫式導航（側邊欄或頂部導航欄）
2. 建立響應式佈局系統，自動適配不同螢幕尺寸
3. 優化桌面版的內容呈現和互動體驗
4. 保持行動版和桌面版的視覺一致性

## 為什麼需要這個功能
- **更好的螢幕利用**：桌面螢幕較大，橫式佈局能更有效利用空間
- **符合使用習慣**：桌面用戶習慣側邊欄或頂部導航
- **提升工作效率**：橫式佈局可同時顯示更多資訊
- **專業形象**：提供專業的桌面版體驗

## 實作需求

### 使用者可見行為
1. **桌面版（≥1024px）**
   - 側邊欄導航取代底部標籤
   - 內容區域最大寬度限制（1200px）
   - 多欄式佈局顯示更多資訊

2. **平板版（768px-1023px）**
   - 可收合的側邊欄
   - 適應性內容佈局

3. **手機版（<768px）**
   - 保持現有底部標籤導航
   - 維持垂直滾動體驗

### 技術需求
1. 建立 WebNavigator 元件處理桌面導航
2. 使用現有響應式工具（src/styles/web.ts）
3. 整合平台檢測（src/utils/web-detector.ts）
4. 保持現有功能完整性

## 實作藍圖

### 現有資源參考

#### 響應式工具（src/styles/web.ts）
```typescript
// 響應式斷點
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

// 響應式樣式助手
export const responsive = <T>(styles: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  default: T;
}): T => { ... };

// 側邊欄佈局樣式
export const webStyles = StyleSheet.create({
  sidebarLayout: { ... },
  sidebar: { ... },
  mainContent: { ... },
});
```

#### 平台檢測（src/utils/web-detector.ts）
```typescript
export const isDesktopWeb = (): boolean => {
  return isWebPlatform() && !isMobileWeb() && !isTabletWeb();
};

export const getWebScreenInfo = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: width > height ? 'landscape' : 'portrait',
  };
};
```

#### 現有導航（src/navigation/MainTabNavigator.tsx）
- 使用 @react-navigation/bottom-tabs
- 五個主要頁面：首頁、資料庫、新增、工具、設定
- 中間按鈕根據模式切換功能

### 任務清單

#### 任務 1：建立 WebNavigator 元件
建立新的導航元件專門處理 Web 桌面版佈局：

```typescript
// src/navigation/WebNavigator.tsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { webStyles, responsive } from '@/styles/web';

export const WebNavigator = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const showSidebar = isDesktopWeb() || (isTabletWeb() && !sidebarCollapsed);
  
  return (
    <View style={styles.container}>
      {showSidebar && <Sidebar collapsed={sidebarCollapsed} />}
      <View style={styles.mainContent}>
        <TopBar onMenuPress={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <ScrollView style={styles.contentScroll}>
          {/* 路由內容 */}
        </ScrollView>
      </View>
    </View>
  );
};
```

#### 任務 2：建立側邊欄導航元件
實作桌面版的垂直導航欄：

```typescript
// src/components/navigation/Sidebar.tsx
interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const menuItems = [
    { id: 'home', label: '首頁', icon: 'analytics-outline' },
    { id: 'database', label: '資料庫', icon: 'people-outline' },
    { id: 'tools', label: '小工具', icon: 'build-outline' },
    { id: 'settings', label: '設定', icon: 'person-outline' },
  ];
  
  return (
    <View style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
      {/* Logo 區域 */}
      <View style={styles.logoArea}>
        <Image source={donnaLogo} style={styles.logo} />
        {!collapsed && <Text style={styles.logoText}>DonnaAI</Text>}
      </View>
      
      {/* 導航項目 */}
      {menuItems.map(item => (
        <TouchableOpacity
          key={item.id}
          style={[styles.menuItem, route.name === item.id && styles.menuItemActive]}
          onPress={() => navigation.navigate(item.id)}
        >
          <Ionicons name={item.icon} size={24} />
          {!collapsed && <Text style={styles.menuLabel}>{item.label}</Text>}
        </TouchableOpacity>
      ))}
      
      {/* 中央操作按鈕 */}
      <View style={styles.actionButton}>
        <ActionButton />
      </View>
    </View>
  );
};
```

#### 任務 3：更新 AppNavigator 以支援響應式導航
修改主導航器根據平台選擇適當的導航方式：

```typescript
// src/navigation/AppNavigator.tsx
import { MainTabNavigator } from './MainTabNavigator';
import { WebNavigator } from './WebNavigator';
import { isWebPlatform, isDesktopWeb } from '@/utils/web-detector';

export const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();
  
  // 根據平台和螢幕大小選擇導航器
  const shouldUseWebNav = isWebPlatform() && (isDesktopWeb() || isTabletWeb());
  
  return (
    <NavigationContainer>
      {isAuthenticated ? (
        shouldUseWebNav ? <WebNavigator /> : <MainTabNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};
```

#### 任務 4：建立響應式佈局元件
建立統一的響應式佈局容器：

```typescript
// src/components/common/ResponsiveLayout.tsx
interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  sidebar,
  header,
}) => {
  const screenInfo = getWebScreenInfo();
  const isDesktop = isDesktopWeb();
  
  if (!isWebPlatform()) {
    // 原生平台使用原本的佈局
    return <>{children}</>;
  }
  
  return (
    <View style={styles.container}>
      {isDesktop && sidebar && (
        <View style={webStyles.sidebar}>{sidebar}</View>
      )}
      <View style={webStyles.mainContent}>
        {header && <View style={styles.header}>{header}</View>}
        <ScrollView style={webStyles.scrollView}>
          <View style={[webStyles.container, styles.content]}>
            {children}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
```

#### 任務 5：更新現有頁面以支援響應式佈局
更新主要頁面元件以適應橫式佈局：

```typescript
// 範例：更新 DatabaseScreen
export const DatabaseScreen = () => {
  const isDesktop = isDesktopWeb();
  
  return (
    <ResponsiveLayout>
      <View style={responsive({
        mobile: styles.mobileContainer,
        desktop: styles.desktopContainer,
        default: styles.mobileContainer,
      })}>
        {/* 桌面版使用多欄佈局 */}
        {isDesktop ? (
          <View style={styles.desktopGrid}>
            <View style={styles.sidePanel}>
              {/* 篩選器和操作 */}
            </View>
            <View style={styles.mainPanel}>
              {/* 資料表格 */}
            </View>
          </View>
        ) : (
          /* 行動版保持原樣 */
          <View style={styles.mobileLayout}>
            {/* 原有內容 */}
          </View>
        )}
      </View>
    </ResponsiveLayout>
  );
};
```

#### 任務 6：優化互動體驗
添加桌面特有的互動效果：

```typescript
// 滑鼠懸停效果
const hoverStyles = desktopOnly({
  ':hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    transform: [{ scale: 1.02 }],
  },
});

// 鍵盤快捷鍵
useEffect(() => {
  if (!isDesktopWeb()) return;
  
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case '1': navigation.navigate('Home'); break;
        case '2': navigation.navigate('Database'); break;
        // ...
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### 樣式規範

#### 側邊欄樣式
```typescript
const sidebarStyles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: DesignSystem.colors.background.surface,
    borderRightWidth: 1,
    borderRightColor: DesignSystem.colors.border.light,
    paddingVertical: 24,
    ...shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    ...transitions.fast,
  },
  menuItemActive: {
    backgroundColor: DesignSystem.colors.button.secondary.default,
    borderLeftWidth: 3,
    borderLeftColor: DesignSystem.colors.primary,
  },
});
```

#### 響應式網格
```typescript
const gridStyles = StyleSheet.create({
  desktopGrid: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: 24,
    padding: 24,
  },
  tabletGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: 16,
    padding: 16,
  },
});
```

## 驗證步驟

### 1. 響應式測試
```bash
# 開發環境測試
npm run web:dev

# 測試不同視窗大小
# - 桌面: 1440px, 1200px, 1024px
# - 平板: 768px, 900px
# - 手機: 375px, 414px
```

### 2. 功能測試清單
- [ ] 導航切換正常運作
- [ ] 所有頁面在不同尺寸下正常顯示
- [ ] 側邊欄收合功能（平板）
- [ ] 鍵盤快捷鍵（桌面）
- [ ] 滑鼠互動效果

### 3. 效能測試
```typescript
// 檢查重新渲染
console.log('Screen resize count:', resizeCount);
// 應該使用 debounce 避免過度渲染
```

## 潛在問題和解決方案

### 1. React Navigation 相容性
React Navigation 主要為原生應用設計，Web 支援可能有限制：
- 解決方案：使用條件渲染，Web 版使用自訂導航

### 2. 樣式衝突
Web 和原生樣式系統不完全相同：
- 解決方案：使用 Platform.select 和 webOnly 助手函數

### 3. 效能考量
響應式監聽可能影響效能：
- 解決方案：使用 debounce 和 React.memo 優化

## 成功標準
- [ ] 桌面版顯示側邊欄導航
- [ ] 平板版支援收合式側邊欄
- [ ] 手機版保持原有底部導航
- [ ] 所有功能在各尺寸下正常運作
- [ ] 視覺風格保持一致

## 參考資源
- React Native Web 響應式設計：https://necolas.github.io/react-native-web/docs/styling/
- CSS Grid for React Native：https://github.com/pmndrs/react-native-web-grid
- 響應式設計最佳實踐：https://web.dev/responsive-web-design-basics/

---
**實作複雜度**：中等
**預估時間**：2-3 天
**置信度評分**：8/10

此 PRP 提供完整的響應式 Web UI 實作方案，充分利用現有的響應式工具和設計系統，確保桌面和行動體驗的一致性。