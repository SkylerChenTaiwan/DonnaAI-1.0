# PRP-103: Web 平台顏色系統完整遷移

## 1. 目標與背景

### 問題描述
React Native Web 在處理顏色字串連接（如 `color + '20'`）時會觸發 `CSSStyleDeclaration` 錯誤，導致頁面無法正常渲染。這個問題僅在 Web 平台出現，Native 平台正常運作。

### 影響範圍
- **69 處** 需要修復的顏色定義
- 影響多個核心模組：
  - OrganizationDetailScreen（已手動修復）
  - AdaptiveSelect 系統
  - 用戶管理模組
  - 組織管理模組
  - 計費系統
  - Import/Export 功能

### 根本原因
React Native Web 嘗試使用索引屬性設置器 `[0]` 來處理某些樣式值，但瀏覽器的 CSSStyleDeclaration 不支援這種操作。

## 2. 解決方案

### 2.1 技術方案
使用已建立的 `withAlpha()` 輔助函數系統性替換所有問題代碼：

```typescript
// ❌ 錯誤方式（會導致 Web 平台錯誤）
backgroundColor: DesignSystem.colors.primary + '20'

// ✅ 正確方式
import { withAlpha } from '@/utils/colorUtils';
backgroundColor: withAlpha(DesignSystem.colors.primary, 0.125)
```

### 2.2 實施策略
1. **自動修復腳本** - 使用 `scripts/fix-color-styles.js` 批量修復
2. **手動驗證** - 檢查關鍵頁面的修復結果
3. **測試覆蓋** - 確保修復不影響 Native 平台
4. **預防機制** - 加入 ESLint 規則防止新問題

## 3. 實施步驟

### 階段 1：準備工作（5 分鐘）
```bash
# 1. 備份當前代碼
git add -A
git commit -m "backup: 顏色系統遷移前備份"

# 2. 檢查現有問題範圍
node scripts/fix-color-styles.js --dry-run

# 3. 清理建置快取
rm -rf .expo node_modules/.cache
```

### 階段 2：執行修復（10 分鐘）
```bash
# 1. 執行自動修復腳本
node scripts/fix-color-styles.js

# 2. 檢查修復結果
git diff --stat

# 3. 重新建置 Web 版本
npm run web:build
```

### 階段 3：關鍵頁面測試（15 分鐘）
測試以下關鍵頁面是否正常顯示：

#### Super Admin 頁面
- [ ] `/admin/organizations` - 組織列表
- [ ] `/admin/organization/[id]` - 組織詳情（已修復）
- [ ] `/admin/onboarding` - 組織入職精靈

#### 用戶管理頁面
- [ ] 用戶批量匯入 Modal
- [ ] 用戶欄位映射介面
- [ ] 用戶檔案上傳器

#### 資料匯入頁面
- [ ] ImportWizard 三階段流程
- [ ] 欄位映射介面
- [ ] 分配策略選擇器

#### UI 元件
- [ ] AdaptiveSelect 下拉選單
- [ ] Button 按鈕狀態
- [ ] Modal 背景遮罩

### 階段 4：Native 平台驗證（10 分鐘）
```bash
# 1. 啟動 iOS 模擬器
npm run ios

# 2. 測試相同頁面確保沒有破壞 Native 功能
# 3. 檢查控制台是否有警告或錯誤
```

### 階段 5：預防機制實施（10 分鐘）

#### 5.1 加入 ESLint 規則
在 `.eslintrc.js` 中加入：
```javascript
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "BinaryExpression[operator='+'][left.property.name=/color/i][right.type='Literal']",
        message: '請使用 withAlpha() 函數處理顏色透明度，避免 Web 平台錯誤'
      }
    ]
  }
};
```

#### 5.2 更新開發指南
在 `CLAUDE.md` 中加入顏色處理規範：
```markdown
### 🎨 顏色系統規範
- **禁止使用** `color + 'XX'` 格式處理透明度
- **必須使用** `withAlpha(color, alpha)` 函數
- **參考文件** `/docs/COLOR-SYSTEM-MIGRATION.md`
```

### 階段 6：提交與部署（5 分鐘）
```bash
# 1. 提交修復
git add -A
git commit -m "fix: 完成 Web 平台顏色系統遷移

PRP-103 實施：
- 修復 69 處顏色字串連接問題
- 使用 withAlpha() 函數統一處理透明度
- 加入 ESLint 規則防止新問題
- 更新開發指南

效果：徹底解決 Web 平台 CSSStyleDeclaration 錯誤"

# 2. 部署到測試環境
npm run deploy:staging

# 3. 部署到生產環境（確認測試通過後）
npm run deploy:production
```

## 4. 驗證標準

### 4.1 功能驗證
- [x] 所有頁面在 Web 平台正常顯示
- [x] 沒有 CSSStyleDeclaration 錯誤
- [x] Native 平台功能未受影響
- [x] 顏色透明度顯示正確

### 4.2 程式碼品質
```bash
# 執行程式碼檢查
npm run lint

# 執行類型檢查
npm run type-check

# 執行單元測試
npm test
```

### 4.3 效能驗證
- 建置大小沒有顯著增加
- 頁面載入速度正常
- 沒有記憶體洩漏

## 5. 風險與對策

### 風險 1：修復可能影響某些特殊樣式
**對策**：先在開發環境徹底測試，保留原始備份

### 風險 2：自動修復腳本可能錯誤處理某些情況
**對策**：使用 `--dry-run` 預覽，手動檢查關鍵檔案

### 風險 3：新開發者不了解規範
**對策**：更新文件、加入 ESLint 規則、Code Review 把關

## 6. 相關資源

### 已建立的工具和文件
- `/src/utils/colorUtils.ts` - 顏色處理工具函數
- `/scripts/fix-color-styles.js` - 自動修復腳本
- `/docs/COLOR-SYSTEM-MIGRATION.md` - 詳細遷移指南

### 參考連結
- [React Native Web Issues](https://github.com/necolas/react-native-web/issues)
- [CSS-in-JS 最佳實踐](https://github.com/styled-components/styled-components/blob/main/docs/best-practices.md)

## 7. 成功指標

### 立即指標
- ✅ 0 個 CSSStyleDeclaration 錯誤
- ✅ 69 處問題代碼全部修復
- ✅ Web 和 Native 平台都正常運作

### 長期指標
- ESLint 規則防止新問題（0 違規）
- 開發者了解並遵守規範（Code Review 通過率 100%）
- 沒有相關 bug 報告

## 8. 時間估計

| 階段 | 時間 | 說明 |
|------|------|------|
| 準備工作 | 5 分鐘 | 備份、檢查範圍 |
| 執行修復 | 10 分鐘 | 運行腳本、建置 |
| 關鍵頁面測試 | 15 分鐘 | Web 平台測試 |
| Native 驗證 | 10 分鐘 | iOS/Android 測試 |
| 預防機制 | 10 分鐘 | ESLint、文件更新 |
| 提交部署 | 5 分鐘 | Git 提交、部署 |
| **總計** | **55 分鐘** | - |

## 9. 執行前檢查清單

- [ ] 已閱讀完整 PRP 文件
- [ ] 已備份當前代碼
- [ ] 開發環境正常運作
- [ ] 有足夠時間完成（約 1 小時）
- [ ] 了解回滾方案

## 10. 完成標準

當以下條件全部滿足時，此 PRP 視為完成：

1. **技術完成**
   - 所有 69 處問題已修復
   - Web 平台無錯誤
   - Native 平台正常

2. **品質保證**
   - 通過 lint 檢查
   - 通過類型檢查
   - 關鍵頁面測試通過

3. **預防措施**
   - ESLint 規則已配置
   - 開發文件已更新
   - 團隊已被告知

4. **文件更新**
   - PRP 標記為完成
   - README.md 更新
   - Git 提交完成

---

**信心評分：9/10**
- 問題明確、解決方案成熟
- 已有自動化工具支援
- 風險可控、影響範圍清楚

**執行建議**：可立即執行，建議在工作時間進行以便及時處理任何問題。