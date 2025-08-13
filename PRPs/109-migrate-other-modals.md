# PRP-109: 遷移其他 Modal 至 UnifiedModal

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: 🔄 待執行  
**優先級**: 🟡 中  
**類型**: 🔧 重構  
**信心分數**: 9/10  
**前置條件**: PRP-107, PRP-108 完成

## 📋 背景

根據 PRP-106 的審計結果，除了 FieldMapper.tsx 外，還有其他使用 Modal 的元件需要遷移。這個 PRP 負責處理所有剩餘的 Modal 遷移工作。

## 🎯 目標

1. 遷移所有剩餘的 Modal 使用
2. 確保全專案統一使用 UnifiedModal
3. 完全移除直接使用 react-native Modal
4. 建立 Modal 使用標準

## 📊 遷移清單

### 標準 Modal（低複雜度）
| 元件 | 位置 | 複雜度 | 優先級 |
|------|------|--------|--------|
| SortModal | `/src/components/common/SortModal.tsx` | 低 | 高 |
| FilterModal | `/src/components/common/FilterModal.tsx` | 低 | 高 |
| NotionBlockModal | `/src/components/notion/NotionBlockModal.tsx` | 中 | 中 |

### 特殊 Modal（需要額外處理）
| 元件 | 特殊需求 | 處理方式 |
|------|----------|----------|
| ImagePickerModal | 檔案上傳 | 保留原生功能 |
| DatePickerModal | 日期選擇器 | 可能需要 Web polyfill |

## 🏗️ 遷移模板

### 標準遷移模式
```typescript
// Before
import { Modal } from 'react-native';

<Modal
  visible={visible}
  animationType="slide"
  onRequestClose={onClose}
>
  <ModalContent />
</Modal>

// After
import { UnifiedModal } from '@/components/common/UnifiedModal';

<UnifiedModal
  visible={visible}
  animationType="slide"
  onClose={onClose}
>
  <ModalContent />
</UnifiedModal>
```

### 複雜遷移模式（有 Platform.OS）
```typescript
// Before
{Platform.OS === 'web' ? (
  <WebModalImplementation />
) : (
  <Modal />
)}

// After
<UnifiedModal
  visible={visible}
  webOverlayStyle={webStyles.overlay}
  webContentStyle={webStyles.content}
>
  <UnifiedContent />
</UnifiedModal>
```

## 📝 實作步驟

### 步驟 1：建立遷移腳本
```bash
# 建立自動化遷移工具
touch scripts/migrate-modals.js
```

```javascript
// migrate-modals.js
const replaceModalImports = (content) => {
  return content.replace(
    /import\s*{\s*Modal\s*}\s*from\s*['"]react-native['"]/g,
    "import { UnifiedModal } from '@/components/common/UnifiedModal'"
  );
};
```

### 步驟 2：遷移 SortModal
```typescript
// SortModal.tsx
// 1. 更換 import
// 2. 更新 Modal 為 UnifiedModal
// 3. 測試功能
```

### 步驟 3：遷移 FilterModal
```typescript
// 類似 SortModal 的處理
```

### 步驟 4：處理特殊案例
```typescript
// 為需要特殊處理的 Modal 建立包裝器
export const SpecialModalWrapper = ({ type, ...props }) => {
  if (type === 'image-picker') {
    // 特殊處理
  }
  return <UnifiedModal {...props} />;
};
```

### 步驟 5：更新文件與標準
```markdown
# Modal 使用標準

## 必須使用 UnifiedModal
- 禁止直接使用 react-native Modal
- 禁止使用 Platform.OS 判斷

## 命名規範
- Modal 元件以 Modal 結尾
- 內容元件以 Content 結尾
```

## 🧪 測試策略

### 批次測試方法
```typescript
// __tests__/modal-migration.test.tsx
const modalsToTest = [
  'SortModal',
  'FilterModal',
  'NotionBlockModal'
];

describe('Modal Migration Tests', () => {
  modalsToTest.forEach(modalName => {
    describe(modalName, () => {
      it('should render on web', () => {});
      it('should render on native', () => {});
      it('should handle close events', () => {});
    });
  });
});
```

### 迴歸測試清單
- [ ] 排序功能正常
- [ ] 篩選功能正常
- [ ] Notion 區塊編輯正常
- [ ] 無視覺退化
- [ ] 效能無影響

## 📊 驗證指標

### 程式碼指標
- [ ] 0 個直接 Modal import
- [ ] 0 個 Platform.OS 在 Modal 相關程式碼
- [ ] 100% Modal 使用 UnifiedModal

### 品質指標
- [ ] 所有測試通過
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告

## ⚠️ 風險評估

### 低風險項目
1. **標準 Modal 遷移**
   - 影響範圍明確
   - 可逐個測試

### 中風險項目
2. **特殊 Modal 處理**
   - 可能需要額外調整
   - 緩解：保留原始功能

## 📁 影響分析

### 需要修改的檔案
```
src/
├── components/
│   ├── common/
│   │   ├── SortModal.tsx (修改)
│   │   ├── FilterModal.tsx (修改)
│   │   └── index.ts (可能修改)
│   └── notion/
│       └── NotionBlockModal.tsx (修改)
└── screens/
    └── [可能有使用 Modal 的畫面]
```

### 影響範圍
- 約 5-10 個檔案
- 約 500-1000 行程式碼
- 影響所有使用這些 Modal 的畫面

## ⏱️ 預估時間

### 各項任務時間
- SortModal 遷移：20 分鐘
- FilterModal 遷移：20 分鐘
- NotionBlockModal 遷移：30 分鐘
- 特殊 Modal 處理：30 分鐘
- 測試與驗證：30 分鐘
- 文件更新：10 分鐘
- **總計：140 分鐘**

## 🔄 執行順序建議

1. **第一批**（高優先級）
   - SortModal
   - FilterModal
   
2. **第二批**（中優先級）
   - NotionBlockModal
   - 其他業務 Modal
   
3. **第三批**（低優先級）
   - 特殊 Modal
   - 實驗性 Modal

## 📝 完成檢查清單

### 技術檢查
- [ ] 所有 Modal import 已替換
- [ ] 所有 Platform.OS 已移除
- [ ] 所有測試通過
- [ ] 文件已更新

### 業務檢查
- [ ] 功能無退化
- [ ] 使用者體驗一致
- [ ] 效能無影響

### 程式碼品質
- [ ] 符合編碼標準
- [ ] 通過 Code Review
- [ ] 無技術債務

## 🎯 成功標準

1. **完全遷移**
   - 100% Modal 使用 UnifiedModal
   - 0 個平台特定程式碼

2. **品質保證**
   - 所有功能正常
   - 無新增 bug
   - 程式碼更簡潔

3. **可維護性**
   - 統一的 Modal 使用模式
   - 清晰的文件
   - 易於未來擴展

---

*此 PRP 完成後，整個專案將統一使用 UnifiedModal，徹底解決 Modal 相關問題。*