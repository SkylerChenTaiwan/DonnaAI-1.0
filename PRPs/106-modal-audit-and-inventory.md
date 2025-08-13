# PRP-106: Modal 使用審計與清單建立

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: 🔄 待執行  
**優先級**: 🟡 中  
**類型**: 🔍 審計與分析  
**信心分數**: 10/10 (純粹審計，無風險)

## 📋 背景

在修復 FieldMapper.tsx 的 Modal 問題前，需要先全面了解專案中 Modal 的使用情況，確保統一修復方案不會影響其他功能。

## 🎯 目標

1. 建立完整的 Modal 使用清單
2. 識別不同的 Modal 實作模式
3. 評估每個 Modal 的修改風險
4. 為後續 PRP 提供基礎資料

## 🔍 審計範圍

### 需要檢查的檔案類型
- 所有 `.tsx` 和 `.jsx` 檔案
- 特別關注 `/src/components/` 和 `/src/screens/` 目錄

### 需要識別的模式

1. **標準 Modal 使用**
```javascript
import { Modal } from 'react-native';
<Modal visible={visible} />
```

2. **Platform.OS 條件使用**
```javascript
{Platform.OS === 'web' ? (
  // Web 實作
) : (
  <Modal />
)}
```

3. **自訂 Modal 元件**
- 包裝 React Native Modal 的元件
- 完全自訂的 Modal 實作

## 📝 執行步驟

### 步驟 1：搜尋所有 Modal 匯入
```bash
# 找出所有匯入 Modal 的檔案
grep -r "import.*Modal.*from.*react-native" --include="*.tsx" --include="*.jsx" src/

# 找出可能的自訂 Modal 元件
grep -r "Modal" --include="*.tsx" --include="*.jsx" src/components/common/
```

### 步驟 2：分析每個檔案
對每個找到的檔案，記錄：
- 檔案路徑
- Modal 使用方式（標準/條件/自訂）
- 是否有 Platform.OS 檢查
- 複雜度評分（1-3）

### 步驟 3：建立清單文件
建立 `/docs/modal-audit-report.md`，包含：

```markdown
# Modal 使用審計報告

## 統計摘要
- 總共找到 X 個使用 Modal 的檔案
- Y 個使用標準實作
- Z 個使用 Platform.OS 條件

## 詳細清單

### 標準實作（無需修改）
| 檔案 | Modal 數量 | 備註 |
|------|-----------|------|
| /src/components/common/SortModal.tsx | 1 | 標準實作，無平台判斷 |

### 需要修改的檔案
| 檔案 | 問題類型 | 複雜度 | 備註 |
|------|---------|--------|------|
| /src/components/import/stages/FieldMapper.tsx | Platform.OS 條件 | 高 | 2個 Modal，複雜樣式 |

### 自訂 Modal 元件
| 元件名稱 | 位置 | 使用情況 |
|----------|------|----------|
```

### 步驟 4：風險評估
評估每個需要修改的檔案：
- **低風險**：標準 Modal，無特殊功能
- **中風險**：有少量平台特定程式碼
- **高風險**：複雜的平台判斷或自訂行為

## 🧪 驗證門檻

### 完整性檢查
```bash
# 確保沒有遺漏的 Modal
grep -r "Modal" --include="*.tsx" --include="*.jsx" src/ | grep -v "// " | wc -l

# 檢查是否有動態匯入
grep -r "require.*Modal" --include="*.tsx" --include="*.jsx" src/
```

### 報告驗證
- [ ] 所有 Modal 匯入都已記錄
- [ ] 所有 Platform.OS 檢查都已識別
- [ ] 風險評估完整且合理

## 📊 預期產出

1. **Modal 審計報告** (`/docs/modal-audit-report.md`)
   - 完整的 Modal 使用清單
   - 風險評估矩陣
   - 修改優先順序建議

2. **統計數據**
   - Modal 總數
   - 需要修改的檔案數
   - 預估工作量

## 🎁 額外建議

### 發現機會
在審計過程中，可能發現：
- 重複的 Modal 實作可以合併
- 未使用的 Modal 程式碼可以移除
- 可以標準化的模式

### 文件更新
如果發現缺少文件的 Modal 使用，建議：
- 更新元件文件
- 添加使用範例

## ⏱️ 預估時間

- 執行審計：15 分鐘
- 分析結果：10 分鐘
- 建立報告：10 分鐘
- **總計：35 分鐘**

## 🔄 後續 PRP

此 PRP 完成後，將提供資料給：
- PRP-107：建立統一 Modal 包裝元件
- PRP-108：移轉 FieldMapper.tsx Modal
- PRP-109：移轉其他 Modal（如有需要）

---

*此 PRP 為純審計任務，無程式碼修改風險，可安全執行。*