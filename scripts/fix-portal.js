#!/usr/bin/env node

/**
 * 修復 Glide Data Grid 需要的 portal 元素
 * 在 Expo build 後自動添加到 index.html
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist-web/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // 檢查是否已經有 portal 元素
  if (!html.includes('id="portal"')) {
    // 在 </body> 前添加 portal 元素
    html = html.replace(
      '</body>',
      '  <!-- Portal for Glide Data Grid overlay editor -->\n  <div id="portal"></div>\n</body>'
    );
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ 已添加 portal 元素到 index.html');
  } else {
    console.log('✅ portal 元素已存在');
  }
} else {
  console.log('❌ 找不到 dist-web/index.html');
}