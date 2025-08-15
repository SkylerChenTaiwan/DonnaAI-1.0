# 按鈕樣式審計報告

生成日期：2025-08-15
審計人：Claude

## 執行摘要

在 ImportWizard 相關元件中發現多處硬編碼的按鈕實作，這些按鈕未使用 AdaptiveButton 元件，導致樣式不一致和顏色問題。

## 問題清單

### 1. FileUploadMerger.tsx 中的關鍵欄位選擇按鈕

**位置**: `/src/components/import/stages/FileUploadMerger.tsx`

#### 問題 1.1: 高信心度候選按鈕（行 452-494）
```tsx
<TouchableOpacity
  style={StyleSheet.flatten([
    styles.keyFieldOption,
    {
      backgroundColor: selectedKey === candidate.field 
        ? colors.primary  // 問題：使用 #2C2C2C 深灰色
        : colors.gray100,
      borderColor: colors.success
    }
  ])}
>
```
**問題**: 
- 使用 TouchableOpacity 而非 AdaptiveButton
- 直接使用 `colors.primary` (#2C2C2C) 作為背景色
- 文字顏色為白色，但背景是深灰色，對比度不足

#### 問題 1.2: 中等信心度候選按鈕（行 501-543）
```tsx
<TouchableOpacity
  style={StyleSheet.flatten([
    styles.keyFieldOption,
    {
      backgroundColor: selectedKey === candidate.field 
        ? colors.primary  // 問題：同樣使用 #2C2C2C
        : colors.gray100,
      borderColor: colors.warning
    }
  ])}
>
```
**問題**: 同上

#### 問題 1.3: 低信心度候選按鈕（行 550-573）
```tsx
<TouchableOpacity
  style={StyleSheet.flatten([
    styles.keyFieldOption,
    {
      backgroundColor: selectedKey === candidate.field 
        ? colors.primary  // 問題：同樣使用 #2C2C2C
        : colors.gray100,
      borderColor: colors.gray300
    }
  ])}
>
```
**問題**: 同上

#### 問題 1.4: 合併策略選擇按鈕（行 739-762）
```tsx
<TouchableOpacity
  style={StyleSheet.flatten([
    styles.strategyOption,
    {
      backgroundColor: mergeStrategy === strategy 
        ? colors.primary  // 問題：#2C2C2C
        : colors.gray100
    }
  ])}
>
```
**問題**: 同上

### 2. 設計系統顏色定義問題

**位置**: `/src/theme/designSystem.ts`

```typescript
colors: {
  primary: '#2C2C2C',  // 深灰色，不適合作為按鈕背景
  
  button: {
    primary: {
      default: '#1A1A1A',  // 更深的黑色
      hover: '#2C2C2C',
      pressed: '#0A0A0A'
    }
  }
}
```

**問題**:
- `colors.primary` 被直接用作按鈕背景，但顏色太深
- 應該使用 `colors.button.primary.default` 的值

## 影響範圍

### 受影響的 UI 元素
1. 資料匯入精靈中的關鍵欄位選擇按鈕
2. 合併策略選擇按鈕（左連接、內連接、外連接）
3. 任何其他直接使用 `colors.primary` 的 TouchableOpacity

### 使用者體驗影響
- 按鈕文字難以閱讀（深灰背景配白色文字）
- 視覺一致性差異
- 不符合設計系統規範

## 建議修復方案

### 方案 A：將所有 TouchableOpacity 改為 AdaptiveButton（推薦）

**優點**:
- 統一的元件使用
- 自動處理跨平台差異
- 易於維護

**實作步驟**:
1. 將所有關鍵欄位選擇按鈕改為 AdaptiveButton
2. 使用適當的 variant 屬性
3. 確保樣式一致性

### 方案 B：修正顏色使用

**實作步驟**:
1. 將 `colors.primary` 改為 `colors.button.primary.default`
2. 或調整 `colors.primary` 的值為更亮的顏色

### 方案 C：建立專用的選擇按鈕元件

**實作步驟**:
1. 建立 AdaptiveSelectionButton 元件
2. 封裝選擇邏輯和樣式
3. 在所有需要的地方使用

## 程式碼位置索引

| 檔案 | 行號 | 元件類型 | 用途 | 問題 |
|------|------|----------|------|------|
| FileUploadMerger.tsx | 452-494 | TouchableOpacity | 高信心度關鍵欄位 | 使用 colors.primary |
| FileUploadMerger.tsx | 501-543 | TouchableOpacity | 中信心度關鍵欄位 | 使用 colors.primary |
| FileUploadMerger.tsx | 550-573 | TouchableOpacity | 低信心度關鍵欄位 | 使用 colors.primary |
| FileUploadMerger.tsx | 739-762 | TouchableOpacity | 合併策略選擇 | 使用 colors.primary |
| FileUploadMerger.tsx | 775-782 | AdaptiveButton | 合併/確認按鈕 | ✅ 已正確使用 |

## 檢查清單

- [ ] 修復所有 TouchableOpacity 按鈕的顏色問題
- [ ] 確認所有按鈕都使用 AdaptiveButton 或有合理理由不使用
- [ ] 更新設計系統文件
- [ ] 測試所有修復在 Web 和 Native 平台
- [ ] 確認顏色對比度符合無障礙標準

## 附錄：相關截圖位置

- 高信心度按鈕問題：截圖 2025-08-15 上午11.49.46.png
- 合併策略按鈕問題：截圖 2025-08-15 上午11.50.42.png
- 檔案合併按鈕問題：截圖 2025-08-15 上午11.00.48.png

## 下一步行動

1. 立即修復所有識別的按鈕顏色問題
2. 建立 ESLint 規則防止直接使用 colors.primary 在按鈕背景
3. 考慮建立專用的選擇按鈕元件