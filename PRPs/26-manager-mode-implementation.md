name: "Manager Mode Implementation"
description: |

## Purpose
實作主管模式功能，提供團隊管理、任務指派、公告發佈和數據分析等管理功能。利用現有的模式切換基礎設施，增強管理儀表板，並整合自然語言數據視覺化系統。

## Core Principles
1. **重用現有基礎設施**: 模式切換、權限系統、通知服務都已存在
2. **漸進式增強**: 從現有 ManagerDashboard 開始，逐步增加功能
3. **一致的設計語言**: 遵循 Notion 風格的現有設計系統
4. **效能優化**: 利用現有的快取和權限優化機制
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
實作完整的主管模式，包含：
- 首頁頂部的業務/主管模式切換（已存在，需連接功能）
- 主管模式專屬導航欄（詢問圖標、人事頁面）
- 主管儀表板（公告、指派按鈕、統計報表）
- 團隊管理功能（批量通知、任務指派）

## Why
- 提供管理者專屬的團隊管理工具
- 整合數據分析功能，幫助決策
- 簡化團隊溝通和任務分配流程
- 提升管理效率和團隊協作

## What
主管模式包含：
1. **模式切換**: 使用現有的 ModeToggle 組件切換界面
2. **導航欄變化**: 
   - 中間+號改為「詢問」圖標，連接數據視覺化
   - 「小工具」改為「人事」頁面
3. **主管儀表板**:
   - 公告按鈕：向團隊成員發送通知
   - 指派按鈕：為團隊成員分配任務
   - 統計報表：顯示保存的數據視覺化報表

### Success Criteria
- [ ] 模式切換正常工作，UI 根據模式變化
- [ ] 導航欄在主管模式下顯示正確的圖標和頁面
- [ ] 公告功能可以向指定成員發送通知
- [ ] 指派功能可以為成員創建任務並發送通知
- [ ] 數據視覺化系統整合到主管模式
- [ ] 報表可以保存和顯示在儀表板

## All Needed Context

### Documentation & References
```yaml
# 現有組件和模式
- file: /src/screens/dashboard/EnhancedDashboardV2.tsx
  why: 當前首頁實作，包含 ModeToggle 組件
  
- file: /src/screens/dashboard/ManagerDashboard.tsx
  why: 現有的主管儀表板，需要增強功能
  
- file: /src/navigation/MainTabNavigator.tsx
  why: 導航欄實作，需要條件渲染
  
- file: /src/services/notifications.ts
  why: 通知服務，用於公告功能
  
- file: /src/services/firebase/permissions-v2.ts
  why: 權限系統，確保只有主管可以使用這些功能

# 數據視覺化系統
- file: /src/screens/analytics/SmartAnalyticsScreen.tsx
  why: 自然語言數據分析介面
  
- file: /src/components/DataVisualization/QueryInterface.tsx
  why: 查詢介面組件，可嵌入主管儀表板

# UI 組件
- file: /src/components/ui/
  why: 現有 UI 組件庫，保持設計一致性

# Firebase 文檔
- url: https://firebase.google.com/docs/firestore/query-data/queries
  why: 團隊成員查詢和篩選
  
- url: https://docs.expo.dev/versions/latest/sdk/notifications/
  why: 推送通知實作參考
```

### Current Codebase tree
```bash
src/
├── screens/
│   ├── dashboard/
│   │   ├── EnhancedDashboardV2.tsx  # 當前首頁
│   │   └── ManagerDashboard.tsx     # 主管儀表板
│   ├── analytics/
│   │   └── SmartAnalyticsScreen.tsx # 數據分析頁
│   └── tools/
│       └── ToolsScreen.tsx          # 小工具頁
├── navigation/
│   └── MainTabNavigator.tsx         # 底部導航
├── services/
│   ├── notifications.ts             # 通知服務
│   └── firebase/
│       └── permissions-v2.ts        # 權限系統
└── stores/
    └── authStore.ts                 # 包含 mode 狀態
```

### Desired Codebase tree with files to be added
```bash
src/
├── screens/
│   ├── dashboard/
│   │   ├── EnhancedDashboardV2.tsx  # 修改：根據 mode 渲染不同內容
│   │   └── ManagerDashboard.tsx     # 修改：增強功能
│   ├── personnel/
│   │   └── PersonnelScreen.tsx      # 新增：人事管理頁面
│   └── manager/
│       ├── AnnouncementModal.tsx    # 新增：公告發佈模態框
│       └── TaskAssignmentModal.tsx  # 新增：任務指派模態框
├── components/
│   └── manager/
│       ├── TeamMemberSelector.tsx   # 新增：團隊成員選擇器
│       └── SavedReportsGrid.tsx     # 新增：保存的報表網格
└── services/
    └── firebase/
        └── managerActions.ts        # 新增：主管操作服務
```

### Known Gotchas
```typescript
// CRITICAL: authStore 的 mode 已經存在，不需要重新實作
// 使用: const { mode } = useAuthStore()

// CRITICAL: 權限檢查必須使用 permissions-v2
// 示例: const canManageTeam = await getUserPermissionContext(userId)

// CRITICAL: 通知必須檢查用戶設置
// 某些用戶可能關閉了通知權限

// CRITICAL: 任務指派需要檢查 assigneeId 是否在同一團隊
// 使用現有的團隊篩選邏輯
```

## Implementation Blueprint

### Data models and structure

```typescript
// 公告數據模型
interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: Timestamp;
  targetUsers: string[]; // 用戶 ID 列表
  targetTeams?: string[]; // 團隊 ID 列表
  priority: 'high' | 'normal' | 'low';
  expiresAt?: Timestamp;
}

// 保存的報表模型
interface SavedReport {
  id: string;
  name: string;
  query: string;
  chartType: string;
  chartData: any;
  createdBy: string;
  createdAt: Timestamp;
  isPublic: boolean;
  teamId?: string;
}

// 團隊成員選擇器狀態
interface TeamMemberSelection {
  allTeam: boolean;
  selectedMembers: string[];
  selectedTeams: string[];
}
```

### List of tasks to be completed

```yaml
Task 1:
MODIFY src/screens/dashboard/EnhancedDashboardV2.tsx:
  - FIND: TaskList 和 RecentCustomers 渲染邏輯
  - ADD: 條件渲染基於 mode === 'manager'
  - INJECT: 導入並渲染 ManagerDashboard 當 mode 為 manager
  - PRESERVE: 現有的業務模式功能

Task 2:
MODIFY src/screens/dashboard/ManagerDashboard.tsx:
  - FIND: 現有的儀表板內容
  - ADD: 公告和指派按鈕在頂部
  - ADD: SavedReportsGrid 組件在下方
  - INTEGRATE: 現有的團隊統計和 AI 建議
  - PATTERN: 使用現有的 Card 和 Button 組件

Task 3:
CREATE src/screens/personnel/PersonnelScreen.tsx:
  - MIRROR: src/screens/tools/ToolsScreen.tsx 的結構
  - MODIFY: 顯示團隊成員列表而非工具
  - ADD: 成員狀態、績效指標、快速操作
  - USE: getUserTeamMembers 從權限系統

Task 4:
MODIFY src/navigation/MainTabNavigator.tsx:
  - FIND: Tab.Screen 定義
  - ADD: 條件渲染邏輯基於 mode
  - MODIFY: AddAction 的圖標和行為
  - REPLACE: Tools 為 Personnel 當 mode === 'manager'

Task 5:
CREATE src/screens/manager/AnnouncementModal.tsx:
  - USE: 現有的 Modal 組件模式
  - ADD: TeamMemberSelector 組件
  - INTEGRATE: notifications.ts 的 sendTeamNotification
  - VALIDATE: 至少選擇一個接收者

Task 6:
CREATE src/screens/manager/TaskAssignmentModal.tsx:
  - MIRROR: CreateTaskModal 的結構
  - ADD: 受派人選擇器
  - MODIFY: 創建任務時包含 assigneeId
  - TRIGGER: 通知給被指派的成員

Task 7:
CREATE src/components/manager/TeamMemberSelector.tsx:
  - FETCH: 團隊成員使用權限系統
  - UI: Checkbox 列表與全選選項
  - FILTER: 基於當前用戶的團隊
  - RETURN: 選中的用戶 ID 列表

Task 8:
CREATE src/components/manager/SavedReportsGrid.tsx:
  - FETCH: 保存的報表從 Firestore
  - DISPLAY: 網格佈局顯示圖表預覽
  - ACTION: 點擊打開完整報表
  - INTEGRATE: 使用現有的圖表渲染組件

Task 9:
CREATE src/services/firebase/managerActions.ts:
  - IMPLEMENT: createAnnouncement 函數
  - IMPLEMENT: bulkAssignTask 函數
  - IMPLEMENT: saveReport 函數
  - USE: 批量操作和事務確保一致性

Task 10:
MODIFY src/screens/analytics/SmartAnalyticsScreen.tsx:
  - ADD: 保存報表按鈕當生成圖表後
  - IMPLEMENT: saveCurrentReport 函數
  - NOTIFY: 用戶報表已保存

Task 11:
UPDATE Firestore Security Rules:
  - ADD: announcements 集合規則
  - ADD: savedReports 集合規則
  - ENSURE: 只有 manager 角色可以創建
  - ALLOW: 團隊成員讀取相關內容

Task 12:
Test Integration:
  - TEST: 模式切換和 UI 變化
  - TEST: 公告發送和接收
  - TEST: 任務批量指派
  - TEST: 報表保存和顯示
  - VALIDATE: 權限正確限制功能
```

### Per task pseudocode

```typescript
// Task 1: EnhancedDashboardV2 條件渲染
const EnhancedDashboardV2 = () => {
  const { mode } = useAuthStore();
  
  if (mode === 'manager') {
    return <ManagerDashboard />;
  }
  
  // 現有的業務模式渲染邏輯
  return (
    <Layout>
      <TaskList />
      <RecentCustomers />
    </Layout>
  );
};

// Task 5: 公告模態框
const AnnouncementModal = ({ visible, onClose }) => {
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    targetUsers: [],
    priority: 'normal'
  });
  
  const handleSend = async () => {
    // VALIDATE: 必填欄位
    if (!announcement.title || !announcement.targetUsers.length) {
      showError('請填寫標題並選擇接收者');
      return;
    }
    
    // CREATE: 公告文檔
    const announcementId = await createAnnouncement(announcement);
    
    // SEND: 通知給每個接收者
    await Promise.all(
      announcement.targetUsers.map(userId =>
        sendNotification(userId, {
          title: `新公告：${announcement.title}`,
          body: announcement.content.substring(0, 100),
          data: { type: 'announcement', announcementId }
        })
      )
    );
    
    onClose();
  };
};

// Task 7: 團隊成員選擇器
const TeamMemberSelector = ({ onSelectionChange }) => {
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState([]);
  
  useEffect(() => {
    // FETCH: 使用權限系統獲取團隊成員
    const fetchMembers = async () => {
      const context = await getUserPermissionContext(currentUser.uid);
      const teamMembers = await getTeamMembers(context.teamIds);
      setMembers(teamMembers);
    };
    fetchMembers();
  }, []);
  
  // UI: Checkbox 列表
  return (
    <View>
      <CheckBox
        title="全選"
        checked={selected.length === members.length}
        onPress={toggleAll}
      />
      {members.map(member => (
        <CheckBox
          key={member.id}
          title={member.name}
          checked={selected.includes(member.id)}
          onPress={() => toggleMember(member.id)}
        />
      ))}
    </View>
  );
};
```

### Integration Points
```yaml
NAVIGATION:
  - modify: MainTabNavigator.tsx
  - condition: "mode === 'manager' ? PersonnelScreen : ToolsScreen"
  - icon: "mode === 'manager' ? 'help-circle' : 'add-circle'"
  
FIREBASE:
  - collections:
    - announcements: 公告集合
    - savedReports: 保存的報表
  - indexes:
    - announcements: 複合索引 (teamId, createdAt)
    - savedReports: 複合索引 (createdBy, isPublic)
    
PERMISSIONS:
  - check: canManageTeam 在所有管理操作前
  - filter: 基於 teamId 的數據訪問
  
STATE:
  - use: authStore.mode 進行條件渲染
  - cache: 團隊成員列表避免重複查詢
```

## Validation Loop

### Level 1: TypeScript 檢查
```bash
# 檢查所有 TypeScript 錯誤
npx tsc --noEmit

# 預期：無錯誤。如有錯誤，修復類型定義
```

### Level 2: ESLint 檢查
```bash
# 運行 ESLint
npm run lint

# 預期：無錯誤或警告
```

### Level 3: 組件測試
```typescript
// 測試模式切換
describe('Dashboard Mode Switching', () => {
  it('should render ManagerDashboard when mode is manager', () => {
    useAuthStore.setState({ mode: 'manager' });
    const { getByText } = render(<EnhancedDashboardV2 />);
    expect(getByText('團隊管理')).toBeTruthy();
  });
  
  it('should render business dashboard when mode is business', () => {
    useAuthStore.setState({ mode: 'business' });
    const { getByText } = render(<EnhancedDashboardV2 />);
    expect(getByText('今日任務')).toBeTruthy();
  });
});

// 測試公告發送
describe('Announcement System', () => {
  it('should require title and recipients', async () => {
    const { getByText } = render(<AnnouncementModal visible={true} />);
    fireEvent.press(getByText('發送'));
    expect(getByText('請填寫標題並選擇接收者')).toBeTruthy();
  });
  
  it('should send notifications to selected users', async () => {
    // Mock 選擇用戶和發送
    const mockSend = jest.fn();
    // ... 測試邏輯
  });
});
```

### Level 4: 集成測試
```bash
# 啟動開發服務器
npm start

# 測試步驟：
# 1. 登入為 manager 角色用戶
# 2. 切換到主管模式
# 3. 驗證導航欄變化
# 4. 測試公告發送
# 5. 測試任務指派
# 6. 驗證通知接收

# 預期：所有功能正常運作
```

### Level 5: 權限測試
```typescript
// 測試非管理員訪問限制
describe('Permission Checks', () => {
  it('should not show manager mode for non-managers', async () => {
    // Mock 非管理員用戶
    const regularUser = { role: 'salesperson' };
    // 驗證無法訪問管理功能
  });
});
```

## Final Validation Checklist
- [ ] TypeScript 編譯無錯誤
- [ ] ESLint 檢查通過
- [ ] 模式切換 UI 正確更新
- [ ] 導航欄圖標和頁面正確顯示
- [ ] 公告可以成功發送和接收
- [ ] 任務可以批量指派
- [ ] 數據視覺化整合正常
- [ ] 報表可以保存和查看
- [ ] 權限正確限制非管理員
- [ ] 通知在各平台正常工作
- [ ] 效能優化（快取、批量操作）

---

## Anti-Patterns to Avoid
- ❌ 不要創建新的模式切換機制，使用現有的
- ❌ 不要繞過權限系統直接訪問數據
- ❌ 不要在客戶端過濾敏感數據，使用 Security Rules
- ❌ 不要忽略批量操作的效能影響
- ❌ 不要硬編碼團隊或用戶 ID
- ❌ 不要忽略通知權限檢查

## 實作優先順序
1. 先實作基礎模式切換和 UI 變化
2. 再實作公告和指派功能
3. 最後整合數據視覺化和報表系統
4. 持續測試權限和通知功能

## 效能考量
- 使用 React.memo 優化重渲染
- 快取團隊成員列表
- 批量操作使用事務
- 分頁加載大量數據
- 使用索引優化查詢

---

**信心等級：9/10** - 基礎設施完善，大部分功能已有現成組件，主要工作是整合和增強。唯一的挑戰可能是確保所有權限和通知在不同情況下都正確工作。