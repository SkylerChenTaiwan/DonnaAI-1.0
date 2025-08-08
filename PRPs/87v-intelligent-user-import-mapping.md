# PRP-87: 智能用戶批量匯入系統 - 整合欄位對應功能

## Goal
整合現有的智能欄位對應系統到用戶批量匯入功能中，讓組織管理員能夠：
1. 上傳並合併多個 CSV/Excel 檔案
2. 自由選擇哪個欄位對應到用戶帳號（email）和姓名（name）
3. 使用 AI 輔助自動建議最佳欄位對應
4. 在匯入前預覽、驗證和編輯資料

## Why
- **業務需求**：組織管理員經常從不同系統匯出用戶資料，欄位名稱各異（如「電子郵件」、「信箱」、「E-mail」等）
- **使用者體驗**：現有系統硬編碼欄位名稱，無法處理真實世界的多樣化資料格式
- **一致性**：與客戶資料匯入功能保持相同的智能化體驗
- **效率提升**：減少手動資料整理時間，提高批量匯入成功率

## What
建立一個全新的智能用戶匯入精靈（UserImportWizard），提供三階段匯入流程：

### 階段 1：檔案上傳與合併
- 支援多個 CSV/Excel 檔案上傳
- 自動檢測檔案編碼（UTF-8、Big5 等）
- 智能識別關鍵欄位（使用現有的 detectKeyFields）
- 提供檔案合併選項（left join、inner join、outer join）

### 階段 2：智能欄位對應
- AI 輔助欄位映射建議（整合 IntelligentFieldMapper）
- 視覺化拖放介面對應欄位
- 必填欄位標示（email、name）
- 選填欄位自動映射（department、position、phone 等）
- 資料類型自動推斷和驗證

### 階段 3：資料預覽與匯入
- 即時資料驗證和錯誤提示
- 內聯編輯功能修正個別資料
- 重複帳號檢測和處理選項
- 批量設定預設值（角色、部門等）
- 實時進度追蹤和詳細報告

### Success Criteria
- [ ] 支援多檔案上傳和智能合併
- [ ] AI 欄位映射準確率 > 85%
- [ ] 中英文欄位名稱都能正確識別
- [ ] 提供完整的資料驗證和錯誤處理
- [ ] Web 和 Native 平台都能正常運作
- [ ] 匯入 1000 筆用戶資料 < 30 秒
- [ ] 保留簡易模式供快速匯入使用

## All Needed Context

### Documentation & References
```yaml
# 核心參考檔案 - 必讀
- file: src/components/import/ImportWizard.tsx
  why: 三階段匯入精靈的完整實現，需要參考其架構和流程設計

- file: src/components/import/stages/FileUploadMerger.tsx
  why: 多檔案上傳與合併的完整實現，直接重用其邏輯

- file: src/components/import/stages/FieldMapper.tsx
  why: 欄位對應 UI 和拖放功能，需要重用其視覺化設計

- file: src/components/import/IntelligentFieldMapper.tsx
  why: AI 輔助欄位映射的核心邏輯，包含 OpenAI 整合

- file: src/services/import/intelligentMapper.ts
  why: 智能映射引擎，包含欄位識別和類型推斷

- file: src/components/users/EnhancedBulkImportModal.tsx
  why: 現有增強版用戶匯入，需要保留其驗證和配置邏輯

- file: src/services/users/UserDataValidator.ts
  why: 用戶資料驗證邏輯，需要整合到新系統中

- file: src/services/firebase/admin/userAssistService.ts
  why: 後端用戶匯入服務，了解 API 介面

- doc: https://firebase.google.com/docs/auth/admin/manage-users
  section: "Create multiple users"
  critical: Firebase Admin SDK 批量建立用戶的限制和最佳實踐

- doc: https://papaparse.com/docs
  why: CSV 解析庫文檔，處理各種編碼和格式

- file: src/theme/designSystem.ts
  why: UI 設計系統，確保視覺一致性
```

### Current Codebase Tree（相關部分）
```bash
src/
├── components/
│   ├── import/                     # 客戶資料匯入（有智能映射）
│   │   ├── ImportWizard.tsx       
│   │   ├── IntelligentFieldMapper.tsx
│   │   └── stages/
│   │       ├── FileUploadMerger.tsx    # 可重用
│   │       └── FieldMapper.tsx         # 可重用
│   ├── organization/               # 組織相關
│   │   └── BulkImportUsersModal.tsx    # 將被替換
│   └── users/                      # 用戶相關
│       └── EnhancedBulkImportModal.tsx # 將被替換
├── services/
│   ├── import/
│   │   └── intelligentMapper.ts        # 可重用
│   ├── users/
│   │   ├── UserDataValidator.ts        # 保留驗證邏輯
│   │   └── UserImportService.ts        # 部分重用
│   └── firebase/admin/
│       └── userAssistService.ts        # 後端服務
└── utils/
    └── fileMerger.ts                    # 可重用
```

### Desired Codebase Tree with New/Modified Files
```bash
src/
├── components/
│   ├── users/
│   │   ├── UserImportWizard.tsx           # 新：主要精靈元件
│   │   ├── stages/
│   │   │   ├── UserFileUploader.tsx       # 新：檔案上傳（基於 FileUploadMerger）
│   │   │   ├── UserFieldMapper.tsx        # 新：欄位對應（基於 FieldMapper）
│   │   │   └── UserDataPreview.tsx        # 新：資料預覽和編輯
│   │   ├── UserImportProgress.tsx         # 新：進度追蹤元件
│   │   └── UserImportModeToggle.tsx       # 新：簡易/進階模式切換
│   └── organization/
│       └── BulkImportUsersModal.tsx       # 修改：調用新的 UserImportWizard
├── services/
│   └── users/
│       ├── UserFieldMappingEngine.ts      # 新：用戶特定的欄位映射邏輯
│       └── UserImportOrchestrator.ts      # 新：協調整個匯入流程
└── types/
    └── userImport.ts                      # 修改：新增映射相關類型
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: Firebase Auth 批量建立限制
// - 每次最多 1000 個用戶
// - 需要使用 Admin SDK（不能在前端直接調用）
// - 必須通過 Cloud Functions 執行

// CRITICAL: 檔案編碼處理
// - 台灣常用 Big5 編碼，需要特殊處理
// - Excel 檔案可能包含隱藏欄位

// CRITICAL: React Native Web 相容性
// - DocumentPicker 在 Web 和 Native 行為不同
// - 需要使用 pickDocument utility 處理跨平台

// CRITICAL: OpenAI API 限制
// - 需要管理 API 配額
// - 敏感資料不應發送到 AI
```

## Implementation Blueprint

### Data Models and Structure

```typescript
// 擴展現有的 userImport.ts 類型
interface UserFieldMapping {
  sourceField: string;      // 來源檔案的欄位名
  targetField: string;      // 目標用戶屬性
  confidence: number;        // AI 建議的信心度 (0-1)
  isRequired: boolean;       // 是否必填
  dataType: 'email' | 'text' | 'phone' | 'select' | 'date';
  transformation?: (value: any) => any;  // 資料轉換函數
}

interface UserImportConfig extends ImportConfig {
  fieldMappings: UserFieldMapping[];
  mergeStrategy?: 'left' | 'inner' | 'outer';
  keyField?: string;          // 用於合併的關鍵欄位
  aiAssisted: boolean;         // 是否使用 AI 輔助
  mode: 'simple' | 'advanced'; // 匯入模式
}

interface UserImportWizardState {
  stage: 'upload' | 'mapping' | 'preview';
  files: ParsedFile[];
  mergedData: any[];
  mappings: UserFieldMapping[];
  validationResults: ValidationResult[];
  importProgress: ImportProgress;
}
```

### List of Tasks to be Completed (in order)

```yaml
Task 1: 建立 UserImportWizard 主架構
CREATE src/components/users/UserImportWizard.tsx:
  - MIRROR pattern from: src/components/import/ImportWizard.tsx
  - MODIFY stages to: upload -> mapping -> preview
  - ADD mode toggle for simple/advanced
  - INTEGRATE with existing Modal structure

Task 2: 實作檔案上傳階段
CREATE src/components/users/stages/UserFileUploader.tsx:
  - EXTEND from: src/components/import/stages/FileUploadMerger.tsx
  - KEEP multi-file support and encoding detection
  - ADD user-specific validation (check for email-like fields)
  - MODIFY UI text for user context

Task 3: 實作智能欄位映射
CREATE src/components/users/stages/UserFieldMapper.tsx:
  - EXTEND from: src/components/import/stages/FieldMapper.tsx
  - ADD required field indicators for email/name
  - INTEGRATE IntelligentFieldMapper for AI suggestions
  - ADD Chinese field name patterns (姓名、電子郵件、部門等)

Task 4: 建立映射引擎
CREATE src/services/users/UserFieldMappingEngine.ts:
  - EXTEND from: src/services/import/intelligentMapper.ts
  - ADD user-specific field patterns
  - ADD bilingual support (中英文欄位名)
  - IMPLEMENT confidence scoring for mappings

Task 5: 實作資料預覽和編輯
CREATE src/components/users/stages/UserDataPreview.tsx:
  - REUSE UserDataPreviewTable from EnhancedBulkImportModal
  - ADD inline editing capabilities
  - ADD validation indicators
  - IMPLEMENT batch operations (set all roles, departments)

Task 6: 建立匯入協調器
CREATE src/services/users/UserImportOrchestrator.ts:
  - COORDINATE all import stages
  - HANDLE file merging using fileMerger.ts
  - MANAGE validation using UserDataValidator
  - IMPLEMENT batch processing for Firebase

Task 7: 整合到現有系統
MODIFY src/components/organization/BulkImportUsersModal.tsx:
  - REPLACE content with UserImportWizard
  - KEEP existing props interface
  - ADD backward compatibility

Task 8: 新增模式切換功能
CREATE src/components/users/UserImportModeToggle.tsx:
  - IMPLEMENT toggle between simple/advanced modes
  - STORE preference in localStorage
  - UPDATE UI based on mode

Task 9: 優化效能和錯誤處理
MODIFY src/services/users/UserImportService.ts:
  - ADD chunking for large datasets
  - IMPLEMENT retry logic for failed imports
  - ADD detailed error reporting

Task 10: 測試和文檔
CREATE src/tests/users/UserImportWizard.test.tsx:
  - TEST file upload and parsing
  - TEST field mapping accuracy
  - TEST data validation
  - TEST import process
UPDATE docs/user-import-guide.md:
  - DOCUMENT new features
  - ADD troubleshooting guide
```

### Per Task Pseudocode

```typescript
// Task 1: UserImportWizard 主架構
const UserImportWizard: React.FC<Props> = ({ visible, organization, onClose }) => {
  // PATTERN: 使用相同的階段管理模式
  const [currentStage, setCurrentStage] = useState<ImportStage>('upload');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  
  // CRITICAL: 保存映射狀態供後續階段使用
  const [wizardState, setWizardState] = useState<UserImportWizardState>({
    files: [],
    mappings: [],
    mergedData: []
  });

  // PATTERN: 階段轉換邏輯（參考 ImportWizard.tsx）
  const handleStageComplete = (stage: ImportStage, data: any) => {
    // 驗證階段資料
    // 更新狀態
    // 進入下一階段
  };

  return (
    <Modal visible={visible}>
      {/* 模式切換器 */}
      <UserImportModeToggle mode={mode} onChange={setMode} />
      
      {/* 階段指示器 */}
      <StageIndicator current={currentStage} />
      
      {/* 動態載入階段元件 */}
      {currentStage === 'upload' && (
        <UserFileUploader 
          onComplete={(files) => handleStageComplete('upload', files)}
          mode={mode}
        />
      )}
      {/* ... other stages */}
    </Modal>
  );
};

// Task 4: UserFieldMappingEngine
class UserFieldMappingEngine extends FieldMappingEngine {
  // 用戶特定的欄位模式
  private USER_FIELD_PATTERNS = {
    email: [
      /^(email|mail|電子郵件|電郵|信箱|e-mail|郵箱)/i,
      /^(用戶郵件|使用者信箱|帳號)/i
    ],
    name: [
      /^(name|姓名|名字|全名|用戶名|使用者名稱)/i,
      /^(員工姓名|成員名稱|人員姓名)/i
    ],
    department: [
      /^(department|dept|部門|單位|處室|科別)/i,
      /^(所屬部門|隸屬單位)/i
    ],
    position: [
      /^(position|title|職位|職稱|職務|頭銜)/i,
      /^(工作職稱|職級)/i
    ]
  };

  async suggestMappings(headers: string[]): Promise<UserFieldMapping[]> {
    const mappings: UserFieldMapping[] = [];
    
    for (const header of headers) {
      // PATTERN: 先用規則匹配
      let bestMatch = this.matchByPattern(header);
      
      // GOTCHA: 如果沒有匹配且啟用 AI，則使用 AI
      if (!bestMatch && this.config.aiEnabled) {
        bestMatch = await this.matchByAI(header);
      }
      
      mappings.push({
        sourceField: header,
        targetField: bestMatch?.field || '',
        confidence: bestMatch?.confidence || 0,
        isRequired: ['email', 'name'].includes(bestMatch?.field || ''),
        dataType: this.inferDataType(header)
      });
    }
    
    return mappings;
  }
}
```

### Integration Points
```yaml
COMPONENTS:
  - integrate with: src/screens/superadmin/OrganizationDetailScreen.tsx
  - pattern: "Replace BulkImportUsersModal with UserImportWizard"
  
SERVICES:
  - reuse: src/services/firebase/admin/userAssistService.ts
  - extend: "Add new importUsersWithMapping method"
  
STATE:
  - update: src/stores/adminStore.ts
  - add: "Track import progress and mapping preferences"
  
STYLES:
  - follow: src/theme/designSystem.ts
  - maintain: "Consistent spacing, colors, and typography"
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# 檢查 TypeScript 類型
npx tsc --noEmit

# 檢查代碼風格
npm run lint

# Expected: No errors
```

### Level 2: Component Tests
```typescript
// src/tests/users/UserImportWizard.test.tsx
describe('UserImportWizard', () => {
  it('should handle file upload correctly', async () => {
    const { getByText, getByTestId } = render(
      <UserImportWizard {...mockProps} />
    );
    
    // 上傳測試檔案
    const file = new File(['email,name\ntest@example.com,Test User'], 'users.csv');
    fireEvent.change(getByTestId('file-input'), { target: { files: [file] } });
    
    // 驗證檔案被解析
    await waitFor(() => {
      expect(getByText('users.csv')).toBeInTheDocument();
    });
  });

  it('should suggest field mappings correctly', async () => {
    // 測試 AI 映射建議
    const mappings = await mapperEngine.suggestMappings(['電子郵件', '姓名', '部門']);
    
    expect(mappings[0].targetField).toBe('email');
    expect(mappings[0].confidence).toBeGreaterThan(0.8);
  });

  it('should validate required fields', () => {
    // 測試必填欄位驗證
    const result = validator.validate(mockData);
    
    expect(result.errors).toContain('Email is required');
  });
});
```

### Level 3: Integration Test
```bash
# 啟動開發環境
npm run web

# 測試匯入流程
# 1. 開啟組織詳情頁
# 2. 點擊「批量匯入用戶」
# 3. 上傳 CSV 檔案
# 4. 驗證欄位映射
# 5. 執行匯入

# Expected: 用戶成功匯入，顯示在列表中
```

### Level 4: Performance Test
```typescript
// 測試大量資料匯入
it('should handle 1000 users import within 30 seconds', async () => {
  const largeFile = generateTestFile(1000); // 生成 1000 筆測試資料
  const startTime = Date.now();
  
  await importService.importUsers(largeFile);
  
  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(30000); // 30 秒內完成
});
```

## UI/UX Design Considerations

### 視覺設計規範
```
1. 階段指示器
   - 使用現有的 StageIndicator 元件樣式
   - 清晰顯示：上傳 → 映射 → 預覽

2. 欄位映射介面
   ┌─────────────────────────────────────────┐
   │ 📊 智能欄位映射                         │
   ├─────────────────────────────────────────┤
   │ 來源欄位         →  目標欄位   信心度   │
   │ ─────────────────────────────────────── │
   │ Email Address    →  電子郵件    95% ✅  │
   │ Full Name        →  姓名        92% ✅  │
   │ 部門            →  [選擇▼]     78% ⚠️  │
   │                     建議：department     │
   └─────────────────────────────────────────┘

3. 錯誤提示
   - 使用紅色標記無效資料
   - 提供具體的修正建議
   - 支援批量修正

4. 進度顯示
   - 實時更新匯入進度
   - 顯示成功/失敗統計
   - 允許查看詳細錯誤
```

### 互動流程優化
```yaml
簡易模式:
  - 單檔案上傳
  - 自動欄位映射
  - 快速匯入

進階模式:
  - 多檔案合併
  - 手動調整映射
  - 資料編輯和驗證
  - 批量操作
```

## Final Validation Checklist
- [ ] TypeScript 編譯無錯誤
- [ ] 所有測試通過 (npm test)
- [ ] 無 linting 錯誤 (npm run lint)
- [ ] Web 平台測試成功
- [ ] Native 平台測試成功
- [ ] 支援中英文欄位名稱
- [ ] AI 映射準確率 > 85%
- [ ] 1000 筆資料匯入 < 30 秒
- [ ] 錯誤處理完善
- [ ] 文檔更新完成

## Anti-Patterns to Avoid
- ❌ 不要硬編碼欄位名稱
- ❌ 不要忽略檔案編碼問題
- ❌ 不要在前端直接調用 Firebase Admin SDK
- ❌ 不要發送敏感資料到 OpenAI
- ❌ 不要忽略大檔案的記憶體問題
- ❌ 不要破壞現有的簡易匯入功能

## Risk Mitigation
```yaml
風險 1: AI API 配額超限
  緩解: 實作本地快取和降級到規則匹配

風險 2: 大檔案造成瀏覽器崩潰  
  緩解: 實作串流處理和分批匯入

風險 3: Firebase 批量建立失敗
  緩解: 實作重試機制和部分成功處理

風險 4: 中文編碼問題
  緩解: 自動檢測編碼，提供手動選擇
```

## Success Metrics
- 用戶匯入成功率提升 30%
- 平均匯入時間減少 50%
- 欄位映射準確率 > 85%
- 用戶滿意度 > 4.5/5

---

**優先級**: 高
**預估時間**: 4-5 天
**依賴項**: 現有 ImportWizard、IntelligentFieldMapper
**實作信心度**: 9/10

此 PRP 提供了完整的實作指南，包含所有必要的 context、程式碼範例、驗證方法和風險緩解策略。透過重用現有的智能映射元件和服務，可以快速實現功能並確保一致的用戶體驗。