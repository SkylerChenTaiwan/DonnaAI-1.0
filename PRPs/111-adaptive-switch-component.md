# PRP-111: AdaptiveSwitch 跨平台開關元件實作

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: 📋 待執行  
**優先級**: 🔴 高  
**類型**: 🧩 元件開發  
**信心分數**: 9/10  
**前置條件**: PRP-94 架構已建立

## Goal
建立完整的 AdaptiveSwitch 跨平台開關元件，解決目前 Web 平台上 Switch 樣式被全域 CSS 覆蓋的問題，提供統一的 API 和一致的使用者體驗。

## Why
- **急迫問題**：使用者回報欄位配置界面的 Switch 元件在 Web 上顯示異常（軌道顏色透明）
- **重複問題**：5+ 個檔案使用 React Native Switch，都有潛在的 Web 樣式問題
- **維護困難**：每次都要為 Switch 寫 Platform.OS 判斷和特殊處理
- **使用者體驗不一致**：Web 和 Native 的 Switch 行為和外觀不同

## What
建立完整的 AdaptiveSwitch 元件系統，包含：

1. **核心元件**
   - `AdaptiveSwitch.tsx` - 主元件（平台判斷）
   - `AdaptiveSwitch.web.tsx` - Web 專用版本（原生 HTML）
   - `AdaptiveSwitch.native.tsx` - Native 版本（React Native Switch）

2. **樣式系統**
   - 完整的內聯樣式（避免被全域 CSS 覆蓋）
   - 支援多種顏色主題
   - 動畫過渡效果

3. **功能特性**
   - 統一的 API（value/onValueChange）
   - 鍵盤無障礙支援
   - 標籤整合
   - 禁用狀態

### Success Criteria
- [ ] Web 平台上 Switch 樣式正確顯示（橘色開啟、灰色關閉）
- [ ] 所有現有 Switch 使用處成功遷移
- [ ] 通過跨平台測試（Web/iOS/Android）
- [ ] 無障礙測試通過（鍵盤操作、螢幕閱讀器）
- [ ] 效能測試通過（切換延遲 < 16ms）

## All Needed Context

### Documentation & References
```yaml
- url: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox
  why: HTML checkbox 作為 switch 的基礎，包含無障礙最佳實踐
  
- url: https://www.w3.org/WAI/ARIA/apg/patterns/switch/
  why: WAI-ARIA switch 角色規範，確保無障礙合規
  
- url: https://reactnative.dev/docs/switch
  why: React Native Switch API 參考，保持相容性

- file: /src/components/common/Button/Button.web.tsx
  why: 現有的 Web 元件實作模式參考
  
- file: /src/components/adaptive/core/AdaptiveModal.tsx
  why: 現有的 Adaptive 元件架構參考
  
- file: /docs/WEB-STYLE-SYSTEM.md
  why: Web 樣式系統指南和問題背景
```

### 現有問題範例
```typescript
// FieldEditPopover.tsx - 問題程式碼
import { Switch } from 'react-native'; // Web 上會被 CSS 覆蓋

<Switch
  value={isRequired}
  onValueChange={setIsRequired}
  trackColor={{ false: '#E3E1DC', true: '#1A1A1A' }} // Web 上無效
/>
```

### 需要遷移的檔案
1. `/src/components/common/ColumnSettingsModal.tsx`
2. `/src/components/database/notion/FieldEditPopover.tsx`
3. `/src/components/import/stages/FieldMapper.tsx`
4. `/src/components/import/stages/RelationEditorModal.tsx`
5. `/src/screens/superadmin/OrganizationDetailScreen.tsx`

## Implementation Blueprint

### 檔案結構
```
/src/components/adaptive/core/
├── AdaptiveSwitch/
│   ├── index.tsx              # 主入口（Platform.select）
│   ├── AdaptiveSwitch.web.tsx # Web 實作
│   ├── AdaptiveSwitch.native.tsx # Native 實作
│   ├── AdaptiveSwitch.types.ts # 類型定義
│   └── __tests__/
│       └── AdaptiveSwitch.test.tsx
```

### 實作步驟

#### Step 1: 類型定義
```typescript
// AdaptiveSwitch.types.ts
export interface AdaptiveSwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  
  // 樣式
  trackColor?: {
    false?: string;
    true?: string;
  };
  thumbColor?: string;
  
  // 標籤
  label?: string;
  labelPosition?: 'left' | 'right';
  
  // Web 特定
  name?: string;
  id?: string;
  className?: string;
  
  // 無障礙
  accessibilityLabel?: string;
  testID?: string;
}
```

#### Step 2: Web 實作（重點）
```typescript
// AdaptiveSwitch.web.tsx
export const AdaptiveSwitch: React.FC<AdaptiveSwitchProps> = ({
  value = false,
  onValueChange,
  disabled = false,
  trackColor = { false: '#E3E1DC', true: '#FE7821' },
  thumbColor = '#FFFFFF',
  label,
  labelPosition = 'right',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onValueChange) {
      onValueChange(e.target.checked);
    }
  };

  // 使用內聯樣式確保最高優先級
  const switchStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '51px',
    height: '31px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: value ? trackColor.true : trackColor.false,
    borderRadius: '34px',
    transition: 'background-color 0.2s',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: value ? '22px' : '2px',
    width: '27px',
    height: '27px',
    backgroundColor: thumbColor,
    borderRadius: '50%',
    transition: 'left 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      {label && labelPosition === 'left' && <span>{label}</span>}
      <div style={switchStyle}>
        <input
          type="checkbox"
          checked={value}
          onChange={handleChange}
          disabled={disabled}
          style={{ opacity: 0, width: 0, height: 0 }}
          aria-label={props.accessibilityLabel}
          data-testid={props.testID}
        />
        <div style={trackStyle} />
        <div style={thumbStyle} />
      </div>
      {label && labelPosition === 'right' && <span>{label}</span>}
    </label>
  );
};
```

#### Step 3: Native 實作
```typescript
// AdaptiveSwitch.native.tsx
import { Switch } from 'react-native';

export const AdaptiveSwitch: React.FC<AdaptiveSwitchProps> = ({
  value,
  onValueChange,
  disabled,
  trackColor = { false: '#E3E1DC', true: '#FE7821' },
  thumbColor,
  ...props
}) => {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={trackColor}
      thumbColor={thumbColor}
      {...props}
    />
  );
};
```

#### Step 4: 主入口
```typescript
// index.tsx
import { Platform } from 'react-native';

const AdaptiveSwitch = Platform.select({
  web: () => require('./AdaptiveSwitch.web').AdaptiveSwitch,
  default: () => require('./AdaptiveSwitch.native').AdaptiveSwitch,
})();

export default AdaptiveSwitch;
export * from './AdaptiveSwitch.types';
```

#### Step 5: 遷移現有程式碼
```typescript
// Before
import { Switch } from 'react-native';
<Switch value={enabled} onValueChange={setEnabled} />

// After
import { AdaptiveSwitch } from '@/components/adaptive';
<AdaptiveSwitch value={enabled} onValueChange={setEnabled} />
```

## Tasks (執行順序)

1. **建立元件結構** (30 分鐘)
   - 建立 AdaptiveSwitch 目錄結構
   - 建立類型定義檔案
   - 設定匯出路徑

2. **實作 Web 版本** (60 分鐘)
   - 建立 AdaptiveSwitch.web.tsx
   - 實作完整的內聯樣式
   - 加入動畫過渡效果
   - 測試樣式優先級

3. **實作 Native 版本** (15 分鐘)
   - 建立 AdaptiveSwitch.native.tsx
   - 包裝 React Native Switch
   - 確保 API 一致性

4. **建立測試套件** (45 分鐘)
   - 單元測試
   - 跨平台測試
   - 無障礙測試

5. **遷移現有使用** (60 分鐘)
   - 更新 5 個檔案的 Switch import
   - 測試每個使用場景
   - 修復任何相容性問題

6. **更新文件** (30 分鐘)
   - 更新 CLAUDE.md
   - 建立使用範例
   - 更新元件清單

## Validation Gates

### 語法和樣式檢查
```bash
# TypeScript 檢查
npx tsc --noEmit

# ESLint 檢查
npm run lint

# 格式化
npm run format
```

### 單元測試
```bash
# 執行 AdaptiveSwitch 測試
npm test -- AdaptiveSwitch

# 測試覆蓋率
npm run test:coverage -- AdaptiveSwitch
```

### 跨平台測試
```bash
# Web 平台測試
npm run web
# 手動測試：檢查 Switch 樣式是否正確

# iOS 測試
npm run ios
# 手動測試：確認 Switch 行為一致

# Android 測試  
npm run android
# 手動測試：確認 Switch 行為一致
```

### 視覺回歸測試
```bash
# 截圖對比（如果有設定）
npm run test:visual
```

## Error Handling

### 常見問題處理
1. **樣式被覆蓋**：確保使用內聯樣式，優先級最高
2. **動畫卡頓**：使用 CSS transition 而非 JavaScript 動畫
3. **鍵盤操作**：確保 input 元素可獲得焦點
4. **狀態不同步**：使用受控元件模式

### 錯誤邊界
```typescript
// 包裝錯誤邊界防止元件崩潰
try {
  // 元件邏輯
} catch (error) {
  console.error('AdaptiveSwitch error:', error);
  // 降級到原生 checkbox
}
```

## Post-Implementation Checklist
- [ ] 所有測試通過
- [ ] Web 平台樣式正確（無被覆蓋）
- [ ] Native 平台行為一致
- [ ] 無障礙功能完整
- [ ] 文件更新完成
- [ ] 現有程式碼成功遷移
- [ ] Code Review 通過

## Rollback Plan
如果出現問題，可以：
1. 保留舊的 Switch import（暫時共存）
2. 使用 feature flag 控制使用新/舊元件
3. Git revert 相關 commits

---

**信心分數: 9/10**
- 有明確的參考實作（Button.web.tsx）
- 問題明確且解決方案驗證過
- 風險可控（獨立元件，不影響其他功能）