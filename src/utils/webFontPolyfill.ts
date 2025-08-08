/**
 * Web 平台字體載入 Polyfill
 * 解決 @expo/vector-icons 在 Web 平台的 OTS parsing error
 */

import { Platform } from 'react-native';

// 只在 Web 平台執行
if (Platform.OS === 'web') {
  // 創建樣式元素
  const style = document.createElement('style');
  
  // 定義字體 @font-face
  style.textContent = `
    @font-face {
      font-family: 'Ionicons';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'MaterialIcons';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'MaterialCommunityIcons';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'FontAwesome';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'Feather';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'AntDesign';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'Entypo';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'SimpleLineIcons';
      src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.ttf') format('truetype');
      font-weight: normal;
      font-style: normal;
    }
  `;
  
  // 將樣式元素插入到 head
  document.head.appendChild(style);
  
  console.log('✅ Web 字體 polyfill 已載入');
}

export {};