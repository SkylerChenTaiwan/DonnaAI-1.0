# PRP-88: 徹底修復用戶批量匯入功能

## Goal
完整修復用戶批量匯入功能，確保能夠透過 CSV 檔案成功批量建立組織用戶，包括：
1. 修復所有程式碼錯誤和 API 不匹配問題
2. 確保新組織和現有組織都能使用批量匯入
3. 建立完整的端到端測試
4. 確保 Web 建置和部署正確

## Why
- **業務關鍵功能失效**：用戶無法批量匯入，嚴重影響組織管理效率
- **多重技術債務**：程式碼中存在未實作的函數引用、API 契約不匹配、Firebase 配置錯誤
- **缺乏測試覆蓋**：之前的開發沒有執行實際測試，導致問題未被發現
- **用戶體驗受損**：功能持續失敗影響產品信譽

## What

### 問題診斷總結
1. **函數不存在**：`importUsersInBatches` 從未在 `userAssistService.ts` 中實作
2. **Firebase 配置錯誤**：雖已修復但尚未部署
3. **API 契約不匹配**：Cloud Function 期望參數與前端發送參數不一致
4. **建置快取問題**：dist-web 包含舊版程式碼

### 修復計劃

#### Phase 1: 清理和重建（30分鐘）
- [ ] 清理所有建置快取
- [ ] 重新建置確保最新程式碼生效
- [ ] 驗證 Firebase 配置正確

#### Phase 2: API 對齊（1小時）
- [ ] 統一 Cloud Function 和前端的 API 契約
- [ ] 實作正確的批量用戶建立邏輯
- [ ] 處理錯誤和重試機制

#### Phase 3: 功能整合（1小時）
- [ ] 確保 UserImportWizard 正確調用服務
- [ ] 確保 EnhancedBulkImportModal 正確調用服務
- [ ] 統一兩個元件的行為

#### Phase 4: 完整測試（2小時）
- [ ] 單元測試：服務層測試
- [ ] 整合測試：端到端流程
- [ ] 手動測試：實際上傳 CSV 並建立用戶
- [ ] 邊界測試：大量資料、重複用戶、錯誤資料

### Success Criteria
- [ ] 能成功上傳 CSV 檔案並解析
- [ ] 能正確映射欄位（email、name、department 等）
- [ ] 能成功批量建立 100+ 用戶
- [ ] 重複用戶能正確處理（跳過或更新）
- [ ] 錯誤能清楚回報並允許修正
- [ ] 建置無錯誤且部署成功
- [ ] 所有測試通過

## All Needed Context

### 錯誤詳情
```javascript
// 錯誤 1: Firebase collection 錯誤
FirebaseError: Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore

// 錯誤 2: 函數不存在
TypeError: (0 , _userAssistService.importUsersInBatches) is not a function
```

### 關鍵檔案清單
```yaml
# 需要修復的核心檔案
- file: src/services/users/UserImportOrchestrator.ts
  issue: 引用不存在的 importUsersInBatches 函數
  fix: 使用 UserCreationService.createUsers 替代

- file: src/services/users/UserCreationService.ts  
  issue: API 參數與 Cloud Function 不匹配
  fix: 對齊參數結構

- file: functions/src/legacy-import.ts
  issue: 期望參數與前端發送不一致
  fix: 更新以接受正確的參數格式

# 需要測試的元件
- file: src/components/users/UserImportWizard.tsx
  why: 主要的用戶匯入介面

- file: src/components/users/EnhancedBulkImportModal.tsx
  why: 舊版匯入介面（需確保相容）

# 測試檔案
- file: src/tests/services/users/UserImportService.test.ts
  action: 執行並確保通過

- file: src/tests/services/users/UserDataValidator.test.ts
  action: 執行並確保通過
```

### API 契約對齊
```typescript
// 當前 Cloud Function 期望（functions/src/legacy-import.ts）
interface CloudFunctionExpects {
  users: Array<{
    email: string;
    name?: string;
    // ... 其他欄位
  }>;
  organizationId: string;
  teamId: string;
  defaultPassword?: string;
}

// 前端發送（src/services/users/UserCreationService.ts）
interface FrontendSends {
  users: Array<{
    email: string;
    password?: string;
    displayName: string;
    customClaims: object;
  }>;
  userData: Array<{
    email: string;
    name: string;
    role: string;
    // ... 其他欄位
  }>;
  options: {
    skipExisting?: boolean;
    updateExisting?: boolean;
    sendWelcomeEmail?: boolean;
  };
}

// 需要統一為
interface UnifiedAPI {
  users: Array<{
    email: string;
    name: string;
    password?: string;
    role?: string;
    department?: string;
    position?: string;
    phoneNumber?: string;
  }>;
  organizationId: string;
  teamId?: string;
  options: {
    skipExisting?: boolean;
    updateExisting?: boolean;
    generatePasswords?: boolean;
    sendWelcomeEmail?: boolean;
  };
}
```

### 測試資料範例
```csv
姓名,電子郵件,部門,職位,電話
張三,zhang.san@example.com,業務部,業務經理,0912345678
李四,li.si@example.com,技術部,工程師,0923456789
王五,wang.wu@example.com,行銷部,行銷專員,0934567890
```

## Implementation Blueprint

### Task Sequence

1. **清理和重建**
   ```bash
   # 清理快取
   rm -rf .expo node_modules/.cache dist-web
   
   # 重新建置
   npm run web:build
   
   # 驗證建置
   grep -r "importUsersInBatches" dist-web/ || echo "舊程式碼已清除"
   ```

2. **修復 UserImportOrchestrator**
   ```typescript
   // 移除錯誤的 import
   // import { importUsersInBatches } from '@/services/firebase/admin/userAssistService';
   
   // 改用正確的服務
   import { UserCreationService } from './UserCreationService';
   
   // 在 createUserBatch 方法中
   const userCreationService = UserCreationService.getInstance();
   const results = await userCreationService.createUsers(
     usersToCreate.map(user => ({
       email: user.email,
       name: user.name,
       password: user.password,
       role: user.role || 'user',
       organizationId: config.organizationId,
       department: user.department,
       position: user.position,
       phoneNumber: user.phoneNumber,
     })),
     {
       skipExisting: config.skipExisting,
       generatePasswords: true,
       updateExisting: config.updateExisting,
     }
   );
   ```

3. **更新 Cloud Function API**
   ```typescript
   // functions/src/legacy-import.ts
   export const createUsersForImport = onCall({
     // ... 配置
   }, async (request) => {
     const { users, organizationId, teamId, options } = request.data;
     
     // 處理新的 API 格式
     const defaultPassword = options?.generatePasswords 
       ? generateSecurePassword() 
       : "DonnaAI2024!";
     
     // 批量建立用戶邏輯...
   });
   ```

4. **更新 UserCreationService**
   ```typescript
   // 確保發送正確的參數
   const response = await createUsersFunction({
     users: preparedUsers,
     organizationId: users[0].organizationId,
     teamId: null, // 可選
     options: {
       skipExisting: options.skipExisting,
       updateExisting: options.updateExisting,
       generatePasswords: options.generatePasswords,
       sendWelcomeEmail: options.sendWelcomeEmail,
     }
   });
   ```

5. **執行測試套件**
   ```bash
   # 執行單元測試
   npm test -- UserImportService
   npm test -- UserDataValidator
   npm test -- UserImportOrchestrator
   
   # 執行整合測試
   npm test -- UserImportWizard
   ```

6. **手動測試流程**
   - 建立新組織 → 選擇批量匯入 → 上傳 CSV → 完成匯入
   - 現有組織 → 組織管理 → 批量匯入 → 上傳 CSV → 完成匯入
   - 測試重複用戶處理
   - 測試大量資料（100+ 筆）
   - 測試錯誤資料處理

### Error Handling Strategy

```typescript
// 錯誤處理層級
try {
  // Level 1: Firebase 配置
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase 未初始化');
  
  // Level 2: 資料驗證
  const validatedUsers = validator.validateBatch(users);
  if (validatedUsers.errors.length > 0) {
    return { 
      success: false, 
      errors: validatedUsers.errors 
    };
  }
  
  // Level 3: API 調用
  const results = await callCloudFunction(validatedUsers);
  
  // Level 4: 結果處理
  return processResults(results);
  
} catch (error) {
  // 詳細錯誤記錄
  console.error('用戶匯入失敗:', {
    error: error.message,
    stack: error.stack,
    context: { organizationId, userCount: users.length }
  });
  
  // 用戶友好錯誤訊息
  return {
    success: false,
    error: getUserFriendlyError(error)
  };
}
```

## Validation Gates

```bash
# 1. 語法和型別檢查
npm run type-check

# 2. 建置檢查
npm run web:build
[ $? -eq 0 ] || exit 1

# 3. 搜尋錯誤程式碼
! grep -r "importUsersInBatches" dist-web/

# 4. 執行測試
npm test -- --testPathPattern="User.*Import|User.*Creation"

# 5. Firebase 模擬器測試
firebase emulators:start --only firestore,functions,auth &
EMULATOR_PID=$!
sleep 10
npm run test:integration
kill $EMULATOR_PID

# 6. 手動測試檢查清單
echo "手動測試檢查清單："
echo "[ ] 新組織批量匯入成功"
echo "[ ] 現有組織批量匯入成功"
echo "[ ] 重複用戶正確處理"
echo "[ ] 錯誤訊息清楚顯示"
echo "[ ] 100+ 用戶批量建立成功"
```

## Risk Assessment

### 高風險項目
1. **Cloud Function 更新**：需要重新部署，可能影響生產環境
   - 緩解：先在測試環境驗證
   
2. **資料遺失**：批量操作可能導致資料覆蓋
   - 緩解：實作事務處理和回滾機制

3. **效能問題**：大量用戶可能導致超時
   - 緩解：分批處理，每批 50-100 筆

### 中風險項目
1. **快取問題**：瀏覽器可能快取舊版 JS
   - 緩解：版本號管理，強制更新

2. **權限問題**：Firebase 規則可能阻擋
   - 緩解：檢查並更新 firestore.rules

## Rollback Plan

如果部署後發現問題：
1. 恢復 Cloud Function 到前一版本
2. 回滾前端程式碼到前一個 commit
3. 清理瀏覽器快取
4. 通知用戶暫時使用單一用戶新增功能

## Documentation Updates

需要更新的文件：
- `/docs/development-checklist.md` - 加入批量匯入測試項目
- `/docs/user-import-guide.md` - 建立用戶匯入操作指南
- `README.md` - 更新功能狀態

## PRP Quality Score: 8/10

**評分理由**：
- ✅ 完整的問題診斷和根因分析
- ✅ 詳細的實作藍圖和程式碼範例
- ✅ 可執行的驗證門檻
- ✅ 風險評估和回滾計劃
- ✅ 清晰的任務順序
- ⚠️ 需要人工測試確認（-1分）
- ⚠️ Cloud Function 部署需要額外注意（-1分）

這個 PRP 應該能夠一次性解決所有用戶匯入問題，並建立可靠的測試防護網。