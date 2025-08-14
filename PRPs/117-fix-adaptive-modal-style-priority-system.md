# PRP-117: 修復 AdaptiveModal 樣式優先級系統

## 目標
修復資料匯入精靈和其他使用 AdaptiveModal 元件的 UI 問題，通過改進 StylePriorityManager 的樣式優先級邏輯，確保 `size` 屬性能正確應用而不被 `contentStyle` 覆蓋。

## 為什麼
- **業務價值**: 資料匯入是核心功能，Modal 顯示問題影響用戶體驗
- **技術債務**: 當前的樣式優先級系統在特定場景下行為不符預期
- **可維護性**: 改進後的系統將減少開發者困惑，避免未來類似問題

## 什麼
修復 AdaptiveModal 元件在設定 `size="fullscreen"` 時被 `contentStyle` 覆蓋的問題，通過：
1. 改進 StylePriorityManager 的優先級邏輯
2. 為預設尺寸屬性提供保護機制
3. 加強開發時的警告和除錯資訊
4. 更新文件說明樣式優先級行為

### 成功標準
- [ ] UserImportWizard 使用 `size="fullscreen"` 時顯示正確的全螢幕尺寸
- [ ] 不需要額外的 `webStyle` 或 `contentStyle` 覆蓋
- [ ] 開發模式下提供清晰的樣式衝突警告
- [ ] 所有現有的 AdaptiveModal 使用案例仍然正常運作

## 所需的全部上下文

### 文件與參考資料
```yaml
- file: /src/components/adaptive/core/AdaptiveModal.tsx
  why: Modal 元件實作，需要修改樣式處理邏輯
  
- file: /src/components/adaptive/styles/StylePriorityManager.ts
  why: 樣式優先級管理器，核心修改位置
  
- file: /src/components/adaptive/styles/types.ts
  why: 樣式優先級定義，可能需要新增保護層級
  
- file: /src/components/users/UserImportWizard.tsx
  why: 問題發生的元件，用於驗證修復效果
  
- doc: /docs/WEB-STYLE-SYSTEM.md
  why: 了解 Web 平台樣式系統的整體架構
  
- doc: /docs/STYLE-DEVELOPMENT-GUIDE.md
  why: 樣式開發最佳實踐參考
```

### 當前程式碼結構
```bash
src/
├── components/
│   ├── adaptive/
│   │   ├── core/
│   │   │   ├── AdaptiveModal.tsx          # Modal 元件
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   ├── StylePriorityManager.ts    # 樣式優先級管理
│   │   │   └── types.ts                   # 優先級定義
│   │   └── index.ts
│   └── users/
│       └── UserImportWizard.tsx           # 問題元件
```

### 已知問題和注意事項
```typescript
// 問題：StylePriority 優先級順序
// CONTENT_STYLE (41) > SIZE_PRESET (11)
// 導致 contentStyle 會覆蓋 size 屬性的設定

// 當前優先級定義：
export enum StylePriority {
  DEFAULT = 1,           // 元件預設樣式
  SIZE_PRESET = 11,      // 尺寸預設值 (small, medium, large)
  USER_STYLE = 21,       // 通用 style prop
  PLATFORM_STYLE = 31,   // webStyle/nativeStyle
  CONTENT_STYLE = 41,    // contentStyle, overlayStyle 等
}

// AdaptiveModal 問題代碼位置：
// Line 247-285: 樣式合併邏輯
// Line 102: getModalDimensions 函數定義 fullscreen 尺寸
```

## 實作藍圖

### 資料模型和結構

新增保護層級的樣式優先級：
```typescript
// types.ts 修改
export enum StylePriority {
  DEFAULT = 1,
  SIZE_PRESET = 11,
  USER_STYLE = 21,
  PLATFORM_STYLE = 31,
  CONTENT_STYLE = 41,
  PROTECTED_SIZE = 51,  // 新增：保護的尺寸屬性
}

// 定義受保護的屬性
export interface ProtectedStyleConfig {
  properties: string[];  // ['width', 'height', 'maxWidth', 'maxHeight']
  source: string;
  reason: string;
}
```

### 實作任務清單

```yaml
Task 1: 更新樣式優先級類型定義
MODIFY src/components/adaptive/styles/types.ts:
  - 新增 PROTECTED_SIZE 優先級層級
  - 新增 ProtectedStyleConfig 介面
  - 更新 StyleConfig 支援保護屬性

Task 2: 改進 StylePriorityManager
MODIFY src/components/adaptive/styles/StylePriorityManager.ts:
  - 新增 protectProperties 方法
  - 修改 mergeStyles 支援保護屬性
  - 加強衝突檢測和警告機制

Task 3: 更新 AdaptiveModal 樣式處理
MODIFY src/components/adaptive/core/AdaptiveModal.tsx:
  - 為 fullscreen 尺寸應用保護機制
  - 改進開發模式警告
  - 優化樣式合併邏輯

Task 4: 驗證和測試
CREATE src/components/adaptive/core/__tests__/AdaptiveModal.style.test.tsx:
  - 測試 size 屬性不被覆蓋
  - 測試保護機制運作
  - 測試警告訊息產生

Task 5: 移除 UserImportWizard 的 workaround
MODIFY src/components/users/UserImportWizard.tsx:
  - 移除不必要的 webStyle 和 contentStyle
  - 驗證 size="fullscreen" 正確運作

Task 6: 更新文件
CREATE docs/ADAPTIVE-MODAL-STYLE-GUIDE.md:
  - 說明樣式優先級行為
  - 提供最佳實踐範例
  - 記錄常見問題和解決方案
```

### 核心實作虛擬碼

```typescript
// Task 2: StylePriorityManager 改進
class StylePriorityManager {
  /**
   * 保護特定屬性不被覆蓋
   */
  protectProperties(
    style: any,
    properties: string[],
    priority: number
  ): StyleConfig {
    const protectedStyle: any = {};
    
    for (const prop of properties) {
      if (style[prop] !== undefined) {
        protectedStyle[prop] = style[prop];
      }
    }
    
    return {
      priority,
      style: protectedStyle,
      source: 'protected-properties',
      protected: true
    };
  }

  mergeStyles(configs: StyleConfig[], options?: StyleMergeOptions): StyleProcessResult {
    // 分離保護和非保護的樣式
    const protectedConfigs = configs.filter(c => c.protected);
    const regularConfigs = configs.filter(c => !c.protected);
    
    // 先合併常規樣式
    let mergedStyle = this.mergeRegularStyles(regularConfigs, options);
    
    // 然後應用保護的樣式（最高優先級）
    for (const config of protectedConfigs) {
      mergedStyle = { ...mergedStyle, ...config.style };
    }
    
    // 開發模式警告
    if (options?.debug) {
      this.warnConflicts(configs, mergedStyle);
    }
    
    return { style: mergedStyle };
  }
}

// Task 3: AdaptiveModal 改進
const WebModal = () => {
  const contentStyleFinal = useMemo(() => {
    const dimensions = getModalDimensions(size);
    const styleConfigs: StyleConfig[] = [];
    
    // 基礎樣式配置...
    
    // 如果是 fullscreen，保護尺寸屬性
    if (size === 'fullscreen') {
      const protectedProps = ['width', 'height', 'maxWidth', 'maxHeight', 'minHeight'];
      const protectedConfig = styleProcessor.protectProperties(
        dimensions,
        protectedProps,
        StylePriority.PROTECTED_SIZE
      );
      styleConfigs.push(protectedConfig);
      
      // 開發模式警告
      if (__DEV__ && contentStyle) {
        const conflicts = protectedProps.filter(
          prop => contentStyle[prop] !== undefined
        );
        if (conflicts.length > 0) {
          console.warn(
            `AdaptiveModal: contentStyle 嘗試覆蓋 size="fullscreen" 的屬性: ${conflicts.join(', ')}。` +
            `這些屬性將被忽略以保持 fullscreen 效果。`
          );
        }
      }
    }
    
    return styleProcessor.mergeStyles(styleConfigs, { debug: __DEV__ });
  }, [size, style, contentStyle]);
};
```

### 整合點
```yaml
TYPES:
  - 檔案: src/components/adaptive/styles/types.ts
  - 新增: PROTECTED_SIZE 優先級常數
  
STYLE_MANAGER:
  - 檔案: src/components/adaptive/styles/StylePriorityManager.ts
  - 新增: protectProperties 方法
  - 修改: mergeStyles 方法
  
MODAL:
  - 檔案: src/components/adaptive/core/AdaptiveModal.tsx
  - 修改: contentStyleFinal 計算邏輯
  - 新增: 開發模式衝突警告
```

## 驗證循環

### Level 1: 語法和樣式檢查
```bash
# 執行 ESLint 檢查
npm run lint

# 執行 TypeScript 檢查
npm run type-check

# 預期：沒有錯誤。如有錯誤，修復後重新執行
```

### Level 2: 單元測試
```typescript
// 測試保護機制
describe('AdaptiveModal Style Protection', () => {
  it('should protect fullscreen size from contentStyle override', () => {
    const { getByTestId } = render(
      <AdaptiveModal
        visible={true}
        size="fullscreen"
        contentStyle={{ width: '50%', height: '50%' }}
        testID="modal"
      />
    );
    
    const modal = getByTestId('modal');
    const style = window.getComputedStyle(modal);
    
    // 應該保持 fullscreen 尺寸，不被 contentStyle 覆蓋
    expect(style.width).toBe('95vw');
    expect(style.height).toBe('95vh');
  });
  
  it('should warn about style conflicts in dev mode', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    
    render(
      <AdaptiveModal
        visible={true}
        size="fullscreen"
        contentStyle={{ width: '50%' }}
      />
    );
    
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('contentStyle 嘗試覆蓋')
    );
  });
});
```

```bash
# 執行測試
npm test -- AdaptiveModal.style.test
```

### Level 3: 整合測試
```bash
# 啟動開發伺服器
npm run web

# 手動測試步驟：
# 1. 導航到用戶管理頁面
# 2. 點擊批量匯入按鈕
# 3. 驗證 Modal 是否全螢幕顯示
# 4. 檢查瀏覽器 Console 是否有樣式衝突警告

# 預期結果：
# - Modal 佔據 95% 的視窗寬高
# - 內容正確顯示，沒有溢出
# - Console 無錯誤（開發模式可能有警告）
```

## 最終驗證清單
- [ ] 所有測試通過：`npm test`
- [ ] 沒有 lint 錯誤：`npm run lint`
- [ ] 沒有類型錯誤：`npm run type-check`
- [ ] UserImportWizard Modal 全螢幕顯示正確
- [ ] 其他 Modal 使用案例未受影響
- [ ] 開發模式提供有用的警告訊息
- [ ] 文件已更新說明新的行為

## 反模式避免
- ❌ 不要硬編碼特定元件的修復
- ❌ 不要破壞現有的樣式優先級邏輯
- ❌ 不要忽略開發者體驗（警告、文件）
- ❌ 不要只修復症狀而不解決根本問題
- ❌ 不要讓保護機制過於嚴格影響靈活性

## 風險評估
- **低風險**: 只影響特定的 size 屬性保護
- **向後相容**: 現有使用不受影響
- **效能影響**: 極小，只增加條件判斷

## 成功信心評分
**8/10** - 問題已充分研究，解決方案明確，實作路徑清晰。主要風險在於需要仔細測試確保不影響現有功能。

---

*PRP 建立日期: 2025-08-14*
*預計執行時間: 2-3 小時*
*優先級: 高 - 影響核心功能使用體驗*