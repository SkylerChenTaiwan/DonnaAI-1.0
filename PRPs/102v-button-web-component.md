# PRP-102: 系統性解決 Web 平台按鈕樣式問題

## 執行摘要
建立統一的 Button.web.tsx 元件，徹底解決 Web 平台上按鈕樣式被全域 CSS 覆蓋的問題。目前有 2297 個 TouchableOpacity 使用實例分布在 133 個檔案中，需要系統性的解決方案。

## 問題背景

### 現況分析
1. **症狀**：黑色按鈕配黑色文字（應該是白色文字）
2. **根本原因**：
   - React Native Web 將 TouchableOpacity/Text 轉換成 HTML div/span
   - 這些元素繼承了 NotionDatabaseV4.css 的全域樣式
   - 內聯樣式被 CSS 優先級規則覆蓋

### 已成功的解決模式
| 元件 | 解決方式 | 檔案位置 |
|------|---------|----------|
| ProgressIndicator | 建立 .web.tsx，使用原生 HTML | `/src/components/common/ProgressIndicator/` |
| Dropdown | 建立 .web.tsx，使用原生 `<select>` | `/src/components/common/Dropdown/` |
| FormInput | 建立 .web.tsx，使用原生 `<input>` | `/src/components/common/FormInput/` |

### 參考文件
- `/docs/WEB-STYLE-SYSTEM.md` - Web 樣式系統指南
- `/docs/STYLE-DEVELOPMENT-GUIDE.md` - 開發指南

## 實作藍圖

### 階段一：建立 Button Web 元件架構

#### 1.1 建立 Button.web.tsx
```typescript
// src/components/common/Button/Button.web.tsx
import React from 'react';
import { webColorOverrides, webStyleOverrides } from '@/theme/webOverrides';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  onClick?: () => void; // Web 相容性
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: React.CSSProperties;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  'aria-label'?: string;
  'data-testid'?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style = {},
  className = '',
  type = 'button',
  fullWidth = false,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}) => {
  // 使用內聯樣式確保最高優先級
  const getButtonStyle = (): React.CSSProperties => {
    // 基礎樣式
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontFamily: 'inherit',
      fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.2s ease',
      outline: 'none',
      border: 'none',
      width: fullWidth ? '100%' : 'auto',
      boxSizing: 'border-box',
      userSelect: 'none',
      position: 'relative',
    };

    // 尺寸樣式
    const sizeStyles = {
      small: { padding: '6px 12px', fontSize: '13px', lineHeight: '18px' },
      medium: { padding: '8px 16px', fontSize: '14px', lineHeight: '20px' },
      large: { padding: '10px 20px', fontSize: '16px', lineHeight: '22px' },
    };

    // 變體樣式
    const variantStyles = {
      primary: {
        backgroundColor: webColorOverrides.button.primary.default,
        color: webColorOverrides.button.primary.text,
      },
      secondary: {
        backgroundColor: webColorOverrides.button.secondary.default,
        color: webColorOverrides.button.secondary.text,
      },
      outline: {
        backgroundColor: 'transparent',
        color: webColorOverrides.button.outline.text,
        border: `1px solid ${webColorOverrides.button.outline.border}`,
      },
      ghost: {
        backgroundColor: 'transparent',
        color: webColorOverrides.text.primary,
      },
      text: {
        backgroundColor: 'transparent',
        color: webColorOverrides.text.primary,
        padding: '0',
        textDecoration: 'underline',
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // 支援 onPress（React Native）和 onClick（Web）
    if (onClick) onClick();
    if (onPress) onPress();
  };

  // 渲染內容
  const renderContent = () => {
    if (loading) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="loading-spinner">⟳</span>
          {title || children}
        </span>
      );
    }

    const content = title || children;
    
    if (icon) {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {iconPosition === 'left' && icon}
          {content}
          {iconPosition === 'right' && icon}
        </span>
      );
    }

    return content;
  };

  return (
    <button
      type={type}
      style={getButtonStyle()}
      className={className}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel || title}
      data-testid={dataTestId}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
```

#### 1.2 更新原生 Button.tsx
```typescript
// src/components/common/Button/Button.native.tsx
// 將現有的 Button.tsx 重命名為 Button.native.tsx
// 內容保持不變
```

#### 1.3 建立平台選擇器
```typescript
// src/components/common/Button/index.tsx
import { Platform } from 'react-native';

// 根據平台動態載入
const Button = Platform.select({
  web: () => require('./Button.web').default,
  default: () => require('./Button.native').default,
})!();

export { Button };
export default Button;
```

### 階段二：建立 TouchableOpacity Web 包裝器

#### 2.1 建立 TouchableOpacity.web.tsx
```typescript
// src/components/common/TouchableOpacity/TouchableOpacity.web.tsx
import React from 'react';
import { ViewStyle } from 'react-native';

interface TouchableOpacityProps {
  onPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export const TouchableOpacity: React.FC<TouchableOpacityProps> = ({
  onPress,
  disabled = false,
  activeOpacity = 0.7,
  style,
  children,
  accessibilityRole = 'button',
  accessibilityLabel,
  testID,
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  // 轉換 React Native 樣式為 CSS
  const convertStyleToCSS = (rnStyle: any): React.CSSProperties => {
    if (!rnStyle) return {};
    
    // 處理樣式陣列
    if (Array.isArray(rnStyle)) {
      return rnStyle.reduce((acc, s) => ({ ...acc, ...convertStyleToCSS(s) }), {});
    }

    // 轉換單個樣式物件
    const cssStyle: React.CSSProperties = {};
    
    // 映射常見的 React Native 樣式到 CSS
    const styleMap: Record<string, string> = {
      paddingHorizontal: 'paddingLeft',
      paddingVertical: 'paddingTop',
      marginHorizontal: 'marginLeft',
      marginVertical: 'marginTop',
    };

    Object.entries(rnStyle).forEach(([key, value]) => {
      if (key === 'paddingHorizontal') {
        cssStyle.paddingLeft = `${value}px`;
        cssStyle.paddingRight = `${value}px`;
      } else if (key === 'paddingVertical') {
        cssStyle.paddingTop = `${value}px`;
        cssStyle.paddingBottom = `${value}px`;
      } else if (key === 'marginHorizontal') {
        cssStyle.marginLeft = `${value}px`;
        cssStyle.marginRight = `${value}px`;
      } else if (key === 'marginVertical') {
        cssStyle.marginTop = `${value}px`;
        cssStyle.marginBottom = `${value}px`;
      } else if (typeof value === 'number' && !key.includes('flex') && !key.includes('opacity')) {
        cssStyle[key as any] = `${value}px`;
      } else {
        cssStyle[key as any] = value;
      }
    });

    return cssStyle;
  };

  const buttonStyle: React.CSSProperties = {
    ...convertStyleToCSS(style),
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : isPressed ? activeOpacity : 1,
    transition: 'opacity 0.2s ease',
    border: 'none',
    background: 'none',
    padding: 0,
    font: 'inherit',
    color: 'inherit',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <button
      onClick={disabled ? undefined : onPress}
      disabled={disabled}
      style={buttonStyle}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      role={accessibilityRole}
      aria-label={accessibilityLabel}
      data-testid={testID}
    >
      {children}
    </button>
  );
};

export default TouchableOpacity;
```

#### 2.2 建立 Text.web.tsx
```typescript
// src/components/common/Text/Text.web.tsx
import React from 'react';
import { TextStyle } from 'react-native';

interface TextProps {
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  selectable?: boolean;
  accessibilityRole?: string;
  testID?: string;
}

export const Text: React.FC<TextProps> = ({
  style,
  children,
  numberOfLines,
  ellipsizeMode = 'tail',
  selectable = false,
  accessibilityRole = 'text',
  testID,
}) => {
  // 轉換 React Native 樣式為 CSS
  const convertStyleToCSS = (rnStyle: any): React.CSSProperties => {
    if (!rnStyle) return {};
    
    if (Array.isArray(rnStyle)) {
      return rnStyle.reduce((acc, s) => ({ ...acc, ...convertStyleToCSS(s) }), {});
    }

    const cssStyle: React.CSSProperties = {};
    
    Object.entries(rnStyle).forEach(([key, value]) => {
      // 確保顏色值使用 !important 來覆蓋全域 CSS
      if (key === 'color') {
        cssStyle.color = `${value} !important`;
      } else if (key === 'fontSize' && typeof value === 'number') {
        cssStyle.fontSize = `${value}px`;
      } else if (key === 'lineHeight' && typeof value === 'number') {
        cssStyle.lineHeight = `${value}px`;
      } else if (key === 'fontWeight') {
        cssStyle.fontWeight = value as any;
      } else {
        cssStyle[key as any] = value;
      }
    });

    // 處理文字截斷
    if (numberOfLines) {
      cssStyle.overflow = 'hidden';
      cssStyle.textOverflow = 'ellipsis';
      cssStyle.display = '-webkit-box';
      cssStyle.WebkitLineClamp = numberOfLines;
      cssStyle.WebkitBoxOrient = 'vertical';
    }

    // 處理選擇性
    cssStyle.userSelect = selectable ? 'text' : 'none';

    return cssStyle;
  };

  return (
    <span
      style={convertStyleToCSS(style)}
      role={accessibilityRole}
      data-testid={testID}
    >
      {children}
    </span>
  );
};

export default Text;
```

### 階段三：遷移策略

#### 3.1 第一批優先遷移（ImportWizard 相關）
```bash
# 需要優先修改的檔案
src/components/import/ImportWizard.tsx
src/components/import/stages/DatabaseSelector.tsx
src/components/import/stages/FieldMapper.tsx
src/components/import/stages/DataAssignmentStep.tsx
src/components/import/IntelligentFieldMapper.tsx
```

#### 3.2 遷移範例
```typescript
// 原始程式碼
import { TouchableOpacity, Text } from 'react-native';

<TouchableOpacity style={styles.button} onPress={handlePress}>
  <Text style={styles.buttonText}>確認</Text>
</TouchableOpacity>

// 改為使用 Button 元件
import { Button } from '@/components/common/Button';

<Button
  title="確認"
  variant="primary"
  onPress={handlePress}
/>
```

### 階段四：測試驗證

#### 4.1 單元測試
```typescript
// src/tests/components/common/Button.web.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/Button/Button.web';
import { calculateContrast } from '@/utils/colorContrast';

describe('Button.web', () => {
  test('主要按鈕文字對比度符合 WCAG AA', () => {
    const { getByTestId } = render(
      <Button title="測試" variant="primary" data-testid="test-button" />
    );
    
    const button = getByTestId('test-button');
    const styles = window.getComputedStyle(button);
    
    // 驗證背景色和文字色
    expect(styles.backgroundColor).toBe('#1A1A1A');
    expect(styles.color).toBe('#FFFFFF');
    
    // 計算對比度
    const contrast = calculateContrast('#FFFFFF', '#1A1A1A');
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test('按鈕點擊事件正常觸發', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button title="點擊我" onPress={handleClick} />
    );
    
    fireEvent.click(getByText('點擊我'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('禁用狀態無法點擊', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <Button title="禁用按鈕" onPress={handleClick} disabled />
    );
    
    fireEvent.click(getByText('禁用按鈕'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

#### 4.2 視覺測試腳本
```javascript
// scripts/testButtonVisual.js
const puppeteer = require('puppeteer');
const path = require('path');

async function testButtonVisual() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:3002/admin/organization/1HuFLKCrQBOQUp3cURLv');
  
  // 等待按鈕載入
  await page.waitForSelector('button');
  
  // 截圖所有按鈕狀態
  const screenshots = [];
  
  // 正常狀態
  screenshots.push(await page.screenshot({ 
    path: 'tests/screenshots/buttons-normal.png',
    fullPage: false 
  }));
  
  // Hover 狀態
  const buttons = await page.$$('button');
  for (const button of buttons) {
    await button.hover();
    screenshots.push(await page.screenshot({ 
      path: `tests/screenshots/button-hover-${Date.now()}.png`,
      fullPage: false 
    }));
  }
  
  // 檢查對比度
  const contrastResults = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const results = [];
    
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      results.push({
        text: button.textContent,
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        fontSize: styles.fontSize
      });
    });
    
    return results;
  });
  
  console.log('按鈕樣式檢查結果：', contrastResults);
  
  await browser.close();
}

testButtonVisual().catch(console.error);
```

## 驗證檢查點

### 必須通過的測試
```bash
# 1. 程式碼品質檢查
npm run lint
npm run type-check

# 2. 單元測試
npm run test -- Button

# 3. 視覺測試
node scripts/testButtonVisual.js

# 4. 對比度驗證
npm run audit:contrast
```

### 成功標準
- [ ] 所有按鈕文字對比度 >= 4.5:1（WCAG AA）
- [ ] 按鈕在 hover/active 狀態有視覺回饋
- [ ] 禁用狀態明顯可辨識
- [ ] 載入狀態有適當指示器
- [ ] 支援鍵盤導航（Tab、Enter、Space）
- [ ] 無控制台錯誤或警告

## 實作順序

1. **階段一**（30 分鐘）
   - 建立 Button.web.tsx
   - 建立 Button.native.tsx（重命名現有的）
   - 建立 index.tsx 平台選擇器
   - 建立單元測試

2. **階段二**（20 分鐘）
   - 建立 TouchableOpacity.web.tsx
   - 建立 Text.web.tsx
   - 測試包裝器功能

3. **階段三**（40 分鐘）
   - 遷移 ImportWizard 相關元件
   - 逐步替換 TouchableOpacity 為 Button
   - 驗證每個改動

4. **階段四**（20 分鐘）
   - 執行完整測試套件
   - 視覺驗證
   - 部署測試

## 風險與緩解

### 風險 1：大規模遷移造成破壞
**緩解**：分批次遷移，優先處理問題最嚴重的區域

### 風險 2：樣式不一致
**緩解**：建立統一的 webStyleOverrides，所有 Web 元件共用

### 風險 3：效能影響
**緩解**：使用 React.memo 和適當的優化策略

## 參考資源

### 內部檔案
- `/src/components/common/Dropdown/Dropdown.web.tsx` - Dropdown Web 實作參考
- `/src/theme/webOverrides.ts` - Web 平台顏色定義
- `/src/components/common/ButtonStyles.ts` - 按鈕樣式常量
- `/docs/WEB-STYLE-SYSTEM.md` - Web 樣式系統文件

### 外部資源
- [WCAG 2.1 對比度指南](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [React Native Web 文件](https://necolas.github.io/react-native-web/docs/)
- [CSS-in-JS 最佳實踐](https://github.com/styled-components/styled-components/blob/main/docs/basics.md)

## 預期成果

1. **立即效果**
   - 修復所有按鈕的文字顏色問題
   - 確保對比度符合 WCAG AA 標準
   - 統一的按鈕行為和樣式

2. **長期價值**
   - 建立可重用的 Web 元件模式
   - 減少未來的樣式衝突
   - 提升無障礙訪問性

## 執行信心評分

**8/10**

### 評分理由
- **+3** 有明確的成功模式可參考（Dropdown、FormInput）
- **+2** 問題根源已完全理解
- **+2** 有完整的測試策略
- **+1** 分階段實施降低風險
- **-1** 需要處理大量檔案（133個）
- **-1** 可能有未預見的邊界情況

---

**執行時間預估**：2-3 小時
**優先級**：🔴 高（直接影響用戶體驗）
**影響範圍**：全站所有按鈕元件