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
    // 在 </head> 前插入 CDN 連結
    const iconLinks = `
    <!-- Ionicons 字體 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/7.1.0/collection/components/icon/icon.min.css">
    
    <!-- Material Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    <!-- 自定義字體載入修復 -->
    <style>
      @font-face {
        font-family: 'Ionicons';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.6148e7019854f3bde85b633cb88f3c25.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'MaterialIcons';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.4e85bc9ebe07e0340c9c4fc2f6c38908.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'MaterialCommunityIcons';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.b62641afc9ab487008e996a5c5865e56.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'FontAwesome';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.b06871f281fee6b241d60582ae9369b9.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Feather';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.a76d309774d33d9856f650bed4292a23.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'AntDesign';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.3a2ba31570920eeb9b1d217cabe58315.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'Entypo';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.31b5ffea3daddc69dd01a1f3d6cf63c5.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
      
      @font-face {
        font-family: 'SimpleLineIcons';
        src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.d2285965fe34b05465047401b8595dd0.ttf') format('truetype');
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