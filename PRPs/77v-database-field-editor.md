# PRP: 資料庫欄位編輯功能 (Database Field Editor)

## 📋 概述
在現有的資料庫頁面中整合欄位編輯功能，採用 Notion 風格的內聯編輯體驗。透過在欄位標題旁加入資訊圖示，讓有權限的用戶能夠直接編輯欄位屬性和加上 AI 備註說明。

## 🎯 核心需求
1. **欄位管理**
   - 新增/刪除資料庫欄位
   - 修改欄位屬性（名稱、類型、驗證規則等）
   - 調整欄位順序
   
2. **AI 欄位備註**
   - 為每個欄位添加使用者描述
   - AI 自動處理並生成結構化說明
   - 提供欄位填寫範例和提取規則
   
3. **權限控制**
   - 只有 Super Admin 和組織管理員可以修改
   - 變更需要版本控制和審計追蹤

## 🏗️ 技術架構

### 現有基礎設施
專案已經具備完整的動態欄位系統：

1. **欄位定義系統** (`src/types/fieldDefinitions.ts`)
   - 支援 13 種欄位類型
   - 內建驗證規則系統
   - 版本控制機制
   
2. **AI 欄位理解** (`src/types/custom-fields.ts`)
   ```typescript
   aiFieldInterpretation?: {
     userDescription: string;           // 使用者輸入的說明
     aiProcessedDescription: string;    // AI 處理後的說明
     extractionRules?: string[];        // AI 提取規則
     examples?: string[];               // 範例值
     synonyms?: string[];               // 同義詞
   }
   ```

3. **權限系統** (`src/services/firebase/permissions.ts`)
   - `canDefineCustomFields()` - 檢查欄位定義權限
   - `canEditCustomFieldDefinition()` - 檢查欄位編輯權限

4. **Firebase 整合** (`src/services/firebase/fieldDefinitions.ts`)
   - 即時同步功能
   - 快取機制 (5分鐘 TTL)
   - 自動版本控制

## 📐 實作計劃

### 1. 增強 NotionTable 欄位標題
修改 `src/components/database/notion/NotionTable.tsx`

```typescript
// 在欄位標題中加入資訊圖示
<span className="notion-header-actions">
  {canEditFields && (
    <button 
      className="notion-field-info-btn"
      onClick={(e) => handleFieldInfo(e, column)}
      title="欄位資訊與設定"
    >
      ℹ️
    </button>
  )}
  <button className="notion-header-action-btn">⋯</button>
</span>
```

### 2. 欄位編輯 Popover 元件
建立 `src/components/database/notion/FieldEditPopover.tsx`

```typescript
interface FieldEditPopoverProps {
  visible: boolean;
  onClose: () => void;
  anchor: React.RefObject<any>;
  fieldConfig: FieldConfig;
  onUpdate: (updates: Partial<FieldConfig>) => Promise<void>;
  canEdit: boolean;
  activeTab: 'customers' | 'tasks' | 'records';
}

// 功能：
// - 顯示和編輯欄位名稱
// - 管理欄位說明（AI 備註）
// - 設定必填/可見性
// - 管理驗證規則
// - 處理選項（select/multiselect）
```

### 3. AI 欄位說明處理
整合到 FieldEditPopover 中：

```typescript
// AI 說明編輯區域
const [aiDescription, setAiDescription] = useState('');
const [isProcessingAI, setIsProcessingAI] = useState(false);

const handleAIProcess = async () => {
  setIsProcessingAI(true);
  try {
    const result = await processFieldDescription(
      aiDescription,
      fieldConfig.type
    );
    // 更新欄位的 AI 備註
    await onUpdate({
      aiFieldInterpretation: {
        userDescription: aiDescription,
        ...result
      }
    });
  } finally {
    setIsProcessingAI(false);
  }
};
```

### 4. 整合到 DatabaseScreen
修改 `src/screens/database/DatabaseScreen.tsx`

```typescript
// 加入欄位更新處理
const handleFieldUpdate = useCallback(async (
  fieldKey: string,
  updates: Partial<FieldConfig>
) => {
  // 權限檢查
  if (!await canEditCustomFieldDefinition(user.uid, currentOrganization.id)) {
    showToast('error', '您沒有權限修改欄位定義');
    return;
  }
  
  // 更新欄位定義
  const updatedFields = dynamicFields[activeTab].map(field =>
    field.key === fieldKey ? { ...field, ...updates } : field
  );
  
  await updateFieldDefinition(
    `${currentOrganization.id}:${activeTab}`,
    updatedFields,
    user.uid,
    `更新欄位 ${fieldKey}`
  );
}, [activeTab, dynamicFields, user, currentOrganization]);
```

### 5. 權限控制整合
在 NotionTable 中檢查權限：

```typescript
// 檢查是否可以編輯欄位
const [canEditFields, setCanEditFields] = useState(false);

useEffect(() => {
  checkFieldEditPermission();
}, [user, currentOrganization]);

const checkFieldEditPermission = async () => {
  if (!user || !currentOrganization) return;
  const hasPermission = await canDefineCustomFields(
    user.uid, 
    currentOrganization.id
  );
  setCanEditFields(hasPermission);
};
```

## 🔄 工作流程

### 編輯欄位流程
```typescript
// 偽代碼展示流程
async function handleFieldUpdate(fieldKey: string, updates: Partial<FieldConfig>) {
  // 1. 權限檢查
  if (!await canEditCustomFieldDefinition(userId, organizationId)) {
    throw new Error('沒有權限修改欄位');
  }
  
  // 2. 獲取當前欄位定義
  const currentDefinition = await getFieldDefinition(collectionName, organizationId);
  
  // 3. 建立新版本
  const newFields = currentDefinition.fields.map(field => 
    field.key === fieldKey ? { ...field, ...updates } : field
  );
  
  // 4. 如果有 AI 備註，處理它
  if (updates.aiFieldInterpretation?.userDescription) {
    const aiProcessed = await processFieldDescription(
      updates.aiFieldInterpretation.userDescription,
      updates.type || field.type
    );
    updates.aiFieldInterpretation = {
      ...updates.aiFieldInterpretation,
      ...aiProcessed
    };
  }
  
  // 5. 更新欄位定義（自動版本控制）
  await updateFieldDefinition(
    currentDefinition.id,
    newFields,
    userId,
    `更新欄位 ${fieldKey}`
  );
}
```

## 🎨 UI/UX 設計

### 整合至現有資料庫頁面（Notion 風格）
1. **欄位標題增強**
   - 在每個欄位標題旁加入小小的資訊圖示 (ℹ️)
   - 保持現有的表格結構不變
   - 權限檢查後才顯示編輯功能
   
2. **Popover 編輯介面**
   - 點擊資訊圖示顯示懸浮視窗
   - 包含欄位名稱、說明、類型等設定
   - 內聯編輯體驗，無需跳轉頁面
   
3. **AI 備註整合**
   - 在 Popover 中直接編輯欄位說明
   - 即時呼叫 AI 處理並顯示結果
   - 保存後立即更新到所有使用者

## 🔒 安全考量

### Firebase Security Rules 更新
```javascript
// firestore.rules
match /field_definitions/{defId} {
  // 讀取權限：所有已登入用戶
  allow read: if request.auth != null;
  
  // 寫入權限：Super Admin 或組織管理員
  allow write: if request.auth != null && (
    isSuperAdmin() ||
    (getUserData().role == 'admin' && 
     getUserData().organizationId == resource.data.organizationId)
  );
  
  // 版本控制：防止直接修改歷史版本
  allow update: if resource.data.version < request.resource.data.version;
}
```

## 📦 依賴項目
- 現有的動態欄位系統
- Firebase Firestore
- AI 處理服務 (已實作於 Cloud Functions)
- React Hook Form + Zod (表單驗證)
- react-native-draggable-flatlist (拖放功能)

## ✅ 實作任務清單

### Phase 1: NotionTable 整合 (1天)
- [ ] 在 NotionTable 欄位標題加入資訊圖示
- [ ] 實作權限檢查邏輯
- [ ] 加入點擊處理和狀態管理
- [ ] 調整 CSS 樣式符合 Notion 風格

### Phase 2: FieldEditPopover 元件 (2天)
- [ ] 建立 FieldEditPopover 元件
- [ ] 實作欄位基本資訊編輯（名稱、說明）
- [ ] 加入必填/可見性切換
- [ ] 整合到 NotionTable

### Phase 3: AI 欄位說明功能 (2天)
- [ ] 在 Popover 中加入 AI 說明編輯區
- [ ] 整合 processFieldDescription 服務
- [ ] 實作即時處理和預覽
- [ ] 顯示 AI 生成的結構化資訊

### Phase 4: DatabaseScreen 整合 (1天)
- [ ] 實作 handleFieldUpdate 功能
- [ ] 整合權限檢查
- [ ] 連接 Firebase 更新邏輯
- [ ] 加入錯誤處理和成功提示

### Phase 5: 進階功能 (2天)
- [ ] 實作驗證規則編輯
- [ ] 加入選項管理（select/multiselect）
- [ ] 實作版本記錄顯示
- [ ] 優化即時同步體驗

### Phase 6: 測試和優化 (1天)
- [ ] 單元測試
- [ ] 權限測試
- [ ] 跨平台測試（Web/Mobile）
- [ ] 效能優化

## 🧪 驗證方法

### 單元測試
```bash
# 測試權限檢查
npm test -- --testPathPattern=schema-editor

# 測試欄位驗證
npm test -- --testPathPattern=field-validation

# 測試 AI 備註處理
npm test -- --testPathPattern=ai-annotation
```

### 整合測試
```bash
# 測試完整的欄位編輯流程
npm run test:integration -- schema-editor

# 測試 Firebase 規則
firebase emulators:start
npm run test:rules
```

### 手動測試檢查清單
- [ ] Super Admin 可以編輯所有組織的欄位
- [ ] 組織管理員只能編輯自己組織的欄位
- [ ] 一般用戶無法存取編輯功能
- [ ] 欄位變更即時同步到所有用戶
- [ ] AI 備註正確處理和顯示
- [ ] 版本控制正常運作

## 🚀 部署考量
1. 確保 Firebase Functions 已部署最新的 AI 處理邏輯
2. 更新 Firestore Security Rules
3. 進行階段性發布（先給 Super Admin，再逐步開放）
4. 監控 AI API 使用量和成本

## 📊 成功指標
- 欄位編輯操作的平均完成時間 < 30秒
- AI 備註處理成功率 > 95%
- 用戶滿意度評分 > 4.5/5
- 系統錯誤率 < 0.1%

## 🔗 相關資源
- [Firebase 文檔 - Security Rules](https://firebase.google.com/docs/firestore/security/rules-structure)
- [React Hook Form 文檔](https://react-hook-form.com/)
- [Notion Database 設計參考](https://www.notion.so/help/intro-to-databases)
- 專案現有程式碼：
  - `src/types/fieldDefinitions.ts` - 欄位定義類型
  - `src/services/firebase/fieldDefinitions.ts` - 欄位服務
  - `src/components/database/notion/NotionTable.tsx` - Notion 風格表格

---

**信心評分**: 9.5/10

更新後的設計更加簡潔自然，直接整合到現有的資料庫頁面中，符合 Notion 的設計理念。充分利用現有的 NotionTable 和 Popover 元件，實作工作量更少，用戶體驗更佳。