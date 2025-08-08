/**
 * 修復 Web 版圖標載入問題
 * 在建構後插入正確的字體載入
 * 
 * 根據 docs/troubleshooting/expo-web-icons-solution.md 的解決方案
 * 使用 CDN 載入未損壞的字體檔案
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
  if (!html.includes('react-native-vector-icons')) {
    // 在 </head> 前插入 CDN 連結和修復方案
    const iconLinks = `
    <!-- 修復 @expo/vector-icons 在 Web 平台的問題 -->
    <!-- 使用 CDN 載入未損壞的字體檔案 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://unpkg.com">
    
    <!-- Material Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <!-- 使用 unpkg CDN 載入未損壞的字體 -->
    <style>
      @font-face {
        font-family: 'Ionicons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'MaterialIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/MaterialIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/MaterialCommunityIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'FontAwesome';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/FontAwesome.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Feather';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Feather.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'AntDesign';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/AntDesign.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'Entypo';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Entypo.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      @font-face {
        font-family: 'SimpleLineIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/SimpleLineIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
      
      /* 確保圖標元素使用正確的字體 */
      [data-testid*="icon"] {
        font-family: 'Ionicons', 'MaterialIcons', 'FontAwesome', sans-serif !important;
      }
      
      /* 修正 React Native Web 生成的字體類 */
      [style*="font-family"] {
        font-synthesis: none;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    </style>
    
    <!-- 錯誤處理腳本 -->
    <script>
      (function() {
        // 移除 Expo 自動生成的錯誤字體載入
        document.addEventListener('DOMContentLoaded', function() {
          var links = document.querySelectorAll('link[href*="@expo/vector-icons"], link[href*="fonts/Ionicons"]');
          links.forEach(function(link) {
            link.remove();
          });
        });
        
        // 字體載入監控
        if ('fonts' in document) {
          document.fonts.ready.then(function() {
            console.log('✅ 圖標字體載入完成');
          }).catch(function(error) {
            console.warn('⚠️ 字體載入失敗:', error);
          });
        }
        
        // 全域錯誤處理 - 忽略字體相關錯誤
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
    console.log('✅ 已添加圖標字體載入到 index.html (使用 react-native-vector-icons CDN)');
  } else {
    console.log('⚠️ 字體載入已存在，跳過');
  }
}