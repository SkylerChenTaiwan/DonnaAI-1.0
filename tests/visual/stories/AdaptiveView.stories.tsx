/**
 * AdaptiveView 視覺測試 Stories
 * 涵蓋所有變體和狀態的視覺回歸測試
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { 
  AdaptiveView,
  FlexView,
  CenterView,
  RowView,
  ColumnView,
  ResponsiveView,
} from '../../../src/components/adaptive/core';
import { DesignSystem } from '../../../src/theme/designSystem';
import { withAlpha } from '../../../src/utils/colorUtils';

// 輔助元件
const ContentBox: React.FC<{ children: React.ReactNode; color?: string }> = ({ 
  children, 
  color = DesignSystem.colors.primary 
}) => (
  <div style={{
    padding: '16px',
    backgroundColor: withAlpha(color, 0.2),
    border: `2px solid ${color}`,
    borderRadius: '8px',
    textAlign: 'center' as const,
    color: color,
    fontWeight: '500',
  }}>
    {children}
  </div>
);

const meta: Meta<typeof AdaptiveView> = {
  title: 'Adaptive/Core/AdaptiveView',
  component: AdaptiveView,
  parameters: {
    docs: {
      description: {
        component: '跨平台統一容器元件，替換 View/div 的統一實現。',
      },
    },
    visualTest: {
      delay: 100,
      variants: {
        default: {},
        hover: { pseudo: ':hover' },
        focus: { pseudo: ':focus' },
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: '子元素內容',
      control: false,
    },
    style: {
      description: '樣式物件',
      control: 'object',
    },
    webStyle: {
      description: 'Web 專用樣式',
      control: 'object',
    },
    nativeStyle: {
      description: 'Native 專用樣式',
      control: 'object',
    },
    onClick: {
      description: '點擊事件處理器 (Web)',
      action: 'clicked',
    },
    onPress: {
      description: '按壓事件處理器 (Native)',
      action: 'pressed',
    },
    testID: {
      description: '測試識別符',
      control: 'text',
    },
    accessible: {
      description: '是否啟用無障礙',
      control: 'boolean',
      defaultValue: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本容器
export const Default: Story = {
  name: '預設容器',
  args: {
    style: {
      padding: 20,
      backgroundColor: DesignSystem.colors.background.card,
      borderRadius: DesignSystem.borderRadius.md,
      border: `1px solid ${DesignSystem.colors.border.default}`,
    },
    testID: 'adaptive-view-default',
  },
  render: (args) => (
    <AdaptiveView {...args}>
      <ContentBox>基本 AdaptiveView 容器</ContentBox>
    </AdaptiveView>
  ),
};

// 不同尺寸
export const Sizes: Story = {
  name: '不同尺寸',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AdaptiveView 
        style={{ 
          width: 200, 
          height: 100,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px solid ${DesignSystem.colors.border.default}`,
        }}
      >
        <ContentBox>小容器 (200x100)</ContentBox>
      </AdaptiveView>
      
      <AdaptiveView 
        style={{ 
          width: 400, 
          height: 150,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px solid ${DesignSystem.colors.border.default}`,
        }}
      >
        <ContentBox>中容器 (400x150)</ContentBox>
      </AdaptiveView>
      
      <AdaptiveView 
        style={{ 
          width: 600, 
          height: 200,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px solid ${DesignSystem.colors.border.default}`,
        }}
      >
        <ContentBox>大容器 (600x200)</ContentBox>
      </AdaptiveView>
    </div>
  ),
};

// FlexView 變體
export const FlexVariants: Story = {
  name: 'Flex 佈局變體',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FlexView style={{ 
        padding: 16, 
        backgroundColor: DesignSystem.colors.background.card,
        border: `1px solid ${DesignSystem.colors.border.default}`,
        borderRadius: DesignSystem.borderRadius.md,
        gap: 8,
      }}>
        <ContentBox color={DesignSystem.colors.blue[500]}>項目 1</ContentBox>
        <ContentBox color={DesignSystem.colors.green[500]}>項目 2</ContentBox>
        <ContentBox color={DesignSystem.colors.orange[500]}>項目 3</ContentBox>
      </FlexView>
      
      <CenterView style={{ 
        height: 120,
        backgroundColor: DesignSystem.colors.background.card,
        border: `1px solid ${DesignSystem.colors.border.default}`,
        borderRadius: DesignSystem.borderRadius.md,
      }}>
        <ContentBox color={DesignSystem.colors.purple[500]}>居中內容</ContentBox>
      </CenterView>
    </div>
  ),
};

// 方向佈局
export const DirectionLayouts: Story = {
  name: '方向佈局',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          橫向佈局 (RowView)
        </h3>
        <RowView style={{ 
          padding: 16,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px solid ${DesignSystem.colors.border.default}`,
          borderRadius: DesignSystem.borderRadius.md,
          gap: 12,
        }}>
          <ContentBox color={DesignSystem.colors.red[500]}>A</ContentBox>
          <ContentBox color={DesignSystem.colors.green[500]}>B</ContentBox>
          <ContentBox color={DesignSystem.colors.blue[500]}>C</ContentBox>
        </RowView>
      </div>
      
      <div>
        <h3 style={{ margin: '0 0 8px 0', color: DesignSystem.colors.text.primary }}>
          縱向佈局 (ColumnView)
        </h3>
        <ColumnView style={{ 
          padding: 16,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px solid ${DesignSystem.colors.border.default}`,
          borderRadius: DesignSystem.borderRadius.md,
          gap: 12,
          width: 200,
        }}>
          <ContentBox color={DesignSystem.colors.red[500]}>項目 1</ContentBox>
          <ContentBox color={DesignSystem.colors.green[500]}>項目 2</ContentBox>
          <ContentBox color={DesignSystem.colors.blue[500]}>項目 3</ContentBox>
        </ColumnView>
      </div>
    </div>
  ),
};

// 響應式容器
export const ResponsiveContainer: Story = {
  name: '響應式容器',
  render: () => (
    <ResponsiveView
      style={{
        padding: 20,
        backgroundColor: DesignSystem.colors.background.card,
        border: `1px solid ${DesignSystem.colors.border.default}`,
        borderRadius: DesignSystem.borderRadius.md,
        minHeight: 150,
      }}
      mobileStyle={{
        padding: 12,
        fontSize: '14px',
      }}
      tabletStyle={{
        padding: 16,
        fontSize: '16px',
      }}
      desktopStyle={{
        padding: 24,
        fontSize: '18px',
      }}
    >
      <ContentBox>
        響應式容器 - 在不同螢幕尺寸下會有不同的樣式
      </ContentBox>
    </ResponsiveView>
  ),
};

// 巢狀容器
export const NestedContainers: Story = {
  name: '巢狀容器',
  render: () => (
    <AdaptiveView style={{
      padding: 20,
      backgroundColor: DesignSystem.colors.background.default,
      borderRadius: DesignSystem.borderRadius.lg,
    }}>
      <AdaptiveView style={{
        padding: 16,
        backgroundColor: DesignSystem.colors.background.card,
        borderRadius: DesignSystem.borderRadius.md,
        marginBottom: 16,
      }}>
        <RowView style={{ gap: 12 }}>
          <AdaptiveView style={{
            flex: 1,
            padding: 12,
            backgroundColor: DesignSystem.colors.blue[50],
            borderRadius: DesignSystem.borderRadius.sm,
          }}>
            <ContentBox color={DesignSystem.colors.blue[500]}>左側內容</ContentBox>
          </AdaptiveView>
          
          <AdaptiveView style={{
            flex: 2,
            padding: 12,
            backgroundColor: DesignSystem.colors.green[50],
            borderRadius: DesignSystem.borderRadius.sm,
          }}>
            <ContentBox color={DesignSystem.colors.green[500]}>右側內容 (較寬)</ContentBox>
          </AdaptiveView>
        </RowView>
      </AdaptiveView>
      
      <AdaptiveView style={{
        padding: 16,
        backgroundColor: DesignSystem.colors.background.card,
        borderRadius: DesignSystem.borderRadius.md,
      }}>
        <ColumnView style={{ gap: 8 }}>
          <ContentBox color={DesignSystem.colors.purple[500]}>底部區塊 - 項目 1</ContentBox>
          <ContentBox color={DesignSystem.colors.orange[500]}>底部區塊 - 項目 2</ContentBox>
        </ColumnView>
      </AdaptiveView>
    </AdaptiveView>
  ),
};

// 互動狀態
export const InteractiveStates: Story = {
  name: '互動狀態',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AdaptiveView
        style={{
          padding: 20,
          backgroundColor: DesignSystem.colors.background.card,
          border: `2px solid ${DesignSystem.colors.border.default}`,
          borderRadius: DesignSystem.borderRadius.md,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        webStyle={{
          ':hover': {
            backgroundColor: withAlpha(DesignSystem.colors.primary, 0.1),
            borderColor: DesignSystem.colors.primary,
          },
        }}
        onClick={() => console.log('Clicked!')}
        testID="interactive-container"
      >
        <ContentBox>可互動容器 (hover 效果)</ContentBox>
      </AdaptiveView>
      
      <AdaptiveView
        style={{
          padding: 20,
          backgroundColor: DesignSystem.colors.gray[100],
          border: `2px solid ${DesignSystem.colors.gray[300]}`,
          borderRadius: DesignSystem.borderRadius.md,
          opacity: 0.6,
          cursor: 'not-allowed',
        }}
        testID="disabled-container"
      >
        <ContentBox color={DesignSystem.colors.gray[500]}>禁用狀態容器</ContentBox>
      </AdaptiveView>
    </div>
  ),
};

// 無障礙測試
export const AccessibilityTest: Story = {
  name: '無障礙測試',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <AdaptiveView
        accessible={true}
        accessibilityLabel="主要內容區域"
        accessibilityRole="main"
        style={{
          padding: 20,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px solid ${DesignSystem.colors.border.default}`,
          borderRadius: DesignSystem.borderRadius.md,
        }}
        testID="accessible-main-container"
      >
        <ContentBox>具有 ARIA 標籤的主要內容</ContentBox>
      </AdaptiveView>
      
      <AdaptiveView
        accessible={true}
        accessibilityLabel="導航區域"
        accessibilityRole="navigation"
        style={{
          padding: 16,
          backgroundColor: DesignSystem.colors.background.secondary,
          border: `1px solid ${DesignSystem.colors.border.light}`,
          borderRadius: DesignSystem.borderRadius.md,
        }}
        testID="accessible-nav-container"
      >
        <ContentBox color={DesignSystem.colors.blue[500]}>導航容器</ContentBox>
      </AdaptiveView>
    </div>
  ),
};

// 邊界測試
export const EdgeCases: Story = {
  name: '邊界測試',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 空容器 */}
      <AdaptiveView
        style={{
          width: 200,
          height: 50,
          backgroundColor: DesignSystem.colors.background.card,
          border: `1px dashed ${DesignSystem.colors.border.default}`,
        }}
        testID="empty-container"
      />
      
      {/* 極小容器 */}
      <AdaptiveView
        style={{
          width: 10,
          height: 10,
          backgroundColor: DesignSystem.colors.primary,
        }}
        testID="tiny-container"
      />
      
      {/* 極大容器 */}
      <AdaptiveView
        style={{
          width: '100%',
          height: 300,
          backgroundColor: DesignSystem.colors.gray[50],
          border: `1px solid ${DesignSystem.colors.border.light}`,
          overflow: 'hidden',
        }}
        testID="large-container"
      >
        <ContentBox>大型容器 - 測試溢出處理</ContentBox>
      </AdaptiveView>
      
      {/* 零尺寸容器 */}
      <AdaptiveView
        style={{
          width: 0,
          height: 0,
          backgroundColor: DesignSystem.colors.red[500],
          border: `1px solid ${DesignSystem.colors.red[500]}`,
        }}
        testID="zero-size-container"
      />
    </div>
  ),
};