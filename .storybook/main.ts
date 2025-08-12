import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/tests/visual/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/addon-viewport',
    '@storybook/addon-a11y',
    '@storybook/addon-measure',
    '@storybook/addon-outline'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@components': path.resolve(__dirname, '../src/components'),
          '@services': path.resolve(__dirname, '../src/services'),
          '@utils': path.resolve(__dirname, '../src/utils'),
          '@tests': path.resolve(__dirname, '../src/tests'),
          '@types': path.resolve(__dirname, '../src/types'),
          '@theme': path.resolve(__dirname, '../src/theme'),
          '@adaptive': path.resolve(__dirname, '../src/components/adaptive'),
          'react-native': 'react-native-web'
        }
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
        __DEV__: true
      }
    });
  },
  docs: {
    autodocs: 'tag'
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript'
  }
};

export default config;