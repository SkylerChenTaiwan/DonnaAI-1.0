# 資料匯入映射指南

## 系統需要的資料結構與 CSV 欄位對應

### 1. 業務員資料 (Users)

**必要欄位映射：**
```
CSV 欄位 → 系統欄位
業務員姓名 → name
Email → email
直屬主管 → supervisorId (需要先建立主管的 ID 對應表)
```

**角色判定邏輯：**
- 如果有「總監」職稱 → role: 'admin'
- 如果有「經理」職稱 → role: 'manager'  
- 其他 → role: 'salesperson'

**自動產生欄位：**
- `id`: 使用 Firebase 自動產生
- `organizationId`: 從匯入頁面的組織上下文取得
- `teamIds`: 根據層級資料自動分配

### 2. 團隊結構 (Teams)

**從層級資料建立團隊：**
```
團隊名稱 → name
上級代碼 → 用於建立 parentTeamId
業務員 → 加入 memberIds
```

**團隊建立邏輯：**
1. 先掃描所有不重複的「團隊名稱」
2. 建立團隊文檔
3. 根據層級關係設定 parentTeamId
4. 根據業務員所屬團隊更新 memberIds

### 3. 客戶資料 (Customers)

**必要欄位映射：**
```
客戶姓名 → name
客戶公司 → company
客戶職稱 → jobTitle
客戶電話 → phone
客戶Email → email
負責業務員 → createdBy (需要業務員 ID 對應表)
標籤 → tags (用分號分割)
備註 → notes
建立日期 → createdAt
```

**權限設定：**
- `teamMembers`: 根據負責業務員的團隊自動設定
- `organizationId`: 從上下文取得

### 4. 訪談紀錄 (Records)

**必要欄位映射：**
```
訪談日期 → date
客戶姓名 → customerId (需要客戶 ID 對應表)
業務員 → createdBy (需要業務員 ID 對應表)
訪談類型 → type
訪談內容 → content
下次跟進日期 → followUpDate
標籤 → tags
```

## 資料匯入順序（重要！）

必須按照以下順序匯入，因為有依賴關係：

1. **業務員資料** - 建立所有用戶
2. **層級資料** - 建立團隊結構和主管關係
3. **客戶資料** - 需要業務員 ID
4. **訪談紀錄** - 需要客戶 ID 和業務員 ID

## 資料轉換邏輯

### ID 對應表建立
```javascript
// 匯入時建立的對應表
const userMapping = {
  '張三豐': 'firebase-generated-user-id-1',
  '李四海': 'firebase-generated-user-id-2',
  // ...
};

const customerMapping = {
  '王小明': 'firebase-generated-customer-id-1',
  '李小華': 'firebase-generated-customer-id-2',
  // ...
};
```

### 標籤處理
```javascript
// CSV: "重要客戶;科技業"
// 轉換為: ["重要客戶", "科技業"]
const tags = csvValue.split(';').map(tag => tag.trim());
```

### 日期處理
```javascript
// CSV: "2024-01-15"
// 轉換為: Firebase Timestamp
const date = new Date(csvValue);
const timestamp = Timestamp.fromDate(date);
```

## 特殊情況處理

### 1. 缺少 Email 的業務員
- 自動產生：`{姓名拼音}@{組織域名}`
- 例如：`zhangsanfeng@company.com`

### 2. 重複的客戶
- 使用「客戶姓名 + 公司」作為唯一識別
- 如果重複，更新而非新建

### 3. 找不到對應的業務員
- 記錄錯誤日誌
- 將資料暫存，待業務員建立後再關聯

### 4. 樹狀管理結構
- 使用遞迴建立主管關係
- 確保不會產生循環引用

## 資料驗證規則

### 必要欄位檢查
- 業務員：姓名、Email（或可自動產生）
- 客戶：姓名、負責業務員
- 訪談：日期、客戶、業務員、內容

### 格式驗證
- Email：符合 email 格式
- 電話：允許多種格式（0912-345-678、0912345678）
- 日期：YYYY-MM-DD 或 YYYY/MM/DD

### 關聯性驗證
- 確保引用的業務員存在
- 確保引用的客戶存在
- 確保團隊層級不會循環

## 錯誤處理

### 匯入失敗時
1. 產生錯誤報告：`/import-logs/[timestamp]-errors.csv`
2. 包含：行號、錯誤原因、原始資料
3. 允許修正後重新匯入

### 部分成功
1. 記錄成功匯入的資料數量
2. 提供失敗資料的下載連結
3. 允許選擇性重試