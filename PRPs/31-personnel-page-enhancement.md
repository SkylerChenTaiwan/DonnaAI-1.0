# PRP-31: 人事管理頁面增強

## 概述
此 PRP 定義了人事管理頁面的增強功能，包括新增樹狀圖檢視（組織架構圖）和表格檢視的雙標籤切換，以及使用狀態和權限設定的顯示。

## 目標
1. 提供雙重檢視模式：樹狀圖（組織架構）和表格（銷售人員資料）
2. 清楚顯示每個成員的使用狀態
3. 實現權限設定的視覺化管理
4. 支援組織架構的拖放調整功能

## 功能需求

### 1. 標籤切換檢視
- **樹狀圖檢視**：顯示組織架構圖
- **表格檢視**：顯示銷售人員詳細資料
- 使用類似 DatabaseScreen 的標籤切換設計

### 2. 樹狀圖檢視（組織架構圖）
- 顯示階層式組織結構
- 每個節點顯示：
  - 姓名和職稱
  - 部門
  - 使用狀態指示器（活躍/非活躍）
  - 團隊成員數量（如果是主管）
- 支援展開/收合子節點
- 拖放功能調整組織架構（需要管理員權限）

### 3. 表格檢視（銷售人員資料）
- 擴展現有的 PersonnelScreen 表格功能
- 新增欄位：
  - 使用狀態（最後活躍時間）
  - 權限等級
  - 管理的團隊
  - 績效指標（可展開詳情）
- 支援排序、篩選和搜尋
- 批量操作：權限調整、狀態更新

### 4. 使用狀態顯示
- 即時活躍狀態（線上/離線）
- 最後登入時間
- 30天內活躍度圖表
- 系統使用統計

### 5. 權限設定介面
- 視覺化權限矩陣
- 快速權限範本（業務、主管、管理員）
- 自訂權限設定
- 權限變更歷史記錄

## 技術實現

### 1. 資料結構擴展

```typescript
// 擴展 User 介面
interface EnhancedUser extends User {
  // 使用狀態
  isOnline?: boolean;
  lastActiveAt?: Date;
  activityStats?: {
    dailyLogins: number[];  // 30天登入記錄
    totalActions: number;   // 總操作次數
    lastActions: string[];  // 最近操作記錄
  };
  
  // 組織結構
  reportingTo?: string;     // 直屬主管 ID
  subordinates?: string[];  // 下屬 ID 列表
  level?: number;          // 組織層級
  
  // 詳細權限
  permissions?: {
    modules: string[];      // 可訪問模組
    actions: string[];      // 可執行動作
    dataAccess: 'own' | 'team' | 'organization';
    customPermissions?: Record<string, boolean>;
  };
}

// 組織節點介面（用於樹狀圖）
interface OrgNode {
  id: string;
  user: EnhancedUser;
  children: OrgNode[];
  expanded?: boolean;
  position?: { x: number; y: number };  // 用於拖放
}
```

### 2. 元件架構

```typescript
// 主要元件結構
PersonnelScreen (已存在)
├── PersonnelTabs (新增)
│   ├── TreeView
│   │   ├── OrgChart
│   │   ├── OrgNode
│   │   └── DragDropHandler
│   └── TableView
│       ├── EnhancedDataTable
│       ├── StatusIndicator
│       └── PermissionBadge
├── PermissionModal (新增)
│   ├── PermissionMatrix
│   ├── PermissionTemplates
│   └── PermissionHistory
└── ActivityModal (新增)
    ├── ActivityChart
    └── ActivityLog
```

### 3. 狀態管理

建立新的 store：
```typescript
// stores/personnelStore.ts
interface PersonnelState {
  users: EnhancedUser[];
  orgStructure: OrgNode;
  activeView: 'tree' | 'table';
  selectedUser: string | null;
  isLoading: boolean;
  
  // Actions
  fetchPersonnel: (teamId: string) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: any) => Promise<void>;
  updateOrgStructure: (structure: OrgNode) => Promise<void>;
  toggleView: () => void;
}
```

### 4. Firebase 整合

新增 Collections/Documents：
```typescript
// Firestore 結構
users (現有)
├── activityStats (子集合)
│   └── daily: { date, loginTime, actions }
└── permissions (子集合)
    └── current: { modules, actions, dataAccess }

organizations (現有)
└── structure (新文檔)
    └── tree: { nodes, relationships }
```

### 5. UI/UX 設計原則

- 遵循現有的 DesignSystem 顏色和樣式
- 樹狀圖使用 SVG 或 Canvas 繪製連接線
- 表格檢視保持與 DatabaseScreen 一致的設計
- 使用動畫過渡效果提升體驗
- 響應式設計支援平板橫屏顯示

## 實施計劃

### 第一階段：基礎架構
1. 建立 PersonnelTabs 元件
2. 實現標籤切換功能
3. 擴展現有表格檢視

### 第二階段：樹狀圖檢視
1. 實現 OrgChart 元件
2. 建立節點渲染邏輯
3. 添加展開/收合功能

### 第三階段：使用狀態
1. 實現即時狀態追蹤
2. 建立活動統計功能
3. 添加狀態指示器

### 第四階段：權限管理
1. 建立權限設定介面
2. 實現權限矩陣視覺化
3. 添加權限變更追蹤

### 第五階段：進階功能
1. 實現拖放調整組織架構
2. 添加批量操作功能
3. 優化效能和使用體驗

## 相依性

- 現有的 PersonnelScreen 元件
- Firebase Auth 和 Firestore
- React Native 拖放函式庫（如 react-native-draggable-flatlist）
- 圖表函式庫（用於活動統計）

## 測試重點

1. 標籤切換的流暢性
2. 大量人員資料的渲染效能
3. 權限更新的即時性
4. 拖放操作的準確性
5. 離線狀態的處理

## 安全考量

1. 權限變更需要雙重確認
2. 操作日誌記錄
3. 敏感資料的存取控制
4. 防止未授權的組織架構修改

## 效能優化

1. 虛擬化長列表
2. 樹狀圖的漸進式載入
3. 使用狀態的輪詢優化
4. 圖片和頭像的懶載入