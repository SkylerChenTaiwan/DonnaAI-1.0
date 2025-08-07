# PRP-83: 增強組織批量用戶匯入系統

## Goal
重構現有的批量用戶匯入功能，提供類似客戶資料匯入的兩階段體驗：第一階段自動讀取和解析 CSV 檔案，第二階段允許用戶預覽、驗證和編輯資料後執行匯入。

## Why
- **使用者體驗**: 現有的 BulkImportUsersModal 缺乏預覽和編輯功能，用戶無法在匯入前修正資料
- **業務需求**: 組織管理員經常有現成的員工名單，需要能夠批量匯入並在過程中調整資料
- **一致性**: 與已有的客戶資料匯入功能保持相似的操作體驗
- **資料品質**: 提供驗證和修正機制，確保匯入的用戶資料正確完整

## What
建立一個改進的批量用戶匯入系統，包含：

### 階段 1: 檔案上傳與自動解析
- 支援 CSV 檔案上傳（Excel 支援可後續添加）
- 自動解析檔案並提取用戶資料
- 即時顯示解析結果和錯誤警告

### 階段 2: 資料預覽與編輯
- 顯示解析後的用戶清單
- 提供內聯編輯功能修改個別用戶資料
- 支援批量設定（如預設角色、部門）
- 重複資料檢測和處理選項

### 階段 3: 執行匯入
- 顯示最終匯入清單和統計
- 安全的批量用戶建立（不影響當前登入狀態）
- 實時進度顯示
- 詳細的成功/失敗報告

### Success Criteria
- [ ] 用戶可以上傳 CSV 檔案並自動解析
- [ ] 提供預覽和編輯功能修改資料
- [ ] 支援批量設定和重複資料處理
- [ ] 安全執行批量用戶建立
- [ ] 提供詳細的匯入結果報告
- [ ] 在 Web 和 Native 平台都能正常運作

## All Needed Context

### Documentation & References
```yaml
- file: src/components/organization/BulkImportUsersModal.tsx
  why: 現有實現，需要參考其基本結構和整合方式

- file: src/components/input/CSVUploader.tsx  
  why: 優秀的階段式匯入模式和資料驗證邏輯

- file: src/components/import/ImportWizard.tsx
  why: 三階段匯入精靈的完整實現參考

- file: src/services/users/UserCreationService.ts
  why: 安全的批量用戶建立功能，確保不影響當前登入

- file: src/services/csv/parser.ts
  why: CSV 解析功能和驗證邏輯

- file: src/services/firebase/admin/userAssistService.ts
  why: 用戶匯入相關服務和欄位映射

- doc: https://expo.github.io/expo/classes/documentpicker.html
  why: 檔案選擇功能在跨平台的實現方式
```

### Current Codebase Tree (相關部分)
```bash
src/
├── components/
│   ├── input/
│   │   └── CSVUploader.tsx          # 參考的階段式匯入模式
│   ├── organization/
│   │   ├── BulkImportUsersModal.tsx # 現有需要重構的功能
│   │   └── AddUserToOrganizationModal.tsx
│   └── import/
│       └── ImportWizard.tsx         # 三階段匯入精靈參考
├── services/
│   ├── users/
│   │   └── UserCreationService.ts   # 安全的用戶建立服務
│   ├── csv/
│   │   ├── parser.ts               # CSV 解析功能
│   │   └── validator.ts            # 資料驗證功能
│   └── firebase/admin/
│       └── userAssistService.ts    # 用戶匯入協助服務
└── screens/superadmin/
    └── OrganizationDetailScreen.tsx # 使用批量匯入的頁面
```

### Desired Codebase tree with new/modified files
```bash
src/
├── components/
│   ├── organization/
│   │   ├── EnhancedBulkImportModal.tsx    # 新的增強版批量匯入 Modal
│   │   ├── UserDataPreviewTable.tsx       # 用戶資料預覽表格組件
│   │   └── UserImportStageIndicator.tsx   # 匯入階段指示器
│   └── input/
│       └── EditableUserRow.tsx            # 可編輯的用戶列組件
├── services/
│   └── users/
│       ├── UserImportService.ts           # 用戶匯入專用服務
│       └── UserDataValidator.ts           # 用戶資料驗證服務
└── types/
    └── userImport.ts                      # 用戶匯入相關類型定義
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Native Web 的檔案上傳需要特殊處理
// Example: 需要使用 pickDocument 而不是原生的 file input

// CRITICAL: Firebase Auth 的用戶建立會改變當前登入狀態
// Example: 必須使用 UserCreationService 的 Cloud Function 方式

// CRITICAL: CSV 解析在不同平台有不同的檔案讀取方式
// Example: Web 使用 data URL，Native 使用 FileSystem.readAsStringAsync

// CRITICAL: 大量用戶建立需要批量處理避免超時
// Example: 每批處理 10-20 個用戶，顯示進度

// CRITICAL: Web 平台的 Alert.alert 不工作
// Example: 需要使用 window.confirm 或自訂 Modal
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// 用戶匯入階段類型
export type UserImportStage = 'upload' | 'preview' | 'configure' | 'importing' | 'complete';

// 匯入的用戶資料
export interface ImportUserData {
  id: string;                    // 臨時 ID 用於編輯
  email: string;                 // 必填
  name: string;                  // 必填  
  role?: 'user' | 'admin';       // 預設 'user'
  department?: string;
  position?: string;
  phoneNumber?: string;
  // 驗證狀態
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
  // 編輯狀態
  isEdited: boolean;
  isSelected: boolean;           // 是否選中匯入
}

// 匯入配置
export interface UserImportConfig {
  defaultRole: 'user' | 'admin';
  skipDuplicates: boolean;
  updateExisting: boolean;
  sendWelcomeEmail: boolean;
  generatePasswords: boolean;
  organizationId: string;
}

// 匯入進度
export interface UserImportProgress {
  isImporting: boolean;
  totalUsers: number;
  processedUsers: number;
  successCount: number;
  errorCount: number;
  currentUser: string;
  errors: ImportError[];
}

// 匯入結果
export interface UserImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped: number;
  errors: ImportError[];
  warnings: string[];
}
```

### List of Tasks to Complete (in order)

```yaml
Task 1: 創建用戶匯入類型定義
CREATE src/types/userImport.ts:
  - DEFINE UserImportStage, ImportUserData 等介面
  - MIRROR pattern from: src/types/import.ts (ImportWizard 使用的)
  - KEEP 與現有類型系統的一致性

Task 2: 創建用戶資料驗證服務
CREATE src/services/users/UserDataValidator.ts:
  - PATTERN: 參考 src/services/csv/validator.ts 的驗證邏輯
  - IMPLEMENT email 格式驗證
  - IMPLEMENT 重複資料檢測
  - IMPLEMENT 必填欄位檢查
  - RETURN 結構化的驗證結果

Task 3: 創建用戶匯入專用服務  
CREATE src/services/users/UserImportService.ts:
  - USE UserCreationService 的安全建立功能
  - IMPLEMENT 批量處理邏輯（每批 10-20 個）
  - IMPLEMENT 進度回調機制
  - HANDLE 錯誤收集和報告
  - PRESERVE 現有登入狀態

Task 4: 創建階段指示器組件
CREATE src/components/organization/UserImportStageIndicator.tsx:
  - MIRROR pattern from: BulkImportUsersModal 的 IMPORT_STEPS
  - ENHANCE 視覺設計使用 DesignSystem
  - SUPPORT 4個階段：upload, preview, configure, importing, complete

Task 5: 創建可編輯用戶列組件
CREATE src/components/input/EditableUserRow.tsx:
  - PATTERN: 類似 CSVUploader 的資料展示但支援編輯
  - IMPLEMENT 內聯編輯功能 (name, email, role, department 等)
  - SUPPORT 驗證狀態顯示（錯誤標示）
  - INCLUDE 選擇/取消選擇功能

Task 6: 創建用戶資料預覽表格
CREATE src/components/organization/UserDataPreviewTable.tsx:
  - USE EditableUserRow 來展示每個用戶
  - IMPLEMENT 全選/取消全選功能
  - IMPLEMENT 批量設定功能（預設角色等）
  - SHOW 統計資訊（總數、有效、錯誤、重複等）
  - INCLUDE 重複資料處理選項

Task 7: 創建增強版批量匯入 Modal
CREATE src/components/organization/EnhancedBulkImportModal.tsx:
  - REPLACE BulkImportUsersModal 的功能
  - IMPLEMENT 4階段流程控制
  - STAGE 1: 檔案上傳和解析（使用 CSVUploader 模式）
  - STAGE 2: 資料預覽和編輯（使用 UserDataPreviewTable）
  - STAGE 3: 匯入配置和確認
  - STAGE 4: 執行匯入和結果展示
  - HANDLE 跨平台檔案處理差異

Task 8: 更新組織詳情頁面整合
MODIFY src/screens/superadmin/OrganizationDetailScreen.tsx:
  - REPLACE BulkImportUsersModal import
  - UPDATE to use EnhancedBulkImportModal
  - PRESERVE 所有現有的回調和整合邏輯
  - ENSURE 錯誤處理保持一致

Task 9: 創建測試檔案
CREATE tests for all new components and services:
  - TEST UserDataValidator 的驗證邏輯
  - TEST UserImportService 的批量處理
  - TEST EnhancedBulkImportModal 的狀態管理
  - MOCK Firebase 服務和檔案操作
```

### Per Task Pseudocode

#### Task 2: UserDataValidator.ts
```typescript
export class UserDataValidator {
  // 驗證單一用戶資料
  validateUser(userData: Partial<ImportUserData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // 必填欄位檢查
    if (!userData.email) errors.push('電子郵件為必填');
    if (!userData.name) errors.push('姓名為必填');
    
    // 格式驗證
    if (userData.email && !isValidEmail(userData.email)) {
      errors.push('電子郵件格式不正確');
    }
    
    // 角色驗證
    if (userData.role && !['user', 'admin'].includes(userData.role)) {
      errors.push('角色必須是 user 或 admin');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // 批量驗證並檢測重複
  validateBatch(users: Partial<ImportUserData>[]): ImportUserData[] {
    const emailSet = new Set<string>();
    const duplicateEmails = new Set<string>();
    
    // 第一次掃描找出重複的 email
    users.forEach(user => {
      if (user.email) {
        if (emailSet.has(user.email.toLowerCase())) {
          duplicateEmails.add(user.email.toLowerCase());
        }
        emailSet.add(user.email.toLowerCase());
      }
    });
    
    // 第二次掃描進行完整驗證
    return users.map((user, index) => {
      const validation = this.validateUser(user);
      const isDuplicate = user.email ? 
        duplicateEmails.has(user.email.toLowerCase()) : false;
      
      return {
        id: `user-${index}`,
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'user',
        department: user.department,
        position: user.position,
        phoneNumber: user.phoneNumber,
        isValid: validation.isValid && !isDuplicate,
        validationErrors: [
          ...validation.errors,
          ...(isDuplicate ? ['電子郵件重複'] : [])
        ],
        isDuplicate,
        isEdited: false,
        isSelected: validation.isValid && !isDuplicate
      };
    });
  }
}
```

#### Task 3: UserImportService.ts
```typescript
export class UserImportService {
  private userCreationService = UserCreationService.getInstance();
  private batchSize = 15; // 每批處理數量
  
  async importUsers(
    users: ImportUserData[],
    config: UserImportConfig,
    onProgress: (progress: UserImportProgress) => void
  ): Promise<UserImportResult> {
    const validUsers = users.filter(u => u.isSelected && u.isValid);
    const totalUsers = validUsers.length;
    
    let processedUsers = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: ImportError[] = [];
    
    // 批量處理
    for (let i = 0; i < validUsers.length; i += this.batchSize) {
      const batch = validUsers.slice(i, i + this.batchSize);
      
      // 並行處理當前批次
      const batchPromises = batch.map(async (user) => {
        try {
          const result = await this.userCreationService.createUser({
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: config.organizationId,
            department: user.department,
            // ... 其他欄位
          });
          
          processedUsers++;
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push({
              row: i + batch.indexOf(user),
              email: user.email,
              error: result.error || '建立失敗'
            });
          }
          
          // 更新進度
          onProgress({
            isImporting: true,
            totalUsers,
            processedUsers,
            successCount,
            errorCount,
            currentUser: user.name,
            errors
          });
          
          return result;
        } catch (error) {
          // 處理異常...
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // 批次間的短暫延遲避免過載
      if (i + this.batchSize < validUsers.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      success: errorCount === 0,
      imported: successCount,
      failed: errorCount,
      skipped: users.length - validUsers.length,
      errors,
      warnings: []
    };
  }
}
```

### Integration Points
```yaml
COMPONENTS:
  - replace: src/components/organization/BulkImportUsersModal.tsx
  - add: Enhanced modal with 4-stage process
  - integrate: With existing OrganizationDetailScreen

SERVICES:
  - extend: UserCreationService for batch processing
  - add: Validation and import specialized services
  - integrate: With existing Firebase permissions

UI_PATTERNS:
  - follow: CSVUploader's stage-based approach
  - enhance: With better data editing capabilities  
  - maintain: Consistent DesignSystem usage

ERROR_HANDLING:
  - pattern: Collect errors during processing
  - display: Detailed error reports with row numbers
  - allow: Retry failed imports
```

## Validation Loop

### Level 1: Syntax & Style  
```bash
# TypeScript 編譯檢查
npm run type-check

# ESLint 代碼檢查
npm run lint

# 預期：無錯誤，如有錯誤需修正後再進行
```

### Level 2: Unit Tests
```typescript
// 測試用戶資料驗證
describe('UserDataValidator', () => {
  it('should validate required fields', () => {
    const validator = new UserDataValidator();
    const result = validator.validateUser({});
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('電子郵件為必填');
    expect(result.errors).toContain('姓名為必填');
  });
  
  it('should detect duplicate emails', () => {
    const validator = new UserDataValidator();
    const users = [
      { email: 'test@example.com', name: 'User 1' },
      { email: 'test@example.com', name: 'User 2' }
    ];
    const result = validator.validateBatch(users);
    expect(result.every(u => u.isDuplicate)).toBe(true);
  });
});

// 測試匯入服務
describe('UserImportService', () => {
  it('should process users in batches', async () => {
    const service = new UserImportService();
    const users = createMockUsers(50); // 建立 50 個測試用戶
    const progressUpdates: UserImportProgress[] = [];
    
    const result = await service.importUsers(
      users,
      mockConfig,
      (progress) => progressUpdates.push(progress)
    );
    
    expect(progressUpdates.length).toBeGreaterThan(1);
    expect(result.imported).toBeGreaterThan(0);
  });
});
```

```bash
# 執行測試
npm run test -- --testPathPattern=userImport
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm run web:dev

# 手動測試流程：
# 1. 進入組織管理頁面
# 2. 點擊「批量匯入」按鈕  
# 3. 上傳包含用戶資料的 CSV 檔案
# 4. 驗證預覽階段可以編輯用戶資料
# 5. 確認匯入配置選項正常運作
# 6. 執行匯入並驗證結果報告

# 測試 CSV 格式：
# email,name,role,department,position
# john@example.com,張小明,user,業務部,專員  
# mary@example.com,李小華,admin,管理部,經理
```

## Final Validation Checklist
- [ ] 所有測試通過: `npm run test`
- [ ] 無 linting 錯誤: `npm run lint`
- [ ] 無類型錯誤: `npm run type-check` 
- [ ] CSV 檔案可以正常上傳和解析
- [ ] 預覽階段可以編輯用戶資料
- [ ] 重複資料檢測正常運作
- [ ] 批量匯入不會影響當前登入狀態
- [ ] 錯誤處理優雅且資訊完整
- [ ] Web 和 Native 平台都能正常運作

---

## Anti-Patterns to Avoid
- ❌ 不要在建立用戶時影響當前登入狀態
- ❌ 不要一次處理過多用戶導致超時
- ❌ 不要跳過資料驗證階段
- ❌ 不要使用 Alert.alert 在 Web 平台
- ❌ 不要重複造輪子，善用現有的服務和組件
- ❌ 不要忽視錯誤處理和使用者體驗

---

**PRP 信心評分: 8.5/10**

這個 PRP 提供了完整的實作脈絡，參考了現有的成功模式，並涵蓋了所有關鍵的技術細節和潛在陷阱。實作者可以按照階段式的任務清單進行開發，並使用提供的驗證循環確保每個步驟的品質。