# PRP-98: 複雜表單元件解耦重構

## Goal
重構 `FieldMapper.tsx`（1,739 行）為模組化、可組合、高度可測試的表單系統，運用前四個 PRP 建立的完整架構基礎，實現智能化的欄位映射和資料庫關聯管理功能。

## Why
- **最複雜的單體元件**: 1,739 行程式碼，是專案最大的單一元件檔案
- **表單邏輯極度複雜**: 包含欄位映射、關聯設定、預覽、驗證等多重職責
- **跨平台判斷混亂**: 15 處 Platform.OS 判斷，HTML 元素與 RN 元件混用嚴重
- **狀態管理困難**: 多層巢狀狀態，難以追蹤和偵錯
- **測試覆蓋不足**: 複雜邏輯難以進行單元測試，變更風險極高
- **用戶體驗關鍵**: 欄位映射是資料匯入流程的核心，直接影響用戶成功率
- **技術債務集中**: 累積了多次快速修補，程式碼結構已經難以維護

## What
建立現代化、智能化、可擴展的表單管理系統：

1. **智能表單元件庫** - 可組合的表單元件和驗證系統
2. **欄位映射引擎** - AI 輔助的自動映射和手動調整功能
3. **關聯管理系統** - 視覺化的資料庫關聯建立和管理
4. **即時預覽系統** - 映射結果的即時預覽和驗證
5. **狀態管理最佳化** - 使用 Zustand 或 Context 管理複雜表單狀態
6. **完整的表單驗證** - 即時驗證、錯誤處理、使用者引導

### Success Criteria
- [ ] 主元件行數從 1,739 行 → <350 行
- [ ] 拆分為 20-25 個職責明確的子元件，每個 <100 行
- [ ] Platform.OS 判斷從 15 處 → 0 處（全部使用 Adaptive Components）
- [ ] 表單狀態管理複雜度降低 70%，使用統一的狀態管理方案
- [ ] 測試覆蓋率 >95%，包含所有邊界情況和錯誤處理
- [ ] 欄位映射準確率提升 40%（透過 AI 輔助和改進的 UX）
- [ ] 表單完成率提升 25%（透過更好的使用者引導和錯誤處理）

## All Needed Context

### Documentation & References
```yaml
- url: https://react-hook-form.com/docs
  why: 現代表單狀態管理和驗證的最佳實踐
  
- url: https://formik.org/docs/overview
  why: 複雜表單邏輯的組織和最佳化方法
  
- url: https://github.com/pmndrs/zustand
  why: 輕量級狀態管理，適合複雜表單狀態
  
- url: https://zod.dev/
  why: TypeScript-first 的表單驗證 schema

- file: /src/components/import/stages/FieldMapper.tsx
  why: 當前實現，1,739 行超複雜元件，包含所有需要重構的問題
  critical: lines 95-150 (初始化邏輯), 582-605 (關聯按鈕事件), 1100-1200 (Modal 管理), 1600-1739 (樣式定義)
  
- file: /src/components/users/stages/UserFieldMapper.tsx
  why: 類似的欄位映射元件，可以共享重構後的基礎元件
  
- file: /src/services/firebase/fieldDefinitions.ts
  why: 欄位定義的資料服務，需要與表單系統整合
  
- file: /src/components/adaptive/ (PRP-94)
  why: 跨平台統一介面，替代所有 Platform.OS 判斷
  
- file: /src/theme/styled/StyledComponentFactory.ts (PRP-95)  
  why: 統一樣式系統，取代大量的內聯樣式

- file: /vitest.config.ts
  why: 測試設定，需要支援複雜表單的測試場景
```

### Current Codebase tree
```bash
src/components/import/stages/
└── FieldMapper.tsx                # 1,739 行超複雜元件（主要重構目標）
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/components/forms/                     # 🆕 通用表單系統
├── index.ts                             # 統一匯出點
├── core/                                # 🆕 核心表單元件
│   ├── FormProvider.tsx                 # 表單狀態管理 Provider
│   ├── FormField.tsx                    # 統一的表單欄位包裝器
│   ├── FormSection.tsx                  # 表單區段容器
│   ├── FormActions.tsx                  # 表單操作按鈕組
│   └── FormValidation.tsx               # 統一驗證處理器
├── inputs/                              # 🆕 輸入元件庫
│   ├── AdaptiveInput.tsx               # 跨平台文字輸入
│   ├── AdaptiveSelect.tsx              # 跨平台下拉選單
│   ├── AdaptiveCheckbox.tsx            # 跨平台核取方塊
│   ├── AdaptiveRadio.tsx               # 跨平台單選按鈕
│   ├── AdaptiveSwitch.tsx              # 跨平台開關
│   └── FieldTypeSelector.tsx           # 欄位類型選擇器
├── mapping/                             # 🆕 欄位映射專用元件
│   ├── FieldMapper.tsx                 # 🔄 主要映射元件 (<350 行)
│   ├── components/                     # 🆕 映射子元件
│   │   ├── MappingTable.tsx           # 映射關係表格
│   │   ├── MappingRow.tsx             # 單行映射設定
│   │   ├── FieldSelector.tsx          # 欄位選擇器
│   │   ├── MappingPreview.tsx         # 映射預覽
│   │   ├── AutoMappingPanel.tsx       # 自動映射控制面板
│   │   ├── RelationshipManager.tsx    # 關聯關係管理
│   │   ├── RelationshipModal.tsx      # 關聯設定模態框
│   │   └── ValidationSummary.tsx      # 驗證結果摘要
│   ├── hooks/                          # 🆕 映射專用 Hooks
│   │   ├── useFieldMapping.ts         # 欄位映射狀態管理
│   │   ├── useAutoMapping.ts          # 自動映射邏輯
│   │   ├── useRelationships.ts        # 關聯關係管理
│   │   ├── useMappingValidation.ts    # 映射驗證邏輯
│   │   └── useMappingPreview.ts       # 預覽資料處理
│   ├── services/                       # 🆕 映射服務
│   │   ├── MappingEngine.ts           # 映射邏輯引擎
│   │   ├── AutoMappingAI.ts           # AI 輔助映射
│   │   ├── RelationshipValidator.ts   # 關聯驗證器
│   │   └── MappingExporter.ts         # 映射配置匯出
│   ├── types/                          # 🆕 映射相關型別
│   │   ├── mapping.ts                 # 映射配置型別
│   │   ├── relationships.ts           # 關聯關係型別
│   │   └── validation.ts              # 驗證相關型別
│   ├── utils/                          # 🆕 映射工具函數
│   │   ├── mappingHelpers.ts          # 映射輔助函數
│   │   ├── fieldAnalysis.ts           # 欄位分析工具
│   │   └── relationshipHelpers.ts     # 關聯輔助函數
│   ├── styles/                         # 🆕 映射樣式
│   │   ├── MappingStyles.ts           # 映射介面樣式
│   │   ├── TableStyles.ts             # 表格樣式
│   │   └── ModalStyles.ts             # 模態框樣式
│   └── __tests__/                      # 🆕 測試檔案
│       ├── FieldMapper.test.tsx       # 主要元件測試
│       ├── components/                # 子元件測試
│       ├── hooks/                     # Hook 測試
│       ├── services/                  # 服務層測試
│       └── utils/                     # 工具函數測試
├── validation/                          # 🆕 表單驗證系統
│   ├── ValidationProvider.tsx          # 驗證 Provider
│   ├── ValidationRules.ts              # 驗證規則定義
│   ├── ValidationErrors.tsx            # 錯誤顯示元件
│   └── CustomValidators.ts             # 自定義驗證器
├── hooks/                              # 🆕 通用表單 Hooks
│   ├── useForm.ts                      # 增強的 useForm hook
│   ├── useFormValidation.ts            # 表單驗證 hook
│   ├── useFormState.ts                 # 表單狀態管理
│   └── useFormPersistence.ts           # 表單資料持久化
├── utils/                              # 🆕 表單工具函數
│   ├── formHelpers.ts                  # 表單輔助函數
│   ├── validationHelpers.ts            # 驗證輔助函數
│   └── formSerialization.ts            # 表單序列化工具
└── styles/                             # 🆕 通用表單樣式
    ├── FormStyles.ts                   # 基礎表單樣式
    ├── InputStyles.ts                  # 輸入元件樣式
    └── ValidationStyles.ts             # 驗證相關樣式
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: 複雜的 Modal 狀態管理問題
// 多個模態框同時存在時的狀態衝突和 z-index 問題
// 需要實現 Modal 管理器統一處理

// CRITICAL: 欄位映射的效能問題
// 大量欄位時，每次變更觸發全量重新計算
// 需要實現增量更新和記憶化

// CRITICAL: 跨平台表單輸入的差異
// Web: HTML form elements with complex validation
// Native: 各種限制和不同的事件處理機制

// CRITICAL: Firebase Firestore 查詢的限制
// 複雜的欄位定義查詢可能觸發查詢限制
// 需要優化查詢策略和快取機制

// CRITICAL: 現有 fileMerger 和 fieldDefinitions 服務的相依性
// 重構時需要保持 API 相容性
// 避免破壞其他元件的使用

// CRITICAL: 表單狀態的持久化問題
// 用戶在填寫過程中刷新頁面會丟失資料
// 需要實現自動儲存和恢復機制
```

## Implementation Blueprint

### Data models and structure
建立清晰的表單和映射資料結構，支援複雜的驗證和狀態管理。

```typescript
// 表單狀態管理型別
interface FormState<T = any> {
  values: T;
  errors: FieldErrors;
  touched: FieldTouched;
  isSubmitting: boolean;
  isValidating: boolean;
  isDirty: boolean;
}

// 欄位映射配置型別
interface FieldMappingConfig {
  sourceFields: SourceField[];
  targetFields: TargetField[];
  mappings: FieldMapping[];
  relationships: Relationship[];
  validation: ValidationResult;
}

// Hook 返回值型別
interface UseFieldMappingReturn {
  state: FieldMappingState;
  actions: MappingActions;
  computed: ComputedMappingData;
}
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1: 建立通用表單系統核心
CREATE src/components/forms/ directory structure:
  - SETUP 完整的表單系統目錄結構
  - PREPARE TypeScript 配置和匯出策略

CREATE src/components/forms/core/FormProvider.tsx:
  - IMPLEMENT 使用 Zustand 的表單狀態管理
  - HANDLE 複雜表單狀態和驗證邏輯
  - PROVIDE 表單 Context 和 action creators
  - OPTIMIZE 效能避免不必要的重渲染

CREATE src/components/forms/core/FormField.tsx:
  - IMPLEMENT 統一的表單欄位包裝器
  - HANDLE 標籤、錯誤顯示、驗證狀態
  - SUPPORT 各種輸入類型的統一介面
  - ADD 無障礙支援和鍵盤導航

CREATE src/components/forms/validation/ValidationProvider.tsx:
  - IMPLEMENT 基於 Zod 的驗證系統
  - SUPPORT 即時驗證和延遲驗證
  - HANDLE 自定義驗證規則和錯誤訊息
  - OPTIMIZE 驗證效能和使用者體驗

Task 2: 建立跨平台輸入元件庫（基於 PRP-94）
CREATE src/components/forms/inputs/AdaptiveInput.tsx:
  - USE AdaptiveView 和 AdaptiveText 基礎元件
  - IMPLEMENT 統一的文字輸入介面
  - HANDLE 驗證狀態、錯誤顯示、格式化
  - SUPPORT 各種輸入類型（文字、數字、email 等）

CREATE src/components/forms/inputs/AdaptiveSelect.tsx:
  - SOLVE 當前 FieldMapper 中的 select 問題
  - IMPLEMENT 跨平台下拉選單統一介面
  - SUPPORT 搜尋、多選、分組等進階功能
  - ADD 虛擬化支援大量選項

CREATE src/components/forms/inputs/FieldTypeSelector.tsx:
  - IMPLEMENT 專用的欄位類型選擇器
  - SUPPORT 類型分類、搜尋、預覽功能
  - ADD 智能推薦基於資料分析
  - OPTIMIZE 使用者選擇體驗

Task 3: 建立映射核心服務層
CREATE src/components/forms/mapping/services/MappingEngine.ts:
  - EXTRACT 現有的映射邏輯
  - IMPLEMENT 高效能的映射計算引擎
  - SUPPORT 批量映射和增量更新
  - ADD 映射衝突檢測和解決

CREATE src/components/forms/mapping/services/AutoMappingAI.ts:
  - IMPLEMENT AI 輔助的自動映射
  - USE 機器學習算法提升映射準確率
  - SUPPORT 用戶回饋學習和改進
  - ADD 信心度評分和建議排序

CREATE src/components/forms/mapping/services/RelationshipValidator.ts:
  - IMPLEMENT 關聯關係驗證邏輯
  - CHECK 資料完整性和一致性
  - VALIDATE 跨表關聯的正確性
  - PROVIDE 詳細的驗證報告

Task 4: 建立映射專用 Hooks
CREATE src/components/forms/mapping/hooks/useFieldMapping.ts:
  - IMPLEMENT 映射狀態管理邏輯
  - HANDLE 映射變更、驗證、持久化
  - OPTIMIZE 大量欄位的效能
  - ADD 撤銷/重做功能

CREATE src/components/forms/mapping/hooks/useAutoMapping.ts:
  - IMPLEMENT 自動映射邏輯和狀態
  - HANDLE AI 建議的接受/拒絕
  - SUPPORT 批量接受和個別調整
  - ADD 學習和改進機制

CREATE src/components/forms/mapping/hooks/useRelationships.ts:
  - IMPLEMENT 關聯關係管理邏輯
  - HANDLE 關聯建立、修改、刪除
  - SUPPORT 複雜的多表關聯
  - ADD 視覺化關聯預覽

CREATE src/components/forms/mapping/hooks/useMappingValidation.ts:
  - IMPLEMENT 即時映射驗證
  - HANDLE 複雜驗證規則和錯誤處理
  - SUPPORT 自定義驗證器
  - OPTIMIZE 驗證效能

Task 5: 建立映射介面元件（使用統一樣式系統）
CREATE src/components/forms/mapping/components/MappingTable.tsx:
  - USE StyledComponentFactory 建立樣式化表格
  - IMPLEMENT 映射關係的視覺化顯示
  - SUPPORT 拖拽排序和批量操作
  - ADD 虛擬化支援大量欄位

CREATE src/components/forms/mapping/components/MappingRow.tsx:
  - IMPLEMENT 單行映射的編輯介面
  - USE Adaptive Components 統一跨平台實現
  - SUPPORT 內聯編輯和驗證
  - ADD 視覺化映射狀態指示

CREATE src/components/forms/mapping/components/FieldSelector.tsx:
  - REPLACE 原有的複雜下拉邏輯
  - IMPLEMENT 智能欄位選擇器
  - SUPPORT 搜尋、分類、預覽
  - ADD 自動建議和模糊匹配

CREATE src/components/forms/mapping/components/RelationshipManager.tsx:
  - IMPLEMENT 關聯關係的視覺化管理
  - SUPPORT 拖拽建立關聯
  - ADD 關聯類型選擇和驗證
  - OPTIMIZE 複雜關聯的使用者體驗

CREATE src/components/forms/mapping/components/RelationshipModal.tsx:
  - SOLVE 當前設定關聯按鈕問題
  - IMPLEMENT 改進的關聯設定介面
  - USE Modal 管理器統一處理
  - ADD 關聯預覽和測試功能

Task 6: 建立樣式系統（完全遷移內聯樣式）
CREATE src/components/forms/mapping/styles/MappingStyles.ts:
  - MIGRATE 所有映射介面的內聯樣式
  - USE DesignSystem tokens 和 theme 系統
  - IMPLEMENT 響應式設計和動畫效果
  - ELIMINATE 硬編碼顏色和尺寸

CREATE src/components/forms/styles/FormStyles.ts:
  - CREATE 統一的表單樣式系統
  - DEFINE 表單佈局、間距、視覺層次
  - SUPPORT 主題切換和自定義化
  - OPTIMIZE CSS 效能和載入

CREATE src/components/forms/styles/ValidationStyles.ts:
  - IMPLEMENT 驗證狀態的視覺設計
  - DEFINE 錯誤、警告、成功狀態樣式
  - ADD 動畫和過渡效果
  - SUPPORT 無障礙的視覺提示

Task 7: 重構主要映射元件
REFACTOR src/components/forms/mapping/FieldMapper.tsx:
  - REDUCE 主元件到 <350 行
  - USE 新建立的 hooks、services、元件
  - ELIMINATE 所有 Platform.OS 判斷和內聯樣式
  - MAINTAIN 現有 API 相容性

IMPLEMENT modular architecture:
  - SEPARATE 資料處理、UI 邏輯、狀態管理
  - USE composition pattern 提高靈活性
  - ADD 可配置的佈局和行為
  - SUPPORT 擴展和自定義

Task 8: 建立完整測試覆蓋
CREATE src/components/forms/__tests__/mapping/:
  - TEST 所有映射相關元件和邏輯
  - MOCK Firebase 服務和外部依賴
  - VERIFY 複雜的使用者互動流程
  - INCLUDE 效能測試和邊界情況

CREATE src/components/forms/__tests__/core/:
  - TEST 表單系統核心功能
  - VERIFY 狀態管理和驗證邏輯
  - TEST 錯誤處理和恢復機制
  - INCLUDE 無障礙功能測試

CREATE integration tests:
  - TEST 完整的映射建立流程
  - VERIFY 與其他匯入階段的整合
  - TEST 資料持久化和恢復
  - INCLUDE 視覺回歸測試

CREATE performance tests:
  - BENCHMARK 大量欄位的處理效能
  - MEASURE 映射計算和驗證速度
  - TEST 記憶體使用和洩漏
  - COMPARE 重構前後的效能指標

Task 9: 實現進階功能
IMPLEMENT auto-save and recovery:
  - ADD 表單資料自動儲存
  - IMPLEMENT 頁面重載後的資料恢復
  - HANDLE 網路中斷的離線支援
  - PROVIDE 衝突解決機制

IMPLEMENT keyboard shortcuts:
  - ADD 常用操作的快捷鍵支援
  - IMPLEMENT 鍵盤導航和無障礙支援
  - SUPPORT 自定義快捷鍵配置
  - PROVIDE 快捷鍵說明和提示

IMPLEMENT batch operations:
  - SUPPORT 多選和批量映射操作
  - ADD 批量驗證和錯誤處理
  - IMPLEMENT 批量取消和重做
  - OPTIMIZE 大量操作的效能

Task 10: 最終整合和優化
INTEGRATE with existing systems:
  - VERIFY 與檔案上傳階段的整合
  - TEST 與資料庫管理系統的相容性
  - ENSURE 與權限系統的正確整合
  - MAINTAIN 向後相容性

OPTIMIZE performance:
  - IMPLEMENT code splitting 和 lazy loading
  - ADD React.memo 和 optimization hooks
  - OPTIMIZE bundle size 和載入時間
  - MEASURE 並改善 Core Web Vitals

FINAL validation:
  - RUN 完整的測試套件
  - PERFORM 效能和記憶體基準測試
  - VERIFY 視覺一致性和無障礙標準
  - CONDUCT 使用者體驗測試
```

### Per task pseudocode as needed added to each task

```typescript
// Task 1: FormProvider 核心實現偽代碼
interface FormStore<T> {
  values: T;
  errors: FieldErrors;
  touched: FieldTouched;
  isSubmitting: boolean;
  // actions
  setValue: (name: string, value: any) => void;
  setError: (name: string, error: string) => void;
  validate: () => Promise<boolean>;
  submit: () => Promise<void>;
}

export const createFormStore = <T>(initialValues: T) => {
  return create<FormStore<T>>((set, get) => ({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    
    setValue: (name, value) => set(state => ({
      values: { ...state.values, [name]: value },
      // CRITICAL: 標記為已變更，觸發驗證
      touched: { ...state.touched, [name]: true }
    })),
    
    validate: async () => {
      // PATTERN: 使用 Zod schema 進行驗證
      const result = await validateSchema(get().values);
      set({ errors: result.errors });
      return result.success;
    },
    
    // ... 其他 actions
  }));
};

// Task 3: AutoMappingAI 核心邏輯偽代碼
export class AutoMappingAI {
  async suggestMappings(sourceFields: SourceField[], targetFields: TargetField[]): Promise<MappingSuggestion[]> {
    // PATTERN: 多種算法組合提升準確率
    const results = await Promise.all([
      this.exactNameMatch(sourceFields, targetFields),
      this.semanticSimilarity(sourceFields, targetFields),  
      this.dataTypeAnalysis(sourceFields, targetFields),
      this.historicalPatternMatch(sourceFields, targetFields)
    ]);
    
    // CRITICAL: 加權合併結果，計算信心度
    const weightedResults = this.combineResults(results, {
      exactMatch: 0.4,
      semantic: 0.3,
      dataType: 0.2,
      historical: 0.1
    });
    
    return weightedResults.filter(r => r.confidence > 0.6);
  }
  
  private async semanticSimilarity(source: SourceField[], target: TargetField[]): Promise<SimilarityResult[]> {
    // PATTERN: 使用詞向量或 transformer 模型
    // 暫時使用簡化的字串相似度算法
    return source.flatMap(s => 
      target.map(t => ({
        source: s,
        target: t,
        score: this.calculateSimilarity(s.name, t.name),
        method: 'semantic'
      }))
    );
  }
}

// Task 4: useFieldMapping Hook 偽代碼
export const useFieldMapping = (initialConfig: FieldMappingConfig) => {
  const store = useMemo(() => createMappingStore(initialConfig), []);
  const state = useStore(store);
  
  const actions = useMemo(() => ({
    addMapping: (sourceId: string, targetId: string) => {
      // CRITICAL: 檢查衝突並更新狀態
      const conflict = state.mappings.find(m => m.sourceId === sourceId || m.targetId === targetId);
      if (conflict) {
        // 處理衝突：提示用戶或自動解決
        store.getState().showConflictDialog(conflict, { sourceId, targetId });
      } else {
        store.getState().addMapping({ sourceId, targetId });
      }
    },
    
    removeMapping: (mappingId: string) => {
      store.getState().removeMapping(mappingId);
    },
    
    validateMappings: async () => {
      // PATTERN: 批量驗證所有映射
      const validationResults = await Promise.all(
        state.mappings.map(mapping => validateMapping(mapping))
      );
      
      store.getState().setValidationResults(validationResults);
      return validationResults.every(r => r.isValid);
    }
  }), [store]);
  
  return { state, actions };
};

// Task 5: MappingTable 元件偽代碼
const MappingTable: React.FC<MappingTableProps> = ({ mappings, onMappingChange }) => {
  const { state, actions } = useFieldMapping();
  const virtualizer = useVirtualizer({
    count: mappings.length,
    estimateSize: () => 60, // 預估行高
    overscan: 10
  });
  
  return (
    <StyledTableContainer>
      <TableHeader>
        <AdaptiveText variant="h4">欄位映射</AdaptiveText>
        <AutoMappingButton onClick={actions.runAutoMapping} />
      </TableHeader>
      
      <VirtualizedScrollArea ref={virtualizer.scrollElementRef}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <MappingRow
            key={virtualRow.key}
            mapping={mappings[virtualRow.index]}
            onMappingChange={onMappingChange}
            // CRITICAL: 使用 React.memo 優化渲染
            style={{ 
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </VirtualizedScrollArea>
    </StyledTableContainer>
  );
};

// Task 7: 主元件重構偽代碼
const FieldMapper: React.FC<FieldMapperProps> = (props) => {
  // 使用新的 hooks 和 services
  const mapping = useFieldMapping(props.initialConfig);
  const autoMapping = useAutoMapping(mapping.state);
  const validation = useMappingValidation(mapping.state);
  
  // PATTERN: 組合式元件架構
  return (
    <FormProvider store={mapping.store}>
      <FieldMapperLayout>
        <MappingToolbar>
          <AutoMappingPanel {...autoMapping} />
          <ValidationSummary {...validation} />
        </MappingToolbar>
        
        <MappingTable 
          mappings={mapping.state.mappings}
          onMappingChange={mapping.actions.updateMapping}
        />
        
        <RelationshipManager
          relationships={mapping.state.relationships}
          onRelationshipChange={mapping.actions.updateRelationship}
        />
        
        <MappingPreview data={mapping.computed.previewData} />
      </FieldMapperLayout>
    </FormProvider>
  );
};
```

### Integration Points
```yaml
ADAPTIVE_COMPONENTS:
  - use: 所有 PRP-94 的跨平台統一元件
  - replace: 15 處 Platform.OS 判斷和原生 HTML 元素
  - maintain: 一致的跨平台使用者體驗

STYLED_COMPONENTS:
  - use: PRP-95 的 StyledComponentFactory 和 design tokens
  - replace: 所有內聯樣式和硬編碼值
  - implement: 主題支援和響應式設計

EXISTING_SERVICES:
  - integrate: Firebase fieldDefinitions 和 fieldRelations 服務
  - maintain: API 相容性，不破壞其他使用者
  - enhance: 效能和錯誤處理

FORM_SYSTEM:
  - extend: 可重複使用的通用表單系統
  - share: UserFieldMapper 和其他映射元件
  - standardize: 專案內的所有表單元件
```

## Validation Loop

### Level 1: Component Architecture and Code Quality
```bash
# 驗證型別系統和元件架構
npm run type-check

# 檢查樣式系統合規性（無硬編碼、無 Platform.OS）
npm run lint -- --rule no-hardcoded-colors
npm run lint -- --rule enforce-adaptive-components
npm run lint -- --rule no-platform-os

# 驗證表單系統的完整性
npm run test src/components/forms/core/ --coverage

# 預期: 無 TypeScript 錯誤，100% 符合新的架構規範
```

### Level 2: Unit and Integration Tests
```bash
# 執行映射引擎和 AI 服務測試
npm run test src/components/forms/mapping/services/

# 執行所有 Hook 測試
npm run test src/components/forms/mapping/hooks/

# 執行元件測試（包括複雜的使用者互動）
npm run test src/components/forms/mapping/components/

# 執行主要映射元件的整合測試
npm run test src/components/forms/mapping/__tests__/FieldMapper.test.tsx

# 預期: 測試覆蓋率 >95%，所有複雜場景通過
```

### Level 3: Performance and AI Accuracy Testing
```bash
# 執行映射效能測試
npm run test:performance -- --component FieldMapper

# 測試 AI 映射準確率
npm run test:ai-accuracy -- --dataset mapping-test-cases.json

# 執行大量欄位的壓力測試  
npm run test:stress -- --component FieldMapper --fields 1000

# 預期: 效能提升達到目標，AI 準確率提升 40%
```

### Level 4: End-to-End User Experience Testing
```bash
# 建構測試版本
npm run web:build

# 啟動測試環境
npm run web:preview

# 手動測試完整的映射流程:
# - 自動映射功能和準確率
# - 手動調整和驗證
# - 關聯建立和管理  
# - 錯誤處理和恢復
# - 鍵盤導航和無障礙功能
# - 表單自動儲存和恢復

# 執行視覺回歸測試
npm run test:visual -- --component FieldMapper

# 預期: 所有功能流暢，使用者體驗顯著改善，視覺一致性保持
```

## Final validation Checklist
- [ ] 主元件行數從 1,739 → <350 行，拆分為 20-25 個子元件
- [ ] Platform.OS 判斷從 15 處 → 0 處，完全使用 Adaptive Components
- [ ] 表單狀態管理複雜度降低 70%，使用統一的狀態方案
- [ ] 測試覆蓋率 >95%，包含所有邊界情況和錯誤處理
- [ ] AI 輔助映射準確率提升 40%，使用者體驗顯著改善
- [ ] 表單完成率提升 25%，錯誤率顯著降低
- [ ] 完整的無障礙支援，包含鍵盤導航和螢幕閱讀器
- [ ] 自動儲存和恢復功能正常，網路中斷時能正確處理
- [ ] 所有樣式遷移到統一系統，無硬編碼值
- [ ] 效能指標達成，大量欄位處理流暢

---

## Anti-Patterns to Avoid
- ❌ 不要一次性重寫所有表單邏輯，採用漸進式重構
- ❌ 不要忽略現有 API 的相容性，確保不破壞其他使用者
- ❌ 不要過度抽象表單系統，保持合理的複雜度
- ❌ 不要忽略 AI 映射的準確率驗證，錯誤建議會降低使用者信任
- ❌ 不要跳過效能測試，複雜表單容易出現效能瓶頸
- ❌ 不要忽略無障礙功能，表單是無障礙的重要組成部分

**Confidence Score: 7/10** - 這是最複雜的表單重構任務，涉及 AI 邏輯、複雜狀態管理和多平台適配。基於前四個 PRP 的基礎設施，有信心完成，但需要特別注意 AI 準確率和使用者體驗的驗證。