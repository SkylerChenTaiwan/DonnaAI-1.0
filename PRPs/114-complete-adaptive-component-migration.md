# PRP-114: 全面完成 Adaptive 元件遷移和 Web 樣式問題修正

## 問題概述

儘管已完成 PRP-110~113 建立了完整的 Adaptive 元件庫，但實際應用中發現：

### 當前狀況分析
- ❌ **僅 4 個檔案使用 Adaptive 元件，覆蓋率極低（1.4%）**
- ❌ **276 個檔案仍使用 react-native 原生元件**
- ❌ **32 個檔案使用 common/Button 而非 AdaptiveButton**
- ❌ **7 個檔案使用 common/TextInput 而非 AdaptiveInput**
- ❌ **4 個檔案直接使用 react-native Switch**

### Web 平台實際問題
1. **Switch 軌道深灰色 + 黑色字體** - 對比度不足，閱讀困難
2. **Picker 背景透明** - 選項無法清楚看見
3. **Button 黑字黑底** - 被全域 CSS 覆蓋樣式

## 解決策略

### Phase 1: 自動化檢測與統計
1. 建立檢測腳本找出所有問題檔案
2. 產生詳細的遷移清單和優先級排序
3. 建立進度追蹤機制

### Phase 2: 批量自動替換
1. **優先修正高頻使用元件**：
   - Switch → AdaptiveSwitch（4 個檔案）
   - common/Button → AdaptiveButton（32 個檔案）
   - common/TextInput → AdaptiveInput（7 個檔案）

2. **系統性替換 react-native 匯入**：
   - TextInput → AdaptiveInput
   - Button → AdaptiveButton
   - Modal → AdaptiveModal
   - 其他問題元件

### Phase 3: 驗證與測試
1. Web 平台功能驗證
2. Native 平台相容性確認
3. 使用者體驗測試

### Phase 4: 規範強化
1. 更新 ESLint 規則防止回退
2. 更新開發文件和檢查清單
3. 建立持續監控機制

## 技術實施細節

### 自動替換規則
```typescript
// 替換 import 語句
"import { Button } from '@/components/common/Button'"
→ "import { AdaptiveButton } from '@/components/adaptive'"

// 替換元件使用
"<Button" → "<AdaptiveButton"
"</Button>" → "</AdaptiveButton>"

// 替換 react-native 匯入
"import { Switch, TextInput, Button, Modal } from 'react-native'"
→ 分別替換為對應的 Adaptive 元件匯入
```

### 優先修正檔案清單
1. **Modal 系列**（已知問題最嚴重）：
   - CreateUserModal.tsx
   - EditUserModal.tsx
   - 所有 /screens/modals/ 下的檔案

2. **表單密集檔案**：
   - OrganizationDetailScreen.tsx
   - MeetingsScreen.tsx
   - 所有包含 Switch/TextInput 的檔案

3. **其他包含問題元件的檔案**

## 預期效果

### 短期效果
- ✅ Web 平台所有 UI 元件顯示正常
- ✅ Switch 軌道顏色正確、字體對比度足夠
- ✅ Picker 背景不透明，選項清晰可見
- ✅ Button 樣式正確，不被全域 CSS 覆蓋

### 長期效果
- ✅ **100% Adaptive 元件覆蓋率**
- ✅ **統一的跨平台 UI 體驗**
- ✅ **樣式問題不再復發**
- ✅ **開發效率提升**

## 成功指標

1. **零 react-native 原生 UI 元件使用**（除了 View、Text 等容器元件）
2. **Adaptive 元件使用率達 100%**
3. **Web 平台 UI 問題完全解決**
4. **ESLint 檢查無違規警告**

## 風險評估

### 高風險
- 大量檔案同時修改可能引入新問題

### 中風險  
- 某些元件可能有特殊用法需要個別處理

### 低風險
- 已有完整的 Adaptive 元件庫作為基礎

## 執行時程

- **Day 1**: 建立檢測工具和遷移清單
- **Day 2-3**: 執行批量替換和修正
- **Day 4**: 全面測試和驗證
- **Day 5**: 規範強化和文件更新

---

**建立日期**: 2025-08-13  
**狀態**: ⏳ 待處理  
**優先級**: 🔥 極高（影響用戶體驗）  
**預估工時**: 4-5 天