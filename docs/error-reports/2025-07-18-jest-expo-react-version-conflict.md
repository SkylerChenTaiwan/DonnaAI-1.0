# Jest-Expo React 版本衝突分析

## 問題摘要
- **問題**: jest-expo@52.0.6 內部依賴 React 19.0.0-rc（候選版本），與專案使用的 React 18.3.1 衝突
- **影響**: 導致測試環境版本不一致，可能造成測試失敗或不可預期的行為
- **發現時間**: 2025-07-18

## 技術分析

### 依賴樹問題
```
donnaai-mobile@1.0.0
├── react@18.3.1 (專案主要版本)
└── jest-expo@52.0.6
    └── react-server-dom-webpack@19.0.0-rc-6230622a1a-20240610
        └── react@19.0.0-rc-6230622a1a-20240610 (衝突版本)
```

### 根本原因
1. jest-expo 52.0.6 內部依賴了 React 19 的候選版本
2. 這是 Expo SDK 53 測試工具的已知問題
3. React 19 仍處於候選發布階段，不適合生產環境使用

## 解決方案

### 方案 A：使用 npm overrides 強制統一版本（推薦）
在 package.json 中添加：
```json
{
  "overrides": {
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-test-renderer": "18.3.1"
  }
}
```

然後執行：
```bash
rm -rf node_modules package-lock.json
npm install
```

### 方案 B：降級 jest-expo 到穩定版本
```bash
npm install jest-expo@51.0.4 --save-dev
```

### 方案 C：完全移除 jest-expo，使用 Vitest
由於專案已經配置了 Vitest，可以考慮完全移除 jest-expo：
```bash
npm uninstall jest-expo jest
```

## 影響評估
- **開發影響**: 測試環境可能不穩定
- **生產影響**: 無（僅影響測試環境）
- **優先級**: 中等 - 不影響應用運行，但影響測試可靠性

## 建議
1. 短期：使用方案 A 統一 React 版本
2. 長期：等待 Expo 官方修復或考慮遷移到 Vitest