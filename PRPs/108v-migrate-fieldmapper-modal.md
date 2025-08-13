# PRP-108: 遷移 FieldMapper.tsx 使用 UnifiedModal

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: 🔄 待執行  
**優先級**: 🔴 高  
**類型**: 🔧 重構  
**信心分數**: 8/10  
**前置條件**: PRP-107 完成（UnifiedModal 元件）

## 📋 背景

FieldMapper.tsx 是目前最複雜的 Modal 使用案例，包含：
- 2 個 Modal（欄位選擇器、確認對話框）
- 大量 Platform.OS 條件判斷
- 複雜的樣式和佈局
- 是使用者回報問題的主要來源

## 🎯 目標

1. 移除所有 Platform.OS 條件判斷
2. 使用 UnifiedModal 替換現有實作
3. 修復 Web 平台顯示問題
4. 保持功能完全相容

## 🔍 現有問題分析

### 問題 1：Modal 無法顯示
```typescript
// 現有問題程式碼
{Platform.OS === 'web' ? (
  <View style={[styles.modalOverlay, { zIndex: 999999 }]}>
    {/* Web 實作 */}
  </View>
) : (
  <Modal visible={showFieldSelector}>
    {/* Native 實作 */}
  </Modal>
)}
```

### 問題 2：樣式不一致
- Web 使用 View + position: fixed
- Native 使用 Modal 元件
- 導致維護困難

## 🏗️ 遷移策略

### 第一個 Modal：欄位選擇器

#### 現有程式碼結構
```typescript
// 約 250 行程式碼
{showFieldSelector && Platform.OS === 'web' ? (
  // Web 版本
) : (
  <Modal visible={showFieldSelector}>
    // Native 版本
  </Modal>
)}
```

#### 新程式碼結構
```typescript
<UnifiedModal
  visible={showFieldSelector}
  onClose={() => setShowFieldSelector(false)}
  presentationStyle="pageSheet"
  webOverlayStyle={styles.webOverlay}
  webContentStyle={styles.webContent}
  webClickOutsideToClose={true}
  webEscapeKeyToClose={true}
>
  <FieldSelectorContent
    searchQuery={searchQuery}
    selectedField={selectedField}
    onSelect={handleFieldSelect}
    onCancel={handleCancel}
  />
</UnifiedModal>
```

### 第二個 Modal：確認對話框

#### 現有程式碼
```typescript
{showConfirmDialog && (
  Platform.OS === 'web' ? (
    // Web 確認對話框
  ) : (
    <Modal visible={showConfirmDialog}>
      // Native 確認對話框
    </Modal>
  )
)}
```

#### 新程式碼
```typescript
<UnifiedModal
  visible={showConfirmDialog}
  onClose={() => setShowConfirmDialog(false)}
  transparent={true}
  animationType="fade"
>
  <ConfirmDialog
    title="確認映射"
    message={confirmMessage}
    onConfirm={handleConfirm}
    onCancel={() => setShowConfirmDialog(false)}
  />
</UnifiedModal>
```

## 📝 實作步驟

### 步驟 1：抽取 Modal 內容為獨立元件
```bash
# 建立內容元件
touch src/components/import/stages/FieldSelectorContent.tsx
touch src/components/import/stages/ConfirmDialog.tsx
```

### 步驟 2：實作 FieldSelectorContent
```typescript
// FieldSelectorContent.tsx
export const FieldSelectorContent = ({
  searchQuery,
  selectedField,
  onSelect,
  onCancel
}) => {
  // 從原始 Modal 內容遷移
  // 移除所有 Platform.OS 檢查
  return (
    <View style={styles.container}>
      {/* 搜尋欄 */}
      {/* 欄位列表 */}
      {/* 按鈕區 */}
    </View>
  );
};
```

### 步驟 3：更新 FieldMapper.tsx
```typescript
import { UnifiedModal } from '@/components/common/UnifiedModal';
import { FieldSelectorContent } from './FieldSelectorContent';

// 移除 Platform import
// 移除條件渲染
// 使用 UnifiedModal
```

### 步驟 4：調整樣式
```typescript
const styles = StyleSheet.create({
  // 移除 web 特定樣式
  // 統一使用標準 RN 樣式
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // ...
});
```

### 步驟 5：測試與驗證
- 在 Web 上測試欄位選擇器
- 在 Native 上測試相容性
- 驗證所有互動功能

## 🧪 測試計劃

### 功能測試矩陣

| 功能 | Web | iOS | Android |
|------|-----|-----|---------|
| 開啟欄位選擇器 | ✓ | ✓ | ✓ |
| 搜尋欄位 | ✓ | ✓ | ✓ |
| 選擇欄位 | ✓ | ✓ | ✓ |
| 確認對話框 | ✓ | ✓ | ✓ |
| ESC 關閉 | ✓ | N/A | N/A |
| 點擊外部關閉 | ✓ | ✓ | ✓ |

### 迴歸測試
- [ ] 資料匯入流程完整性
- [ ] 欄位映射保存正確
- [ ] 無樣式破壞
- [ ] 效能無退化

## 📊 驗證標準

### 程式碼品質
- [ ] 移除所有 Platform.OS 檢查
- [ ] 程式碼行數減少 30% 以上
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告

### 使用者體驗
- [ ] Modal 在 Web 正常顯示
- [ ] 互動響應快速
- [ ] 視覺一致性
- [ ] 無功能遺失

## ⚠️ 風險評估

### 高風險
1. **資料狀態管理**
   - 風險：遷移過程可能影響狀態
   - 緩解：完整測試資料流

### 中風險
2. **樣式相容性**
   - 風險：某些樣式可能需要調整
   - 緩解：逐步遷移，保留備份

### 低風險
3. **效能影響**
   - 風險：新元件可能較慢
   - 緩解：效能測試與優化

## 📁 影響檔案

### 修改檔案
- `/src/components/import/stages/FieldMapper.tsx` (主要重構)
- `/src/components/import/stages/styles.ts` (樣式調整)

### 新增檔案
- `/src/components/import/stages/FieldSelectorContent.tsx`
- `/src/components/import/stages/ConfirmDialog.tsx`

### 刪除內容
- Platform.OS 相關程式碼（約 150 行）

## ⏱️ 預估時間

- 程式碼重構：60 分鐘
- 樣式調整：30 分鐘
- 測試驗證：30 分鐘
- **總計：120 分鐘**

## 🔄 相依性

### 前置 PRP
- PRP-107：UnifiedModal 元件（必須完成）

### 可能影響
- 資料匯入流程
- 使用者體驗

## 📝 實作檢查清單

### 開發前
- [ ] 確認 UnifiedModal 已實作完成
- [ ] 備份現有程式碼
- [ ] 準備測試資料

### 開發中
- [ ] 抽取 FieldSelectorContent
- [ ] 抽取 ConfirmDialog
- [ ] 替換為 UnifiedModal
- [ ] 移除 Platform.OS 檢查
- [ ] 調整樣式

### 開發後
- [ ] Web 平台測試
- [ ] Native 平台測試
- [ ] 效能測試
- [ ] 使用者驗收測試

## 🎯 成功標準

1. **技術成功**
   - 欄位選擇器在 Web 正常運作
   - 程式碼簡化 30% 以上
   - 無平台特定程式碼

2. **業務成功**
   - 使用者回報問題解決
   - 資料匯入流程順暢
   - 無新增 bug

---

*此 PRP 是解決使用者回報問題的關鍵步驟，需要仔細測試。*