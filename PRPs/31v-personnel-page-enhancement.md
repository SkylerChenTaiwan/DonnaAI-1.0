# PRP-31: 人事管理頁面增強

name: "人事管理頁面增強 - 樹狀圖與表格雙檢視"
description: |

## 目標
建立強大的人事管理頁面，包含兩種檢視模式：
1. **樹狀圖檢視**：視覺化組織架構，支援拖放調整
2. **表格檢視**：詳細的業務人員資料管理
同時整合使用狀態追蹤和權限管理功能。

## 為什麼
- **商業價值**：提升管理層對組織結構的掌握度，優化人員配置
- **整合現有功能**：擴展現有的 PersonnelScreen，加入更豐富的管理功能
- **解決問題**：當前只有簡單表格檢視，無法直觀理解組織層級和即時狀態

## 功能需求

### 成功標準
- [ ] 樹狀圖能清楚顯示組織階層關係
- [ ] 拖放功能流暢，支援組織架構調整
- [ ] 表格檢視顯示完整的業務資訊和使用狀態
- [ ] 權限設定介面直觀易用
- [ ] 大量人員資料（>100人）渲染效能良好
- [ ] 行動裝置上操作體驗順暢

## 所有必要的上下文

### 文檔與參考資料
```yaml
# 必讀 - 實作時需要參考的資源
- file: src/screens/personnel/PersonnelScreen.tsx
  why: 現有人事頁面實作，需要擴展其功能
  
- file: src/screens/database/DatabaseScreen.tsx
  why: 標籤切換模式參考，包含 View Toggle 實作
  pattern: 第 124-142 行的標籤切換邏輯
  
- file: src/components/common/DataTable.tsx
  why: 現有表格元件，支援排序、篩選、多選
  critical: 使用 FlashList 優化長列表效能
  
- file: src/services/firebase/permissions-v2.ts
  why: 權限系統實作，包含角色檢查和快取機制
  
- file: src/theme/DesignSystem.ts
  why: 統一的設計系統，確保 UI 一致性

- url: https://github.com/chenglou/react-native-draggable-tree
  why: React Native 樹狀圖拖放元件參考
  section: Tree component with drag and drop
  
- url: https://react-native-svg.github.io/react-native-svg/
  why: SVG 繪製組織架構連接線
  section: Path and Line elements
  
- url: https://docs.swmansion.com/react-native-reanimated/
  why: 動畫效果實作，提升拖放體驗
  section: Gesture Handler integration
```

### 現有程式碼樹狀結構
```bash
./src
├── screens
│   └── personnel
│       └── PersonnelScreen.tsx        # 現有人事頁面
├── components
│   ├── common
│   │   ├── DataTable.tsx             # 表格元件
│   │   ├── EditableDataTable.tsx     # 可編輯表格
│   │   └── Layout.tsx                # 頁面佈局
│   └── ui
│       └── TouchableOpacity.tsx      # 觸控元件
├── services
│   └── firebase
│       ├── permissions-v2.ts         # 權限系統
│       └── userService.ts            # 使用者服務
├── stores
│   ├── userStore.ts                  # 使用者狀態管理
│   └── teamStore.ts                  # 團隊狀態管理
└── types
    ├── user.ts                       # 使用者類型定義
    └── organization.ts               # 組織類型定義
```

### 期望的程式碼樹狀結構（新增檔案）
```bash
./src
├── screens
│   └── personnel
│       ├── PersonnelScreen.tsx        # 主頁面（修改）
│       ├── PersonnelTabs.tsx          # 標籤切換元件（新增）
│       ├── TreeView.tsx               # 樹狀圖檢視（新增）
│       └── TableView.tsx              # 表格檢視（新增）
├── components
│   ├── personnel
│   │   ├── OrgChart.tsx              # 組織圖元件（新增）
│   │   ├── OrgNode.tsx               # 組織節點元件（新增）
│   │   ├── DragDropHandler.tsx       # 拖放處理器（新增）
│   │   ├── StatusIndicator.tsx       # 狀態指示器（新增）
│   │   ├── PermissionBadge.tsx       # 權限標籤（新增）
│   │   └── ActivityChart.tsx         # 活動圖表（新增）
│   └── modals
│       ├── PermissionModal.tsx        # 權限設定彈窗（新增）
│       └── ActivityModal.tsx          # 活動詳情彈窗（新增）
├── stores
│   └── personnelStore.ts              # 人事狀態管理（新增）
└── hooks
    └── useOrgStructure.ts             # 組織結構 Hook（新增）
```

### 已知的程式庫限制和注意事項
```typescript
// 重要：FlashList 在動態高度項目時需要特殊處理
// 參考：src/components/common/DataTable.tsx 第 89-95 行

// 重要：Firebase 權限檢查有快取，更新後需要清除
// 參考：src/services/firebase/permissions-v2.ts 第 45-50 行

// 重要：React Native 不支援原生 HTML 拖放 API
// 需要使用 PanGestureHandler 實作拖放功能

// 重要：SVG 在 React Native 需要使用 react-native-svg
// 不能使用標準的 SVG 元素
```

## 實作藍圖

### 資料模型和結構

擴展現有的使用者和組織模型：
```typescript
// types/personnel.ts
export interface EnhancedUser extends User {
  // 使用狀態
  isOnline?: boolean;
  lastActiveAt?: Date;
  activityStats?: {
    dailyLogins: number[];    // 30天登入記錄
    totalActions: number;     // 總操作次數
    lastActions: string[];    // 最近操作記錄
  };
  
  // 組織結構
  reportingTo?: string;       // 直屬主管 ID
  subordinates?: string[];    // 下屬 ID 列表
  level?: number;            // 組織層級
  
  // 詳細權限
  permissions?: {
    modules: string[];        // 可訪問模組
    actions: string[];        // 可執行動作
    dataAccess: 'own' | 'team' | 'organization';
    customPermissions?: Record<string, boolean>;
  };
}

// types/organization.ts
export interface OrgNode {
  id: string;
  user: EnhancedUser;
  children: OrgNode[];
  expanded?: boolean;
  position?: { x: number; y: number };
}
```

### 實作任務清單（按順序完成）

```yaml
任務 1: 建立基礎架構和標籤切換
修改 src/screens/personnel/PersonnelScreen.tsx:
  - 找到模式: "export default function PersonnelScreen"
  - 保留現有邏輯但改為條件渲染
  - 新增標籤切換狀態管理

建立 src/screens/personnel/PersonnelTabs.tsx:
  - 參考模式: src/screens/database/DatabaseScreen.tsx 第 124-142 行
  - 修改為: TreeView 和 TableView 切換
  - 保持相同的動畫效果

任務 2: 實作表格檢視增強
建立 src/screens/personnel/TableView.tsx:
  - 複製現有 PersonnelScreen 的表格邏輯
  - 新增欄位: 使用狀態、權限等級、管理團隊
  - 整合 StatusIndicator 和 PermissionBadge 元件

建立 src/components/personnel/StatusIndicator.tsx:
  - 顯示線上/離線狀態
  - 使用 DesignSystem 顏色
  - 包含最後活躍時間

任務 3: 建立樹狀圖基礎
建立 src/screens/personnel/TreeView.tsx:
  - 使用 react-native-svg 繪製
  - 整合 OrgChart 元件
  - 處理滾動和縮放

建立 src/components/personnel/OrgChart.tsx:
  - 遞迴渲染組織節點
  - 計算節點位置
  - 繪製連接線

任務 4: 實作組織節點
建立 src/components/personnel/OrgNode.tsx:
  - 顯示使用者資訊卡片
  - 展開/收合功能
  - 整合狀態指示器

任務 5: 新增拖放功能
建立 src/components/personnel/DragDropHandler.tsx:
  - 使用 PanGestureHandler
  - 實作拖動預覽
  - 處理放置邏輯

任務 6: 實作權限管理
建立 src/components/modals/PermissionModal.tsx:
  - 視覺化權限矩陣
  - 權限範本選擇
  - 整合 permissions-v2.ts

任務 7: 新增活動追蹤
建立 src/components/modals/ActivityModal.tsx:
  - 使用 victory-native 顯示圖表
  - 顯示活動日誌
  - 整合 Firebase 資料

任務 8: 狀態管理整合
建立 src/stores/personnelStore.ts:
  - 管理人員資料狀態
  - 處理組織結構更新
  - 整合權限變更

任務 9: 效能優化
優化 src/screens/personnel/TreeView.tsx:
  - 實作虛擬化渲染
  - 添加漸進式載入
  - 優化重繪邏輯

任務 10: 測試和文檔
建立測試檔案:
  - 元件單元測試
  - 整合測試
  - 更新文檔
```

### 任務虛擬碼範例

```typescript
// 任務 1: PersonnelTabs.tsx
export function PersonnelTabs() {
  // 模式：遵循 DatabaseScreen 的標籤切換模式
  const [activeView, setActiveView] = useState<'tree' | 'table'>('table');
  
  // 重要：使用 Animated API 實現平滑過渡
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  return (
    <View style={styles.container}>
      {/* 模式：使用 TouchableOpacity 實現標籤 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity onPress={() => switchView('tree')}>
          {/* 使用 DesignSystem.colors */}
        </TouchableOpacity>
      </View>
      
      {/* 條件渲染不同檢視 */}
      {activeView === 'tree' ? <TreeView /> : <TableView />}
    </View>
  );
}

// 任務 4: OrgNode.tsx
export function OrgNode({ node, onDrag }: Props) {
  // 關鍵：整合 PanGestureHandler 實現拖放
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      // 模式：參考 react-native-reanimated 範例
      ctx.startX = node.position.x;
    },
    onActive: (event, ctx) => {
      // 重要：使用 worklet 確保在 UI 線程執行
      'worklet';
      node.position.x = ctx.startX + event.translationX;
    }
  });
  
  // 模式：使用現有的卡片樣式
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <StatusIndicator user={node.user} />
        {/* 遵循現有的使用者資訊顯示模式 */}
      </Animated.View>
    </PanGestureHandler>
  );
}
```

### 整合點
```yaml
路由:
  - 位置: src/navigation/MainTabNavigator.tsx
  - 確保: PersonnelScreen 已在管理員模式下可見
  
Firebase:
  - 集合: users/{userId}/activity
  - 新增: 活動追蹤子集合
  - 索引: 在 lastActiveAt 上建立索引
  
權限:
  - 檔案: src/services/firebase/permissions-v2.ts  
  - 新增: canEditOrgStructure 權限檢查
  - 模式: 遵循現有的權限檢查模式
  
狀態管理:
  - 整合: 使用 zustand 建立 personnelStore
  - 模式: 參考 userStore.ts 的實作方式
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
// 建立 src/screens/personnel/__tests__/PersonnelTabs.test.tsx
describe('PersonnelTabs', () => {
  it('應該正確切換檢視', () => {
    const { getByText } = render(<PersonnelTabs />);
    fireEvent.press(getByText('樹狀圖'));
    expect(getByTestId('tree-view')).toBeTruthy();
  });
  
  it('應該保持標籤狀態', () => {
    // 測試標籤切換後資料是否保留
  });
});

// 建立 src/components/personnel/__tests__/OrgNode.test.tsx
describe('OrgNode', () => {
  it('應該顯示使用者資訊', () => {
    const mockUser = { name: '測試使用者', role: 'manager' };
    const { getByText } = render(<OrgNode user={mockUser} />);
    expect(getByText('測試使用者')).toBeTruthy();
  });
  
  it('應該處理拖放事件', () => {
    // 測試拖放功能
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
1. 登入管理員帳號
2. 導航到人事頁面
3. 測試標籤切換
4. 測試樹狀圖拖放
5. 測試權限設定
6. 檢查效能（滾動流暢度）

# 預期：所有功能正常運作，無崩潰或卡頓
```

## 最終驗證清單
- [ ] 所有測試通過：`npm run test`
- [ ] 無 lint 錯誤：`npm run lint`
- [ ] 無類型錯誤：`npm run type-check`
- [ ] 樹狀圖正確顯示組織層級
- [ ] 拖放功能在觸控裝置上運作良好
- [ ] 大量資料（>100筆）效能良好
- [ ] 權限變更即時生效
- [ ] 錯誤處理完善，無崩潰情況
- [ ] 符合現有設計系統風格

## 需要避免的反模式
- ❌ 不要建立新的設計模式，使用現有的 DesignSystem
- ❌ 不要在渲染函數中進行複雜計算，使用 useMemo
- ❌ 不要忽略 FlashList 的效能優化建議
- ❌ 不要直接操作 DOM，使用 React Native 元件
- ❌ 不要硬編碼顏色值，使用 theme 系統
- ❌ 不要忽略觸控目標大小（最小 44x44）
- ❌ 不要在主線程執行繁重計算，使用 worklet

## 外部函式庫建議

### 樹狀圖和拖放
1. **react-native-draggable-flatlist** (如果要簡單列表拖放)
   - 文檔：https://github.com/computerjazz/react-native-draggable-flatlist
   - 適合：簡單的垂直列表拖放
   
2. **自行實作使用 react-native-reanimated + gesture-handler**
   - 更靈活，適合複雜的樹狀圖拖放
   - 已在專案中安裝

### 圖表顯示
- **victory-native**：已安裝，用於活動統計圖表

### 最佳實踐參考
- React Native 拖放範例：https://docs.swmansion.com/react-native-gesture-handler/docs/examples
- 組織圖最佳實踐：https://www.nngroup.com/articles/organization-charts/

---

## PRP 信心評分：8/10

降分原因：
- 樹狀圖拖放在 React Native 較複雜，可能需要多次迭代
- 大量資料的效能優化可能需要額外調整

成功關鍵：
- 充分利用現有元件和模式
- 分階段實施，先完成基礎功能
- 持續測試效能，及早發現問題