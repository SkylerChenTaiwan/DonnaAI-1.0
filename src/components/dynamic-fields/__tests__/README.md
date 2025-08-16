# 動態欄位元件互動測試套件

這個測試套件為動態欄位模組的所有核心元件提供了全面的互動測試，確保所有互動元素都能正確運作。

## 📁 測試檔案結構

```
__tests__/
├── FileUploader.test.tsx              # 檔案上傳元件測試
├── DynamicFieldList.test.tsx          # 動態欄位列表測試
├── FieldConfigurator.test.tsx         # 欄位配置器測試
├── DataPreviewTable.test.tsx          # 資料預覽表格測試
├── ImportProgressPanel.test.tsx       # 匯入進度面板測試
├── CrossPlatformCompatibility.test.tsx # 跨平台相容性測試
├── ErrorHandlingAndEdgeCases.test.tsx # 錯誤處理和邊界條件測試
└── README.md                          # 本文件
```

## 🧪 測試涵蓋範圍

### FileUploader.test.tsx
**互動功能測試：**
- ✅ Web 平台拖放功能（dragOver, dragLeave, drop）
- ✅ Mobile 平台檔案選擇器整合
- ✅ 檔案驗證（大小、格式、名稱）
- ✅ 載入狀態和進度顯示
- ✅ 錯誤處理和使用者回饋
- ✅ 點擊觸發檔案選擇
- ✅ 檔案輸入框重置機制

### DynamicFieldList.test.tsx
**互動功能測試：**
- ✅ 虛擬滾動（FlashList）
- ✅ 即時搜尋和篩選
- ✅ 批次選擇（單選、全選、反選）
- ✅ 欄位操作（啟用/停用、類型變更、刪除）
- ✅ 批次操作（批次啟用、停用、刪除）
- ✅ Web 表格 vs Mobile 卡片視圖
- ✅ 系統欄位保護機制
- ✅ 統計資訊顯示

### FieldConfigurator.test.tsx
**互動功能測試：**
- ✅ 標籤頁切換（基本設定、驗證規則、格式化、安全設定）
- ✅ 表單輸入和驗證
- ✅ 動態欄位類型格式化選項
- ✅ 驗證規則新增/移除
- ✅ 安全設定和 PII 配置
- ✅ 模態框互動（開啟、關閉、儲存、取消）
- ✅ 表單資料持久化
- ✅ 時間戳自動更新

### DataPreviewTable.test.tsx
**互動功能測試：**
- ✅ 視圖模式切換（表格/卡片/自動）
- ✅ 資料搜尋和篩選
- ✅ 欄位排序（升序/降序）
- ✅ 分頁控制（上一頁、下一頁、每頁筆數）
- ✅ 行選擇（單選、全選）
- ✅ 錯誤高亮顯示
- ✅ 資料格式化（日期、貨幣、百分比、JSON等）
- ✅ 載入和空狀態顯示
- ✅ 統計資訊更新

### ImportProgressPanel.test.tsx
**互動功能測試：**
- ✅ 進度條更新和狀態變化
- ✅ 控制按鈕（暫停、恢復、取消、重試、關閉）
- ✅ 錯誤詳情展開/收起
- ✅ 錯誤列表管理（顯示全部、收起）
- ✅ 時間和速度格式化
- ✅ 完成狀態訊息顯示
- ✅ 統計資料計算
- ✅ 可重試錯誤標記

### CrossPlatformCompatibility.test.tsx
**跨平台相容性測試：**
- ✅ Web vs Mobile 平台差異處理
- ✅ Adaptive 元件使用檢查
- ✅ 事件處理一致性
- ✅ 佈局響應式適應
- ✅ 平台特定功能（拖放 vs 檔案選擇器）
- ✅ 記憶體管理和資源清理

### ErrorHandlingAndEdgeCases.test.tsx
**錯誤處理和邊界條件測試：**
- ✅ 檔案上傳錯誤處理
- ✅ 大資料集效能限制
- ✅ 無效輸入驗證
- ✅ 網路錯誤模擬
- ✅ 記憶體洩漏預防
- ✅ 瀏覽器相容性
- ✅ 循環引用和資料損壞處理

## 🚀 執行測試

### 前置需求
```bash
npm install vitest @testing-library/react-native @testing-library/jest-dom
```

### 執行所有動態欄位測試
```bash
# 執行所有測試
npm run test src/components/dynamic-fields

# 執行特定元件測試
npm run test src/components/dynamic-fields/__tests__/FileUploader.test.tsx

# 執行測試並產生覆蓋率報告
npm run test:coverage src/components/dynamic-fields
```

### 監視模式（開發時使用）
```bash
npm run test:watch src/components/dynamic-fields
```

## 📊 測試覆蓋率目標

- **函數覆蓋率：** >= 95%
- **行覆蓋率：** >= 90%
- **分支覆蓋率：** >= 85%
- **互動元素覆蓋率：** 100%

## 🎯 關鍵測試場景

### 1. 檔案上傳流程
```typescript
// Web 拖放
drag file -> validate -> upload -> progress -> complete/error

// Mobile 選擇
tap select -> picker -> validate -> upload -> progress -> complete/error
```

### 2. 欄位管理流程
```typescript
search -> filter -> select -> batch operation -> confirm -> update
```

### 3. 資料預覽流程
```typescript
load data -> search/filter -> sort -> paginate -> select rows -> export
```

### 4. 欄位配置流程
```typescript
open modal -> fill basic info -> add validation -> set formatting -> configure security -> save
```

### 5. 匯入進度監控
```typescript
start import -> monitor progress -> handle errors -> pause/resume -> complete
```

## 🛡️ 錯誤處理測試重點

### 檔案上傳錯誤
- 檔案過大
- 不支援的格式
- 網路中斷
- 權限被拒絕

### 資料處理錯誤
- 損壞的資料結構
- 循環引用
- 記憶體超限
- 無效的搜尋條件

### UI 互動錯誤
- 快速重複點擊
- 同時觸發多個操作
- 表單驗證失敗
- 模態框狀態異常

## 🔧 Mock 配置

### 外部依賴 Mock
```typescript
// expo-document-picker
vi.mock('expo-document-picker', () => ({
  pickDocument: vi.fn()
}));

// @shopify/flash-list
vi.mock('@shopify/flash-list', () => ({
  FlashList: MockFlashList
}));

// react-native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Alert: { alert: vi.fn() }
}));
```

### 測試工具函數
```typescript
// 建立測試資料
const createMockField = (overrides) => ({ ...defaultField, ...overrides });

// 觸發檔案拖放
const simulateFileDrop = (element, files) => {
  fireEvent(element, 'drop', {
    dataTransfer: { files }
  });
};

// 等待異步操作
const waitForOperation = async (operation) => {
  await act(async () => {
    await operation();
  });
};
```

## 📋 測試檢查清單

### 開發前檢查
- [ ] 元件是否使用 Adaptive 元件？
- [ ] 是否有跨平台考量？
- [ ] 事件處理器是否正確連接？
- [ ] 是否有適當的錯誤處理？

### 測試前檢查
- [ ] Mock 是否正確設定？
- [ ] 測試資料是否完整？
- [ ] 邊界條件是否涵蓋？
- [ ] 錯誤場景是否測試？

### 測試後檢查
- [ ] 所有測試是否通過？
- [ ] 覆蓋率是否達標？
- [ ] 效能是否在可接受範圍？
- [ ] 文件是否更新？

## 🚨 已知問題和解決方案

### 1. FlashList 虛擬滾動測試
**問題：** FlashList 在測試環境中難以模擬
**解決方案：** 使用簡化的 Mock 實現，專注於資料渲染邏輯

### 2. 檔案 API 跨平台差異
**問題：** Web FileAPI vs Expo DocumentPicker
**解決方案：** 分別測試兩個平台的實現，確保功能一致性

### 3. 大資料集效能測試
**問題：** 測試環境記憶體限制
**解決方案：** 使用模擬的大資料集，觸發效能保護機制

## 📈 持續改進

### 定期檢查項目
1. **每週：** 執行完整測試套件
2. **每月：** 檢查測試覆蓋率
3. **每季：** 更新測試場景
4. **每年：** 重構測試架構

### 測試最佳實踐
- 測試應該快速且穩定
- 使用描述性的測試名稱
- 測試行為而非實現細節
- 保持測試的獨立性
- 定期清理過時的測試

## 📚 參考資源

- [Testing Library Documentation](https://testing-library.com/)
- [Vitest Documentation](https://vitest.dev/)
- [React Native Testing Guide](https://reactnative.dev/docs/testing-overview)
- [Adaptive Components Guide](../adaptive/README.md)

---

**最後更新：** 2024年1月
**維護者：** Claude Code Assistant
**版本：** 1.0.0