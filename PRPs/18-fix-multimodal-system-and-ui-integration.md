# PRP-18: 修復多模態系統與前端 UI 整合

## Goal
修復 PRP-17 實作後遺留的技術問題，並將多模態數據輸入系統完整整合到前端 UI，讓用戶能夠透過直覺的介面使用所有輸入功能。

## Why
- **恢復核心功能**: PRP-17 的簡化導致紀錄和任務創建功能無法使用，嚴重影響業務流程
- **解決技術債務**: 大量 TypeScript 編譯錯誤阻礙開發和部署
- **提升用戶體驗**: 目前用戶無法訪問已開發的多模態輸入功能，需要整合到 UI 中
- **確保系統穩定**: 依賴版本不匹配和缺失的實作影響系統穩定性

## What
### 1. 修復技術問題
- 解決所有 TypeScript 編譯錯誤
- 更新依賴版本到推薦版本
- 實作完整的 useAuth 和 useOrganization hooks
- 修復 Firebase 配置問題

### 2. 恢復模態框功能
- 恢復 CreateRecordModal 的完整功能
- 恢復 CreateTaskModal 的完整功能
- 確保所有表單組件正確整合

### 3. UI 整合多模態輸入
- 擴展 ActionPopover 支援輸入方式選擇
- 為每個模態框添加輸入模式切換
- 創建統一的輸入方式選擇介面
- 實現流暢的用戶體驗流程

### 4. 測試與優化
- 確保所有功能正常運作
- 優化性能和用戶體驗
- 添加適當的錯誤處理

### Success Criteria
- [ ] 所有 TypeScript 編譯錯誤已修復，專案可以正常編譯
- [ ] 依賴版本已更新到推薦版本，無版本警告
- [ ] useAuth 和 useOrganization hooks 完整實作
- [ ] CreateRecordModal 恢復完整功能（音頻、文字輸入）
- [ ] CreateTaskModal 恢復完整功能（語音、表單輸入）
- [ ] ActionPopover 支援兩階段選擇（資料類型 → 輸入方式）
- [ ] 每個模態框內有清晰的輸入模式切換介面
- [ ] CSV 上傳功能可從 UI 訪問
- [ ] Excel 式編輯在資料庫頁面正常運作
- [ ] 所有輸入方式都有完整的錯誤處理和用戶反饋

## All Needed Context

### Documentation & References
```yaml
# 必讀文件 - 理解現有實作和問題
- file: PRPs/17-multimodal-data-input-system.md
  why: 了解 PRP-17 的實作內容和遺留問題
  sections: 待解決的技術問題 (行 671-775)

- file: docs/error-reports/2025-01-21-typescript-compilation-errors.md
  why: 詳細的 TypeScript 錯誤分析和解決方案
  critical: 包含三種解決方案和具體修復步驟

- file: src/components/ActionPopover.tsx
  why: 理解現有的動作選擇介面，需要擴展支援多模態
  
- file: src/screens/modals/CreateRecordModal.tsx
  why: 需要恢復的簡化模態框
  
- file: src/screens/modals/CreateTaskModal.tsx  
  why: 需要恢復的簡化模態框

- file: PRPs/design-specs/04-frontend-pages-design-spec.md
  why: UI 設計規範，確保整合符合設計語言
  sections: 彈出氣球設計 (行 122-148)

# 外部資源
- url: https://docs.expo.dev/versions/latest/config/app/
  section: TypeScript configuration
  why: Expo TypeScript 配置最佳實踐

- url: https://reactnavigation.org/docs/modal
  section: Modal navigation patterns
  why: React Navigation 模態框模式

- url: https://github.com/react-hook-form/react-hook-form/tree/master/examples/react-native
  why: React Native 中使用 React Hook Form 的範例
```

### Current Issues Analysis
```yaml
TypeScript 編譯錯誤:
  - 問題: tsconfig.json 使用不支援的 module 選項
  - 解決: 改為 "module": "ES2022"
  
  - 問題: 樣式陣列使用展開運算符
  - 解決: 使用 StyleSheet.flatten() 或陣列方式
  
  - 問題: 型別不匹配 (relatedRecordId vs recordId)
  - 解決: 統一使用正確的屬性名稱

依賴版本問題:
  - TypeScript: 5.3.3 → 5.8.3
  - jest-expo: 52.0.6 → 53.0.9  
  - eslint-config-expo: 8.0.1 → 9.2.0
  - 解決: npx expo install --fix

缺失的實作:
  - useAuth hook: 只返回 mockUser
  - useOrganization hook: 只返回 mockOrganization
  - Firebase 配置: getReactNativePersistence 需要更新

簡化的模態框:
  - CreateRecordModal: 只有佔位符文字
  - CreateTaskModal: 只有佔位符文字
  - 需要恢復: 整合對應的 Form 組件
```

### UI Integration Architecture
```yaml
現有流程:
  1. 用戶點擊底部「+」按鈕
  2. 顯示 ActionPopover（客戶/紀錄/任務）
  3. 選擇後導航到對應模態框
  
新流程設計:
  1. 用戶點擊底部「+」按鈕
  2. 顯示 ActionPopover（客戶/紀錄/任務）
  3. 選擇後展開輸入方式選項
  4. 選擇輸入方式後導航到對應模態框的特定模式

輸入方式映射:
  客戶:
    - 表格填寫 → CreateCustomerModal (mode: 'form')
    - CSV 匯入 → CreateCustomerModal (mode: 'csv')
    
  紀錄:
    - 語音錄製 → CreateRecordModal (mode: 'audio')
    - 文字輸入 → CreateRecordModal (mode: 'text')
    - 音檔上傳 → CreateRecordModal (mode: 'upload')
    
  任務:
    - 語音輸入 → CreateTaskModal (mode: 'voice')
    - 表格填寫 → CreateTaskModal (mode: 'form')
```

## Implementation Blueprint

### Phase 1: 修復編譯錯誤 (優先級: 🔴 高)

```yaml
Task 1.1: 修復 tsconfig.json
UPDATE tsconfig.json:
  - 將 "module": "esnext" 改為 "module": "ES2022"
  - 確保 "jsx": "react-native" 設定正確
  - 驗證路徑別名配置

Task 1.2: 修復樣式陣列錯誤
UPDATE 受影響的組件:
  - 使用 StyleSheet.flatten() 處理動態樣式
  - 或改用陣列方式: style={[styles.base, conditionalStyle]}
  - 主要修復: ConfirmationInterface.tsx

Task 1.3: 修復型別不匹配
UPDATE 型別定義和使用:
  - 統一使用 recordId 而非 relatedRecordId
  - 確保所有型別定義一致
  - 更新相關的表單組件

Task 1.4: 更新依賴版本
RUN 命令:
  - npx expo install --fix
  - 解決版本衝突
  - 確保所有依賴相容
```

### Phase 2: 實作缺失的 Hooks (優先級: 🔴 高)

```yaml
Task 2.1: 實作完整的 useAuth hook
CREATE/UPDATE src/hooks/useAuth.ts:
  - 整合 Firebase Auth
  - 管理認證狀態
  - 提供登入/登出方法
  - 處理權限檢查

Task 2.2: 實作完整的 useOrganization hook  
CREATE/UPDATE src/hooks/useOrganization.ts:
  - 管理組織上下文
  - 提供組織資料存取
  - 處理組織切換
  - 快取組織資料

Task 2.3: 修復 Firebase 配置
UPDATE src/services/firebase/auth.ts:
  - 更新持久化配置
  - 使用新版 Firebase API
  - 確保認證狀態持久化
```

### Phase 3: 恢復模態框功能 (優先級: 🟡 中)

```yaml
Task 3.1: 恢復 CreateRecordModal
UPDATE src/screens/modals/CreateRecordModal.tsx:
  - 接收 mode 參數（audio/text/upload）
  - 整合 RecordForm 組件
  - 添加輸入模式切換 UI
  - 恢復 Firebase 整合
  
  實作內容:
  ```typescript
  const { mode = 'audio' } = route.params || {};
  
  return (
    <Modal>
      <Header title="建立紀錄" />
      <TabBar>
        <Tab active={mode === 'audio'} onPress={() => setMode('audio')}>
          語音錄製
        </Tab>
        <Tab active={mode === 'text'} onPress={() => setMode('text')}>
          文字輸入
        </Tab>
      </TabBar>
      
      {mode === 'audio' && <AudioInput />}
      {mode === 'text' && <RecordForm />}
    </Modal>
  );
  ```

Task 3.2: 恢復 CreateTaskModal
UPDATE src/screens/modals/CreateTaskModal.tsx:
  - 接收 mode 參數（voice/form）
  - 整合 TaskForm 和 VoiceTaskInput
  - 添加模式切換介面
  - 恢復完整功能

Task 3.3: 優化 CreateCustomerModal
UPDATE src/screens/modals/CreateCustomerModal.tsx:
  - 添加 CSV 匯入模式
  - 整合 CSVUploader 組件
  - 提供模式切換選項
```

### Phase 4: UI 整合多模態輸入 (優先級: 🟡 中)

```yaml
Task 4.1: 擴展 ActionPopover 組件
UPDATE src/components/ActionPopover.tsx:
  - 添加兩階段選擇邏輯
  - 第一階段：選擇資料類型
  - 第二階段：選擇輸入方式
  - 平滑的動畫過渡
  
  新增資料結構:
  ```typescript
  const inputMethods = {
    customer: [
      { id: 'form', title: '表格填寫', icon: 'document-text' },
      { id: 'csv', title: 'CSV 匯入', icon: 'cloud-upload' }
    ],
    record: [
      { id: 'audio', title: '語音錄製', icon: 'mic' },
      { id: 'text', title: '文字輸入', icon: 'create' }
    ],
    task: [
      { id: 'voice', title: '語音輸入', icon: 'mic' },
      { id: 'form', title: '表格填寫', icon: 'list' }
    ]
  };
  ```

Task 4.2: 創建輸入方式選擇介面
UPDATE ActionPopover UI:
  - 使用 Animated API 實現滑動效果
  - 保持 Notion 風格設計
  - 添加返回按鈕
  - 清晰的視覺層次

Task 4.3: 更新導航邏輯
UPDATE 導航處理:
  - 傳遞 mode 參數到模態框
  - 確保參數正確傳遞
  - 處理深度連結
```

### Phase 5: 整合 Excel 式編輯 (優先級: 🟢 低)

```yaml
Task 5.1: 整合到資料庫頁面
UPDATE src/screens/database/DatabaseScreen.tsx:
  - 添加編輯模式切換按鈕
  - 整合 EditableDataTable
  - 處理批次儲存邏輯

Task 5.2: 優化編輯體驗
ENHANCE 編輯功能:
  - 添加鍵盤快捷鍵支援
  - 優化手機端編輯體驗
  - 添加撤銷/重做功能
```

### Phase 6: 測試與優化 (優先級: 🟡 中)

```yaml
Task 6.1: 功能測試
TEST 所有輸入方式:
  - 客戶表格輸入
  - CSV 批量匯入
  - 語音錄製紀錄
  - 文字轉紀錄
  - 語音轉任務
  - 任務表格輸入

Task 6.2: 性能優化
OPTIMIZE:
  - 減少不必要的重新渲染
  - 優化大檔案處理
  - 改善動畫性能

Task 6.3: 錯誤處理增強
ENHANCE:
  - 統一錯誤提示風格
  - 添加重試機制
  - 改善錯誤訊息
```

## Validation Loop

### Level 1: 編譯檢查
```bash
# 清理並重新安裝依賴
rm -rf node_modules
npm install

# 修復依賴版本
npx expo install --fix

# 執行類型檢查
npm run type-check

# 預期：無編譯錯誤
```

### Level 2: 功能驗證
```bash
# 啟動應用
npm start

# 測試清單：
# 1. 點擊「+」按鈕，確認 ActionPopover 顯示
# 2. 選擇客戶，確認顯示輸入方式選項
# 3. 選擇表格填寫，確認 CreateCustomerModal 開啟
# 4. 填寫並提交表單，確認資料儲存
# 5. 重複測試所有輸入方式
```

### Level 3: 整合測試
```typescript
// 測試多模態輸入流程
describe('多模態輸入系統', () => {
  test('ActionPopover 兩階段選擇', async () => {
    // 點擊新增按鈕
    // 選擇資料類型
    // 確認輸入方式選項顯示
    // 選擇輸入方式
    // 確認導航到正確模態框
  });

  test('模態框模式切換', async () => {
    // 開啟模態框
    // 切換輸入模式
    // 確認 UI 正確更新
    // 測試各模式功能
  });
});
```

## Anti-Patterns to Avoid
- ❌ 不要一次修改太多程式碼，採用漸進式修復
- ❌ 不要忽略現有的 UI 設計規範
- ❌ 不要在修復過程中引入新的依賴
- ❌ 不要破壞現有的功能
- ❌ 不要忽略手機端的使用體驗
- ❌ 不要跳過測試直接部署

## Implementation Order
1. **立即執行**（第 1 天）
   - Phase 1: 修復編譯錯誤
   - Phase 2: 實作缺失的 Hooks

2. **優先完成**（第 2-3 天）
   - Phase 3: 恢復模態框功能
   - Phase 6.1: 基本功能測試

3. **逐步增強**（第 4-5 天）
   - Phase 4: UI 整合多模態輸入
   - Phase 5: 整合 Excel 式編輯
   - Phase 6.2-6.3: 優化和錯誤處理

## Risk Mitigation
- **風險**：修復編譯錯誤時破壞現有功能
  **緩解**：每次修改後執行 `npm start` 確認應用可啟動

- **風險**：恢復模態框時引入新錯誤
  **緩解**：逐個恢復，每個完成後測試

- **風險**：UI 整合影響用戶體驗
  **緩解**：保持現有流程可用，新功能為增強而非替代

## Success Metrics
- ✅ 0 個 TypeScript 編譯錯誤
- ✅ 0 個依賴版本警告
- ✅ 100% 輸入功能可從 UI 訪問
- ✅ 所有模態框正常運作
- ✅ 用戶可順利使用所有輸入方式
- ✅ 平均 3 次點擊內完成任何輸入操作

## PRP 信心評分
**評分: 9.0/10**

高信心原因：
- ✅ 詳細的錯誤分析和解決方案
- ✅ 清晰的實作步驟和優先級
- ✅ 考慮了所有技術債務
- ✅ 完整的 UI 整合方案
- ✅ 漸進式實施降低風險

扣分原因：
- ⚠️ 需要協調多個組件的修改
- ⚠️ 恢復功能可能遇到未預期的問題

---

**執行時間預估：** 5-7 個工作天
**建議團隊規模：** 1-2 名開發者
**關鍵成功因素：** 逐步實施、頻繁測試、保持現有功能可用