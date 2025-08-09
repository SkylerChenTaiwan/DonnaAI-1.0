# Web 圖標顯示問題報告

## 問題描述
在 React Native Web 應用中，圖標無法正常顯示，全部顯示為問號（?）。

## 環境資訊
- **框架**: React Native + Expo SDK 53
- **平台**: Web (Firebase Hosting)
- **圖標庫**: @expo/vector-icons (Ionicons)
- **打包工具**: Metro bundler

## 問題根源
根據 Expo 官方文檔，Metro bundler 在處理二進制字體文件時會損壞文件內容，導致圖標無法正常顯示。

## 嘗試過的解決方案

### 方案 1: CDN 載入字體 ❌ 失敗
**實作方式**:
```javascript
// fix-web-icons.js
const fixWebIcons = () => {
  if (Platform.OS === 'web') {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Ionicons';
        src: url('https://unpkg.com/ionicons@7.1.0/dist/fonts/ionicons.woff2') format('woff2');
      }
    `;
    document.head.appendChild(style);
  }
};
```

**結果**: 
- 圖標可以顯示，但產生 NetworkError
- 錯誤訊息: `Uncaught (in promise) NetworkError: A network error occurred`
- 原因: @expo/vector-icons 內部仍嘗試載入本地字體文件

### 方案 2: 創建 Web 專用 SVG 圖標元件 ❌ 部分失敗
**實作方式**:

1. **平台分離檔案結構**:
```
src/components/common/
├── Icon.tsx          # 基礎定義
├── Icon.native.tsx   # Native 平台實作
├── Icon.web.tsx      # Web 平台實作
└── icons/
    └── ionicons/
        ├── person.tsx
        ├── build-outline.tsx
        └── ...
```

2. **Icon.web.tsx 實作**:
```typescript
import React from 'react';
import * as IoniconsWeb from './icons/ionicons';

const iconMap: Record<string, React.ComponentType<any>> = {
  'person': IoniconsWeb.PersonIcon,
  'build-outline': IoniconsWeb.BuildOutlineIcon,
  // ... 140+ 圖標映射
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000' }) => {
  const IconComponent = iconMap[name];
  if (!IconComponent) {
    return <Text>?</Text>;
  }
  return <IconComponent size={size} color={color} />;
};
```

3. **createIcon 工具函數 (多次嘗試)**:

**嘗試 A: 直接 SVG 元素**
```typescript
export function createIcon(paths: string[], viewBox: string = "0 0 512 512") {
  return ({ size = 24, color = '#000' }) => (
    <svg width={size} height={size} viewBox={viewBox} fill={color}>
      {paths.map((d, i) => (
        <path key={i} d={d} fill={color} />
      ))}
    </svg>
  );
}
```
結果: SVG 元素存在於 DOM 但內容不顯示

**嘗試 B: Data URI with encodeURIComponent**
```typescript
export function createIcon(paths: string[], viewBox: string = "0 0 512 512") {
  return ({ size = 24, color = '#000' }) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">
      ${paths.map(d => `<path d="${d}" fill="${color}"/>`).join('')}
    </svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
    return <img src={dataUri} width={size} height={size} alt="" />;
  };
}
```
結果: 圖標顯示為問號

**嘗試 C: Data URI with base64**
```typescript
export function createIcon(paths: string[], viewBox: string = "0 0 512 512") {
  return ({ size = 24, color = '#000' }) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">
      ${paths.map(d => `<path d="${d}" fill="${color}"/>`).join('')}
    </svg>`;
    const dataUri = `data:image/svg+xml;base64,${btoa(svgString)}`;
    return <img src={dataUri} width={size} height={size} alt="" />;
  };
}
```
結果: 圖標仍顯示為問號

4. **實際圖標檔案範例**:
```typescript
// src/components/common/icons/ionicons/person.tsx
import { createIcon } from '../utils/createIcon';

export const PersonIcon = createIcon(
  [
    "M332.64,64.58C313.18,43.57,286,32,256,32c-30.16,0-57.43,11.5-76.8,32.38-19.58,21.11-29.12,49.8-26.88,80.78C156.76,206.28,203.27,256,256,256s99.16-49.71,103.67-110.82C361.94,114.48,352.34,85.85,332.64,64.58Z",
    "M432,480H80A31,31,0,0,1,55.8,468.87c-6.5-7.77-9.12-18.38-7.18-29.11C57.06,392.94,83.4,353.61,124.8,326c36.78-24.51,83.37-38,131.2-38s94.42,13.5,131.2,38c41.4,27.6,67.74,66.93,76.18,113.75,1.94,10.73-.68,21.34-7.18,29.11A31,31,0,0,1,432,480Z"
  ],
  "0 0 512 512"
);
```

## 當前狀況
1. 已成功移除 @expo/vector-icons 依賴，消除 NetworkError
2. 已創建 140+ 個 SVG 圖標元件
3. 平台分離架構正常運作（.native.tsx 和 .web.tsx）
4. 但圖標在 Web 平台仍無法顯示（顯示為問號）

## 瀏覽器開發者工具觀察
- img 元素存在
- src 屬性有 data URI 內容
- 但圖片無法渲染，顯示為問號

## 需要協助的問題
1. 為什麼 SVG data URI 在 React Native Web 中無法正常顯示？
2. 是否有其他方式在 React Native Web 中渲染 SVG 圖標？
3. 是否需要特殊的 webpack/Metro 配置？
4. 是否應該考慮使用其他圖標解決方案（如 react-icons）？

## 相關資源
- [Expo SDK 53 已知問題](https://github.com/expo/expo/issues)
- [Metro bundler 二進制文件處理問題](https://github.com/facebook/metro/issues)
- 專案 GitHub: [需要提供連結]

## 測試環境
- 部署 URL: https://donnaai-5e601.web.app
- 測試頁面: /OnboardingWizardScreen

## 期望結果
能夠在 Web 平台正常顯示所有 Ionicons 圖標，不產生 NetworkError，且不依賴外部 CDN。