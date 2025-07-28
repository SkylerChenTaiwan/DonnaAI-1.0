name: "Registration Flow Keyboard Handling Fix"
description: |

## Purpose
修復註冊頁面的鍵盤處理問題，確保輸入欄位不會被鍵盤遮擋，並實作自動滾動到焦點輸入框的功能。優化使用者註冊體驗，符合 React Native 最佳實踐。

## Core Principles
1. **Context is King**: 包含所有必要的文檔、範例和注意事項
2. **Validation Loops**: 提供可執行的測試來驗證修復效果
3. **Information Dense**: 使用專案中現有的模式和關鍵字
4. **Progressive Success**: 從簡單開始，驗證後再增強
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
修復註冊頁面的鍵盤問題，實現以下功能：
1. 鍵盤出現時，畫面高度自動調整為鍵盤以外的可用空間
2. 點擊輸入欄位時，如果該欄位可能被鍵盤遮擋，自動滾動確保可見
3. 簡化註冊表單，只保留必要欄位：姓名、電子郵件、公司名稱、密碼、確認密碼

## Why
- **商業價值**：改善用戶體驗，減少註冊過程中的摩擦
- **用戶影響**：解決輸入欄位被鍵盤遮擋的問題，提升註冊成功率
- **問題解決**：修復目前無法看到正在輸入的欄位，也無法滾動查看被遮擋內容的問題

## What
用戶可見行為：
- 鍵盤彈出時，畫面自動調整高度
- 點擊輸入框時，該輸入框自動滾動到可見區域
- 所有輸入欄位都能正常訪問和輸入
- 移除不必要的「職位角色」選擇器

技術需求：
- 使用 KeyboardAvoidingView 包裝表單
- 實作平台特定的鍵盤處理行為
- 保持現有的視覺設計和佈局

### Success Criteria
- [ ] 鍵盤出現時，畫面高度正確調整
- [ ] 所有輸入欄位在輸入時都可見
- [ ] iOS 和 Android 平台都能正常工作
- [ ] 表單簡化為只有 5 個必要欄位
- [ ] 保持現有的錯誤處理和驗證邏輯

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://reactnative.dev/docs/keyboardavoidingview
  why: React Native 官方 KeyboardAvoidingView 文檔，了解各個屬性用法
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/components/personnel/AddUserModal.tsx
  why: 專案中成功使用 KeyboardAvoidingView 的範例，包含平台特定設定
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/screens/auth/RegisterScreen.tsx
  why: 目前的註冊頁面實作，需要修改的目標文件
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/Layout.tsx
  why: 了解 Layout 元件的結構，確保兼容性

- doc: https://docs.expo.dev/guides/keyboard-handling/
  section: Keyboard handling in React Native
  critical: Expo 特定的鍵盤處理建議和最佳實踐
```

### Current Implementation Analysis
```typescript
// 當前問題：
// 1. RegisterScreen 使用 Layout 元件，但沒有鍵盤避讓功能
// 2. Layout 元件內部使用 ScrollView，但沒有 KeyboardAvoidingView
// 3. 表單包含不必要的職位角色選擇器

// 其他頁面的成功實作模式：
// AddUserModal.tsx 使用：
<KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={100}
>
  <ScrollView>
    {/* 表單內容 */}
  </ScrollView>
</KeyboardAvoidingView>
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: KeyboardAvoidingView 在不同平台表現不同
// iOS: behavior="padding" 通常效果最好
// Android: behavior="height" 或 "position" 效果較好

// GOTCHA: keyboardVerticalOffset 需要考慮 header 高度
// 如果有 SafeAreaView 或 navigation header，需要設定正確的 offset

// PATTERN: 專案中的模態框都使用 100 的 keyboardVerticalOffset
// 但全螢幕頁面可能需要不同的值

// CRITICAL: Layout 元件已經包含 ScrollView
// 需要避免雙重 ScrollView 嵌套
```

## Implementation Blueprint

### 任務列表（按執行順序）

```yaml
Task 1: 簡化註冊表單欄位
MODIFY src/screens/auth/RegisterScreen.tsx:
  - REMOVE: 職位角色選擇器（Picker 元件和相關狀態）
  - REMOVE: formData.role 相關邏輯
  - UPDATE: signUp 呼叫，移除 role 參數
  - PRESERVE: 現有的驗證邏輯和錯誤處理

Task 2: 修改 Layout 元件支援鍵盤避讓
MODIFY src/components/common/Layout.tsx:
  - ADD: KeyboardAvoidingView 作為外層包裝
  - ADD: 新的 prop: keyboardAvoidingEnabled (預設 false)
  - ADD: 新的 prop: keyboardVerticalOffset (預設 0)
  - PATTERN: 參考 AddUserModal 的實作方式
  - PRESERVE: 現有的 ScrollView 功能

Task 3: 更新 RegisterScreen 使用鍵盤避讓
MODIFY src/screens/auth/RegisterScreen.tsx:
  - UPDATE: Layout 使用新的 props
  - ADD: keyboardAvoidingEnabled={true}
  - ADD: 適當的 keyboardVerticalOffset
  - TEST: iOS 和 Android 平台

Task 4: 優化滾動行為
MODIFY src/screens/auth/RegisterScreen.tsx:
  - ENSURE: 輸入框獲得焦點時自動滾動
  - ADD: 必要的 ref 和滾動邏輯
  - TEST: 最下方的確認密碼欄位
```

### Per Task Implementation Details

```typescript
// Task 1: 簡化表單
// 移除以下程式碼區塊：
// 1. formData 中的 role: 'salesperson' as UserRole
// 2. Picker import
// 3. 整個 pickerContainer 區塊（行 151-164）
// 4. signUp 呼叫中的 role 參數

// Task 2: Layout 元件修改
interface LayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboardAvoidingEnabled?: boolean;  // 新增
  keyboardVerticalOffset?: number;     // 新增
}

// 實作邏輯：
const content = // 現有的 scrollable 邏輯

if (keyboardAvoidingEnabled) {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Task 3: RegisterScreen 更新
<Layout 
  keyboardAvoidingEnabled={true}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
>
  {/* 現有內容 */}
</Layout>
```

### Integration Points
```yaml
IMPORTS:
  - add to: src/components/common/Layout.tsx
  - import: "import { KeyboardAvoidingView, Platform } from 'react-native';"
  
TYPE UPDATES:
  - remove from: RegisterScreen formData type
  - field: "role: 'salesperson' as UserRole"
  
API CALLS:
  - update in: RegisterScreen handleRegister
  - remove: "role: formData.role" from signUp parameters
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# 執行這些命令，修復任何錯誤
npm run type-check              # TypeScript 檢查
npm run lint                    # ESLint 檢查

# 預期：無錯誤。如果有錯誤，閱讀並修復
```

### Level 2: Component Testing
```typescript
// 手動測試檢查清單：
// 1. 註冊頁面載入正常
// 2. 只顯示 5 個輸入欄位
// 3. 點擊各個輸入欄位，確認都能看到
// 4. 特別測試最下方的「確認密碼」欄位
// 5. 測試鍵盤收起時的行為
```

### Level 3: Platform Testing
```bash
# iOS 測試
npm run ios

# Android 測試  
npm run android

# 測試場景：
# 1. 開啟註冊頁面
# 2. 點擊每個輸入欄位
# 3. 確認輸入欄位都可見
# 4. 測試橫豎屏切換
# 5. 測試不同鍵盤高度（如第三方輸入法）
```

## Final Validation Checklist
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] iOS 平台鍵盤處理正常
- [ ] Android 平台鍵盤處理正常
- [ ] 所有輸入欄位在輸入時都可見
- [ ] 表單提交功能正常
- [ ] 錯誤處理和驗證邏輯保持不變
- [ ] 視覺設計保持一致

---

## Anti-Patterns to Avoid
- ❌ 不要使用嵌套的 ScrollView
- ❌ 不要硬編碼 keyboardVerticalOffset
- ❌ 不要忽略平台差異
- ❌ 不要破壞現有的 Layout 元件功能
- ❌ 不要移除必要的驗證邏輯
- ❌ 不要使用已棄用的 react-native-keyboard-aware-scroll-view

## Risk Mitigation
- 保持 Layout 元件的向後兼容性（新 props 有預設值）
- 只在需要的頁面啟用鍵盤避讓功能
- 充分測試不同設備和鍵盤配置
- 保留原有的錯誤處理邏輯

## Expected Outcome
完成後，用戶將能夠：
1. 順暢地填寫註冊表單
2. 始終看到正在輸入的欄位
3. 不需要手動關閉鍵盤來查看被遮擋的內容
4. 在 iOS 和 Android 上都有一致的體驗

---

**信心評分：8/10**
基於專案中已有成功的 KeyboardAvoidingView 實作範例，以及清晰的實施步驟，預期能夠一次性成功實現。主要風險在於不同平台的測試覆蓋度。