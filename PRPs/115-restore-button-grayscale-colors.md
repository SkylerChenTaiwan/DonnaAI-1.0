# PRP-115: 恢復按鈕灰階顏色設計

## 📋 問題描述
按鈕的顏色被改成了彩色的，不符合我們的 UI 設計風格。需要回到之前的按鈕顏色設計。有很多按鈕都被改了，不是只有一頁的按鈕。

## 🎯 目標
- 恢復所有按鈕到 Notion 風格的單色灰階設計
- 確保整個應用程式的按鈕風格一致
- 移除所有硬編碼的彩色值

## 📊 現況分析

### 設計系統規範
根據 `/src/theme/designSystem.ts`，正確的按鈕顏色應該是：
```typescript
// 主色調 - 深灰色用於按鈕和互動元素（Linear 風格）
primary: '#2C2C2C',

// 按鈕專用色彩系統
button: {
  primary: {
    default: '#2C2C2C',    // 深灰色，不是藍色
    hover: '#3C3C3C',
    pressed: '#1C1C1C'
  },
  secondary: {
    default: '#F7F7F7',    // 淺灰色背景
    hover: '#ECECEC',
    pressed: '#E0E0E0'
  }
}
```

### 問題根源
經過研究發現，問題可能來自以下幾個地方：

1. **Status 色彩誤用**
   - `DesignSystem.colors.status` 包含彩色（success: '#34C759', error: '#FF3B30'）
   - 這些顏色只應用於狀態指示，不應用於按鈕

2. **Notion 主題影響**
   - NotionTheme.ts 和 NotionTokens.ts 中定義了藍色（'#0070f3', '#2383e2'）
   - 這些顏色可能被誤用到按鈕上

3. **潛在的硬編碼**
   - 可能有些地方直接硬編碼了顏色值而非使用設計系統

## 🔍 需要檢查的檔案清單

### 核心元件
- [ ] `/src/components/adaptive/core/AdaptiveButton.tsx`
- [ ] `/src/components/common/Button.tsx`（如果存在）
- [ ] `/src/theme/designSystem.ts`

### 可能受影響的畫面
- [ ] 登入畫面按鈕
- [ ] 儀表板按鈕
- [ ] 模態框按鈕（確認、取消）
- [ ] 設定畫面按鈕
- [ ] 資料庫操作按鈕
- [ ] 組織管理按鈕

## 🛠️ 修復方案

### 步驟 1：審查 AdaptiveButton
```typescript
// 檢查並修正 AdaptiveButton.tsx 中的顏色使用
// 確保所有 variant 都使用正確的灰階顏色

// ❌ 錯誤（如果存在）
backgroundColor: '#007AFF'  // iOS 藍色
backgroundColor: DesignSystem.colors.info  // 彩色

// ✅ 正確
backgroundColor: DesignSystem.colors.button.primary.default  // #2C2C2C
backgroundColor: DesignSystem.colors.primary  // #2C2C2C
```

### 步驟 2：建立顏色審查腳本
```javascript
// scripts/audit-button-colors.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 不應該出現在按鈕中的顏色
const FORBIDDEN_COLORS = [
  '#007AFF', '#0066CC', '#0070f3', '#2383e2',  // 藍色系
  '#34C759', '#FF3B30', '#FF9500', '#5856D6',  // 狀態色
];

// 掃描所有元件檔案
function auditButtonColors() {
  const files = glob.sync('src/**/*.{tsx,ts}');
  const issues = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 檢查按鈕相關的顏色設定
    if (content.includes('Button') || content.includes('button')) {
      FORBIDDEN_COLORS.forEach(color => {
        if (content.includes(color)) {
          issues.push({
            file,
            color,
            line: getLineNumber(content, color)
          });
        }
      });
      
      // 檢查錯誤的 DesignSystem 使用
      const patterns = [
        /backgroundColor.*colors\.info/g,
        /backgroundColor.*colors\.success/g,
        /backgroundColor.*colors\.error/g,
        /backgroundColor.*colors\.warning/g,
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          issues.push({
            file,
            pattern: pattern.toString(),
            matches
          });
        }
      });
    }
  });
  
  return issues;
}
```

### 步驟 3：統一修復腳本
```javascript
// scripts/fix-button-colors.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function fixButtonColors() {
  const files = glob.sync('src/**/*.{tsx,ts}');
  let totalFixed = 0;
  
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 修正硬編碼的藍色
    const replacements = [
      { from: '#007AFF', to: 'DesignSystem.colors.primary' },
      { from: '#0066CC', to: 'DesignSystem.colors.primary' },
      { from: '#0070f3', to: 'DesignSystem.colors.primary' },
      { from: '#2383e2', to: 'DesignSystem.colors.primary' },
    ];
    
    replacements.forEach(({ from, to }) => {
      if (content.includes(from)) {
        content = content.replace(new RegExp(from, 'g'), to);
        modified = true;
      }
    });
    
    // 修正錯誤的 status 色彩使用
    const statusFixes = [
      {
        pattern: /backgroundColor:\s*DesignSystem\.colors\.info/g,
        replacement: 'backgroundColor: DesignSystem.colors.primary'
      },
      {
        pattern: /backgroundColor:\s*DesignSystem\.colors\.success/g,
        replacement: 'backgroundColor: DesignSystem.colors.primary'
      },
    ];
    
    statusFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`Fixed: ${file}`);
      totalFixed++;
    }
  });
  
  return totalFixed;
}
```

### 步驟 4：特定元件修復

#### AdaptiveButton.tsx
```typescript
// 確保所有 variant 使用正確的顏色
const variantStyles = {
  primary: {
    backgroundColor: DesignSystem.colors.button.primary.default,  // #2C2C2C
    color: DesignSystem.colors.text.inverse,  // #FFFFFF
  },
  secondary: {
    backgroundColor: DesignSystem.colors.button.secondary.default,  // #F7F7F7
    color: DesignSystem.colors.primary,  // #2C2C2C
  },
  success: {
    // 如果需要 success 按鈕，使用綠色邊框而非背景
    backgroundColor: 'transparent',
    borderColor: DesignSystem.colors.status.success,
    color: DesignSystem.colors.status.success,
  },
  danger: {
    // 如果需要 danger 按鈕，使用紅色邊框而非背景
    backgroundColor: 'transparent',
    borderColor: DesignSystem.colors.status.error,
    color: DesignSystem.colors.status.error,
  }
};
```

## 📝 測試計劃

### 單元測試
```typescript
// tests/components/AdaptiveButton.test.tsx
describe('AdaptiveButton 顏色測試', () => {
  it('primary 按鈕應該使用深灰色背景', () => {
    const button = render(<AdaptiveButton variant="primary">Test</AdaptiveButton>);
    expect(button.style.backgroundColor).toBe('#2C2C2C');
  });
  
  it('不應該包含藍色', () => {
    const button = render(<AdaptiveButton variant="primary">Test</AdaptiveButton>);
    expect(button.style.backgroundColor).not.toMatch(/#00[0-9A-F]{4}/i);
  });
});
```

### 視覺測試檢查清單
- [ ] 登入畫面：所有按鈕應為深灰色
- [ ] 儀表板：主要操作按鈕應為深灰色
- [ ] 模態框：確認按鈕深灰色，取消按鈕淺灰色
- [ ] 設定畫面：所有按鈕符合灰階設計
- [ ] 組織管理：操作按鈕為灰階

## 🚀 執行步驟

1. **執行審查腳本**
   ```bash
   node scripts/audit-button-colors.js > button-color-audit.log
   ```

2. **備份當前狀態**
   ```bash
   git stash
   git checkout -b fix-button-colors
   ```

3. **執行修復腳本**
   ```bash
   node scripts/fix-button-colors.js
   ```

4. **手動檢查特殊案例**
   - 檢查 AdaptiveButton.tsx
   - 檢查任何自訂按鈕元件
   - 檢查內聯樣式

5. **執行測試**
   ```bash
   npm run test
   npm run web:build
   ```

6. **視覺驗證**
   ```bash
   npm run web
   # 手動檢查各個畫面的按鈕顏色
   ```

7. **提交修改**
   ```bash
   git add -A
   git commit -m "fix: 恢復按鈕灰階顏色設計符合 Notion 風格"
   ```

## ⚠️ 注意事項

1. **保留必要的彩色**
   - 狀態指示器（成功/錯誤/警告）應保持彩色
   - 只有按鈕需要改為灰階

2. **向後相容**
   - 確保修改不會破壞現有功能
   - 保留 success/danger variant 但改為邊框樣式

3. **Web 平台特別注意**
   - 確保 Web 和 Native 平台顏色一致
   - 檢查 Platform.OS 條件下的顏色設定

## 📊 預期結果

- 所有按鈕恢復為灰階設計
- 主要按鈕：深灰色背景 (#2C2C2C)
- 次要按鈕：淺灰色背景 (#F7F7F7)
- 整體視覺風格統一，符合 Notion 風格

## 🔍 驗證命令

```bash
# 檢查是否還有藍色殘留
grep -r "#007AFF\|#0066CC\|#0070f3" src/ --include="*.tsx" --include="*.ts"

# 檢查按鈕顏色使用
grep -r "backgroundColor.*Button" src/ --include="*.tsx"

# 建立並測試
npm run web:build && npm run web
```

---

**信心指數**: 8/10

此 PRP 提供了完整的問題分析、修復方案和測試計劃。主要風險在於可能有些特殊案例需要手動處理，但整體方案應該能解決大部分按鈕顏色問題。