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
    
    // 防止顏色字串連接錯誤（React Native Web 兼容性）
    'no-restricted-syntax': [
      'error',
      // 規則 1: 屬性名包含 color 的拼接
      {
        selector: "BinaryExpression[operator='+'][left.property.name=/[Cc]olor/][right.type='Literal']",
        message: '禁止顏色字串拼接！使用 withAlpha(color, alpha) 替代。參考 /docs/COLOR-SYSTEM-MIGRATION.md'
      },
      // 規則 2: 變數名包含 color 的拼接  
      {
        selector: "BinaryExpression[operator='+'][left.name=/[Cc]olor/][right.type='Literal']",
        message: '禁止顏色字串拼接！使用 withAlpha(color, alpha) 替代。'
      },
      // 規則 3: 函數調用返回顏色的拼接
      {
        selector: "BinaryExpression[operator='+'][left.type='CallExpression'][left.callee.name=/[Cc]olor/][right.type='Literal']",
        message: '禁止顏色字串拼接！使用 withAlpha(getColor(), alpha) 替代。'
      }
    ],
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