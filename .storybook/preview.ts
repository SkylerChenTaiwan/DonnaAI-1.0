import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    docs: {
      theme: themes.light
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '390px',
            height: '844px'
          }
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px'
          }
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1920px',
            height: '1080px'
          }
        }
      },
      defaultViewport: 'desktop'
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#FFFFFF'
        },
        {
          name: 'gray',
          value: '#F5F5F5'
        },
        {
          name: 'dark',
          value: '#1A1A1A'
        }
      ]
    },
    layout: 'centered'
  },
  globalTypes: {
    platform: {
      name: 'Platform',
      description: 'Platform for components',
      defaultValue: 'web',
      toolbar: {
        icon: 'mobile',
        items: [
          { value: 'web', title: 'Web' },
          { value: 'ios', title: 'iOS' },
          { value: 'android', title: 'Android' }
        ],
        showName: true
      }
    },
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' }
        ],
        showName: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      // 模擬平台環境
      if (typeof window !== 'undefined') {
        (window as any).__PLATFORM__ = context.globals.platform;
        (window as any).__THEME__ = context.globals.theme;
      }
      
      return Story();
    }
  ],
  tags: ['autodocs']
};

export default preview;