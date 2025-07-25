# PRP-42: Admin 系統進階功能完成實作

## 概述
完成 Admin 管理系統剩餘的進階功能，包括用戶新增/編輯 Modal、實際的資料匯入邏輯、報表匯出功能、批量操作的後端 API，以及圖表元件庫的抽取和重用。

## 背景
PRP-41 已完成基本的管理頁面 UI，但許多進階功能仍需實作：
1. 用戶新增/編輯功能（目前只有顯示）
2. 資料匯入邏輯（已有 UI 但未連接服務）
3. 報表匯出功能（按鈕已存在但無功能）
4. 批量操作 API（啟用/停用/刪除用戶）
5. 圖表元件重用（將圖表抽取為可重用元件）

## 研究發現

### 1. 現有程式碼基礎
- **用戶建立 Modal**: `/src/components/personnel/AddUserModal.tsx` 已有完整實作
- **資料匯入服務**: `/src/services/dataImport.ts` 已實作 CSV/Excel 解析和批次匯入
- **資料匯出服務**: `/src/services/dataExport.ts` 已實作匯出功能
- **Firebase 批次操作**: 在 tasks-v2.ts、managerActions.ts 中有 writeBatch 使用範例
- **圖表元件**: `/src/components/charts/` 已有 LineChart、BarChart 元件

### 2. 需要參考的檔案
- **Modal 模式**: `/src/components/personnel/AddUserModal.tsx`
- **批次操作**: `/src/services/firebase/tasks-v2.ts` (第 346-384 行)
- **匯入服務**: `/src/services/dataImport.ts`
- **匯出工具**: `/src/utils/tableExport.ts`
- **圖表基礎**: `/src/components/charts/BaseChart.tsx`

### 3. Firebase 批次操作模式
```typescript
// 來自 tasks-v2.ts
const batch = writeBatch(db);
tasks.forEach(task => {
  const taskRef = doc(db, 'tasks', task.id!);
  batch.update(taskRef, { status: 'completed' });
});
await batch.commit();
```

## 技術架構

### 1. 用戶管理 Modal
- 複用 `/src/components/personnel/AddUserModal.tsx` 的模式
- 新增 EditUserModal 用於編輯
- 使用 React Navigation 的 modal 導航
- 整合 FormField 元件和驗證

### 2. 批量操作 API
- 在 `/src/services/firebase/admin/userManagementService.ts` 新增
- 使用 Firebase writeBatch 進行批次更新
- 實作權限檢查（只有 admin 可操作）

### 3. 資料匯入整合
- 連接 DataImportScreen 與 dataImportService
- 使用 expo-document-picker 選擇檔案
- 顯示進度和錯誤報告

### 4. 報表匯出
- 在 UsageReportsScreen 整合匯出功能
- 使用 Victory Native 的 SVG 匯出
- 支援 CSV 和 JSON 格式

### 5. 圖表元件庫
- 建立 `/src/components/admin/charts/` 目錄
- 抽取通用圖表元件
- 支援主題和自訂樣式

## 實作步驟

### 階段 1: 用戶管理 Modal (用戶新增/編輯)
1. 建立 `/src/screens/admin/modals/CreateUserModal.tsx`
2. 建立 `/src/screens/admin/modals/EditUserModal.tsx`
3. 更新 navigation 和 UserManagementScreen 整合
4. 實作表單驗證和錯誤處理

### 階段 2: 批量操作 API
1. 建立 `/src/services/firebase/admin/userManagementService.ts`
2. 實作 batchUpdateUsers、batchDeleteUsers 方法
3. 添加權限檢查和錯誤處理
4. 更新 adminStore 整合新服務

### 階段 3: 資料匯入整合
1. 更新 DataImportScreen 連接 dataImportService
2. 實作檔案解析和預覽
3. 添加進度追蹤和錯誤處理
4. 實作匯入任務的狀態管理

### 階段 4: 報表匯出功能
1. 建立 `/src/services/admin/reportExportService.ts`
2. 整合 Victory Native SVG 匯出
3. 實作 CSV/JSON 格式轉換
4. 更新 UsageReportsScreen 添加匯出邏輯

### 階段 5: 圖表元件庫
1. 建立 `/src/components/admin/charts/` 目錄結構
2. 抽取 StatCard、TrendChart、DistributionChart 元件
3. 建立統一的圖表主題和配置
4. 更新現有頁面使用新元件

## 驗證標準

### 功能驗證
1. **用戶管理**
   - ✅ 可以新增用戶並設定角色
   - ✅ 可以編輯現有用戶資料
   - ✅ 表單驗證正確顯示錯誤
   - ✅ Firebase Auth 正確建立用戶

2. **批量操作**
   - ✅ 可以批量啟用/停用用戶
   - ✅ 可以批量刪除用戶
   - ✅ 操作後列表正確更新
   - ✅ 錯誤處理和回滾機制

3. **資料匯入**
   - ✅ 支援 CSV 和 Excel 檔案
   - ✅ 顯示匯入預覽
   - ✅ 錯誤報告詳細準確
   - ✅ 匯入進度即時更新

4. **報表匯出**
   - ✅ 圖表可匯出為圖片
   - ✅ 資料可匯出為 CSV/JSON
   - ✅ 匯出檔案格式正確
   - ✅ 大量資料匯出不會當機

5. **圖表元件**
   - ✅ 元件可重用於不同頁面
   - ✅ 支援自訂顏色和樣式
   - ✅ 響應式設計適配不同螢幕
   - ✅ 效能優化無延遲

### 程式碼品質
```bash
# TypeScript 檢查
npm run typecheck

# 程式碼風格
npm run lint
```

## 安全考量
1. **權限控制**: 所有操作需檢查用戶是否為 admin
2. **資料驗證**: 匯入資料需完整驗證
3. **批量限制**: 限制單次批量操作數量（如 100 筆）
4. **錯誤回滾**: 批量操作失敗時自動回滾

## 效能優化
1. **分頁載入**: 用戶列表使用分頁
2. **虛擬滾動**: 大量資料使用虛擬列表
3. **圖表優化**: 限制資料點數量，使用 sampling
4. **快取策略**: 匯出資料使用快取

## 錯誤處理
1. **網路錯誤**: 顯示重試按鈕
2. **權限錯誤**: 導向登入或顯示無權限
3. **資料錯誤**: 詳細錯誤訊息和建議
4. **操作失敗**: 自動回滾並通知用戶

## 測試計劃
1. **單元測試**: 服務層方法測試
2. **整合測試**: Modal 與 Firebase 整合
3. **E2E 測試**: 完整流程測試
4. **效能測試**: 大量資料處理

## 文件更新
1. 更新 Admin 使用手冊
2. 添加 API 文件
3. 更新元件使用範例
4. 添加故障排除指南

## 風險評估
- **高風險**: 批量刪除操作需要二次確認
- **中風險**: 大檔案匯入可能超時
- **低風險**: 圖表樣式可能需要調整

## 實作優先順序
1. 🔴 **高優先**: 用戶管理 Modal、批量操作 API
2. 🟡 **中優先**: 資料匯入整合、報表匯出
3. 🟢 **低優先**: 圖表元件庫重構

## 參考資源
- Firebase Batch Operations: https://firebase.google.com/docs/firestore/manage-data/transactions
- Victory Native Export: https://formidable.com/open-source/victory/docs/native/
- React Navigation Modal: https://reactnavigation.org/docs/modal
- Expo Document Picker: https://docs.expo.dev/versions/latest/sdk/document-picker/

---

**預估完成時間**: 3-4 天
**複雜度**: 高
**影響範圍**: Admin 系統全部功能
**成功率評分**: 8/10 - 有完整的現有程式碼基礎和清晰的實作路徑