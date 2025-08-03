# MongoDB Atlas 刪除指南

## 🎯 目標
刪除與 donna-smart-assistant 專案相關的 MongoDB Atlas 資源

## 📋 步驟指南

### 1. 登入 MongoDB Atlas
前往 [MongoDB Atlas Console](https://cloud.mongodb.com/)
使用您的 Google 帳號登入（skyler.chen.ai@gmail.com）

### 2. 檢查並刪除叢集
1. 在左側選單點擊 **Database**
2. 查找任何與以下名稱相關的叢集：
   - donna-smart-assistant
   - donna
   - 任何看起來不再使用的叢集

3. 對於每個要刪除的叢集：
   - 點擊叢集名稱
   - 點擊 **⋮** (三個點) 選單
   - 選擇 **Delete Cluster**
   - 輸入叢集名稱確認刪除

### 3. 檢查並刪除專案（如有）
1. 點擊左上角的組織名稱
2. 選擇 **Projects**
3. 找到與 donna-smart-assistant 相關的專案
4. 點擊專案旁的 **⋮** 選單
5. 選擇 **Delete Project**

### 4. 檢查計費設定
1. 前往 **Billing** 部分
2. 檢查是否有：
   - 活躍的付費叢集
   - 儲存的信用卡資訊
   - 進行中的訂閱

### 5. 取消 GCP 整合（重要）
1. 前往 **Integrations**
2. 找到 **Google Cloud Platform** 整合
3. 如果有連結到 donna-smart-assistant 專案：
   - 點擊 **Configure**
   - 選擇 **Disconnect** 或 **Remove**

## ⚠️ 注意事項

1. **免費層級叢集**：如果是 M0 (免費) 叢集且不佔用資源，可以保留
2. **資料備份**：刪除前確認不需要任何資料
3. **共享叢集**：確認沒有其他應用在使用同一個叢集

## 🔍 如何確認是否有 MongoDB Atlas 費用

1. 在 MongoDB Atlas Console 查看：
   - **Billing** → **Invoices**
   - 檢查最近的發票

2. 在 GCP Console 查看：
   - 前往 [GCP Marketplace](https://console.cloud.google.com/marketplace/orders)
   - 查看是否有 MongoDB Atlas 訂閱

## ✅ 驗證刪除成功

完成以上步驟後：
1. 確認 MongoDB Atlas 中沒有與 donna 相關的資源
2. 確認沒有活躍的付費叢集
3. 確認 GCP 整合已斷開

## 💡 預防未來問題

1. **定期審查**：每月檢查一次 MongoDB Atlas 資源
2. **使用標籤**：為叢集加上專案標籤便於識別
3. **設定預算警報**：在 MongoDB Atlas 設定費用警報

## 🆘 需要協助？

如果在 MongoDB Atlas Console 中找不到相關資源，可能：
- 使用了不同的 email 註冊
- 資源在另一個組織下
- 已經被刪除但仍有遺留費用

請檢查：
1. 您的信用卡帳單是否顯示 MongoDB 費用
2. GCP Marketplace 訂閱歷史
3. 其他可能的 MongoDB 帳號