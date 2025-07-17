# 04-frontend-pages-implementation

## Goal
實作 DonnaAI 的完整前端頁面系統，包含底部導航欄（5個按鈕）、首頁（含模式切換）、+ 號彈出氣球功能、資料庫頁面（含完整 Table 功能）、小工具頁面（卡片式排列）和設定頁面（根據模式動態顯示）。

## Why
- **使用者體驗**：提供直觀的導航和功能存取介面
- **功能整合**：將現有的業務邏輯整合到統一的UI框架中
- **模式切換**：支援業務模式和主管模式的不同檢視需求
- **資料管理**：提供強大的搜尋、篩選、排序功能來管理客戶、紀錄和任務資料
- **工具生態**：建立可擴展的小工具平台基礎架構

## What
建立完整的 App 結構，包含：

### 📱 核心導航結構
1. **底部導航欄**（5個按鈕）：首頁、資料庫、+ 號（彈出功能）、小工具、設定
2. **+ 號彈出氣球**：新增客戶 / 新增紀錄 / 新增任務
3. **模式切換系統**：業務模式 vs 主管模式

### 📊 功能頁面
1. **首頁**：帳號顯示、模式切換、提醒卡片、最近任務
2. **資料庫頁面**：Tab切換（客戶/紀錄/任務）+ 完整Table功能
3. **小工具頁面**：卡片式排列的工具目錄
4. **設定頁面**：根據模式動態顯示不同設定選項

### Success Criteria
- [ ] 底部導航正常運作，所有5個頁面可訪問
- [ ] + 號按鈕正確彈出氣球選單，支援3種新增操作
- [ ] 首頁模式切換功能正常，UI依據模式動態調整
- [ ] 資料庫頁面支援搜尋、篩選、排序、多選等完整Table功能
- [ ] 小工具頁面展示placeholder工具卡片
- [ ] 設定頁面根據使用者模式顯示對應選項
- [ ] 所有頁面遵循現有的iOS風格設計系統
- [ ] 在不同裝置尺寸下均正常運作
- [ ] 通過 TypeScript 型別檢查和 ESLint 檢查

## All Needed Context

### Documentation & References
```yaml
# 必讀 - 實作時須參考的關鍵資源
- url: https://reactnavigation.org/docs/modal/
  why: 實作 + 號彈出氣球的modal模式最佳實踐
  critical: Modal應該定義在root stack，避免巢狀導航問題

- url: https://reactnavigation.org/docs/bottom-tab-navigator/
  why: 底部標籤導航器的customization選項
  section: tabBarOnPress覆寫預設行為來觸發modal

- url: https://shopify.github.io/flash-list/docs/usage/
  why: 高效能列表實作，用於資料庫頁面的Table功能
  critical: FlashList v2使用Cell Recycling，比FlatList效能更佳

- url: https://reactnative.dev/docs/switch
  why: 原生Switch元件用於設定頁面切換功能

- file: src/navigation/MainTabNavigator.tsx
  why: 現有導航結構，需要修改以支援modal和+號按鈕
  pattern: 目前使用5個tab結構，需要將中間tab改為modal觸發器

- file: src/screens/dashboard/SalespersonDashboard.tsx
  why: 現有首頁設計模式和樣式規範
  pattern: 卡片式佈局、統計區塊、快速操作區域的設計模式

- file: src/components/common/Button.tsx
  why: 現有按鈕元件的API和樣式模式
  pattern: variant系統（primary/secondary/outline）和size系統

- file: src/components/common/Layout.tsx
  why: 頁面佈局的標準模式和容器結構

- file: src/stores/authStore.ts
  why: 現有的使用者狀態管理模式，用於模式切換功能

- docfile: ARCHITECTURE.md
  why: 專案結構、技術棧和設計原則
  section: Notion風格設計系統、檔案組織結構
```

### Current Codebase Tree (關鍵部分)
```bash
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx          # 現有按鈕元件
│   │   ├── Layout.tsx          # 頁面佈局元件
│   │   ├── LoadingSpinner.tsx  # 載入指示器
│   │   └── TextInput.tsx       # 輸入框元件
├── navigation/
│   ├── AppNavigator.tsx        # 根導航器
│   ├── AuthNavigator.tsx       # 認證導航
│   └── MainTabNavigator.tsx    # 主要標籤導航（需修改）
├── screens/
│   ├── dashboard/
│   │   ├── SalespersonDashboard.tsx  # 業務員儀表板（參考設計）
│   │   ├── ManagerDashboard.tsx      # 主管儀表板
│   │   └── AdminDashboard.tsx        # 管理員儀表板
│   ├── customers/
│   │   └── CustomersScreen.tsx       # 客戶頁面（待實作）
│   └── profile/
│       └── ProfileScreen.tsx         # 個人資料頁面
├── stores/
│   ├── authStore.ts           # 認證狀態管理
│   ├── customerStore.ts       # 客戶資料管理
│   ├── recordStore.ts         # 紀錄資料管理
│   └── taskStore.ts           # 任務資料管理
└── types/
    ├── index.ts               # 型別定義
    └── user.ts                # 使用者型別
```

### Desired Codebase Tree
```bash
src/
├── components/
│   ├── common/
│   │   ├── ActionModal.tsx          # 新增：+ 號彈出氣球元件
│   │   ├── DataTable.tsx            # 新增：資料表格元件
│   │   ├── SearchBar.tsx            # 新增：搜尋欄元件
│   │   ├── FilterPanel.tsx          # 新增：篩選面板元件
│   │   ├── ModeToggle.tsx           # 新增：模式切換元件
│   │   └── ToolCard.tsx             # 新增：工具卡片元件
│   ├── database/
│   │   ├── CustomerTable.tsx        # 新增：客戶資料表
│   │   ├── RecordTable.tsx          # 新增：紀錄資料表
│   │   └── TaskTable.tsx            # 新增：任務資料表
│   └── settings/
│       ├── SettingsSection.tsx      # 新增：設定區塊元件
│       └── SettingItem.tsx          # 新增：設定項目元件
├── navigation/
│   └── MainTabNavigator.tsx         # 修改：支援modal和+號按鈕
├── screens/
│   ├── dashboard/
│   │   └── EnhancedDashboard.tsx    # 新增：增強版首頁（含模式切換）
│   ├── database/
│   │   └── DatabaseScreen.tsx       # 新增：資料庫主頁面
│   ├── tools/
│   │   └── ToolsScreen.tsx          # 新增：小工具頁面
│   ├── settings/
│   │   └── SettingsScreen.tsx       # 新增：設定頁面
│   └── modals/
│       ├── CreateCustomerModal.tsx  # 新增：新增客戶Modal
│       ├── CreateRecordModal.tsx    # 新增：新增紀錄Modal
│       └── CreateTaskModal.tsx      # 新增：新增任務Modal
└── hooks/
    ├── useTableData.ts              # 新增：表格資料管理Hook
    ├── useSearch.ts                 # 新增：搜尋功能Hook
    └── useModeSwitch.ts             # 新增：模式切換Hook
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: React Navigation Modal 最佳實踐
// Modal必須定義在root stack navigator，不可巢狀在tab navigator內
// 正確：Root Stack > Tab Navigator + Modal Group
// 錯誤：Tab Navigator > Modal

// CRITICAL: FlashList v2 重要變更
// keyExtractor在v2中變得更重要，必須提供valid keyExtractor
// 避免在renderItem中使用key prop，會影響Cell Recycling效能

// CRITICAL: 現有專案使用的樣式系統
// 顏色：#007AFF (primary), #F8F9FA (background), #1C1C1E (text)
// 字體大小：遵循現有的 fontSize 階層
// 陰影：使用現有的 shadowColor/shadowOffset 模式

// CRITICAL: 專案使用Zustand狀態管理
// Store需要支援實時同步，遵循現有的store模式
// 避免直接修改state，使用提供的action methods

// CRITICAL: 專案使用TypeScript嚴格模式
// 所有元件必須有完整的型別定義
// Props interface必須export供其他元件使用
```

## Implementation Blueprint

### Data Models and Structure
```typescript
// 定義完整的型別系統以確保型別安全和一致性

// 新增檔案：src/types/navigation.ts
export type RootStackParamList = {
  MainTabs: undefined;
  CreateCustomerModal: undefined;
  CreateRecordModal: undefined;
  CreateTaskModal: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Database: undefined;
  AddAction: undefined; // 僅用於觸發modal，不實際導航
  Tools: undefined;
  Settings: undefined;
};

// 新增檔案：src/types/table.ts
export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, item: any) => React.ReactNode;
}

export interface TableData {
  id: string;
  [key: string]: any;
}

export interface TableState {
  data: TableData[];
  filteredData: TableData[];
  sortConfig: {
    key: string | null;
    direction: 'asc' | 'desc';
  };
  searchQuery: string;
  selectedItems: Set<string>;
  filters: Record<string, any>;
}

// 新增檔案：src/types/settings.ts
export interface SettingSection {
  id: string;
  title: string;
  items: SettingItem[];
}

export interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'switch' | 'select' | 'navigation' | 'action';
  value?: any;
  options?: { label: string; value: any }[];
  action?: () => void;
}
```

### 按順序完成的任務清單

```yaml
Task 1: 修改導航結構支援Modal
MODIFY src/navigation/AppNavigator.tsx:
  - FIND pattern: "Stack.Navigator"
  - INJECT modal group containing CreateCustomerModal, CreateRecordModal, CreateTaskModal
  - PRESERVE existing MainTabNavigator as nested screen

MODIFY src/navigation/MainTabNavigator.tsx:
  - FIND pattern: "Tab.Screen name='Tools'"
  - REPLACE middle tab with AddAction tab
  - ADD tabBarOnPress override to trigger modal instead of navigation
  - PRESERVE existing styling and icon configuration

Task 2: 建立核心UI元件
CREATE src/components/common/ActionModal.tsx:
  - MIRROR pattern from: src/components/common/Layout.tsx
  - IMPLEMENT floating bubble with 3 action buttons
  - USE React Native Modal with transparent background

CREATE src/components/common/ModeToggle.tsx:
  - MIRROR pattern from: src/components/common/Button.tsx
  - IMPLEMENT Switch component with custom styling
  - INTEGRATE with authStore for mode state management

CREATE src/components/common/SearchBar.tsx:
  - MIRROR pattern from: src/components/common/TextInput.tsx
  - ADD search icon and clear button
  - IMPLEMENT debounced search functionality

Task 3: 實作DataTable核心功能
CREATE src/components/common/DataTable.tsx:
  - USE @shopify/flash-list for performance
  - IMPLEMENT search, filter, sort, multi-select functionality
  - MIRROR styling from: src/screens/dashboard/SalespersonDashboard.tsx
  - ADD column configuration support

CREATE src/hooks/useTableData.ts:
  - IMPLEMENT search, filter, sort logic
  - INTEGRATE with existing stores (customerStore, recordStore, taskStore)
  - USE useMemo for performance optimization

Task 4: 實作首頁增強功能
CREATE src/screens/dashboard/EnhancedDashboard.tsx:
  - MIRROR pattern from: src/screens/dashboard/SalespersonDashboard.tsx
  - ADD ModeToggle component to header
  - IMPLEMENT conditional content based on user mode
  - ADD reminder cards and recent tasks sections

Task 5: 建立資料庫頁面
CREATE src/screens/database/DatabaseScreen.tsx:
  - IMPLEMENT tab navigation for customers/records/tasks
  - INTEGRATE DataTable component
  - ADD search and filter UI
  - CONNECT to existing data stores

CREATE src/components/database/CustomerTable.tsx:
  - EXTEND DataTable with customer-specific columns
  - IMPLEMENT customer data formatting
  - ADD customer-specific actions

Task 6: 實作小工具頁面
CREATE src/screens/tools/ToolsScreen.tsx:
  - IMPLEMENT grid layout for tool cards
  - ADD search functionality
  - CREATE placeholder tool cards

CREATE src/components/common/ToolCard.tsx:
  - MIRROR card styling from dashboard
  - IMPLEMENT tool metadata display
  - ADD placeholder cover images

Task 7: 建立設定頁面
CREATE src/screens/settings/SettingsScreen.tsx:
  - IMPLEMENT mode-based settings display
  - INTEGRATE with authStore for user preferences
  - ADD setting sections and items

CREATE src/components/settings/SettingItem.tsx:
  - IMPLEMENT different setting types (switch, select, navigation)
  - MIRROR styling from existing components
  - ADD proper accessibility support

Task 8: 實作Modal視窗
CREATE src/screens/modals/CreateCustomerModal.tsx:
  - IMPLEMENT customer creation form
  - INTEGRATE with customerStore
  - ADD form validation

CREATE src/screens/modals/CreateRecordModal.tsx:
  - IMPLEMENT record creation form
  - INTEGRATE with recordStore
  - ADD audio recording option

CREATE src/screens/modals/CreateTaskModal.tsx:
  - IMPLEMENT task creation form
  - INTEGRATE with taskStore
  - ADD task assignment functionality
```

### Per Task Pseudocode

```typescript
// Task 1: 導航結構修改
// src/navigation/AppNavigator.tsx
function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="CreateCustomerModal" component={CreateCustomerModal} />
        <Stack.Screen name="CreateRecordModal" component={CreateRecordModal} />
        <Stack.Screen name="CreateTaskModal" component={CreateTaskModal} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

// Task 2: ActionModal 元件
// src/components/common/ActionModal.tsx
function ActionModal({ visible, onClose, onAction }) {
  // PATTERN: 使用 React Native Modal + 透明背景
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={overlay} onPress={onClose}>
        <View style={bubble}>
          {actions.map(action => (
            <TouchableOpacity key={action.id} onPress={() => onAction(action)}>
              <Ionicons name={action.icon} />
              <Text>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// Task 3: DataTable 核心功能
// src/components/common/DataTable.tsx
function DataTable({ data, columns, onSelect }) {
  // CRITICAL: 使用 FlashList v2 並提供 keyExtractor
  const { filteredData, handleSearch, handleSort } = useTableData(data);
  
  return (
    <View>
      <SearchBar value={searchQuery} onChangeText={handleSearch} />
      <FlashList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TableRow item={item} columns={columns} />}
        estimatedItemSize={60}
        extraData={sortConfig} // 重要：確保排序變更時重新渲染
      />
    </View>
  );
}

// Task 4: 首頁模式切換
// src/screens/dashboard/EnhancedDashboard.tsx
function EnhancedDashboard() {
  const { user, mode, toggleMode } = useAuthStore();
  
  // PATTERN: 根據模式渲染不同內容
  const renderModeSpecificContent = () => {
    if (mode === 'manager') {
      return <ManagerContent />;
    }
    return <SalespersonContent />;
  };
  
  return (
    <Layout>
      <View style={header}>
        <Text>歡迎回來，{user?.name}</Text>
        <ModeToggle value={mode} onToggle={toggleMode} />
      </View>
      {renderModeSpecificContent()}
    </Layout>
  );
}
```

### Integration Points
```yaml
STORES:
  - integrate: src/stores/authStore.ts
  - add: "mode" state for business/manager toggle
  - pattern: "const toggleMode = () => set(state => ({ mode: state.mode === 'business' ? 'manager' : 'business' }))"

NAVIGATION:
  - modify: src/navigation/MainTabNavigator.tsx
  - pattern: "tabBarOnPress: () => navigation.navigate('CreateCustomerModal')"
  
COMPONENTS:
  - create: src/components/common/DataTable.tsx
  - integrate: "@shopify/flash-list" for performance
  - pattern: "estimatedItemSize and keyExtractor required"

TYPES:
  - create: src/types/navigation.ts, src/types/table.ts, src/types/settings.ts
  - pattern: "export interface ComponentProps extends BaseProps"
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# 執行這些檢查 - 修復任何錯誤後再繼續
npm run lint                     # ESLint 檢查和自動修復
npm run type-check              # TypeScript 型別檢查

# 預期結果：無錯誤。如有錯誤，閱讀錯誤訊息並修復
```

### Level 2: Component Tests
```typescript
// 為每個新元件建立測試檔案
// src/components/common/__tests__/DataTable.test.tsx
describe('DataTable', () => {
  test('renders data correctly', () => {
    const mockData = [{ id: '1', name: 'Test' }];
    const mockColumns = [{ key: 'name', title: 'Name' }];
    
    render(<DataTable data={mockData} columns={mockColumns} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('handles search functionality', () => {
    // 測試搜尋功能
  });

  test('handles sorting functionality', () => {
    // 測試排序功能
  });
});

// src/components/common/__tests__/ActionModal.test.tsx
describe('ActionModal', () => {
  test('shows modal when visible', () => {
    render(<ActionModal visible={true} onClose={jest.fn()} onAction={jest.fn()} />);
    expect(screen.getByTestId('action-modal')).toBeInTheDocument();
  });

  test('calls onAction when action is pressed', () => {
    const mockOnAction = jest.fn();
    render(<ActionModal visible={true} onClose={jest.fn()} onAction={mockOnAction} />);
    
    fireEvent.press(screen.getByText('新增客戶'));
    expect(mockOnAction).toHaveBeenCalledWith(expect.objectContaining({ type: 'customer' }));
  });
});
```

```bash
# 執行測試並持續修正直到通過
npm run test               # Jest 單元測試
# 如果失敗：閱讀錯誤、理解根本原因、修復程式碼、重新執行
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm start

# 手動測試關鍵功能
# 1. 測試底部導航：點擊每個標籤確認正常切換
# 2. 測試 + 號按鈕：確認彈出氣球顯示並可選擇動作
# 3. 測試模式切換：在首頁切換模式，確認內容變更
# 4. 測試搜尋功能：在資料庫頁面輸入搜尋關鍵字
# 5. 測試表格操作：點擊表頭排序、選擇項目、篩選功能

# 預期結果：所有功能正常運作，無當機或錯誤
```

## Final Validation Checklist
- [ ] 所有測試通過：`npm run test`
- [ ] 無 linting 錯誤：`npm run lint`
- [ ] 無型別錯誤：`npm run type-check`
- [ ] 手動測試成功：所有頁面和功能正常運作
- [ ] 底部導航正確顯示5個按鈕
- [ ] + 號按鈕正確彈出氣球選單
- [ ] 模式切換功能正常運作
- [ ] 資料庫頁面表格功能完整（搜尋、排序、篩選、多選）
- [ ] 小工具頁面顯示placeholder卡片
- [ ] 設定頁面根據模式顯示對應內容
- [ ] 所有Modal正確開啟和關閉
- [ ] 符合現有設計系統和樣式規範
- [ ] 在不同螢幕尺寸下正常運作

---

## Anti-Patterns to Avoid
- ❌ 不要將Modal巢狀在Tab Navigator內，應該放在Root Stack
- ❌ 不要在FlashList的renderItem中使用key prop
- ❌ 不要忽略TypeScript錯誤，必須完整型別定義
- ❌ 不要跳過memoization，特別是在table元件中
- ❌ 不要硬編碼樣式值，使用現有的設計token
- ❌ 不要破壞現有的導航流程
- ❌ 不要創建新的狀態管理模式，使用現有的Zustand stores

## 實作信心評分
**9/10** - 此PRP包含完整的實作資訊、現有程式碼模式參考、詳細的任務分解和完整的驗證步驟。所有必要的技術細節和最佳實踐都已涵蓋，應能支援一次性成功實作。