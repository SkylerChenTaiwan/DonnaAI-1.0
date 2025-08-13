#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 統一 UI 設計為黑白灰風格...\n');
console.log('設計原則：');
console.log('- 主色調：#2C2C2C（深灰）');
console.log('- 背景：#FFFFFF（純白）');
console.log('- 文字：#1A1A1A（深黑）、#666666（次要）');
console.log('- 邊框：#E5E7EB（淺灰）\n');

let fixedFiles = 0;
const issues = [];

// 1. 修復 Button.web.tsx - 使用正確的黑白灰色系
const buttonWebPath = 'src/components/common/Button/Button.web.tsx';
if (fs.existsSync(buttonWebPath)) {
  let content = fs.readFileSync(buttonWebPath, 'utf8');
  
  // 替換所有藍色 #007AFF 為深灰 #2C2C2C
  content = content.replace(/#007AFF/g, '#2C2C2C');
  
  // 更新變體樣式
  const newVariantStyles = `    // 變體樣式 - 遵循黑白灰設計系統
    const variantStyles = {
      primary: {
        backgroundColor: '#2C2C2C',  // 深灰按鈕
        color: '#FFFFFF',            // 白色文字
        border: 'none'
      },
      secondary: {
        backgroundColor: '#F7F7F7',  // 淺灰背景
        color: '#1A1A1A',            // 深色文字
        border: 'none'
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#2C2C2C',            // 深灰文字
        border: '1px solid #D0D0D0' // 灰色邊框
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#2C2C2C',            // 深灰文字
        border: 'none'
      },
      text: {
        backgroundColor: 'transparent',
        color: '#666666',            // 次要文字色
        padding: '0',
        textDecoration: 'underline',
        textUnderlineOffset: '3px',
        border: 'none'
      }
    };`;
  
  // 替換變體樣式
  content = content.replace(
    /\/\/ 變體樣式[\s\S]*?\};/,
    newVariantStyles
  );
  
  // 更新內聯顏色設定
  content = content.replace(
    /color: variant === 'primary' \? '#FFFFFF'[\s\S]*?: '#000000'/,
    `color: variant === 'primary' ? '#FFFFFF' : 
                 variant === 'secondary' ? '#1A1A1A' :
                 variant === 'outline' ? '#2C2C2C' :
                 variant === 'ghost' ? '#2C2C2C' :
                 variant === 'text' ? '#666666' : '#1A1A1A'`
  );
  
  // 更新 hover 效果
  content = content.replace(
    /target\.style\.backgroundColor = webColorOverrides\.button\.primary\.hover;/,
    `target.style.backgroundColor = '#3C3C3C'; // 深灰 hover`
  );
  
  content = content.replace(
    /target\.style\.backgroundColor = webColorOverrides\.button\.primary\.default;/,
    `target.style.backgroundColor = '#2C2C2C'; // 深灰預設`
  );
  
  fs.writeFileSync(buttonWebPath, content);
  console.log('✅ 修復 Button.web.tsx');
  fixedFiles++;
}

// 2. 更新 buttonOverrides.css
const buttonCssPath = 'src/styles/buttonOverrides.css';
if (fs.existsSync(buttonCssPath)) {
  const newButtonCss = `/**
 * 全域按鈕樣式覆蓋 - 黑白灰設計系統
 * 確保按鈕顏色符合整體設計風格
 */

/* 主要按鈕 - 深灰底白字 */
button[style*="backgroundColor: #2C2C2C"],
button[style*="background-color: #2C2C2C"] {
  color: #FFFFFF !important;
}

button[style*="backgroundColor: #2C2C2C"] *,
button[style*="background-color: #2C2C2C"] * {
  color: #FFFFFF !important;
}

/* Hover 狀態 */
button[style*="backgroundColor: #3C3C3C"],
button[style*="background-color: #3C3C3C"] {
  color: #FFFFFF !important;
}

/* 次要按鈕 - 淺灰底深字 */
button[style*="backgroundColor: #F7F7F7"],
button[style*="background-color: #F7F7F7"],
button[style*="backgroundColor: #F2F2F7"],
button[style*="background-color: #F2F2F7"] {
  color: #1A1A1A !important;
}

button[style*="backgroundColor: #F7F7F7"] *,
button[style*="background-color: #F7F7F7"] *,
button[style*="backgroundColor: #F2F2F7"] *,
button[style*="background-color: #F2F2F7"] * {
  color: #1A1A1A !important;
}

/* 輪廓按鈕 - 透明底深灰字 */
button[style*="border"][style*="#D0D0D0"] {
  color: #2C2C2C !important;
}

button[style*="border"][style*="#D0D0D0"] * {
  color: #2C2C2C !important;
}

/* Ghost 按鈕 - 透明底深灰字 */
button[style*="transparent"] {
  color: #2C2C2C !important;
}

/* 文字按鈕 - 次要文字色 */
button[style*="text-decoration: underline"] {
  color: #666666 !important;
}

/* 確保所有按鈕文字可見 */
button {
  color: inherit;
}

button span,
button div {
  color: inherit !important;
}

/* 禁用狀態 */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 移除所有藍色殘留 */
button[style*="#007AFF"] {
  background-color: #2C2C2C !important;
}

/* 確保 Notion 風格一致 */
.notion-button {
  color: inherit !important;
  background: inherit !important;
}
`;
  
  fs.writeFileSync(buttonCssPath, newButtonCss);
  console.log('✅ 更新 buttonOverrides.css');
  fixedFiles++;
}

// 3. 掃描並修復所有使用藍色的地方
const files = glob.sync('src/**/*.{ts,tsx,css}', {
  ignore: ['node_modules/**', 'dist/**', 'build/**']
});

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 檢查是否包含藍色
  if (content.includes('#007AFF') || content.includes('rgb(0, 122, 255)')) {
    // 替換為深灰
    content = content.replace(/#007AFF/gi, '#2C2C2C');
    content = content.replace(/rgb\(0,\s*122,\s*255\)/gi, '#2C2C2C');
    modified = true;
    issues.push({
      file: path.basename(file),
      issue: '包含藍色 #007AFF',
      fixed: true
    });
  }
  
  // 檢查其他不一致的顏色
  if (content.includes('#0066CC') || content.includes('#3478F6')) {
    content = content.replace(/#0066CC/gi, '#2C2C2C');
    content = content.replace(/#3478F6/gi, '#2C2C2C');
    modified = true;
    issues.push({
      file: path.basename(file),
      issue: '包含其他藍色變體',
      fixed: true
    });
  }
  
  // 檢查按鈕樣式
  if (content.includes('primary:') && content.includes('button')) {
    // 確保使用正確的主色
    content = content.replace(
      /primary:\s*['"]#[0-9A-Fa-f]{6}['"]/g,
      `primary: '#2C2C2C'`
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(file, content);
    fixedFiles++;
  }
});

// 4. 創建 UI 設計指南文件
const uiGuideContent = `# UI 設計指南 - 黑白灰設計系統

## 設計原則
我們採用極簡的黑白灰設計系統，靈感來自 Notion 和 Linear 的設計理念。

## 色彩系統

### 主要顏色
- **主色調**: #2C2C2C (深灰) - 用於主要按鈕、重要互動元素
- **背景色**: #FFFFFF (純白) - 主要背景
- **表面色**: #FAFAFA (極淺灰) - 輸入框、次要背景

### 文字顏色
- **主要文字**: #1A1A1A (深黑)
- **次要文字**: #666666 (中灰)
- **輔助文字**: #999999 (淺灰)
- **禁用文字**: #CCCCCC (極淺灰)
- **反色文字**: #FFFFFF (白色) - 用於深色背景

### 邊框顏色
- **淺邊框**: #E5E7EB
- **預設邊框**: #D1D5DB
- **中等邊框**: #B5B5B5
- **深邊框**: #9CA3AF

### 狀態顏色（謹慎使用）
- **成功**: #34C759 (綠)
- **警告**: #FF9500 (橙)
- **錯誤**: #FF3B30 (紅)
- **資訊**: #5856D6 (紫) - 盡量避免使用

## 元件設計規範

### 按鈕
1. **主要按鈕 (Primary)**
   - 背景: #2C2C2C
   - 文字: #FFFFFF
   - Hover: #3C3C3C
   - 用途: 主要動作（提交、確認、下一步）

2. **次要按鈕 (Secondary)**
   - 背景: #F7F7F7
   - 文字: #1A1A1A
   - Hover: #ECECEC
   - 用途: 次要動作

3. **輪廓按鈕 (Outline)**
   - 背景: transparent
   - 文字: #2C2C2C
   - 邊框: #D0D0D0
   - 用途: 第三層級動作

4. **Ghost 按鈕**
   - 背景: transparent
   - 文字: #2C2C2C
   - Hover: rgba(0, 0, 0, 0.05)
   - 用途: 最低優先級動作

5. **文字按鈕 (Text)**
   - 背景: transparent
   - 文字: #666666
   - 底線: 有
   - 用途: 連結式動作

### 輸入框
- 背景: #FAFAFA
- 邊框: #E5E7EB
- 文字: #1A1A1A
- Placeholder: #999999
- Focus邊框: #2C2C2C

### 卡片
- 背景: #FFFFFF
- 邊框: #E5E7EB (可選)
- 陰影: 極淺 (shadowOpacity: 0.05)

### 表格
- 表頭背景: #FAFAFA
- 表頭文字: #666666
- 行背景: #FFFFFF
- 行 Hover: #F7F7F7
- 邊框: #E5E7EB

## 注意事項
1. **避免使用彩色**: 除了狀態色（成功、錯誤、警告），避免使用其他彩色
2. **保持一致性**: 所有元件都應遵循此設計系統
3. **對比度**: 確保文字與背景有足夠的對比度
4. **簡潔至上**: 移除不必要的裝飾性元素
5. **功能優先**: 設計應該服務於功能，而非裝飾

## 實施檢查清單
- [ ] 所有主要按鈕使用 #2C2C2C 而非藍色
- [ ] 文字顏色遵循層級系統
- [ ] 邊框使用統一的灰色系統
- [ ] 陰影保持極淺（opacity < 0.1）
- [ ] 沒有使用設計系統外的顏色
`;

fs.writeFileSync('docs/UI-DESIGN-GUIDE.md', uiGuideContent);
console.log('✅ 創建 UI 設計指南');

// 5. 更新 webOverrides.ts
const webOverridesPath = 'src/theme/webOverrides.ts';
if (fs.existsSync(webOverridesPath)) {
  let content = fs.readFileSync(webOverridesPath, 'utf8');
  
  // 確保按鈕顏色正確
  content = content.replace(
    /primary:\s*{\s*default:\s*['"]#[^'"]+['"]/g,
    `primary: { default: '#2C2C2C'`
  );
  
  content = content.replace(
    /primary:\s*{\s*text:\s*['"]#[^'"]+['"]/g,
    `primary: { text: '#FFFFFF'`
  );
  
  fs.writeFileSync(webOverridesPath, content);
  console.log('✅ 更新 webOverrides.ts');
  fixedFiles++;
}

console.log('\n📊 統計報告：');
console.log(`修復了 ${fixedFiles} 個檔案`);

if (issues.length > 0) {
  console.log('\n發現的顏色不一致問題：');
  const uniqueIssues = [...new Set(issues.map(i => i.file))];
  uniqueIssues.forEach(file => {
    console.log(`  - ${file}`);
  });
}

console.log('\n✨ UI 設計統一完成！');
console.log('\n設計系統現已完全遵循黑白灰風格：');
console.log('  🎨 主色調：深灰 (#2C2C2C)');
console.log('  📝 文字：深黑到淺灰的層級');
console.log('  🔲 背景：純白為主');
console.log('  📐 邊框：統一的灰色系統');
console.log('\n下一步：重新建構並部署');