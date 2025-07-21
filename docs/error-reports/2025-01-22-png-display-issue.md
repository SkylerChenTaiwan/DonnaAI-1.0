# PNG 圖片無法顯示問題診斷報告

## 問題描述
React Native 應用程式中的 PNG 圖片無法正常顯示。

## 診斷步驟與發現

### 1. 現有圖片檢查
- **檔案存在且格式正確**：
  - `assets/donna-logo.png`: PNG image data, 1024 x 1024, 8-bit colormap
  - 檔案權限正常 (644)
  - 檔案大小合理 (42KB)

### 2. 圖片使用方式分析
- **使用 require() 方式載入**：
  ```tsx
  <Image 
    source={require('../../../assets/donna-logo.png')}
    style={styles.logo}
    resizeMode="contain"
  />
  ```
- **樣式設定**：
  ```tsx
  logo: {
    width: 120,
    height: 60,
    marginBottom: 24,
  }
  ```

### 3. 測試圖片創建
已創建多種格式的測試 PNG：
- `test-rgb.png`: 標準 RGB PNG
- `test-rgba.png`: 含透明通道的 RGBA PNG
- `test-8bit.png`: 8-bit 調色板模式 PNG
- `minimal-red.png`: 最簡單的純色 PNG
- Base64 編碼的小圖片

### 4. Metro Bundler 配置
- 已更新 `metro.config.js` 確保支援所有圖片格式
- 添加了除錯輸出以查看支援的副檔名

### 5. 測試頁面創建
創建了 `ImageTestScreen.tsx` 包含：
- 原始 logo 測試
- Base64 圖片測試
- 不同格式 PNG 測試
- 網路圖片測試
- 不同樣式配置測試

## 可能的問題原因

### 1. Metro Bundler 快取問題
- Metro 可能快取了舊的資源
- 解決方案：清除 Metro 快取

### 2. 圖片路徑問題
- require 路徑可能不正確
- 解決方案：確認相對路徑正確

### 3. 圖片格式相容性
- 某些 PNG 格式可能不相容
- 解決方案：使用標準 RGB PNG

### 4. React Native 版本問題
- 新版本可能有 bug
- 解決方案：檢查已知問題

## 建議解決步驟

### 立即嘗試：

1. **清除快取並重啟**：
   ```bash
   # 停止 Metro
   # 清除快取
   npx expo start -c
   # 或
   npx react-native start --reset-cache
   ```

2. **測試 Base64 圖片**：
   如果 Base64 可以顯示，說明是資源載入問題

3. **檢查控制台錯誤**：
   在執行應用時查看是否有圖片載入錯誤

4. **使用測試頁面**：
   暫時將 App 導向到 ImageTestScreen 進行診斷

### 如果問題持續：

1. **檢查 babel 配置**
2. **確認 assets 資料夾位置正確**
3. **嘗試使用 Image.resolveAssetSource()**
4. **檢查是否有自訂 transformer**

## 臨時解決方案

如果急需顯示圖片，可以：
1. 使用 Base64 編碼的圖片
2. 使用網路圖片 URL
3. 使用 SVG 替代 PNG

## 需要進一步資訊

請提供：
1. 執行 `npx expo start -c` 後的控制台輸出
2. 是否在 iOS/Android/Web 都無法顯示
3. 之前是否正常顯示過
4. 最近是否有更新相關套件