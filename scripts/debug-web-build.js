#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 檢查 Web 建置輸出...\n');

// 檢查 dist-web 資料夾
const distPath = path.join(__dirname, '..', 'dist-web');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist-web 資料夾不存在！');
  process.exit(1);
}

// 檢查主要的 JS 檔案
const jsPath = path.join(distPath, '_expo', 'static', 'js', 'web');
if (fs.existsSync(jsPath)) {
  const jsFiles = fs.readdirSync(jsPath);
  console.log('📦 JavaScript 檔案:');
  jsFiles.forEach(file => {
    const stats = fs.statSync(path.join(jsPath, file));
    console.log(`   - ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // 檢查檔案內容
    const content = fs.readFileSync(path.join(jsPath, file), 'utf-8');
    
    // 檢查關鍵樣式
    const hasNewPadding = content.includes('paddingHorizontal:16');
    const hasFormInput = content.includes('FormInput');
    const hasIonicons = content.includes('Ionicons');
    
    console.log(`     ✓ 包含 paddingHorizontal:16: ${hasNewPadding ? '是' : '否'}`);
    console.log(`     ✓ 包含 FormInput 元件: ${hasFormInput ? '是' : '否'}`);
    console.log(`     ✓ 包含 Ionicons: ${hasIonicons ? '是' : '否'}`);
  });
}

// 檢查字體檔案
const fontsPath = path.join(distPath, 'assets', 'node_modules', '@expo', 'vector-icons', 'build', 'vendor', 'react-native-vector-icons', 'Fonts');
if (fs.existsSync(fontsPath)) {
  const fontFiles = fs.readdirSync(fontsPath);
  console.log('\n🔤 字體檔案:');
  const ioniconsFile = fontFiles.find(f => f.includes('Ionicons'));
  if (ioniconsFile) {
    console.log(`   ✓ Ionicons 字體: ${ioniconsFile}`);
  } else {
    console.log('   ❌ 找不到 Ionicons 字體！');
  }
}

// 檢查 index.html
const indexPath = path.join(distPath, 'index.html');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  const scriptMatch = indexContent.match(/index-[a-z0-9]+\.js/);
  if (scriptMatch) {
    console.log(`\n📄 index.html 引用的 JS: ${scriptMatch[0]}`);
  }
}

console.log('\n✅ 檢查完成！');