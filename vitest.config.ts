import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    server: {
      deps: {
        inline: [
          'react-native',
          '@testing-library/react-native',
          '@react-native',
          'react-native-*'
        ]
      }
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'test-app/',
      'use-cases/',
      '**/*.d.ts',
      'src/tests/e2e/**',
      'src/tests/visual/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'functions/',
        'PRPs/',
        'docs/',
        'test-app/',
        'use-cases/',
        'src/**/*.stories.*',
        'src/tests/**',
        '**/__mocks__/**'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/components/adaptive/**': {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        },
        'src/services/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 1000,
    isolate: true,
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
    snapshotFormat: {
      escapeString: false,
      printBasicPrototype: false
    },
    benchmark: {
      include: ['src/tests/performance/**/*.bench.{js,ts}']
    },
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['src/**/*.{test,spec}.{ts,tsx}']
    },
    onConsoleLog: (log, type) => {
      if (log.includes('Warning:') || log.includes('Error:')) {
        return false;
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@tests': path.resolve(__dirname, './src/tests'),
      '@types': path.resolve(__dirname, './src/types'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@adaptive': path.resolve(__dirname, './src/components/adaptive')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test'),
    'process.env.VITE_FIREBASE_USE_EMULATOR': JSON.stringify('true')
  }
});