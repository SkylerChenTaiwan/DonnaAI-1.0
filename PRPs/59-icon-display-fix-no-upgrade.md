# PRP-59: 修復 Icon 顯示問題（不升級版本）

## 📋 概述
解決 Expo Web 平台上 Icon 無法正常顯示的問題，出現 "OTS parsing error: invalid sfntVersion" 錯誤。要求在不升級任何框架版本的前提下解決此問題。

## 🎯 目標
1. 修復 Web 平台上的 Icon 顯示問題
2. 保持現有版本框架不變（Expo SDK 53、React Native 0.79.5）
3. 確保原生平台（iOS/Android）功能不受影響
4. 提供穩定且可維護的解決方案

## 🔍 問題分析

### 根本原因
1. **字體載入問題**：Metro bundler 嘗試解析 TTF 字體檔案時失敗
2. **Webpack 配置缺失**：Expo SDK 53 使用 Metro 作為 Web bundler，缺少對字體檔案的正確處理
3. **MIME 類型錯誤**：伺服器可能未正確設定字體檔案的 MIME 類型

### 現有狀況
- 已實作 Web Components (ion-icon) 作為臨時解決方案
- 仍然存在 OTS parsing error 的警告訊息
- 部分 Icon 名稱對應需要調整

## 💡 解決方案

### 方案 A：改進 Metro 配置（推薦）
**優點**：從根本解決問題，保持使用原生 @expo/vector-icons
**缺點**：需要深入了解 Metro 配置

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 排除字體檔案的解析
config.resolver.assetExts = config.resolver.assetExts.filter(
  ext => !['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext)
);

// 將字體檔案視為資源
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot');

// 自定義資源轉換器
config.transformer.assetPlugins = [
  ...(config.transformer.assetPlugins || []),
  require.resolve('./fontAssetPlugin.js')
];

module.exports = config;
```

### 方案 B：使用 Base64 編碼字體
**優點**：避免字體載入問題，不需要外部請求
**缺點**：增加 bundle 大小

```typescript
// src/utils/base64Fonts.ts
export const ioniconsBase64 = {
  fontFamily: 'Ionicons',
  fontData: 'data:font/ttf;base64,AAEAAAALAIAAAwAwT1...' // 實際的 base64 字體數據
};

// 在 App.tsx 中載入
const loadBase64Fonts = () => {
  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Ionicons';
        src: url('${ioniconsBase64.fontData}') format('truetype');
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }
};
```

### 方案 C：完善 Web Components 整合（當前部分實作）
**優點**：使用官方支援的 Web 版本，無需處理字體檔案
**缺點**：需要網路連線，Icon 名稱對應需要額外處理

改進現有實作：
```typescript
// src/components/common/Icon.tsx
const iconNameMapping = {
  'home-outline': 'home-outline',
  'home-sharp': 'home-sharp',
  'person-outline': 'person-outline',
  'add-circle': 'add-circle-outline',
  // 更多對應...
};

const WebIcon: React.FC<IconProps> = ({ name, size = 24, color = '#000', style }) => {
  const mappedName = iconNameMapping[name] || name.replace(/-sharp$|-outline$/, '');
  
  // 確保自定義元素已註冊
  useEffect(() => {
    if (typeof window !== 'undefined' && !customElements.get('ion-icon')) {
      // 動態載入 Ionicons
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js';
      document.head.appendChild(script);
    }
  }, []);
  
  return React.createElement('ion-icon', {
    name: mappedName,
    style: {
      fontSize: `${size}px`,
      color,
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style,
    },
  });
};
```

### 方案 D：使用 SVG Icons 替代方案
**優點**：不需要字體檔案，更好的跨平台相容性
**缺點**：需要重構大量程式碼

```typescript
// src/components/common/SvgIcon.tsx
import { Platform } from 'react-native';
import { Svg, Path } from 'react-native-svg';

const iconPaths = {
  'home': 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  'person': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  // 更多 SVG 路徑...
};

export const SvgIcon: React.FC<IconProps> = ({ name, size = 24, color = '#000' }) => {
  const path = iconPaths[name];
  
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d={path} />
      </svg>
    );
  }
  
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d={path} />
    </Svg>
  );
};
```

### 方案 E：修復 MIME 類型和伺服器配置
**優點**：簡單直接，可能立即解決問題
**缺點**：需要伺服器端配置權限

1. **Firebase Hosting 配置**：
```json
// firebase.json
{
  "hosting": {
    "headers": [{
      "source": "**/*.@(ttf|otf|woff|woff2)",
      "headers": [{
        "key": "Content-Type",
        "value": "font/ttf"
      }, {
        "key": "Access-Control-Allow-Origin",
        "value": "*"
      }]
    }]
  }
}
```

2. **開發伺服器配置**：
```javascript
// customDevServer.js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  if (req.url.endsWith('.ttf')) {
    res.setHeader('Content-Type', 'font/ttf');
  }
  next();
});
```

## 📝 實施計劃

### 第一階段：快速修復（1-2 小時）
1. 改進現有 Web Components 整合（方案 C）
2. 添加完整的 Icon 名稱對應表
3. 確保所有使用的 Icon 都能正確顯示

### 第二階段：根本解決（2-4 小時）
1. 實施 Metro 配置改進（方案 A）
2. 建立字體資源處理插件
3. 測試確保原生平台不受影響

### 第三階段：優化和備選（可選）
1. 評估 Base64 編碼方案的可行性
2. 準備 SVG 替代方案作為最終備選

## ✅ 驗收標準
1. Web 平台上所有 Icon 正常顯示，無錯誤訊息
2. 原生平台（iOS/Android）功能保持不變
3. 不升級任何主要依賴版本
4. 效能影響最小化
5. 解決方案可維護且文檔完整

## 🚀 建議執行順序
1. **立即執行**：方案 C（改進 Web Components）- 快速解決顯示問題
2. **後續優化**：方案 A（Metro 配置）- 從根本解決問題
3. **備用方案**：方案 D（SVG Icons）- 如果其他方案失敗

## 📚 參考資源
- [Metro Configuration Guide](https://metrobundler.dev/docs/configuration)
- [Ionicons Web Components](https://ionic.io/ionicons)
- [React Native Web Font Loading](https://github.com/necolas/react-native-web/issues/1266)
- [Expo Web Troubleshooting](https://docs.expo.dev/guides/customizing-metro/#web)

## 📊 風險評估
- **低風險**：方案 C、E（僅影響 Web 平台）
- **中風險**：方案 A（可能影響打包流程）
- **高風險**：方案 D（需要大量程式碼重構）

## 💭 決策建議
建議先執行方案 C 快速修復顯示問題，確保功能可用。然後在有時間的情況下，實施方案 A 從根本解決問題。方案 B 和 D 作為備選方案，在前述方案無效時考慮使用。