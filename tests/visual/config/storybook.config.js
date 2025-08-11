/**
 * Storybook 視覺測試配置
 * 配置 Storybook 用於視覺回歸測試
 */

module.exports = {
  // 基本設定
  stories: [
    '../stories/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../../../src/components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  
  // 附加元件
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    {
      name: '@storybook/addon-storysource',
      options: {
        rule: {
          test: [/\.stories\.(jsx?|tsx?)$/],
          include: [path.resolve(__dirname, '../stories')],
        },
        loaderOptions: {
          prettierConfig: { printWidth: 80, singleQuote: false },
        },
      },
    },
  ],
  
  // 框架設定
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  
  // TypeScript 設定
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  
  // Webpack 自定義
  webpackFinal: async (config, { configType }) => {
    // 添加路徑別名
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '../../../src'),
      '@components': path.resolve(__dirname, '../../../src/components'),
      '@adaptive': path.resolve(__dirname, '../../../src/components/adaptive'),
      '@theme': path.resolve(__dirname, '../../../src/theme'),
    };
    
    // React Native Web 支援
    config.resolve.alias['react-native$'] = 'react-native-web';
    
    // 添加 React Native Web babel 插件
    const babelRule = config.module.rules.find(
      (rule) => rule.test && rule.test.test('.tsx')
    );
    
    if (babelRule) {
      babelRule.use[0].options.plugins = [
        ...(babelRule.use[0].options.plugins || []),
        'react-native-web/babel',
      ];
    }
    
    // 處理 React Native 文件擴展名
    config.resolve.extensions = [
      '.web.js',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
    ];
    
    // 優化構建
    if (configType === 'PRODUCTION') {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // 全域參數
  parameters: {
    // 操作設定
    actions: { 
      argTypesRegex: '^on[A-Z].*',
      disable: false, // 視覺測試時可能需要禁用
    },
    
    // 控制項設定
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    
    // 視窗設定
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
        desktopHD: {
          name: 'Desktop HD',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
      defaultViewport: 'desktop',
    },
    
    // 背景設定
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#333333',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
      grid: {
        disable: true, // 視覺測試時禁用網格
      },
    },
    
    // 文檔設定
    docs: {
      extractComponentDescription: (component, { notes }) => {
        if (notes) {
          return typeof notes === 'string' ? notes : notes.markdown || notes.text;
        }
        return null;
      },
    },
    
    // 無障礙測試
    a11y: {
      element: '#root',
      config: {},
      options: {},
      manual: true,
    },
    
    // 視覺測試專用參數
    visualTest: {
      // 截圖延遲
      delay: 500,
      
      // 禁用動畫
      disableAnimations: true,
      
      // 忽略區域
      ignoreRegions: [
        '[data-testid="ignore-visual-test"]',
        '.loading-spinner',
        '.timestamp',
      ],
      
      // 測試變體
      variants: {
        default: {},
        hover: { pseudo: ':hover' },
        focus: { pseudo: ':focus' },
        active: { pseudo: ':active' },
        disabled: { args: { disabled: true } },
        loading: { args: { loading: true } },
        error: { args: { error: 'Error message' } },
      },
    },
  },
  
  // 功能設定
  features: {
    // 構建故事索引
    buildStoriesJson: true,
    
    // 交互測試
    interactionTesting: true,
    
    // 預構建管理器
    previewMdx2: true,
  },
  
  // 靜態目錄
  staticDirs: [
    '../../../public',
    '../assets',
  ],
  
  // 管理器配置
  managerHead: (head) => `
    ${head}
    <style>
      /* 隱藏不必要的 UI 元素以獲得更乾淨的截圖 */
      .visual-test-mode .sb-show-main {
        border: none !important;
      }
      
      .visual-test-mode [data-testid="storybook-panel"] {
        display: none !important;
      }
      
      /* 確保字體一致性 */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    </style>
  `,
  
  // 預覽配置
  previewHead: (head) => `
    ${head}
    <style>
      /* 重置樣式確保一致性 */
      * {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-variant-ligatures: none;
      }
      
      /* 禁用動畫以獲得一致的截圖 */
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
      
      /* 確保圖片載入 */
      img {
        image-rendering: -webkit-optimize-contrast;
      }
      
      /* 視覺測試模式的特殊樣式 */
      .visual-test-mode {
        background: white;
        padding: 20px;
        min-height: 100vh;
        box-sizing: border-box;
      }
    </style>
    <script>
      // 檢測視覺測試模式
      if (window.location.search.includes('visualTest=true')) {
        document.body.classList.add('visual-test-mode');
      }
      
      // 禁用控制台日誌（減少噪音）
      if (window.location.search.includes('silent=true')) {
        console.log = console.warn = console.error = () => {};
      }
    </script>
  `,
  
  // 環境變數
  env: (config) => ({
    ...config,
    STORYBOOK_VISUAL_TEST: 'true',
  }),
  
  // 實驗性功能
  experimental_features: {
    // 現代化構建
    modernInlineRender: true,
  },
};

const path = require('path');