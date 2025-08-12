# PRP-104: 全面修復顏色字串拼接問題

## 📋 問題摘要

React Native Web 平台發生 `CSSStyleDeclaration` 錯誤，原因是顏色值與透明度字串拼接（如 `color + '20'`）。先前的修復腳本因正則表達式過於具體，遺漏了多種動態顏色模式。

### 發現的問題模式

經過全面掃描，發現以下 7 個檔案仍有問題：

1. `src/components/admin/TeamDataSyncTool.tsx` - `info.color + '20'`
2. `src/components/admin/charts/StatCard.tsx` - `color + '20'`
3. `src/components/database/SyncStatusIndicator.tsx` - `getStatusColor() + '20'`
4. `src/components/import/stages/DatabaseSelector.tsx` - `option.color + '20'`
5. `src/components/import/assignment/UserSelector.tsx` - `getRoleColor(user.role) + '20'` (2處)
6. `src/components/import/assignment/AssignmentPreview.tsx` - `getConfidenceColor(...) + '20'`

### 為什麼之前的修復失敗

現有腳本 `scripts/fix-color-styles.js` 的正則表達式：
```javascript
/((?:DesignSystem\.)?colors?\.[\w.]+|[\w]+Color)\s*\+\s*['"]([0-9A-Fa-f]+)['"]/g
```

只能匹配：
- `DesignSystem.colors.xxx + '20'` ✅
- `primaryColor + '20'` ✅

無法匹配：
- `option.color + '20'` ❌
- `getStatusColor() + '20'` ❌
- `info.color + '20'` ❌

## 🎯 目標

1. **立即修復**：修正所有 7 個檔案中的顏色拼接問題
2. **長期預防**：建立更強大的檢測和預防機制
3. **完整測試**：確保所有頁面和 Modal 都能正常渲染

## 🏗️ 實施計劃

### 第一階段：建立改進的修復腳本

建立新的修復腳本 `scripts/fix-all-color-concatenation.js`，使用更全面的正則表達式：

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 透明度對照表（從現有 fix-color-styles.js 複製）
const alphaMap = {
  '10': 0.063, '15': 0.094, '20': 0.125, '30': 0.188,
  '40': 0.250, '50': 0.314, '60': 0.376, '70': 0.439,
  '80': 0.502, '90': 0.565, 'A0': 0.627, 'B0': 0.690,
  'C0': 0.753, 'CC': 0.800, 'D0': 0.816, 'E0': 0.878,
  'F0': 0.941,
};

function fixColorConcatenation(content, filePath) {
  let newContent = content;
  let fixCount = 0;
  
  // 檢查是否已經 import withAlpha
  const hasWithAlphaImport = /import.*withAlpha.*from.*colorUtils/.test(content);
  
  // 更全面的正則表達式模式
  const patterns = [
    // 模式 1: 任何以 color/Color 結尾的變數或屬性
    /(\w+\.color|\w+Color|color)\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
    
    // 模式 2: 函數調用返回顏色
    /(get\w*Color\([^)]*\))\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
    
    // 模式 3: 條件表達式中的顏色
    /(\?[^:]+:\s*['"][#\w]+['"])\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
    
    // 模式 4: DesignSystem 顏色（保留原有模式）
    /(DesignSystem\.colors?\.[\w.]+)\s*\+\s*['"]([0-9A-Fa-f]{2})['"]/g,
  ];
  
  // 對每個模式進行替換
  patterns.forEach(pattern => {
    newContent = newContent.replace(pattern, (match, colorExpr, alphaHex) => {
      fixCount++;
      const alpha = alphaMap[alphaHex] || (parseInt(alphaHex, 16) / 255);
      return `withAlpha(${colorExpr}, ${alpha})`;
    });
  });
  
  // 如果有修復且沒有 import，添加 import
  if (fixCount > 0 && !hasWithAlphaImport) {
    // 尋找第一個 import 語句的位置
    const importMatch = content.match(/^import\s+.*$/m);
    if (importMatch) {
      const insertPos = content.indexOf(importMatch[0]) + importMatch[0].length;
      newContent = 
        newContent.slice(0, insertPos) + 
        "\nimport { withAlpha } from '@/utils/colorUtils';" +
        newContent.slice(insertPos);
    } else {
      // 如果沒有 import，加在檔案開頭
      newContent = "import { withAlpha } from '@/utils/colorUtils';\n\n" + newContent;
    }
  }
  
  return { content: newContent, fixCount };
}

// 主程式
function main() {
  console.log('🔍 全面掃描顏色拼接問題...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/colorUtils.ts'],
  });
  
  let totalFixed = 0;
  const fixedFiles = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const { content: fixedContent, fixCount } = fixColorConcatenation(content, file);
    
    if (fixCount > 0) {
      fs.writeFileSync(file, fixedContent);
      console.log(`✅ 修復 ${file}: ${fixCount} 處`);
      fixedFiles.push({ file, count: fixCount });
      totalFixed += fixCount;
    }
  });
  
  console.log('\n📊 修復統計:');
  console.log(`   檔案掃描: ${files.length} 個`);
  console.log(`   檔案修復: ${fixedFiles.length} 個`);
  console.log(`   總修復數: ${totalFixed} 處`);
  
  if (fixedFiles.length > 0) {
    console.log('\n📝 修復詳情:');
    fixedFiles.forEach(({ file, count }) => {
      console.log(`   ${path.relative('.', file)}: ${count} 處`);
    });
  }
}

main();
```

### 第二階段：增強 ESLint 規則

更新 `.eslintrc.js` 的 `no-restricted-syntax` 規則：

```javascript
'no-restricted-syntax': [
  'error',
  // 規則 1: 屬性名包含 color 的拼接
  {
    selector: "BinaryExpression[operator='+'][left.property.name=/[Cc]olor/][right.type='Literal']",
    message: '禁止顏色字串拼接！使用 withAlpha(color, alpha) 替代。參考 /docs/COLOR-SYSTEM-MIGRATION.md'
  },
  // 規則 2: 變數名包含 color 的拼接  
  {
    selector: "BinaryExpression[operator='+'][left.name=/[Cc]olor/][right.type='Literal']",
    message: '禁止顏色字串拼接！使用 withAlpha(color, alpha) 替代。'
  },
  // 規則 3: 函數調用返回顏色的拼接
  {
    selector: "BinaryExpression[operator='+'][left.type='CallExpression'][left.callee.name=/[Cc]olor/][right.type='Literal']",
    message: '禁止顏色字串拼接！使用 withAlpha(getColor(), alpha) 替代。'
  }
],
```

### 第三階段：建立測試腳本

建立 `scripts/test-color-patterns.js` 來驗證修復：

```javascript
#!/usr/bin/env node

const fs = require('fs');
const glob = require('glob');

function checkColorPatterns() {
  console.log('🔍 檢查顏色拼接模式...\n');
  
  const files = glob.sync('src/**/*.{ts,tsx}', {
    ignore: ['**/node_modules/**', '**/dist/**', '**/colorUtils.ts'],
  });
  
  const issues = [];
  
  // 危險模式列表
  const dangerousPatterns = [
    /\+\s*['"][0-9A-Fa-f]{2}['"]/g,  // 任何 + '20' 格式
    /color.*\+\s*['"][\w]+['"]/gi,    // color + 任何字串
  ];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      dangerousPatterns.forEach(pattern => {
        if (pattern.test(line) && !line.includes('withAlpha')) {
          issues.push({
            file: file,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    });
  });
  
  if (issues.length > 0) {
    console.log('❌ 發現潛在的顏色拼接問題:\n');
    issues.forEach(issue => {
      console.log(`${issue.file}:${issue.line}`);
      console.log(`  ${issue.content}\n`);
    });
    process.exit(1);
  } else {
    console.log('✅ 沒有發現顏色拼接問題！');
  }
}

checkColorPatterns();
```

### 第四階段：Web 平台測試計劃

建立完整的測試檢查清單 `docs/WEB-PLATFORM-TEST-CHECKLIST.md`：

```markdown
# Web 平台測試檢查清單

## 必測頁面流程

### 1. 組織管理
- [ ] 組織列表頁面
- [ ] 組織詳情 - 基本資訊分頁
- [ ] 組織詳情 - 用戶管理分頁
- [ ] 組織詳情 - 訂閱方案分頁
- [ ] 組織詳情 - 功能開關分頁
- [ ] 組織詳情 - 用戶協助分頁

### 2. Modal 測試（必須開啟）
- [ ] 資料匯入精靈 Modal
- [ ] 新增用戶 Modal
- [ ] 批量匯入 Modal
- [ ] 團隊管理 Modal

### 3. 顏色相關元件
- [ ] StatCard（統計卡片）
- [ ] SyncStatusIndicator（同步狀態）
- [ ] TeamDataSyncTool（團隊同步工具）
- [ ] UserSelector（用戶選擇器）
- [ ] AssignmentPreview（分配預覽）

## 測試步驟

1. 清除瀏覽器快取
2. 開啟開發者工具 Console
3. 逐一測試每個頁面
4. 確認沒有 CSSStyleDeclaration 錯誤
5. 測試所有 Modal 的開啟和關閉
```

## 📝 執行步驟

### 步驟 1: 執行全面修復
```bash
# 建立並執行新的修復腳本
chmod +x scripts/fix-all-color-concatenation.js
node scripts/fix-all-color-concatenation.js
```

### 步驟 2: 更新 ESLint 規則
```bash
# 編輯 .eslintrc.js 添加更強的規則
# 然後執行 lint 檢查
npm run lint
```

### 步驟 3: 建置和測試
```bash
# 清除快取
rm -rf .expo node_modules/.cache dist-web

# 重新建置
npm run web:build

# 本地測試
npx serve dist-web
```

### 步驟 4: 執行測試腳本
```bash
# 執行顏色模式檢查
node scripts/test-color-patterns.js

# 如果通過，部署到 Firebase
firebase deploy --only hosting
```

### 步驟 5: 完整測試
1. 開啟 https://donnaai-5e601.web.app
2. 按照測試檢查清單逐項測試
3. 特別注意開啟所有 Modal
4. 確認 Console 無錯誤

## 🎯 驗證標準

### 成功指標
- ✅ 所有 7 個檔案的顏色拼接問題已修復
- ✅ ESLint 檢查通過
- ✅ test-color-patterns.js 檢查通過
- ✅ Web 平台所有頁面正常渲染
- ✅ 所有 Modal 可正常開啟
- ✅ Console 無 CSSStyleDeclaration 錯誤

### 驗證命令
```bash
# 1. 語法檢查
npm run lint

# 2. 顏色模式檢查
node scripts/test-color-patterns.js

# 3. 建置檢查
npm run web:build

# 4. 搜尋遺漏（應該無結果）
grep -r "\\+ ['\"][0-9A-Fa-f]\\{2\\}" src/ --include="*.tsx" --include="*.ts" | grep -v withAlpha
```

## 🚨 注意事項

1. **快取問題**：部署後需要強制重新整理（Cmd+Shift+R）
2. **測試覆蓋**：必須測試所有 Modal，不只是主頁面
3. **函數引入**：確保所有修復的檔案都正確引入 `withAlpha`
4. **透明度值**：確認透明度值轉換正確（如 '20' = 0.125）

## 📊 預期成果

- 完全解決 CSSStyleDeclaration 錯誤
- 建立防止問題再次發生的機制
- 提供完整的測試流程文件
- 改善開發者體驗，避免未來的困擾

## 🔄 後續維護

1. **CI/CD 整合**：將 `test-color-patterns.js` 加入 CI 流程
2. **開發者教育**：更新開發指南，說明正確的顏色處理方式
3. **定期檢查**：每次部署前執行測試腳本

---

**信心指數**: 9/10

此 PRP 提供了：
- 完整的問題分析和根因
- 改進的修復腳本處理所有模式
- 強化的 ESLint 規則預防未來問題
- 完整的測試計劃和驗證步驟
- 清晰的執行路徑

唯一的不確定性是可能還有其他未發現的顏色模式，但測試腳本應該能捕獲它們。