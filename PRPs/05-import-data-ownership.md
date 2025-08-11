# PRP-05: 匯入資料所有權分配系統

## Executive Summary
實作 CSV 資料匯入時支援分配給特定用戶帳戶的功能，讓管理員可以將從舊系統匯出的客戶資料、記錄或任務直接分配給組織內的特定業務人員，建立清楚的資料所有權和權限管理。

## Background & Motivation

### 現況分析
- 現有的匯入系統（ImportWizard、UserImportWizard、LegacyDataImportScreen）只支援批量匯入資料
- 匯入後的資料缺乏明確的所有權分配機制
- 管理員需要手動逐筆修改 `assignedTo` 欄位
- 無法在匯入時批量指定負責人

### 業務需求
- 客戶從舊 CRM 系統遷移到 DonnaAI 時，需要保持原有的業務分配關係
- 管理員希望能在匯入過程中直接指定資料負責人
- 支援多種分配策略：單一負責人、按規則分配、CSV 中指定

## Detailed Requirements

### 核心功能需求

#### 1. 用戶選擇界面
- 在匯入精靈中新增「資料分配」步驟
- 顯示組織內所有可分配的用戶（依權限過濾）
- 支援按部門、角色篩選用戶列表
- 提供用戶搜尋功能

#### 2. 分配策略選項
```typescript
type AssignmentStrategy = 
  | 'single_user'      // 全部分配給單一用戶
  | 'round_robin'      // 輪流分配
  | 'csv_column'       // CSV 中指定負責人欄位
  | 'department_rule'  // 按部門規則分配
  | 'manual_mapping'   // 手動對應分配
```

#### 3. CSV 欄位對應
- 支援從 CSV 中讀取負責人資訊
- 智能識別可能的負責人欄位（姓名、Email、工號等）
- 提供負責人資料驗證和轉換
- 處理找不到對應用戶的情況

#### 4. 批量分配預覽
- 顯示分配結果預覽
- 統計各用戶將獲得的資料數量
- 標示無法分配的資料
- 允許調整分配結果

### 權限控制需求

#### 1. 分配權限檢查
- 只有管理員和有權限的主管可以進行資料分配
- 檢查分配目標用戶的資料接收權限
- 確保跨團隊分配的合規性

#### 2. 資料可見性
- 分配後自動設置正確的 `assignedTo`、`teamId`、`organizationId`
- 確保資料權限與組織架構一致
- 建立分配歷史記錄

### 技術需求

#### 1. 資料結構擴展
```typescript
interface ImportAssignmentConfig {
  strategy: AssignmentStrategy;
  assigneeId?: string; // 單一分配時使用
  csvColumn?: string;  // CSV 欄位名稱
  assigneeMapping?: Map<string, string>; // CSV 值到用戶 ID 的映射
  defaultAssignee?: string; // 無法分配時的預設用戶
  departmentRules?: DepartmentAssignmentRule[];
}

interface AssignmentPreview {
  userId: string;
  userName: string;
  assignedCount: number;
  assignedItems: string[]; // 資料 ID 或描述
}

interface AssignmentHistory {
  id: string;
  importSessionId: string;
  assignerId: string; // 執行分配的管理員
  assigneeId: string; // 被分配的用戶
  dataType: 'customers' | 'records' | 'tasks';
  dataCount: number;
  assignedAt: Timestamp;
  organizationId: string;
}
```

## Technical Architecture

### 現有系統整合分析

#### 1. 權限系統整合
```typescript
// 基於現有的 permissions.ts
export const canAssignDataTo = async (
  assignerId: string, 
  assigneeId: string,
  organizationId: string
): Promise<boolean> => {
  // 檢查分配者權限
  if (!await isOrgAdmin(assignerId)) {
    // 檢查是否為有權限的主管
    const isManager = await isManagerOfUser(assignerId, assigneeId);
    if (!isManager) return false;
  }
  
  // 檢查被分配者是否在同組織
  const assigneeDoc = await getDoc(doc(getFirebaseDb(), 'users', assigneeId));
  if (!assigneeDoc.exists()) return false;
  
  const assignee = assigneeDoc.data() as User;
  return assignee.organizationId === organizationId;
};
```

#### 2. 現有匯入服務擴展
```typescript
// 擴展 SmartDataImporter
class SmartDataImporter {
  async importWithAssignment(
    data: any[],
    config: ImportConfig & { assignmentConfig: ImportAssignmentConfig }
  ): Promise<ImportResult> {
    const assignmentResults = await this.processAssignments(data, config.assignmentConfig);
    
    // 為每筆資料添加分配資訊
    const dataWithAssignment = data.map((item, index) => ({
      ...item,
      assignedTo: assignmentResults[index].assigneeId,
      teamId: assignmentResults[index].teamId,
      assignedAt: Timestamp.now(),
      assignedBy: config.userId
    }));
    
    return await this.importData(dataWithAssignment, config);
  }
  
  private async processAssignments(
    data: any[],
    config: ImportAssignmentConfig
  ): Promise<AssignmentResult[]> {
    switch (config.strategy) {
      case 'single_user':
        return this.assignToSingleUser(data, config.assigneeId!);
      
      case 'csv_column':
        return await this.assignFromCSV(data, config);
      
      case 'round_robin':
        return this.assignRoundRobin(data, config);
      
      default:
        throw new Error(`Unsupported assignment strategy: ${config.strategy}`);
    }
  }
}
```

### 新增元件架構

#### 1. 資料分配步驟元件
```typescript
// src/components/import/stages/DataAssignmentStep.tsx
interface DataAssignmentStepProps {
  data: any[];
  organizationId: string;
  currentUserId: string;
  onAssignmentChange: (config: ImportAssignmentConfig) => void;
}
```

#### 2. 用戶選擇元件
```typescript
// src/components/import/UserSelector.tsx
interface UserSelectorProps {
  organizationId: string;
  currentUserId: string;
  multiple?: boolean;
  filterByRole?: UserRole[];
  onSelection: (users: User[]) => void;
}
```

#### 3. 分配預覽元件
```typescript
// src/components/import/AssignmentPreview.tsx
interface AssignmentPreviewProps {
  data: any[];
  assignmentConfig: ImportAssignmentConfig;
  onAdjustment?: (adjustments: AssignmentAdjustment[]) => void;
}
```

## Implementation Blueprint

### File Structure
```
src/
├── components/
│   └── import/
│       ├── stages/
│       │   └── DataAssignmentStep.tsx        # 新增：資料分配步驟
│       ├── assignment/
│       │   ├── UserSelector.tsx              # 新增：用戶選擇器
│       │   ├── AssignmentPreview.tsx         # 新增：分配預覽
│       │   ├── AssignmentStrategySelector.tsx # 新增：策略選擇
│       │   └── CSVColumnMapper.tsx           # 新增：CSV 欄位映射
│       └── ImportWizard.tsx                  # 修改：增加分配步驟
├── services/
│   ├── import/
│   │   ├── AssignmentEngine.ts               # 新增：分配引擎
│   │   └── UserMatcher.ts                    # 新增：用戶匹配邏輯
│   └── firebase/
│       ├── assignmentHistory.ts              # 新增：分配歷史管理
│       └── dataImportService.ts              # 修改：支援分配
└── types/
    ├── assignment.ts                         # 新增：分配相關類型
    └── import.ts                             # 修改：擴展匯入類型
```

## Task List

### Task 1: 擴展匯入資料結構
```typescript
// MODIFY src/types/import.ts
- ADD ImportAssignmentConfig interface
- ADD AssignmentStrategy enum
- ADD AssignmentPreview interface
- ADD AssignmentHistory interface
- EXTEND ImportWizardState with assignment step
```

### Task 2: 建立分配引擎
```typescript
// CREATE src/services/import/AssignmentEngine.ts
- IMPLEMENT single user assignment
- IMPLEMENT round robin assignment  
- IMPLEMENT CSV column assignment
- IMPLEMENT department rule assignment
- ADD assignment validation
- ADD conflict resolution
```

### Task 3: 實作用戶匹配邏輯
```typescript
// CREATE src/services/import/UserMatcher.ts
- IMPLEMENT user lookup by email
- IMPLEMENT user lookup by name
- IMPLEMENT fuzzy matching for names
- IMPLEMENT employee ID matching
- ADD matching confidence scoring
```

### Task 4: 建立分配步驟 UI
```typescript
// CREATE src/components/import/stages/DataAssignmentStep.tsx
- DISPLAY assignment strategy options
- INTEGRATE UserSelector component
- SHOW assignment preview
- HANDLE strategy switching
- VALIDATE assignment configuration
```

### Task 5: 實作用戶選擇器
```typescript
// CREATE src/components/import/assignment/UserSelector.tsx
- FETCH organization users
- IMPLEMENT role-based filtering
- ADD department filtering
- SUPPORT search functionality
- HANDLE multiple selection
```

### Task 6: 建立分配預覽元件
```typescript
// CREATE src/components/import/assignment/AssignmentPreview.tsx
- CALCULATE assignment distribution
- DISPLAY assignment statistics
- HIGHLIGHT unassigned items
- ALLOW manual adjustments
- SHOW user workload balance
```

### Task 7: 擴展權限系統
```typescript
// MODIFY src/services/firebase/permissions.ts
- ADD canAssignDataTo function
- ADD canReceiveAssignedData function
- EXTEND existing permission checks
- ADD assignment history permissions
```

### Task 8: 建立分配歷史管理
```typescript
// CREATE src/services/firebase/assignmentHistory.ts
- IMPLEMENT createAssignmentHistory
- IMPLEMENT getAssignmentHistory
- IMPLEMENT getUserAssignmentHistory
- ADD assignment audit trail
```

### Task 9: 整合到現有匯入精靈
```typescript
// MODIFY src/components/import/ImportWizard.tsx
- ADD assignment step to wizard
- UPDATE wizard navigation
- INTEGRATE assignment config
- EXTEND import process with assignment
```

### Task 10: 擴展匯入服務
```typescript
// MODIFY src/services/firebase/admin/dataImportService.ts
- ADD assignment processing
- EXTEND SmartDataImporter with assignment
- IMPLEMENT assignment validation
- ADD assignment error handling
```

### Task 11: 更新 Firestore 規則
```javascript
// MODIFY firestore.rules
// 新增 assignment_history 集合規則
match /assignment_history/{historyId} {
  allow read: if request.auth != null && 
    (getUserData().organizationId == resource.data.organizationId &&
     (getUserData().role in ['admin', 'manager'] || 
      getUserData().uid == resource.data.assigneeId));
  
  allow create: if request.auth != null && 
    getUserData().organizationId == request.resource.data.organizationId &&
    getUserData().role in ['admin', 'manager'];
}

// 確保匯入資料的 assignedTo 權限
match /customers/{customerId} {
  allow create: if request.auth != null &&
    validateAssignedTo(request.resource.data.assignedTo);
}
```

### Task 12: 建立分配策略配置 UI
```typescript
// CREATE src/components/import/assignment/AssignmentStrategySelector.tsx
- DISPLAY strategy options with descriptions
- SHOW configuration options per strategy
- VALIDATE strategy requirements
- PREVIEW assignment approach
```

## Validation Gates

```bash
# 類型檢查
npm run type-check

# 權限測試
npm test -- assignment.test.ts

# 分配引擎測試
npm test -- AssignmentEngine.test.ts

# 整合測試
npm test -- import-assignment.test.ts

# E2E 測試
npm run test:e2e -- import-with-assignment

# 建置測試
npm run web:build
```

## Success Criteria

1. ✅ 管理員可以選擇將匯入資料分配給特定用戶
2. ✅ 支援多種分配策略（單一用戶、輪流、CSV 指定等）
3. ✅ 提供分配結果預覽和統計
4. ✅ 確保分配符合組織權限結構
5. ✅ 建立完整的分配歷史記錄
6. ✅ 支援從 CSV 欄位自動識別負責人
7. ✅ 分配成功率 > 98%
8. ✅ 處理 1,000 筆資料分配 < 10 秒

## Migration & Testing Strategy

### 向後相容性
- 保持現有匯入功能不變
- 分配功能為可選步驟
- 未分配的資料使用預設行為（分配給匯入者）

### 測試案例
```typescript
describe('Data Assignment', () => {
  test('single user assignment', async () => {
    // 測試分配給單一用戶
  });
  
  test('CSV column assignment', async () => {
    // 測試從 CSV 讀取負責人
  });
  
  test('permission validation', async () => {
    // 測試權限檢查
  });
  
  test('unmatched user handling', async () => {
    // 測試找不到用戶的處理
  });
});
```

## Risk Mitigation

### 風險 1: 用戶匹配失敗
- **解決方案**: 提供多種匹配策略（email、姓名、工號）
- **備案**: 允許手動映射和預設分配

### 風險 2: 大量資料分配效能
- **解決方案**: 使用批次處理和快取
- **備案**: 分段處理並顯示進度

### 風險 3: 權限複雜度
- **解決方案**: 基於現有權限系統擴展
- **備案**: 提供簡化權限模式

## Integration Points

### 與現有系統整合
1. **ImportWizard**: 增加分配步驟到現有三階段流程
2. **權限系統**: 基於 `permissions.ts` 擴展分配權限
3. **用戶管理**: 整合 `useOrganization` hook 獲取組織用戶
4. **資料庫**: 擴展現有 `assignedTo` 欄位邏輯

### API 擴展
```typescript
// 現有 API 保持不變，新增分配相關端點
POST /api/import/validate-assignment
GET /api/users/assignable
POST /api/assignment/preview
GET /api/assignment/history
```

## Reference Code Patterns

### 基於現有程式碼模式
```typescript
// 參考 src/services/firebase/permissions.ts 的權限檢查模式
// 參考 src/components/import/ImportWizard.tsx 的步驟流程
// 參考 src/hooks/useOrganization.ts 的用戶獲取邏輯
// 參考 src/stores/customerStore.ts 的資料分配模式
```

## Notes for AI Implementation

### 重要提醒
1. **基於現有架構**: 充分利用現有的權限系統和匯入邏輯
2. **權限安全**: 每個分配操作都要進行權限驗證
3. **用戶體驗**: 分配流程要直觀易懂
4. **錯誤處理**: 處理用戶匹配失敗、權限不足等情況
5. **效能考量**: 大量資料分配要有進度顯示

### 現有程式碼引用點
- `src/services/firebase/permissions.ts` - 權限檢查邏輯
- `src/components/import/ImportWizard.tsx` - 現有匯入精靈
- `src/hooks/useOrganization.ts` - 組織用戶管理
- `src/types/entities/organization.ts` - 組織結構定義
- `src/services/validation/form-schemas.ts` - 表單驗證模式

## Confidence Score

**實作成功信心度: 9.0/10**

### 信心度分析
- ✅ 清楚的業務需求和技術規劃
- ✅ 基於現有穩定的權限和匯入系統
- ✅ 詳細的實作步驟和錯誤處理
- ✅ 完整的測試和驗證策略
- ✅ 考慮了向後相容性和遷移
- ⚠️ 需要仔細處理大量資料的效能問題

---

*PRP-05: Import Data Ownership Assignment System | Version 1.0 | Created: 2025-01-11*