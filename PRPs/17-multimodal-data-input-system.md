# PRP-17: 多模態用戶輸入系統實作

## Goal
建立一個完整的多模態用戶輸入系統，讓用戶能夠透過多種方式向 DonnaAI 輸入客戶、紀錄、任務數據，包括表格輸入、CSV批量上傳、音頻錄音、文字輸入、Excel式直接編輯等方式。

## Why
- **提升用戶體驗**: 讓用戶選擇最舒適的數據輸入方式，降低使用門檻
- **提高數據完整性**: 多種輸入方式確保各種場景下都能有效收集數據  
- **業務流程整合**: 支持從現有CRM系統批量遷移數據，以及日常工作流程
- **移動優先設計**: 支持手機端快速錄音輸入，桌面端批量編輯操作
- **AI 驅動效率**: 將語音和文字轉化為結構化數據，減少手動工作

## What
建立涵蓋三大數據類型（客戶、紀錄、任務）的多模態輸入系統：

### 客戶數據輸入：
- **主要方式**: 完整的表格輸入介面（含必填和選填欄位）
- **次要方式**: CSV檔案批量上傳與數據比對合併
- **直接編輯**: 資料庫頁面中的Excel式行內編輯

### 紀錄數據輸入：
- **主要方式**: App內錄音功能（會議錄音、補錄口述）
- **次要方式**: 文字直接輸入（AI處理）、音頻檔案上傳
- **智能處理**: AI自動分析錄音內容並提取關鍵資訊

### 任務數據輸入：
- **主要方式**: 語音轉任務（用戶口述任務詳情）
- **次要方式**: 標準表格填寫（包含客戶關聯等資訊）
- **快速建立**: 從紀錄中快速建立相關任務

### 其他輸入方式：
- **批量操作**: 選中多個項目進行批量編輯
- **同步整合**: Google Calendar行程同步（未來階段）

### Success Criteria
- [ ] 實作完整的客戶新增表格，包含所有必填和選填欄位
- [ ] 實現CSV檔案上傳、解析、批量導入功能  
- [ ] 完成紀錄錄音功能，整合現有AudioRecorder組件
- [ ] 實作文字輸入創建紀錄，包含AI處理邏輯
- [ ] 建立語音轉任務功能，包含語音識別和任務創建
- [ ] 實現任務表格創建介面，支持客戶關聯選擇
- [ ] 完成Excel式行內編輯功能
- [ ] 所有輸入方式都包含完整的錯誤處理和使用者回饋
- [ ] 測試數據驗證和權限控制
- [ ] 建立測試用CSV檔案供功能驗證

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/components/audio/AudioRecorder.tsx
  why: 現有音頻錄音組件的模式和功能，需要整合到紀錄輸入
  
- file: src/screens/modals/CreateCustomerModal.tsx  
  why: 現有客戶創建模態框佔位符，需要完整實作
  
- file: src/screens/modals/CreateTaskModal.tsx
  why: 現有任務創建模態框佔位符，需要完整實作
  
- file: src/components/database/BatchEditForm.tsx
  why: 現有批量編輯表單模式，Excel式編輯的參考
  
- file: src/services/firebase/customers.ts  
  why: 現有客戶數據服務，了解數據結構和權限模式
  
- file: src/components/common/TextInput.tsx
  why: 通用輸入組件，表格輸入的基礎
  
- url: https://docs.expo.dev/versions/latest/sdk/document-picker/
  why: Expo文件選擇器API，CSV上傳功能
  
- url: https://docs.expo.dev/versions/latest/sdk/audio/
  why: Expo音頻API，錄音功能實作
  
- doc: https://www.npmjs.com/package/papaparse
  section: CSV解析和處理
  critical: 支持大檔案和錯誤處理的CSV解析庫
  
- doc: https://react-hook-form.com/
  section: Form validation and multi-step forms
  critical: 表格驗證和多步驟表格的最佳實踐
```

### Current Codebase tree
```bash
src/
├── components/
│   ├── audio/
│   │   ├── AudioRecorder.tsx          # 現有錄音組件
│   │   └── AudioEditor.tsx
│   ├── common/
│   │   ├── TextInput.tsx              # 通用輸入組件
│   │   ├── Button.tsx
│   │   ├── ActionModal.tsx            # 通用模態框
│   │   └── LoadingSpinner.tsx
│   └── database/
│       ├── BatchEditForm.tsx          # 批量編輯表格
│       └── FilterForm.tsx
├── screens/modals/
│   ├── CreateCustomerModal.tsx        # 客戶創建佔位符
│   ├── CreateRecordModal.tsx          # 紀錄創建佔位符  
│   └── CreateTaskModal.tsx            # 任務創建佔位符
├── services/firebase/
│   ├── customers.ts                   # 客戶數據服務
│   ├── records.ts                     # 紀錄數據服務
│   └── tasks.ts                       # 任務數據服務
└── types/
    ├── firebase.ts                    # 數據類型定義
    └── custom-fields.ts
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/
├── components/
│   ├── forms/                         # 新增：表格組件目錄
│   │   ├── CustomerForm.tsx           # 完整客戶輸入表格
│   │   ├── RecordForm.tsx             # 紀錄輸入表格
│   │   ├── TaskForm.tsx               # 任務輸入表格
│   │   ├── MultiStepForm.tsx          # 多步驟表格容器
│   │   └── FormField.tsx              # 通用表格欄位組件
│   ├── input/                         # 新增：輸入方式組件
│   │   ├── CSVUploader.tsx            # CSV檔案上傳組件
│   │   ├── AudioInput.tsx             # 音頻輸入組件
│   │   ├── TextToRecord.tsx           # 文字轉紀錄組件
│   │   ├── VoiceToTask.tsx            # 語音轉任務組件
│   │   └── InlineEditor.tsx           # Excel式行內編輯
│   └── common/
│       ├── FileUploader.tsx           # 通用檔案上傳組件
│       └── ProgressIndicator.tsx      # 進度指示器
├── services/
│   ├── csv/                           # 新增：CSV處理服務
│   │   ├── parser.ts                  # CSV解析服務
│   │   ├── validator.ts               # 數據驗證服務
│   │   └── importer.ts                # 批量導入服務
│   ├── ai/                           # 新增：AI處理服務
│   │   ├── speech-to-text.ts          # 語音轉文字
│   │   ├── text-processor.ts          # 文字處理和提取
│   │   └── task-extractor.ts          # 任務資訊提取
│   └── validation/
│       └── form-schemas.ts            # Zod表格驗證模式
├── screens/modals/                    # 更新：完整實作模態框
│   ├── CreateCustomerModal.tsx        # 完整客戶創建介面
│   ├── CreateRecordModal.tsx          # 完整紀錄創建介面
│   └── CreateTaskModal.tsx            # 完整任務創建介面
├── utils/
│   ├── file-utils.ts                  # 檔案處理工具
│   └── data-mapper.ts                 # 數據映射工具
└── examples/                          # 新增：測試檔案目錄
    └── sample-data/
        ├── customers-sample.csv       # 客戶測試CSV
        ├── records-sample.csv         # 紀錄測試CSV
        └── tasks-sample.csv           # 任務測試CSV
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Expo Document Picker 需要正確的配置
// Example: DocumentPicker 返回的 URI 需要用 FileSystem 讀取內容
const result = await DocumentPicker.getDocumentAsync({
  copyToCacheDirectory: true // 重要：確保檔案可被 FileSystem 讀取
});

// CRITICAL: CSV 解析大檔案時的記憶體管理
// Papa Parse 需要 stream 模式處理大檔案
const csvData = Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  transformHeader: header => header.trim(), // 清理欄位名稱
  transform: value => value.trim() // 清理數據值
});

// CRITICAL: Firebase 批量寫入限制
// Firestore 批量操作最多 500 個操作
const batch = writeBatch(db);
// 需要將大量數據分割成多個批次

// CRITICAL: React Hook Form 與 Modal 的整合
// Modal 關閉時需要重置表格狀態
useEffect(() => {
  if (!isVisible) {
    reset(); // 重置表格
  }
}, [isVisible, reset]);

// CRITICAL: 音頻錄音權限和生命週期管理
// 錄音組件需要處理應用切換到背景的情況
```

## Implementation Blueprint

### Data models and structure

創建核心數據模式，確保類型安全和一致性：

```typescript
// src/services/validation/form-schemas.ts
import { z } from 'zod';

// 客戶輸入模式
export const CustomerFormSchema = z.object({
  name: z.string().min(1, "客戶姓名為必填"),
  company: z.string().min(1, "公司名稱為必填"), 
  email: z.string().email().optional(),
  phone: z.string().optional(),
  industry: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([])
});

// CSV上傳數據模式
export const CSVImportSchema = z.object({
  data: z.array(CustomerFormSchema),
  duplicates: z.array(z.object({
    row: z.number(),
    existing: CustomerFormSchema,
    new: CustomerFormSchema
  })),
  errors: z.array(z.object({
    row: z.number(),
    field: z.string(),
    error: z.string()
  }))
});

// 語音輸入模式
export const VoiceInputSchema = z.object({
  audioUri: z.string(),
  duration: z.number(),
  transcription: z.string().optional(),
  extractedData: z.record(z.any()).optional()
});
```

### List of tasks to be completed in the order they should be completed

```yaml
Task 1: 建立核心表格組件基礎架構
CREATE src/components/forms/FormField.tsx:
  - 通用表格欄位組件，支持文字、選擇、開關等類型
  - 整合現有 TextInput 組件的樣式和行為
  - 添加錯誤顯示和驗證狀態

CREATE src/components/forms/MultiStepForm.tsx:
  - 多步驟表格容器組件
  - 進度指示器和導航控制
  - 表格狀態管理和驗證

Task 2: 實作客戶完整輸入表格
CREATE src/components/forms/CustomerForm.tsx:
  - 完整客戶資料輸入表格
  - 使用 React Hook Form + Zod 驗證
  - 支援必填和選填欄位
  - 整合現有客戶數據服務

UPDATE src/screens/modals/CreateCustomerModal.tsx:
  - 移除佔位符內容
  - 整合 CustomerForm 組件
  - 添加成功/錯誤處理

Task 3: 建立CSV上傳和處理系統
CREATE src/services/csv/parser.ts:
  - 使用 Papa Parse 解析CSV檔案
  - 數據驗證和錯誤收集
  - 重複數據檢測

CREATE src/services/csv/importer.ts:
  - Firebase 批量導入服務
  - 分批處理大檔案
  - 進度追踪和錯誤報告

CREATE src/components/input/CSVUploader.tsx:
  - CSV檔案選擇和上傳介面
  - 數據預覽和驗證結果顯示
  - 重複數據處理選項

Task 4: 整合和增強音頻錄音功能
CREATE src/components/input/AudioInput.tsx:
  - 包裝現有 AudioRecorder 組件
  - 添加錄音用途選擇（會議、補錄等）
  - 整合 AI 處理工作流程

CREATE src/services/ai/speech-to-text.ts:
  - 語音轉文字服務（整合 Cloud Functions）
  - 錯誤處理和重試邏輯
  - 進度狀態回報

Task 5: 實作紀錄創建功能
CREATE src/components/forms/RecordForm.tsx:
  - 紀錄資料輸入表格
  - 支援文字和音頻輸入模式切換
  - 客戶關聯選擇

CREATE src/components/input/TextToRecord.tsx:
  - 文字輸入轉紀錄組件
  - AI 處理請求和結果顯示
  - 用戶確認和修改介面

UPDATE src/screens/modals/CreateRecordModal.tsx:
  - 整合錄音和文字輸入選項
  - 多模態輸入切換介面

Task 6: 建立語音轉任務系統
CREATE src/services/ai/task-extractor.ts:
  - 從語音/文字中提取任務資訊
  - 結構化任務數據生成
  - 客戶關聯智能匹配

CREATE src/components/input/VoiceToTask.tsx:
  - 語音錄製和任務提取介面
  - 提取結果預覽和編輯
  - 任務創建確認

Task 7: 完成任務輸入功能
CREATE src/components/forms/TaskForm.tsx:
  - 完整任務輸入表格
  - 客戶選擇和關聯功能
  - 截止日期和優先級設定

UPDATE src/screens/modals/CreateTaskModal.tsx:
  - 整合語音和表格輸入方式
  - 輸入方式切換介面

Task 8: 實現Excel式行內編輯
CREATE src/components/input/InlineEditor.tsx:
  - 資料庫頁面行內編輯功能
  - 支援文字、選擇、日期等類型
  - 即時儲存和錯誤處理

UPDATE src/components/database/DataTable.tsx:
  - 整合行內編輯組件
  - 編輯模式切換和狀態管理

Task 9: 建立測試數據和驗證
CREATE examples/sample-data/:
  - 創建測試用CSV檔案
  - 包含正確和錯誤數據範例
  - 不同數據規模的測試檔案

CREATE src/utils/data-mapper.ts:
  - CSV數據到Firebase文檔的映射
  - 數據類型轉換和清理
  - 自訂欄位處理

Task 10: 整合測試和錯誤處理
UPDATE 所有輸入組件:
  - 統一錯誤處理模式
  - Loading狀態和進度指示
  - 用戶回饋和確認介面

CREATE src/services/validation/form-schemas.ts:
  - 完整的Zod驗證模式
  - 跨組件共享的驗證邏輯
  - 錯誤訊息國際化準備
```

### Integration Points
```yaml
FIREBASE_SERVICES:
  - customers.ts: 添加批量導入方法
  - records.ts: 添加音頻處理和AI整合
  - tasks.ts: 添加語音提取任務創建

CLOUD_FUNCTIONS:
  - 語音轉文字處理函數
  - 文字內容AI分析函數  
  - 批量數據導入處理函數

NAVIGATION:
  - 模態框路由更新
  - 深度連結支援（從不同頁面開啟特定輸入方式）

PERMISSIONS:
  - 文件選擇權限檢查
  - 麥克風使用權限管理
  - 數據寫入權限驗證
```

## Validation Loop

### Level 1: Syntax & Style  
```bash
# 執行代碼檢查和格式化
npm run lint
npm run type-check

# 預期：無錯誤，如有錯誤需修復後繼續
```

### Level 2: Unit Tests
```typescript
// CREATE src/tests/components/forms/CustomerForm.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CustomerForm } from '@/components/forms/CustomerForm';

describe('CustomerForm', () => {
  test('顯示必填欄位驗證錯誤', async () => {
    const { getByTestId, getByText } = render(<CustomerForm />);
    
    fireEvent.press(getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(getByText('客戶姓名為必填')).toBeTruthy();
      expect(getByText('公司名稱為必填')).toBeTruthy();
    });
  });

  test('成功提交完整表格', async () => {
    const mockOnSubmit = jest.fn();
    const { getByTestId } = render(
      <CustomerForm onSubmit={mockOnSubmit} />
    );
    
    fireEvent.changeText(getByTestId('name-input'), '測試客戶');
    fireEvent.changeText(getByTestId('company-input'), '測試公司');
    fireEvent.press(getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: '測試客戶',
        company: '測試公司'
      });
    });
  });
});

// CREATE src/tests/services/csv/parser.test.ts  
import { parseCSVFile } from '@/services/csv/parser';

describe('CSV Parser', () => {
  test('正確解析有效CSV數據', async () => {
    const csvContent = 'name,company,email\n測試客戶,測試公司,test@example.com';
    const result = await parseCSVFile(csvContent);
    
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      name: '測試客戶',
      company: '測試公司', 
      email: 'test@example.com'
    });
    expect(result.errors).toHaveLength(0);
  });

  test('檢測無效數據並報告錯誤', async () => {
    const csvContent = 'name,company,email\n,測試公司,invalid-email';
    const result = await parseCSVFile(csvContent);
    
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].field).toBe('name');
    expect(result.errors[1].field).toBe('email');
  });
});
```

```bash
# 運行測試直到全部通過
npm run test
# 如果失敗：閱讀錯誤，理解根本原因，修復代碼，重新運行
```

### Level 3: Integration Test
```bash
# 啟動 Firebase Emulators
npm run firebase:emulators

# 啟動應用
npm start

# 測試流程：
# 1. 開啟客戶創建模態框 -> 填寫表格 -> 確認數據儲存
# 2. 選擇CSV檔案 -> 預覽數據 -> 批量導入 -> 檢查結果
# 3. 錄製音頻 -> 等待處理 -> 確認紀錄創建
# 4. 語音輸入任務 -> 檢查提取結果 -> 創建任務

# 預期：所有流程順暢完成，數據正確儲存
```

## Final validation Checklist
- [ ] 所有測試通過：`npm run test`
- [ ] 無程式碼品質問題：`npm run lint`  
- [ ] 無類型錯誤：`npm run type-check`
- [ ] 客戶表格輸入功能完整可用
- [ ] CSV上傳和批量導入正常運作
- [ ] 音頻錄音和AI處理工作流程正常
- [ ] 語音轉任務功能正確提取資訊
- [ ] 行內編輯功能在資料庫頁面正常運作
- [ ] 所有錯誤情況都有適當處理和用戶回饋
- [ ] 權限檢查和數據驗證正確執行
- [ ] 測試CSV檔案能正確導入和處理
- [ ] 使用者體驗流暢，介面反應靈敏

---

## Anti-Patterns to Avoid
- ❌ 不要在沒有權限檢查的情況下進行數據操作
- ❌ 不要忽略CSV檔案大小限制和記憶體管理
- ❌ 不要在音頻錄音時忽略應用生命週期管理  
- ❌ 不要使用同步方法處理檔案I/O操作
- ❌ 不要跳過數據驗證，即使是"應該正確"的數據
- ❌ 不要將敏感資料記錄到日誌中
- ❌ 不要假設所有用戶都有檔案存取和麥克風權限

## PRP信心評分
**評分: 8.5/10**

這個PRP具有高度的實作成功信心，因為：
- ✅ 詳細的現有代碼庫分析和模式識別
- ✅ 完整的外部最佳實踐研究和庫選擇
- ✅ 明確的任務分解和依賴關係
- ✅ 可執行的驗證步驟和測試策略
- ✅ 涵蓋所有用戶需求的完整功能規劃
- ✅ 詳細的集成點和錯誤處理考慮

小幅扣分原因：
- ⚠️ AI語音處理部分依賴外部Cloud Functions的穩定性
- ⚠️ CSV大檔案處理的性能優化可能需要迭代調整