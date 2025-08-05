# PRP: 資料庫結構編輯器 (Database Schema Editor)

## 📋 概述
實作一個讓有權限的用戶能夠修改資料庫結構的功能，包括新增/刪除欄位、修改欄位屬性，以及為欄位加上 AI 備註說明。

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

### 1. 資料庫結構管理主畫面
建立 `src/screens/admin/DatabaseSchemaScreen.tsx`

```typescript
interface DatabaseSchemaScreenProps {
  navigation: NavigationProp<any>;
}

// 主要功能：
// - 顯示三個資料庫的當前欄位結構（customers, tasks, records）
// - 提供進入編輯模式的入口
// - 顯示版本歷史和最後修改資訊
```

### 2. 欄位編輯器元件
建立 `src/components/database/schema/FieldEditor.tsx`

```typescript
interface FieldEditorProps {
  field: FieldConfig;
  onChange: (field: FieldConfig) => void;
  onDelete: () => void;
  onAIAnnotation: () => void;
}

// 功能：
// - 編輯欄位基本屬性
// - 管理驗證規則
// - 處理選項（select/multiselect）
// - AI 備註編輯介面
```

### 3. AI 欄位備註 Modal
建立 `src/components/database/schema/AIFieldAnnotationModal.tsx`

```typescript
interface AIFieldAnnotationModalProps {
  visible: boolean;
  field: FieldConfig;
  onSave: (annotation: AIFieldInterpretation) => void;
  onClose: () => void;
}

// 功能：
// - 讓用戶輸入欄位說明
// - 呼叫 AI 服務處理說明
// - 顯示 AI 生成的結構化說明
// - 允許編輯提取規則和範例
```

### 4. 欄位排序拖放功能
擴展現有的 `NotionTable` 元件支援欄位拖放

```typescript
// 使用 react-native-draggable-flatlist
// 或 react-beautiful-dnd (Web)
```

### 5. 版本控制和預覽
建立 `src/components/database/schema/SchemaVersionControl.tsx`

```typescript
interface SchemaVersionControlProps {
  currentVersion: FieldDefinition;
  previousVersions: FieldDefinition[];
  onRevert: (versionId: string) => void;
  onCompare: (v1: string, v2: string) => void;
}
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

### 採用 Notion 風格介面
1. **主介面**
   - 類似 Notion 的 Database 設定頁面
   - 左側顯示欄位列表
   - 右側顯示欄位詳細設定
   
2. **欄位編輯**
   - Inline 編輯欄位名稱
   - 下拉選單切換欄位類型
   - 展開式進階設定區域
   
3. **AI 備註**
   - 獨立的編輯按鈕
   - Modal 彈窗編輯
   - 即時預覽 AI 處理結果

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

### Phase 1: 基礎架構 (2天)
- [ ] 建立 DatabaseSchemaScreen 主畫面
- [ ] 實作權限檢查和路由保護
- [ ] 建立基本的欄位列表顯示
- [ ] 整合現有的 fieldDefinitions 服務

### Phase 2: 欄位編輯功能 (3天)
- [ ] 建立 FieldEditor 元件
- [ ] 實作欄位屬性編輯（名稱、類型、必填等）
- [ ] 實作驗證規則編輯器
- [ ] 實作選項管理（select/multiselect）
- [ ] 整合欄位新增/刪除功能

### Phase 3: AI 備註功能 (2天)
- [ ] 建立 AIFieldAnnotationModal
- [ ] 整合 AI 處理服務
- [ ] 實作備註編輯和預覽
- [ ] 儲存 AI 處理結果

### Phase 4: 進階功能 (2天)
- [ ] 實作欄位拖放排序
- [ ] 建立版本控制介面
- [ ] 實作版本比較功能
- [ ] 新增變更預覽功能

### Phase 5: 測試和優化 (1天)
- [ ] 單元測試
- [ ] 整合測試
- [ ] 效能優化
- [ ] 錯誤處理完善

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

**信心評分**: 9/10

此功能建立在專案現有的強大基礎設施之上，大部分核心功能（動態欄位、AI 處理、權限系統）都已經實作完成。主要工作是建立 UI 介面來整合這些現有功能，風險較低且可預測。