# Bug 追蹤報告：舊系統資料導入頁面返回功能與驗證問題

**日期**: 2025-01-30 16:30
**問題識別碼**: legacy-import-navigation-validation
**執行者**: bug-hunter agent
**專案**: DonnaAI-1.0
**使用者回報問題**:
1. LegacyDataImportScreen 這一頁沒有返回上一頁的功能
2. CSV 資料驗證失敗，希望跳過必填欄位為空白的記錄

## Bug 追蹤結果

### Bug 1: LegacyDataImportScreen 缺少返回功能

#### 根本原因
- **問題位置**: `/src/components/screens/admin/LegacyDataImportScreen.tsx`
- **原因**: 元件沒有引入 `useNavigation` hook
- **影響**: 雖然 Layout 元件的 headerProps 設定了返回按鈕，但因為沒有 navigation 物件，導致 `navigation.goBack()` 失敗

#### 相關程式碼
```typescript
// 第 573-578 行
<Layout
  headerProps={{
    title: '舊系統資料導入',
    showBack: true,
    onBack: () => navigation.goBack(), // navigation 未定義
  }}
```

#### 引入時間
- 此元件在建立時就缺少 navigation 的引入
- 可能是開發時遺漏了 React Navigation 的整合

### Bug 2: 資料驗證過於嚴格

#### 根本原因
- **問題位置**: `/src/services/csv/legacy-import/` 各個 importer 檔案
- **原因**: 驗證邏輯將空白的必填欄位視為錯誤，沒有跳過空白記錄的選項
- **使用者需求**: 希望跳過必填欄位為空白的記錄，而非報錯

#### 影響範圍
1. **業務代碼對照表**: 2 筆無效記錄
2. **客戶名單**: 548 筆無效記錄
3. **訪談記錄**: 7 筆無效記錄

### Bug 3: Firebase 網路錯誤

#### 可能原因
1. **QUIC 協議問題**: 
   - 可能是網路環境不支援 QUIC
   - Firebase SDK 自動降級機制可能有問題

2. **400 Bad Request**:
   - 可能是查詢參數錯誤
   - 權限設定問題

#### 相關錯誤
- `net::ERR_QUIC_PROTOCOL_ERROR`
- `400 (Bad Request)` on Firestore Listen endpoint

### Bug 4: 動畫警告 (useNativeDriver)

#### 根本原因
- **環境**: Web 平台
- **原因**: React Native Web 不支援原生動畫驅動
- **影響**: 僅影響效能，不影響功能

## 追蹤總結

### 需要修復的檔案
1. `/src/components/screens/admin/LegacyDataImportScreen.tsx` - 加入 navigation
2. `/src/services/csv/legacy-import/` 目錄下的驗證邏輯
3. Firebase 配置或查詢邏輯

### 修復優先級
1. **高**: LegacyDataImportScreen 返回功能
2. **高**: 資料驗證邏輯（跳過空白記錄）
3. **中**: Firebase 網路問題
4. **低**: 動畫警告（Web 平台限制）

---
報告生成時間：2025-01-30 16:30:00