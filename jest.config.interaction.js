/**
 * Jest 配置文件 - Firebase 認證互動測試專用
 * 針對 Firebase 認證系統的互動測試優化配置
 */

module.exports = {
  preset: 'react-native',
  displayName: 'Firebase Auth Interaction Tests',
  
  // 測試文件路徑模式
  testMatch: [
    '<rootDir>/src/tests/**/*.interaction.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/tests/**/auth*.test.{js,jsx,ts,tsx}'
  ],
  
  // 模組路徑映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/theme/(.*)$': '<rootDir>/src/theme/$1'
  },
  
  // 設定文件
  setupFilesAfterEnv: [
    '<rootDir>/src/tests/setup/jest.setup.js',
    '<rootDir>/src/tests/setup/firebase.mock.js',
    '<rootDir>/src/tests/setup/async-storage.mock.js'
  ],
  
  // 轉換配置
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    '^.+\\.svg$': 'jest-svg-transformer'
  },
  
  // 模組副檔名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // 忽略的轉換路徑
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons|@react-native-async-storage|react-native-svg)/)'
  ],
  
  // 測試環境
  testEnvironment: 'jsdom',
  
  // 覆蓋率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/firebase/auth.ts',
    'src/stores/authStore.ts',
    'src/screens/auth/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/__tests__/**/*'
  ],
  
  coverageDirectory: '<rootDir>/coverage/interaction',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // 覆蓋率門檻
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/services/firebase/auth.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/stores/authStore.ts': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  // 全域設定
  globals: {
    __DEV__: true,
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // 清除 mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // 測試超時
  testTimeout: 10000,
  
  // 詳細輸出
  verbose: true,
  
  // 測試結果處理器
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/interaction/html-report',
        filename: 'interaction-test-report.html',
        expand: true,
        pageTitle: 'Firebase 認證互動測試報告',
        hideIcon: false,
        includeFailureMsg: true,
        includeSuiteFailure: true
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage/interaction',
        outputName: 'junit-interaction.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // 模組模擬
  moduleNameMapping: {
    // React Native 相關
    '^react-native$': 'react-native-web',
    '^@react-native-async-storage/async-storage$': '<rootDir>/src/tests/mocks/async-storage.mock.js',
    
    // Firebase 相關
    '^firebase/app$': '<rootDir>/src/tests/mocks/firebase/app.mock.js',
    '^firebase/auth$': '<rootDir>/src/tests/mocks/firebase/auth.mock.js',
    '^firebase/firestore$': '<rootDir>/src/tests/mocks/firebase/firestore.mock.js',
    
    // 路徑別名
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // 快照序列化器
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ],
  
  // 監視模式配置
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/.git/'
  ],
  
  // 錯誤處理
  errorOnDeprecated: true,
  
  // 測試路徑忽略
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/e2e/',
    '<rootDir>/android/',
    '<rootDir>/ios/'
  ],
  
  // 快取配置
  cacheDirectory: '<rootDir>/.jest-cache/interaction',
  
  // 最大工作進程
  maxWorkers: '50%',
  
  // 測試結果緩存
  cache: true,
  
  // 自定義環境變數
  setupFiles: [
    '<rootDir>/src/tests/setup/env.setup.js'
  ]
};