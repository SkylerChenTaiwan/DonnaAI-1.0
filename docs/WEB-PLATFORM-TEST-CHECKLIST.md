# Web 平台測試檢查清單

## 必測頁面流程

### 1. 組織管理
- [ ] 組織列表頁面
- [ ] 組織詳情 - 基本資訊分頁
- [ ] 組織詳情 - 用戶管理分頁
- [ ] 組織詳情 - 訂閱方案分頁
- [ ] 組織詳情 - 功能開關分頁
- [ ] 組織詳情 - 用戶協助分頁

### 2. Modal 測試（必須開啟）
- [ ] 資料匯入精靈 Modal
- [ ] 新增用戶 Modal
- [ ] 批量匯入 Modal
- [ ] 團隊管理 Modal

### 3. 顏色相關元件
- [ ] StatCard（統計卡片）
- [ ] SyncStatusIndicator（同步狀態）
- [ ] TeamDataSyncTool（團隊同步工具）
- [ ] UserSelector（用戶選擇器）
- [ ] AssignmentPreview（分配預覽）

## 測試步驟

1. 清除瀏覽器快取
   - Chrome: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   - Safari: Cmd+Option+R
   - Firefox: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

2. 開啟開發者工具 Console
   - Chrome: Cmd+Option+J (Mac) / Ctrl+Shift+J (Windows)
   - Safari: Cmd+Option+C
   - Firefox: Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)

3. 逐一測試每個頁面
   - 載入頁面時檢查 Console
   - 與頁面互動時檢查 Console
   - 特別注意動態載入的內容

4. 確認沒有 CSSStyleDeclaration 錯誤
   - 錯誤訊息通常包含："Failed to set an indexed property [0] on 'CSSStyleDeclaration'"
   - 如果發現錯誤，記錄頁面和操作步驟

5. 測試所有 Modal 的開啟和關閉
   - 確保 Modal 能正常開啟
   - 確保 Modal 內容正常渲染
   - 確保 Modal 能正常關閉

## 常見問題排查

### 如果發現 CSSStyleDeclaration 錯誤

1. **記錄錯誤訊息**
   - 完整的錯誤堆疊追蹤
   - 發生錯誤的頁面路徑
   - 觸發錯誤的操作步驟

2. **確認修復**
   - 執行 `node scripts/test-color-patterns.js` 檢查是否有遺漏的模式
   - 檢查錯誤發生的元件檔案

3. **快速修復**
   - 執行 `node scripts/fix-all-color-concatenation.js` 重新掃描和修復
   - 重新建置和部署

### 快取問題

如果修復後問題仍然存在：

1. **清除本地快取**
   ```bash
   rm -rf .expo node_modules/.cache dist-web
   ```

2. **清除 CDN 快取**
   - Firebase Hosting 可能有快取延遲
   - 等待 5-10 分鐘後再測試
   - 或使用無痕模式測試

3. **強制重新載入**
   - 使用 Cmd+Shift+R 強制重新載入頁面
   - 確保瀏覽器沒有使用快取版本

## 測試報告模板

```markdown
## Web 平台測試報告

**測試日期**: [日期]
**測試環境**: [瀏覽器版本]
**測試網址**: https://donnaai-5e601.web.app

### 測試結果

#### 頁面測試
- [x] 組織列表頁面 - ✅ 通過
- [x] 組織詳情 - 基本資訊 - ✅ 通過
- [ ] 組織詳情 - 用戶管理 - ❌ 發現錯誤
  - 錯誤描述: [錯誤訊息]
  - 重現步驟: [步驟]

#### Modal 測試
- [x] 資料匯入精靈 - ✅ 通過
- [ ] 新增用戶 - ⏸️ 未測試

### 問題總結
[列出所有發現的問題]

### 建議
[提供修復建議]
```

## 自動化測試指令

```bash
# 1. 執行顏色模式檢查
node scripts/test-color-patterns.js

# 2. 執行 ESLint 檢查
npm run lint

# 3. 搜尋可能的問題（應該無結果）
grep -r "\+ ['\"][0-9A-Fa-f]\{2\}" src/ --include="*.tsx" --include="*.ts" | grep -v withAlpha

# 4. 建置 Web 版本
npm run web:build

# 5. 本地測試
npx serve dist-web
```

## 測試完成標準

✅ 所有頁面載入無錯誤
✅ 所有 Modal 開啟無錯誤
✅ Console 無 CSSStyleDeclaration 相關錯誤
✅ ESLint 檢查通過
✅ test-color-patterns.js 檢查通過

---

最後更新：2025-08-13