/**
 * Button.web 元件測試
 * 測試 Web 平台按鈕的樣式、功能和對比度
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/Button/Button.web';
import { calculateContrast } from '@/utils/colorContrast';
import { webColorOverrides } from '@/theme/webOverrides';
import { describe, test, expect, vi } from 'vitest';

describe('Button.web', () => {
  describe('樣式和對比度測試', () => {
    test('主要按鈕文字對比度符合 WCAG AA', () => {
      const { getByTestId } = render(
        <Button title="測試" variant="primary" data-testid="test-button" />
      );
      
      const button = getByTestId('test-button') as HTMLButtonElement;
      const styles = window.getComputedStyle(button);
      
      // 計算對比度
      const contrast = calculateContrast(
        webColorOverrides.button.primary.text, 
        webColorOverrides.button.primary.default
      );
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      
      console.log(`主要按鈕對比度: ${contrast.toFixed(2)}:1`);
    });

    test('次要按鈕文字對比度符合 WCAG AA', () => {
      const contrast = calculateContrast(
        webColorOverrides.button.secondary.text,
        webColorOverrides.button.secondary.default
      );
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      
      console.log(`次要按鈕對比度: ${contrast.toFixed(2)}:1`);
    });

    test('輪廓按鈕文字對比度符合 WCAG AA', () => {
      const contrast = calculateContrast(
        webColorOverrides.button.outline.text,
        '#FFFFFF' // 透明背景，假設白色背景
      );
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      
      console.log(`輪廓按鈕對比度: ${contrast.toFixed(2)}:1`);
    });
  });

  describe('功能測試', () => {
    test('按鈕點擊事件正常觸發', () => {
      const handleClick = vi.fn();
      const { getByText } = render(
        <Button title="點擊我" onPress={handleClick} />
      );
      
      fireEvent.click(getByText('點擊我'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('同時支援 onPress 和 onClick', () => {
      const handlePress = vi.fn();
      const handleClick = vi.fn();
      const { getByText } = render(
        <Button 
          title="雙重處理" 
          onPress={handlePress}
          onClick={handleClick}
        />
      );
      
      fireEvent.click(getByText('雙重處理'));
      expect(handlePress).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('禁用狀態無法點擊', () => {
      const handleClick = vi.fn();
      const { getByText } = render(
        <Button title="禁用按鈕" onPress={handleClick} disabled />
      );
      
      fireEvent.click(getByText('禁用按鈕'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('載入狀態無法點擊', () => {
      const handleClick = vi.fn();
      const { getByText } = render(
        <Button title="載入中" onPress={handleClick} loading />
      );
      
      fireEvent.click(getByText('載入中'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('變體測試', () => {
    test('渲染所有變體', () => {
      const variants = ['primary', 'secondary', 'outline', 'ghost', 'text'] as const;
      
      variants.forEach(variant => {
        const { container } = render(
          <Button title={`${variant} 按鈕`} variant={variant} />
        );
        
        const button = container.querySelector('button');
        expect(button).toBeTruthy();
      });
    });
  });

  describe('尺寸測試', () => {
    test('渲染所有尺寸', () => {
      const sizes = ['small', 'medium', 'large'] as const;
      
      sizes.forEach(size => {
        const { container } = render(
          <Button title={`${size} 尺寸`} size={size} />
        );
        
        const button = container.querySelector('button');
        expect(button).toBeTruthy();
      });
    });
  });

  describe('圖標測試', () => {
    test('左側圖標正確渲染', () => {
      const { getByText } = render(
        <Button 
          title="左圖標" 
          icon={<span>📱</span>}
          iconPosition="left"
        />
      );
      
      const element = getByText('📱');
      expect(element).toBeTruthy();
    });

    test('右側圖標正確渲染', () => {
      const { getByText } = render(
        <Button 
          title="右圖標" 
          icon={<span>➡️</span>}
          iconPosition="right"
        />
      );
      
      const element = getByText('➡️');
      expect(element).toBeTruthy();
    });
  });

  describe('無障礙測試', () => {
    test('aria-label 正確設置', () => {
      const { getByLabelText } = render(
        <Button title="測試" aria-label="測試按鈕" />
      );
      
      const button = getByLabelText('測試按鈕');
      expect(button).toBeTruthy();
    });

    test('type 屬性正確設置', () => {
      const { getByTestId } = render(
        <Button 
          title="提交" 
          type="submit" 
          data-testid="submit-button"
        />
      );
      
      const button = getByTestId('submit-button') as HTMLButtonElement;
      expect(button.type).toBe('submit');
    });
  });

  describe('自定義樣式測試', () => {
    test('自定義樣式覆蓋預設樣式', () => {
      const customStyle = {
        backgroundColor: '#FF0000',
        fontSize: '20px'
      };
      
      const { getByTestId } = render(
        <Button 
          title="自定義" 
          style={customStyle}
          data-testid="custom-button"
        />
      );
      
      const button = getByTestId('custom-button') as HTMLButtonElement;
      expect(button.style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(button.style.fontSize).toBe('20px');
    });

    test('fullWidth 屬性正確應用', () => {
      const { getByTestId } = render(
        <Button 
          title="全寬" 
          fullWidth
          data-testid="full-width-button"
        />
      );
      
      const button = getByTestId('full-width-button') as HTMLButtonElement;
      expect(button.style.width).toBe('100%');
    });
  });

  describe('滑鼠互動測試', () => {
    test('懸停效果觸發', () => {
      const { getByTestId } = render(
        <Button 
          title="懸停測試" 
          variant="primary"
          data-testid="hover-button"
        />
      );
      
      const button = getByTestId('hover-button') as HTMLButtonElement;
      const originalColor = button.style.backgroundColor;
      
      fireEvent.mouseEnter(button);
      const hoverColor = button.style.backgroundColor;
      
      expect(hoverColor).toBe(webColorOverrides.button.primary.hover);
      
      fireEvent.mouseLeave(button);
      expect(button.style.backgroundColor).toBe(webColorOverrides.button.primary.default);
    });
  });
});