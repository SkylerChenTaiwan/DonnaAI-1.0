/**
 * Jest 視覺回歸測試配置
 * 配置 Jest 執行視覺測試和截圖比較
 */

module.exports = {
  displayName: 'Visual Regression Tests',
  testEnvironment: 'node',
  
  // 測試文件匹配模式
  testMatch: [
    '<rootDir>/../stories/**/*.visual.test.{js,ts}',
    '<rootDir>/../__tests__/**/*.visual.{js,ts}',
  ],
  
  // 設置文件
  setupFilesAfterEnv: [
    '<rootDir>/setup.js'
  ],
  
  // 模組路徑映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../../../src/$1',
    '^@components/(.*)$': '<rootDir>/../../../src/components/$1',
    '^@adaptive/(.*)$': '<rootDir>/../../../src/components/adaptive/$1',
  },
  
  // TypeScript 支援
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // 檔案類型處理
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // 忽略模式
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // 覆蓋率設定
  collectCoverageFrom: [
    '../../../src/components/adaptive/**/*.{ts,tsx}',
    '!../../../src/components/adaptive/**/*.stories.{ts,tsx}',
    '!../../../src/components/adaptive/**/*.test.{ts,tsx}',
    '!../../../src/components/adaptive/**/*.d.ts',
  ],
  
  // 全域變數
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../../../tsconfig.json',
      isolatedModules: true,
    },
    __DEV__: true,
    __VISUAL_TEST__: true,
  },
  
  // 超時設定
  testTimeout: 60000, // 60 秒 - 截圖需要更長時間
  
  // 報告器設定
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/../results/reports',
        filename: 'visual-test-report.html',
        expand: true,
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/../results/reports',
        outputName: 'visual-test-results.xml',
      }
    ],
  ],
  
  // 快照設定
  snapshotSerializers: [
    'jest-serializer-html'
  ],
  
  // 環境變數
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    PLATFORM_OS: 'web',
  },
  
  // 並行執行設定
  maxWorkers: process.env.CI ? 1 : '50%',
  
  // 錯誤處理
  errorOnDeprecated: true,
  verbose: true,
};