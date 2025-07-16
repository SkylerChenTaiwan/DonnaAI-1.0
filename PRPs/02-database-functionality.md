name: 資料庫功能實作
description: |
  實作 DonnaAI 的核心資料庫功能，包含使用者資料庫、客戶資料庫、紀錄資料庫和任務資料庫。
  支援企業級權限管理、自訂欄位功能、跨資料庫關聯，以及 AI 處理和 Google Calendar 整合。

## Core Principles

1. **Context is King**: 本 PRP 包含完整的實作背景，包括現有程式碼結構、Firebase 最佳實踐和自訂欄位實作模式。
2. **Validation Loops**: 每個實作步驟都有對應的驗證，確保功能正確且符合規範。
3. **Information Dense**: 提供詳細的實作藍圖、程式碼範例和整合點說明。
4. **Progressive Success**: 按照依賴順序實作，每個步驟都建立在前一個成功的基礎上。
5. **Global rules**: 遵循 CLAUDE.md 的所有規則，特別是繁體中文註解和 Git 提交。

## Goal

建立四個核心資料庫系統，支援企業級 CRM 功能：
1. 擴充使用者資料庫以支援完整 CRM 功能
2. 建立支援自訂欄位的客戶資料庫
3. 建立支援 AI 處理的紀錄資料庫
4. 建立支援多來源和狀態管理的任務資料庫

## Why

- **Business Value**: 提供完整的 CRM 功能，支援企業管理客戶關係、追蹤會議紀錄和任務管理
- **Integration**: 整合 AI 處理（音訊轉文字）和 Google Calendar 同步
- **Problems Solved**: 
  - 統一的客戶資料管理
  - 靈活的自訂欄位支援不同企業需求
  - 自動化的會議紀錄處理
  - 多來源的任務整合管理

## What

### User-Visible Behavior
- 使用者可以管理客戶資料，包含自訂欄位
- 企業管理者可以定義客戶和紀錄的自訂欄位
- 使用者可以上傳錄音或文字，AI 自動處理成結構化紀錄
- 任務可以從會議紀錄、手動建立或 Google Calendar 同步
- 跨資料庫的關聯查詢（例如：查看客戶的所有相關紀錄和任務）

### Technical Requirements
- Firebase Firestore 作為資料庫
- 支援即時資料同步 (onSnapshot)
- 基於角色的存取控制 (RBAC)
- 自訂欄位的動態 schema
- Cloud Functions 處理音訊轉文字
- Google Calendar API 整合

## Success Criteria

- [ ] 使用者資料庫支援完整 CRM 欄位（部門、職稱、上級主管等）
- [ ] 客戶資料庫支援自訂欄位定義和資料驗證
- [ ] 紀錄資料庫支援音訊上傳和 AI 處理
- [ ] 任務資料庫支援三種狀態管理（有時間、無時間、待定）
- [ ] 實作跨資料庫關聯查詢
- [ ] 權限系統控制自訂欄位定義權限
- [ ] AI 欄位解釋系統能正確處理使用者描述
- [ ] AI 能從紀錄中自動提取並填入客戶欄位
- [ ] 自訂欄位支援 AI 解釋和自動填入
- [ ] 單元測試覆蓋率 > 80%
- [ ] 通過所有 TypeScript 類型檢查

## Context

### Documentation & References
```yaml
firebase_docs:
  - url: https://firebase.google.com/docs/firestore/data-model
    sections: ["Document-oriented database", "Collections and documents", "Subcollections"]
  - url: https://firebase.google.com/docs/firestore/solutions/role-based-access
    sections: ["Role-based access control", "Security rules"]
  - url: https://firebase.google.com/docs/firestore/security/rules-fields
    sections: ["Field-level permissions", "Schema validation"]
  - url: https://extensions.dev/extensions/googlecloud/speech-to-text
    sections: ["Audio transcription setup"]

existing_code:
  - file: src/types/firebase.ts
    purpose: 現有的 Firestore 文件類型定義
  - file: src/types/user.ts
    purpose: 現有的使用者、組織、團隊類型
  - file: src/services/firebase/permissions.ts
    purpose: 現有的權限管理模式
  - file: src/services/firebase/auth.ts
    purpose: 認證和使用者建立流程

patterns:
  - file: src/services/firebase/config.ts
    pattern: Firebase 服務初始化模式
  - file: src/stores/authStore.ts
    pattern: Zustand 狀態管理模式
```

### Current Codebase
```
src/
├── types/
│   ├── firebase.ts      # FirestoreDoc, CustomerDoc, MeetingDoc
│   └── user.ts          # User, Organization, Team
├── services/
│   └── firebase/
│       ├── config.ts    # Firebase 初始化
│       ├── auth.ts      # 認證服務
│       └── permissions.ts # 權限檢查
└── stores/
    └── authStore.ts     # Zustand 狀態管理
```

### Desired Codebase
```
src/
├── types/
│   ├── firebase.ts      # 擴充現有類型
│   ├── user.ts          # 擴充 User 類型
│   ├── custom-fields.ts # 新增：自訂欄位類型
│   ├── record.ts        # 新增：紀錄類型（取代 MeetingDoc）
│   ├── task.ts          # 新增：任務類型
│   └── field-interpretations.ts # 新增：欄位解釋系統
├── services/
│   └── firebase/
│       ├── config.ts    
│       ├── auth.ts      
│       ├── permissions.ts # 擴充：自訂欄位權限
│       ├── customers.ts   # 新增：客戶 CRUD
│       ├── records.ts     # 新增：紀錄 CRUD
│       ├── tasks.ts       # 新增：任務 CRUD
│       ├── custom-fields.ts # 新增：自訂欄位管理
│       └── ai-field-processor.ts # 新增：AI 欄位處理服務
├── stores/
│   ├── authStore.ts
│   ├── customerStore.ts  # 新增：客戶狀態管理
│   ├── recordStore.ts    # 新增：紀錄狀態管理
│   └── taskStore.ts      # 新增：任務狀態管理
└── tests/
    └── services/
        └── firebase/     # 新增：所有服務的單元測試
```

### Known Gotchas & Library Quirks
- Firestore 無法進行欄位級別的讀取權限控制，只能控制文件級別
- Firestore 文件大小限制為 1MB，自訂欄位數量需要考慮
- onSnapshot 監聽器需要正確清理以避免記憶體洩漏
- Firebase Security Rules 有 64KB 大小限制
- Google Calendar API 需要 OAuth 2.0 認證流程

## Implementation Blueprint

### Data Models

```typescript
// 擴充使用者類型 (src/types/user.ts)
interface User {
  // 現有欄位...
  department?: string;          // 部門
  jobTitle?: string;           // 職稱
  supervisorId?: string;       // 上級主管
  phoneNumber?: string;        // 電話
  avatar?: string;             // 頭像 URL
}

// 自訂欄位類型 (src/types/custom-fields.ts)
interface CustomFieldDefinition {
  id: string;
  fieldKey: string;            // 欄位鍵值
  fieldName: string;           // 顯示名稱
  fieldType: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  options?: string[];          // select/multiselect 選項
  defaultValue?: any;
  organizationId: string;
  entityType: 'customer' | 'record';  // 適用的實體類型
  createdBy: string;
  createdAt: Timestamp;
  permissions: {
    canEdit: string[];         // 可編輯的角色或使用者 ID
  };
  // AI 欄位理解系統
  aiFieldInterpretation?: {
    userDescription: string;       // 使用者輸入的欄位說明
    aiProcessedDescription: string; // AI 處理後的結構化說明
    extractionRules?: string[];    // AI 提取規則
    examples?: string[];           // 範例值
    synonyms?: string[];           // 同義詞（AI 辨識用）
  };
}

// AI 欄位對應結果
interface AIFieldMapping {
  fieldKey: string;
  confidence: number;          // 0-1 的信心分數
  extractedValue: any;
  reason?: string;            // AI 判斷原因
}

// 紀錄類型 (src/types/record.ts)
interface RecordDoc extends FirestoreDoc {
  type: 'meeting' | 'call' | 'note' | 'other';
  title: string;
  customerIds: string[];       // 關聯客戶
  participantIds: string[];    // 參與人員
  scheduledAt?: Timestamp;
  duration?: number;
  location?: string;
  content?: string;            // 文字內容
  audioFileUrl?: string;       // 錄音檔案
  transcription?: string;      // AI 轉錄文字
  aiSummary?: string;          // AI 摘要
  aiActionItems?: string[];    // AI 提取的行動項目
  status: 'draft' | 'processing' | 'completed';
  customFields?: Record<string, any>;  // 自訂欄位值
  // AI 欄位自動填入結果
  aiFieldMappings?: AIFieldMapping[];  // AI 建議的欄位對應
  aiProcessingMetadata?: {
    processedAt: Timestamp;
    modelUsed: string;
    totalConfidence: number;
  };
  teamId: string;
  organizationId: string;
}

// 任務類型 (src/types/task.ts)
interface TaskDoc extends FirestoreDoc {
  title: string;
  description?: string;
  type: 'scheduled' | 'unscheduled' | 'pending';
  scheduledAt?: Timestamp;     // 有指定時間的任務
  dueDate?: Timestamp;         // 截止日期
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  assigneeId: string;          // 負責人
  assignerId?: string;         // 指派人
  customerIds?: string[];      // 關聯客戶
  recordId?: string;           // 來源紀錄
  googleCalendarEventId?: string; // Google Calendar 事件 ID
  source: 'manual' | 'ai_extracted' | 'calendar_sync';
  tags?: string[];
  teamId: string;
  organizationId: string;
  completedAt?: Timestamp;
  completedBy?: string;
}

// 擴充客戶類型 (src/types/firebase.ts)
interface CustomerDoc extends FirestoreDoc {
  // 現有欄位...
  customFields?: Record<string, any>;  // 自訂欄位值
  organizationId: string;              // 所屬組織
  relatedUserIds?: string[];           // 關聯使用者
  tags?: string[];                     // 標籤
  lastContactDate?: Timestamp;         // 最後聯絡日期
  nextFollowUpDate?: Timestamp;        // 下次跟進日期
  // AI 自動更新追蹤
  aiAutoUpdates?: {
    lastUpdated: Timestamp;
    updatedFields: string[];           // 哪些欄位被 AI 更新過
    updateSource: string;              // 來源紀錄 ID
  };
}

// 系統預設欄位解釋 (src/types/field-interpretations.ts)
interface SystemFieldInterpretation {
  entityType: 'customer' | 'record' | 'task';
  fieldKey: string;
  fieldName: string;
  aiDescription: string;               // 給 AI 的欄位說明
  extractionHints: string[];           // 提取提示
  dataType: string;
  examples: string[];
}
```

### Task List

```yaml
tasks:
  - id: setup-types
    name: 建立和擴充類型定義
    dependencies: []
    description: |
      建立新的類型檔案（custom-fields.ts, record.ts, task.ts, field-interpretations.ts）
      擴充現有的 User 和 CustomerDoc 類型
      加入 AI 欄位解釋相關類型
      
  - id: implement-field-interpretations
    name: 實作欄位解釋系統
    dependencies: [setup-types]
    description: |
      建立系統預設欄位解釋對照表
      實作 AI 處理使用者欄位描述的功能
      
  - id: implement-custom-fields-service
    name: 實作自訂欄位服務
    dependencies: [implement-field-interpretations]
    description: |
      建立 src/services/firebase/custom-fields.ts
      實作自訂欄位的 CRUD 操作和權限檢查
      加入 AI 欄位解釋處理
      
  - id: implement-permissions-extension
    name: 擴充權限系統
    dependencies: [implement-custom-fields-service]
    description: |
      更新 permissions.ts 加入自訂欄位定義權限
      實作 canDefineCustomFields 函數
      
  - id: implement-customers-service
    name: 實作客戶服務
    dependencies: [implement-custom-fields-service]
    description: |
      建立 src/services/firebase/customers.ts
      實作客戶 CRUD 和自訂欄位處理
      
  - id: implement-ai-field-processor
    name: 實作 AI 欄位處理服務
    dependencies: [implement-custom-fields-service]
    description: |
      建立 src/services/firebase/ai-field-processor.ts
      實作 AI 理解欄位描述和自動填入邏輯
      
  - id: implement-records-service
    name: 實作紀錄服務
    dependencies: [implement-ai-field-processor]
    description: |
      建立 src/services/firebase/records.ts
      實作紀錄 CRUD、音訊上傳和 AI 處理觸發
      整合 AI 欄位自動填入功能
      
  - id: implement-tasks-service
    name: 實作任務服務
    dependencies: [setup-types]
    description: |
      建立 src/services/firebase/tasks.ts
      實作任務 CRUD 和狀態管理
      
  - id: implement-stores
    name: 實作 Zustand Stores
    dependencies: [implement-customers-service, implement-records-service, implement-tasks-service]
    description: |
      建立 customerStore.ts, recordStore.ts, taskStore.ts
      實作即時資料同步和狀態管理
      
  - id: implement-cross-db-queries
    name: 實作跨資料庫查詢
    dependencies: [implement-stores]
    description: |
      在各個服務中實作關聯查詢函數
      例如：getCustomerRelatedRecords, getCustomerRelatedTasks
      
  - id: setup-cloud-functions
    name: 設置 Cloud Functions
    dependencies: [implement-records-service]
    description: |
      建立 functions/src/audio-processing.ts
      實作音訊轉文字和 AI 分析功能
      建立 functions/src/field-extraction.ts
      實作 AI 欄位提取和自動填入
      
  - id: implement-calendar-sync
    name: 實作 Google Calendar 同步
    dependencies: [implement-tasks-service]
    description: |
      建立 src/services/calendar-sync.ts
      實作 OAuth 2.0 認證和事件同步
      
  - id: write-tests
    name: 撰寫單元測試
    dependencies: [implement-stores]
    description: |
      為所有新服務撰寫單元測試
      確保測試覆蓋率 > 80%
      
  - id: update-security-rules
    name: 更新 Firebase Security Rules
    dependencies: [implement-cross-db-queries]
    description: |
      更新 firestore.rules 加入新的集合權限
      實作自訂欄位的 schema 驗證
```

### Per Task Pseudocode

#### Task: setup-types
```
1. 建立 src/types/custom-fields.ts
   - 定義 CustomFieldDefinition interface
   - 定義 CustomFieldValue type
   - 匯出相關類型

2. 建立 src/types/record.ts
   - 定義 RecordDoc interface 繼承 FirestoreDoc
   - 包含所有必要欄位和自訂欄位支援

3. 建立 src/types/task.ts
   - 定義 TaskDoc interface 繼承 FirestoreDoc
   - 定義任務狀態和類型枚舉

4. 更新 src/types/user.ts
   - 加入 CRM 相關欄位

5. 更新 src/types/firebase.ts
   - 擴充 CustomerDoc 加入自訂欄位支援
```

#### Task: implement-custom-fields-service
```
1. 建立 src/services/firebase/custom-fields.ts

2. 實作函數：
   - createCustomFieldDefinition(field: CustomFieldDefinition)
     - 檢查權限
     - 驗證欄位鍵值唯一性
     - 寫入 Firestore
   
   - updateCustomFieldDefinition(fieldId: string, updates: Partial<CustomFieldDefinition>)
     - 檢查權限
     - 更新定義
   
   - deleteCustomFieldDefinition(fieldId: string)
     - 檢查權限
     - 檢查是否有資料使用此欄位
     - 刪除定義
   
   - getCustomFieldDefinitions(entityType: 'customer' | 'record')
     - 查詢組織的自訂欄位定義
   
   - validateCustomFieldValue(fieldDef: CustomFieldDefinition, value: any)
     - 根據欄位類型驗證值
```

#### Task: implement-customers-service
```
1. 建立 src/services/firebase/customers.ts

2. 實作 CRUD 函數：
   - createCustomer(customer: Omit<CustomerDoc, 'id' | 'createdAt' | 'updatedAt'>)
     - 驗證必填欄位
     - 驗證自訂欄位
     - 建立文件
   
   - updateCustomer(customerId: string, updates: Partial<CustomerDoc>)
     - 檢查權限
     - 驗證自訂欄位更新
     - 更新文件
   
   - getCustomerWithRelations(customerId: string)
     - 獲取客戶資料
     - 並行查詢相關使用者、紀錄、任務
     - 組合返回結果

3. 實作即時監聽：
   - subscribeToCustomers(teamId: string, callback: (customers: CustomerDoc[]) => void)
     - 設置 onSnapshot 監聽器
     - 返回取消訂閱函數
```

#### Task: implement-ai-field-processor
```
1. 建立 src/services/firebase/ai-field-processor.ts

2. 實作 AI 欄位處理函數：
   - extractFieldsFromRecord(record: RecordDoc, fieldDefinitions: CustomFieldDefinition[])
     - 分析紀錄內容（轉錄文字、AI 摘要等）
     - 根據欄位定義提取值
     - 返回 AIFieldMapping 陣列
   
   - autoFillCustomerFields(customerId: string, fieldMappings: AIFieldMapping[])
     - 檢查欄位對應的信心分數
     - 更新客戶的自訂欄位
     - 記錄 AI 更新資訊
   
   - generateFieldSuggestions(content: string, fieldDef: CustomFieldDefinition)
     - 根據內容和欄位定義生成建議值
     - 返回多個可能的值和信心分數
```

### Integration Points
- Firebase Auth: 所有操作需要認證使用者
- Firebase Storage: 錄音檔案上傳
- Cloud Functions: 音訊處理觸發器
- Google Calendar API: 任務同步
- Zustand Stores: 狀態管理和 UI 更新

## Validation Loop

### Level 1: Syntax & Style ✓
```bash
# TypeScript 編譯檢查
npm run typecheck

# ESLint 檢查
npm run lint

# 格式化檢查
npm run format:check
```

### Level 2: Unit Tests ✓
```bash
# 執行所有單元測試
npm run test

# 測試覆蓋率報告
npm run test:coverage

# 確認覆蓋率 > 80%
```

### Level 3: Integration Test ✓
```bash
# 啟動 Firebase 模擬器
npm run emulators:start

# 執行整合測試
npm run test:integration

# 測試項目：
# - 自訂欄位定義和使用
# - 跨資料庫關聯查詢
# - 權限控制
# - 即時資料同步
```

## Final Validation Checklist
- [ ] 所有類型定義完整且正確 ✓
- [ ] 自訂欄位功能運作正常 ✓
- [ ] 跨資料庫關聯查詢正確 ✓
- [ ] 權限控制符合預期 ✓
- [ ] 單元測試覆蓋率 > 80% ✓
- [ ] 通過所有整合測試 ✓
- [ ] 程式碼符合專案規範 ✓
- [ ] 已提交 Git 並寫明變更原因 ✓

## Anti-Patterns to Avoid
- ❌ 不要在客戶端直接操作自訂欄位定義（應該通過服務層）
- ❌ 不要忽略 Firestore 的 1MB 文件大小限制
- ❌ 不要在迴圈中進行資料庫查詢（使用批次操作）
- ❌ 不要忘記清理 onSnapshot 監聽器
- ❌ 不要將敏感資料（如密碼）存在自訂欄位中
- ❌ 不要忽略並發更新的問題（使用 transaction）

---

**信心評分: 9/10**

本 PRP 提供了完整的實作指南，包含詳細的類型定義、實作步驟和驗證方法。唯一的不確定性在於 Google Calendar 整合的 OAuth 流程可能需要額外的設置步驟。