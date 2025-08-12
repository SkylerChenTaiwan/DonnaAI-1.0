# 顏色系統遷移指南

## 問題背景
React Native Web 在處理顏色字串連接（如 `color + '20'`）時會觸發 CSSStyleDeclaration 錯誤，導致頁面無法正常渲染。

## 問題規模
- **69 處** 需要修復的顏色定義
- 影響多個核心模組
- 在 Native 環境正常，僅 Web 平台出錯

## 解決方案

### 短期方案（已實施）
使用 `withAlpha()` 輔助函數逐步替換問題代碼：

```typescript
// ❌ 錯誤方式
backgroundColor: DesignSystem.colors.primary + '20'

// ✅ 正確方式
import { withAlpha } from '@/utils/colorUtils';
backgroundColor: withAlpha(DesignSystem.colors.primary, 0.125)
```

### 中期方案（建議）
1. **建立預定義的透明度顏色**
```typescript
// theme/designSystem.ts
export const DesignSystem = {
  colors: {
    primary: '#007AFF',
    primaryAlpha10: 'rgba(0, 122, 255, 0.063)',
    primaryAlpha20: 'rgba(0, 122, 255, 0.125)',
    primaryAlpha30: 'rgba(0, 122, 255, 0.188)',
    // ...
  }
}
```

2. **使用 ESLint 規則防止新問題**
```javascript
// .eslintrc.js
rules: {
  'no-restricted-syntax': [
    'error',
    {
      selector: "BinaryExpression[operator='+'][left.property.name=/color/i][right.type='Literal']",
      message: '請使用 withAlpha() 函數處理顏色透明度'
    }
  ]
}
```

### 長期方案（最佳實踐）
1. **TypeScript 類型系統**
```typescript
type ColorWithAlpha = {
  color: string;
  alpha: number;
}

function createColor(base: string, alpha?: number): string {
  return alpha ? withAlpha(base, alpha) : base;
}
```

2. **樣式工廠函數**
```typescript
const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    backgroundColor: theme.withAlpha('primary', 0.1)
  }
});
```

## 遷移步驟

### 第一階段：關鍵頁面修復（優先級高）
- [x] OrganizationDetailScreen
- [ ] AdaptiveSelect
- [ ] UserFieldMapper
- [ ] BillingManagementSection
- [ ] AddUserToOrganizationModal

### 第二階段：全面替換（優先級中）
- [ ] 所有 onboarding 步驟元件
- [ ] 所有 organization 相關元件
- [ ] 所有 import 相關元件

### 第三階段：預防機制（優先級低）
- [ ] 加入 ESLint 規則
- [ ] 建立自動化測試
- [ ] 更新開發指南

## 測試策略

### 單元測試
```typescript
describe('colorUtils', () => {
  it('should convert hex with alpha correctly', () => {
    expect(withAlpha('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.50)');
    expect(withAlpha('#FF0000', '80')).toBe('rgba(255, 0, 0, 0.50)');
  });
});
```

### Web 平台測試
```bash
# 建置前清理快取
rm -rf .expo node_modules/.cache

# 建置並測試
npm run web:build
npm run web:preview

# 測試清單
- [ ] 組織詳情頁面
- [ ] 用戶管理頁面
- [ ] 計費管理頁面
- [ ] 自訂欄位模態
```

## 預防措施

### 開發檢查清單
1. **編碼時**
   - 永遠不要使用 `color + 'XX'` 格式
   - 使用 `withAlpha()` 函數
   - 參考 colorUtils.ts 文件

2. **提交前**
   - 執行 `npm run lint`
   - 在 Web 平台測試受影響頁面
   - 檢查瀏覽器控制台錯誤

3. **Code Review**
   - 檢查所有顏色相關的樣式
   - 確認使用正確的透明度處理方式
   - 驗證跨平台兼容性

## 常見錯誤模式

```typescript
// ❌ 所有這些都會在 Web 平台出錯
backgroundColor: color + '20'
borderColor: DesignSystem.colors.primary + '40'
shadowColor: theme.colors.black + '10'

// ✅ 正確的替代方式
backgroundColor: withAlpha(color, 0.125)
borderColor: withAlpha(DesignSystem.colors.primary, 0.25)
shadowColor: withAlpha(theme.colors.black, 0.063)
```

## 透明度對照表
| Hex | Decimal | Percentage |
|-----|---------|------------|
| 10  | 16/255  | 6.3%       |
| 20  | 32/255  | 12.5%      |
| 30  | 48/255  | 18.8%      |
| 40  | 64/255  | 25%        |
| 80  | 128/255 | 50%        |
| CC  | 204/255 | 80%        |

## 相關資源
- [colorUtils.ts](/src/utils/colorUtils.ts) - 顏色處理工具
- [WEB-STYLE-SYSTEM.md](/docs/WEB-STYLE-SYSTEM.md) - Web 樣式系統文件
- [React Native Web Issues](https://github.com/necolas/react-native-web/issues) - 相關問題討論