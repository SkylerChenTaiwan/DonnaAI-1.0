# React 19 升級總結

## 背景

在使用 Expo SDK 52 時，Metro bundler 突然無法連接。經過調查發現：

1. **SDK 版本不匹配**：專案使用 SDK 52，但 Expo Go 應用已升級到 SDK 53
2. **UI/UX 修改引入問題**：安裝了 `react-native-popover-view` 套件
3. **強制新架構**：Expo Go SDK 53 強制啟用 New Architecture 和 Hermes
4. **React 版本衝突**：SDK 53 期望 React 19，但專案使用 React 18

## 解決方案：升級到 React 19

### 步驟 1：移除不相容的套件
```bash
npm uninstall react-native-popover-view
```

### 步驟 2：準備 React 19 升級
1. **移除 defaultProps 使用** - React 19 不再支援 defaultProps（專案中未使用）
2. **更新 TypeScript 類型** - 升級到 @types/react@19.0.0
3. **移除 React.FC 使用** - 改用更現代的函數參數類型標註

### 步驟 3：安裝 React 19
```json
{
  "dependencies": {
    "react": "19.0.0",
    // ...
  },
  "devDependencies": {
    "@types/react": "~19.0.0",
    "@testing-library/react": "^16.1.0",
    // ...
  },
  "overrides": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "react-test-renderer": "19.0.0"
  }
}
```

## 變更摘要

### 組件重構
移除了 30+ 個組件中的 `React.FC` 使用：

```typescript
// 變更前
export const Button: React.FC<ButtonProps> = ({ title, onPress }) => {

// 變更後
export const Button = ({ title, onPress }: ButtonProps) => {
```

### 相依套件更新
- `react`: 18.3.1 → 19.0.0
- `@types/react`: ~19.0.10 → ~19.0.0
- `@testing-library/react`: ^15.0.0 → ^16.1.0

## 當前狀態

✅ **已完成**：
- 移除 react-native-popover-view
- 升級到 React 19
- 移除所有 React.FC 使用
- 更新相關類型定義
- Metro bundler 正常運行

⏳ **待測試**：
- 在 Expo Go SDK 53 中運行應用程式
- 確認所有功能正常運作
- 檢查是否有其他相容性問題

## 注意事項

1. **使用 --legacy-peer-deps**：由於某些套件尚未完全支援 React 19，安裝時需使用 `npm install --legacy-peer-deps`

2. **Firebase 相容性**：Firebase SDK 與 Metro 的 exports field 仍有問題，需要使用 `create-firebase-patches.js` 腳本

3. **開發建議**：
   - 避免使用尚未支援 New Architecture 的第三方套件
   - 定期更新 Expo SDK 以獲得最新的相容性修復
   - 使用 EAS Build 建立自定義開發客戶端可避免 Expo Go 的限制

## 後續步驟

1. 在實際設備上測試應用程式
2. 修復任何運行時錯誤
3. 考慮升級其他過時的套件（eslint-config-expo、jest-expo、typescript）
4. 評估是否需要建立自定義開發客戶端