# Metro Bundler + Firebase 在 Expo SDK 52/53 相容性問題 - 完整解決方案

## 🔴 重要發現：問題的真正原因

我們發現了一個關鍵問題：**Metro 會在命令行超時（2分鐘）後自動停止！**

這就是為什麼：
- 一開始可以連接成功
- 但過了一段時間後就無法連接
- Metro 顯示 "Starting Metro Bundler" 但實際上已經停止運行

## 問題描述

在使用 Expo SDK 52/53 與 Firebase SDK 時會遇到的問題：

1. **Metro 假啟動**：顯示 "Starting Metro Bundler" 但實際上無法連接（port 8081 沒有監聽）
2. **Firebase collection 錯誤**：`Expected first argument to collection() to be a CollectionReference`  
3. **Metro 自動停止**：運行一段時間後自動停止（因為命令行超時）
4. **命令超時問題**：`npx expo start` 預設 2 分鐘後超時，導致 Metro 停止運行

## 根本原因分析

### 1. 命令行超時問題（最重要！）
- `npx expo start` 在終端機中執行時有預設的 2 分鐘超時限制
- 超時後 Metro 進程會被終止，但不會有明顯的錯誤訊息
- 這就是為什麼一開始可以連接，但之後就連不上的原因

### 2. Firebase SDK exports field 問題
- Expo SDK 53 的 Metro bundler 預設啟用 `unstable_enablePackageExports`
- Firebase v10+ 套件的 `package.json` 中的 `exports` 欄位與此設定不相容
- 導致 Metro 無法正確解析 Firebase 模組，出現假啟動

### 3. Firebase Proxy 物件問題
- Firebase SDK 內部使用 `instanceof` 檢查物件類型
- Proxy 物件無法通過這些檢查
- 導致 collection/doc 函數拋出錯誤

### 4. 自動化工具修改問題
- 某些 linter 或 IDE 會自動將 `getFirebaseDb()` 改回 `db`
- 導致修復後的程式碼又被改回有問題的版本

## 🎯 完整解決方案（經過驗證）

### 關鍵解決方案：使用 nohup 避免超時！

```bash
# 使用 nohup 在背景執行，避免 2 分鐘超時問題
nohup npx expo start > metro.log 2>&1 &
```

### 完整的啟動腳本

創建 `start-metro.sh`：

```bash
#!/bin/bash

echo "啟動 Metro Bundler..."

# 先停止任何現有的 Metro 進程
pkill -f "expo start" 2>/dev/null
pkill -f "metro" 2>/dev/null

# 等待進程完全停止
sleep 2

# 執行 Firebase patches
echo "執行 Firebase patches..."
node create-firebase-patches.js

# 在背景啟動 Metro（關鍵！使用 nohup 避免超時）
echo "啟動 Metro..."
nohup npx expo start > metro.log 2>&1 &

# 等待 Metro 啟動
echo "等待 Metro 啟動..."
for i in {1..30}; do
  if curl -s http://localhost:8081/status > /dev/null 2>&1; then
    echo "✅ Metro 已成功啟動！"
    echo "📱 請在 Expo Go 中連接到: localhost:8081"
    echo "📋 查看日誌: tail -f metro.log"
    echo "🛑 停止 Metro: pkill -f 'expo start'"
    exit 0
  fi
  echo -n "."
  sleep 2
done

echo ""
echo "⚠️  Metro 啟動可能需要更長時間，請檢查 metro.log"
```

### Firebase 修復腳本

創建 `create-firebase-patches.js`：

```javascript
const fs = require('fs');
const path = require('path');

console.log('\n🔧 正在移除 Firebase 套件的 exports 欄位...\n');

const firebasePackages = [
  'firebase',
  '@firebase/app',
  '@firebase/auth',
  '@firebase/firestore',
  '@firebase/functions',
  '@firebase/storage',
  '@firebase/analytics',
  '@firebase/app-check',
  '@firebase/app-compat',
  '@firebase/auth-compat',
  '@firebase/database',
  '@firebase/database-compat',
  '@firebase/firestore-compat',
  '@firebase/functions-compat',
  '@firebase/installations',
  '@firebase/installations-compat',
  '@firebase/messaging',
  '@firebase/messaging-compat',
  '@firebase/performance',
  '@firebase/performance-compat',
  '@firebase/remote-config',
  '@firebase/remote-config-compat',
  '@firebase/storage-compat',
  '@firebase/util',
  '@firebase/component',
  '@firebase/logger',
  '@firebase/webchannel-wrapper'
];

let modifiedCount = 0;

function removeExportsField(packagePath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageJson.exports) {
      delete packageJson.exports;
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

firebasePackages.forEach(pkg => {
  const packagePath = path.join(__dirname, 'node_modules', pkg, 'package.json');
  if (fs.existsSync(packagePath)) {
    if (removeExportsField(packagePath)) {
      console.log(`✅ 已移除 ${pkg} 的 exports 欄位`);
      modifiedCount++;
    }
  }
});

console.log(`\n總共修改了 ${modifiedCount} 個套件\n`);
```

### 修復 Firebase 使用問題

創建 `fix-firebase-db.sh`：

```bash
#!/bin/bash
echo "修復 Firebase db 使用問題..."
find src/services/firebase -name "*.ts" -type f -exec sed -i '' 's/doc(db,/doc(getFirebaseDb(),/g' {} \;
find src/services/firebase -name "*.ts" -type f -exec sed -i '' 's/collection(db,/collection(getFirebaseDb(),/g' {} \;
echo "修復完成！"
```

### Metro 配置

`metro.config.js`：

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 保持簡單！不要添加過多配置
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver.sourceExts || []), 'cjs'],
  unstable_enablePackageExports: false,
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;
```

## 🚨 重要的經驗教訓

### 1. **永遠不要相信 "Starting Metro Bundler" 訊息**
- 這個訊息出現不代表 Metro 真的在運行
- 永遠要用 `lsof -i:8081 | grep LISTEN` 檢查

### 2. **命令行超時是隱藏的殺手**
- 直接在終端機執行 `npx expo start` 會有 2 分鐘超時
- 超時後 Metro 會默默停止，沒有錯誤訊息
- **解決方案：永遠使用 nohup 或 screen/tmux**

### 3. **不要過度配置 Metro**
以下配置會導致問題，不要使用：
- `enhanceMiddleware`
- `transformer` 配置
- `blockList` 過濾
- `.watchmanconfig` 文件

### 4. **Firebase 版本相容性**
- Firebase v10+ 的 exports 欄位與 Expo SDK 53 不相容
- 必須手動移除 exports 欄位
- 考慮使用 Firebase v9.6.11 避免問題

### 5. **自動化工具會破壞修復**
- 某些 IDE 會自動將 `getFirebaseDb()` 改回 `db`
- 定期執行 `./fix-firebase-db.sh` 確保修復有效

## 📝 快速檢查清單

遇到問題時按順序檢查：

1. **Metro 是否真的在運行？**
   ```bash
   lsof -i:8081 | grep LISTEN
   ```

2. **檢查 Metro 日誌**
   ```bash
   tail -f metro.log
   ```

3. **Firebase patches 是否已執行？**
   ```bash
   cat node_modules/firebase/package.json | grep exports
   # 應該沒有輸出
   ```

4. **是否有使用舊的 db？**
   ```bash
   grep -r "doc(db," src/services/firebase/
   # 應該沒有輸出
   ```

5. **重新啟動 Metro（使用 nohup！）**
   ```bash
   ./start-metro.sh
   ```

## 🎉 最終解決狀態

使用我們的解決方案後：
- ✅ Metro 可以持續運行，不會因超時停止
- ✅ Firebase 服務正常運作，無 collection/doc 錯誤
- ✅ 可以在 Expo Go 中穩定連接
- ✅ 開發體驗順暢

## 版本資訊
- Expo SDK: 52.0.0（穩定版本）
- React Native: 0.76.9
- Firebase: 10.12.2
- Metro: 內建於 Expo SDK
- Node.js: v20.18.0

## ⚠️ 重要提醒

### 1. SDK 版本選擇
- **建議使用 SDK 52**：經過驗證的穩定版本
- **SDK 53 已知問題**：
  - 需要 React 19（可能導致相容性問題）
  - 可能出現 C++ Exception 錯誤
  - 需要大量套件升級

### 2. Expo Go 版本不匹配
如果你的 Expo Go 是 SDK 53：
- **方案 1**：下載 SDK 52 版本的 Expo Go（推薦）
  - iOS: https://expo.dev/go?sdkVersion=52&platform=ios&device=false
  - Android: https://expo.dev/go?sdkVersion=52&platform=android&device=false
- **方案 2**：忽略版本警告，仍可正常使用（會顯示警告但能運行）

## 🔗 相關資源
- [GitHub Issue #36588](https://github.com/expo/expo/issues/36588) - 官方已知問題
- [Watchman Troubleshooting](https://facebook.github.io/watchman/docs/troubleshooting.html#recrawl)
- [Expo SDK 53 升級指南](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)

## 更新日期
- 2025-07-20：發現命令行超時問題，更新完整解決方案
- 2025-07-20：升級到 SDK 53 並記錄新的相容性問題