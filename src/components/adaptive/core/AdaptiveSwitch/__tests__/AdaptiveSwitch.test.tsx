/**
 * AdaptiveSwitch 測試套件
 * 測試跨平台開關元件的功能和行為
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { setPlatform } from '@tests/utils/test-helpers';
import { AdaptiveSwitch } from '../index';
import { DEFAULT_COLORS } from '../AdaptiveSwitch.types';

describe('AdaptiveSwitch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('跨平台一致性', () => {
    it('應該在 web 平台正確渲染', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      expect(container.querySelector('[data-testid="test-switch"]')).toBeTruthy();
    });
    
    it('應該在 iOS 平台正確渲染', () => {
      setPlatform('ios');
      
      const { container } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      expect(container.querySelector('[data-testid="test-switch"]')).toBeTruthy();
    });
    
    it('應該在 Android 平台正確渲染', () => {
      setPlatform('android');
      
      const { container } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      expect(container.querySelector('[data-testid="test-switch"]')).toBeTruthy();
    });
  });

  describe('基本功能', () => {
    it('應該正確渲染', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      expect(getByTestId('test-switch')).toBeTruthy();
    });

    it('應該顯示預設值為 false', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      const switchElement = getByTestId('test-switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(false);
    });

    it('應該顯示設定的值', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch value={true} testID="test-switch" />
      );
      
      const switchElement = getByTestId('test-switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });

    it('應該在點擊時觸發 onValueChange', () => {
      setPlatform('web');
      const onValueChange = vi.fn();
      
      const { getByTestId } = render(
        <AdaptiveSwitch 
          value={false}
          onValueChange={onValueChange}
          testID="test-switch"
        />
      );
      
      const switchElement = getByTestId('test-switch');
      fireEvent.click(switchElement);
      
      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('應該在禁用時不觸發 onValueChange', () => {
      setPlatform('web');
      const onValueChange = vi.fn();
      
      const { getByTestId } = render(
        <AdaptiveSwitch 
          value={false}
          disabled={true}
          onValueChange={onValueChange}
          testID="test-switch"
        />
      );
      
      const switchElement = getByTestId('test-switch') as HTMLInputElement;
      fireEvent.click(switchElement);
      
      expect(onValueChange).not.toHaveBeenCalled();
      expect(switchElement.disabled).toBe(true);
    });
  });

  describe('標籤功能', () => {
    it('應該在右側顯示標籤', () => {
      setPlatform('web');
      
      render(
        <AdaptiveSwitch 
          label="測試標籤"
          labelPosition="right"
        />
      );
      
      expect(screen.getByText('測試標籤')).toBeInTheDocument();
    });

    it('應該在左側顯示標籤', () => {
      setPlatform('web');
      
      render(
        <AdaptiveSwitch 
          label="測試標籤"
          labelPosition="left"
        />
      );
      
      expect(screen.getByText('測試標籤')).toBeInTheDocument();
    });

    it('應該在沒有標籤時正常渲染', () => {
      setPlatform('web');
      
      render(<AdaptiveSwitch testID="test-switch" />);
      
      expect(screen.queryByText('測試標籤')).not.toBeInTheDocument();
    });
  });

  describe('顏色配置', () => {
    it('應該使用預設顏色', () => {
      setPlatform('web');
      
      const { container } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      const switchElement = container.querySelector('[data-testid="test-switch"]');
      expect(switchElement).toBeTruthy();
    });

    it('應該使用自定義軌道顏色', () => {
      setPlatform('web');
      
      const customColors = {
        false: '#FF0000',
        true: '#00FF00',
      };
      
      const { getByTestId } = render(
        <AdaptiveSwitch 
          trackColor={customColors}
          testID="test-switch"
          value={true}
        />
      );
      
      const switchElement = getByTestId('test-switch') as HTMLElement;
      expect(switchElement).toBeTruthy();
    });
  });

  describe('無障礙功能', () => {
    it('應該設定正確的 ARIA 屬性', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch 
          testID="test-switch"
          label="開關功能"
        />
      );
      
      const inputElement = getByTestId('test-switch');
      const switchWrapper = inputElement.parentElement;
      expect(switchWrapper?.getAttribute('aria-label')).toBe('開關功能');
    });

    it('應該設定正確的角色', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      const inputElement = getByTestId('test-switch') as HTMLInputElement;
      const switchWrapper = inputElement.parentElement;
      expect(inputElement.type).toBe('checkbox');
      expect(switchWrapper?.getAttribute('role')).toBe('switch');
    });
  });

  describe('錯誤處理', () => {
    it('應該處理未定義的 onValueChange', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      const switchElement = getByTestId('test-switch');
      // 不應該拋出錯誤
      expect(() => {
        fireEvent.click(switchElement);
      }).not.toThrow();
    });

    it('應該處理無效的顏色值', () => {
      setPlatform('web');
      
      const { getByTestId } = render(
        <AdaptiveSwitch 
          trackColor={{ false: 'invalid', true: 'invalid' }}
          testID="test-switch"
        />
      );
      
      // 應該正常渲染，使用無效顏色或降級到預設值
      expect(getByTestId('test-switch')).toBeTruthy();
    });
  });
});