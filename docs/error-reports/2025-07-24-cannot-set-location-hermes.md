# 錯誤分析報告：Cannot set "location" in Hermes

**報告日期**：2025-07-24  
**錯誤類型**：NotSupportedError  
**影響範圍**：應用程式啟動和 Icon 顯示

## 錯誤訊息
```
ERROR  [runtime not ready]: NotSupportedError: Cannot set "location"., js engine: hermes
```

## 環境資訊
- JavaScript 引擎：Hermes
- 環境：development
- API URL：http://localhost:5001
- Firebase 配置：已載入

## 根本原因分析

### 1. Hermes 引擎限制
Hermes 是 React Native 的優化 JS 引擎，但它不支援某些 Web API，包括 `window.location` 物件。在 Hermes 中，`location` 是一個只讀屬性，無法被覆寫。

### 2. 問題觸發原因（已確認）
在 `src/services/firebase/config.ts` 第 31-40 行，程式碼嘗試設定 `global.location`：
```javascript
global.location = {
  href: 'http://localhost',
  protocol: 'http:',
  host: 'localhost',
  hostname: 'localhost',
  port: '',
  pathname: '/',
  search: '',
  hash: ''
};
```

這段程式碼是在 2025-07-22 的修復中加入的，目的是為 Firebase Web SDK 提供 polyfill。

### 3. Icon 消失的關聯
錯誤導致：
- Firebase 初始化失敗
- 應用程式無法正常啟動
- React Native 元件（包括 Icon）無法正確渲染

## 實施的解決方案

### 已採用方案：修復 location polyfill（已實施）
在 `src/services/firebase/config.ts` 中修改了 global.location 的設定方式：

```javascript
// 檢查 location 是否可寫，避免 Hermes 引擎錯誤
if (!global.location || Object.getOwnPropertyDescriptor(global, 'location')?.configurable !== false) {
  try {
    global.location = {
      href: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: ''
    };
  } catch (e) {
    // 在 Hermes 中，location 可能是只讀的，忽略錯誤
    console.warn('無法設定 global.location (Hermes 引擎限制):', e.message);
  }
}
```

### 解決方案優點
1. 相容 Hermes 引擎的限制
2. 保留 Firebase Web SDK 的相容性
3. 優雅地處理錯誤，不會導致應用程式崩潰

### 其他備選方案
1. **停用 Hermes**（不建議）：會影響應用程式效能
2. **使用 React Native Firebase**：需要大規模重構
3. **降級 Firebase SDK**：可能失去新功能

## 影響評估
- **嚴重性**：高
- **影響範圍**：整個應用程式
- **使用者體驗**：應用程式無法正常啟動，Icon 無法顯示

## 下一步行動
1. 搜尋專案中所有 `location` 的使用
2. 檢查 Firebase 初始化程式碼
3. 驗證第三方套件相容性