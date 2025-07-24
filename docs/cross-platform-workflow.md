# 跨平台開發工作流程

## 核心原則
雖然 Expo SDK 53 的 Web HMR 有問題，但程式碼本身是完全跨平台的。我們只需要調整開發流程。

## 推薦的開發工作流程

### 1. 日常開發流程

#### 步驟 1：在原生平台上開發和測試
```bash
# 啟動開發伺服器（iOS/Android）
npm start

# 在 iOS 模擬器測試
i

# 在 Android 模擬器測試
a
```

#### 步驟 2：定期檢查 Web 版本
```bash
# 每完成一個功能後，導出並測試 Web 版本
npx expo export --platform web --output-dir dist-web

# 啟動本地伺服器測試
cd dist-web && npx serve
```

### 2. 自動化測試腳本

建立一個腳本來簡化 Web 測試：

```bash
# scripts/test-web.sh
#!/bin/bash
echo "🌐 正在構建 Web 版本..."
npx expo export --platform web --output-dir dist-web --clear

echo "🚀 啟動 Web 伺服器..."
cd dist-web && npx serve -p 3000
```

使用方式：
```bash
chmod +x scripts/test-web.sh
./scripts/test-web.sh
```

### 3. 平台特定程式碼處理

#### 使用 Platform API
```typescript
import { Platform } from 'react-native';

// 平台特定邏輯
if (Platform.OS === 'web') {
  // Web 特定程式碼
} else if (Platform.OS === 'ios') {
  // iOS 特定程式碼
} else if (Platform.OS === 'android') {
  // Android 特定程式碼
}
```

#### 平台特定檔案
```
src/components/
  ├── MyComponent.tsx        # 共用邏輯
  ├── MyComponent.web.tsx    # Web 特定實現
  ├── MyComponent.ios.tsx    # iOS 特定實現
  └── MyComponent.android.tsx # Android 特定實現
```

### 4. Web 特定優化

#### 響應式設計
```typescript
import { Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const isDesktop = isWeb && width > 768;

const styles = StyleSheet.create({
  container: {
    padding: isDesktop ? 40 : 20,
    maxWidth: isDesktop ? 1200 : '100%',
    marginHorizontal: isDesktop ? 'auto' : 0,
  }
});
```

#### Web 特定功能
```typescript
// 檔案下載（Web vs 原生）
const downloadFile = async (url: string, filename: string) => {
  if (Platform.OS === 'web') {
    // Web: 使用瀏覽器下載
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  } else {
    // 原生: 使用 expo-file-system
    const { downloadAsync, documentDirectory } = FileSystem;
    await downloadAsync(url, documentDirectory + filename);
  }
};
```

## 持續整合（CI）建議

### GitHub Actions 工作流程
```yaml
name: Build and Test All Platforms

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build Web version
        run: npx expo export --platform web --output-dir dist-web
        
      - name: Upload Web artifacts
        uses: actions/upload-artifact@v3
        with:
          name: web-build
          path: dist-web/
```

## 部署策略

### Web 版本部署
1. **Vercel**（推薦）
   ```bash
   # 安裝 Vercel CLI
   npm i -g vercel
   
   # 部署
   npx expo export --platform web --output-dir dist-web
   cd dist-web && vercel
   ```

2. **Netlify**
   - 將 `dist-web` 資料夾拖放到 Netlify
   - 或使用 Netlify CLI

3. **GitHub Pages**
   ```bash
   # 使用 gh-pages 套件
   npm install --save-dev gh-pages
   
   # package.json 加入腳本
   "deploy-web": "expo export --platform web --output-dir dist-web && gh-pages -d dist-web"
   ```

### 原生版本部署
- 使用 EAS Build 和 EAS Submit
- 遵循標準的 App Store 和 Google Play 流程

## 開發技巧

### 1. 使用共享組件庫
將 UI 組件抽象化，確保跨平台一致性：
```typescript
// src/components/ui/Button.tsx
export const Button = ({ onPress, title, variant = 'primary' }) => {
  const isWeb = Platform.OS === 'web';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        styles[variant],
        isWeb && styles.webButton
      ]}
      activeOpacity={isWeb ? 1 : 0.7}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};
```

### 2. 統一的狀態管理
使用 Zustand 確保狀態在所有平台同步：
```typescript
// 狀態會自動在所有平台同步
const useAppStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  // ...
}));
```

### 3. 響應式圖片處理
```typescript
import { Image, Platform } from 'react-native';

const ResponsiveImage = ({ source, style }) => {
  const webSource = Platform.OS === 'web' 
    ? { uri: source.uri || source } 
    : source;
    
  return (
    <Image
      source={webSource}
      style={[
        style,
        Platform.OS === 'web' && { objectFit: 'cover' }
      ]}
      resizeMode="cover"
    />
  );
};
```

## 快速指令參考

```bash
# 開發原生應用
npm start

# 測試 Web 版本
npx expo export --platform web --output-dir dist-web && cd dist-web && npx serve

# 清理並重建
npx expo start --clear

# 檢查各平台
npx expo doctor
```

## 注意事項

1. **始終在原生平台測試核心功能**：因為 HMR 在原生平台運作正常
2. **定期導出測試 Web 版本**：每完成一個功能就測試
3. **使用 TypeScript**：確保類型安全，減少平台差異錯誤
4. **避免平台特定 API**：盡可能使用跨平台的解決方案

## 結論

雖然 Expo SDK 53 的 Web HMR 有限制，但通過適當的工作流程，我們仍然可以高效地開發跨平台應用。關鍵是：
- 在原生平台上享受完整的開發體驗
- 定期導出測試 Web 版本
- 使用自動化工具簡化流程
- 遵循跨平台最佳實踐