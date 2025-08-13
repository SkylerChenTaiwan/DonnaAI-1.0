/**
 * 測試環境設定
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';

// 自動清理
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
  getApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null
  })),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  getRedirectResult: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  EmailAuthProvider: vi.fn(),
  reauthenticateWithCredential: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _seconds: Date.now() / 1000 })),
  Timestamp: {
    now: vi.fn(() => ({ 
      toDate: () => new Date(),
      seconds: Date.now() / 1000
    })),
    fromDate: vi.fn((date) => ({
      toDate: () => date,
      seconds: date.getTime() / 1000
    }))
  },
  addDoc: vi.fn(),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  increment: vi.fn()
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn() })) });

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([])
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn() })) as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation(cb => {
  setTimeout(cb, 0);
  return 0;
}) as any;

global.cancelAnimationFrame = vi.fn() as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn().mockReturnValue(null)
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    language: 'en-US',
    languages: ['en-US', 'en'],
    onLine: true,
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('')
    }
  },
  writable: true
});

// Mock fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  blob: vi.fn().mockResolvedValue(new Blob()),
  headers: new Headers()
}) as any;

// Mock performance API
if (!window.performance) {
  (window as any).performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn().mockReturnValue([]),
    getEntriesByName: vi.fn().mockReturnValue([]),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  };
}

// Mock crypto API
if (!window.crypto) {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      },
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    }
  });
}

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Consider adding an error boundary')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// React Native Mock
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: (options: any) => options.web || options.default,
    Version: 21,
    isTV: false,
    isTesting: true
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  StyleSheet: {
    create: (styles: any) => styles,
    flatten: (style: any) => style,
    absoluteFillObject: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    }
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
  Image: 'Image',
  Alert: {
    alert: vi.fn()
  },
  Linking: {
    openURL: vi.fn().mockResolvedValue(true),
    canOpenURL: vi.fn().mockResolvedValue(true)
  },
  Share: {
    share: vi.fn().mockResolvedValue({ action: 'sharedAction' })
  },
  Animated: {
    Value: vi.fn(() => ({
      setValue: vi.fn(),
      setOffset: vi.fn(),
      flattenOffset: vi.fn(),
      extractOffset: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      removeAllListeners: vi.fn(),
      stopAnimation: vi.fn(),
      resetAnimation: vi.fn(),
      interpolate: vi.fn(),
      animate: vi.fn()
    })),
    timing: vi.fn(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn()
    })),
    View: 'Animated.View',
    Text: 'Animated.Text',
    Image: 'Animated.Image'
  }
}));

// Expo Mock
vi.mock('expo-constants', () => ({
  default: {
    manifest: {},
    expoConfig: {}
  }
}));

vi.mock('expo-linking', () => ({
  createURL: vi.fn(),
  openURL: vi.fn().mockResolvedValue(true)
}));

vi.mock('expo-router', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn()
  }),
  useLocalSearchParams: vi.fn().mockReturnValue({}),
  usePathname: vi.fn().mockReturnValue('/'),
  Link: 'Link',
  Stack: {
    Screen: 'Stack.Screen'
  }
}));

// 測試環境變數
process.env.NODE_ENV = 'test';
process.env.VITE_FIREBASE_USE_EMULATOR = 'true';