module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // 基本規則
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // React/React Native 規則
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off',
    
    // 程式碼品質
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-expressions': 'error',
    
    // Adaptive Architecture 相關警告
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  env: {
    jest: true,
    node: true,
    browser: true,
    'react-native/react-native': true,
  },
  settings: {
    'react-native/style-sheet-object-names': ['StyleSheet', 'styles'],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.expo/',
    '*.generated.*',
  ],
};