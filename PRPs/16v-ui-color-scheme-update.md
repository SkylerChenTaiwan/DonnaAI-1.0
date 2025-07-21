# PRP #16: UI 色彩主題系統更新

## 專案背景
DonnaAI 專案需要更新整體視覺風格，從 iOS 風格的藍色主題轉換為暖色調的橘色系主題。顏色定義已在設計規格文件中統一管理。

## 實作目標
將整個應用程式的配色從 iOS 風格藍色主題更換為暖色調的橘色系主題，直接修改現有元件中的顏色值，參考設計規格文件 `/PRPs/design-specs/04-frontend-pages-design-spec.md` 中定義的新色彩系統。

## 現況分析

### 當前顏色系統
- **散落定義**：顏色直接硬編碼在各元件的 `StyleSheet.create()` 中
- **主要使用色**：
  - 主色：`#007AFF` (iOS 藍)
  - 背景：`#F8F9FA`, `#F2F2F7`, `#FFFFFF`
  - 文字：`#1C1C1E` (主要), `#8E8E93` (次要)
  - 邊框：`#E5E5EA`
  - 危險色：`#FF3B30`
  - 成功色：`#34C759`

### 需要修改的檔案範圍
約 50+ 個檔案，包括：
- 所有 Screen 元件 (`/src/screens/`)
- 所有 Modal 元件 (`/src/screens/modals/`)
- 通用元件 (`/src/components/common/`)
- 導航元件 (`/src/navigation/`)

## 新色彩方案

```typescript
// 主要色彩
const colors = {
  // Primary Colors
  primary: "#FF5C00",          // 主橘色（選中/互動強調）
  primaryLight: "#FFA87A",     // 橘色 hover 狀態
  primaryDark: "#C74A00",      // 深橘按下狀態

  // Background Colors
  background: "#ECE9E3",       // 主背景色（沙灰米白）
  cardBackground: "#F7F6F3",   // 卡片背景（略白）
  sectionBackground: "#E1DFDB", // 區塊背景（低對比灰沙色）

  // Text Colors
  textPrimary: "#1A1A1A",      // 主要文字（霧黑）
  textSecondary: "#7A7A7A",    // 次要文字（柔和灰）
  textDisabled: "#BEBEBE",     // 停用文字（淡灰）

  // Status Colors
  success: "#227A63",          // 深墨綠（成功）
  warning: "#B96A00",          // 橘褐色（警告）
  error: "#A94438",            // 磚紅（錯誤）
  info: "#5A6770",             // 中性灰藍（資訊）

  // Border Colors
  borderLight: "#E3E1DC",      // 卡片邊界用
  borderMedium: "#CAC7C1",     // 分隔線用
  borderDark: "#9C9993",       // 強調輪廓用
};
```

## 實作方案

### 第一階段：建立主題系統

1. **建立顏色定義檔案** `/src/theme/colors.ts`
```typescript
export const colors = {
  // [新色彩方案定義]
};

// 語意化別名
export const theme = {
  // 按鈕
  buttonPrimary: colors.primary,
  buttonPrimaryHover: colors.primaryLight,
  buttonPrimaryPressed: colors.primaryDark,
  
  // 背景
  backgroundMain: colors.background,
  backgroundCard: colors.cardBackground,
  backgroundSection: colors.sectionBackground,
  
  // 其他元件顏色映射
};
```

2. **建立主題匯出檔案** `/src/theme/index.ts`
```typescript
export { colors, theme } from './colors';
export type { ColorScheme } from './types';
```

### 第二階段：元件遷移策略

#### 範例：Button.tsx 修改模式
**原始碼 (src/components/common/Button.tsx:71-91)**：
```typescript
const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#007AFF',
  },
  outline: {
    borderColor: '#007AFF',
  },
});
```

**修改後**：
```typescript
// 直接使用新的顏色值

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#FF5C00',  // 主橘色
  },
  outline: {
    borderColor: '#FF5C00',      // 主橘色
  },
});
```

### 顏色映射規則

| 舊顏色 | 新顏色 | 使用場景 |
|--------|------------|----------|
| `#007AFF` | `#FF5C00` | 主要按鈕、連結、選中狀態 |
| `#F8F9FA` | `#ECE9E3` | 主背景色 |
| `#F2F2F7` | `#E1DFDB` | 區塊背景、hover 狀態 |
| `#FFFFFF` | `#F7F6F3` | 卡片背景 |
| `#1C1C1E` | `#1A1A1A` | 主要文字 |
| `#8E8E93` | `#7A7A7A` | 次要文字、標籤 |
| `#C7C7CC` | `#BEBEBE` | 停用文字 |
| `#E5E5EA` | `#E3E1DC` | 邊框、分隔線 |
| `#FF3B30` | `#A94438` | 錯誤、刪除按鈕 |
| `#34C759` | `#227A63` | 成功狀態 |
| `#FF9500` | `#B96A00` | 警告狀態 |
| `#5AC8FA` | `#5A6770` | 資訊狀態 |

## 實作步驟清單

### 核心元件更新（優先順序高）
4. ✅ 更新 Button.tsx - 按鈕顏色
5. ✅ 更新 DataTable.tsx - 表格背景和邊框
6. ✅ 更新 SearchBar.tsx - 搜尋框樣式
7. ✅ 更新 FilterModal.tsx - 篩選器顏色
8. ✅ 更新 TextInput.tsx - 輸入框樣式

### 導航元件更新
9. ✅ 更新 MainTabNavigator.tsx - Tab 選中顏色
10. ✅ 更新 AppNavigator.tsx - 標題列顏色

### 畫面元件更新
11. ✅ 更新 DatabaseScreen.tsx - 資料庫頁面
12. ✅ 更新 CustomersScreen.tsx - 客戶頁面
13. ✅ 更新 MeetingsScreen.tsx - 會議頁面
14. ✅ 更新 ToolsScreen.tsx - 工具頁面
15. ✅ 更新 SettingsScreen.tsx - 設定頁面

### Modal 元件更新
16. ✅ 更新 CreateCustomerModal.tsx
17. ✅ 更新 EditCustomerModal.tsx
18. ✅ 更新 CreateRecordModal.tsx
19. ✅ 更新 EditRecordModal.tsx
20. ✅ 更新 CreateTaskModal.tsx
21. ✅ 更新 EditTaskModal.tsx

### 其他元件更新
22. ✅ 更新所有剩餘使用顏色的元件

### 最終驗證
23. ✅ 執行完整應用程式測試
24. ✅ 檢查深色模式相容性（如有）
25. ✅ 更新文件說明新的主題系統

## 技術考量

### React Native 特殊性
- 使用 `StyleSheet.create()` 而非 CSS
- 直接在各元件中修改顏色值
- 顏色必須是有效的 hex、rgb 或顏色名稱

### 實作方式
- 直接搜尋並替換舊顏色值
- 參考設計規格文件確保一致性
- 使用 `StyleSheet.create()` 來優化樣式物件

### 程式碼範例參考
**現有 Button.tsx 顏色使用模式**：
```typescript
// src/components/common/Button.tsx:61
color={variant === 'primary' ? '#FFFFFF' : '#007AFF'}

// src/components/common/Button.tsx:81
backgroundColor: '#007AFF',
```

**現有 DataTable.tsx 背景色模式**：
```typescript
// src/components/common/DataTable.tsx:214
backgroundColor: '#F8F9FA',
```

## 驗證步驟

```bash
# 1. 語法檢查
npm run lint

# 2. TypeScript 類型檢查  
npm run typecheck

# 3. 執行測試
npm test

# 4. 啟動開發伺服器測試 UI
npm start
```

## 注意事項與陷阱

1. **ActivityIndicator 顏色**
   - React Native 的 ActivityIndicator 元件 `color` prop 需要特別處理
   - 範例：`src/components/common/Button.tsx:61`

2. **Icon 顏色**
   - Expo Icons (Ionicons) 使用 `color` prop
   - 需要根據背景調整圖標顏色以保持對比度

3. **陰影顏色**
   - iOS 陰影使用 `shadowColor`
   - Android 使用 `elevation`，顏色由系統決定

4. **狀態列顏色**
   - StatusBar 元件可能需要根據新背景色調整
   - 考慮使用 `dark-content` 或 `light-content`

5. **漸進式遷移**
   - 可以分批次更新元件，主題系統建立後逐步遷移
   - 優先更新最常用的元件

## 參考資源

### 內部檔案參考
- 顏色使用範例：`/src/components/common/Button.tsx`
- 樣式定義模式：`/src/components/common/DataTable.tsx`
- Modal 樣式：`/src/components/common/FilterModal.tsx`

### 外部資源
- [React Native StyleSheet API](https://reactnative.dev/docs/stylesheet)
- [React Native 顏色參考](https://reactnative.dev/docs/colors)
- [設計系統最佳實踐](https://www.designsystems.com/how-to-manage-color-themes-in-a-design-system/)

## 成功標準

1. 所有舊顏色都已替換為新的橘色系顏色
2. 應用程式視覺風格統一為暖色調
3. 與設計規格文件保持一致
4. 無視覺錯誤或對比度問題
5. 通過所有自動化測試

## PRP 信心評分

**評分：9/10**

高信心原因：
- 清晰的實作路徑和範例
- 完整的檔案清單和修改模式
- 具體的驗證步驟
- 考慮了 React Native 特殊性

扣分原因：
- 需要修改大量檔案（50+），執行時間較長