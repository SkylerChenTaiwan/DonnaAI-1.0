/**
 * 修復 Web 版圖標載入問題
 * 在建構後插入正確的字體載入
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist-web/index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // 移除 Expo 自動生成的字體載入（如果存在）
  html = html.replace(/<link[^>]*fonts\/Ionicons[^>]*>/g, '');
  html = html.replace(/<link[^>]*@expo\/vector-icons[^>]*>/g, '');
  
  // 檢查是否已經有圖標字體載入
  if (!html.includes('ionicons') && !html.includes('Ionicons')) {
    // 在 </head> 前插入 CDN 連結和修復方案
    const iconLinks = `
    <!-- Web 圖標字體載入 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Material Icons (Google Fonts) -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <!-- Ionicons 使用官方 CDN -->
    <link rel="stylesheet" href="https://unpkg.com/ionicons@4.5.10-0/dist/css/ionicons.min.css">
    
    <!-- 備用字體定義 -->
    <style>
      /* Ionicons 字體定義 - 使用多個 CDN 作為備用 */
      @font-face {
        font-family: 'Ionicons';
        src: url('https://unpkg.com/ionicons@4.5.10-0/dist/fonts/ionicons.woff2?v=4.5.10-0') format('woff2'),
             url('https://unpkg.com/ionicons@4.5.10-0/dist/fonts/ionicons.woff?v=4.5.10-0') format('woff'),
             url('https://unpkg.com/ionicons@4.5.10-0/dist/fonts/ionicons.ttf?v=4.5.10-0') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      /* Material Icons 字體定義 */
      @font-face {
        font-family: 'MaterialIcons';
        src: local('Material Icons'),
             local('MaterialIcons-Regular'),
             url('https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2') format('woff2');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      /* 通用圖標樣式 */
      .icon {
        font-family: 'Ionicons', 'MaterialIcons', 'Material Icons', sans-serif !important;
        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      
      /* 隱藏 Expo 自動載入的錯誤字體 */
      @font-face {
        font-family: 'ExpoIcons';
        src: url('data:font/woff2;base64,') format('woff2');
        font-display: optional;
      }
    </style>
    
    <!-- 錯誤處理腳本 -->
    <script>
      (function() {
        // 移除 Expo 自動生成的字體載入
        document.addEventListener('DOMContentLoaded', function() {
          var links = document.querySelectorAll('link[href*="@expo/vector-icons"], link[href*="fonts/Ionicons"]');
          links.forEach(function(link) {
            link.remove();
          });
        });
        
        // 字體載入監控
        if ('fonts' in document) {
          var timeout = setTimeout(function() {
            console.log('字體載入超時，使用系統字體');
          }, 5000);
          
          document.fonts.ready.then(function() {
            clearTimeout(timeout);
            console.log('字體載入完成');
          }).catch(function(error) {
            clearTimeout(timeout);
            console.warn('字體載入失敗:', error);
          });
        }
        
        // 全域錯誤處理
        window.addEventListener('error', function(event) {
          var msg = event.message || '';
          if (msg.includes('Failed to decode') || 
              msg.includes('OTS parsing') || 
              msg.includes('NetworkError') ||
              msg.includes('ERR_ABORTED') ||
              msg.includes('@expo/vector-icons')) {
            event.preventDefault();
            return true;
          }
        }, true);
        
        // Promise rejection 處理
        window.addEventListener('unhandledrejection', function(event) {
          var msg = event.reason?.message || '';
          if (msg.includes('NetworkError') || msg.includes('Failed to fetch')) {
            event.preventDefault();
            return true;
          }
        });
      })();
    </script>
    `;
    
    html = html.replace('</head>', `${iconLinks}\n</head>`);
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ 已添加圖標字體載入到 index.html');
  } else {
    console.log('⚠️ 字體載入已存在，跳過');
  }
}