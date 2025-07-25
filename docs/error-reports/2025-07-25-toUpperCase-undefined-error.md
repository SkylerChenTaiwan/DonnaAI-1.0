# TypeError: Cannot read property 'toUpperCase' of undefined

## 問題描述
在 `OrganizationsScreen` 中嘗試呼叫 `item.subscriptionPlan.toUpperCase()` 時發生錯誤，因為 `subscriptionPlan` 為 `undefined`。

## 根本原因
存在兩個不同的 `Organization` 介面定義：

1. **`/src/types/user.ts`** - 包含 `subscriptionPlan` 欄位
   ```typescript
   export interface Organization {
     subscriptionPlan: 'trial' | 'basic' | 'professional' | 'enterprise';
     aiMinutesQuota: number;
     aiMinutesUsed: number;
     // ...
   }
   ```

2. **`/src/hooks/useOrganization.ts`** - 不包含 `subscriptionPlan` 欄位
   ```typescript
   export interface Organization {
     id: string;
     name: string;
     description?: string;
     // 沒有 subscriptionPlan
   }
   ```

實際使用的組織資料來自 `useOrganization` hook，其介面定義缺少必要欄位。

## 解決方案

### 立即修復（已實施）
在 `OrganizationsScreen.tsx` 中加入防禦性程式碼：
```typescript
// 修復前
<Text style={styles.orgPlan}>{item.subscriptionPlan.toUpperCase()}</Text>

// 修復後
<Text style={styles.orgPlan}>{(item.subscriptionPlan || 'basic').toUpperCase()}</Text>
```

同時修復其他可能為 undefined 的欄位：
- `item.maxUsers || 0`
- `item.aiMinutesUsed || 0`
- `item.aiMinutesQuota || 0`

### 長期解決方案
需要統一 Organization 介面定義：
1. 移除 `/src/hooks/useOrganization.ts` 中的重複定義
2. 統一使用 `/src/types/user.ts` 中的 `Organization` 介面
3. 確保 Firebase 資料結構與介面定義一致

## 影響範圍
- OrganizationsScreen 組件
- 任何使用 useOrganization hook 的組件
- Super Admin 的組織管理功能

## 預防措施
1. 避免重複定義相同的介面
2. 使用單一真實來源（Single Source of Truth）原則
3. 在顯示資料前進行空值檢查
4. 考慮使用 TypeScript strict mode 來捕捉此類錯誤