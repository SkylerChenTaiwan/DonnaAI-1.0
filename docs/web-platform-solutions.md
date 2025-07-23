# Web 平台解決方案

## 問題總結
Expo SDK 53 的 Metro bundler 在 Web 平台上有 HMR (Hot Module Replacement) 無限重載的問題。

## 確認的解決方案

### 1. 使用生產模式構建（推薦）
```bash
# 導出靜態檔案
npx expo export --platform web --output-dir dist-web

# 使用任何 HTTP 伺服器提供服務
cd dist-web
python3 -m http.server 8000
# 或使用 npx serve
npx serve .
```

### 2. 禁用開發模式（臨時方案）
```bash
# 不使用 HMR 運行
npx expo start --web --no-dev
```

### 3. 使用獨立的 Web 開發流程
由於 Expo SDK 53 的 Web 支援仍在實驗階段，建議：

1. **開發階段**：專注於原生平台開發
2. **Web 測試**：使用 `expo export` 導出並測試
3. **部署階段**：直接使用導出的靜態檔案

## 已確認的配置
我們的 `metro.config.js` 已經包含了必要的修復：
```javascript
// 支援 Firebase Web SDK
config.resolver.sourceExts.push('cjs');

// 修復 ES Module 相容性問題
config.resolver.unstable_enablePackageExports = false;
```

## 工作流程建議

### 開發流程
1. 使用 `npm start` 開發原生應用（iOS/Android）
2. 定期使用 `expo export` 測試 Web 版本
3. 避免依賴 Web 版的 HMR 功能

### 部署流程
1. 構建 Web 版本：
   ```bash
   npx expo export --platform web --output-dir dist-web
   ```

2. 部署到靜態伺服器：
   - Vercel
   - Netlify
   - GitHub Pages
   - 任何支援靜態檔案的 CDN

## 長期解決方案
等待 Expo 團隊修復 Metro bundler 的 Web HMR 支援，或考慮：
- 使用獨立的 React + Vite 專案開發 Web 版本
- 共享業務邏輯和組件，但使用不同的構建工具

## 參考資源
- [Expo SDK 53 已知問題](https://github.com/expo/expo/discussions/36551)
- [Metro ES Module 解析問題](https://expo.dev/changelog/sdk-53)
- [Firebase 與 SDK 53 相容性](https://github.com/expo/expo/issues/36588)