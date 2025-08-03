# Firebase 計費分析報告

## 專案資訊
- **Firebase 專案 ID**: donnaai-5e601
- **專案網址**: https://donnaai-5e601.firebaseapp.com
- **GCP 專案編號**: 748876929238

## 目前使用的 Firebase 服務

### 1. 🔴 Firebase Functions（雲端函數）- **最高成本項目**
**部署區域**: asia-east1（台灣）
**已部署函數**:
- `processAudioFile` - 音訊檔案處理（記憶體：1GiB，逾時：300秒）
- `extractFieldsFromContent` - 文字欄位擷取
- `aiProcessingAPI` - AI 處理 API
- `scheduledCalendarSync` / `triggerCalendarSync` - 行事曆同步
- `analyzeCustomerState` - 分析客戶狀態（RolePlay）
- `generateCustomerResponse` - 生成客戶回應（RolePlay）
- `processRolePlayDialogue` - 處理 RolePlay 對話
- `getCoachAdvice` - 獲取 AI 教練建議

**成本優化建議**:
- ⚠️ 設定 `minInstances: 0` 避免冷啟動成本
- ⚠️ 目前使用 1GiB 記憶體，可考慮降到 512MB（需測試）
- ⚠️ 考慮將不常用的函數（如行事曆同步）改為手動觸發

### 2. 🟡 Firestore（資料庫）- **中高成本項目**
**使用情況**:
- 儲存所有業務資料（客戶、任務、紀錄等）
- 即時同步功能持續監聽變更

**成本優化建議**:
- ✅ 檢查是否有過多的即時監聽器
- ✅ 考慮使用批次讀寫減少操作次數
- ✅ 檢查索引是否過多

### 3. 🟡 Firebase Storage（儲存空間）- **中等成本項目**
**使用情況**:
- 儲存音訊檔案
- 儲存用戶上傳的檔案

**成本優化建議**:
- ✅ 設定檔案生命週期規則，自動刪除舊檔案
- ✅ 壓縮音訊檔案格式
- ✅ 考慮將處理後的音訊檔案刪除

### 4. 🟢 Firebase Authentication（身份驗證）- **低成本項目**
**使用情況**:
- 用戶登入驗證
- 權限管理

**成本優化建議**:
- ✅ 已經是低成本服務，保持現狀

### 5. 🟢 Firebase Hosting（網站託管）- **低成本項目**
**使用情況**:
- 託管前端網站

**成本優化建議**:
- ✅ 已經是低成本服務，保持現狀

## 🚨 可立即執行的成本優化措施

### 高優先級（立即可省錢）
1. **關閉或降級不常用的 Functions**
   - 行事曆同步功能可能不需要持續運行
   - RolePlay 相關函數如果不常用可以考慮暫停

2. **優化 Functions 配置**
   ```javascript
   // 將記憶體從 1GiB 降到 512MB（需要測試）
   memory: "512MB" 
   
   // 確保最小實例數為 0
   minInstances: 0
   ```

3. **清理 Storage 舊檔案**
   - 設定生命週期規則，30天後自動刪除音訊檔案
   - 刪除已處理完成的暫存檔案

### 中優先級
1. **優化 Firestore 使用**
   - 減少即時監聽器數量
   - 使用批次操作
   - 檢查並刪除不必要的索引

2. **考慮區域調整**
   - Functions 目前在 asia-east1（台灣）
   - 如果主要用戶在其他地區，可考慮調整

## 📊 查看實際計費的方法

1. **Firebase Console**:
   - 前往 https://console.firebase.google.com
   - 選擇專案 donnaai-5e601
   - 點擊左側「Usage and billing」查看使用量

2. **GCP Console**:
   - 前往 https://console.cloud.google.com
   - 選擇專案（專案編號：748876929238）
   - 查看「Billing」部分的詳細費用分析

3. **設定預算警報**:
   - 在 GCP Console 設定每月預算上限
   - 當費用達到 50%、90% 時發送警報

## 🔍 需要進一步確認的資訊

要確定專案在哪個 Google 帳號下，您需要：
1. 登入 Firebase Console 或 GCP Console
2. 查看專案的擁有者和計費帳號
3. 檢查是否有其他專案也在產生費用

## 💡 建議行動計畫

1. **立即執行**：檢查 Firebase Console 的實際使用量報告
2. **本週執行**：實施上述高優先級優化措施
3. **評估效果**：優化後監控一週，查看成本變化
4. **長期規劃**：考慮是否需要調整架構（如使用 Serverless 替代方案）