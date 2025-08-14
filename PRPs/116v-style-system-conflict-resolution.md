# PRP-010: 解決 Adaptive 元件樣式系統衝突問題

## 執行摘要
重構 Adaptive 元件系統的樣式處理邏輯，建立清晰的樣式優先級規則，確保跨平台樣式行為一致且可預測。

## 問題背景

### 現有問題
1. **樣式優先級混亂**：多個樣式來源（size、style、webStyle、nativeStyle、contentStyle）的優先級不明確
2. **平台差異處理不一致**：Web 和 Native 平台的樣式應用邏輯不同
3. **樣式合併邏輯分散**：每個 Adaptive 元件都有自己的樣式合併邏輯
4. **預設值覆蓋問題**：元件內部預設樣式經常被意外覆蓋

### 具體案例
- AdaptiveModal 的 `size="fullscreen"` 無法正確應用
- SearchBar 的輸入框有不必要的背景延伸
- 資料匯入精靈需要強制覆蓋才能達到預期尺寸

## 技術分析

### 現有架構
```
PlatformAdapter (單例)
  ├── WebStyleAdapter
  │   └── adaptStyle() - 轉換 RN 樣式到 CSS
  └── NativeStyleAdapter
      └── adaptStyle() - 處理原生樣式
```

### 問題根源
參考檔案：
- `/src/components/adaptive/core/AdaptiveModal.tsx` 第 240-256 行
- `/src/components/adaptive/platform/WebStyleAdapter.ts` 第 16-24 行

當前樣式合併順序（以 AdaptiveModal 為例）：
```javascript
// 問題：順序混亂，優先級不明確
finalStyle = { ...dimensions };                    // 1. 尺寸預設值
finalStyle = { ...finalStyle, ...convertedStyle }; // 2. 通用樣式
finalStyle = { ...finalStyle, ...webStyle };       // 3. Web 特定樣式
finalStyle = { ...finalStyle, ...contentStyle };   // 4. 內容樣式
```

## 解決方案

### 1. 建立統一的樣式優先級系統

#### 新的樣式優先級（從低到高）
```
1. 元件預設樣式 (defaults)
2. 尺寸預設樣式 (size presets) 
3. 通用樣式 (style prop)
4. 平台特定樣式 (webStyle/nativeStyle)
5. 內容樣式 (contentStyle, overlayStyle 等)
6. 內聯樣式 (inline overrides)
```

### 2. 創建中央化樣式處理器

#### StylePriorityManager
```typescript
// /src/components/adaptive/styles/StylePriorityManager.ts
export class StylePriorityManager {
  static mergStyles(configs: StyleConfig[]): any {
    // 按優先級排序並合併
    return configs
      .sort((a, b) => a.priority - b.priority)
      .reduce((merged, config) => ({
        ...merged,
        ...config.style
      }), {});
  }
}
```

### 3. 重構各 Adaptive 元件

#### 範例：AdaptiveModal 重構
```typescript
// 統一的樣式合併邏輯
const finalStyle = StylePriorityManager.mergeStyles([
  { priority: 1, style: defaultModalStyles },
  { priority: 2, style: getModalDimensions(size) },
  { priority: 3, style: convertedStyle },
  { priority: 4, style: Platform.OS === 'web' ? webStyle : nativeStyle },
  { priority: 5, style: contentStyle }
]);
```

## 實作步驟

### 階段 1：建立核心系統（第 1-2 天）

1. **創建 StylePriorityManager**
   - 檔案：`/src/components/adaptive/styles/StylePriorityManager.ts`
   - 實作優先級合併邏輯
   - 加入除錯模式記錄樣式來源

2. **創建 StyleConfig 類型定義**
   - 檔案：`/src/components/adaptive/styles/types.ts`
   - 定義樣式配置介面
   - 定義優先級常數

3. **更新 PlatformAdapter**
   - 整合 StylePriorityManager
   - 提供統一的樣式處理介面

### 階段 2：重構核心元件（第 3-4 天）

4. **重構 AdaptiveModal**
   - 使用新的樣式系統
   - 修復 fullscreen 尺寸問題
   - 加入樣式優先級測試

5. **重構 AdaptiveInput**
   - 統一處理 containerStyle、inputStyle、webStyle
   - 修復背景延伸問題

6. **重構其他 Adaptive 元件**
   - AdaptiveButton
   - AdaptiveSelect
   - AdaptiveView
   - AdaptiveText

### 階段 3：測試與文件（第 5 天）

7. **建立測試套件**
   - 單元測試：樣式優先級邏輯
   - 整合測試：跨平台樣式一致性
   - 視覺測試：UI 呈現正確性

8. **更新文件**
   - 樣式優先級指南
   - 遷移指南
   - 最佳實踐

## 驗證標準

### 單元測試
```bash
# 執行樣式系統測試
npm test -- --testPathPattern=adaptive/styles

# 驗證優先級邏輯
npm test -- --testNamePattern="style priority"
```

### 整合測試
```bash
# Web 平台測試
npm run test:web

# Native 平台測試
npm run test:native
```

### 視覺驗證
```bash
# 視覺回歸測試
npm run test:visual

# 手動驗證清單
- [ ] AdaptiveModal fullscreen 正確顯示
- [ ] SearchBar 無背景延伸
- [ ] 資料匯入精靈正確尺寸
- [ ] 所有按鈕樣式一致
```

### 程式碼品質
```bash
# TypeScript 檢查
npm run type-check

# ESLint 檢查
npm run lint

# 格式化
npm run format
```

## 預期成果

### 技術成果
1. **一致的樣式行為**：所有 Adaptive 元件遵循相同的樣式優先級規則
2. **可預測的覆蓋機制**：開發者可以明確控制樣式覆蓋
3. **更好的除錯體驗**：樣式來源追蹤和除錯工具
4. **減少樣式 bug**：系統性解決樣式衝突問題

### 業務影響
- 減少 UI 相關 bug 50%
- 提高開發效率 30%
- 改善跨平台一致性

## 風險與緩解

### 風險 1：破壞現有功能
- **緩解**：逐步遷移，保留向後相容
- **方案**：使用 feature flag 控制新舊系統切換

### 風險 2：效能影響
- **緩解**：優化樣式合併算法
- **方案**：使用 memoization 快取計算結果

## 參考資源

### 內部檔案
- `/src/components/adaptive/core/*.tsx` - 現有 Adaptive 元件
- `/src/components/adaptive/platform/*.ts` - 平台適配器
- `/src/theme/designSystem.ts` - 設計系統定義

### 外部資源
- [React Native Web Styling](https://necolas.github.io/react-native-web/docs/styling/)
- [CSS Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)

## 實作檢查清單

- [ ] StylePriorityManager 類別建立
- [ ] 樣式配置類型定義
- [ ] AdaptiveModal 重構完成
- [ ] AdaptiveInput 重構完成
- [ ] 其他 Adaptive 元件重構
- [ ] 單元測試通過
- [ ] 整合測試通過
- [ ] 視覺測試通過
- [ ] 文件更新完成
- [ ] 程式碼審查通過

## 成功指標

### 量化指標
- 樣式相關 bug 減少 50%
- 樣式覆蓋程式碼減少 70%
- 測試覆蓋率達到 80%

### 質化指標
- 開發者回饋正面
- 樣式行為可預測
- 跨平台一致性提升

---

**信心評分：8/10**

此 PRP 提供了完整的上下文、具體的實作步驟和可執行的驗證標準。透過系統性的重構方案，可以一次性解決樣式衝突問題，並建立可維護的長期解決方案。