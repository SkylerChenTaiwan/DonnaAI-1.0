/**
 * 修復 Web 版圖標載入問題
 * 在建構後插入正確的字體載入
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist-web/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // 檢查是否已經有圖標字體載入
  if (!html.includes('ionicons')) {
    // 在 </head> 前插入 CDN 連結和修復方案
    const iconLinks = `
    <!-- 修復 @expo/vector-icons 在 Web 平台的問題 -->
    <!-- 使用 CDN 載入字體檔案 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Material Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <!-- 圖標字體載入 - 使用 jsDelivr CDN 作為主要方案 -->
    <style>
      /* 只載入實際使用的 Ionicons 字體 */
      @font-face {
        font-family: 'Ionicons';
        src: url('https://cdn.jsdelivr.net/npm/ionicons@5.5.2/dist/fonts/ionicons.woff2') format('woff2'),
             url('https://cdn.jsdelivr.net/npm/ionicons@5.5.2/dist/fonts/ionicons.woff') format('woff'),
             url('https://cdnjs.cloudflare.com/ajax/libs/ionicons/5.5.2/fonts/ionicons.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap; /* 改善載入體驗 */
      }
      
      /* 載入 Material Icons 字體 */
      @font-face {
        font-family: 'MaterialIcons';
        src: local('Material Icons'),
             local('MaterialIcons-Regular'),
             url('https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      /* 備用方案：如果自定義字體載入失敗，使用系統字體 */
      .icon-fallback {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      }
      
      /* 確保圖標元素使用正確的字體 */
      [data-testid*="icon"] {
        font-family: 'Ionicons', 'MaterialIcons', 'Material Icons', sans-serif !important;
      }
      
      /* 防止字體載入時的閃爍 */
      .icon {
        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    </style>
    
    <!-- 字體載入錯誤處理腳本 -->
    <script>
      // 監聽字體載入並處理錯誤
      (function() {
        if ('fonts' in document) {
          var fontLoadTimeout = setTimeout(function() {
            console.warn('字體載入超時，使用備用方案');
            document.body.classList.add('icon-fallback');
          }, 3000);
          
          document.fonts.ready.then(function() {
            clearTimeout(fontLoadTimeout);
            console.log('字體載入完成');
          }).catch(function(error) {
            clearTimeout(fontLoadTimeout);
            console.warn('字體載入失敗，使用備用方案:', error);
            document.body.classList.add('icon-fallback');
          });
        }
        
        // 處理網路錯誤
        window.addEventListener('error', function(event) {
          if (event.message && event.message.includes('NetworkError')) {
            console.warn('網路錯誤已捕獲:', event.message);
            event.preventDefault(); // 防止錯誤冒泡到控制台
          }
        }, true);
      })();
    </script>
    `;
    
    html = html.replace('</head>', `${iconLinks}\n</head>`);
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ 已添加圖標字體載入到 index.html');
  }
}