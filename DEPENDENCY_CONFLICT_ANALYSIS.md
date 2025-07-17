# 🔍 依賴衝突根本原因分析

## 💥 確診問題

### 核心問題：React Native 模組完全缺失
```bash
npm error invalid: react-native@ /Users/skyler/coding/DonnaAI-1.0/node_modules/react-native
ls: node_modules/react-native/package.json: No such file or directory
```

**這就是為什麼 Metro bundler 無法啟動的真正原因！**

### 依賴衝突詳細分析

#### 1. React Native 安裝失敗
- package.json 顯示 `"react-native": "0.79.5"`
- 但 node_modules 中完全沒有 react-native 目錄
- 所有其他套件都在等待 react-native，但它不存在

#### 2. Metro 套件被標記為 extraneous
```
metro@0.82.5 extraneous
metro-config@0.82.5 extraneous
metro-babel-transformer@0.82.5 extraneous
```
- 這是因為 Metro 是 React Native 的依賴
- React Native 沒安裝，所以 Metro 變成孤兒

#### 3. React 19 相容性問題
- React 19.0.0 與許多 React Native 生態系統套件不相容
- 測試庫版本衝突已修復，但可能還有其他相容性問題

## 🛠️ 解決方案階層

### 第一階段：修復 React Native 安裝
```bash
# 方案 A: 強制重新安裝
rm -rf node_modules package-lock.json
npm install react-native@0.79.5 --legacy-peer-deps --force

# 方案 B: 降級到更穩定的組合
npm install react-native@0.74.0 react@18.3.1 --legacy-peer-deps
```

### 第二階段：驗證 Metro 可用性
```bash
# 檢查 React Native 是否正確安裝
ls node_modules/react-native/package.json
node -p "require('react-native/package.json').version"

# 檢查 Metro 是否可以載入
node -p "require('metro')"
```

### 第三階段：測試 Metro 啟動
```bash
# 清理快取並啟動
npx react-native start --reset-cache --host 0.0.0.0
```

## 🎯 建議的最佳實作

### 選項 1: 使用 Expo SDK 推薦版本（最安全）
```json
{
  "react": "18.3.1",
  "react-native": "0.74.0",
  "expo": "~51.0.0"
}
```

### 選項 2: 保持當前版本但修復衝突
```bash
# 明確安裝所有相關依賴
npm install react-native@0.79.5 @react-native/metro-config metro --legacy-peer-deps --force
```

### 選項 3: 切換到 Development Build
```bash
# 如果繼續有問題，建議使用 Expo Development Build
npx create-expo-app --template
```

## 📋 檢查清單

- [ ] React Native 模組存在於 node_modules
- [ ] Metro 套件不再標記為 extraneous  
- [ ] `npx react-native --version` 有正確輸出
- [ ] `curl localhost:8081` 有回應
- [ ] Expo Go 能成功連接

## 🚨 緊急解決方案

如果所有安裝方法都失敗：

```bash
# 使用 Yarn 替代 npm
npm install -g yarn
yarn install
yarn start
```

或

```bash
# 使用 Expo Development Server 繞過 Metro
npx @expo/dev-server start --lan
```