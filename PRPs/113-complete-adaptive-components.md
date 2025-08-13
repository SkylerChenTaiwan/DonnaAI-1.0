# PRP-113: 完成剩餘 Adaptive 元件實作

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: 📋 待執行  
**優先級**: 🟡 中  
**類型**: 🧩 元件開發  
**信心分數**: 8/10  
**前置條件**: PRP-111 完成（AdaptiveSwitch）

## Goal
完成 PRP-94 承諾但未實作的剩餘 Adaptive 元件，達到 20+ 核心元件的目標，覆蓋 80% 以上的常用 UI 場景。

## Why
- **未完成承諾**：PRP-94 承諾 20+ 元件，目前只有 8 個完成
- **持續問題**：許多常用元件仍缺少 Web 安全版本
- **開發摩擦**：開發者經常需要自己處理平台差異
- **維護負擔**：相同的平台判斷邏輯重複出現在多處

## What
建立剩餘的高優先級 Adaptive 元件：

### 核心表單元件（優先）
1. **AdaptiveCheckbox** - 複選框
2. **AdaptiveRadio** - 單選按鈕
3. **AdaptiveSlider** - 滑動條
4. **AdaptiveDatePicker** - 日期選擇器

### 常用 UI 元件
5. **AdaptiveSearchBar** - 搜尋欄
6. **AdaptiveAvatar** - 頭像
7. **AdaptiveCard** - 卡片容器
8. **AdaptiveDivider** - 分隔線

### 進階元件
9. **AdaptiveTooltip** - 工具提示
10. **AdaptivePopover** - 彈出框
11. **AdaptiveAccordion** - 手風琴
12. **AdaptiveTabs** - 標籤頁

### Success Criteria
- [ ] 12 個新元件全部實作完成
- [ ] 每個元件都有 Web 和 Native 版本
- [ ] 全部通過跨平台測試
- [ ] 文件和範例完整
- [ ] 總計達到 20+ Adaptive 元件

## All Needed Context

### Documentation & References
```yaml
- url: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
  why: HTML 表單元件參考，用於 Web 版本實作
  
- url: https://www.w3.org/WAI/ARIA/apg/patterns/
  why: 無障礙設計模式，確保元件符合標準
  
- url: https://reactnative.dev/docs/components-and-apis
  why: React Native 元件 API 參考

- file: /src/components/adaptive/core/AdaptiveSwitch/
  why: 參考實作模式（來自 PRP-111）
  
- file: /src/components/common/Button/Button.web.tsx
  why: Web 元件實作範例
  
- file: /docs/WEB-STYLE-SYSTEM.md
  why: Web 樣式系統指南
```

### 使用頻率分析
```typescript
// 基於程式碼掃描的元件需求優先級
1. Checkbox - 10+ 使用場景（設定、表單、批量選擇）
2. SearchBar - 7 個頁面使用（但無 Web 版本）
3. DatePicker - 5+ 表單使用
4. Radio - 4+ 設定頁面
5. Slider - 3 個設定項
```

## Implementation Blueprint

### 元件模板結構
```
/src/components/adaptive/core/
├── AdaptiveCheckbox/
│   ├── index.tsx
│   ├── AdaptiveCheckbox.web.tsx
│   ├── AdaptiveCheckbox.native.tsx
│   ├── AdaptiveCheckbox.types.ts
│   └── __tests__/
├── AdaptiveRadio/
├── AdaptiveSlider/
├── AdaptiveDatePicker/
├── AdaptiveSearchBar/
├── AdaptiveAvatar/
├── AdaptiveCard/
├── AdaptiveDivider/
├── AdaptiveTooltip/
├── AdaptivePopover/
├── AdaptiveAccordion/
└── AdaptiveTabs/
```

### 實作範例：AdaptiveCheckbox

#### 類型定義
```typescript
// AdaptiveCheckbox.types.ts
export interface AdaptiveCheckboxProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  
  // 樣式
  color?: string;
  size?: 'small' | 'medium' | 'large';
  
  // 標籤
  label?: string;
  labelPosition?: 'left' | 'right';
  
  // 狀態
  indeterminate?: boolean;
  
  // 無障礙
  accessibilityLabel?: string;
  testID?: string;
}
```

#### Web 實作
```typescript
// AdaptiveCheckbox.web.tsx
export const AdaptiveCheckbox: React.FC<AdaptiveCheckboxProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  color = '#FE7821',
  size = 'medium',
  label,
  labelPosition = 'right',
  indeterminate = false,
  ...props
}) => {
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24
  };
  
  const checkboxSize = sizeMap[size];
  
  const checkboxStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: `${checkboxSize}px`,
    height: `${checkboxSize}px`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
  
  const boxStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: `2px solid ${value ? color : '#E3E1DC'}`,
    borderRadius: '4px',
    backgroundColor: value ? color : 'transparent',
    transition: 'all 0.2s ease',
  };
  
  const checkStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    display: value ? 'block' : 'none',
  };
  
  return (
    <label style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '8px',
      cursor: disabled ? 'not-allowed' : 'pointer' 
    }}>
      {label && labelPosition === 'left' && <span>{label}</span>}
      <div style={checkboxStyle}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onValueChange?.(e.target.checked)}
          disabled={disabled}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
          aria-label={props.accessibilityLabel}
          data-testid={props.testID}
        />
        <div style={boxStyle} />
        {value && (
          <svg
            style={checkStyle}
            width={checkboxSize * 0.6}
            height={checkboxSize * 0.6}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 6L9 17L4 12"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && labelPosition === 'right' && <span>{label}</span>}
    </label>
  );
};
```

### 批量實作策略

#### Step 1: 元件生成器腳本
```typescript
// scripts/generate-adaptive-component.ts
import * as fs from 'fs';
import * as path from 'path';

function generateAdaptiveComponent(name: string) {
  const componentDir = path.join(
    process.cwd(),
    'src/components/adaptive/core',
    `Adaptive${name}`
  );
  
  // 建立目錄
  fs.mkdirSync(componentDir, { recursive: true });
  
  // 生成檔案
  generateIndexFile(componentDir, name);
  generateWebFile(componentDir, name);
  generateNativeFile(componentDir, name);
  generateTypesFile(componentDir, name);
  generateTestFile(componentDir, name);
  
  console.log(`✅ Generated Adaptive${name} component`);
}

// 使用範例
['Checkbox', 'Radio', 'Slider', 'DatePicker'].forEach(generateAdaptiveComponent);
```

#### Step 2: 通用 Web 樣式處理
```typescript
// src/components/adaptive/utils/webStyles.ts
export const getWebInputStyle = (disabled: boolean): React.CSSProperties => ({
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '14px',
  lineHeight: '20px',
  padding: '8px 12px',
  border: '1px solid #E3E1DC',
  borderRadius: '6px',
  backgroundColor: disabled ? '#F5F5F5' : '#FFFFFF',
  color: disabled ? '#999999' : '#1A1A1A',
  outline: 'none',
  transition: 'all 0.2s ease',
  cursor: disabled ? 'not-allowed' : 'text',
  boxSizing: 'border-box',
  width: '100%',
});

export const getWebButtonStyle = (
  variant: string,
  disabled: boolean
): React.CSSProperties => {
  // 共用按鈕樣式邏輯
};
```

### 優先實作順序

#### Phase 1: 高頻表單元件（第 1 天）
1. AdaptiveCheckbox - 最常用
2. AdaptiveRadio - 設定頁面需要
3. AdaptiveSearchBar - 多處使用但無 Web 版

#### Phase 2: 進階表單元件（第 2 天）
4. AdaptiveDatePicker - 表單常用
5. AdaptiveSlider - 設定頁面
6. AdaptiveTimePicker - 配合日期選擇

#### Phase 3: UI 容器元件（第 3 天）
7. AdaptiveCard - 卡片布局
8. AdaptiveDivider - 分隔線
9. AdaptiveAvatar - 用戶頭像

#### Phase 4: 互動元件（第 4 天）
10. AdaptiveTooltip - 提示訊息
11. AdaptivePopover - 彈出選單
12. AdaptiveTabs - 標籤切換

## Tasks (執行順序)

1. **建立元件生成器** (2 小時)
   - 建立腳本自動生成元件模板
   - 生成基本檔案結構
   - 加入類型定義

2. **Phase 1: 表單元件** (1 天)
   - AdaptiveCheckbox
   - AdaptiveRadio
   - AdaptiveSearchBar
   - 包含測試

3. **Phase 2: 進階表單** (1 天)
   - AdaptiveDatePicker
   - AdaptiveSlider
   - AdaptiveTimePicker
   - 包含測試

4. **Phase 3: UI 容器** (1 天)
   - AdaptiveCard
   - AdaptiveDivider
   - AdaptiveAvatar
   - 包含測試

5. **Phase 4: 互動元件** (1 天)
   - AdaptiveTooltip
   - AdaptivePopover
   - AdaptiveTabs
   - 包含測試

6. **整合和文件** (0.5 天)
   - 更新 CLAUDE.md
   - 建立使用範例
   - 更新元件清單
   - 發布說明

## Validation Gates

### 單元測試
```bash
# 測試所有新元件
npm test -- --testPathPattern="adaptive/core"

# 測試覆蓋率
npm run test:coverage -- adaptive
```

### 跨平台測試
```bash
# Web 平台
npm run web
# 手動測試每個元件

# iOS 平台
npm run ios

# Android 平台
npm run android
```

### 視覺測試
```bash
# Storybook（如果有）
npm run storybook

# 截圖對比
npm run test:visual
```

### 性能測試
```typescript
// 測試渲染性能
const start = performance.now();
render(<AdaptiveCheckbox />);
const renderTime = performance.now() - start;
expect(renderTime).toBeLessThan(16); // 60fps
```

## Error Handling

### 降級策略
```typescript
// 元件載入失敗時的降級
const AdaptiveComponent = Platform.select({
  web: () => {
    try {
      return require('./Component.web').default;
    } catch {
      // 降級到原生 HTML
      return DefaultHTMLComponent;
    }
  },
  default: () => require('./Component.native').default
})();
```

### 錯誤邊界
```typescript
// 包裝錯誤邊界
class AdaptiveErrorBoundary extends React.Component {
  componentDidCatch(error: Error) {
    console.error('Adaptive component error:', error);
    // 回報錯誤但不崩潰
  }
  
  render() {
    return this.props.children;
  }
}
```

## Quality Checklist
- [ ] 每個元件都有 Web 和 Native 版本
- [ ] 所有元件使用內聯樣式（Web）
- [ ] API 跨平台一致
- [ ] 無障礙支援完整
- [ ] 測試覆蓋率 > 80%
- [ ] 文件範例清楚
- [ ] TypeScript 類型完整

## Post-Implementation Metrics
- Adaptive 元件總數：20+
- 覆蓋場景：80%+
- Web 樣式問題：減少 90%
- 開發效率：提升 40%
- 程式碼重複：減少 60%

## Migration Guide
```typescript
// 遷移指南範例
// Before
import { CheckBox } from 'react-native-elements';

// After
import { AdaptiveCheckbox } from '@/components/adaptive';

// API 對照
<CheckBox
  checked={checked}
  onPress={() => setChecked(!checked)}
/>
// 改為
<AdaptiveCheckbox
  value={checked}
  onValueChange={setChecked}
/>
```

---

**信心分數: 8/10**
- 有明確的實作模式（來自已完成的元件）
- 批量處理可提高效率
- 部分元件（如 DatePicker）可能較複雜
- 需要 4-5 天完整實作時間