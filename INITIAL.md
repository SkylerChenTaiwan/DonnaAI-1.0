## FEATURE:

- DonnaAI - 業務團隊 AI 智能助理平台
- 核心功能：
  1. **AI 會議記錄**：錄音轉文字，自動擷取重點並同步 CRM
  2. **智能報表查詢**：主管用自然語言即時查詢業務數據
  3. **業務小工具平台**：產業特定工具的 WebApp 集合
  4. **客戶資料導入**：支援從現有 CRM 系統或 CSV 檔案批量導入客戶資料
- 技術架構：TypeScript + Expo + Firebase
- AI 服務：支援 OpenAI、Claude、Gemini 多模型切換
- 雙平台：iOS/Android App + Web Dashboard（業務員和主管都可使用兩種平台）
- 語言支援：繁體中文、英文

## EXAMPLES:

### Firebase 樹狀權限管理範例：
```typescript
// 檢查用戶是否為團隊主管
function isManagerOfTeam(userId: string, teamId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  return userData.role === 'manager' && userData.teams.includes(teamId);
}
```

### AI 會議分析 Cloud Function 範例：
```typescript
export const analyzeMeetingContent = onDocumentUpdated(
  'meetings/{meetingId}',
  async (event) => {
    const transcription = event.data?.after.data()?.transcription;
    if (!transcription) return;
    
    const analysis = await analyzeWithClaude(transcription);
    // 更新會議文檔與客戶資料
  }
);
```

### CSV 資料導入範例：
```typescript
async function importCustomersFromCSV(file: File) {
  const batch = writeBatch(db);
  const rows = await parseCSV(file);
  
  rows.forEach((row) => {
    const customerRef = doc(collection(db, 'customers'));
    batch.set(customerRef, {
      ...mapCSVToCustomer(row),
      importedAt: serverTimestamp(),
      organizationId: currentOrg.id
    });
  });
  
  await batch.commit();
}
```

### Notion 風格 UI 元件範例：
```tsx
<Card style={notionStyles.card}>
  <HStack space={3} alignItems="center">
    <Avatar size="sm" source={{ uri: customer.avatar }} />
    <VStack flex={1}>
      <Text style={notionStyles.title}>{customer.name}</Text>
      <Text style={notionStyles.subtitle}>{customer.company}</Text>
    </VStack>
  </HStack>
</Card>
```

## DOCUMENTATION:

- Expo + Firebase：https://docs.expo.dev/guides/using-firebase/
- Firebase 樹狀權限：Custom Claims + Firestore Rules
- 多 AI 整合：LangChain.js 或自建 adapter pattern
- 音訊處理：React Native Audio + Cloud Functions
- 訂閱計費：Revenue Cat 或 Stripe Billing
- 詳細技術架構：請參考 ARCHITECTURE.md

## OTHER CONSIDERATIONS:

### 基本架構
- 初期規模：200 用戶，架構需支援橫向擴展
- 權限系統：樹狀組織架構，一人可有多重角色（既是業務員也是主管）
- B2B 特性：企業級試用期管理、批量用戶導入

### 計費模式
- 按座位數收費
- 每月 2000 分鐘 AI 處理額度（僅計算 AI 處理時間，純錄音不計）
- 超額時顯示加購選項，通知公司管理員
- 未加購前錄音檔案保留，待加購後處理

### AI 功能管理
- Prompt 管理：存於 Firestore，支援版本控制和即時修改
- API Keys：Firebase Remote Config 管理
- 多模型支援：可切換 OpenAI/Claude/Gemini

### 資料處理策略
- 會議記錄：批次處理（錄音結束後處理）
- 報表查詢：即時處理
- CRM 同步：定時批次（每小時一次）
- 錄音存儲：原檔保留 30 天，轉錄文字永久保存
- 客戶資料導入：
  - 支援 CSV 檔案上傳（需提供對應欄位設定）
  - 支援常見 CRM API 整合（Salesforce、HubSpot、Zoho 等）
  - 批量導入時顯示進度和錯誤報告
  - 重複資料偵測與合併策略

### 安全與備份
- Firebase 內建加密存儲
- Firebase Security Rules 權限控制
- 會議錄音上傳後立即加密
- 定期備份到 Cloud Storage

### 開發需求
- 環境變數：.env.example 需包含所有服務配置
- UI/UX：參考 Notion 的簡潔設計風格
- 推播通知：支援 iOS/Android 雙平台

### 技術架構
- **前端**：Expo + React Native + TypeScript + NativeBase
- **後端**：Firebase (Firestore + Auth + Storage + Cloud Functions)
- **狀態管理**：Zustand + Firestore 實時監聽
- **AI 整合**：
  - Claude API (主要) via Cloud Functions
  - Google Cloud Speech-to-Text (中文語音識別)
  - OpenAI API (備用)
- **關鍵架構決策**：
  - NoSQL 文檔資料庫適合樹狀權限結構
  - Cloud Functions 處理 AI 呼叫避免暴露 API Keys
  - Firebase Offline Persistence 支援離線使用
  - NativeBase 可快速實現 Notion 風格 UI

### 專案結構（簡化版）
```
src/
├── components/     # UI 元件
├── screens/        # 頁面
├── services/       # Firebase & AI 服務
├── stores/         # Zustand 狀態管理
└── types/          # TypeScript 類型定義
```