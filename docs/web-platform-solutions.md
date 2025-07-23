# Web 平台解決方案（更新版）

## 社群研究發現
經過深入研究 GitHub Issues、Reddit 和各種技術論壇後，發現 Expo SDK 53 的 Web 平台 HMR 問題是一個廣泛存在的問題。

## 問題根源
1. **ES Module 支援變更**：React Native 0.79（Expo SDK 53）預設啟用了 package.json exports，導致模組解析問題
2. **Fast Refresh 限制**：根據 Expo 團隊成員 Evan Bacon 的說明，「HMR 在 Expo web 中已啟用，但 Fast Refresh 並未啟用」
3. **已知的相容性問題**：Firebase、Supabase 等套件與新的 ES Module 解析不相容

## 社群嘗試的解決方案（但多數無效）

### 1. 導入 @expo/metro-runtime（✅ 已嘗試）
```javascript
// 在 index.ts 或 App.tsx 最頂端
import '@expo/metro-runtime';
```
**結果**：無法解決無限重載問題

### 2. 修改 metro.config.js（✅ 已實施）
```javascript
config.resolver.unstable_enablePackageExports = false;
```
**結果**：解決了模組解析問題，但無法解決無限重載

### 3. 環境變數設定（✅ 已嘗試）
```bash
EXPO_USE_METRO_REQUIRE=1 npx expo start --web
```
**結果**：無效

### 4. 清除快取（✅ 已嘗試）
- 清除 Metro 快取：`npx expo start --clear`
- 清除 Watchman：`watchman watch-del-all`
- 刪除 node_modules 重裝
**結果**：無效

## 實際可行的解決方案

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

## 社群的實際做法

根據研究，大多數使用 Expo SDK 53 的開發者採取以下策略：

### 1. **開發時放棄 Web HMR**
- 專注於原生平台開發
- 需要測試 Web 時使用 `expo export` 導出
- 接受這是 SDK 53 的暫時限制

### 2. **使用 Expo Router**
- Expo Router 已內建 @expo/metro-runtime
- 有更好的 Web 支援（但仍有限制）

### 3. **降級到 SDK 52**
- 如果 Web 開發是主要需求
- SDK 52 仍支援 Webpack，較穩定

### 4. **分離 Web 專案**
- 使用 Next.js 或 Vite 建立獨立 Web 版本
- 共享業務邏輯但使用不同的構建系統

## 結論

**Expo SDK 53 的 Web 支援仍在實驗階段**，社群普遍接受這個現實：
- Metro bundler 的 Web HMR 功能尚未完善
- 大多數開發者選擇專注於原生平台
- Web 版本通過導出靜態檔案來部署

## 最終建議

1. **短期**：使用 `expo export` 導出 Web 版本
2. **中期**：等待 Expo SDK 54 或後續版本的改進
3. **長期**：如果 Web 是核心需求，考慮獨立的 Web 技術棧

## 參考資源
- [Fast-refresh/hmr doesn't work on web using metro bundler #23104](https://github.com/expo/expo/issues/23104)
- [How to get fast refresh/hmr working when using metro #478](https://github.com/expo/router/discussions/478)
- [Expo SDK 53 已知問題](https://github.com/expo/expo/discussions/36551)
- [Metro ES Module 解析問題](https://expo.dev/changelog/sdk-53)