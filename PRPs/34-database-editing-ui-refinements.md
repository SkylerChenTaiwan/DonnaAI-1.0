# PRP-34: 資料庫編輯介面細化調整

## Goal
修復 PRP-33 實作後發現的四個 UI/UX 問題，提升資料庫編輯介面的可用性和視覺體驗：
1. 優化人事頁面「新增下屬」按鈕設計 - 改為低調的淺色按鈕
2. 移除資料庫編輯模式表頭的鉛筆圖標 - 避免儲存格寬度異常
3. 調整新增記錄按鈕對齊方式 - 改為左對齊並加入視覺引導
4. 重設計編輯儲存格交互 - 實作漂浮放大編輯框

## Why
- **視覺層次問題**: 「新增下屬」按鈕過於突出，破壞頁面視覺平衡
- **空間利用問題**: 表頭鉛筆圖標導致儲存格寬度不必要增加
- **橫向滾動問題**: 新增按鈕置中在寬表格中位置不當
- **編輯體驗問題**: 編輯按鈕擠在小格子內影響內容可見性

## What
針對性修復四個具體的 UI 問題：
- 人事頁面 TableView 的空狀態按鈕樣式
- EditableDataTable 表頭的視覺裝飾
- AddRowButton 在 EditableDataTable 中的對齊邏輯
- EditableCell 編輯模式的交互設計

### Success Criteria
- [ ] 「新增下屬」按鈕使用淺色樣式，圓角更圓，尺寸適中
- [ ] 資料庫編輯模式表頭完全移除鉛筆圖標
- [ ] 新增記錄按鈕左對齊，並配有 > 引導符號
- [ ] 編輯儲存格時顯示漂浮放大的編輯框
- [ ] 編輯操作按鈕（✓ ✗）漂浮在編輯框右側
- [ ] 編輯框可以覆蓋相鄰儲存格，提升內容可見性

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /Users/skyler/coding/DonnaAI-1.0/src/screens/personnel/TableView.tsx
  why: 包含需要調整樣式的「新增下屬」按鈕，第155-160行
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/EditableDataTable.tsx
  why: 包含表頭鉛筆圖標（第302-304行）和新增記錄按鈕對齊邏輯
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/AddRowButton.tsx
  why: 新增記錄按鈕元件，需要調整對齊和視覺引導
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/components/common/EditableCell.tsx
  why: 編輯儲存格元件，需要重設計編輯模式交互
  
- file: /Users/skyler/coding/DonnaAI-1.0/src/theme/colors.ts
  why: 顏色系統定義，需要確保淺色按鈕樣式一致

- url: https://www.nngroup.com/articles/inline-editing/
  why: 行內編輯最佳實踐，特別是編輯狀態的視覺反饋

- url: https://material.io/components/text-fields#filled-text-field
  why: Material Design 文字輸入欄位設計指南，參考漂浮編輯框設計

- url: https://developer.apple.com/design/human-interface-guidelines/buttons
  why: iOS 按鈕設計指南，確保淺色按鈕符合平台標準
```

### Current Issue Analysis
```typescript
// 問題 1: TableView.tsx 第155-160行
<TouchableOpacity style={styles.addButton} onPress={() => {
  console.log('新增下屬功能暫未實現');
  // TODO: 實現新增下屬功能
}}>
  <Text style={styles.addButtonText}>新增下屬</Text>
</TouchableOpacity>

// 樣式問題:
addButton: {
  backgroundColor: '#FF5C00', // 太突出的橘色
  borderRadius: 8,           // 圓角不夠圓
  paddingHorizontal: 24,     // 可能過大
  paddingVertical: 12,
}

// 問題 2: EditableDataTable.tsx 第302-304行  
{column.editable && !readOnly && (
  <Text style={styles.editableIndicator}> ✏️</Text>
)}

// 問題 3: AddRowButton 在 EditableDataTable 中的對齊
// 當前使用 backgroundColor: '#FFFFFF' 和預設對齊，缺乏引導

// 問題 4: EditableCell.tsx 編輯模式
// 編輯按鈕位置: position: 'absolute', top: 4, right: 4
// 缺乏 z-index 和適當的視覺層次
```

### Desired Codebase Changes
```bash
# 需要修改的檔案:
src/screens/personnel/TableView.tsx          # 新增下屬按鈕樣式調整
src/components/common/EditableDataTable.tsx # 移除表頭鉛筆圖標
src/components/common/AddRowButton.tsx       # 左對齊和視覺引導
src/components/common/EditableCell.tsx       # 漂浮編輯框重設計
```

### Known Gotchas & Current Implementation Details
```typescript
// CRITICAL: TableView 使用 DesignSystem.colors
// 需要確保新的淺色樣式與設計系統一致

// CRITICAL: EditableDataTable 表頭渲染邏輯
// 鉛筆圖標移除後需要確保樣式不受影響

// GOTCHA: AddRowButton 的父容器樣式
// addButtonContainer 有背景色和邊框，影響對齊效果

// GOTCHA: EditableCell 的 z-index 層級
// 需要確保漂浮編輯框不被其他元素遮蓋

// CRITICAL: React Native 中的 position: 'absolute'
// 漂浮元素需要正確的定位和尺寸計算
```

## Implementation Blueprint

### Data Models and Interfaces
```typescript
// 更新 AddRowButton Props 以支援左對齊
interface AddRowButtonProps {
  onPress: () => void;
  isVisible: boolean;
  style?: ViewStyle;
  buttonText?: string;
  disabled?: boolean;
  alignment?: 'left' | 'center'; // 新增對齊選項
  showGuideIcon?: boolean;       // 新增引導圖標選項
}

// 漂浮編輯框的樣式定義
interface FloatingEditStyles {
  container: ViewStyle;
  inputField: ViewStyle;
  actionButtons: ViewStyle;
  overlay: ViewStyle;
}

// 淺色按鈕樣式系統
interface SubduedButtonStyles {
  container: ViewStyle;
  text: TextStyle;
  disabled: ViewStyle;
}
```

### List of Tasks to Complete (In Order)
```yaml
Task 1 - 調整新增下屬按鈕樣式:
  MODIFY src/screens/personnel/TableView.tsx:
    - 將 backgroundColor 從 '#FF5C00' 改為淺灰色
    - 增加 borderRadius 至 12 或更高
    - 調整 padding 使按鈕更適中
    - 使用設計系統中的中性色彩

Task 2 - 移除表頭鉛筆圖標:
  MODIFY src/components/common/EditableDataTable.tsx:
    - 找到第302-304行的 editableIndicator 渲染邏輯
    - 完全移除 <Text style={styles.editableIndicator}> ✏️</Text>
    - 清理相關的 editableIndicator 樣式定義
    - 確保 headerText 樣式保持一致

Task 3 - 重設計新增記錄按鈕對齊:
  MODIFY src/components/common/AddRowButton.tsx:
    - 新增 alignment 和 showGuideIcon props
    - 實作左對齊邏輯 justifyContent: 'flex-start'
    - 在按鈕左側加入 > 引導圖標
    - 調整容器樣式以支援左對齊

  MODIFY src/components/common/EditableDataTable.tsx:
    - 更新 renderAddButton 以傳遞左對齊屬性
    - 調整 addButtonContainer 樣式移除置中邏輯

Task 4 - 實作漂浮編輯框:
  MODIFY src/components/common/EditableCell.tsx:
    - 重新設計編輯模式的容器結構
    - 實作 position: 'absolute' 的漂浮編輯框
    - 計算編輯框的適當尺寸和位置
    - 移動操作按鈕至編輯框右側外部
    - 添加適當的 z-index 確保層級正確
    - 實作背景遮罩或邊框突顯編輯狀態

Task 5 - 樣式統一和測試:
  MODIFY styles across all files:
    - 確保所有新樣式使用設計系統顏色
    - 統一圓角、間距等設計標記
    - 添加適當的陰影和視覺深度
    
  VERIFY cross-platform consistency:
    - 測試 iOS/Android/Web 平台顯示效果
    - 確認觸控目標大小符合規範
    - 驗證漂浮編輯框在不同螢幕尺寸下的行為
```

### Per Task Implementation Details

```typescript
// Task 1 - 淺色按鈕樣式實作
const subduedButtonStyles = StyleSheet.create({
  addButton: {
    paddingHorizontal: 20,          // 縮小 padding
    paddingVertical: 10,
    backgroundColor: colors.backgroundTertiary, // 使用更淺的背景
    borderRadius: 12,               // 更圓的圓角
    borderWidth: 1,
    borderColor: colors.border,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,    // 較不突出的文字色
  },
});

// Task 3 - 左對齊新增按鈕實作
const AddRowButton: React.FC<AddRowButtonProps> = ({ 
  alignment = 'center', 
  showGuideIcon = false,
  ...props 
}) => {
  return (
    <View style={[
      styles.container,
      alignment === 'left' && styles.leftAligned
    ]}>
      <TouchableOpacity style={styles.addButton} onPress={onPress}>
        {showGuideIcon && (
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        )}
        <Ionicons name="add" size={20} color={colors.orange} />
        <Text style={styles.addButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Task 4 - 漂浮編輯框實作
const EditableCell = ({ isEditing, ...props }) => {
  if (isEditing) {
    return (
      <View style={styles.floatingEditContainer}>
        {/* 放大的編輯框 */}
        <View style={styles.expandedEditField}>
          <TextInput
            style={styles.floatingInput}
            value={editValue}
            onChangeText={setEditValue}
            autoFocus
          />
        </View>
        
        {/* 右側漂浮的操作按鈕 */}
        <View style={styles.floatingActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSubmit}>
            <Ionicons name="checkmark" size={18} color="#28A745" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
            <Ionicons name="close" size={18} color="#DC3545" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  // ... 非編輯模式渲染
};

const floatingEditStyles = StyleSheet.create({
  floatingEditContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -60,                    // 為右側按鈕留空間
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedEditField: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingInput: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  floatingActions: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 4,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
```

### Integration Points
```yaml
THEME_INTEGRATION:
  - use: colors.backgroundTertiary for subdued buttons
  - use: colors.textSecondary for non-prominent text
  - maintain: consistent border radius across components

COMPONENT_UPDATES:
  - AddRowButton: support alignment and guide icon props
  - EditableCell: complete redesign of editing interaction
  - EditableDataTable: remove header decorations, update button integration

CROSS_PLATFORM_CONSIDERATIONS:
  - shadow/elevation: use both shadowColor and elevation for consistency
  - touch_targets: maintain 44pt minimum for floating action buttons
  - z_index: ensure proper layering in floating edit mode
```

## Validation Loop

### Level 1: Visual Validation
```bash
# 手動視覺檢查步驟:
npm start

# 測試檢查項目:
# 1. 人事頁面空狀態 - 「新增下屬」按鈕是否為淺色、圓角更圓
# 2. 資料庫編輯模式 - 表頭是否完全無鉛筆圖標
# 3. 新增記錄按鈕 - 是否左對齊並有 > 引導圖標
# 4. 編輯儲存格 - 是否顯示漂浮放大編輯框，操作按鈕在右側

# 平台測試:
# iOS: 檢查陰影效果和圓角
# Android: 檢查 elevation 和 Material Design 一致性  
# Web: 檢查 hover 狀態和響應式行為
```

### Level 2: Interaction Testing
```bash
# 功能性測試:
# 1. 漂浮編輯框是否可以覆蓋相鄰儲存格
# 2. 編輯狀態下是否可以正常輸入和確認/取消
# 3. 新增按鈕的左對齊是否在橫向滾動時保持合理位置
# 4. 淺色按鈕是否有適當的觸控反饋

# 無障礙測試:
# 1. 所有按鈕是否達到最小觸控目標（44pt）
# 2. 顏色對比度是否符合 WCAG 標準
# 3. 漂浮編輯框是否有適當的焦點管理
```

### Level 3: Code Quality
```bash
# 執行代碼檢查:
npm run lint                    # ESLint 風格檢查
npm run type-check             # TypeScript 類型檢查

# 預期結果: 無錯誤，所有新增的樣式和邏輯符合專案標準

# 執行現有測試:
npm run test                   # 確保沒有破壞現有功能
```

## Final Validation Checklist
- [ ] 「新增下屬」按鈕使用淺色背景和中性文字顏色
- [ ] 按鈕圓角半徑至少 12pt，視覺上更加圓潤
- [ ] 資料庫編輯模式表頭完全沒有鉛筆圖標
- [ ] 新增記錄按鈕在左側對齊，包含 > 引導圖標
- [ ] 編輯儲存格時顯示漂浮放大的編輯框
- [ ] 編輯操作按鈕位於編輯框右側外部
- [ ] 漂浮編輯框具有適當的陰影和視覺層次
- [ ] 所有平台（iOS/Android/Web）顯示一致
- [ ] 觸控目標符合無障礙標準
- [ ] 不破壞現有的編輯和保存功能

---

## Anti-Patterns to Avoid
- ❌ 不要讓淺色按鈕過於難以發現 - 保持適度的視覺重量
- ❌ 不要讓漂浮編輯框的 z-index 過低 - 確保始終在最上層
- ❌ 不要忽略編輯框的邊界檢查 - 防止超出螢幕範圍
- ❌ 不要移除編輯框的輔助功能支援
- ❌ 不要讓左對齊按鈕在小螢幕上位置不當
- ❌ 不要使用硬編碼顏色值 - 統一使用設計系統

## Quality Score: 7/10
**信心等級**: 中高度信心。主要挑戰在於漂浮編輯框的實作需要精確的位置計算和跨平台兼容性測試。其他三個問題都是相對簡單的樣式調整。建議分步驟實作，優先處理簡單的樣式問題，最後實作漂浮編輯框功能。