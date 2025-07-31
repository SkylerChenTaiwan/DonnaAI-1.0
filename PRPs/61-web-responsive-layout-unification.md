# PRP-61: Web 響應式佈局統一化與完整實作

## 概述
本 PRP 旨在解決 Web 版 UI 無法正確適應橫向佈局的問題。經過深入研究發現，問題不在於 Expo 的限制，而是響應式佈局系統應用不完整。目前專案中存在三套並行的佈局系統，且僅部分頁面正確實作了橫向響應式佈局。

## 背景與問題分析

### 現有問題
1. **多重佈局系統並存**：UnifiedWebLayout、ResponsiveLayout、WebNavigator 三套系統各自為政
2. **應用範圍不完整**：只有少數頁面（如 OrganizationsScreen）正確使用了 UnifiedWebLayout
3. **斷點定義不一致**：useResponsiveLayout.ts 和 web.ts 中的斷點定義不同
4. **路由層級限制**：WebNavigator 只處理主要 Tab 頁面，不包含管理頁面

### 根本原因
- 不是 Expo/React Native Web 的技術限制
- 而是佈局系統應用不完整的架構性問題

## 實作目標

### 核心目標
1. 統一所有 Web 頁面使用 UnifiedWebLayout 系統
2. 建立一致的響應式斷點定義
3. 確保所有頁面在橫向模式下正確顯示側邊欄
4. 保持向後相容，不破壞現有功能

### 預期成果
- 所有 Web 頁面在桌面版顯示側邊欄導航
- 平板橫向模式下可切換側邊欄
- 統一的響應式體驗
- 清晰的佈局架構

## 技術方案

### 階段一：統一斷點系統（立即執行）

1. **合併斷點定義**
```typescript
// src/theme/responsive.ts - 新建統一的響應式配置
export const UNIFIED_BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
  wideScreen: 1920
};

export const SIDEBAR_BREAKPOINT = UNIFIED_BREAKPOINTS.tablet;
export const DESKTOP_BREAKPOINT = UNIFIED_BREAKPOINTS.desktop;
```

2. **更新所有引用**
- 將 useResponsiveLayout.ts 改為使用 UNIFIED_BREAKPOINTS
- 將 web.ts 的 breakpoints 改為引用 UNIFIED_BREAKPOINTS
- 搜尋並替換所有硬編碼的斷點值

### 階段二：擴展 WebNavigator 應用範圍

1. **將管理頁面納入 WebNavigator**
```typescript
// 需要新增的路由：
- UserManagementScreen
- AdminDashboard
- LegacyDataImportScreen
- 所有 Detail 頁面
```

2. **建立頁面分類系統**
```typescript
const PAGE_CATEGORIES = {
  tabs: ['Home', 'Database', 'Tools', 'Settings'],
  admin: ['Organizations', 'UserManagement', 'AdminDashboard'],
  details: ['CustomerDetail', 'RecordDetail', 'TaskDetail'],
  modals: ['CreateTask', 'CreateRecord', 'CreateCustomer']
};
```

### 階段三：全面遷移到 UnifiedWebLayout

1. **建立遷移清單**（按優先級排序）
   - 高優先級：所有管理頁面
   - 中優先級：詳細檢視頁面
   - 低優先級：Modal 和小工具頁面

2. **建立 HOC 簡化遷移**
```typescript
// src/components/layout/withUnifiedWebLayout.tsx
export function withUnifiedWebLayout(Component, options = {}) {
  return (props) => {
    const shouldUseWebLayout = Platform.OS === 'web' && 
      (isDesktopWeb() || isTabletWeb());
    
    if (shouldUseWebLayout) {
      return (
        <UnifiedWebLayout {...options}>
          <Component {...props} />
        </UnifiedWebLayout>
      );
    }
    
    return <Component {...props} />;
  };
}
```

3. **頁面遷移模板**
```typescript
// Before
export const SomeScreen = () => {
  return (
    <Layout>
      {/* content */}
    </Layout>
  );
};

// After
const SomeScreenContent = () => {
  return (
    <>
      {/* content */}
    </>
  );
};

export const SomeScreen = () => {
  const shouldUseWebLayout = Platform.OS === 'web' && 
    (isDesktopWeb() || isTabletWeb());
  
  if (shouldUseWebLayout) {
    return (
      <UnifiedWebLayout scrollable={true} maxWidth={1400}>
        <SomeScreenContent />
      </UnifiedWebLayout>
    );
  }
  
  return (
    <Layout>
      <SomeScreenContent />
    </Layout>
  );
};
```

### 階段四：統一樣式系統

1. **建立響應式樣式 Hook**
```typescript
export const useResponsiveStyles = () => {
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb();
  
  return {
    container: [
      styles.base,
      isDesktop && styles.desktop,
      isTablet && styles.tablet
    ],
    grid: {
      columns: isDesktop ? 3 : isTablet ? 2 : 1
    }
  };
};
```

2. **Web 特定樣式處理**
```typescript
const webStyles = StyleSheet.create({
  grid: {
    ...Platform.select({
      web: {
        display: 'grid' as any,
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
      },
      default: {
        flexDirection: 'row',
        flexWrap: 'wrap',
      }
    })
  }
});
```

## 實作步驟

### 步驟 1：準備工作（Day 1）
1. 建立 src/theme/responsive.ts 統一斷點定義
2. 建立遷移追蹤文件 docs/web-layout-migration.md
3. 備份現有程式碼並建立新分支

### 步驟 2：統一基礎設施（Day 1）
1. 更新所有斷點引用
2. 建立 withUnifiedWebLayout HOC
3. 更新 WebNavigator 路由配置

### 步驟 3：高優先級頁面遷移（Day 2）
1. UserManagementScreen
2. AdminDashboard  
3. 所有管理相關頁面

### 步驟 4：中優先級頁面遷移（Day 3）
1. CustomerDetailScreen
2. RecordDetailScreen
3. TaskDetailScreen
4. 其他詳細檢視頁面

### 步驟 5：低優先級頁面遷移（Day 4）
1. Modal 頁面
2. 小工具頁面
3. 設定子頁面

### 步驟 6：測試與優化（Day 5）
1. 全面測試所有頁面的響應式佈局
2. 修復發現的問題
3. 效能優化

## 驗證標準

### 自動化測試
```bash
# TypeScript 類型檢查
npm run typecheck

# ESLint 檢查
npm run lint

# 建置 Web 版本
npm run web:build

# 執行測試
npm test
```

### 手動測試清單
- [ ] 桌面版（1920x1080）：側邊欄始終顯示
- [ ] 桌面版（1024x768）：側邊欄正常顯示
- [ ] 平板橫向（1024x768）：側邊欄可切換
- [ ] 平板直向（768x1024）：顯示頂部導航
- [ ] 手機版（375x667）：只顯示頂部導航
- [ ] 所有頁面導航正常
- [ ] 無佈局跳動或閃爍

### 效能指標
- 頁面載入時間 < 2秒
- 響應式切換無明顯延遲
- 記憶體使用穩定

## 風險管理

### 潛在風險
1. **破壞現有功能**：透過漸進式遷移降低風險
2. **效能下降**：使用 React.memo 和 useMemo 優化
3. **類型錯誤**：逐步修復 TypeScript 類型定義

### 回滾計畫
1. 保留原有佈局系統作為備用
2. 使用功能開關控制新舊系統切換
3. 分階段部署，隨時可回滾

## 參考資源

### 內部檔案參考
- `/src/components/layout/UnifiedWebLayout.tsx` - 統一佈局組件
- `/src/screens/superadmin/OrganizationsScreen.tsx` - 正確實作範例
- `/src/utils/web-detector.ts` - 平台檢測工具
- `/src/navigation/AppNavigator.tsx` - 導航架構

### 外部文件
- [React Native Web 響應式設計](https://necolas.github.io/react-native-web/docs/styling/)
- [Expo Web 最佳實踐](https://docs.expo.dev/guides/web/)
- [CSS Grid 在 React Native Web](https://github.com/necolas/react-native-web/issues/1355)

## 成功標準

1. **功能完整性**：所有頁面都正確顯示響應式佈局
2. **一致性**：統一的斷點和樣式系統
3. **效能**：無明顯效能下降
4. **維護性**：清晰的架構，易於後續維護

## 實作信心評分：8/10

扣分原因：
- 需要遷移大量頁面，工作量較大（-1）
- 可能遇到未預期的相容性問題（-1）

加分原因：
- 現有 UnifiedWebLayout 已驗證可行（+2）
- 有明確的實作模板和範例（+1）
- 問題根源清楚，解決方案明確（+1）