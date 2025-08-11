/**
 * AdaptiveButton 視覺測試 Stories
 * 涵蓋所有按鈕變體、尺寸和狀態的視覺回歸測試
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  AdaptiveButton,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  GhostButton,
  TextButton,
  SmallButton,
  LargeButton,
  IconButton,
} from '../../../src/components/adaptive/core';
import { DesignSystem } from '../../../src/theme/designSystem';

// 圖示元件（簡化）
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const meta: Meta<typeof AdaptiveButton> = {
  title: 'Adaptive/Core/AdaptiveButton',
  component: AdaptiveButton,
  parameters: {
    docs: {
      description: {
        component: '跨平台統一按鈕元件，提供一致的按鈕體驗和完整的設計系統整合。',
      },
    },
    visualTest: {
      delay: 200,
      variants: {
        default: {},
        hover: { pseudo: ':hover' },
        active: { pseudo: ':active' },
        focus: { pseudo: ':focus' },
        disabled: { args: { disabled: true } },
        loading: { args: { loading: true } },
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      description: '按鈕內容',
      control: 'text',
    },
    title: {
      description: '按鈕標題',
      control: 'text',
    },
    variant: {
      description: '按鈕變體',
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'text'],
    },
    size: {
      description: '按鈕尺寸',
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
    disabled: {
      description: '是否禁用',
      control: 'boolean',
    },
    loading: {
      description: '是否載入中',
      control: 'boolean',
    },
    onPress: {
      description: '按壓事件',
      action: 'pressed',
    },
    onClick: {
      description: '點擊事件 (Web)',
      action: 'clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本按鈕
export const Default: Story = {
  name: '預設按鈕',
  args: {
    children: '預設按鈕',
    testID: 'adaptive-button-default',
  },
};

// 按鈕變體
export const Variants: Story = {
  name: '按鈕變體',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <PrimaryButton>主要按鈕 (Primary)</PrimaryButton>
      <SecondaryButton>次要按鈕 (Secondary)</SecondaryButton>
      <OutlineButton>邊框按鈕 (Outline)</OutlineButton>
      <GhostButton>幽靈按鈕 (Ghost)</GhostButton>
      <TextButton>文字按鈕 (Text)</TextButton>
    </div>
  ),
};

// 按鈕尺寸
export const Sizes: Story = {
  name: '按鈕尺寸',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <SmallButton>小型按鈕</SmallButton>
      <AdaptiveButton size="medium">中型按鈕</AdaptiveButton>
      <LargeButton>大型按鈕</LargeButton>
    </div>
  ),
};

// 按鈕狀態
export const States: Story = {
  name: '按鈕狀態',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: DesignSystem.colors.text.primary }}>
          一般狀態
        </h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <PrimaryButton>主要</PrimaryButton>
          <SecondaryButton>次要</SecondaryButton>
          <OutlineButton>邊框</OutlineButton>
          <GhostButton>幽靈</GhostButton>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: DesignSystem.colors.text.primary }}>
          禁用狀態
        </h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <PrimaryButton disabled>主要</PrimaryButton>
          <SecondaryButton disabled>次要</SecondaryButton>
          <OutlineButton disabled>邊框</OutlineButton>
          <GhostButton disabled>幽靈</GhostButton>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: DesignSystem.colors.text.primary }}>
          載入狀態
        </h4>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <PrimaryButton loading>主要</PrimaryButton>
          <SecondaryButton loading>次要</SecondaryButton>
          <OutlineButton loading>邊框</OutlineButton>
          <GhostButton loading>幽靈</GhostButton>
        </div>
      </div>
    </div>
  ),
};

// 帶圖示的按鈕
export const WithIcons: Story = {
  name: '帶圖示按鈕',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <AdaptiveButton leftIcon={<SearchIcon />}>
        搜尋
      </AdaptiveButton>
      
      <AdaptiveButton variant="secondary" rightIcon={<PlusIcon />}>
        新增項目
      </AdaptiveButton>
      
      <AdaptiveButton 
        variant="outline" 
        leftIcon={<SearchIcon />} 
        rightIcon={<PlusIcon />}
      >
        搜尋並新增
      </AdaptiveButton>
      
      <IconButton leftIcon={<SearchIcon />} />
    </div>
  ),
};

// 不同寬度
export const Widths: Story = {
  name: '不同寬度',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <AdaptiveButton style={{ width: 'auto' }}>
        自動寬度
      </AdaptiveButton>
      
      <AdaptiveButton style={{ width: 200 }}>
        固定寬度 (200px)
      </AdaptiveButton>
      
      <AdaptiveButton style={{ width: '50%' }}>
        相對寬度 (50%)
      </AdaptiveButton>
      
      <AdaptiveButton style={{ width: '100%' }}>
        全寬度 (100%)
      </AdaptiveButton>
    </div>
  ),
};

// 按鈕組合
export const ButtonGroups: Story = {
  name: '按鈕組合',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: DesignSystem.colors.text.primary }}>
          水平按鈕組
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <AdaptiveButton variant="outline">取消</AdaptiveButton>
          <AdaptiveButton variant="primary">確認</AdaptiveButton>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: DesignSystem.colors.text.primary }}>
          操作按鈕組
        </h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AdaptiveButton variant="ghost" leftIcon={<SearchIcon />}>
            搜尋
          </AdaptiveButton>
          <AdaptiveButton variant="ghost" leftIcon={<PlusIcon />}>
            新增
          </AdaptiveButton>
          <AdaptiveButton variant="ghost">
            編輯
          </AdaptiveButton>
          <AdaptiveButton variant="ghost">
            刪除
          </AdaptiveButton>
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: DesignSystem.colors.text.primary }}>
          垂直按鈕組
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
          <AdaptiveButton variant="outline">選項一</AdaptiveButton>
          <AdaptiveButton variant="outline">選項二</AdaptiveButton>
          <AdaptiveButton variant="outline">選項三</AdaptiveButton>
        </div>
      </div>
    </div>
  ),
};

// 自定義樣式
export const CustomStyles: Story = {
  name: '自定義樣式',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <AdaptiveButton
        style={{
          backgroundColor: DesignSystem.colors.green[500],
          borderRadius: DesignSystem.borderRadius.lg,
          padding: '12px 24px',
        }}
      >
        成功按鈕
      </AdaptiveButton>
      
      <AdaptiveButton
        style={{
          backgroundColor: DesignSystem.colors.red[500],
          borderRadius: DesignSystem.borderRadius.sm,
          padding: '8px 16px',
        }}
      >
        危險按鈕
      </AdaptiveButton>
      
      <AdaptiveButton
        variant="outline"
        style={{
          borderColor: DesignSystem.colors.purple[500],
          color: DesignSystem.colors.purple[500],
          borderRadius: DesignSystem.borderRadius.full,
          padding: '10px 20px',
        }}
      >
        圓角按鈕
      </AdaptiveButton>
      
      <AdaptiveButton
        style={{
          background: `linear-gradient(45deg, ${DesignSystem.colors.blue[400]}, ${DesignSystem.colors.purple[500]})`,
          border: 'none',
          color: 'white',
          padding: '12px 24px',
          borderRadius: DesignSystem.borderRadius.md,
        }}
      >
        漸層按鈕
      </AdaptiveButton>
    </div>
  ),
};

// 響應式按鈕
export const ResponsiveButtons: Story = {
  name: '響應式按鈕',
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <AdaptiveButton 
        style={{
          width: '100%',
          padding: '12px',
          '@media (min-width: 768px)': {
            width: 'auto',
            padding: '8px 16px',
          },
        }}
      >
        響應式按鈕
      </AdaptiveButton>
      
      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
        <AdaptiveButton style={{ flex: 1 }} variant="outline">
          取消
        </AdaptiveButton>
        <AdaptiveButton style={{ flex: 1 }} variant="primary">
          確認
        </AdaptiveButton>
      </div>
    </div>
  ),
};

// 無障礙測試
export const AccessibilityTest: Story = {
  name: '無障礙測試',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <AdaptiveButton
        accessibilityLabel="搜尋商品"
        accessibilityHint="點擊以搜尋商品清單"
        leftIcon={<SearchIcon />}
        testID="search-button"
      >
        搜尋
      </AdaptiveButton>
      
      <AdaptiveButton
        accessibilityLabel="新增項目"
        accessibilityRole="button"
        variant="secondary"
        testID="add-button"
      >
        新增
      </AdaptiveButton>
      
      <AdaptiveButton
        disabled
        accessibilityLabel="目前無法使用的功能"
        testID="disabled-button"
      >
        暫時無法使用
      </AdaptiveButton>
    </div>
  ),
};

// 邊界測試
export const EdgeCases: Story = {
  name: '邊界測試',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
      <AdaptiveButton>
        {/* 空內容 */}
      </AdaptiveButton>
      
      <AdaptiveButton>
        超長文字按鈕測試超長文字按鈕測試超長文字按鈕測試
      </AdaptiveButton>
      
      <AdaptiveButton style={{ width: 50, height: 50 }}>
        小
      </AdaptiveButton>
      
      <AdaptiveButton style={{ width: 400, height: 80 }}>
        超大按鈕
      </AdaptiveButton>
      
      <AdaptiveButton disabled loading>
        禁用且載入中
      </AdaptiveButton>
    </div>
  ),
};