#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 修復按鈕顏色問題...\n');

// 1. 修復 Button.web.tsx
const buttonWebPath = 'src/components/common/Button/Button.web.tsx';
if (fs.existsSync(buttonWebPath)) {
  let content = fs.readFileSync(buttonWebPath, 'utf8');
  
  // 更新變體樣式，使用更強的內聯樣式
  const oldVariantStyles = `    // 變體樣式 - 使用 !important 確保顏色生效
    const variantStyles = {
      primary: {
        backgroundColor: webColorOverrides.button.primary.default,
        color: \`\${webColorOverrides.button.primary.text} !important\` },
      secondary: {
        backgroundColor: webColorOverrides.button.secondary.default,
        color: \`\${webColorOverrides.button.secondary.text} !important\` },
      outline: {
        backgroundColor: 'transparent',
        color: \`\${webColorOverrides.button.outline.text} !important\`,
        border: \`1px solid \${webColorOverrides.button.outline.border}\` },
      ghost: {
        backgroundColor: 'transparent',
        color: \`\${webColorOverrides.text.primary} !important\` },
      text: {
        backgroundColor: 'transparent',
        color: \`\${webColorOverrides.text.primary} !important\`,
        padding: '0',
        textDecoration: 'underline' } };`;
  
  const newVariantStyles = `    // 變體樣式 - 使用最強的內聯樣式
    const variantStyles = {
      primary: {
        backgroundColor: '#007AFF',
        color: '#FFFFFF',
        // 強制覆蓋所有子元素的顏色
        '& *': { color: '#FFFFFF !important' }
      },
      secondary: {
        backgroundColor: '#F2F2F7',
        color: '#000000',
        '& *': { color: '#000000 !important' }
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#007AFF',
        border: '1px solid #007AFF',
        '& *': { color: '#007AFF !important' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#007AFF',
        '& *': { color: '#007AFF !important' }
      },
      text: {
        backgroundColor: 'transparent',
        color: '#007AFF',
        padding: '0',
        textDecoration: 'underline',
        '& *': { color: '#007AFF !important' }
      }
    };`;
  
  content = content.replace(oldVariantStyles, newVariantStyles);
  
  // 修改 button 元素添加 style 屬性
  const oldButtonReturn = `      <button
        type={type}
        disabled={disabled || loading}
        style={getButtonStyle()}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {renderContent()}
      </button>`;
  
  const newButtonReturn = `      <button
        type={type}
        disabled={disabled || loading}
        style={{
          ...getButtonStyle(),
          // 確保文字顏色正確顯示
          color: variant === 'primary' ? '#FFFFFF' : 
                 variant === 'secondary' ? '#000000' :
                 variant === 'outline' ? '#007AFF' :
                 variant === 'ghost' ? '#007AFF' :
                 variant === 'text' ? '#007AFF' : '#000000'
        }}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {renderContent()}
      </button>`;
  
  if (content.includes(oldButtonReturn)) {
    content = content.replace(oldButtonReturn, newButtonReturn);
  }
  
  fs.writeFileSync(buttonWebPath, content);
  console.log('✅ 修復 Button.web.tsx');
}

// 2. 創建全域 CSS 覆蓋
const globalButtonStylesContent = `/**
 * 全域按鈕樣式覆蓋
 * 確保按鈕顏色正確顯示
 */

/* 主要按鈕 */
button[style*="backgroundColor: #007AFF"],
button[style*="background-color: #007AFF"] {
  color: #FFFFFF !important;
}

button[style*="backgroundColor: #007AFF"] *,
button[style*="background-color: #007AFF"] * {
  color: #FFFFFF !important;
}

/* 次要按鈕 */
button[style*="backgroundColor: #F2F2F7"],
button[style*="background-color: #F2F2F7"] {
  color: #000000 !important;
}

button[style*="backgroundColor: #F2F2F7"] *,
button[style*="background-color: #F2F2F7"] * {
  color: #000000 !important;
}

/* 輪廓按鈕 */
button[style*="border"][style*="#007AFF"] {
  color: #007AFF !important;
}

button[style*="border"][style*="#007AFF"] * {
  color: #007AFF !important;
}

/* 確保所有按鈕文字可見 */
button {
  color: inherit;
}

button span,
button div {
  color: inherit !important;
}

/* 特別處理 React Native Web 生成的按鈕 */
.css-text-901oao {
  color: inherit !important;
}

.css-view-1dbjc4n button {
  color: inherit !important;
}

/* 強制覆蓋 Notion 樣式 */
.notion-button {
  color: inherit !important;
}
`;

fs.writeFileSync('src/styles/buttonOverrides.css', globalButtonStylesContent);
console.log('✅ 創建 buttonOverrides.css');

// 3. 確保 CSS 被載入
const appPath = 'App.tsx';
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  
  if (!content.includes('buttonOverrides.css')) {
    content = content.replace(
      "import './src/components/database/web/styles/NotionDatabaseV4.css';",
      `import './src/components/database/web/styles/NotionDatabaseV4.css';
import './src/styles/buttonOverrides.css';`
    );
    
    fs.writeFileSync(appPath, content);
    console.log('✅ 更新 App.tsx 載入 buttonOverrides.css');
  }
}

// 4. 修復 TouchableOpacity 在 Web 上的顯示
const touchableOpacityWebPath = 'src/components/common/TouchableOpacity/TouchableOpacity.web.tsx';
if (fs.existsSync(touchableOpacityWebPath)) {
  let content = fs.readFileSync(touchableOpacityWebPath, 'utf8');
  
  // 確保 TouchableOpacity 保留顏色
  if (!content.includes('color: inherit')) {
    content = content.replace(
      'cursor: disabled ? "not-allowed" : "pointer",',
      `cursor: disabled ? "not-allowed" : "pointer",
      color: 'inherit',`
    );
    
    fs.writeFileSync(touchableOpacityWebPath, content);
    console.log('✅ 修復 TouchableOpacity.web.tsx');
  }
}

// 5. 創建按鈕顏色修復 Hook
const useButtonColorFixContent = `/**
 * 修復按鈕顏色的 Hook
 * 在組件載入時自動修復按鈕顏色
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

export const useButtonColorFix = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // 修復所有按鈕的顏色
    const fixButtonColors = () => {
      const buttons = document.querySelectorAll('button');
      
      buttons.forEach(button => {
        const bgColor = window.getComputedStyle(button).backgroundColor;
        
        // 根據背景色設定文字顏色
        if (bgColor === 'rgb(0, 122, 255)' || bgColor === '#007AFF') {
          button.style.color = '#FFFFFF';
          // 修復所有子元素
          button.querySelectorAll('*').forEach(child => {
            (child as HTMLElement).style.color = '#FFFFFF';
          });
        } else if (bgColor === 'rgb(242, 242, 247)' || bgColor === '#F2F2F7') {
          button.style.color = '#000000';
          button.querySelectorAll('*').forEach(child => {
            (child as HTMLElement).style.color = '#000000';
          });
        }
      });
    };
    
    // 初始修復
    fixButtonColors();
    
    // 監聽 DOM 變化
    const observer = new MutationObserver(fixButtonColors);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }, []);
};
`;

fs.writeFileSync('src/hooks/useButtonColorFix.ts', useButtonColorFixContent);
console.log('✅ 創建 useButtonColorFix Hook');

console.log('\n✨ 按鈕顏色修復完成！');
console.log('\n實施的修復：');
console.log('1. ✅ 更新 Button.web.tsx 使用固定顏色值');
console.log('2. ✅ 創建全域 CSS 覆蓋檔案');
console.log('3. ✅ 修復 TouchableOpacity 顏色繼承');
console.log('4. ✅ 創建運行時顏色修復 Hook');
console.log('\n下一步：重新建構並部署');