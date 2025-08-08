module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@stores': './src/stores',
            '@navigation': './src/navigation',
            '@theme': './src/theme',
            '@assets': './assets',
            // 修復 @expo/vector-icons 在 Web 平台的問題
            'react-native-vector-icons': '@expo/vector-icons'
          }
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};