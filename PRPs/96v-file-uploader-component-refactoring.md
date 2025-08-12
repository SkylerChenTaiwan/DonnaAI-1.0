# PRP-96: 檔案上傳元件標準化重構

## Goal
重構 `UserFileUploader.tsx`（1,373 行）為模組化、可維護、跨平台一致的元件架構，運用 PRP-94 的 Adaptive Components 和 PRP-95 的統一樣式系統，作為大型元件重構的示範案例。

## Why
- **單體檔案過度複雜**: 1,373 行程式碼，違反單一職責原則，難以維護和測試
- **跨平台判斷分散**: 4 處 Platform.OS 判斷，HTML 元素混用，邏輯複雜
- **樣式系統不一致**: 內聯樣式佔比高，未使用統一的 DesignSystem
- **測試覆蓋不足**: 大型元件難以進行單元測試，功能變更風險高
- **用戶體驗關鍵**: 檔案上傳是用戶首次接觸的功能，需要最佳化體驗
- **重構示範價值**: 為後續 PRP-97/98 的大檔案重構建立最佳實踐模式

## What
將單體元件重構為模組化、可測試、高效能的元件架構：

1. **元件分解策略** - 依功能職責拆分為 8-10 個子元件
2. **Adaptive Components 應用** - 使用 PRP-94 建立的跨平台統一介面
3. **統一樣式系統** - 採用 PRP-95 的 DesignSystem 和 styled-components
4. **狀態管理優化** - 使用 Context 和自定義 hooks 管理複雜狀態
5. **效能優化** - 實現虛擬化、lazy loading、記憶化優化
6. **完整測試覆蓋** - 單元測試、整合測試、視覺回歸測試

### Success Criteria
- [ ] 元件行數從 1,373 行 → <300 行（主元件）
- [ ] 拆分為 8-10 個職責清晰的子元件，每個 <150 行
- [ ] Platform.OS 判斷從 4 處 → 0 處（全部使用 Adaptive Components）
- [ ] 測試覆蓋率 >90%，包含所有子元件和整合測試
- [ ] 效能提升：大檔案載入時間減少 30%，記憶體使用優化
- [ ] 100% 使用 DesignSystem，0 處硬編碼樣式

## All Needed Context

### Documentation & References
```yaml
- url: https://react.dev/learn/thinking-in-react
  why: 元件分解和狀態設計的 React 官方指南
  
- url: https://kentcdodds.com/blog/compound-components-with-react-hooks
  why: Compound Components 模式，適合複雜元件重構
  
- url: https://web.dev/file-system-access/
  why: Web File System Access API，現代瀏覽器檔案處理最佳實踐

- url: https://github.com/react-dropzone/react-dropzone
  why: 拖放功能實現參考，跨平台檔案選擇最佳實踐

- file: /src/components/users/stages/UserFileUploader.tsx
  why: 當前實現，1,373 行巨型元件，需要完全重構
  critical: lines 66-100 (檔案選擇邏輯), 523/570/623 (Platform.OS 判斷), 1200-1373 (樣式定義)
  
- file: /src/components/adaptive/core/AdaptiveInput.tsx (PRP-94)
  why: 跨平台輸入元件，檔案選擇器的基礎元件
  
- file: /src/theme/styled/StyledComponentFactory.ts (PRP-95)  
  why: 統一樣式元件生成器，取代內聯樣式

- file: /src/tests/services/import/AssignmentEngine.test.ts
  why: 現有測試模式，vi.mock 和測試資料準備的參考
```

### Current Codebase tree
```bash
src/components/users/stages/
└── UserFileUploader.tsx        # 1,373 行巨型元件（需要重構）
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/components/users/file-upload/
├── index.ts                           # 統一匯出點
├── UserFileUploader.tsx               # 🔄 主要協調元件 (<300 行)
├── hooks/                             # 🆕 自定義 hooks
│   ├── useFileUpload.ts              # 檔案上傳邏輯和狀態管理
│   ├── useFileMerging.ts             # 檔案合併邏輯
│   ├── useFileValidation.ts          # 檔案驗證和錯誤處理
│   └── useFieldTypeDetection.ts     # 欄位類型自動檢測
├── components/                        # 🆕 子元件
│   ├── FileDropZone.tsx              # 拖放區域和檔案選擇
│   ├── FileList.tsx                  # 已上傳檔案列表
│   ├── FileItem.tsx                  # 單個檔案項目顯示
│   ├── FileMergeConfig.tsx           # 檔案合併配置介面  
│   ├── KeyFieldSelector.tsx          # 關鍵欄位選擇器
│   ├── FieldTypeEditor.tsx           # 欄位類型編輯器
│   ├── MergePreview.tsx              # 合併預覽表格
│   └── UploadProgress.tsx            # 上傳進度指示器
├── utils/                             # 🆕 工具函數
│   ├── fileProcessing.ts             # 檔案處理邏輯
│   ├── csvParser.ts                  # CSV 解析工具  
│   ├── fileValidation.ts             # 檔案驗證規則
│   └── mergeStrategies.ts            # 合併策略實現
├── types/                             # 🆕 型別定義
│   ├── fileUpload.ts                 # 檔案上傳相關型別
│   ├── mergeConfig.ts                # 合併配置型別
│   └── fieldTypes.ts                 # 欄位類型定義
├── styles/                            # 🆕 樣式定義
│   ├── FileUploadStyles.ts           # 使用 StyledComponentFactory
│   └── animations.ts                 # 動畫和過渡效果
└── __tests__/                         # 🆕 測試檔案
    ├── UserFileUploader.test.tsx     # 整合測試
    ├── hooks/                        # Hook 測試
    │   ├── useFileUpload.test.ts     
    │   ├── useFileMerging.test.ts    
    │   └── useFileValidation.test.ts 
    ├── components/                   # 子元件測試
    │   ├── FileDropZone.test.tsx    
    │   ├── FileList.test.tsx        
    │   └── FileMergeConfig.test.tsx 
    └── utils/                        # 工具函數測試
        ├── fileProcessing.test.ts    
        └── csvParser.test.ts         
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Expo DocumentPicker 在 Web 和 Native 的差異
// Web: 返回 FileList，Native: 返回 asset objects
// 需要統一的檔案處理介面

// CRITICAL: Papa Parse 在大檔案處理的記憶體問題  
// 大於 10MB 的 CSV 檔案需要使用 streaming parser
// 避免 UI 阻塞，使用 Web Workers 或分段處理

// CRITICAL: React Native Web 的拖放支援限制
// HTML5 drag-drop API 在 RN Web 中的實現不完整
// 需要使用 react-dropzone 或自定義實現

// CRITICAL: 檔案讀取的非同步處理
// FileReader API 是非同步的，需要 Promise 包裝
// 大檔案處理需要進度回調和取消機制

// CRITICAL: 現有的 fileMerger 工具函數
// /src/components/import/utils/fileMerger.ts 已存在複雜邏輯
// 重構時需要保持 API 相容性，避免破壞其他使用者
```

## Implementation Blueprint

### Data models and structure
建立清晰的資料模型和狀態管理結構。

```typescript
// 檔案上傳狀態型別
interface FileUploadState {
  files: UploadedFile[];
  processing: boolean;
  progress: UploadProgress;
  errors: FileError[];
  mergeConfig: MergeConfig | null;
  previewData: MergePreview | null;
}

// 檔案合併配置
interface MergeConfig {
  strategy: MergeStrategy;
  keyFields: Record<string, string>;
  fieldTypes: Record<string, FieldType>;
  includeAllFiles: boolean;
}

// Hook 返回值型別
interface UseFileUploadReturn {
  state: FileUploadState;
  actions: FileUploadActions;
  computed: ComputedValues;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: 建立新的檔案結構和基礎型別
CREATE src/components/users/file-upload/ directory structure:
  - SETUP 完整的目錄結構（如上面 desired tree）
  - PREPARE package exports 和 TypeScript 配置

CREATE src/components/users/file-upload/types/:
  - DEFINE fileUpload.ts 檔案上傳相關型別
  - DEFINE mergeConfig.ts 合併配置型別  
  - DEFINE fieldTypes.ts 欄位類型枚舉
  - ENSURE 與現有 /src/types/ 的相容性

CREATE src/components/users/file-upload/index.ts:
  - EXPORT 所有公共元件和 hooks
  - MAINTAIN 與現有 UserFileUploader 的 API 相容性

Task 2: 抽取和重構核心 Hooks
CREATE src/components/users/file-upload/hooks/useFileUpload.ts:
  - EXTRACT 檔案上傳狀態管理邏輯
  - IMPLEMENT useReducer 管理複雜狀態
  - HANDLE 錯誤處理和重試邏輯
  - OPTIMIZE 使用 useMemo 和 useCallback

CREATE src/components/users/file-upload/hooks/useFileMerging.ts:
  - EXTRACT 檔案合併邏輯
  - INTEGRATE 現有 fileMerger utilities
  - SUPPORT 不同合併策略
  - ADD 預覽功能

CREATE src/components/users/file-upload/hooks/useFileValidation.ts:
  - EXTRACT 檔案驗證邏輯
  - IMPLEMENT 檔案大小、類型、格式檢查
  - PROVIDE 詳細錯誤訊息
  - SUPPORT 自定義驗證規則

CREATE src/components/users/file-upload/hooks/useFieldTypeDetection.ts:
  - EXTRACT 欄位類型自動檢測邏輯
  - ANALYZE CSV 內容推斷資料類型
  - SUPPORT 用戶手動調整
  - OPTIMIZE 大檔案的處理效能

Task 3: 建立核心工具函數
CREATE src/components/users/file-upload/utils/fileProcessing.ts:
  - EXTRACT 檔案處理邏輯
  - UNIFY Expo DocumentPicker 的跨平台差異
  - IMPLEMENT 進度追蹤和取消機制
  - ADD 檔案快取和去重功能

CREATE src/components/users/file-upload/utils/csvParser.ts:
  - WRAP Papa Parse 提供統一介面
  - IMPLEMENT streaming parse 處理大檔案
  - ADD 編碼檢測和轉換
  - HANDLE 錯誤修復和資料清理

CREATE src/components/users/file-upload/utils/fileValidation.ts:
  - IMPLEMENT 檔案驗證規則引擎
  - SUPPORT MIME type 檢測
  - ADD 惡意檔案掃描（基本）
  - PROVIDE 詳細驗證報告

Task 4: 建立樣式系統（使用 PRP-95 基礎）
CREATE src/components/users/file-upload/styles/FileUploadStyles.ts:
  - USE StyledComponentFactory 建立樣式元件
  - ELIMINATE 所有內聯樣式和硬編碼顏色
  - IMPLEMENT responsive design
  - ADD 動畫和微互動

CREATE src/components/users/file-upload/styles/animations.ts:
  - DEFINE 檔案上傳相關動畫
  - IMPLEMENT drag-and-drop 視覺回饋
  - ADD loading 和 progress 動畫
  - OPTIMIZE 效能，避免不必要的重繪

Task 5: 建立子元件（使用 PRP-94 Adaptive Components）
CREATE src/components/users/file-upload/components/FileDropZone.tsx:
  - USE AdaptiveView 替代 View/div
  - IMPLEMENT 拖放功能和檔案選擇
  - SUPPORT 多檔案和單檔案模式
  - ADD 視覺化拖放狀態

CREATE src/components/users/file-upload/components/FileList.tsx:
  - USE AdaptiveView 和 AdaptiveText
  - IMPLEMENT 檔案列表顯示和管理
  - SUPPORT 檔案重新排序
  - ADD 批量操作功能

CREATE src/components/users/file-upload/components/FileItem.tsx:
  - DISPLAY 單個檔案資訊和操作
  - IMPLEMENT 檔案預覽功能
  - SUPPORT 檔案刪除和重新上傳
  - ADD 檔案處理狀態指示

CREATE src/components/users/file-upload/components/FileMergeConfig.tsx:
  - USE AdaptiveSelect 替代原生 select
  - IMPLEMENT 合併策略設定介面
  - SUPPORT 關鍵欄位選擇
  - ADD 合併規則預覽

CREATE src/components/users/file-upload/components/KeyFieldSelector.tsx:
  - REPLACE 原有的跨平台判斷邏輯
  - USE Adaptive Components 統一介面
  - IMPLEMENT 多選和單選模式
  - ADD 自動推薦功能

CREATE src/components/users/file-upload/components/FieldTypeEditor.tsx:
  - IMPLEMENT 欄位類型編輯介面
  - SUPPORT 批量類型變更
  - ADD 類型檢測建議
  - OPTIMIZE 大表格的效能

Task 6: 重構主要協調元件
REFACTOR src/components/users/file-upload/UserFileUploader.tsx:
  - REDUCE 主元件到 <300 行
  - USE 新建立的 hooks 和子元件
  - ELIMINATE 所有 Platform.OS 判斷
  - MAINTAIN 現有 API 相容性

IMPLEMENT Compound Components pattern:
  - ALLOW 靈活的元件組合
  - SUPPORT 客製化佈局
  - PROVIDE 預設的組合模式

Task 7: 建立完整測試覆蓋
CREATE src/components/users/file-upload/__tests__/hooks/:
  - TEST 所有 custom hooks 功能
  - MOCK 檔案操作和非同步處理
  - VERIFY 狀態管理正確性
  - INCLUDE edge cases 和錯誤處理

CREATE src/components/users/file-upload/__tests__/components/:
  - TEST 所有子元件渲染和互動
  - USE Testing Library 最佳實踐
  - MOCK 必要的依賴
  - INCLUDE accessibility 測試

CREATE src/components/users/file-upload/__tests__/utils/:
  - TEST 工具函數的邊界情況
  - VERIFY 檔案處理邏輯
  - TEST 錯誤處理和恢復
  - INCLUDE 效能測試

CREATE integration tests:
  - TEST 完整的檔案上傳流程
  - VERIFY 跨元件的資料流
  - TEST 複雜的使用者互動情境
  - INCLUDE visual regression tests

Task 8: 效能優化和最終整合
IMPLEMENT performance optimizations:
  - ADD React.memo 包裝適當的元件
  - USE useMemo 和 useCallback 最佳化
  - IMPLEMENT 虛擬化處理大量檔案
  - ADD lazy loading 和 code splitting

INTEGRATE with existing systems:
  - VERIFY 與其他 import stages 的整合
  - TEST 與 Firebase 上傳的相容性
  - ENSURE wizard 流程的正確運作

PERFORMANCE benchmarking:
  - MEASURE 載入時間改善
  - TRACK 記憶體使用優化
  - VERIFY 大檔案處理效能
  - COMPARE 重構前後的指標
```

### Per task pseudocode as needed added to each task

```typescript
// Task 2: useFileUpload Hook 核心邏輯偽代碼
export const useFileUpload = (options: FileUploadOptions): UseFileUploadReturn => {
  const [state, dispatch] = useReducer(fileUploadReducer, initialState);
  
  const uploadFiles = useCallback(async (files: File[]) => {
    dispatch({ type: 'UPLOAD_START' });
    
    try {
      // PATTERN: 批量處理檔案，避免 UI 阻塞
      const results = await Promise.allSettled(
        files.map(file => processFileWithProgress(file, dispatch))
      );
      
      // CRITICAL: 處理部分失敗的情況
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      dispatch({ 
        type: 'UPLOAD_COMPLETE', 
        payload: { succeeded, failed } 
      });
    } catch (error) {
      dispatch({ type: 'UPLOAD_ERROR', error });
    }
  }, []);
  
  return { state, actions: { uploadFiles }, computed: { /* ... */ } };
};

// Task 4: Styled Components 重構偽代碼
// FileUploadStyles.ts
export const DropZoneContainer = createStyledComponent('div', 
  ({ theme, isDragActive }) => `
    padding: ${theme.spacing.xl}px;
    border: 2px dashed ${isDragActive ? theme.colors.primary : theme.colors.border.default};
    border-radius: ${theme.borderRadius.md}px;
    background-color: ${isDragActive ? theme.colors.primary}10 : theme.colors.background.surface};
    transition: all ${theme.transitions.normal}ms ease;
    
    /* CRITICAL: 高優先級覆蓋全域 CSS */
    && {
      cursor: pointer;
      user-select: none;
    }
  `
);

// Task 5: Adaptive Components 應用偽代碼
const FileDropZone: React.FC<FileDropZoneProps> = ({ onFilesSelected, mode }) => {
  const platformAdapter = PlatformAdapter.getInstance();
  
  return (
    <AdaptiveView 
      style={styles.container}
      onPress={platformAdapter.isWeb ? undefined : handlePress}
      // PATTERN: Web 使用原生拖放，Native 使用 TouchableOpacity 行為
      {...(platformAdapter.isWeb && {
        onDragOver: handleDragOver,
        onDrop: handleDrop,
      })}
    >
      <AdaptiveText variant="h3">
        {mode === 'simple' ? '選擇檔案' : '拖放檔案或點擊選擇'}
      </AdaptiveText>
    </AdaptiveView>
  );
};

// Task 6: 主元件重構偽代碼
const UserFileUploader: React.FC<UserFileUploaderProps> = (props) => {
  // 使用 custom hooks 管理狀態和邏輯
  const fileUpload = useFileUpload(props);
  const merging = useFileMerging(fileUpload.state.files);
  const validation = useFileValidation(props.validationRules);
  
  // PATTERN: Compound Components 模式
  return (
    <FileUploadProvider value={{ fileUpload, merging, validation }}>
      <FileDropZone onFilesSelected={fileUpload.actions.uploadFiles} />
      <FileList files={fileUpload.state.files} />
      {fileUpload.state.files.length > 1 && (
        <FileMergeConfig config={merging.config} />
      )}
      <MergePreview data={merging.previewData} />
    </FileUploadProvider>
  );
};
```

### Integration Points
```yaml
ADAPTIVE_COMPONENTS:
  - use: AdaptiveView, AdaptiveText, AdaptiveButton, AdaptiveSelect from PRP-94
  - replace: all Platform.OS conditionals with adaptive components
  - maintain: consistent API across platforms

STYLED_COMPONENTS:
  - use: StyledComponentFactory from PRP-95
  - replace: all inline styles and hardcoded colors
  - integrate: with design system tokens

EXISTING_UTILS:
  - integrate: with /src/components/import/utils/fileMerger.ts
  - maintain: API compatibility with other import stages
  - extend: functionality without breaking changes

TESTING_FRAMEWORK:
  - extend: existing Vitest setup
  - use: vi.mock patterns from existing tests
  - integrate: with visual regression testing
```

## Validation Loop

### Level 1: Component Architecture Validation
```bash
# 驗證元件結構和 imports
npm run type-check

# 檢查新的 ESLint 規則（來自 PRP-95）
npm run lint

# 確認沒有使用 Platform.OS 或硬編碼樣式
npm run lint -- --rule enforce-adaptive-components

# 預期: 無 TypeScript 錯誤，符合新的架構規範
```

### Level 2: Unit and Integration Tests
```bash
# 執行 Hook 測試
npm run test src/components/users/file-upload/__tests__/hooks/

# 執行元件測試
npm run test src/components/users/file-upload/__tests__/components/

# 執行工具函數測試
npm run test src/components/users/file-upload/__tests__/utils/

# 執行整合測試
npm run test src/components/users/file-upload/__tests__/UserFileUploader.test.tsx

# 預期: 所有測試通過，覆蓋率 >90%
```

### Level 3: Performance and Visual Testing
```bash
# 執行效能測試
npm run test:performance -- --component FileUpload

# 執行視覺回歸測試
npm run test:visual -- --update-snapshots --component UserFileUploader

# 建構並測試 bundle size
npm run web:build --analyze

# 預期: 效能提升 30%，視覺測試通過，bundle size 沒有顯著增加
```

### Level 4: End-to-End Integration
```bash
# 建構 Web 版本
npm run web:build

# 啟動開發服務器
npm run web:preview

# 手動測試完整的檔案上傳流程
# - 單檔案上傳（simple mode）
# - 多檔案上傳和合併（advanced mode）
# - 拖放功能
# - 錯誤處理
# - 大檔案處理

# 預期: 所有功能正常，用戶體驗流暢，無控制台錯誤
```

## Final validation Checklist
- [ ] 主元件行數從 1,373 → <300 行
- [ ] 建立 8-10 個職責清晰的子元件，每個 <150 行
- [ ] 完全移除 Platform.OS 判斷，使用 Adaptive Components
- [ ] 100% 使用 DesignSystem，0 處硬編碼樣式
- [ ] 測試覆蓋率 >90%，包含所有邊界情況
- [ ] 效能提升：大檔案載入時間減少 30%
- [ ] 所有現有 API 保持相容性，不破壞其他使用者
- [ ] 拖放功能在 Web 和 Mobile 上正常運作
- [ ] 視覺回歸測試通過，UI 一致性維持
- [ ] Bundle size 沒有顯著增加，載入效能優化

---

## Anti-Patterns to Avoid
- ❌ 不要一次性重寫整個元件，採用漸進式重構
- ❌ 不要破壞現有的 API 契約，確保向後相容性
- ❌ 不要忽略大檔案處理的效能問題，避免 UI 阻塞
- ❌ 不要跳過錯誤處理，檔案操作容易出現各種異常
- ❌ 不要忽略 accessibility，確保檔案上傳對所有用戶可用
- ❌ 不要過度抽象，保持程式碼的可讀性和維護性

**Confidence Score: 8/10** - 基於詳細的現有程式碼分析和前兩個 PRP 的基礎設施。重構策略清晰，測試覆蓋完整，採用漸進式方法降低風險。預期能顯著改善程式碼品質和維護性。