/**
 * AdaptiveText 視覺測試 Stories
 * 涵蓋所有文字變體、顏色和狀態的視覺回歸測試
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  AdaptiveText,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  BodyText,
  SmallText,
  Caption,
  SuccessText,
  WarningText,
  ErrorText,
  InfoText,
} from '../../../src/components/adaptive/core';
import { DesignSystem } from '../../../src/theme/designSystem';
import { withAlpha } from '../../../src/utils/colorUtils';

const meta: Meta<typeof AdaptiveText> = {
  title: 'Adaptive/Core/AdaptiveText',
  component: AdaptiveText,
  parameters: {
    docs: {
      description: {
        component: '跨平台統一文字元件，提供一致的文字渲染和字體設計系統整合。',
      },
    },
    visualTest: {
      delay: 50,
      variants: {
        default: {},
        hover: { pseudo: ':hover' },
        focus: { pseudo: ':focus' },
        selected: { class: 'selected' },
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: '文字內容',
      control: 'text',
    },
    variant: {
      description: '文字變體',
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'body', 'bodySmall', 'caption', 'button', 'buttonSmall', 'buttonLarge'],
    },
    color: {
      description: '文字顏色',
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'disabled', 'inverse', 'success', 'warning', 'error', 'info'],
    },
    align: {
      description: '文字對齊',
      control: 'select',
      options: ['left', 'center', 'right', 'justify'],
    },
    weight: {
      description: '字體粗細',
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    numberOfLines: {
      description: '行數限制',
      control: 'number',
    },
    selectable: {
      description: '是否可選擇',
      control: 'boolean',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本文字
export const Default: Story = {
  name: '預設文字',
  args: {
    children: '這是預設的 AdaptiveText 元件',
    testID: 'adaptive-text-default',
  },
};

// 標題層級
export const HeadingLevels: Story = {
  name: '標題層級',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Heading1>一級標題 (H1)</Heading1>
      <Heading2>二級標題 (H2)</Heading2>
      <Heading3>三級標題 (H3)</Heading3>
      <Heading4>四級標題 (H4)</Heading4>
      <BodyText>內文文字 (Body)</BodyText>
      <SmallText>小型文字 (Small)</SmallText>
      <Caption>說明文字 (Caption)</Caption>
    </div>
  ),
};

// 文字顏色
export const TextColors: Story = {
  name: '文字顏色',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      <AdaptiveText color="primary">主要文字顏色 (Primary)</AdaptiveText>
      <AdaptiveText color="secondary">次要文字顏色 (Secondary)</AdaptiveText>
      <AdaptiveText color="tertiary">第三級文字顏色 (Tertiary)</AdaptiveText>
      <AdaptiveText color="disabled">禁用文字顏色 (Disabled)</AdaptiveText>
      
      <div style={{ backgroundColor: DesignSystem.colors.gray[800], padding: 16, borderRadius: 8 }}>
        <AdaptiveText color="inverse">反色文字 (Inverse)</AdaptiveText>
      </div>
      
      <SuccessText>成功訊息文字 (Success)</SuccessText>
      <WarningText>警告訊息文字 (Warning)</WarningText>
      <ErrorText>錯誤訊息文字 (Error)</ErrorText>
      <InfoText>資訊訊息文字 (Info)</InfoText>
    </div>
  ),
};

// 字體粗細
export const FontWeights: Story = {
  name: '字體粗細',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AdaptiveText weight="normal">一般粗細 (Normal)</AdaptiveText>
      <AdaptiveText weight="medium">中等粗細 (Medium)</AdaptiveText>
      <AdaptiveText weight="semibold">半粗體 (Semibold)</AdaptiveText>
      <AdaptiveText weight="bold">粗體 (Bold)</AdaptiveText>
    </div>
  ),
};

// 文字對齊
export const TextAlignment: Story = {
  name: '文字對齊',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ 
        backgroundColor: DesignSystem.colors.background.card, 
        padding: 16, 
        borderRadius: 8,
        border: `1px solid ${DesignSystem.colors.border.light}`,
      }}>
        <AdaptiveText align="left">靠左對齊的文字內容</AdaptiveText>
      </div>
      
      <div style={{ 
        backgroundColor: DesignSystem.colors.background.card, 
        padding: 16, 
        borderRadius: 8,
        border: `1px solid ${DesignSystem.colors.border.light}`,
      }}>
        <AdaptiveText align="center">置中對齊的文字內容</AdaptiveText>
      </div>
      
      <div style={{ 
        backgroundColor: DesignSystem.colors.background.card, 
        padding: 16, 
        borderRadius: 8,
        border: `1px solid ${DesignSystem.colors.border.light}`,
      }}>
        <AdaptiveText align="right">靠右對齊的文字內容</AdaptiveText>
      </div>
      
      <div style={{ 
        backgroundColor: DesignSystem.colors.background.card, 
        padding: 16, 
        borderRadius: 8,
        border: `1px solid ${DesignSystem.colors.border.light}`,
        width: 300,
      }}>
        <AdaptiveText align="justify">
          兩端對齊的文字內容，這段文字比較長，可以看到兩端對齊的效果。
          文字會平均分布在每一行，讓左右兩端都對齊。
        </AdaptiveText>
      </div>
    </div>
  ),
};

// 行數限制
export const LineClamp: Story = {
  name: '行數限制',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 300 }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          單行文字 (numberOfLines: 1)
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 12, 
          borderRadius: 6,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText numberOfLines={1}>
            這是一段很長的文字，用來測試單行限制的效果。當文字超出容器寬度時，會被截斷並顯示省略號。
          </AdaptiveText>
        </div>
      </div>
      
      <div style={{ width: 300 }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          兩行文字 (numberOfLines: 2)
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 12, 
          borderRadius: 6,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText numberOfLines={2}>
            這是一段很長的文字，用來測試兩行限制的效果。當文字超出兩行時，會在第二行末尾顯示省略號。
            這樣可以確保文字不會佔用太多垂直空間。
          </AdaptiveText>
        </div>
      </div>
      
      <div style={{ width: 300 }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          三行文字 (numberOfLines: 3)
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 12, 
          borderRadius: 6,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText numberOfLines={3}>
            這是一段很長的文字，用來測試三行限制的效果。
            當文字內容超出三行的高度限制時，系統會自動在第三行的末尾加上省略號，
            確保整個文字區塊的高度保持一致，不會因為內容長度而影響整體佈局。
          </AdaptiveText>
        </div>
      </div>
    </div>
  ),
};

// 自定義字體大小
export const CustomSizes: Story = {
  name: '自定義字體大小',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AdaptiveText size={12}>12px 小字體</AdaptiveText>
      <AdaptiveText size={14}>14px 預設字體</AdaptiveText>
      <AdaptiveText size={16}>16px 中等字體</AdaptiveText>
      <AdaptiveText size={20}>20px 大字體</AdaptiveText>
      <AdaptiveText size={24}>24px 特大字體</AdaptiveText>
      <AdaptiveText size={32}>32px 超大字體</AdaptiveText>
    </div>
  ),
};

// 行高設定
export const LineHeight: Story = {
  name: '行高設定',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 300 }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          緊密行高 (lineHeight: 1.2)
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 12, 
          borderRadius: 6,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText lineHeight={1.2}>
            這段文字使用較緊密的行高設定，
            行與行之間的距離比較近，
            適合用於標題或需要節省空間的場合。
          </AdaptiveText>
        </div>
      </div>
      
      <div style={{ width: 300 }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          標準行高 (lineHeight: 1.5)
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 12, 
          borderRadius: 6,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText lineHeight={1.5}>
            這段文字使用標準的行高設定，
            提供良好的可讀性和視覺舒適度，
            適合大部分的內文閱讀場景。
          </AdaptiveText>
        </div>
      </div>
      
      <div style={{ width: 300 }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          寬鬆行高 (lineHeight: 1.8)
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 12, 
          borderRadius: 6,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText lineHeight={1.8}>
            這段文字使用較寬鬆的行高設定，
            行與行之間有較多的空白空間，
            提供更加舒適的閱讀體驗。
          </AdaptiveText>
        </div>
      </div>
    </div>
  ),
};

// 選擇性測試
export const SelectableText: Story = {
  name: '文字選擇性',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ 
        backgroundColor: DesignSystem.colors.background.card, 
        padding: 16, 
        borderRadius: 8,
        border: `1px solid ${DesignSystem.colors.border.light}`,
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          可選擇文字 (selectable: true)
        </h4>
        <AdaptiveText selectable={true}>
          這段文字可以被選取和複製。你可以用滑鼠拖曳來選擇文字內容。
        </AdaptiveText>
      </div>
      
      <div style={{ 
        backgroundColor: DesignSystem.colors.background.card, 
        padding: 16, 
        borderRadius: 8,
        border: `1px solid ${DesignSystem.colors.border.light}`,
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          不可選擇文字 (selectable: false)
        </h4>
        <AdaptiveText selectable={false}>
          這段文字不能被選取，通常用於 UI 標籤或裝飾性文字。
        </AdaptiveText>
      </div>
    </div>
  ),
};

// 互動狀態
export const InteractiveText: Story = {
  name: '互動文字',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AdaptiveText
        style={{
          cursor: 'pointer',
          padding: '8px 12px',
          backgroundColor: DesignSystem.colors.background.card,
          borderRadius: DesignSystem.borderRadius.md,
          border: `1px solid ${DesignSystem.colors.border.default}`,
          transition: 'all 0.2s ease',
        }}
        webStyle={{
          ':hover': {
            backgroundColor: withAlpha(DesignSystem.colors.primary, 0.1),
            color: DesignSystem.colors.primary,
          },
        }}
        onClick={() => console.log('Text clicked!')}
      >
        可點擊的文字 (hover 效果)
      </AdaptiveText>
      
      <AdaptiveText
        style={{
          padding: '8px 12px',
          backgroundColor: DesignSystem.colors.primary,
          color: DesignSystem.colors.text.inverse,
          borderRadius: DesignSystem.borderRadius.md,
          cursor: 'pointer',
        }}
        webStyle={{
          ':active': {
            backgroundColor: withAlpha(DesignSystem.colors.primary, 0.8),
          },
        }}
      >
        按鈕樣式文字 (active 效果)
      </AdaptiveText>
    </div>
  ),
};

// 長文測試
export const LongText: Story = {
  name: '長文測試',
  render: () => (
    <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          完整長文
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 16, 
          borderRadius: 8,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
            nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in 
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
            deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste 
            natus error sit voluptatem accusantium doloremque laudantium.
          </AdaptiveText>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          限制三行的長文
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 16, 
          borderRadius: 8,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText numberOfLines={3}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
            Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris 
            nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in 
            reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia 
            deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste 
            natus error sit voluptatem accusantium doloremque laudantium.
          </AdaptiveText>
        </div>
      </div>
    </div>
  ),
};

// 邊界測試
export const EdgeCases: Story = {
  name: '邊界測試',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          空文字
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 16, 
          borderRadius: 8,
          border: `1px solid ${DesignSystem.colors.border.light}`,
          minHeight: 20,
        }}>
          <AdaptiveText>{''}</AdaptiveText>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          單個字符
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 16, 
          borderRadius: 8,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText>A</AdaptiveText>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          特殊字符
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 16, 
          borderRadius: 8,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText>特殊字符測試 !@#$%^&amp;*()_+-=[]{}|;:,./~`</AdaptiveText>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          Unicode 字符
        </h4>
        <div style={{ 
          backgroundColor: DesignSystem.colors.background.card, 
          padding: 16, 
          borderRadius: 8,
          border: `1px solid ${DesignSystem.colors.border.light}`,
        }}>
          <AdaptiveText>🎨 🚀 💻 🌟 ❤️ 中文測試 English 한국어 日本語</AdaptiveText>
        </div>
      </div>
    </div>
  ),
};