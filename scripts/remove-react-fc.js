#!/usr/bin/env node

/**
 * 移除 React.FC 的使用，改為直接定義 props 類型
 * React 19 建議不使用 React.FC
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 找出所有需要處理的 TypeScript React 檔案
const files = glob.sync('src/**/*.{tsx,ts}', {
  cwd: process.cwd(),
  absolute: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

let processedCount = 0;
let errorCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // 替換 React.FC<Props> = ({ ... }) => { 為 ({ ... }: Props) => {
    const fcPattern = /export\s+const\s+(\w+):\s*React\.FC<([^>]+)>\s*=\s*\(/g;
    if (fcPattern.test(content)) {
      content = content.replace(fcPattern, 'export const $1 = (');
      
      // 找到對應的 props 並加上類型註解
      const componentPattern = /export\s+const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/g;
      content = content.replace(componentPattern, (match, name, props) => {
        // 提取對應的類型名稱
        const typeMatch = content.match(new RegExp(`interface\\s+(\\w*${name}Props|\\w+Props)\\s*{`));
        if (typeMatch) {
          const propsType = typeMatch[1];
          return `export const ${name} = (${props}: ${propsType}) =>`;
        }
        return match;
      });
      
      modified = true;
    }

    // 替換 React.FC = () => { 為 () => {
    const simpleFcPattern = /export\s+const\s+(\w+):\s*React\.FC\s*=\s*\(/g;
    if (simpleFcPattern.test(content)) {
      content = content.replace(simpleFcPattern, 'export const $1 = (');
      modified = true;
    }

    // 替換 : React.FC<Props> = function 形式
    const funcFcPattern = /:\s*React\.FC<([^>]+)>\s*=\s*function/g;
    if (funcFcPattern.test(content)) {
      content = content.replace(funcFcPattern, ' = function');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, content);
      processedCount++;
      console.log(`✅ 已處理: ${path.relative(process.cwd(), file)}`);
    }
  } catch (error) {
    errorCount++;
    console.error(`❌ 處理失敗: ${path.relative(process.cwd(), file)}`);
    console.error(`   錯誤: ${error.message}`);
  }
});

console.log(`\n處理完成！`);
console.log(`✅ 成功處理: ${processedCount} 個檔案`);
console.log(`❌ 處理失敗: ${errorCount} 個檔案`);