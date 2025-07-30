# 錯誤解決方案計劃：舊系統資料導入頁面返回功能與驗證問題

**日期**: 2025-01-30 16:30
**問題識別碼**: legacy-import-navigation-validation
**協調 agents**: test-writer-fixer, backend-architect, code-reviewer
**專案**: DonnaAI-1.0
**使用者回報問題**:
1. LegacyDataImportScreen 這一頁沒有返回上一頁的功能
2. CSV 資料驗證失敗，希望跳過必填欄位為空白的記錄

## 解決方案概述

### 方案 1: 修復 LegacyDataImportScreen 返回功能

#### 實施步驟
1. 在元件中引入 `useNavigation` hook
2. 獲取 navigation 物件
3. 確保返回按鈕正常運作

#### 程式碼修改
```typescript
import { useNavigation } from '@react-navigation/native';

export const LegacyDataImportScreen: React.FC = () => {
  const navigation = useNavigation();
  // ... 其他程式碼
```

#### 優點
- 快速修復
- 符合 React Navigation 標準做法
- 不影響其他功能

#### 風險評估
- 風險：極低
- 影響範圍：僅此頁面

### 方案 2: 改進資料驗證邏輯（跳過空白記錄）

#### 實施策略
修改各個 importer 的驗證邏輯，當必填欄位為空時：
1. 不將其視為錯誤
2. 直接跳過該筆記錄
3. 在結果中記錄跳過的數量

#### 需要修改的檔案
- `/src/services/csv/legacy-import/codeMappingImporter.ts`
- `/src/services/csv/legacy-import/userImporter.ts`
- `/src/services/csv/legacy-import/customerImporter.ts`
- `/src/services/csv/legacy-import/visitImporter.ts`

#### 驗證邏輯修改範例
```typescript
// 原本的驗證
if (!record.customerName) {
  errors.push('客戶名稱為必填欄位');
}

// 修改為
if (!record.customerName) {
  // 跳過這筆記錄，不匯入
  skippedRecords.push({
    reason: '缺少必填欄位',
    record: record
  });
  continue; // 跳到下一筆
}
```

#### 優點
- 符合使用者需求
- 避免大量錯誤訊息
- 保持資料完整性（只匯入完整的記錄）

#### 風險評估
- 風險：低
- 需要確保跳過的記錄有適當的日誌記錄

### 方案 3: Firebase 網路問題處理

#### 短期解決方案
1. 在 Firebase 配置中停用 QUIC 協議
2. 增加錯誤重試機制

#### 長期解決方案
1. 更新 Firebase SDK 版本
2. 實施更完善的錯誤處理
3. 增加連線狀態監控

#### 實施細節
```typescript
// 停用 experimentalForceLongPolling
const firebaseConfig = {
  // ... 現有配置
  experimentalForceLongPolling: true, // 強制使用長輪詢
};
```

### 方案 4: 動畫警告處理

#### 解決方案
在 Web 平台條件性地停用 useNativeDriver：

```typescript
const animationConfig = {
  useNativeDriver: Platform.OS !== 'web',
  // ... 其他配置
};
```

## 實施優先順序

### 立即執行（優先級：高）
1. **修復 LegacyDataImportScreen 返回功能**
   - 預計時間：5 分鐘
   - 負責 agent：code-reviewer

2. **改進資料驗證邏輯**
   - 預計時間：30 分鐘
   - 負責 agent：backend-architect

### 後續處理（優先級：中）
3. **Firebase 網路問題**
   - 預計時間：20 分鐘
   - 負責 agent：backend-architect

### 可選處理（優先級：低）
4. **動畫警告**
   - 預計時間：10 分鐘
   - 負責 agent：test-writer-fixer

## 成功標準
- [ ] LegacyDataImportScreen 可以正常返回
- [ ] CSV 匯入時自動跳過空白記錄
- [ ] 沒有驗證錯誤阻擋有效資料的匯入
- [ ] Firebase 連線穩定
- [ ] 控制台警告減少

---
計劃制定時間：2025-01-30 16:30:00