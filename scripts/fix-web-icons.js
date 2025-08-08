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
  if (!html.includes('ionicons.css')) {
    // 在 </head> 前插入 CDN 連結和修復方案
    const iconLinks = `
    <!-- 修復 @expo/vector-icons 在 Web 平台的問題 -->
    <!-- 使用 CDN 載入未損壞的字體檔案 -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Material Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    
    <!-- 使用 unpkg CDN 載入未損壞的字體 -->
    <style>
      @font-face {
        font-family: 'Ionicons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'MaterialIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/MaterialIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/MaterialCommunityIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'FontAwesome';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/FontAwesome.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Feather';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Feather.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'AntDesign';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/AntDesign.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Entypo';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/Entypo.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'SimpleLineIcons';
        src: url('https://unpkg.com/react-native-vector-icons@10.0.0/Fonts/SimpleLineIcons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      /* 確保圖標元素使用正確的字體 */
      [data-testid*="icon"] {
        font-family: 'Ionicons', 'MaterialIcons', 'FontAwesome', sans-serif !important;
      }
    </style>
    `;
    
    html = html.replace('</head>', `${iconLinks}\n</head>`);
    
    fs.writeFileSync(indexPath, html);
    console.log('✅ 已添加圖標字體載入到 index.html');
  }
}