# PRP-74: 完整重寫 Notion 風格資料庫元件

## 執行摘要
從頭建立一個 100% 複製 Notion 資料庫功能的 React Native Web 元件，徹底解決現有實作的限制。

## 背景與動機
### 現況問題
- Glide Data Grid 限制：編輯行為與 Notion 差異很大，樣式自訂困難
- 使用者反饋：「輸入方式跟UI都還跟 Notion 有很大分別」
- 技術債務：每次修改都需要大量 workaround，維護成本高

### 目標
- 100% 還原 Notion 資料庫的視覺和互動體驗
- 完全控制每個實作細節
- 建立可長期維護的架構

## 技術架構

### 核心技術棧
```typescript
// 基礎架構
- React Native Web 相容元件
- TypeScript 嚴格類型
- 虛擬滾動：@tanstack/virtual 或自建
- 狀態管理：useReducer + Context
- 樣式系統：StyleSheet.create + CSS-in-JS

// 資料層
- Firebase Firestore（現有整合）
- Debounced auto-save（500ms）
- 離線支援與同步
```

### 元件架構
```typescript
<NotionDatabase>
  <DatabaseProvider>
    <DatabaseToolbar />
    <VirtualTable>
      <TableHeader>
        <HeaderCell />
      </TableHeader>
      <TableBody>
        <VirtualRow>
          <TableCell>
            <CellStateMachine>
              <CellRenderer />
              <CellEditor />
            </CellStateMachine>
          </TableCell>
        </VirtualRow>
      </TableBody>
    </VirtualTable>
  </DatabaseProvider>
</NotionDatabase>
```

## 實作藍圖

### Phase 1: 核心基礎設施（3天）

#### 1.1 虛擬滾動系統
```typescript
// src/components/database/notion/VirtualScroller.tsx
interface VirtualScrollerProps {
  items: any[];
  rowHeight: number;
  overscan?: number; // 預渲染額外行數
  onScroll?: (scrollTop: number) => void;
}

// 關鍵性能優化
- 使用 RAF (requestAnimationFrame) 優化滾動
- 實作 overscan 預渲染
- 支援動態行高
```

#### 1.2 儲存格狀態機
```typescript
// src/components/database/notion/CellStateMachine.tsx
type CellState = 'default' | 'hover' | 'selected' | 'editing';

interface CellStateContext {
  state: CellState;
  data: any;
  column: ColumnConfig;
  rowId: string;
}

// 狀態轉換規則
- default -> hover (onMouseEnter)
- hover -> selected (onClick)
- selected -> editing (onDoubleClick/F2)
- editing -> selected (onBlur/Enter/Tab)
```

#### 1.3 基礎表格結構
```typescript
// src/components/database/notion/NotionTable.tsx
- 實作基本表格佈局
- 整合虛擬滾動
- 建立欄位系統
- 實作基本互動
```

### Phase 2: 編輯器系統（3天）

#### 2.1 編輯器工廠
```typescript
// src/components/database/notion/editors/EditorFactory.tsx
interface EditorProps {
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  column: ColumnConfig;
}

// 編輯器類型
- TextEditor: 基本文字輸入
- NumberEditor: 數字輸入與格式化
- DateEditor: 日期選擇器（支援自然語言）
- SelectEditor: 下拉選單（支援搜尋）
- MultiSelectEditor: 多選標籤
- RelationEditor: 關聯選擇器
```

#### 2.2 內嵌編輯實作
- 編輯框直接覆蓋儲存格
- 2px 藍色邊框 (#0a84ff)
- 自動調整高度
- 保持原位置不偏移

### Phase 3: 鍵盤導航系統（2天）

#### 3.1 導航管理器
```typescript
// src/components/database/notion/KeyboardNavigationManager.tsx
interface NavigationContext {
  currentCell: { row: number; col: number };
  selection: CellSelection;
  editingCell: { row: number; col: number } | null;
}

// 快捷鍵映射
const keyBindings = {
  'ArrowUp': navigateUp,
  'ArrowDown': navigateDown,
  'ArrowLeft': navigateLeft,
  'ArrowRight': navigateRight,
  'Tab': navigateNext,
  'Shift+Tab': navigatePrevious,
  'Enter': confirmAndMoveDown,
  'F2': enterEditMode,
  'Escape': exitEditMode,
  'Ctrl+A': selectAll,
  'Ctrl+C': copy,
  'Ctrl+V': paste,
};
```

### Phase 4: 進階功能（2天）

#### 4.1 拖放系統
- 欄位拖動重排
- 列拖動重排
- 視覺反饋（拖動陰影）

#### 4.2 批量操作
- 多選支援
- 批量編輯
- 批量刪除

#### 4.3 效能優化
- 增量渲染
- 懶加載
- 記憶化優化

## 關鍵實作細節

### 視覺規格（來自研究文檔）
```javascript
// 來自 docs/notion-behavior-study/notion-measurements.json
const colors = {
  hover: '#F7F6F3',
  selected: '#0A84FF',
  border: '#E9E9E7',
  text: '#37352F'
};

const spacing = {
  cell: { paddingH: 8, paddingV: 6, height: 36 },
  header: { height: 36 }
};

const animations = {
  background: '150ms ease',
  // 邊框無動畫，立即顯示
};
```

### Firebase 整合
```typescript
// 使用現有的 Firebase 服務
import { updateCustomer } from '@/services/firebase/customers';
import { updateRecord } from '@/services/firebase/records';
import { updateTask } from '@/services/firebase/tasks';
import { useDebouncedUpdate } from '@/hooks/useDebouncedUpdate';

// 自動儲存實作
const { debouncedUpdate } = useDebouncedUpdate(
  async (rowId, columnKey, value) => {
    switch (activeTab) {
      case 'customers':
        await updateCustomer(rowId, { [columnKey]: value });
        break;
      // ...
    }
  }, 
  500 // 500ms debounce
);
```

### 錯誤處理策略
```typescript
// 全域錯誤邊界
<ErrorBoundary fallback={<DatabaseErrorFallback />}>
  <NotionDatabase />
</ErrorBoundary>

// 儲存格層級錯誤處理
try {
  await debouncedUpdate(rowId, columnKey, value);
} catch (error) {
  // 顯示錯誤提示
  showToast('error', '儲存失敗，請重試');
  // 回滾本地狀態
  revertCellValue(rowId, columnKey);
}
```

## 實作任務清單（按順序執行）

### Phase 1 完成狀態
- ✅ Phase 1 已於 2025-08-02 完成
- 已實作基礎架構：VirtualScroller、CellStateMachine、TableHeader、TableRow、TableCell
- 已整合到 DatabaseScreen 並修復跨平台相容性問題
- 下一步：開始 Phase 2 編輯器系統開發

### 準備工作
1. [x] 建立新的目錄結構 `src/components/database/notion/`
2. [x] 移除對 Glide Data Grid 的依賴
3. [x] 設定測試環境

### Phase 1 任務
4. [x] 實作 VirtualScroller 元件
5. [x] 實作 CellStateMachine
6. [x] 建立 NotionTable 基礎結構
7. [x] 實作 TableHeader 和 HeaderCell
8. [x] 實作 TableRow 和 TableCell
9. [x] 整合虛擬滾動與表格

### Phase 2 任務
10. [ ] 建立 EditorFactory
11. [ ] 實作 TextEditor
12. [ ] 實作 NumberEditor
13. [ ] 實作 DateEditor
14. [ ] 實作 SelectEditor
15. [ ] 實作 MultiSelectEditor
16. [ ] 整合編輯器與儲存格

### Phase 3 任務
17. [ ] 實作 KeyboardNavigationManager
18. [ ] 實作方向鍵導航
19. [ ] 實作 Tab 導航
20. [ ] 實作編輯模式快捷鍵
21. [ ] 實作複製貼上功能

### Phase 4 任務
22. [ ] 實作拖放系統
23. [ ] 實作批量操作
24. [ ] 效能優化與測試
25. [ ] 整合到 DatabaseScreen

## 驗證閘門

### 語法與樣式檢查
```bash
# TypeScript 編譯檢查
npm run tsc --noEmit

# ESLint 檢查
npm run lint

# 格式化檢查
npm run prettier --check "src/components/database/notion/**/*.{ts,tsx}"
```

### 單元測試
```bash
# 執行新元件的測試
npm test -- src/components/database/notion/__tests__

# 測試覆蓋率
npm test -- --coverage src/components/database/notion
```

### 視覺驗證
```bash
# 啟動本地開發環境
npm start

# 視覺對比檢查清單
- [ ] 儲存格懸停效果與 Notion 一致
- [ ] 選中狀態藍色邊框正確
- [ ] 編輯框位置和樣式正確
- [ ] 動畫過渡時間符合規格
```

### 效能基準
```javascript
// 效能測試腳本
// src/components/database/notion/__tests__/performance.test.tsx
- 渲染 1000 行的時間 < 100ms
- 滾動 FPS >= 60
- 點擊到選中延遲 < 16ms
- 雙擊到編輯延遲 < 50ms
```

## 外部參考資源

### 虛擬滾動
- TanStack Virtual 文檔：https://tanstack.com/virtual/v3
- React Window 比較：https://github.com/bvaughn/react-window

### Notion 風格實作
- react-notion-table：https://github.com/opa-oz/react-notion-table
- BlockNote 編輯器：https://www.blocknotejs.org/

### React 18 優化
- 並發特性指南：https://react.dev/blog/2022/03/29/react-v18
- useTransition 優化滾動：https://react.dev/reference/react/useTransition

## 風險與緩解措施

### 技術風險
1. **虛擬滾動複雜度**
   - 緩解：先用 TanStack Virtual，後續再考慮自建
   
2. **跨平台相容性**
   - 緩解：持續在 Web/iOS/Android 測試
   
3. **效能瓶頸**
   - 緩解：從第一天就實作效能監控

### 時程風險
1. **預估時間過於樂觀**
   - 緩解：每日 standup 追蹤進度
   
2. **未知技術障礙**
   - 緩解：保留 20% buffer 時間

## 成功標準
1. **功能完整性**：100% 實作 Notion 資料庫功能
2. **視覺一致性**：與 Notion 無法區分
3. **效能達標**：所有操作響應時間符合規格
4. **程式碼品質**：測試覆蓋率 > 80%

## 實作信心評分：8/10

### 評分理由
- (+) 明確的技術規格和視覺規格
- (+) 完整的實作藍圖和任務分解
- (+) 現有的 Firebase 整合可重用
- (+) 清晰的錯誤處理策略
- (-) 虛擬滾動實作可能有挑戰
- (-) 完整的鍵盤導航系統較複雜

### 建議
1. 先實作 MVP（基本表格 + 文字編輯）
2. 每日部署測試，及時獲得反饋
3. 保持模組化，方便後續擴展
4. 重視測試，確保穩定性

---

*PRP-74 | 建立日期：2025-08-02 | 預估時間：10天 | 優先級：高*