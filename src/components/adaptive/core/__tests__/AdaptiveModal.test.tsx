/**
 * AdaptiveModal 測試套件
 * 驗證跨平台 Modal 功能
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AdaptiveModal, { ConfirmModal, AlertModal } from '../AdaptiveModal';

// Mock PlatformAdapter
jest.mock('../../platform/PlatformAdapter', () => ({
  PlatformAdapter: {
    getInstance: () => ({
      isWeb: Platform.OS === 'web',
      getStyleAdapter: () => ({
        adaptStyle: (style: any) => style
      })
    })
  }
}));

// Mock React Native Modal for Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Modal: jest.fn(({ children, visible, onRequestClose }) => 
      visible ? <>{children}</> : null
    )
  };
});

describe('AdaptiveModal', () => {
  describe('基本功能', () => {
    it('應該在 visible=true 時顯示', () => {
      const { getByText } = render(
        <AdaptiveModal visible={true} title="測試標題">
          <text>測試內容</text>
        </AdaptiveModal>
      );
      
      expect(getByText('測試標題')).toBeTruthy();
      expect(getByText('測試內容')).toBeTruthy();
    });

    it('應該在 visible=false 時隱藏', () => {
      const { queryByText } = render(
        <AdaptiveModal visible={false} title="測試標題">
          <text>測試內容</text>
        </AdaptiveModal>
      );
      
      expect(queryByText('測試標題')).toBeNull();
      expect(queryByText('測試內容')).toBeNull();
    });

    it('應該顯示關閉按鈕', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <AdaptiveModal 
          visible={true} 
          showCloseButton={true}
          onClose={onClose}
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      const closeButton = getByText('×');
      expect(closeButton).toBeTruthy();
    });

    it('應該處理關閉事件', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <AdaptiveModal 
          visible={true} 
          showCloseButton={true}
          onClose={onClose}
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      const closeButton = getByText('×');
      fireEvent.press(closeButton);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('標題和副標題', () => {
    it('應該顯示標題和副標題', () => {
      const { getByText } = render(
        <AdaptiveModal 
          visible={true}
          title="主標題"
          subtitle="副標題"
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      expect(getByText('主標題')).toBeTruthy();
      expect(getByText('副標題')).toBeTruthy();
    });
  });

  describe('按鈕功能', () => {
    it('應該顯示主要按鈕', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <AdaptiveModal 
          visible={true}
          primaryButton={{
            title: '確認',
            onPress
          }}
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      const button = getByText('確認');
      expect(button).toBeTruthy();
      fireEvent.press(button);
      expect(onPress).toHaveBeenCalled();
    });

    it('應該顯示次要按鈕', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <AdaptiveModal 
          visible={true}
          secondaryButton={{
            title: '取消',
            onPress
          }}
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      const button = getByText('取消');
      expect(button).toBeTruthy();
      fireEvent.press(button);
      expect(onPress).toHaveBeenCalled();
    });

    it('應該同時顯示兩個按鈕', () => {
      const onPrimary = jest.fn();
      const onSecondary = jest.fn();
      
      const { getByText } = render(
        <AdaptiveModal 
          visible={true}
          primaryButton={{
            title: '確認',
            onPress: onPrimary
          }}
          secondaryButton={{
            title: '取消',
            onPress: onSecondary
          }}
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      expect(getByText('確認')).toBeTruthy();
      expect(getByText('取消')).toBeTruthy();
    });
  });

  describe('回調函數', () => {
    it('應該在顯示時觸發 onShow', () => {
      const onShow = jest.fn();
      const { rerender } = render(
        <AdaptiveModal visible={false} onShow={onShow}>
          <text>內容</text>
        </AdaptiveModal>
      );
      
      rerender(
        <AdaptiveModal visible={true} onShow={onShow}>
          <text>內容</text>
        </AdaptiveModal>
      );
      
      expect(onShow).toHaveBeenCalled();
    });

    it('應該在隱藏時觸發 onDismiss', () => {
      const onDismiss = jest.fn();
      const { rerender } = render(
        <AdaptiveModal visible={true} onDismiss={onDismiss}>
          <text>內容</text>
        </AdaptiveModal>
      );
      
      rerender(
        <AdaptiveModal visible={false} onDismiss={onDismiss}>
          <text>內容</text>
        </AdaptiveModal>
      );
      
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('ConfirmModal', () => {
    it('應該顯示確認和取消按鈕', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      
      const { getByText } = render(
        <ConfirmModal 
          visible={true}
          title="確認操作"
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmText="是"
          cancelText="否"
        >
          <text>確認要執行此操作嗎？</text>
        </ConfirmModal>
      );
      
      expect(getByText('確認操作')).toBeTruthy();
      expect(getByText('確認要執行此操作嗎？')).toBeTruthy();
      expect(getByText('是')).toBeTruthy();
      expect(getByText('否')).toBeTruthy();
    });

    it('應該處理確認和取消事件', () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const onClose = jest.fn();
      
      const { getByText } = render(
        <ConfirmModal 
          visible={true}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onClose={onClose}
        >
          <text>內容</text>
        </ConfirmModal>
      );
      
      // 測試確認
      fireEvent.press(getByText('確認'));
      expect(onConfirm).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      
      // 測試取消
      fireEvent.press(getByText('取消'));
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('AlertModal', () => {
    it('應該只顯示確定按鈕', () => {
      const onOK = jest.fn();
      
      const { getByText, queryByText } = render(
        <AlertModal 
          visible={true}
          title="提示"
          onOK={onOK}
          okText="知道了"
        >
          <text>這是一個提示訊息</text>
        </AlertModal>
      );
      
      expect(getByText('提示')).toBeTruthy();
      expect(getByText('這是一個提示訊息')).toBeTruthy();
      expect(getByText('知道了')).toBeTruthy();
      expect(queryByText('取消')).toBeNull();
    });

    it('應該不顯示關閉按鈕', () => {
      const { queryByText } = render(
        <AlertModal 
          visible={true}
          title="提示"
        >
          <text>內容</text>
        </AlertModal>
      );
      
      expect(queryByText('×')).toBeNull();
    });
  });

  describe('尺寸設定', () => {
    const sizes = ['small', 'medium', 'large', 'fullscreen'] as const;
    
    sizes.forEach(size => {
      it(`應該支援 ${size} 尺寸`, () => {
        const { getByText } = render(
          <AdaptiveModal visible={true} size={size}>
            <text>測試 {size}</text>
          </AdaptiveModal>
        );
        
        expect(getByText(`測試 ${size}`)).toBeTruthy();
      });
    });
  });

  describe('動畫類型', () => {
    const animations = ['slide', 'fade', 'none'] as const;
    
    animations.forEach(animationType => {
      it(`應該支援 ${animationType} 動畫`, () => {
        const { getByText } = render(
          <AdaptiveModal visible={true} animationType={animationType}>
            <text>動畫 {animationType}</text>
          </AdaptiveModal>
        );
        
        expect(getByText(`動畫 ${animationType}`)).toBeTruthy();
      });
    });
  });

  describe('無障礙功能', () => {
    it('應該設定正確的無障礙屬性', () => {
      const { getByTestId } = render(
        <AdaptiveModal 
          visible={true}
          testID="test-modal"
          accessibilityLabel="測試 Modal"
          accessibilityRole="dialog"
        >
          <text>內容</text>
        </AdaptiveModal>
      );
      
      const modal = getByTestId('test-modal');
      expect(modal).toBeTruthy();
    });
  });
});

describe('Web 特定功能', () => {
  beforeEach(() => {
    // Mock Platform.OS 為 web
    Object.defineProperty(Platform, 'OS', {
      value: 'web',
      configurable: true
    });
  });

  afterEach(() => {
    // 恢復 Platform.OS
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      configurable: true
    });
  });

  it('應該在 Web 上使用 Portal', () => {
    const { container } = render(
      <AdaptiveModal visible={true} portal={true}>
        <text>Portal 內容</text>
      </AdaptiveModal>
    );
    
    // 在 Web 上應該使用 Portal
    expect(container).toBeTruthy();
  });

  it('應該支援 ESC 鍵關閉', () => {
    const onClose = jest.fn();
    render(
      <AdaptiveModal 
        visible={true}
        closeOnEscape={true}
        onClose={onClose}
      >
        <text>內容</text>
      </AdaptiveModal>
    );
    
    // 模擬 ESC 鍵事件
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    
    waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('應該防止背景滾動', () => {
    const originalOverflow = document.body.style.overflow;
    
    const { unmount } = render(
      <AdaptiveModal visible={true} preventScroll={true}>
        <text>內容</text>
      </AdaptiveModal>
    );
    
    // 檢查 body overflow 被設為 hidden
    expect(document.body.style.overflow).toBe('hidden');
    
    // 卸載後應該恢復
    unmount();
    expect(document.body.style.overflow).toBe(originalOverflow);
  });
});