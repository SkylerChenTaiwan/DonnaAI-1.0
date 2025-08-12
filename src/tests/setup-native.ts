/**
 * React Native 測試環境設定
 */

import { vi } from 'vitest';

// React Native 特定 Mock
vi.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

vi.mock('react-native-reanimated', () => ({
  default: {
    createAnimatedComponent: (component: any) => component,
    Value: vi.fn(),
    event: vi.fn(),
    add: vi.fn(),
    eq: vi.fn(),
    set: vi.fn(),
    cond: vi.fn(),
    interpolate: vi.fn(),
    View: 'Animated.View',
    ScrollView: 'Animated.ScrollView',
    Text: 'Animated.Text',
    Image: 'Animated.Image'
  }
}));

vi.mock('react-native-gesture-handler', () => ({
  State: {},
  PanGestureHandler: 'PanGestureHandler',
  BaseButton: 'BaseButton',
  Directions: {}
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 })
}));

vi.mock('react-native-screens', () => ({
  enableScreens: vi.fn()
}));

vi.mock('react-native-vector-icons/Ionicons', () => 'Icon');
vi.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
vi.mock('react-native-vector-icons/FontAwesome', () => 'Icon');

vi.mock('@react-navigation/native', () => ({
  ...vi.importActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: vi.fn(),
    goBack: vi.fn(),
    dispatch: vi.fn()
  }),
  useRoute: () => ({
    params: {}
  }),
  useFocusEffect: vi.fn(),
  useIsFocused: () => true
}));

vi.mock('@react-navigation/stack', () => ({
  createStackNavigator: vi.fn()
}));

vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: vi.fn()
}));

// Expo 特定 Mock
vi.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: vi.fn().mockResolvedValue([{
        playAsync: vi.fn(),
        stopAsync: vi.fn(),
        unloadAsync: vi.fn(),
        getStatusAsync: vi.fn().mockResolvedValue({ isPlaying: false })
      }])
    },
    setAudioModeAsync: vi.fn()
  }
}));

vi.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
    getCameraPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' })
  },
  CameraType: {
    back: 'back',
    front: 'front'
  }
}));

vi.mock('expo-document-picker', () => ({
  getDocumentAsync: vi.fn().mockResolvedValue({
    type: 'success',
    uri: 'file://test.pdf',
    name: 'test.pdf',
    size: 1000
  })
}));

vi.mock('expo-file-system', () => ({
  documentDirectory: 'file://documents/',
  cacheDirectory: 'file://cache/',
  readAsStringAsync: vi.fn().mockResolvedValue('file content'),
  writeAsStringAsync: vi.fn().mockResolvedValue(undefined),
  deleteAsync: vi.fn().mockResolvedValue(undefined),
  makeDirectoryAsync: vi.fn().mockResolvedValue(undefined),
  getInfoAsync: vi.fn().mockResolvedValue({ exists: true, size: 1000 })
}));

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  selectionAsync: vi.fn()
}));

vi.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: vi.fn().mockResolvedValue({
    cancelled: false,
    assets: [{
      uri: 'file://image.jpg',
      width: 1000,
      height: 1000
    }]
  }),
  launchCameraAsync: vi.fn().mockResolvedValue({
    cancelled: false,
    assets: [{
      uri: 'file://photo.jpg',
      width: 1000,
      height: 1000
    }]
  }),
  requestMediaLibraryPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' })
}));

vi.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: vi.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 5,
      heading: 0,
      speed: 0
    }
  })
}));

vi.mock('expo-notifications', () => ({
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: 'ExponentPushToken[xxxxx]' }),
  setNotificationHandler: vi.fn(),
  scheduleNotificationAsync: vi.fn().mockResolvedValue('notification-id'),
  cancelScheduledNotificationAsync: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('expo-secure-store', () => ({
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  getItemAsync: vi.fn().mockResolvedValue(null),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: vi.fn().mockResolvedValue(true),
  shareAsync: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('expo-speech', () => ({
  speak: vi.fn(),
  stop: vi.fn(),
  isSpeakingAsync: vi.fn().mockResolvedValue(false)
}));

vi.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: vi.fn(),
  hideAsync: vi.fn()
}));

vi.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar'
}));

vi.mock('expo-updates', () => ({
  checkForUpdateAsync: vi.fn().mockResolvedValue({ isAvailable: false }),
  fetchUpdateAsync: vi.fn().mockResolvedValue({ isNew: false }),
  reloadAsync: vi.fn()
}));

// AsyncStorage Mock
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
    getAllKeys: vi.fn().mockResolvedValue([]),
    multiGet: vi.fn().mockResolvedValue([]),
    multiSet: vi.fn().mockResolvedValue(undefined),
    multiRemove: vi.fn().mockResolvedValue(undefined)
  }
}));

// NetInfo Mock
vi.mock('@react-native-community/netinfo', () => ({
  addEventListener: vi.fn(),
  fetch: vi.fn().mockResolvedValue({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true
  })
}));

// 測試用常數
export const TEST_CONSTANTS = {
  MOCK_USER_ID: 'test-user-123',
  MOCK_ORG_ID: 'test-org-456',
  MOCK_TOKEN: 'test-token-789',
  MOCK_EMAIL: 'test@example.com',
  MOCK_IMAGE_URI: 'file://test-image.jpg',
  MOCK_FILE_URI: 'file://test-file.pdf'
};