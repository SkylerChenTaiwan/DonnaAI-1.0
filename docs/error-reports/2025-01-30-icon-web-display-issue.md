# Icon 在 Web 平台無法顯示問題診斷報告

## 問題描述
- **症狀**：部署到 Firebase Hosting 後，所有 Icon 元件只顯示方框，而非正確的圖示
- **環境**：Web 平台 (https://donnaai-5e601.web.app)
- **狀態**：已實施 Metro 配置改進（方案 A），但問題仍然存在

## 已確認的事實

### 1. 程式碼實現
- 所有元件都正確使用 `@/components/common/Icon` 統一元件
- Icon 元件正確使用 `@expo/vector-icons` 的 Ionicons
- 沒有發現錯誤的導入或使用方式

### 2. 配置檔案
- `metro.config.js` 已正確配置字體檔案處理
- `fontAssetPlugin.js` 已實現並被正確引用
- 字體副檔名（ttf, otf, woff, woff2, eot）已加入 assetExts

### 3. 建置產出
- 字體檔案已正確複製到 `dist-web/assets/` 目錄
- Ionicons.ttf 檔案存在於正確位置
- HTML 檔案結構正常

### 4. 缺失的部分
- **未發現字體載入程式碼**：App.tsx 中沒有使用 `expo-font` 載入字體
- **未發現 @font-face 定義**：HTML 中沒有字體的 CSS 定義
- **Web polyfills 中沒有字體相關處理**

## 根本原因分析

問題的根本原因是 **@expo/vector-icons 在 Web 平台上需要額外的字體載入步驟**：

1. **React Native 與 Web 的差異**：
   - 在 React Native 中，字體會自動從 assets 載入
   - 在 Web 中，需要透過 CSS @font-face 或 JavaScript 載入字體

2. **Expo Web 的限制**：
   - Expo Web 不會自動為 vector-icons 生成 @font-face 規則
   - 需要手動處理字體載入

3. **當前實作的問題**：
   - Metro 配置只確保字體檔案被複製到輸出目錄
   - 但沒有機制告訴瀏覽器如何載入和使用這些字體

## 解決方案選項

### 方案 B：使用 expo-font 載入字體（推薦）
**優點**：
- Expo 官方推薦的方式
- 跨平台一致性好
- 可以預載入字體，避免閃爍

**實施步驟**：
1. 在 App.tsx 中使用 `useFonts` hook 載入 Ionicons
2. 顯示 loading 畫面直到字體載入完成
3. 確保所有平台都使用相同的載入邏輯

### 方案 C：注入 CSS @font-face
**優點**：
- 更接近標準 Web 開發方式
- 不需要修改 React 程式碼

**實施步驟**：
1. 創建自定義 HTML 模板
2. 添加 @font-face 規則指向正確的字體檔案
3. 確保字體族名稱與 Ionicons 元件期望的一致

### 方案 D：使用 Web 字體 CDN
**優點**：
- 最簡單的實施方式
- 利用 CDN 快取

**缺點**：
- 依賴外部資源
- 可能有網路延遲

**實施步驟**：
1. 在 HTML 中加入 Ionicons Web 字體連結
2. 確保版本與 @expo/vector-icons 相容

## 建議的行動計劃

1. **立即修復**：實施方案 B（使用 expo-font）
   - 這是 Expo 官方推薦的方式
   - 可以確保跨平台一致性
   - 實施簡單，風險低

2. **測試步驟**：
   - 本地測試 Web 版本
   - 確認字體正確載入
   - 部署到 Firebase 並驗證

3. **長期優化**：
   - 考慮為 Web 平台優化字體載入效能
   - 評估是否需要字體子集化以減少檔案大小

## 影響評估

- **用戶影響**：高 - 所有 Icon 無法顯示嚴重影響使用體驗
- **技術債務**：低 - 修復方案不會引入技術債務
- **實施複雜度**：低 - 預計 30 分鐘內可完成
- **測試需求**：中 - 需要在多個瀏覽器測試

## 相關檔案
- `/src/components/common/Icon.tsx`
- `/App.tsx`
- `/metro.config.js`
- `/fontAssetPlugin.js`