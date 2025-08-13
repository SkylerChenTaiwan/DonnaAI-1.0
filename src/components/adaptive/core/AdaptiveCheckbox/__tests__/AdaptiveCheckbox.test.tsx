/**
 * AdaptiveCheckbox 測試
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { setPlatform } from '@tests/utils/test-helpers';
import { AdaptiveCheckbox } from '../index';

describe('AdaptiveCheckbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('跨平台一致性', () => {
    it('應該在 web 平台正確渲染', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveCheckbox testID="test-checkbox" />
      );
      
      expect(container.querySelector('[data-testid="test-checkbox"]')).toBeTruthy();
    });
    
    it('應該在 iOS 平台正確渲染', () => {
      setPlatform('ios');
      
      const { container } = render(
        <AdaptiveCheckbox testID="test-checkbox" />
      );
      
      expect(container.querySelector('[data-testid="test-checkbox"]')).toBeTruthy();
    });
    
    it('應該在 Android 平台正確渲染', () => {
      setPlatform('android');
      
      const { container } = render(
        <AdaptiveCheckbox testID="test-checkbox" />
      );
      
      expect(container.querySelector('[data-testid="test-checkbox"]')).toBeTruthy();
    });
  });
  
  describe('基本功能', () => {
    it('應該處理 value 變更', () => {
      setPlatform('web');
      const onValueChange = vi.fn();
      
      const { getByTestId } = render(
        <AdaptiveCheckbox
          testID="test-checkbox"
          value={false}
          onValueChange={onValueChange}
        />
      );
      
      const checkbox = getByTestId('test-checkbox');
      fireEvent.click(checkbox);
      
      expect(onValueChange).toHaveBeenCalledWith(true);
    });
    
    it('應該正確顯示標籤', () => {
      setPlatform('web');
      
      render(
        <AdaptiveCheckbox label="測試標籤" />
      );
      
      expect(screen.getByText('測試標籤')).toBeInTheDocument();
    });
    
    it('禁用時不應觸發變更', () => {
      setPlatform('web');
      const onValueChange = vi.fn();
      
      const { getByTestId } = render(
        <AdaptiveCheckbox
          testID="test-checkbox"
          disabled={true}
          value={false}
          onValueChange={onValueChange}
        />
      );
      
      const checkbox = getByTestId('test-checkbox');
      fireEvent.click(checkbox);
      
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('特殊狀態', () => {
    it('應該支援不確定狀態', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveCheckbox
          testID="test-checkbox"
          indeterminate={true}
        />
      );
      
      const checkbox = getByTestId('test-checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate || checkbox.getAttribute('aria-checked')).toBe('mixed');
    });
    
    it('應該正確顯示選中狀態', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveCheckbox
          testID="test-checkbox"
          value={true}
        />
      );
      
      const checkbox = getByTestId('test-checkbox');
      expect(checkbox.getAttribute('aria-checked')).toBe('true');
    });
  });

  describe('無障礙功能', () => {
    it('應該設定正確的 ARIA 屬性', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveCheckbox
          testID="test-checkbox"
          label="測試標籤"
        />
      );
      
      const checkbox = getByTestId('test-checkbox');
      expect(checkbox.getAttribute('aria-label')).toBe('測試標籤');
    });
  });

  describe('樣式適配', () => {
    it('應該在 web 平台使用內聯樣式', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveCheckbox
          testID="test-checkbox"
          color="#FF0000"
          value={true}
        />
      );
      
      // 檢查容器是否有正確的樣式
      const checkbox = container.querySelector('[data-testid="test-checkbox"]');
      expect(checkbox).toBeTruthy();
      expect(checkbox?.getAttribute('style')).toContain('display');
    });
  });
});