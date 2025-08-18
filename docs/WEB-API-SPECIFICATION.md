# DonnaAI Web 版 API 設計規格

## 📋 API 架構概述

### 🏗️ 整體架構
```
Next.js Web App
      ↓
Firebase Client SDK (v10)
      ↓
Firebase Services
├── Firestore (資料庫)
├── Auth (認證)
├── Storage (檔案)
└── Functions (API)
```

### 🔐 認證策略
```json
{
  "client_auth": "Firebase Auth (web SDK)",
  "server_auth": "Firebase Admin SDK",
  "token_flow": "Firebase ID Token → Next.js API Routes",
  "middleware": "Next.js middleware 驗證路由權限"
}
```

---

## 📊 資料模型定義

### 👤 User 資料結構
```typescript
interface User {
  uid: string;                    // Firebase Auth UID
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'manager' | 'salesperson';
  organizationId: string;
  teamIds: string[];
  avatar?: string;
  preferences: {
    language: 'zh-TW' | 'en';
    timezone: string;
    notifications: NotificationSettings;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
  isActive: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  reports: boolean;
  mentions: boolean;
}
```

### 🏢 Organization 資料結構
```typescript
interface Organization {
  id: string;
  name: string;
  domain: string;                 // 企業域名
  logo?: string;
  settings: {
    features: FeatureFlags;
    billing: BillingInfo;
    security: SecuritySettings;
  };
  subscription: {
    plan: 'trial' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'suspended';
    seats: number;
    usedSeats: number;
    expiresAt: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

interface FeatureFlags {
  aiAnalysis: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  customFields: boolean;
  bulkImport: boolean;
}
```

### 👥 Team 資料結構
```typescript
interface Team {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  managerId: string;              // 團隊主管
  memberIds: string[];            // 團隊成員
  parentTeamId?: string;          // 上級團隊（樹狀結構）
  settings: {
    permissions: TeamPermissions;
    targets: SalesTargets;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

interface SalesTargets {
  monthly: number;
  quarterly: number;
  yearly: number;
  currency: string;
}
```

### 🤝 Customer 資料結構
```typescript
interface Customer {
  id: string;
  organizationId: string;
  assignedTo: string;             // 負責業務員
  teamId: string;
  
  // 基本資料
  name: string;
  company?: string;
  title?: string;
  industry?: string;
  
  // 聯絡資訊
  email?: string;
  phone?: string;
  address?: Address;
  
  // 業務資訊
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: string;                 // 來源管道
  tags: string[];
  dealSize?: number;
  dealStage?: DealStage;
  priority: 'low' | 'medium' | 'high';
  
  // 自訂欄位
  customFields: Record<string, any>;
  
  // 時間記錄
  lastContactAt?: Timestamp;
  nextFollowUpAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

type DealStage = 'initial' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
```

### 📝 Record 資料結構
```typescript
interface Record {
  id: string;
  organizationId: string;
  customerId: string;
  createdBy: string;              // 記錄建立者
  teamId: string;
  
  // 記錄內容
  type: 'meeting' | 'call' | 'email' | 'note';
  title: string;
  content: string;
  summary?: string;               // AI 生成摘要
  
  // 會議專用
  duration?: number;              // 會議時長（分鐘）
  attendees?: string[];           // 參與者
  audioFileUrl?: string;          // 錄音檔案
  transcription?: string;         // 語音轉文字
  aiAnalysis?: AIAnalysis;        // AI 分析結果
  
  // 標籤和分類
  tags: string[];
  importance: 'low' | 'medium' | 'high';
  
  // 時間記錄
  scheduledAt?: Timestamp;        // 預定時間
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AIAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  keyPoints: string[];
  actionItems: ActionItem[];
  nextSteps: string[];
  customerNeeds: string[];
  concerns: string[];
}

interface ActionItem {
  description: string;
  assignee?: string;
  dueDate?: Timestamp;
  status: 'pending' | 'completed' | 'cancelled';
}
```

### ✅ Task 資料結構
```typescript
interface Task {
  id: string;
  organizationId: string;
  assignedTo: string;
  assignedBy: string;
  teamId: string;
  
  // 任務內容
  title: string;
  description?: string;
  type: 'follow_up' | 'meeting' | 'proposal' | 'admin' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  // 關聯資料
  customerId?: string;            // 關聯客戶
  recordId?: string;              // 關聯記錄
  
  // 時間管理
  dueDate?: Timestamp;
  estimatedHours?: number;
  actualHours?: number;
  completedAt?: Timestamp;
  
  // 標籤
  tags: string[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🔗 API Endpoints

### 🏠 Dashboard APIs

#### GET /api/dashboard/overview
```typescript
// 取得儀表板概況
interface DashboardOverview {
  stats: {
    totalCustomers: number;
    activeDeals: number;
    thisMonthRevenue: number;
    completedTasks: number;
    pendingTasks: number;
  };
  recentActivities: Activity[];
  upcomingTasks: Task[];
  teamPerformance: TeamStats[];
}

interface Activity {
  id: string;
  type: 'customer_added' | 'meeting_completed' | 'deal_closed';
  description: string;
  createdAt: Timestamp;
  userId: string;
  userName: string;
}
```

#### GET /api/dashboard/charts
```typescript
// 取得圖表資料
interface ChartData {
  salesTrend: DataPoint[];
  customerAcquisition: DataPoint[];
  dealPipeline: PipelineData[];
  teamComparison: TeamData[];
}

interface DataPoint {
  date: string;
  value: number;
  label?: string;
}
```

### 📊 Analytics APIs

#### POST /api/analytics/query
```typescript
// AI 自然語言查詢
interface AnalyticsQuery {
  query: string;                  // 自然語言查詢
  context: {
    userId: string;
    organizationId: string;
    teamIds: string[];
    dateRange?: DateRange;
  };
}

interface AnalyticsResponse {
  interpretation: QueryInterpretation;
  chartData: ChartData;
  metadata: {
    generatedAt: Timestamp;
    processingTime: number;
    dataPoints: number;
  };
}

interface QueryInterpretation {
  entities: {
    dataType: 'customers' | 'records' | 'tasks' | 'revenue';
    metrics: string[];
    dimensions: string[];
    filters: Record<string, any>;
    timeRange?: DateRange;
  };
  suggestedChartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  confidence: number;
}
```

#### GET /api/analytics/saved-reports
```typescript
// 取得已儲存報表
interface SavedReport {
  id: string;
  name: string;
  description?: string;
  query: AnalyticsQuery;
  chartConfig: ChartConfig;
  isPublic: boolean;
  createdBy: string;
  createdAt: Timestamp;
  lastViewedAt?: Timestamp;
  viewCount: number;
}
```

### 📝 Database APIs

#### GET /api/database/customers
```typescript
// 取得客戶列表（支援分頁、篩選、排序）
interface CustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  filters?: CustomerFilters;
  sort?: SortConfig;
}

interface CustomerFilters {
  status?: CustomerStatus[];
  assignedTo?: string[];
  teamId?: string[];
  tags?: string[];
  dealStage?: DealStage[];
  dateRange?: DateRange;
  customFields?: Record<string, any>;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface CustomersResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  aggregations?: {
    totalDealSize: number;
    statusCounts: Record<CustomerStatus, number>;
  };
}
```

#### POST /api/database/customers/bulk-import
```typescript
// 批量匯入客戶資料
interface BulkImportRequest {
  data: Partial<Customer>[];
  options: {
    updateExisting: boolean;
    validateOnly: boolean;
    fieldMapping: Record<string, string>;
  };
}

interface BulkImportResponse {
  success: boolean;
  results: {
    created: number;
    updated: number;
    failed: number;
    errors: ImportError[];
  };
  validationReport?: ValidationReport;
}

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: any;
}
```

#### GET /api/database/customers/export
```typescript
// 匯出客戶資料
interface ExportRequest {
  format: 'csv' | 'xlsx' | 'json';
  filters?: CustomerFilters;
  fields?: string[];
  includeCustomFields: boolean;
}

interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  expiresAt: Timestamp;
}
```

### 👥 Personnel APIs

#### GET /api/personnel/org-chart
```typescript
// 取得組織圖資料
interface OrgChartData {
  nodes: OrgNode[];
  edges: OrgEdge[];
  metadata: {
    totalNodes: number;
    maxDepth: number;
    lastUpdated: Timestamp;
  };
}

interface OrgNode {
  id: string;
  userId: string;
  user: PublicUserInfo;
  position: Position;
  level: number;
  parentId?: string;
  childrenIds: string[];
  teamId: string;
  isManager: boolean;
}

interface OrgEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'reports_to' | 'collaborates_with';
}

interface Position {
  x: number;
  y: number;
}
```

#### PUT /api/personnel/org-chart/structure
```typescript
// 更新組織結構
interface StructureUpdate {
  changes: StructureChange[];
  reason?: string;
}

interface StructureChange {
  type: 'move' | 'add' | 'remove';
  userId: string;
  newParentId?: string;
  newTeamId?: string;
  newPosition?: Position;
}
```

#### GET /api/personnel/permissions
```typescript
// 取得權限資料
interface PermissionData {
  roles: Role[];
  permissions: Permission[];
  userRoles: UserRole[];
  inheritance: PermissionInheritance[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  organizationId: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'user_management' | 'system' | 'reports';
  level: 'read' | 'write' | 'admin';
}
```

### 🔧 SuperAdmin APIs

#### GET /api/superadmin/organizations
```typescript
// 取得所有組織列表
interface OrganizationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'trial' | 'suspended';
  plan?: SubscriptionPlan;
}

interface OrganizationsResponse {
  data: Organization[];
  pagination: PaginationInfo;
  stats: {
    totalOrgs: number;
    activeOrgs: number;
    trialOrgs: number;
    totalUsers: number;
    totalRevenue: number;
  };
}
```

#### POST /api/superadmin/organizations
```typescript
// 建立新組織
interface CreateOrganizationRequest {
  name: string;
  domain: string;
  adminUser: {
    name: string;
    email: string;
    tempPassword?: string;
  };
  subscription: {
    plan: SubscriptionPlan;
    seats: number;
  };
  features?: FeatureFlags;
}
```

#### GET /api/superadmin/platform/metrics
```typescript
// 平台使用量統計
interface PlatformMetrics {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  organizations: {
    total: number;
    active: number;
    trial: number;
  };
  usage: {
    storageUsed: number;      // GB
    apiCalls: number;
    aiQueries: number;
  };
  performance: {
    avgResponseTime: number;  // ms
    errorRate: number;        // %
    uptime: number;           // %
  };
  revenue: {
    mrr: number;              // Monthly Recurring Revenue
    arr: number;              // Annual Recurring Revenue
    churn: number;            // %
  };
}
```

### ⚙️ Settings APIs

#### GET /api/settings/organization
```typescript
// 取得組織設定
interface OrganizationSettings {
  general: {
    name: string;
    logo?: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  };
  features: FeatureFlags;
  customFields: CustomFieldDefinition[];
  integrations: Integration[];
  security: SecuritySettings;
  billing: BillingInfo;
}

interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';
  options?: string[];           // for select/multiselect
  required: boolean;
  defaultValue?: any;
  category: 'customer' | 'record' | 'task';
}
```

#### PUT /api/settings/custom-fields
```typescript
// 更新自訂欄位定義
interface UpdateCustomFieldsRequest {
  fields: CustomFieldDefinition[];
  migration?: {
    strategy: 'preserve' | 'clear' | 'convert';
    mappings?: Record<string, string>;
  };
}
```

---

## 🔒 權限控制

### 權限矩陣
```typescript
interface PermissionMatrix {
  'superadmin': {
    all: '*';
  };
  'admin': {
    organization: ['read', 'write'];
    users: ['read', 'write', 'create', 'disable'];
    teams: ['read', 'write', 'create'];
    customers: ['read', 'write', 'create', 'delete'];
    records: ['read', 'write', 'create'];
    tasks: ['read', 'write', 'create', 'assign'];
    reports: ['read', 'write', 'create', 'share'];
    settings: ['read', 'write'];
  };
  'manager': {
    teams: ['read', 'write']; // only own teams
    customers: ['read', 'write', 'create']; // only team customers
    records: ['read', 'write', 'create']; // only team records
    tasks: ['read', 'write', 'create', 'assign']; // only team tasks
    reports: ['read', 'write', 'create', 'share'];
    settings: ['read']; // read-only
  };
  'salesperson': {
    customers: ['read', 'write', 'create']; // only assigned customers
    records: ['read', 'write', 'create']; // only own records
    tasks: ['read', 'write']; // only assigned tasks
    reports: ['read']; // basic reports only
  };
}
```

### 資料過濾規則
```typescript
interface DataFilter {
  'superadmin': {
    scope: 'global';
    filter: null;
  };
  'admin': {
    scope: 'organization';
    filter: { organizationId: user.organizationId };
  };
  'manager': {
    scope: 'team';
    filter: { 
      $or: [
        { teamId: { $in: user.teamIds } },
        { assignedTo: user.uid }
      ]
    };
  };
  'salesperson': {
    scope: 'personal';
    filter: { assignedTo: user.uid };
  };
}
```

---

## 🚀 效能最佳化

### 快取策略
```typescript
interface CacheConfig {
  'dashboard': {
    ttl: 300; // 5 minutes
    strategy: 'stale-while-revalidate';
  };
  'customers': {
    ttl: 60; // 1 minute
    strategy: 'cache-first';
  };
  'analytics': {
    ttl: 1800; // 30 minutes
    strategy: 'cache-first';
  };
  'org-chart': {
    ttl: 3600; // 1 hour
    strategy: 'cache-first';
  };
}
```

### 分頁策略
```typescript
interface PaginationConfig {
  defaultLimit: 50;
  maxLimit: 1000;
  cursorBased: true; // 使用 cursor-based pagination
  
  // 針對大型資料集使用虛擬滾動
  virtualScrolling: {
    enabled: true;
    itemHeight: 60;
    bufferSize: 10;
  };
}
```

### 即時更新
```typescript
interface RealtimeConfig {
  // 使用 Firestore real-time listeners
  subscriptions: {
    'dashboard': ['notifications', 'tasks'];
    'customers': ['customers']; // only for current view
    'org-chart': ['users', 'teams'];
  };
  
  // 批次更新以避免過多重新渲染
  batchUpdates: {
    debounceMs: 100;
    maxBatchSize: 50;
  };
}
```

---

## 🧪 API 測試策略

### 單元測試
```typescript
// API 路由測試
describe('/api/dashboard/overview', () => {
  test('should return dashboard data for authenticated user', async () => {
    const response = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);
      
    expect(response.body).toMatchObject({
      stats: expect.objectContaining({
        totalCustomers: expect.any(Number),
        activeDeals: expect.any(Number),
      }),
      recentActivities: expect.any(Array),
    });
  });
});
```

### 整合測試
```typescript
// Firebase 整合測試
describe('Customer API Integration', () => {
  beforeEach(async () => {
    await setupTestFirebase();
    await seedTestData();
  });
  
  test('should create customer and update in Firestore', async () => {
    const customer = await createCustomer(testCustomerData);
    const firestoreDoc = await getCustomerFromFirestore(customer.id);
    
    expect(firestoreDoc.data()).toMatchObject(testCustomerData);
  });
});
```

---

## 📝 下一步行動

### API 開發順序
1. **Phase 1**: Authentication + Dashboard APIs
2. **Phase 2**: Database APIs (Customers CRUD)
3. **Phase 3**: Analytics APIs (AI Query)
4. **Phase 4**: Personnel APIs (Org Chart)
5. **Phase 5**: SuperAdmin APIs
6. **Phase 6**: Settings APIs

### 開發準備
- ✅ API 規格已定義
- ⏳ 建立 API 原型和測試
- ⏳ 設定 Firebase 整合
- ⏳ 實作權限控制中間件

---

*最後更新：2025-01-18*  
*版本：v1.0*