# PRP-18: Web 佈局架構統一優化

## 問題描述

目前 DonnaAI Web 版本存在嚴重的佈局架構問題：

### 1. 側邊欄不一致問題
- **混用多種佈局系統**：`Layout`、`UnifiedWebLayout`、`migrateToUnifiedWebLayout` 三種系統混用
- **React Navigation header 與側邊欄衝突**：某些頁面（如 OrganizationsScreen）的原生 header 橫跨整個螢幕，覆蓋側邊欄
- **側邊欄寬度和收合功能不一致**：不同頁面的側邊欄行為不同

### 2. 響應式設計問題
- **大部分頁面未針對 Web 橫向螢幕優化**：仍使用移動端的 Layout 元件
- **內容區域未設定最大寬度**：在大螢幕上內容過度延伸
- **斷點系統未統一使用**：雖有 `UNIFIED_BREAKPOINTS` 但未全面實施

### 3. Icon 顯示問題
- **許多 Icon 缺少 SVG 路徑定義**：導致顯示為空方框
- **部分功能按鈕無法正常顯示**

## 現況分析

### 佈局系統使用統計
```
總頁面數: 50+
使用 Layout: 45 個頁面
使用 UnifiedWebLayout: 3 個頁面
使用 migrateToUnifiedWebLayout: 3 個頁面
```

### 問題頁面列表
```
有 headerShown: true 且需要側邊欄的頁面：
- OrganizationsScreen
- CreateOrganizationScreen
- PlatformDashboard
- AdminDashboard
- UserManagementScreen
- ToolManagementScreen
- DataImportScreen
- UsageReportsScreen
```

## 解決方案

### 第一階段：建立統一的佈局決策系統

#### 1.1 創建佈局配置映射表
```typescript
// src/navigation/layoutConfig.ts
export const LAYOUT_CONFIG = {
  // 需要側邊欄的頁面（使用 UnifiedWebLayout）
  withSidebar: [
    'Home', 'Database', 'Tools', 'Settings',
    'OrganizationsScreen', 'OrganizationDetailScreen',
    'AdminDashboard', 'UserManagementScreen',
    'CustomerDetail', 'RecordDetail', 'TaskDetail'
  ],
  
  // 不需要側邊欄的頁面（使用基本 Layout）
  withoutSidebar: [
    'Login', 'Register', 'ForgotPassword',
    'CreateCustomerModal', 'EditCustomerModal',
    'CreateRecordModal', 'EditRecordModal'
  ],
  
  // 需要原生 header 的頁面
  withNativeHeader: [
    'HelpSupport', 'PrivacyPolicy'
  ]
};
```

#### 1.2 修改 AppNavigator 配置
```typescript
// 根據 layoutConfig 自動設定 headerShown
screens.forEach(screen => {
  if (LAYOUT_CONFIG.withSidebar.includes(screen.name)) {
    screen.options.headerShown = false; // 使用自定義 header
  }
});
```

### 第二階段：統一佈局元件實作

#### 2.1 創建智能佈局包裝元件
```typescript
// src/components/layout/SmartLayout.tsx
export const SmartLayout: React.FC<SmartLayoutProps> = ({
  children,
  screenName,
  scrollable = true,
  customHeader
}) => {
  const isWeb = Platform.OS === 'web';
  const needsSidebar = LAYOUT_CONFIG.withSidebar.includes(screenName);
  
  if (isWeb && needsSidebar) {
    return (
      <UnifiedWebLayout scrollable={scrollable}>
        {customHeader}
        {children}
      </UnifiedWebLayout>
    );
  }
  
  return (
    <Layout scrollable={scrollable}>
      {customHeader}
      {children}
    </Layout>
  );
};
```

#### 2.2 修復 UnifiedWebLayout 的問題
```typescript
// 確保側邊欄寬度一致
const SIDEBAR_WIDTH = {
  expanded: 280,
  collapsed: 64
};

// 修復主內容區域的樣式
mainContent: {
  flex: 1,
  marginLeft: sidebarExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed,
  transition: 'margin-left 0.3s ease', // 平滑過渡
}
```

### 第三階段：響應式設計優化

#### 3.1 為每個主要頁面添加響應式容器
```typescript
// src/components/layout/ResponsiveContainer.tsx
export const ResponsiveContainer: React.FC = ({ children }) => {
  const breakpoint = useBreakpoint();
  const config = getContentConfig(breakpoint);
  
  return (
    <View style={{
      maxWidth: config.maxWidth,
      padding: config.padding,
      alignSelf: 'center',
      width: '100%'
    }}>
      {children}
    </View>
  );
};
```

#### 3.2 優化網格佈局
```typescript
// 根據螢幕寬度自動調整列數
const getGridColumns = (breakpoint: Breakpoint) => {
  switch(breakpoint) {
    case 'mobile': return 1;
    case 'tablet': return 2;
    case 'desktop': return 3;
    case 'largeDesktop': return 4;
    default: return 1;
  }
};
```

### 第四階段：修復 Icon 問題

#### 4.1 補充缺失的 Icon SVG 路徑
```typescript
// 新增常用但缺失的 icons
const additionalIcons = {
  'pencil-outline': 'M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z',
  'eye-outline': 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
  'share-outline': 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z'
};
```

#### 4.2 創建 Icon 驗證工具
```typescript
// scripts/validate-icons.ts
const validateIcons = () => {
  const usedIcons = findAllUsedIcons(); // 掃描所有檔案
  const definedIcons = Object.keys(iconSvgPaths);
  const missingIcons = usedIcons.filter(icon => !definedIcons.includes(icon));
  
  console.log('Missing icons:', missingIcons);
  return missingIcons;
};
```

## 實施計劃

### Phase 1: 準備工作（1-2 天）
1. ✅ 建立 layoutConfig.ts 配置檔
2. ✅ 創建 SmartLayout 元件
3. ✅ 更新 AppNavigator 配置邏輯

### Phase 2: 統一佈局系統（3-4 天）
1. ✅ 替換主要頁面的 Layout → SmartLayout (已完成 5 個關鍵頁面)
2. ✅ 移除 migrateToUnifiedWebLayout 相關程式碼
3. ✅ 修復側邊欄寬度和動畫問題 (220px/80px)

### Phase 3: 響應式優化（2-3 天）
1. ⏳ 為主要頁面添加 ResponsiveContainer
2. ⏳ 優化表格和列表的響應式顯示
3. ⏳ 測試不同螢幕尺寸的顯示效果

### Phase 4: Icon 系統完善（1 天）
1. ⏳ 補充所有缺失的 Icon SVG 路徑
2. ⏳ 建立 Icon 驗證和自動化工具
3. ⏳ 更新 Icon 使用文檔

## 驗證方式

### 自動化測試
```bash
# 執行佈局測試
npm run test:layout

# 檢查 Icon 完整性
npm run validate:icons

# 響應式測試
npm run test:responsive
```

### 手動測試檢查清單
- [ ] 所有頁面的側邊欄寬度一致
- [ ] 側邊欄收合/展開動畫流暢
- [ ] 沒有 header 重疊問題
- [ ] 大螢幕內容有適當的最大寬度
- [ ] 所有 Icon 正確顯示
- [ ] 響應式斷點切換正常

## 風險評估

### 高風險
- **大規模修改可能引入新 bug**：需要分階段實施，每階段充分測試
- **性能影響**：UnifiedWebLayout 可能增加渲染成本

### 中風險
- **向後相容性**：某些第三方元件可能依賴現有佈局
- **學習成本**：團隊需要熟悉新的佈局系統

### 低風險
- **Icon 系統修改**：相對獨立，影響範圍小

## 預期成果

1. **統一的佈局體驗**：所有頁面使用一致的側邊欄和導航
2. **優秀的響應式設計**：自動適應各種螢幕尺寸
3. **完整的 Icon 系統**：所有圖標正確顯示
4. **更好的可維護性**：集中化的配置管理
5. **提升用戶體驗**：流暢的動畫和一致的視覺體驗

## 成功指標

- 側邊欄在所有頁面表現一致：100%
- Icon 顯示正確率：100%
- 響應式斷點覆蓋率：> 90%
- 頁面載入時間：< 2秒
- 用戶滿意度：提升 30%

## 相關文件

- [響應式設計規範](../docs/responsive-design.md)
- [Icon 系統文檔](../docs/icon-system.md)
- [佈局系統架構](../ARCHITECTURE.md#layout-system)

## 實施團隊

- 前端架構師：負責整體方案設計
- UI/UX 設計師：確保視覺一致性
- 前端工程師 x2：實施佈局修改
- QA 工程師：測試各種裝置和瀏覽器

---

**信心評分：8/10**

此 PRP 提供了完整的問題分析、解決方案和實施計劃。透過分階段實施和充分測試，可以有效解決現有的 Web 佈局問題，提供更好的用戶體驗。