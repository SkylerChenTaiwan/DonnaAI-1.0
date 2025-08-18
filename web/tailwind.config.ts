/**
 * Tailwind CSS 配置
 * 包含 DonnaAI 設計系統的自訂配置
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 字體系統
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'var(--font-geist-mono)',
          '"SFMono-Regular"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'monospace',
        ],
      },

      // 顏色系統 - 基於 Notion 風格的灰階設計
      colors: {
        // 主色調
        primary: {
          50: '#FAFAFA',
          100: '#F8F8F8',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          DEFAULT: '#2C2C2C',
        },

        // 背景色
        background: {
          primary: '#FFFFFF',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          input: '#FAFAFA',
          secondary: '#F5F5F5',
        },

        // 文字色
        text: {
          primary: '#2C2C2C',
          secondary: '#666666',
          tertiary: '#999999',
          disabled: '#CCCCCC',
          inverse: '#FFFFFF',
        },

        // 邊框色
        border: {
          light: '#E5E7EB',
          DEFAULT: '#D1D5DB',
          medium: '#B5B5B5',
          dark: '#9CA3AF',
        },

        // 按鈕色
        button: {
          primary: {
            DEFAULT: '#1A1A1A',
            hover: '#2C2C2C',
            pressed: '#0A0A0A',
          },
          secondary: {
            DEFAULT: '#F7F7F7',
            hover: '#ECECEC',
            pressed: '#E0E0E0',
          },
        },

        // 狀態色
        success: {
          50: '#F0FDF4',
          500: '#34C759',
          DEFAULT: '#34C759',
        },
        warning: {
          50: '#FFFBEB',
          500: '#FF9500',
          DEFAULT: '#FF9500',
        },
        error: {
          50: '#FEF2F2',
          500: '#FF3B30',
          DEFAULT: '#FF3B30',
        },
        info: {
          50: '#EEF2FF',
          500: '#5856D6',
          DEFAULT: '#5856D6',
        },
      },

      // 間距系統
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },

      // 圓角系統
      borderRadius: {
        button: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },

      // 陰影系統
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 2px 4px rgba(0, 0, 0, 0.08)',
        lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
        xl: '0 8px 16px rgba(0, 0, 0, 0.15)',
      },

      // 過渡動畫
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },

      // 字體大小系統
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['32px', { lineHeight: '40px' }],
      },

      // 響應式斷點
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },

      // Z-index 層級
      zIndex: {
        hide: '-1',
        base: '0',
        dropdown: '1000',
        overlay: '1100',
        modal: '1200',
        popover: '1300',
        tooltip: '1400',
      },

      // 自訂動畫
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },

      // 動畫關鍵幀
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },

      // 背景漸層
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      // 自訂工具類別
      aspectRatio: {
        'card': '4 / 3',
        'photo': '3 / 2',
        'video': '16 / 9',
      },
    },
  },
  plugins: [
    // 表單樣式插件
    require('@tailwindcss/forms')({
      strategy: 'class', // 使用 class 策略避免全域樣式覆蓋
    }),
    
    // 排版插件
    require('@tailwindcss/typography'),
    
    // 自訂插件：添加設計系統工具類別
    function({ addUtilities, theme }: any) {
      const newUtilities = {
        // 按鈕樣式工具類別
        '.btn-primary': {
          backgroundColor: theme('colors.button.primary.DEFAULT'),
          color: theme('colors.text.inverse'),
          borderRadius: theme('borderRadius.button'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 150ms ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.button.primary.hover'),
          },
          '&:active': {
            backgroundColor: theme('colors.button.primary.pressed'),
          },
        },
        
        '.btn-secondary': {
          backgroundColor: theme('colors.button.secondary.DEFAULT'),
          color: theme('colors.text.primary'),
          borderRadius: theme('borderRadius.button'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 150ms ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.button.secondary.hover'),
          },
          '&:active': {
            backgroundColor: theme('colors.button.secondary.pressed'),
          },
        },

        // 卡片樣式
        '.card': {
          backgroundColor: theme('colors.background.surface'),
          borderRadius: theme('borderRadius.md'),
          padding: theme('spacing.md'),
          boxShadow: theme('boxShadow.sm'),
        },

        '.card-elevated': {
          backgroundColor: theme('colors.background.elevated'),
          borderRadius: theme('borderRadius.md'),
          padding: theme('spacing.md'),
          boxShadow: theme('boxShadow.md'),
        },

        // 文字樣式
        '.text-heading-1': {
          fontSize: theme('fontSize.3xl[0]'),
          lineHeight: theme('fontSize.3xl[1].lineHeight'),
          fontWeight: '700',
          color: theme('colors.text.primary'),
        },

        '.text-heading-2': {
          fontSize: theme('fontSize.2xl[0]'),
          lineHeight: theme('fontSize.2xl[1].lineHeight'),
          fontWeight: '600',
          color: theme('colors.text.primary'),
        },

        '.text-body': {
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          fontWeight: '400',
          color: theme('colors.text.primary'),
        },

        '.text-caption': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          fontWeight: '400',
          color: theme('colors.text.secondary'),
        },

        // 響應式容器
        '.container-responsive': {
          width: '100%',
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4'),
          '@media (min-width: 768px)': {
            paddingLeft: theme('spacing.6'),
            paddingRight: theme('spacing.6'),
          },
          '@media (min-width: 1024px)': {
            paddingLeft: theme('spacing.8'),
            paddingRight: theme('spacing.8'),
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
};

export default config;