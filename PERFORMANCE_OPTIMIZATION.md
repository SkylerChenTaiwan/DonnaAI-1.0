# DonnaAI 效能優化指南

## 🚨 立即改善措施

### 1. 清理系統資源
```bash
# 重啟 Metro bundler
npx expo start --clear

# 清理 npm 快取
npm cache clean --force

# 清理 node_modules (如果需要)
rm -rf node_modules && npm install
```

### 2. 記憶體優化
- 關閉不必要的應用程式
- 重新啟動電腦釋放記憶體
- 檢查是否有記憶體洩漏的進程

### 3. Metro Bundler 優化
在 `metro.config.js` 中加入快取設定：
```javascript
// 加入 transformer 快取
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// 啟用快取
config.cacheStores = [
  require('metro-cache/src/stores/FileStore')({
    root: require('path').join(__dirname, 'tmp', 'metro-cache'),
  }),
];
```

## 🔧 程式碼優化建議

### 1. React 效能優化

#### 使用 React.memo 包裝重複渲染的元件
```typescript
// 例如在 TaskListSection.tsx
export const TaskListSection = React.memo<TaskListSectionProps>(({ tasks, onTaskUpdate }) => {
  // ... 元件內容
});
```

#### 優化 useEffect 依賴
```typescript
// 避免物件依賴造成無限重渲染
const fetchData = useCallback(async () => {
  // fetch logic
}, [userId, teamId]); // 只依賴原始值

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 2. Zustand Store 優化

#### 使用選擇器減少不必要的重渲染
```typescript
// 避免
const { user, tasks, customers, loading } = useTaskStore();

// 建議
const tasks = useTaskStore(state => state.tasks);
const loading = useTaskStore(state => state.loading);
```

### 3. Firebase 查詢優化

#### 使用索引和限制
```typescript
// 加入查詢限制
const tasksQuery = query(
  collection(db, 'tasks'),
  where('teamId', '==', teamId),
  orderBy('dueDate'),
  limit(50) // 限制結果數量
);
```

## 🎮 開發環境優化

### 1. Expo 開發選項
```bash
# 使用生產模式測試
npx expo start --no-dev --minify

# 使用 LAN 模式
npx expo start --lan
```

### 2. React Native Flipper
安裝 Flipper 進行效能監控：
```bash
npx react-native flipper
```

### 3. React DevTools Profiler
在程式碼中加入效能監控：
```typescript
import { Profiler } from 'react';

<Profiler id="Dashboard" onRender={handleRender}>
  <EnhancedDashboardV2 />
</Profiler>
```

## 🔍 效能監控

### 1. 加入效能指標
```typescript
// src/utils/performance.ts
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};
```

### 2. 監控 Firebase 查詢時間
```typescript
const startTime = Date.now();
const snapshot = await getDocs(query);
console.log(`Query took ${Date.now() - startTime}ms`);
```

## 📱 設備相關優化

### iOS Simulator 優化
- 使用 Device > Erase All Content and Settings
- 關閉 Hardware > Graphics Quality Override
- 設定 Debug > Slow Animations 為 off

### 實機測試
- 使用 Release 模式構建
- 測試在不同裝置上的表現
- 監控記憶體使用情況

## 🚀 部署優化

### 1. Bundle 大小優化
```bash
# 分析 bundle 大小
npx expo export --platform ios --dev false
npx @expo/bundle-analyzer dist/bundles/ios-*.js
```

### 2. 程式碼分割
使用動態 import：
```typescript
const LazyAdminScreen = React.lazy(() => import('./screens/admin/AdminScreen'));
```

## 📊 監控指標

追蹤以下指標：
- App 啟動時間
- 頁面載入時間
- API 回應時間
- 記憶體使用量
- Bundle 大小