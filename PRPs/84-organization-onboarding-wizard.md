# PRP: 組織入職精靈（Organization Onboarding Wizard）

## 概述
建立專門的組織入職精靈，提供引導式的組織設置流程，專注於新組織的基本設定、計費配置和用戶管理。這是 SuperAdmin Organization Management Center 的核心子功能之一。

## 背景與需求
當 SuperAdmin 談成新客戶後，需要一個標準化的流程來快速設置新組織。此 PRP 專注於組織的初始設置和用戶管理，資料匯入和審計功能將在其他 PRP 中處理。

## 範圍定義
本 PRP 僅包含：
- 組織基本資訊設定
- 計費方案配置
- 用戶批量匯入（含 Google 登入整合）
- 歡迎流程設定

不包含（將在其他 PRP 處理）：
- 業務資料匯入（PRP-85）
- 審計日誌系統（PRP-86）

## 實施計畫

### 階段 1：精靈架構設計

#### 1.1 建立精靈主元件
```
src/components/superadmin/onboarding/OnboardingWizard.tsx
```

精簡的步驟結構：
```typescript
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation: () => Promise<ValidationResult>;
  canSkip: boolean;
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
    id: 'welcome-setup',
    title: '歡迎設定',
    description: '發送歡迎郵件和初始設定',
    component: WelcomeSetupStep,
    validation: validateWelcomeSetup,
    canSkip: true
  }
];
```

### 階段 2：核心步驟實作

#### 2.1 基本資訊步驟
```typescript
interface BasicInfoData {
  organizationName: string;
  contactPerson: {
    name: string;
    email: string;
    phone?: string;
    title?: string;
  };
  companyInfo: {
    size: 'small' | 'medium' | 'large' | 'enterprise';
    industry: string;
    website?: string;
  };
  settings: {
    timezone: string;
    language: string;
    currency: string;
  };
}
```

#### 2.2 計費方案步驟
```typescript
interface BillingPlanData {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  seats: number;
  addons: string[];
  paymentMethod?: 'credit_card' | 'invoice' | 'bank_transfer';
  billingEmail?: string;
  notes?: string;
}

const BILLING_PLANS = [
  {
    id: 'trial',
    name: '試用版',
    price: 0,
    duration: '14 天',
    features: ['最多 5 個用戶', '基本功能', '社群支援']
  },
  {
    id: 'basic',
    name: '基本版',
    price: 10,
    priceUnit: '每用戶/月',
    features: ['無限用戶', '標準功能', 'Email 支援']
  },
  {
    id: 'professional',
    name: '專業版',
    price: 25,
    priceUnit: '每用戶/月',
    features: ['進階功能', '優先支援', 'API 存取'],
    popular: true
  },
  {
    id: 'enterprise',
    name: '企業版',
    priceType: 'custom',
    features: ['客製化功能', '專屬客服', 'SLA 保證']
  }
];
```

#### 2.3 用戶匯入步驟（重點功能）
```typescript
interface UserImportData {
  importMethod: 'csv' | 'json' | 'google' | 'manual';
  users: UserData[];
  googleAuthConfig?: GoogleAuthConfig;
  passwordStrategy: PasswordStrategy;
  sendWelcomeEmail: boolean;
}

interface GoogleAuthConfig {
  enabled: boolean;
  domain?: string; // 限制特定網域
  autoCreateUsers: boolean;
  syncGroups: boolean;
  groupMappings: Array<{
    googleGroup: string;
    systemRole: string;
  }>;
  oauthCredentials?: {
    clientId: string;
    clientSecret: string;
  };
}

interface PasswordStrategy {
  type: 'auto-generate' | 'same-for-all' | 'google-only' | 'send-reset';
  value?: string;
  requireChange: boolean;
}
```

##### Google Workspace 整合功能
```typescript
// Google OAuth 服務
class GoogleWorkspaceService {
  async authenticate(credentials: OAuthCredentials): Promise<AuthResult> {
    // OAuth 2.0 流程
  }
  
  async listUsers(domain: string): Promise<GoogleUser[]> {
    // 使用 Google Admin SDK API
  }
  
  async listGroups(domain: string): Promise<GoogleGroup[]> {
    // 獲取 Google Groups
  }
  
  async syncUsers(
    domain: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    // 同步用戶到系統
  }
}

// 用戶映射邏輯
function mapGoogleUserToSystem(googleUser: GoogleUser): UserData {
  return {
    email: googleUser.primaryEmail,
    name: googleUser.name.fullName,
    role: determineRole(googleUser.orgUnitPath),
    department: googleUser.organizations?.[0]?.department,
    phone: googleUser.phones?.[0]?.value,
    photoUrl: googleUser.thumbnailPhotoUrl,
    externalId: googleUser.id,
    authMethod: 'google'
  };
}
```

#### 2.4 歡迎設定步驟
```typescript
interface WelcomeSetupData {
  emailTemplate: {
    subject: string;
    body: string;
    includeLoginGuide: boolean;
    includeCompanyLogo: boolean;
  };
  firstLoginExperience: {
    showTour: boolean;
    showGettingStarted: boolean;
    defaultDashboard: string;
  };
  scheduledSend?: {
    enabled: boolean;
    sendAt: Date;
  };
}
```

### 階段 3：進度管理

#### 3.1 會話管理
```typescript
interface OnboardingSession {
  id: string;
  organizationId?: string; // 建立後才有
  startedAt: Timestamp;
  startedBy: string;
  currentStep: number;
  completedSteps: string[];
  stepData: {
    basicInfo?: BasicInfoData;
    billingPlan?: BillingPlanData;
    userImport?: UserImportData;
    welcomeSetup?: WelcomeSetupData;
  };
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  completedAt?: Timestamp;
  errorLog?: Array<{
    step: string;
    error: string;
    timestamp: Timestamp;
  }>;
}
```

### 階段 4：UI/UX 設計

#### 4.1 主要介面
```
+----------------------------------------------------------+
| 🏢 建立新組織                                      [儲存草稿] [X] |
+----------------------------------------------------------+
| 步驟 3/4                                                  |
| [===========75%===========]                              |
|                                                          |
| ✅ 基本資訊  ✅ 計費方案  👉 用戶管理  ⭕ 完成設定        |
+----------------------------------------------------------+
|                                                          |
| 📥 用戶管理                                             |
|                                                          |
| 選擇匯入方式：                                           |
| ┌─────────────┬─────────────┬─────────────┬─────────────┐ |
| │ 📄 CSV上傳  │ { } JSON    │ 🔷 Google   │ ✏️ 手動輸入│ |
| │    ✓        │             │  Workspace  │             │ |
| └─────────────┴─────────────┴─────────────┴─────────────┘ |
|                                                          |
| [選擇檔案] customers.csv (50 筆資料)                     |
|                                                          |
| 📊 資料預覽：                                            |
| ┌─────────────────────────────────────────────────────┐ |
| │ Email              姓名      部門      角色          │ |
| │ john@example.com   John Doe  業務部    user         │ |
| │ mary@example.com   Mary Lee  行銷部    user         │ |
| │ ...顯示前 5 筆...                                    │ |
| └─────────────────────────────────────────────────────┘ |
|                                                          |
| ⚙️ Google 登入設定                                       |
| ☑️ 啟用 Google 登入                                      |
| └─ 網域限制: @example.com                               |
| └─ ☑️ 首次登入自動建立用戶                              |
| └─ ☑️ 同步 Google Groups                                |
|                                                          |
| 🔐 密碼設定                                              |
| ◉ 使用 Google 登入（推薦）                              |
| ○ 自動產生並發送密碼                                    |
| ○ 設定統一密碼                                          |
|                                                          |
| ✉️ 歡迎郵件                                              |
| ☑️ 發送歡迎郵件給新用戶                                 |
|                                                          |
+----------------------------------------------------------+
| [← 上一步]            [儲存並稍後繼續]    [下一步 →]     |
+----------------------------------------------------------+
```

### 階段 5：錯誤處理與驗證

#### 5.1 智能驗證
```typescript
// 用戶匯入驗證
async function validateUserImport(data: UserImportData): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Email 重複檢查
  const emails = data.users.map(u => u.email);
  const duplicates = findDuplicates(emails);
  
  if (duplicates.length > 0) {
    errors.push({
      field: 'users',
      message: `發現 ${duplicates.length} 個重複的 Email: ${duplicates.join(', ')}`,
      severity: 'error'
    });
  }
  
  // Google 設定檢查
  if (data.googleAuthConfig?.enabled) {
    if (!data.googleAuthConfig.domain) {
      warnings.push({
        field: 'googleDomain',
        message: '未設定網域限制，所有 Google 用戶都可登入',
        canProceed: true
      });
    }
    
    if (!data.googleAuthConfig.oauthCredentials) {
      errors.push({
        field: 'googleOAuth',
        message: '請設定 Google OAuth 憑證',
        severity: 'critical'
      });
    }
  }
  
  // 密碼策略檢查
  if (data.passwordStrategy.type === 'same-for-all' && 
      (!data.passwordStrategy.value || data.passwordStrategy.value.length < 8)) {
    errors.push({
      field: 'password',
      message: '密碼至少需要 8 個字元',
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

## 實作步驟

### 第一天：基礎架構
1. 建立精靈框架和導航邏輯
2. 實作會話管理和草稿儲存
3. 建立基本 UI 結構

### 第二天：核心步驟
1. 實作基本資訊和計費步驟
2. 建立驗證邏輯
3. 整合現有組織服務

### 第三天：用戶管理（重點）
1. 實作多種匯入方式
2. 整合 Google OAuth
3. 實作批量用戶建立

### 第四天：完成與測試
1. 實作歡迎設定
2. 端到端測試
3. 錯誤處理優化

## 成功指標

1. **功能完整性**
   - [ ] 4 個步驟全部運作正常
   - [ ] Google 登入整合成功
   - [ ] 草稿可儲存和恢復

2. **使用體驗**
   - [ ] 完成流程不超過 5 分鐘
   - [ ] 錯誤提示清晰
   - [ ] 可隨時儲存進度

3. **資料品質**
   - [ ] 用戶資料完整
   - [ ] 無重複用戶
   - [ ] Google 同步正確

## 相關 PRP

- PRP-03: SuperAdmin 組織管理中心（主架構）
- PRP-85: 批量資料匯入與智能映射（資料匯入功能）
- PRP-86: 組織審計日誌系統（審計追蹤）

---

**優先級**: 高
**預估時間**: 4 天
**依賴項**: PRP-03
**實作信心度**: 9/10