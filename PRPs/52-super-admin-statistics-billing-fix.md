name: "修復 Super Admin 統計數據與計費功能"
description: |

## 目標
修復 Super Admin Dashboard 的統計數據顯示，從假資料改為真實資料，並啟用計費功能系統，讓 Super Admin 可以查看平台營運狀況和管理組織計費。

## 為什麼
- Super Admin 需要真實的平台統計數據來監控系統狀況
- 計費功能是商業化必要的核心功能
- 目前的假資料無法反映實際營運情況
- 組織需要明確的計費記錄和使用統計

## 什麼
修復後的功能：
1. Super Admin Dashboard 顯示真實統計數據
2. 啟用組織計費功能
3. 自動計算月度使用量
4. 生成計費記錄和歷史

### 成功標準
- [ ] Super Admin Dashboard 顯示真實的組織數、用戶數、收入統計
- [ ] 計費功能可以正常計算每個組織的月度費用
- [ ] 可以查看和管理組織的計費歷史
- [ ] 統計數據即時更新

## 所需上下文

### 文件與參考
```yaml
# 必讀 - 包含在您的上下文視窗中
- file: src/screens/superadmin/SuperAdminDashboard.tsx
  why: Super Admin 首頁，目前顯示假資料（第43-47行）
  
- file: src/components/organization/BillingManagementSection.tsx
  why: 計費管理元件，目前被停用（第51-53行）
  
- file: src/services/firebase/admin/billingService.ts
  why: 計費服務實作，包含計算月度使用量的函數
  
- file: src/services/firebase/admin/organizationService.ts
  why: 組織管理服務，可獲取組織列表和詳情

- file: src/config/billing.ts
  why: 計費配置，包含價格設定
  
- doc: https://firebase.google.com/docs/firestore/query-data/aggregation-queries
  section: Count aggregation
  critical: 使用 count() 聚合函數來計算文件數量，避免讀取所有文件
```

### 現有程式碼結構
```bash
src/
├── screens/superadmin/
│   └── SuperAdminDashboard.tsx      # Super Admin 首頁（需修改）
├── services/firebase/admin/
│   ├── organizationService.ts       # 組織管理服務
│   ├── billingService.ts           # 計費服務
│   └── statsService.ts             # 新增：統計服務
├── components/organization/
│   └── BillingManagementSection.tsx # 計費管理元件（需啟用）
└── stores/
    └── adminStore.ts               # Admin 狀態管理
```

### 期望的程式碼結構
```bash
src/
├── services/firebase/admin/
│   └── statsService.ts             # 新增：平台統計服務，負責聚合統計
├── hooks/
│   └── useSuperAdminStats.ts      # 新增：Super Admin 統計資料 Hook
└── types/
    └── superadmin.ts               # 新增：Super Admin 相關類型定義
```

### 已知注意事項
```typescript
// 重要：Firestore 聚合查詢限制
// 1. 使用 count() 來計算文件數量，而不是讀取所有文件
// 2. 對於大量資料，考慮使用 Cloud Functions 定期計算並快取結果
// 3. 計費資料涉及金錢，必須確保計算準確性

// 範例：使用 count() 聚合
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
const coll = collection(db, 'organizations');
const q = query(coll, where('status', '==', 'active'));
const snapshot = await getCountFromServer(q);
const count = snapshot.data().count;
```

## 實作藍圖

### 資料模型和結構

建立 Super Admin 統計類型定義：
```typescript
// src/types/superadmin.ts
export interface SuperAdminStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  monthlyRevenue: number;
  growthRate: number;
  lastUpdated: Date;
}

export interface PlatformRevenue {
  period: string; // YYYY-MM
  totalRevenue: number;
  paidOrganizations: number;
  pendingPayments: number;
}
```

### 任務列表

```yaml
Task 1: 建立平台統計服務
CREATE src/services/firebase/admin/statsService.ts:
  - 實作 getTotalOrganizations() - 使用 count() 聚合
  - 實作 getActiveOrganizations() - 計算 status='active' 的組織
  - 實作 getTotalUsers() - 跨所有組織計算用戶總數
  - 實作 calculateMonthlyRevenue() - 計算當月預估收入
  - 實作 getGrowthRate() - 計算月成長率

Task 2: 建立 Super Admin 統計 Hook
CREATE src/hooks/useSuperAdminStats.ts:
  - 整合 statsService 的所有函數
  - 實作即時更新機制
  - 加入載入和錯誤狀態
  - 快取統計結果避免重複查詢

Task 3: 更新 Super Admin Dashboard
MODIFY src/screens/superadmin/SuperAdminDashboard.tsx:
  - 移除硬編碼的假資料（第43-47行）
  - 整合 useSuperAdminStats Hook
  - 顯示真實統計數據
  - 加入載入狀態處理

Task 4: 啟用計費功能
MODIFY src/components/organization/BillingManagementSection.tsx:
  - 啟用 loadBillingData 函數（取消註解第52行）
  - 移除開發中通知（第149-159行）
  - 顯示真實計費摘要（取消註解第161-224行）

Task 5: 實作自動月度計費
CREATE src/services/firebase/admin/monthlyBillingJob.ts:
  - 建立月度計費排程函數
  - 遍歷所有活躍組織
  - 呼叫 calculateMonthlyUsage 計算使用量
  - 呼叫 generateBillingRecord 生成計費記錄

Task 6: 更新 Admin Store
MODIFY src/stores/adminStore.ts:
  - 新增 fetchPlatformStats 動作
  - 新增 platformStats 狀態
  - 整合統計服務函數
```

### 詳細實作偽代碼

```typescript
// Task 1: statsService.ts
export async function getTotalOrganizations(): Promise<number> {
  const db = getFirebaseDb();
  const orgsRef = collection(db, 'organizations');
  const snapshot = await getCountFromServer(orgsRef);
  return snapshot.data().count;
}

export async function getActiveOrganizations(): Promise<number> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, 'organizations'),
    where('status', '==', 'active')
  );
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function getTotalUsers(): Promise<number> {
  const db = getFirebaseDb();
  // 注意：跨組織計算可能需要批次處理
  const usersRef = collection(db, 'users');
  const snapshot = await getCountFromServer(usersRef);
  return snapshot.data().count;
}

export async function calculateMonthlyRevenue(): Promise<number> {
  const db = getFirebaseDb();
  
  // 獲取所有活躍組織
  const orgsQuery = query(
    collection(db, 'organizations'),
    where('status', '==', 'active'),
    where('subscriptionPlan', '==', 'pro')
  );
  
  const orgsSnapshot = await getDocs(orgsQuery);
  let totalRevenue = 0;
  
  // 計算每個組織的月費
  for (const doc of orgsSnapshot.docs) {
    const org = doc.data();
    const activeUsers = org.monthlyUsage?.activeUsers || 0;
    const giftedSeats = org.giftedSeats || 0;
    const billableUsers = Math.max(0, activeUsers - giftedSeats);
    
    const monthlyAmount = calculatePrice(
      activeUsers,
      org.billingCycle || 'monthly',
      giftedSeats
    );
    
    totalRevenue += monthlyAmount;
  }
  
  return totalRevenue;
}

// Task 2: useSuperAdminStats.ts
export function useSuperAdminStats() {
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 平行載入所有統計
      const [
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        monthlyRevenue,
        growthRate
      ] = await Promise.all([
        getTotalOrganizations(),
        getActiveOrganizations(),
        getTotalUsers(),
        calculateMonthlyRevenue(),
        calculateGrowthRate()
      ]);
      
      setStats({
        totalOrganizations,
        activeOrganizations,
        totalUsers,
        monthlyRevenue,
        growthRate,
        lastUpdated: new Date()
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadStats();
    
    // 每5分鐘更新一次
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadStats]);
  
  return { stats, isLoading, error, refresh: loadStats };
}
```

### 整合點
```yaml
資料庫:
  - 新增索引: organizations 的 status 欄位
  - 新增索引: users 的 organizationId 欄位
  - 考慮新增 platform_stats 集合來快取統計結果
  
配置:
  - 新增到: src/config/constants.ts
  - 模式: "STATS_CACHE_DURATION = 5 * 60 * 1000 // 5分鐘"
  
權限:
  - 確保 Super Admin 有權限讀取所有組織和用戶資料
  - 更新 firestore.rules 確保統計查詢權限
```

## 驗證循環

### Level 1: 語法和樣式
```bash
# 執行這些命令 - 修復任何錯誤後再繼續
npm run lint          # 檢查程式碼風格
npm run type-check    # TypeScript 類型檢查

# 預期：沒有錯誤。如果有錯誤，閱讀錯誤並修復。
```

### Level 2: 單元測試
```typescript
// 建立 __tests__/services/statsService.test.ts
describe('Stats Service', () => {
  it('should count total organizations', async () => {
    const count = await getTotalOrganizations();
    expect(count).toBeGreaterThanOrEqual(0);
  });
  
  it('should calculate monthly revenue correctly', async () => {
    // Mock 組織資料
    const mockOrgs = [
      { activeUsers: 10, giftedSeats: 2, billingCycle: 'monthly' },
      { activeUsers: 20, giftedSeats: 5, billingCycle: 'yearly' }
    ];
    
    const revenue = await calculateMonthlyRevenue();
    expect(revenue).toBe(expectedRevenue);
  });
});
```

```bash
# 執行測試
npm test -- __tests__/services/statsService.test.ts
```

### Level 3: 整合測試
```bash
# 1. 登入 Super Admin 帳號
# 2. 檢查 Dashboard 統計數據
# 3. 進入組織詳情頁面
# 4. 檢查計費功能是否正常顯示
# 5. 嘗試生成計費記錄

# 預期結果：
# - 統計數據顯示真實數字
# - 計費功能正常運作
# - 沒有錯誤訊息
```

## 最終驗證檢查清單
- [ ] Super Admin Dashboard 顯示真實統計數據
- [ ] 統計數據每5分鐘自動更新
- [ ] 計費功能正常啟用
- [ ] 可以查看組織的計費歷史
- [ ] 可以生成新的計費記錄
- [ ] 月度收入計算正確
- [ ] 成長率顯示正確
- [ ] 效能良好（使用聚合查詢而非載入所有文件）

---

## 要避免的反模式
- ❌ 不要載入所有文件來計算數量 - 使用 count() 聚合
- ❌ 不要在每次渲染時重新計算統計 - 使用快取
- ❌ 不要忽略計費計算的精確度 - 涉及金錢必須準確
- ❌ 不要硬編碼價格 - 使用 billing config
- ❌ 不要忽略錯誤處理 - 統計查詢可能失敗
- ❌ 不要忽略權限檢查 - 確保只有 Super Admin 可以存取