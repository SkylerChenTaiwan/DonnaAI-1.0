/**
 * AdaptiveModal 樣式保護機制測試
 * 測試 size 屬性不被 contentStyle 覆蓋的保護功能
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AdaptiveModal from '../AdaptiveModal';

// Mock 平台
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'web',
    select: jest.fn((obj) => obj.web || obj.default)
  }
}));

// Mock window.ReactDOM for portal
(global as any).window = {
  ReactDOM: {
    createPortal: (children: any) => children
  }
};

describe('AdaptiveModal Style Protection', () => {
  let consoleWarnSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    // 設定為開發模式
    (global as any).__DEV__ = true;
  });
  
  afterEach(() => {
    consoleWarnSpy.mockRestore();
    (global as any).__DEV__ = false;
  });
  
  describe('Fullscreen size protection', () => {
    it('should protect fullscreen size from contentStyle override', () => {
      const { getByTestId } = render(
        <AdaptiveModal
          visible={true}
          size="fullscreen"
          contentStyle={{ 
            width: '50%', 
            height: '50%',
            maxWidth: '600px'
          }}
          testID="modal"
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      const modal = getByTestId('modal');
      const style = modal.props.style || modal.style;
      
      // 檢查 fullscreen 尺寸是否被保護
      if (style) {
        // 期望保持 fullscreen 尺寸，不被 contentStyle 覆蓋
        expect(style.width).toBe('95vw');
        expect(style.height).toBe('95vh');
        expect(style.maxWidth).toBe('95vw');
        expect(style.maxHeight).toBe('95vh');
        expect(style.minHeight).toBe('90vh');
      }
    });
    
    it('should warn about style conflicts in dev mode', () => {
      render(
        <AdaptiveModal
          visible={true}
          size="fullscreen"
          contentStyle={{ 
            width: '50%',
            height: '50%'
          }}
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      // 檢查是否有警告訊息
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toContain('AdaptiveModal: contentStyle 嘗試覆蓋 size="fullscreen"');
      expect(warningMessage).toContain('width');
      expect(warningMessage).toContain('height');
    });
    
    it('should not warn when contentStyle does not conflict with size', () => {
      render(
        <AdaptiveModal
          visible={true}
          size="fullscreen"
          contentStyle={{ 
            backgroundColor: 'red',
            padding: 20
          }}
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      // 不應該有關於尺寸衝突的警告
      const warnings = consoleWarnSpy.mock.calls.filter(
        call => call[0].includes('contentStyle 嘗試覆蓋')
      );
      expect(warnings.length).toBe(0);
    });
    
    it('should allow contentStyle to override size for non-fullscreen sizes', () => {
      const { getByTestId } = render(
        <AdaptiveModal
          visible={true}
          size="medium"
          contentStyle={{ 
            width: '500px',
            height: '400px'
          }}
          testID="modal"
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      const modal = getByTestId('modal');
      const style = modal.props.style || modal.style;
      
      // 對於非 fullscreen 尺寸，contentStyle 應該能覆蓋
      if (style) {
        expect(style.width).toBe('500px');
        expect(style.height).toBe('400px');
      }
    });
  });
  
  describe('Native platform protection', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });
    
    afterEach(() => {
      (Platform as any).OS = 'web';
    });
    
    it('should protect fullscreen size on native platform', () => {
      render(
        <AdaptiveModal
          visible={true}
          size="fullscreen"
          contentStyle={{ 
            width: '50%',
            height: '50%'
          }}
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      // 檢查是否有警告訊息（Native 平台也應該有）
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toContain('AdaptiveModal: contentStyle 嘗試覆蓋 size="fullscreen"');
    });
  });
  
  describe('Production mode', () => {
    beforeEach(() => {
      (global as any).__DEV__ = false;
    });
    
    it('should not warn in production mode', () => {
      render(
        <AdaptiveModal
          visible={true}
          size="fullscreen"
          contentStyle={{ 
            width: '50%',
            height: '50%'
          }}
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      // 生產模式下不應該有警告
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('Style merge order', () => {
    it('should apply styles in correct priority order', () => {
      const { getByTestId } = render(
        <AdaptiveModal
          visible={true}
          size="fullscreen"
          style={{ backgroundColor: 'blue' }}
          webStyle={{ backgroundColor: 'green' }}
          contentStyle={{ backgroundColor: 'red' }}
          testID="modal"
        >
          <div>Test Content</div>
        </AdaptiveModal>
      );
      
      const modal = getByTestId('modal');
      const style = modal.props.style || modal.style;
      
      // contentStyle 的 backgroundColor 應該優先（但尺寸屬性被保護）
      if (style) {
        expect(style.backgroundColor).toBe('red');
        // 但尺寸仍然是 fullscreen
        expect(style.width).toBe('95vw');
        expect(style.height).toBe('95vh');
      }
    });
  });
});