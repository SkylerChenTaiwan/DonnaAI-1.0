/**
 * AdaptiveSwitch 測試套件
 * 測試跨平台開關元件的功能和行為
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { AdaptiveSwitch } from '../index';
import { DEFAULT_COLORS } from '../AdaptiveSwitch.types';

// Mock Platform.OS for testing
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'ios'; // 預設為 iOS
  return RN;
});

describe('AdaptiveSwitch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本功能', () => {
    it('應該正確渲染', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      expect(getByTestId('test-switch')).toBeTruthy();
    });

    it('應該顯示預設值為 false', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.value).toBe(false);
    });

    it('應該顯示設定的值', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch value={true} testID="test-switch" />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.value).toBe(true);
    });

    it('應該在點擊時觸發 onValueChange', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = render(
        <AdaptiveSwitch 
          value={false}
          onValueChange={onValueChange}
          testID="test-switch"
        />
      );
      
      const switchElement = getByTestId('test-switch');
      fireEvent(switchElement, 'onValueChange', true);
      
      expect(onValueChange).toHaveBeenCalledWith(true);
    });

    it('應該在禁用時不觸發 onValueChange', () => {
      const onValueChange = jest.fn();
      const { getByTestId } = render(
        <AdaptiveSwitch 
          value={false}
          disabled={true}
          onValueChange={onValueChange}
          testID="test-switch"
        />
      );
      
      const switchElement = getByTestId('test-switch');
      fireEvent(switchElement, 'onValueChange', true);
      
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe('標籤功能', () => {
    it('應該在右側顯示標籤', () => {
      const { getByText } = render(
        <AdaptiveSwitch 
          label="測試標籤"
          labelPosition="right"
        />
      );
      expect(getByText('測試標籤')).toBeTruthy();
    });

    it('應該在左側顯示標籤', () => {
      const { getByText } = render(
        <AdaptiveSwitch 
          label="測試標籤"
          labelPosition="left"
        />
      );
      expect(getByText('測試標籤')).toBeTruthy();
    });

    it('應該在沒有標籤時正常渲染', () => {
      const { queryByText } = render(
        <AdaptiveSwitch />
      );
      expect(queryByText('測試標籤')).toBeNull();
    });
  });

  describe('顏色配置', () => {
    it('應該使用預設顏色', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.trackColor).toEqual({
        false: DEFAULT_COLORS.trackColor.false,
        true: DEFAULT_COLORS.trackColor.true,
      });
    });

    it('應該使用自定義軌道顏色', () => {
      const customColors = {
        false: '#FF0000',
        true: '#00FF00',
      };
      const { getByTestId } = render(
        <AdaptiveSwitch 
          trackColor={customColors}
          testID="test-switch"
        />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.trackColor).toEqual(customColors);
    });

    it('應該使用自定義滑塊顏色', () => {
      const thumbColor = '#0000FF';
      const { getByTestId } = render(
        <AdaptiveSwitch 
          thumbColor={thumbColor}
          testID="test-switch"
        />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.thumbColor).toBe(thumbColor);
    });
  });

  describe('無障礙功能', () => {
    it('應該設定正確的 accessibilityRole', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch 
          testID="test-switch"
          accessibilityRole="switch"
        />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.accessibilityRole).toBe('switch');
    });

    it('應該設定 accessibilityLabel', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch 
          testID="test-switch"
          accessibilityLabel="開關功能"
        />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.accessibilityLabel).toBe('開關功能');
    });

    it('應該使用標籤作為 accessibilityLabel', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch 
          testID="test-switch"
          label="通知設定"
        />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.accessibilityLabel).toBe('通知設定');
    });

    it('應該設定正確的 accessibilityState', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch 
          testID="test-switch"
          value={true}
          disabled={true}
        />
      );
      const switchElement = getByTestId('test-switch');
      expect(switchElement.props.accessibilityState).toMatchObject({
        checked: true,
        disabled: true,
      });
    });
  });

  describe('平台特定測試', () => {
    describe('iOS', () => {
      beforeEach(() => {
        Platform.OS = 'ios';
      });

      it('應該在 iOS 上設定 ios_backgroundColor', () => {
        const { getByTestId } = render(
          <AdaptiveSwitch 
            testID="test-switch"
            ios_backgroundColor="#CCCCCC"
          />
        );
        const switchElement = getByTestId('test-switch');
        expect(switchElement.props.ios_backgroundColor).toBe('#CCCCCC');
      });
    });

    describe('Android', () => {
      beforeEach(() => {
        Platform.OS = 'android';
      });

      it('應該在 Android 上正常運作', () => {
        const onValueChange = jest.fn();
        const { getByTestId } = render(
          <AdaptiveSwitch 
            value={false}
            onValueChange={onValueChange}
            testID="test-switch"
          />
        );
        
        const switchElement = getByTestId('test-switch');
        fireEvent(switchElement, 'onValueChange', true);
        
        expect(onValueChange).toHaveBeenCalledWith(true);
      });
    });

    describe('Web', () => {
      beforeEach(() => {
        Platform.OS = 'web';
      });

      it('應該在 Web 上使用內聯樣式', () => {
        // Web 版本使用不同的實作，這裡只測試是否能正常載入
        const { getByTestId } = render(
          <AdaptiveSwitch testID="test-switch" />
        );
        expect(getByTestId('test-switch')).toBeTruthy();
      });
    });
  });

  describe('效能測試', () => {
    it('應該在 16ms 內完成切換', async () => {
      const onValueChange = jest.fn();
      const { getByTestId } = render(
        <AdaptiveSwitch 
          value={false}
          onValueChange={onValueChange}
          testID="test-switch"
        />
      );
      
      const startTime = performance.now();
      const switchElement = getByTestId('test-switch');
      fireEvent(switchElement, 'onValueChange', true);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(16); // 60fps = 16ms per frame
    });

    it('應該處理快速連續切換', async () => {
      const onValueChange = jest.fn();
      const { getByTestId } = render(
        <AdaptiveSwitch 
          value={false}
          onValueChange={onValueChange}
          testID="test-switch"
        />
      );
      
      const switchElement = getByTestId('test-switch');
      
      // 快速切換 10 次
      for (let i = 0; i < 10; i++) {
        fireEvent(switchElement, 'onValueChange', i % 2 === 0);
      }
      
      expect(onValueChange).toHaveBeenCalledTimes(10);
    });
  });

  describe('錯誤處理', () => {
    it('應該處理未定義的 onValueChange', () => {
      const { getByTestId } = render(
        <AdaptiveSwitch testID="test-switch" />
      );
      
      const switchElement = getByTestId('test-switch');
      // 不應該拋出錯誤
      expect(() => {
        fireEvent(switchElement, 'onValueChange', true);
      }).not.toThrow();
    });

    it('應該處理無效的顏色值', () => {
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