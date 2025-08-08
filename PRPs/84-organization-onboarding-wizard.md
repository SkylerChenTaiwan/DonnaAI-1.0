# PRP: 組織入職精靈（Organization Onboarding Wizard）

## 概述
建立專門的組織入職精靈，提供引導式的組織設置流程，確保新組織能夠快速且正確地完成所有必要設定。這是 SuperAdmin Organization Management Center 的核心子功能。

## 背景與需求
當 SuperAdmin 談成新客戶後，需要一個標準化的流程來：
1. 建立組織基本資料
2. 設定計費方案
3. 批量匯入用戶（支援 CSV/JSON 和 Google 登入）
4. 匯入既有業務資料
5. 發送歡迎通知
6. 確保組織能夠立即開始使用系統

目前問題：
- 設置流程分散在不同功能
- 缺乏進度追蹤
- 沒有驗證機制確保完整性
- 用戶匯入不支援 Google 登入整合

## 實施計畫

### 階段 1：精靈架構設計

#### 1.1 建立精靈主元件
```
src/components/superadmin/onboarding/OnboardingWizard.tsx
```

精靈步驟結構：
```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation: () => Promise<ValidationResult>;
  canSkip: boolean;
  dependsOn?: string[]; // 依賴的步驟
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'basic-info',
    title: '組織基本資訊',
    description: '設定組織名稱、聯絡資訊等',
    component: BasicInfoStep,
    validation: validateBasicInfo,
    canSkip: false
  },
  {
    id: 'billing-plan',
    title: '選擇計費方案',
    description: '設定訂閱方案和付費資訊',
    component: BillingPlanStep,
    validation: validateBillingPlan,
    canSkip: false
  },
  {
    id: 'user-import',
    title: '匯入用戶',
    description: '批量建立組織用戶',
    component: UserImportStep,
    validation: validateUserImport,
    canSkip: true
  },
  {
    id: 'data-migration',
    title: '資料遷移',
    description: '匯入既有客戶和業務資料',
    component: DataMigrationStep,
    validation: validateDataMigration,
    canSkip: true
  },
  {
    id: 'welcome-setup',
    title: '歡迎設定',
    description: '發送歡迎郵件和初始設定',
    component: WelcomeSetupStep,
    validation: validateWelcomeSetup,
    canSkip: true
  }
];
```

#### 1.2 狀態管理
```typescript
interface OnboardingState {
  currentStep: number;
  completedSteps: Set<string>;
  stepData: {
    basicInfo?: BasicInfoData;
    billingPlan?: BillingPlanData;
    userImport?: UserImportData;
    dataMigration?: DataMigrationData;
    welcomeSetup?: WelcomeSetupData;
  };
  validationErrors: Record<string, string[]>;
  isSubmitting: boolean;
}
```

### 階段 2：步驟元件實作

#### 2.1 基本資訊步驟
```
src/components/superadmin/onboarding/steps/BasicInfoStep.tsx
```

功能：
- 組織名稱（必填）
- 聯絡人資訊（姓名、電話、Email）
- 公司規模選擇
- 產業類別
- 時區設定
- 預設語言

驗證規則：
- 組織名稱不可重複
- Email 格式驗證
- 電話號碼格式驗證

#### 2.2 計費方案步驟
```
src/components/superadmin/onboarding/steps/BillingPlanStep.tsx
```

方案選項：
```typescript
interface BillingPlan {
  id: string;
  name: string;
  price: number;
  priceUnit: 'user/month' | 'flat/month' | 'custom';
  features: string[];
  limits: {
    maxUsers?: number;
    aiMinutes?: number;
    storage?: number; // GB
  };
  popular?: boolean;
}

const BILLING_PLANS = [
  {
    id: 'trial',
    name: '試用版',
    price: 0,
    priceUnit: 'user/month',
    features: ['14 天免費試用', '最多 5 個用戶', '基本功能'],
    limits: { maxUsers: 5, aiMinutes: 100, storage: 1 }
  },
  {
    id: 'basic',
    name: '基本版',
    price: 10,
    priceUnit: 'user/month',
    features: ['無限用戶', '標準功能', 'Email 支援'],
    limits: { aiMinutes: 500, storage: 10 }
  },
  {
    id: 'professional',
    name: '專業版',
    price: 25,
    priceUnit: 'user/month',
    features: ['進階功能', '優先支援', 'API 存取'],
    limits: { aiMinutes: 2000, storage: 50 },
    popular: true
  },
  {
    id: 'enterprise',
    name: '企業版',
    price: 0,
    priceUnit: 'custom',
    features: ['客製化功能', '專屬客服', 'SLA 保證'],
    limits: {}
  }
];
```

#### 2.3 用戶匯入步驟（支援 Google 登入）
```
src/components/superadmin/onboarding/steps/UserImportStep.tsx
```

匯入方式：
1. **CSV 檔案上傳**
   - 智能欄位映射（使用現有 ImportWizard）
   - 支援自訂欄位
   - 驗證重複 Email

2. **JSON 格式貼上**
   ```json
   [
     {
       "email": "user@example.com",
       "name": "張三",
       "role": "user",
       "department": "業務部"
     }
   ]
   ```

3. **Google Workspace 整合**
   - OAuth 授權連接
   - 選擇 Google Groups 或 OU
   - 自動同步用戶資料
   - 映射 Google 角色到系統角色

4. **手動輸入**
   - 表單逐一新增
   - 即時驗證

密碼處理策略：
```typescript
interface PasswordStrategy {
  type: 'auto-generate' | 'same-for-all' | 'google-auth' | 'send-reset-link';
  value?: string; // 僅當 type 為 'same-for-all' 時使用
  sendEmail: boolean;
}
```

Google 登入整合：
```typescript
interface GoogleAuthConfig {
  enabled: boolean;
  domain?: string; // 限制特定網域
  autoCreateUsers: boolean; // 首次登入自動建立用戶
  roleMapping: {
    googleGroup: string;
    systemRole: string;
  }[];
}
```

#### 2.4 資料遷移步驟
```
src/components/superadmin/onboarding/steps/DataMigrationStep.tsx
```

支援匯入：
- 客戶資料
- 銷售記錄
- 任務清單
- 歷史會議記錄

使用既有的 ImportWizard 元件，但預設選擇對應的資料類型。

#### 2.5 歡迎設定步驟
```
src/components/superadmin/onboarding/steps/WelcomeSetupStep.tsx
```

功能：
- 預覽歡迎郵件內容
- 自訂歡迎訊息
- 設定首次登入引導
- 排程發送時間
- 選擇通知管道（Email/SMS/In-App）

### 階段 3：進度追蹤與持久化

#### 3.1 進度儲存服務
```
src/services/firebase/onboardingService.ts
```

```typescript
interface OnboardingSession {
  id: string;
  organizationId: string;
  startedAt: Timestamp;
  startedBy: string; // SuperAdmin ID
  currentStep: number;
  completedSteps: string[];
  stepData: Record<string, any>;
  status: 'in_progress' | 'completed' | 'abandoned';
  completedAt?: Timestamp;
  
  // 追蹤重要動作
  actions: OnboardingAction[];
}

interface OnboardingAction {
  timestamp: Timestamp;
  action: string;
  details?: any;
  performedBy: string;
}

// 自動儲存進度
async function saveOnboardingProgress(
  sessionId: string,
  updates: Partial<OnboardingSession>
): Promise<void> {
  const sessionRef = doc(db, 'onboardingSessions', sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    lastUpdated: serverTimestamp()
  });
}

// 恢復未完成的入職
async function getInProgressSessions(
  superAdminId: string
): Promise<OnboardingSession[]> {
  const q = query(
    collection(db, 'onboardingSessions'),
    where('startedBy', '==', superAdminId),
    where('status', '==', 'in_progress'),
    orderBy('startedAt', 'desc')
  );
  // ...
}
```

### 階段 4：驗證與錯誤處理

#### 4.1 步驟驗證
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

interface ValidationWarning {
  field: string;
  message: string;
  canProceed: boolean;
}

// 驗證範例：用戶匯入
async function validateUserImport(data: UserImportData): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // 檢查重複 Email
  const emails = data.users.map(u => u.email);
  const duplicates = await checkDuplicateEmails(emails, data.organizationId);
  
  if (duplicates.length > 0) {
    errors.push({
      field: 'users',
      message: `發現 ${duplicates.length} 個重複的 Email`,
      severity: 'error'
    });
  }
  
  // 檢查 Google 網域設定
  if (data.googleAuthConfig?.enabled && !data.googleAuthConfig.domain) {
    warnings.push({
      field: 'googleAuthConfig',
      message: '未設定 Google 網域限制，所有 Google 用戶都可登入',
      canProceed: true
    });
  }
  
  // 檢查密碼策略
  if (data.passwordStrategy.type === 'same-for-all' && 
      data.passwordStrategy.value.length < 8) {
    errors.push({
      field: 'passwordStrategy',
      message: '密碼長度至少需要 8 個字元',
      severity: 'error'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
```

#### 4.2 錯誤恢復機制
```typescript
// 批次操作的事務處理
async function executeOnboardingTransaction(
  steps: OnboardingStepData
): Promise<TransactionResult> {
  const batch = writeBatch(db);
  const rollbackActions: RollbackAction[] = [];
  
  try {
    // 1. 建立組織
    const orgResult = await createOrganization(steps.basicInfo);
    rollbackActions.push({
      action: 'deleteOrganization',
      data: { organizationId: orgResult.id }
    });
    
    // 2. 設定計費
    await setupBilling(orgResult.id, steps.billingPlan);
    rollbackActions.push({
      action: 'cancelBilling',
      data: { organizationId: orgResult.id }
    });
    
    // 3. 批量建立用戶
    const userResults = await batchCreateUsers(
      orgResult.id,
      steps.userImport
    );
    
    // 4. 匯入資料
    if (steps.dataMigration) {
      await importLegacyData(orgResult.id, steps.dataMigration);
    }
    
    // 5. 發送歡迎郵件
    if (steps.welcomeSetup) {
      await scheduleWelcomeEmails(orgResult.id, userResults, steps.welcomeSetup);
    }
    
    await batch.commit();
    return { success: true, organizationId: orgResult.id };
    
  } catch (error) {
    // 執行回滾
    for (const action of rollbackActions.reverse()) {
      await executeRollback(action);
    }
    throw error;
  }
}
```

### 階段 5：UI/UX 設計

#### 5.1 精靈介面設計
```
+----------------------------------------------------------+
| 建立新組織                                          [X] |
+----------------------------------------------------------+
| [====== 60% ======]  步驟 3/5                           |
|                                                          |
| (1) ✓  (2) ✓  (3) •  (4) ○  (5) ○                      |
| 基本資訊  計費   用戶   資料   完成                       |
+----------------------------------------------------------+
|                                                          |
| 📥 匯入用戶                                             |
|                                                          |
| 選擇匯入方式：                                           |
| ┌─────────────────┐ ┌─────────────────┐                |
| │  📄 CSV 檔案    │ │  { } JSON 格式   │                |
| │   拖放或選擇     │ │   貼上 JSON      │                |
| └─────────────────┘ └─────────────────┘                |
| ┌─────────────────┐ ┌─────────────────┐                |
| │  🔷 Google      │ │  ✏️ 手動輸入    │                |
| │   Workspace     │ │   逐一新增       │                |
| └─────────────────┘ └─────────────────┘                |
|                                                          |
| ☑️ 啟用 Google 登入                                      |
| └─ 網域限制: [@example.com        ]                      |
| └─ 首次登入自動建立用戶                                  |
|                                                          |
| 密碼設定：                                               |
| ○ 自動產生隨機密碼                                       |
| ● 所有用戶使用相同密碼 [••••••••]                        |
| ○ 使用 Google 登入（不設密碼）                           |
| ○ 發送密碼重設連結                                       |
|                                                          |
| ☑️ 發送歡迎郵件給新用戶                                  |
|                                                          |
+----------------------------------------------------------+
| [上一步]                    [跳過此步驟] [下一步 →]      |
+----------------------------------------------------------+
```

#### 5.2 進度指示器設計
```typescript
// 視覺化進度元件
const ProgressIndicator: React.FC<{
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: Set<string>;
}> = ({ steps, currentStep, completedSteps }) => {
  return (
    <View style={styles.progressContainer}>
      {/* 進度條 */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill,
            { width: `${(currentStep / steps.length) * 100}%` }
          ]}
        />
      </View>
      
      {/* 步驟圓圈 */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              completedSteps.has(step.id) && styles.stepCompleted,
              index === currentStep && styles.stepCurrent
            ]}>
              {completedSteps.has(step.id) ? (
                <Icon name="checkmark" />
              ) : (
                <Text>{index + 1}</Text>
              )}
            </View>
            <Text style={styles.stepLabel}>{step.title}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
```

### 階段 6：整合與測試

#### 6.1 整合到組織管理中心
```typescript
// 在 OrganizationCenter.tsx 中加入
const handleCreateOrganization = () => {
  navigation.navigate('OnboardingWizard', {
    mode: 'create',
    onComplete: (organizationId) => {
      // 重新載入組織列表
      loadOrganizations();
      // 導航到新組織詳情
      navigation.navigate('OrganizationDetail', { organizationId });
    }
  });
};

// 未完成入職的提示
const IncompleteOnboardingBanner = ({ session }) => (
  <TouchableOpacity
    style={styles.incompleteBanner}
    onPress={() => resumeOnboarding(session.id)}
  >
    <Icon name="warning" color="orange" />
    <Text>
      您有未完成的組織設置：{session.organizationName}
      （完成度 {session.progress}%）
    </Text>
    <Text style={styles.resumeLink}>點擊繼續</Text>
  </TouchableOpacity>
);
```

#### 6.2 測試案例
```typescript
describe('OnboardingWizard', () => {
  test('應該驗證組織名稱唯一性', async () => {
    // ...
  });
  
  test('應該正確處理 CSV 用戶匯入', async () => {
    // ...
  });
  
  test('應該支援 Google OAuth 設定', async () => {
    // ...
  });
  
  test('應該在失敗時正確回滾', async () => {
    // ...
  });
  
  test('應該能夠恢復中斷的入職流程', async () => {
    // ...
  });
});
```

## 實作步驟

### 第一天：基礎架構
1. 建立精靈主元件和狀態管理
2. 實作步驟導航邏輯
3. 建立進度持久化服務

### 第二天：步驟元件（Part 1）
1. 實作基本資訊步驟
2. 實作計費方案步驟
3. 加入驗證邏輯

### 第三天：步驟元件（Part 2）
1. 實作用戶匯入步驟（包含 Google 整合）
2. 處理密碼策略
3. 實作批量用戶建立

### 第四天：完成與整合
1. 實作資料遷移步驟
2. 實作歡迎設定步驟
3. 整合到組織管理中心

### 第五天：測試與優化
1. 端到端測試
2. 錯誤處理測試
3. 效能優化
4. UI/UX 調整

## 成功指標

1. **功能完整性**
   - [ ] 5 個步驟全部實作完成
   - [ ] Google 登入整合正常運作
   - [ ] 進度能夠持久化和恢復
   - [ ] 錯誤能夠正確回滾

2. **使用體驗**
   - [ ] 完成整個流程不超過 10 分鐘
   - [ ] 每個步驟都有清晰的說明和驗證
   - [ ] 能夠跳過非必要步驟
   - [ ] 進度指示清晰

3. **資料品質**
   - [ ] 用戶資料完整且正確
   - [ ] 無重複用戶
   - [ ] 密碼策略正確執行
   - [ ] 歡迎郵件成功發送

## 驗證方式

```bash
# 單元測試
npm run test:onboarding

# 整合測試
npm run test:integration:onboarding

# E2E 測試
npm run e2e:onboarding-wizard
```

## 風險與緩解

1. **Google OAuth 整合複雜度**
   - 風險：設定和維護 OAuth 可能複雜
   - 緩解：提供詳細的設定指南和錯誤提示

2. **大量用戶匯入效能**
   - 風險：一次匯入數千用戶可能造成逾時
   - 緩解：實作批次處理和背景任務

3. **資料一致性**
   - 風險：部分步驟失敗可能造成資料不一致
   - 緩解：使用事務和完整的回滾機制

## 相關文件

- PRP-03: SuperAdmin 組織管理中心
- 現有程式碼：
  - `/src/components/import/ImportWizard.tsx` - 可重用的匯入邏輯
  - `/src/services/firebase/organizations.ts` - 組織服務
  - `/src/services/firebase/admin/dataImportService.ts` - 資料匯入服務

## 後續 PRP

完成此 PRP 後，建議進行：
1. PRP-05: 批量資料匯入與智能映射增強
2. PRP-06: 組織健康度監控儀表板

---

**優先級**: 高
**預估時間**: 5 天
**依賴項**: PRP-03 (組織管理中心基礎架構)
**實作信心度**: 9/10