/**
 * 組織入職精靈類型定義
 * Organization Onboarding Wizard Type Definitions
 */

import { Timestamp } from 'firebase/firestore';
import { Organization } from './entities/organization';

// 精靈步驟定義
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
  validation: () => Promise<ValidationResult>;
  canSkip: boolean;
  dependsOn?: string[];
}

// 步驟元件屬性
export interface StepProps {
  data: any;
  onChange: (data: any) => void;
  onValidate?: () => Promise<ValidationResult>;
  isActive: boolean;
}

// 驗證結果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  canProceed: boolean;
}

// 步驟 1: 基本資訊
export interface BasicInfoData {
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

// 步驟 2: 計費方案
export interface BillingPlanData {
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  seats: number;
  addons: string[];
  paymentMethod?: 'credit_card' | 'invoice' | 'bank_transfer';
  billingEmail?: string;
  notes?: string;
}

export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  priceUnit?: 'user/month' | 'flat/month' | 'custom';
  duration?: string;
  features: string[];
  limits?: {
    maxUsers?: number;
    aiMinutes?: number;
    storage?: number; // GB
  };
  popular?: boolean;
}

// 步驟 3: 用戶匯入
export interface UserImportData {
  importMethod: 'csv' | 'json' | 'google' | 'manual';
  users: UserData[];
  googleAuthConfig?: GoogleAuthConfig;
  passwordStrategy: PasswordStrategy;
  sendWelcomeEmail: boolean;
}

export interface UserData {
  email: string;
  name: string;
  role?: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  externalId?: string;
  authMethod?: 'password' | 'google';
}

export interface GoogleAuthConfig {
  enabled: boolean;
  domain?: string;
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

export interface PasswordStrategy {
  type: 'auto-generate' | 'same-for-all' | 'google-only' | 'send-reset';
  value?: string;
  requireChange: boolean;
}

// 步驟 4: 歡迎設定
export interface WelcomeSetupData {
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

// 入職會話
export interface OnboardingSession {
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

// 精靈狀態
export interface OnboardingWizardState {
  session: OnboardingSession | null;
  isLoading: boolean;
  isSaving: boolean;
  currentStep: number;
  completedSteps: Set<string>;
  validationErrors: Record<string, ValidationError[]>;
  canProceed: boolean;
  canGoBack: boolean;
}

// 精靈屬性
export interface OnboardingWizardProps {
  mode?: 'create' | 'resume';
  sessionId?: string;
  onComplete: (organizationId: string) => void;
  onCancel: () => void;
  onSaveDraft?: (sessionId: string) => void;
}

// 常數定義
export const COMPANY_SIZES = [
  { value: 'small', label: '小型 (1-50人)' },
  { value: 'medium', label: '中型 (51-200人)' },
  { value: 'large', label: '大型 (201-1000人)' },
  { value: 'enterprise', label: '企業 (1000+人)' }
];

export const INDUSTRIES = [
  { value: 'technology', label: '科技業' },
  { value: 'finance', label: '金融業' },
  { value: 'healthcare', label: '醫療保健' },
  { value: 'retail', label: '零售業' },
  { value: 'manufacturing', label: '製造業' },
  { value: 'education', label: '教育' },
  { value: 'government', label: '政府機構' },
  { value: 'nonprofit', label: '非營利組織' },
  { value: 'other', label: '其他' }
];

export const TIMEZONES = [
  { value: 'Asia/Taipei', label: '台北 (GMT+8)' },
  { value: 'Asia/Shanghai', label: '上海 (GMT+8)' },
  { value: 'Asia/Tokyo', label: '東京 (GMT+9)' },
  { value: 'America/New_York', label: '紐約 (GMT-5)' },
  { value: 'America/Los_Angeles', label: '洛杉磯 (GMT-8)' },
  { value: 'Europe/London', label: '倫敦 (GMT+0)' },
  { value: 'Europe/Paris', label: '巴黎 (GMT+1)' }
];

export const LANGUAGES = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '簡體中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' }
];

export const CURRENCIES = [
  { value: 'TWD', label: 'TWD - 新台幣' },
  { value: 'USD', label: 'USD - 美元' },
  { value: 'CNY', label: 'CNY - 人民幣' },
  { value: 'JPY', label: 'JPY - 日圓' },
  { value: 'EUR', label: 'EUR - 歐元' }
];

// 預設計費方案
export const DEFAULT_BILLING_PLANS: BillingPlan[] = [
  {
    id: 'trial',
    name: '試用版',
    price: 0,
    duration: '14 天',
    features: [
      '最多 5 個用戶',
      '基本功能',
      '社群支援',
      '100 AI 分鐘'
    ],
    limits: {
      maxUsers: 5,
      aiMinutes: 100,
      storage: 1
    }
  },
  {
    id: 'basic',
    name: '基本版',
    price: 10,
    priceUnit: 'user/month',
    features: [
      '無限用戶',
      '標準功能',
      'Email 支援',
      '500 AI 分鐘/月'
    ],
    limits: {
      aiMinutes: 500,
      storage: 10
    }
  },
  {
    id: 'professional',
    name: '專業版',
    price: 25,
    priceUnit: 'user/month',
    features: [
      '進階功能',
      '優先支援',
      'API 存取',
      '2000 AI 分鐘/月',
      '自訂報表'
    ],
    limits: {
      aiMinutes: 2000,
      storage: 50
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: '企業版',
    price: 0,
    priceUnit: 'custom',
    features: [
      '客製化功能',
      '專屬客服',
      'SLA 保證',
      '無限 AI 分鐘',
      '進階安全功能'
    ],
    limits: {}
  }
];