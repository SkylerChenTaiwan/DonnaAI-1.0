# Web 平台與 Adaptive 元件開發指南

## 🎨 顏色系統規範

### ❌ 禁止使用
- `color + 'XX'` 格式處理透明度 - 會導致 Web 平台 CSSStyleDeclaration 錯誤

### ✅ 必須使用
- `withAlpha(color, alpha)` 函數處理顏色透明度
- 參考文件：`/docs/COLOR-SYSTEM-MIGRATION.md`
- 自動修復：執行 `node scripts/fix-color-styles.js`

## 🌐 Web 平台樣式系統

### 問題背景
React Native Web 樣式經常被全域 CSS（如 NotionDatabaseV4.css）覆蓋

### 解決方案
Web 平台使用原生 HTML 元素 + 內聯樣式

### 實作範例
```typescript
if (Platform.OS === 'web') {
  // 使用原生 HTML + 內聯樣式（優先級最高）
  return <input style={{ padding: '12px 16px', border: '1px solid #E3E1DC' }} />;
}
// Native 平台使用 React Native 元件
return <TextInput style={styles.input} />;
```

### 必讀文件
- `/docs/WEB-STYLE-SYSTEM.md` - 詳細問題分析和解決方案
- `/docs/STYLE-DEVELOPMENT-GUIDE.md` - 開發指南和檢查清單

### 開發前檢查
1. 是否有全域 CSS 會影響？
2. 是否需要為 Web 平台特殊處理？
3. 內聯樣式是否完整？

### 部署前清理快取
```bash
rm -rf .expo node_modules/.cache
npm run web:build
```

## 🎯 Adaptive 元件使用規範

### 元件使用決策流程
```
需要 UI 元件？
    ↓
檢查 Adaptive 元件庫 (@/components/adaptive)
    ↓
┌─ 存在 → 使用 Adaptive 元件 ✅
│
└─ 不存在 → 使用頻率？
            ├─ 高頻(3+處) → 建立新 Adaptive 元件 → 加入元件庫
            └─ 低頻(1-2處) → Platform.OS？
                           ├─ Web → 原生 HTML + 內聯樣式
                           └─ Native → React Native 元件
```

### 🚫 禁用元件黑名單
| ❌ 絕對不要用 | ✅ 必須使用 | 原因 | VS Code 快捷鍵 |
|--------------|------------|------|---------------|
| Switch (react-native) | AdaptiveSwitch | 樣式被覆蓋 | `ias` |
| Picker | AdaptiveSelect | 背景透明問題 | `iase` |
| TextInput (直接) | AdaptiveInput | 樣式不一致 | `iai` |
| Modal (直接) | AdaptiveModal | 顯示問題 | `iam` |
| Button (直接) | AdaptiveButton | 顏色問題 | `iab` |

### ✅ 可用 Adaptive 元件清單
```typescript
// 從 @/components/adaptive 匯入
import {
  // 基礎元件
  AdaptiveButton,    // 按鈕元件
  AdaptiveModal,     // 模態框
  AdaptiveSelect,    // 下拉選單
  AdaptiveInput,     // 輸入框
  AdaptiveText,      // 文字元件
  AdaptiveView,      // 容器元件
  AdaptiveImage,     // 圖片元件
  
  // 表單元件
  AdaptiveSwitch,    // 開關
  AdaptiveCheckbox,  // 複選框
  AdaptiveRadio,     // 單選按鈕
  AdaptiveRadioGroup,// 單選群組
  AdaptiveSearchBar, // 搜尋欄
  AdaptiveDatePicker,// 日期選擇器
  AdaptiveSlider,    // 滑動條
  
  // UI 容器元件
  AdaptiveCard,      // 卡片容器
  AdaptiveDivider,   // 分隔線
  AdaptiveAvatar,    // 頭像
  
  // 互動元件
  AdaptiveTabs,      // 標籤頁
} from '@/components/adaptive';
```

### 建立新 Adaptive 元件 SOP
1. **建立目錄結構**
   ```
   src/components/adaptive/core/AdaptiveXXX/
   ├── index.tsx           # Platform.select 入口
   ├── AdaptiveXXX.web.tsx # Web 版本（內聯樣式）
   ├── AdaptiveXXX.native.tsx # Native 版本
   ├── AdaptiveXXX.types.ts # 類型定義
   └── __tests__/
       └── AdaptiveXXX.test.tsx
   ```

2. **實作 Web 版本重點**
   - 必須使用原生 HTML 元素
   - 必須使用內聯樣式（style 屬性）
   - 避免使用 className 或外部 CSS

3. **更新匯出**
   - 加入 `/src/components/adaptive/core/index.ts`
   - 更新 CLAUDE.md 的元件清單

### 監控和報告
執行 `npm run adaptive:stats` 查看：
- Adaptive 元件使用覆蓋率
- 需要修正的檔案清單
- 建議新增的 Adaptive 元件

## 🎨 UI/UX 開發原則

### 避免重複實作
- **避免重複的標題區塊** - 如果 Layout 元件已經提供 header 功能，不要在內容中再建立一個標題區塊
- **善用 Layout headerProps** - 使用 `headerProps` 屬性設定標題、返回按鈕、右側元件等
- **保持一致的導航體驗** - 不要在不同頁面使用不同的 header 樣式
- **避免重複實作導航元件** - 使用統一的 Layout 元件管理所有頁面的 header、返回按鈕等