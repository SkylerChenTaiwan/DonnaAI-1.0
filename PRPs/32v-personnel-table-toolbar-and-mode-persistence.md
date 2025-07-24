# PRP-32: 人事表格工具列與模式持久化

name: "人事表格工具列與模式持久化"
description: |
  實作兩個主要功能：
  1. 移除人事表格檢視的統計列，並加入與資料庫頁面相同的工具列功能
  2. 實作模式持久化，記住使用者上次選擇的模式（主管模式/業務模式）

## 目標
- 統一人事管理與資料庫頁面的操作體驗，提供一致的工具列功能
- 改善使用者體驗，自動記住並恢復上次使用的模式設定
- 移除不必要的統計資訊顯示，簡化介面

## 為什麼
- **一致性**：目前人事頁面缺少資料庫頁面的便利工具列功能，造成操作體驗不一致
- **效率提升**：每次開啟應用都需要重新切換模式，降低使用效率
- **介面簡化**：統計資訊列佔用空間但實用性有限，可以透過其他方式呈現

## 功能需求

### 成功標準
- [ ] 人事表格檢視移除統計列（總人數、在職、請假、線上）
- [ ] 加入完整的工具列功能（篩選、多選、欄位設定、匯出等）
- [ ] 應用程式記住上次使用的模式並在下次啟動時自動恢復
- [ ] 模式切換時立即儲存到本地儲存
- [ ] 工具列功能在人事頁面正常運作

## 所有必要的上下文

### 文檔與參考資料
```yaml
# 必讀 - 實作時需要參考的資源
- file: src/screens/database/DatabaseScreen.tsx
  why: 資料庫頁面的工具列實作參考
  pattern: 第 714-732 行的 ToolbarIcons 使用方式
  
- file: src/screens/personnel/TableView.tsx
  why: 需要修改的人事表格檢視
  critical: 第 129-153 行的統計容器需要移除
  
- file: src/components/common/ToolbarIcons.tsx
  why: 工具列元件的介面定義
  
- file: src/stores/authStore.ts
  why: 目前模式狀態的儲存位置
  pattern: mode 欄位和 toggleMode 方法
  
- file: src/hooks/useColumnSettings.ts
  why: AsyncStorage 使用模式參考
  pattern: 第 31-59 行的載入和儲存邏輯
  
- file: src/config/constants.ts
  why: 現有的 STORAGE_KEYS 定義位置
  critical: 需要在此新增 USER_MODE key

- url: https://react-native-async-storage.github.io/async-storage/docs/api
  why: AsyncStorage API 文檔
  section: getItem, setItem, removeItem
```

### 現有程式碼樹狀結構
```bash
./src
├── screens
│   ├── database
│   │   └── DatabaseScreen.tsx        # 工具列參考實作
│   └── personnel
│       ├── PersonnelScreen.tsx        # 人事主頁面
│       └── TableView.tsx              # 需要修改的表格檢視
├── components
│   └── common
│       ├── ToolbarIcons.tsx           # 工具列元件
│       ├── FilterModal.tsx            # 篩選彈窗
│       ├── ColumnSettingsModal.tsx    # 欄位設定彈窗
│       └── ModeToggle.tsx             # 模式切換元件
├── config
│   └── constants.ts                   # 常數定義（含 STORAGE_KEYS）
├── stores
│   └── authStore.ts                   # 認證和模式狀態
└── hooks
    └── useColumnSettings.ts           # AsyncStorage 使用參考
```

### 已知的程式庫限制和注意事項
```typescript
// 重要：ToolbarIcons 需要的 props
interface ToolbarIconsProps {
  multiSelectMode: boolean;
  showSort?: boolean;
  onFilterPress: () => void;
  onMultiSelectPress: () => void;
  onColumnsPress: () => void;
}

// 重要：authStore 的模式定義
type Mode = 'business' | 'manager';

// 重要：AsyncStorage 是非同步的
// 需要在應用啟動時先載入模式設定
```

## 實作藍圖

### 資料模型和結構

```typescript
// config/constants.ts - 在現有 STORAGE_KEYS 中新增
export const STORAGE_KEYS = {
  // ... 現有 keys
  
  // 使用者偏好
  USER_PREFERENCES: '@donna_ai/user_preferences',
  
  // 新增：使用者模式
  USER_MODE: '@donna_ai/user_mode' // 'business' | 'manager'
} as const;

// stores/authStore.ts - 擴展現有 store
interface AuthState {
  // ... 現有欄位
  mode: 'business' | 'manager';
  modeLoaded: boolean; // 新增：標記模式是否已從儲存載入
}
```

### 實作任務清單（按順序完成）

```yaml
任務 1: 移除統計列並加入工具列
修改 src/screens/personnel/TableView.tsx:
  - 移除第 129-153 行的統計容器
  - 在搜尋列下方加入 ToolbarIcons
  - 新增必要的狀態管理（篩選、多選等）
  - 整合相關的 Modal 元件

任務 2: 實作模式持久化 - Store 層
修改 src/stores/authStore.ts:
  - 新增 modeLoaded 狀態欄位
  - 新增 loadMode 非同步方法
  - 修改 toggleMode 加入 AsyncStorage 儲存
  - 新增 setMode 方法用於設定特定模式

任務 3: 應用程式啟動時載入模式
修改 App.tsx 或相關初始化檔案:
  - 在應用啟動時呼叫 loadMode
  - 確保模式載入完成後再渲染主要內容
  - 處理載入失敗的情況

任務 4: 整合工具列功能
確保人事頁面的工具列功能正常:
  - 篩選功能整合
  - 多選模式運作
  - 欄位設定功能
  - 匯出功能（如果需要）

任務 5: 測試和驗證
建立測試確保功能正常:
  - 模式持久化測試
  - 工具列功能測試
  - 整合測試
```

### 任務虛擬碼範例

```typescript
// 任務 1: TableView.tsx 修改
export function TableView({ teamMembers, searchQuery, refreshing, onRefresh }: TableViewProps) {
  // 新增工具列所需狀態
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  
  return (
    <View style={styles.container}>
      {/* 移除統計容器 */}
      
      {/* 新增工具列 */}
      <View style={styles.toolbarContainer}>
        <ToolbarIcons
          multiSelectMode={multiSelectMode}
          showSort={false}
          onFilterPress={() => setShowFilterModal(true)}
          onMultiSelectPress={() => {
            setMultiSelectMode(!multiSelectMode);
            if (!multiSelectMode) {
              setSelectedIds([]);
            }
          }}
          onColumnsPress={() => setShowColumnSettings(true)}
        />
      </View>
      
      {/* 表格內容 */}
      <DataTable
        // ... 現有 props
        multiSelectMode={multiSelectMode}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      />
      
      {/* Modal 元件 */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        // ... 其他 props
      />
    </View>
  );
}

// 任務 2: authStore.ts 修改
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/config/constants';

export const useAuthStore = create<AuthState>()(
  devtools((set, get) => ({
    // ... 現有狀態
    modeLoaded: false,
    
    // 載入儲存的模式
    loadMode: async () => {
      try {
        const savedMode = await AsyncStorage.getItem(STORAGE_KEYS.USER_MODE);
        if (savedMode === 'business' || savedMode === 'manager') {
          set({ mode: savedMode, modeLoaded: true });
        } else {
          set({ modeLoaded: true });
        }
      } catch (error) {
        console.error('載入模式失敗:', error);
        set({ modeLoaded: true });
      }
    },
    
    // 修改 toggleMode 加入儲存
    toggleMode: () => {
      const newMode = get().mode === 'business' ? 'manager' : 'business';
      set({ mode: newMode });
      // 儲存到 AsyncStorage
      AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, newMode).catch(error => {
        console.error('儲存模式失敗:', error);
      });
    },
    
    // 新增 setMode 方法
    setMode: (mode: 'business' | 'manager') => {
      set({ mode });
      AsyncStorage.setItem(STORAGE_KEYS.USER_MODE, mode).catch(error => {
        console.error('儲存模式失敗:', error);
      });
    },
  }))
);

// 任務 3: App.tsx 或初始化檔案
useEffect(() => {
  const initializeApp = async () => {
    // 載入模式設定
    await authStore.loadMode();
    
    // 其他初始化邏輯...
  };
  
  initializeApp();
}, []);
```

### 整合點
```yaml
PersonnelScreen:
  - 引入: FilterModal, ColumnSettingsModal, BatchActionsModal
  - 傳遞: 工具列相關 props 到 TableView
  
TableView:
  - 整合: 與 personnelStore 的篩選和排序功能
  - 同步: 多選模式與 DataTable 的選擇狀態
  
App 初始化:
  - 位置: App.tsx 或 _layout.tsx
  - 時機: 在渲染主要內容前載入模式
  - 載入畫面: 顯示 splash screen 直到模式載入完成
  
導航系統:
  - 檢查: MainTabNavigator 是否需要根據模式調整
  - 確保: 模式切換後導航狀態正確
```

## 驗證迴圈

### 層級 1: 語法和樣式檢查
```bash
# 首先執行這些命令 - 修正任何錯誤後再繼續
npm run lint                          # ESLint 檢查
npm run type-check                    # TypeScript 類型檢查

# 預期：無錯誤。如有錯誤，閱讀錯誤訊息並修正。
```

### 層級 2: 單元測試
```typescript
// 建立 src/screens/personnel/__tests__/TableView.test.tsx
describe('TableView with Toolbar', () => {
  it('應該顯示工具列而非統計列', () => {
    const { queryByText, getByTestId } = render(<TableView {...props} />);
    
    // 統計列不應存在
    expect(queryByText('總人數')).toBeNull();
    expect(queryByText('在職')).toBeNull();
    
    // 工具列應該存在
    expect(getByTestId('filter-button')).toBeTruthy();
    expect(getByTestId('multi-select-button')).toBeTruthy();
  });
  
  it('工具列功能應該正常運作', () => {
    const { getByTestId } = render(<TableView {...props} />);
    
    // 測試篩選按鈕
    fireEvent.press(getByTestId('filter-button'));
    expect(getByText('篩選')).toBeTruthy();
  });
});

// 建立 src/stores/__tests__/authStore.test.ts
describe('authStore mode persistence', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });
  
  it('應該從 AsyncStorage 載入模式', async () => {
    await AsyncStorage.setItem('userMode', 'manager');
    
    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.loadMode();
    });
    
    expect(result.current.mode).toBe('manager');
    expect(result.current.modeLoaded).toBe(true);
  });
  
  it('toggleMode 應該儲存到 AsyncStorage', async () => {
    const { result } = renderHook(() => useAuthStore());
    
    await act(async () => {
      result.current.toggleMode();
    });
    
    const savedMode = await AsyncStorage.getItem('userMode');
    expect(savedMode).toBe('manager');
  });
});
```

```bash
# 執行測試並迭代直到通過：
npm run test
# 如果失敗：閱讀錯誤，理解根本原因，修正程式碼，重新執行
```

### 層級 3: 整合測試
```bash
# 啟動開發環境
npm start

# 手動測試流程：
1. 開啟應用程式
2. 切換到主管模式
3. 導航到人事頁面 > 表格檢視
4. 確認沒有統計列
5. 測試工具列功能：
   - 點擊篩選按鈕
   - 切換多選模式
   - 開啟欄位設定
6. 關閉應用程式
7. 重新開啟應用程式
8. 確認仍在主管模式

# 預期：所有功能正常運作，模式被正確記住
```

## 最終驗證清單
- [ ] 統計列已從人事表格檢視移除
- [ ] 工具列顯示在正確位置
- [ ] 篩選功能正常運作
- [ ] 多選模式可以正常切換
- [ ] 欄位設定可以開啟和使用
- [ ] 模式在應用重啟後被正確恢復
- [ ] 模式切換時立即儲存
- [ ] 所有測試通過
- [ ] 無 TypeScript 錯誤
- [ ] 無 ESLint 警告

## 需要避免的反模式
- ❌ 不要在渲染期間呼叫 AsyncStorage（使用 useEffect）
- ❌ 不要忽略 AsyncStorage 的錯誤處理
- ❌ 不要假設模式已載入（檢查 modeLoaded 狀態）
- ❌ 不要重複實作工具列邏輯（重用現有元件）
- ❌ 不要忘記清理多選狀態
- ❌ 不要硬編碼模式值（使用類型定義）

## 外部函式庫建議

專案已包含所需的所有函式庫：
- **@react-native-async-storage/async-storage**：用於持久化儲存
- **zustand**：狀態管理（authStore）
- 所有工具列相關元件已存在

## 最佳實踐參考
- AsyncStorage 最佳實踐：https://react-native-async-storage.github.io/async-storage/docs/advanced/performance
- Zustand 持久化模式：https://github.com/pmndrs/zustand#persist-middleware

---

## PRP 信心評分：9/10

降分原因：
- 需要確保所有工具列功能在人事頁面正確運作可能需要額外調整

成功關鍵：
- 清晰的實作步驟
- 可重用現有元件
- 明確的測試策略