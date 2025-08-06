# PRP-78: 統一權限系統完整重構

## 概述
建立一個完整、一致、可靠的權限管理系統，徹底解決所有權限相關問題。

## 當前問題分析

### 1. 權限檢查不一致
- 多個地方使用不同的檢查方式（`role === 'super_admin'` vs `isSuperAdmin === true`）
- 沒有單一真實來源
- Super Admin 有多個名稱（'super_admin', 'system-admin'）

### 2. 權限初始化問題
- 登入時權限不會自動修復
- 建立用戶時權限設定不完整
- Super Admin 權限經常遺失

### 3. 認證狀態管理
- 建立用戶會影響當前登入狀態
- Cloud Functions 調用不穩定
- 權限資料與 Auth 狀態不同步

## 解決方案架構

### 1. 權限層級定義
```typescript
// 統一的權限層級（從高到低）
enum PermissionLevel {
  SUPER_ADMIN = 'super_admin',    // 平台超級管理員
  ORG_ADMIN = 'org_admin',        // 組織管理員
  TEAM_MANAGER = 'team_manager',  // 團隊主管
  TEAM_MEMBER = 'team_member'     // 團隊成員
}
```

### 2. 權限架構
```
┌─────────────────────────────────────┐
│      Permission Controller          │ <- 中央權限控制器
├─────────────────────────────────────┤
│  - checkPermission()               │
│  - ensurePermissions()             │
│  - repairPermissions()             │
│  - grantPermission()               │
└─────────────────────────────────────┘
           ↓            ↓
    ┌──────────┐  ┌──────────┐
    │  useAuth │  │Firestore │
    │   Hook   │  │  Rules   │
    └──────────┘  └──────────┘
```

## 實作計劃

### Phase 1: 建立統一權限服務

#### 1.1 建立權限常數檔案
**檔案**: `/src/constants/permissions.ts`
```typescript
// 統一的 Super Admin emails
export const SUPER_ADMIN_EMAILS = [
  'admin@donnaai-app.com',
  'admin@donnaai.com',
  'skyler@donnaai.com'
];

// 權限層級
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin',
  TEAM_MANAGER = 'team_manager',
  TEAM_MEMBER = 'team_member'
}

// 平台權限
export const PLATFORM_PERMISSIONS = {
  MANAGE_ORGANIZATIONS: 'manage_organizations',
  MANAGE_ALL_USERS: 'manage_all_users',
  VIEW_ALL_ANALYTICS: 'view_all_analytics',
  MANAGE_BILLING: 'manage_billing',
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
  PLATFORM_SETTINGS: 'platform_settings'
};

// 組織權限
export const ORG_PERMISSIONS = {
  MANAGE_USERS: 'manage_users',
  MANAGE_TEAMS: 'manage_teams',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
  EXPORT_DATA: 'export_data'
};
```

#### 1.2 建立中央權限服務
**檔案**: `/src/services/permissions/PermissionService.ts`
```typescript
class PermissionService {
  private static instance: PermissionService;
  
  // 單例模式
  static getInstance() {
    if (!this.instance) {
      this.instance = new PermissionService();
    }
    return this.instance;
  }

  // 檢查權限
  async checkPermission(userId: string, permission: string): Promise<boolean>
  
  // 確保權限正確（登入時自動執行）
  async ensurePermissions(user: FirebaseUser): Promise<void>
  
  // 修復權限
  async repairPermissions(userId: string): Promise<boolean>
  
  // 授予權限
  async grantPermission(userId: string, permission: string): Promise<void>
  
  // 撤銷權限
  async revokePermission(userId: string, permission: string): Promise<void>
  
  // 獲取用戶所有權限
  async getUserPermissions(userId: string): Promise<string[]>
  
  // 檢查是否為 Super Admin
  isSuperAdminEmail(email: string): boolean
  
  // 初始化 Super Admin 權限
  async initializeSuperAdmin(user: FirebaseUser): Promise<void>
}
```

### Phase 2: 整合到認證流程

#### 2.1 更新 useAuth Hook
**檔案**: `/src/hooks/useAuth.ts`
```typescript
// 在 onAuthStateChanged 和 signIn 時自動執行
const handleAuthStateChange = async (user: FirebaseUser | null) => {
  if (user) {
    // 1. 自動修復權限
    await PermissionService.getInstance().ensurePermissions(user);
    
    // 2. 獲取完整的用戶資料
    const userData = await fetchUserProfile(user.uid);
    
    // 3. 驗證權限完整性
    const permissions = await PermissionService.getInstance().getUserPermissions(user.uid);
    
    setUserProfile({
      ...userData,
      permissions,
      isAuthenticated: true
    });
  }
};
```

#### 2.2 建立權限 Hook
**檔案**: `/src/hooks/usePermissions.ts`
```typescript
export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 權限檢查函數
  const hasPermission = useCallback((permission: string) => {
    return permissions.includes(permission);
  }, [permissions]);
  
  // 是否為 Super Admin
  const isSuperAdmin = useMemo(() => {
    return hasPermission(PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS);
  }, [permissions]);
  
  // 是否為組織管理員
  const isOrgAdmin = useMemo(() => {
    return hasPermission(ORG_PERMISSIONS.MANAGE_USERS);
  }, [permissions]);
  
  return {
    permissions,
    hasPermission,
    isSuperAdmin,
    isOrgAdmin,
    loading
  };
}
```

### Phase 3: 修復用戶建立流程

#### 3.1 安全的用戶建立服務
**檔案**: `/src/services/users/UserCreationService.ts`
```typescript
class UserCreationService {
  // 建立用戶（不影響當前登入狀態）
  async createUser(userData: CreateUserData): Promise<string> {
    // 1. 記錄當前登入狀態
    const currentUser = getAuth().currentUser;
    const currentUserId = currentUser?.uid;
    
    // 2. 呼叫 Cloud Function 建立用戶
    const result = await this.callCreateUserFunction(userData);
    
    // 3. 驗證登入狀態沒有改變
    const afterUser = getAuth().currentUser;
    if (afterUser?.uid !== currentUserId) {
      console.error('Login state changed unexpectedly!');
      // 恢復原始登入狀態
      await this.restoreLoginState(currentUser);
    }
    
    return result.uid;
  }
  
  // 批量建立用戶
  async createUsers(users: CreateUserData[]): Promise<CreateUserResult[]> {
    // 使用 Cloud Function 批量建立
    // 絕不在前端使用 createUserWithEmailAndPassword
  }
}
```

### Phase 4: 資料庫層級實作

#### 4.1 更新 Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 統一的 Super Admin 檢查
    function isSuperAdmin() {
      return request.auth != null && (
        request.auth.token.email in [
          'admin@donnaai-app.com',
          'admin@donnaai.com',
          'skyler@donnaai.com'
        ] ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin'
      );
    }
    
    // 權限文檔
    match /permissions/{userId} {
      allow read: if request.auth.uid == userId || isSuperAdmin();
      allow write: if isSuperAdmin();
    }
  }
}
```

#### 4.2 建立權限審計集合
```typescript
// Firestore 結構
interface PermissionAudit {
  userId: string;
  action: 'grant' | 'revoke' | 'repair';
  permission: string;
  performedBy: string;
  timestamp: Timestamp;
  reason?: string;
}
```

### Phase 5: UI 整合

#### 5.1 權限檢查元件
**檔案**: `/src/components/auth/PermissionGate.tsx`
```typescript
interface PermissionGateProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback, children }: PermissionGateProps) {
  const { hasPermission } = usePermissions();
  
  const isAllowed = Array.isArray(permission) 
    ? permission.some(p => hasPermission(p))
    : hasPermission(permission);
  
  if (!isAllowed) {
    return fallback || <UnauthorizedMessage />;
  }
  
  return <>{children}</>;
}
```

#### 5.2 使用範例
```tsx
// 在元件中使用
<PermissionGate permission={PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS}>
  <AdminPanel />
</PermissionGate>

// 在路由中使用
<Route 
  path="/admin" 
  element={
    <PermissionGate permission={ORG_PERMISSIONS.MANAGE_USERS}>
      <AdminDashboard />
    </PermissionGate>
  }
/>
```

### Phase 6: 緊急修復工具

#### 6.1 瀏覽器 Console 修復工具
**檔案**: `/src/utils/emergency-permission-fix.ts`
```typescript
// 可在瀏覽器 Console 執行的緊急修復
window.emergencyPermissionFix = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('No user logged in');
    return;
  }
  
  console.log('🔧 Starting emergency permission fix...');
  
  // 直接寫入 Firestore
  const db = getFirestore();
  const userRef = doc(db, 'users', user.uid);
  
  await setDoc(userRef, {
    role: 'super_admin',
    isSuperAdmin: true,
    platformPermissions: Object.values(PLATFORM_PERMISSIONS),
    updatedAt: serverTimestamp()
  }, { merge: true });
  
  console.log('✅ Permissions fixed! Please refresh the page.');
};
```

## 實作步驟順序

1. **Day 1: 基礎架構**
   - [ ] 建立 `/src/constants/permissions.ts`
   - [ ] 建立 `/src/services/permissions/PermissionService.ts`
   - [ ] 建立單元測試

2. **Day 2: 認證整合**
   - [ ] 更新 `/src/hooks/useAuth.ts`
   - [ ] 建立 `/src/hooks/usePermissions.ts`
   - [ ] 更新所有使用 `useAuth` 的元件

3. **Day 3: 用戶建立修復**
   - [ ] 建立 `/src/services/users/UserCreationService.ts`
   - [ ] 更新所有用戶建立流程
   - [ ] 測試導入功能不影響登入狀態

4. **Day 4: UI 整合**
   - [ ] 建立 `PermissionGate` 元件
   - [ ] 更新所有需要權限檢查的頁面
   - [ ] 建立權限管理 UI

5. **Day 5: 測試與部署**
   - [ ] 完整測試所有權限場景
   - [ ] 更新 Firestore Rules
   - [ ] 部署到 staging 環境

## 驗證檢查點

### 自動化測試
```bash
# 單元測試
npm test -- --coverage src/services/permissions
npm test -- --coverage src/hooks/usePermissions

# E2E 測試
npm run test:e2e -- --spec permissions.spec.ts
```

### 手動測試清單
- [ ] Super Admin 登入後自動獲得所有權限
- [ ] 導入用戶不會影響當前登入狀態
- [ ] 權限變更立即生效
- [ ] 重新整理頁面後權限保持
- [ ] 不同角色看到正確的 UI

## 成功指標

1. **零權限遺失**：Super Admin 永遠不會失去權限
2. **一致性**：所有地方使用相同的權限檢查邏輯
3. **可靠性**：用戶建立不影響當前登入狀態
4. **可維護性**：單一真實來源，易於擴展
5. **可審計性**：所有權限變更都有記錄

## 注意事項

1. **向後相容**：保持與現有資料結構相容
2. **效能考量**：權限檢查需要快取機制
3. **安全性**：敏感操作需要二次確認
4. **錯誤處理**：完整的錯誤訊息和復原機制

## 參考資源

- [Firebase Auth Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Permission Management](https://www.patterns.dev/posts/render-props-pattern/)

## 信心評分：9/10

此 PRP 提供了完整的權限系統重構方案，包含所有必要的實作細節和測試策略。唯一的不確定性是現有系統的複雜度可能需要額外的適配工作。