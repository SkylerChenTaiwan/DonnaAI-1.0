# Firebase 初始化錯誤分析報告

生成日期：2025-01-22
報告者：Claude Code

## 問題摘要

在實作 PRP-19（自然語言資料視覺化系統）後，應用程式出現兩個主要錯誤：
1. 模組解析錯誤：`Unable to resolve '../../theme/colors'`
2. Firebase 初始化錯誤：`An API Key must be set when running in a browser`

## 根本原因分析

### 1. 模組解析錯誤
- **原因**：PRP-19 新增的 `ClarificationForm.tsx` 檔案引用了不存在的 `../../theme/colors` 模組
- **影響範圍**：阻止應用程式啟動
- **解決方案**：創建 `src/theme/colors.ts` 檔案（已實施）

### 2. Firebase 初始化錯誤
- **表面原因**：Firebase SDK 誤判執行環境為瀏覽器
- **深層原因**：
  1. 嘗試使用 `app.config.js` 並引入 `dotenv` 干擾了 Firebase SDK 的環境檢測
  2. `App.tsx` 中的開發工具自動載入可能導致過早的 Firebase 初始化
  3. Expo 環境變數載入機制與 Firebase Web SDK 的相容性問題

### Git Bisect 結果
- **第一個有問題的提交**：`2cd8ca5c` - feat: 新增 PRP-19 自然語言資料視覺化系統
- **實際造成問題的檔案**：在後續提交中新增的多個檔案，特別是 `ClarificationForm.tsx`

## 已嘗試的解決方案

1. ✅ **創建缺失的 theme/colors.ts** - 成功解決模組錯誤
2. ❌ **轉換 app.json 為 app.config.js** - 導致 Firebase 錯誤
3. ❌ **移除 dotenv 引用** - 問題仍然存在
4. ❌ **禁用開發工具自動載入** - 問題仍然存在
5. ❌ **還原到 app.json** - Firebase 錯誤持續

## 問題時間線

1. `19022fd6` - ✅ 最後確認的工作版本
2. `2cd8ca5c` - 🔴 新增 PRP-19（僅更新 README）
3. `0bf8876f` - 🔴 修復路徑問題（實際添加了新檔案）
4. 後續提交 - 持續嘗試修復但未成功解決 Firebase 錯誤

## 建議的解決方案

### 方案 A：環境變數載入優化
1. 保持使用 `app.json` 而非 `app.config.js`
2. 確保環境變數在 Firebase 初始化前正確載入
3. 檢查 `.env.local` 檔案中的變數格式

### 方案 B：Firebase 初始化延遲
1. 將 Firebase 初始化移到應用程式完全載入後
2. 使用條件初始化，確保在正確的環境中執行
3. 添加環境檢測邏輯

### 方案 C：降級或更換 Firebase SDK
1. 考慮使用 React Native Firebase 而非 Web SDK
2. 或降級到相容的 Firebase Web SDK 版本

## 影響評估

- **嚴重性**：高 - 完全阻止應用程式啟動
- **影響範圍**：全域 - 所有需要 Firebase 的功能都無法使用
- **使用者影響**：100% - 所有使用者都無法使用應用程式

## 下一步行動

1. 確認 `19022fd6` 版本是否真的可以正常運行
2. 仔細檢查環境變數載入機制
3. 考慮暫時回退 PRP-19 的實作，直到找到穩定的解決方案
4. 研究 Expo SDK 與 Firebase Web SDK 的最佳實踐

## 相關檔案
- `/src/components/DataVisualization/ClarificationForm.tsx`
- `/src/config/environment.ts`
- `/src/services/firebase/config.ts`
- `/App.tsx`
- `app.json` / `app.config.js`