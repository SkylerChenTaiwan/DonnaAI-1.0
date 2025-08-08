/**
 * 載入圖標字體的 Hook
 * 解決 Expo Web 平台字體載入問題
 */

import { useFonts } from 'expo-font';
import { Platform } from 'react-native';

export function useIconFonts() {
  // 只在 Web 平台載入字體
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {
          // Ionicons
          'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
          // Material Icons
          'MaterialIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
          'MaterialCommunityIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
          // FontAwesome
          'FontAwesome': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf'),
          'FontAwesome5_Solid': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf'),
          'FontAwesome5_Regular': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf'),
          'FontAwesome5_Brands': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf'),
          // Feather
          'Feather': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
          // AntDesign
          'AntDesign': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf'),
          // Entypo
          'Entypo': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Entypo.ttf'),
          // Foundation
          'Foundation': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Foundation.ttf'),
          // SimpleLineIcons
          'SimpleLineIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/SimpleLineIcons.ttf'),
          // Octicons
          'Octicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Octicons.ttf'),
          // Zocial
          'Zocial': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Zocial.ttf'),
          // EvilIcons
          'EvilIcons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/EvilIcons.ttf'),
          // Fontisto
          'Fontisto': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Fontisto.ttf'),
        }
      : {}
  );

  return fontsLoaded;
}