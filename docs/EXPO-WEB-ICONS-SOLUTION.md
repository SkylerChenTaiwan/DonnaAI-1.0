# Expo SDK 53 Web 平台圖標載入問題解決方案

## 問題描述

在 Expo SDK 53 中，@expo/vector-icons 在 Web 平台會出現以下錯誤：
- `Failed to decode downloaded font`
- `OTS parsing error: invalid sfntVersion: 1008813135`
- 圖標顯示為空白方塊

## 問題根因

1. **Metro bundler 破壞二進制檔案**
   - Metro 在處理 TTF 字體檔案時，將二進制資料當作文本處理
   - 導致字體檔案頭被破壞（sfntVersion: 1008813135 是無效值）
   - 這是 Expo SDK 53 + Metro bundler 的已知問題

2. **OTS (OpenType Sanitizer) 錯誤**
   - 瀏覽器無法解析被破壞的字體檔案
   - 即使檔案存在，也無法正確載入

## 解決方案

### 最終成功方案：使用 CDN 載入未損壞的字體

創建腳本 `scripts/fix-web-icons.js`：

```javascript
/**
 * 修復 Web 版圖標載入問題
 * 在建構後插入正確的字體載入
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist-web/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // 檢查是否已經有圖標字體載入
  if (!html.includes('ionicons.css')) {
    // 在 </head> 前插入 CDN 連結
    const iconLinks = `
    <!-- 修復 @expo/vector-icons 在 Web 平台的問題 -->
    <!-- 使用 CDN 載入未損壞的字體檔案 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Material Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <!-- 使用 unpkg CDN 載入未損壞的字體 -->
    <style>
      @font-face {
        font-family: 'Ionicons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'MaterialIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/MaterialIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/MaterialCommunityIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'FontAwesome';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/FontAwesome.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Feather';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Feather.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'AntDesign';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/AntDesign.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Entypo';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Entypo.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'SimpleLineIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/SimpleLineIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      /* 確保圖標元素使用正確的字體 */
      [data-testid*="icon"] {
        font-family: 'Ionicons', 'MaterialIcons', 'FontAwesome', sans-serif !important;
      }
    </style>
    `;
    
    html = html.replace('</head>', `${iconLinks}\n</head>`);
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ 已添加圖標字體載入到 index.html');
  }
}
```

### 整合到建構流程

在 `package.json` 中更新建構腳本：

```json
{
  "scripts": {
    "web:build": "expo export --platform web --output-dir dist-web && node scripts/fix-portal.js && node scripts/fix-web-icons.js"
  }
}
```

## 嘗試過但失敗的方案

### 1. ❌ 使用 useFonts hook 預載字體
```typescript
// 這個方法會導致整個應用無法載入
import { useFonts } from 'expo-font';

export function useIconFonts() {
  const [fontsLoaded] = useFonts({
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    // ...
  });
  return fontsLoaded;
}
```
**失敗原因**：字體檔案已經被 Metro 破壞，即使預載也無法使用

### 2. ❌ 修改 Metro 配置
```javascript
// metro.config.js
config.transformer.assetRegistryFormat = 'png';
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');
```
**失敗原因**：這些配置無法阻止 Metro 破壞字體檔案

### 3. ❌ 使用本地字體檔案路徑
```css
@font-face {
  font-family: 'Ionicons';
  src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.6148e7019854f3bde85b633cb88f3c25.ttf');
}
```
**失敗原因**：本地檔案已經被 Metro 破壞

### 4. ❌ 使用錯誤的 CDN 路徑
```css
/* GitHub raw 路徑不正確 */
src: url('https://raw.githubusercontent.com/oblador/react-native-vector-icons/master/Fonts/Ionicons.ttf');
```
**失敗原因**：路徑錯誤，返回 404

## 關鍵要點

1. **不要依賴 Metro bundler 處理字體檔案** - 它會破壞二進制資料
2. **使用可靠的 CDN** - unpkg.com 提供穩定的字體檔案服務
3. **版本要匹配** - react-native-vector-icons@10.0.0 與 @expo/vector-icons 相容
4. **後處理方案** - 在建構後修改 HTML 是最可靠的方法

## 可用的 CDN 資源

- **unpkg**: `https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/[FontName].ttf`
- **jsDelivr**: `https://cdn.jsdelivr.net/npm/react-native-vector-icons@10.0.0/Fonts/[FontName].ttf`
- **Google Fonts** (Material Icons): `https://fonts.googleapis.com/icon?family=Material+Icons`

## 未來建議

1. **考慮升級到 Expo SDK 54+** - 可能已修復此問題
2. **使用 SVG 圖標** - 完全避免字體載入問題
3. **開發專用的 Web 圖標元件** - 針對 Web 平台使用不同的實現

## 參考資料

- [Expo Vector Icons 文檔](https://docs.expo.dev/guides/icons/)
- [react-native-vector-icons GitHub](https://github.com/oblador/react-native-vector-icons)
- [unpkg CDN](https://unpkg.com/)
- [相關 Issue 討論](https://github.com/expo/expo/issues/26843)

---

*最後更新：2025-08-08*
*解決環境：Expo SDK 53, @expo/vector-icons 14.1.0, Metro bundler*