# 客戶權限錯誤分析報告

**日期**: 2025-01-21
**問題**: 客戶更新時出現權限錯誤

## 🔍 根本原因分析

### 1. Firestore 規則的權限要求（firestore.rules 第 138-144 行）

```javascript
// 更新：指派的負責人或管理員可以更新
allow update: if (isTeamMember(resource.data.teamId) &&
                 (request.auth.uid == resource.data.assignedTo || 
                  isOrgAdmin())) &&
                 request.resource.data.updatedAt == request.time &&
                 // 不允許修改組織和團隊
                 request.resource.data.organizationId == resource.data.organizationId &&
                 request.resource.data.teamId == resource.data.teamId;
```

**更新客戶需要同時滿足以下條件**：
1. 使用者必須是客戶所屬團隊的成員 (`isTeamMember(resource.data.teamId)`)
2. 使用者必須是客戶的負責人 (`assignedTo`) 或組織管理員
3. 必須更新 `updatedAt` 時間戳
4. 不能修改 `organizationId` 和 `teamId`

### 2. 測試資料生成問題

從 `scripts/seed-data/generators/customers.ts` 可以看到：
- 客戶資料的 `assignedTo` 被設為傳入的 `userId`
- `teamId` 和 `organizationId` 也是由外部傳入

**問題核心**：測試資料生成時使用的 `userId`、`teamId` 可能與當前登入使用者不匹配。

### 3. 權限檢查邏輯分析

在 `src/services/firebase/permissions.ts` 的 `canEditCustomer` 函數中：

```typescript
// 檢查是否為客戶負責人
if (customer.assignedTo === userId) {
  return true;
}

// 檢查團隊成員身份
const userData = userDoc.data();
if (userData.teamIds?.includes(customer.teamId)) {
  // 如果是團隊成員但不是負責人，根據 Firestore 規則，仍然無法編輯
  console.log(`使用者 ${userId} 是團隊成員但不是客戶負責人`);
  return false;
}
```

**關鍵發現**：即使使用者是團隊成員，如果不是客戶負責人，仍然無法編輯客戶。

## 🎯 問題根源

1. **測試資料與當前使用者不匹配**
   - 測試資料可能是用不同的使用者 ID 生成的
   - 當前登入使用者不是這些客戶的 `assignedTo`

2. **權限規則設計**
   - Firestore 規則設計為只有「負責人」或「管理員」可以編輯
   - 一般團隊成員即使在同一團隊也無法編輯其他人的客戶

3. **資料一致性問題**
   - 使用者的 `teamIds` 可能與客戶的 `teamId` 不匹配
   - 組織 ID 可能不一致

## 💡 解決方案選項

### 方案 1：調整 Firestore 規則（不建議）
- 允許所有團隊成員編輯團隊內的所有客戶
- **缺點**：降低資料安全性，可能導致意外修改

### 方案 2：修復測試資料（推薦）
- 使用 `fixAllCustomerPermissions()` 函數將所有客戶的 `assignedTo` 設為當前使用者
- 確保 `teamId` 和 `organizationId` 與當前使用者一致
- **優點**：保持原有權限設計，只修復測試資料

### 方案 3：提升使用者權限
- 使用 `makeCurrentUserAdmin()` 將當前使用者設為管理員
- **優點**：快速解決問題，適合開發測試
- **缺點**：繞過了正常的權限檢查

### 方案 4：重新生成測試資料
- 使用當前登入使用者的資訊重新生成所有測試資料
- **優點**：從根本上解決問題
- **缺點**：需要刪除現有資料

## 📋 建議執行步驟

1. **立即修復（開發環境）**：
   ```javascript
   // 在瀏覽器控制台執行
   await checkUserFullPermissions(); // 先檢查當前狀態
   await fixAllCustomerPermissions(); // 修復所有客戶權限
   ```

2. **長期解決方案**：
   - 修改測試資料生成腳本，確保使用當前使用者資訊
   - 在生成測試資料前先獲取或創建測試使用者
   - 確保所有關聯資料（使用者、團隊、客戶）的一致性

3. **驗證修復**：
   - 執行修復後重新整理頁面
   - 嘗試編輯客戶資料
   - 檢查是否還有權限錯誤

## 🔧 預防措施

1. **改進測試資料生成流程**：
   - 在生成腳本中加入使用者驗證
   - 確保所有資料關聯正確

2. **添加資料一致性檢查**：
   - 定期檢查資料完整性
   - 在應用啟動時驗證關鍵資料

3. **改善錯誤提示**：
   - 提供更清晰的權限錯誤訊息
   - 顯示具體缺少哪項權限

## 影響評估

- **資料安全性**：保持現有權限設計，不會降低安全性
- **使用者體驗**：修復後使用者可以正常編輯指派給自己的客戶
- **系統穩定性**：不影響系統核心功能，只修復測試資料