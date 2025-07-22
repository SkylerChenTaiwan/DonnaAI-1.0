# 組織資料結構不一致分析報告

**日期**：2025-07-22  
**問題**：使用者和組織的資料結構不一致導致查詢邏輯錯誤

## 問題描述

`useOrganization.ts` 中的 `fetchUserOrganizations` 函數使用 `where('members', 'array-contains', userId)` 查詢組織，但這與實際的資料結構不符。

## 資料結構分析

### 1. 使用者介面定義 (User Interface)

根據 `/src/types/user.ts`：

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'salesperson' | 'manager' | 'admin';
  organizationId: string;           // 使用者只屬於單一組織
  teamIds?: string[];               // 可屬於多個團隊
  managedTeamIds?: string[];        // 管理的團隊
  // ... 其他欄位
}
```

**關鍵發現**：使用者使用 `organizationId`（單一組織 ID）而非陣列。

### 2. 組織介面定義 (Organization Interface)

有兩個不同的定義：

#### `/src/types/user.ts` 中的定義：
```typescript
export interface Organization {
  id: string;
  name: string;
  subscriptionPlan: 'trial' | 'basic' | 'enterprise';
  aiMinutesQuota: number;
  aiMinutesUsed: number;
  createdAt: Date;
}
```

#### `/src/hooks/useOrganization.ts` 中的定義：
```typescript
export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  ownerId: string;
  settings?: {
    defaultLanguage?: string;
    timezone?: string;
    features?: string[];
  };
}
```

**關鍵發現**：兩個組織介面定義不一致，且都沒有 `members` 欄位。

### 3. Firestore Security Rules 分析

根據 `firestore.rules`：

```javascript
// 檢查使用者是否屬於指定組織
function isOrgMember(orgId) {
  return isAuthenticated() &&
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.organizationId == orgId;
}

// 組織集合規則
match /organizations/{orgId} {
  // 讀取：組織成員可以讀取
  allow read: if isOrgMember(orgId);
}
```

**關鍵發現**：Security Rules 使用使用者的 `organizationId` 來檢查組織成員資格，而非組織的 `members` 陣列。

### 4. 種子資料分析

根據 `/scripts/seed-data/utils/user.ts`：

```typescript
// 組織資料結構
const orgData = {
  id: orgId,
  name: '預設組織',
  subscriptionPlan: 'enterprise',
  aiMinutesQuota: 10000,
  aiMinutesUsed: 0,
  createdAt: getTimestamp(),
  updatedAt: getTimestamp()
};
```

**關鍵發現**：種子資料中的組織也沒有 `members` 欄位。

## 不一致問題總結

1. **主要問題**：`fetchUserOrganizations` 函數查詢不存在的 `members` 欄位
2. **資料模型**：當前設計是使用者擁有 `organizationId`，而非組織擁有 `members` 陣列
3. **介面定義衝突**：存在兩個不同的 Organization 介面定義
4. **查詢邏輯錯誤**：現有查詢永遠不會返回結果，因為組織沒有 `members` 欄位

## 影響範圍

1. 使用者無法看到自己的組織列表
2. 組織切換功能可能無法正常工作
3. 任何依賴組織查詢的功能都會受影響

## 解決方案

### 方案 A：修改查詢邏輯（推薦）

修改 `fetchUserOrganizations` 函數以匹配現有資料結構：

```typescript
const fetchUserOrganizations = async (userId: string): Promise<Organization[]> => {
  try {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      console.log('User not authenticated, skipping organization fetch');
      return [];
    }
    
    const db = getFirebaseDb();
    
    // 首先獲取使用者資料
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('User not found');
      return [];
    }
    
    const userData = userDoc.data();
    const organizationId = userData.organizationId;
    
    if (!organizationId) {
      console.log('User has no organization');
      return [];
    }
    
    // 獲取使用者所屬的組織
    const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
    if (!orgDoc.exists()) {
      console.error('Organization not found');
      return [];
    }
    
    return [{
      id: orgDoc.id,
      ...orgDoc.data()
    } as Organization];
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }
};
```

### 方案 B：修改資料模型

如果需要支援使用者屬於多個組織：

1. 修改 User 介面，將 `organizationId` 改為 `organizationIds: string[]`
2. 更新 Security Rules
3. 修改所有相關的查詢邏輯
4. 進行資料遷移

### 方案 C：在組織中添加 members 欄位

1. 修改 Organization 介面，添加 `members: string[]`
2. 更新種子資料
3. 進行資料遷移，將現有使用者添加到組織的 members 陣列
4. 保持現有查詢邏輯不變

## 建議

基於最小改動原則和當前系統設計，**推薦採用方案 A**。理由如下：

1. 符合現有資料模型（使用者屬於單一組織）
2. 與 Security Rules 一致
3. 不需要資料遷移
4. 改動最小，風險最低

## 後續步驟

1. 統一 Organization 介面定義
2. 修復 `fetchUserOrganizations` 函數
3. 測試組織相關功能
4. 考慮是否需要支援多組織功能（未來需求）