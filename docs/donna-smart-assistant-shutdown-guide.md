# 關閉 donna-smart-assistant 專案服務指南

## 專案資訊
- **專案 ID**: donna-smart-assistant
- **專案編號**: 166514366760
- **狀態**: 此專案與 DonnaAI 應用無關，可安全關閉

## 🔍 檢查結果

### 目前啟用的主要服務
1. **Cloud Storage** - 3 個 buckets:
   - `gs://donna-audio-files/` - 可能儲存音訊檔案
   - `gs://donna-smart-assistant_cloudbuild/` - Cloud Build 暫存
   - `gs://run-sources-donna-smart-assistant-asia-east1/` - Cloud Run 來源檔案

2. **BigQuery** - 資料倉儲服務（可能產生高額費用）

3. **MongoDB Atlas** - 第三方資料庫服務

4. **其他基礎服務** - Compute Engine、Cloud SQL（但無實際運行實例）

### ✅ 好消息
- **無運行中的 VM 實例**
- **無 Cloud SQL 資料庫**
- **無 App Engine 應用**
- **無 Firestore 資料庫**
- **不是 Firebase 專案**

## 🚨 立即執行：關閉服務步驟

### 步驟 1：備份重要資料（如需要）
```bash
# 檢查 Storage bucket 內容
gsutil ls -r gs://donna-audio-files/

# 如果有重要檔案，下載備份
# gsutil -m cp -r gs://donna-audio-files/* ./backup/
```

### 步驟 2：刪除 Cloud Storage Buckets
```bash
# 刪除所有 buckets（會永久刪除所有資料）
gsutil rm -r gs://donna-audio-files/
gsutil rm -r gs://donna-smart-assistant_cloudbuild/
gsutil rm -r gs://run-sources-donna-smart-assistant-asia-east1/
```

### 步驟 3：停用 BigQuery（主要計費來源）
```bash
# 列出所有 BigQuery 資料集
bq ls --project_id=donna-smart-assistant

# 如果有資料集，刪除它們
# bq rm -r -f -d donna-smart-assistant:dataset_name
```

### 步驟 4：檢查並停用 MongoDB Atlas
1. 前往 [MongoDB Atlas Console](https://cloud.mongodb.com/)
2. 查看是否有與此專案相關的叢集
3. 如有，請暫停或刪除叢集

### 步驟 5：停用不必要的 API
```bash
# 停用高成本 API
gcloud services disable bigquery.googleapis.com --project=donna-smart-assistant
gcloud services disable bigquerystorage.googleapis.com --project=donna-smart-assistant
gcloud services disable compute.googleapis.com --project=donna-smart-assistant
gcloud services disable sqladmin.googleapis.com --project=donna-smart-assistant
gcloud services disable run.googleapis.com --project=donna-smart-assistant
```

### 步驟 6：移除計費帳戶（最重要）
```bash
# 查看目前的計費帳戶
gcloud beta billing projects describe donna-smart-assistant

# 移除計費帳戶連結（停止所有計費）
gcloud beta billing projects unlink donna-smart-assistant
```

## 🗑️ 選項：完全刪除專案
如果確定完全不需要此專案：

```bash
# ⚠️ 警告：這會永久刪除整個專案和所有資料
gcloud projects delete donna-smart-assistant
```

刪除後：
- 專案會進入 30 天的恢復期
- 期間不會產生新費用
- 30 天後永久刪除

## ✅ 確認清單

執行以上步驟後，請確認：
- [ ] Cloud Storage buckets 已刪除
- [ ] BigQuery 已停用或資料集已刪除
- [ ] MongoDB Atlas 叢集已暫停/刪除
- [ ] 高成本 API 已停用
- [ ] 計費帳戶已移除
- [ ] （選擇性）專案已刪除

## 📊 預期結果

完成以上步驟後：
1. **立即停止新的計費**
2. **現有使用的費用會在下個計費週期結算**
3. **不會影響 DonnaAI 專案運作**（完全獨立的專案）

## 🔍 驗證步驟

切換回 DonnaAI 專案並確認一切正常：
```bash
# 切換回開發環境
gcloud config set project donnaai-5e601

# 或切換到生產環境
gcloud config set project donnaai-production
```

## 💡 建議

1. **定期檢查 GCP 計費**：設定預算警報避免意外費用
2. **清理未使用專案**：定期檢查並清理不再使用的專案
3. **使用標籤管理**：為專案加上標籤方便識別用途