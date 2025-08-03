# Firebase 成本優化實施計畫

## 🎯 優化目標：降低 50% 以上的 Firebase 成本

## 📋 立即可執行的優化項目

### 1. Functions 記憶體優化（預計節省 30-40%）

修改 `/functions/src/index.ts`:
```typescript
// 原本的配置
setGlobalOptions({
  maxInstances: 10,
  region: "asia-east1",
  memory: "1GiB",        // ❌ 過高
  timeoutSeconds: 300,
  minInstances: 0
});

// 優化後的配置
setGlobalOptions({
  maxInstances: 5,       // ✅ 降低最大實例數
  region: "asia-east1",
  memory: "512MB",       // ✅ 降低記憶體使用
  timeoutSeconds: 120,   // ✅ 降低逾時時間
  minInstances: 0
});
```

針對不同函數設定不同配置：
```typescript
// 音訊處理需要較多資源
export const processAudioFile = onObjectFinalized({
  memory: "1GiB",      // 保持較高記憶體
  timeoutSeconds: 300
}, async (event) => {
  // ...
});

// AI 處理可以降低資源
export const analyzeCustomerState = onCall({
  memory: "256MB",     // ✅ 使用更少記憶體
  timeoutSeconds: 60   // ✅ 縮短逾時
}, async (request) => {
  // ...
});
```

### 2. 停用不必要的 Functions（預計節省 20%）

暫時註解掉不常用的功能：
```typescript
// 註解掉行事曆同步（似乎未在使用）
// export { scheduledCalendarSync, triggerCalendarSync } from "./calendar-sync-scheduler";

// 如果 RolePlay 功能不常用，也可以暫時停用
// export {
//   analyzeCustomerState,
//   generateCustomerResponse,
//   processRolePlayDialogue,
//   getCoachAdvice
// } from "./roleplay";
```

### 3. Storage 生命週期規則（預計節省 10-15%）

建立 `storage-lifecycle.json`:
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["audio-files/"]
        }
      },
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 7,
          "matchesPrefix": ["temp/"]
        }
      }
    ]
  }
}
```

執行命令套用規則：
```bash
gsutil lifecycle set storage-lifecycle.json gs://donnaai-5e601.firebasestorage.app
```

### 4. Firestore 優化（預計節省 15-20%）

#### 4.1 減少即時監聽器
檢查並優化程式碼中的監聽器：
```typescript
// ❌ 避免過多監聽器
const unsubscribe1 = onSnapshot(collection(db, 'customers'), ...);
const unsubscribe2 = onSnapshot(collection(db, 'tasks'), ...);
const unsubscribe3 = onSnapshot(collection(db, 'records'), ...);

// ✅ 使用單一監聽器搭配本地狀態管理
const unsubscribe = onSnapshot(
  query(collection(db, 'updates'), where('timestamp', '>', lastSync)),
  (snapshot) => {
    // 更新本地狀態
  }
);
```

#### 4.2 批次操作
```typescript
// ❌ 避免多次單獨寫入
await setDoc(doc(db, 'users', userId), userData);
await setDoc(doc(db, 'profiles', userId), profileData);
await setDoc(doc(db, 'settings', userId), settingsData);

// ✅ 使用批次寫入
const batch = writeBatch(db);
batch.set(doc(db, 'users', userId), userData);
batch.set(doc(db, 'profiles', userId), profileData);
batch.set(doc(db, 'settings', userId), settingsData);
await batch.commit();
```

### 5. 快取策略（預計節省 10%）

實施客戶端快取：
```typescript
// 在 Firebase 配置中啟用離線持久化
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // 多個標籤頁開啟
  } else if (err.code == 'unimplemented') {
    // 瀏覽器不支援
  }
});
```

## 📊 成本監控設定

### 1. 設定 GCP 預算警報
```bash
# 使用 gcloud CLI 設定預算
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="DonnaAI Monthly Budget" \
  --budget-amount=100 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90
```

### 2. 建立成本監控 Dashboard
在 GCP Console 建立自訂儀表板監控：
- Functions 執行次數和持續時間
- Firestore 讀寫操作數
- Storage 使用量和頻寬
- 每日成本趨勢

## 🚀 實施步驟

### 第一階段（立即執行）
1. [ ] 修改 Functions 全域配置（降低記憶體）
2. [ ] 停用不使用的 Functions
3. [ ] 部署更新：`firebase deploy --only functions`

### 第二階段（本週內）
1. [ ] 實施 Storage 生命週期規則
2. [ ] 優化 Firestore 查詢和監聽器
3. [ ] 實施客戶端快取

### 第三階段（持續優化）
1. [ ] 監控成本變化
2. [ ] 根據使用模式調整配置
3. [ ] 考慮架構優化（如使用 Cloud Run 替代某些 Functions）

## ⚠️ 注意事項

1. **測試優化影響**：降低記憶體可能影響效能，需要測試
2. **備份重要資料**：實施 Storage 生命週期前確保重要檔案已備份
3. **監控錯誤率**：優化後密切監控錯誤率是否上升
4. **用戶體驗**：確保優化不影響用戶體驗

## 📈 預期成果

實施以上優化後，預計可以：
- 降低 50-60% 的 Functions 成本
- 降低 20-30% 的 Storage 成本
- 降低 15-20% 的 Firestore 成本
- **總體降低 40-50% 的 Firebase 成本**

## 🔄 後續追蹤

1. 每週檢查成本報告
2. 根據實際使用調整配置
3. 持續優化程式碼效能
4. 考慮長期架構改進