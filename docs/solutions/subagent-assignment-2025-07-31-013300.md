# Subagent 分工執行計劃
生成時間：2025-07-31 01:33:00

## 五個 Subagent 並行任務分配

### 🎨 Subagent 1: Frontend UI Agent
**負責範圍**：所有 UI 相關錯誤修復

**具體任務**：
1. **Ionicons 批量修復**（150+ 個錯誤）
   - 建立自動替換腳本
   - 將所有 `<Icon name="Ionicons:xxx" />` 替換為正確的導入方式
   - 在檔案頂部加入 `import { Ionicons } from '@expo/vector-icons';`
   - 更新 Icon 元件以支援新的圖標系統

2. **修復 UI 元件類型錯誤**
   - 解決 "string | number | symbol" 類型不匹配問題
   - 更新 Button、TextInput 等基礎元件

3. **Web 元件相容性處理**
   - 處理 WebIcon、WebModal 等 Web 特定元件

**預計修復錯誤數**：200+

**執行腳本**：
```bash
# 建立並執行 Ionicons 修復腳本
node scripts/fix-ionicons.js

# 執行類型修復
npm run type-check -- --fix
```

---

### 📊 Subagent 2: Data Visualization Agent
**負責範圍**：圖表和資料視覺化錯誤

**具體任務**：
1. **Victory Chart 升級適配**（100+ 個錯誤）
   - 更新 BarChart.tsx 的資料結構
   - 更新 LineChart.tsx 的 props 類型
   - 修復 PieChart.tsx 的相容性問題
   - 建立統一的圖表資料類型定義

2. **圖表元件重構**
   - 建立 BaseChart 抽象層
   - 統一處理資料轉換邏輯
   - 確保所有圖表使用一致的 API

3. **統計卡片修復**
   - 修復 StatCard 的圖標問題
   - 更新資料繫結邏輯

**預計修復錯誤數**：120+

**關鍵檔案**：
- src/components/charts/*.tsx
- src/components/analytics/*.tsx
- src/types/charts.ts（新建）

---

### 🔧 Subagent 3: Integration & Module Agent
**負責範圍**：模組整合和依賴問題

**具體任務**：
1. **React Native 手勢處理器修復**（5+ 個錯誤）
   - 修正 AudioEditor.tsx 的導入
   - 確保手勢功能正常運作

2. **移除不相容的 Web 依賴**（20+ 個錯誤）
   - 移除 @mui/material 相關程式碼
   - 重寫 TeamDataSyncTool 使用 React Native 元件
   - 處理 AuthContext 路徑問題

3. **修復模組路徑問題**
   - 檢查並修復所有相對路徑導入
   - 統一模組導入規範

**預計修復錯誤數**：30+

**執行命令**：
```bash
# 檢查缺失的模組
npm ls --depth=0

# 安裝必要的依賴
npm install react-native-gesture-handler
```

---

### 🧪 Subagent 4: Testing & DevOps Agent
**負責範圍**：測試環境和建構工具

**具體任務**：
1. **Vite/Vitest 版本統一**（50+ 個錯誤）
   - 清理並重新安裝測試相關依賴
   - 更新 vitest.config.ts
   - 確保測試環境正常運作

2. **修復測試檔案錯誤**
   - 更新測試工具的類型定義
   - 修復 container 屬性問題
   - 調整測試配置

3. **建構環境優化**
   - 清理 node_modules
   - 更新 package-lock.json
   - 優化建構腳本

**預計修復錯誤數**：80+

**執行步驟**：
```bash
# 清理並重裝
rm -rf node_modules package-lock.json
npm install
npm install -D vite@latest vitest@latest
```

---

### 🏗️ Subagent 5: Type System & Architecture Agent
**負責範圍**：TypeScript 類型系統和架構問題

**具體任務**：
1. **建立缺失的類型定義**（100+ 個錯誤）
   - 為 Ionicons 建立類型定義
   - 補充缺失的介面定義
   - 統一類型匯出結構

2. **修復類型不匹配問題**
   - 處理聯合類型錯誤
   - 解決類型推斷問題
   - 優化泛型使用

3. **架構層面優化**
   - 建立類型定義中心（types/index.ts）
   - 統一錯誤處理類型
   - 優化模組結構

**預計修復錯誤數**：150+

**關鍵任務**：
```typescript
// 建立全域類型定義
// types/global.d.ts
declare module '@expo/vector-icons' {
  export const Ionicons: any;
  // ... 其他圖標集
}
```

---

## 執行協調計劃

### 並行執行順序：
1. **第一波（立即開始）**：
   - Frontend UI Agent：開始 Ionicons 批量修復
   - Integration Agent：修復手勢處理器
   - Testing Agent：清理環境

2. **第二波（30分鐘後）**：
   - Data Visualization Agent：開始圖表修復
   - Type System Agent：建立類型定義

3. **協調點**：
   - 每個 Agent 完成主要任務後回報
   - 共享已建立的類型定義和工具函數
   - 避免衝突的檔案修改

### 通訊機制：
- 使用 Git 分支隔離各 Agent 的修改
- 定期合併已完成的修復
- 維護修復進度追蹤表

### 預期完成時間：
- 並行執行：2-3 小時
- 串行執行：6-8 小時
- 效率提升：60-70%

## 成功標準

每個 Subagent 完成後應達到：
1. 負責範圍內的錯誤數降至 0
2. 相關功能測試通過
3. 沒有引入新的錯誤
4. 程式碼符合專案規範

## 緊急處理機制

如果某個 Subagent 遇到阻塞：
1. 立即通報問題詳情
2. 其他 Agent 評估是否可協助
3. 必要時調整任務分配
4. 保持整體進度不受影響