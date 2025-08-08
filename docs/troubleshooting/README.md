# DonnaAI 故障排除指南

此目錄包含 DonnaAI 專案開發過程中遇到的問題及解決方案。

## 目錄

### Claude Code 相關
- [Claude Code Hooks 通知設定問題](./claude-code-hooks-notification.md) - 解決 hooks 無法觸發通知的問題

### React Native / Expo 相關
- [Expo Web 圖標載入問題（OTS parsing error）](./expo-web-icons-solution.md) - 解決 @expo/vector-icons 在 Web 平台無法顯示的問題
- [Metro Bundler 與 Firebase 相容性問題](./metro-bundler-firebase-issue.md) - 解決 Metro bundler 和 Firebase SDK 的衝突
- [React 19 升級完成總結](./react-19-upgrade-complete.md) - React 19 升級過程和解決方案
- [React 19 升級摘要](./react-19-upgrade-summary.md) - React 19 升級的關鍵變更

### Firebase 相關
- 待新增

## 貢獻指南

當你解決了一個問題，請：
1. 在相應類別下建立新的 `.md` 檔案
2. 使用清晰的檔名描述問題
3. 包含以下內容：
   - 問題描述
   - 問題原因
   - 解決方案（含程式碼範例）
   - 常見問題
   - 參考資料

## 快速查找

使用關鍵字搜尋：
- `notification` - 通知相關問題
- `hooks` - Claude Code hooks 問題
- `firebase` - Firebase 整合問題
- `navigation` - React Navigation 問題
- `expo` - Expo SDK 相關問題
- `web` - Web 平台特定問題
- `icons` - 圖標顯示問題
- `metro` - Metro bundler 設定問題