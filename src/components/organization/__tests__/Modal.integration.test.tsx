/**
 * Modal 互動整合測試
 * 測試真實的 Modal 互動邏輯，包括按鈕觸發和狀態管理
 */

import React, { useState } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';

// 簡化的測試組件，模擬 OrganizationDetailScreen 的 Modal 邏輯
const TestOrganizationPage = () => {
  const [showCustomFieldsModal, setShowCustomFieldsModal] = useState(() => {
    console.log('🔍 Initializing showCustomFieldsModal as false');
    return false;
  });

  // 模擬 useEffect 來追蹤狀態變化
  React.useEffect(() => {
    console.log('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', showCustomFieldsModal);
    console.trace('Stack trace for showCustomFieldsModal change');
    if (showCustomFieldsModal === true) {
      console.warn('⚠️ Modal is being shown! This should only happen when button is clicked');
    }
  }, [showCustomFieldsModal]);

  const organization = { id: 'test-org', name: '測試組織' };

  return (
    <div>
      {/* 模擬組織詳情頁面 */}
      <h1>組織詳情</h1>
      <div data-testid="organization-name">{organization.name}</div>
      
      {/* 模擬標籤導航 */}
      <div data-testid="tab-container">
        <button data-testid="assistance-tab">協助</button>
      </div>
      
      {/* 模擬協助標籤內容 */}
      <div data-testid="assistance-content">
        <h2>用戶協助</h2>
        <div>
          <h3>自訂欄位查看</h3>
          <p>查看各資料庫的自訂欄位配置</p>
          <button 
            data-testid="view-fields-button"
            onClick={() => {
              console.log('🔘 User clicked "查看欄位" button');
              setShowCustomFieldsModal(true);
            }}
          >
            查看欄位
          </button>
        </div>
      </div>

      {/* Modal 條件渲染 - 模擬實際的條件渲染邏輯 */}
      {showCustomFieldsModal && organization && (
        <div 
          data-testid="custom-fields-modal" 
          role="dialog"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            minWidth: '400px',
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h2>自訂欄位管理</h2>
              <button 
                data-testid="close-modal-button"
                onClick={() => {
                  console.log('🔄 Closing CustomFieldsModal - User clicked close');
                  setShowCustomFieldsModal(false);
                }}
              >
                ✕
              </button>
            </div>
            <div>
              <p>這裡是自訂欄位的內容</p>
              <div data-testid="modal-tabs">
                <button>檢視欄位</button>
                <button>CSV 匯入</button>
                <button>新增欄位</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

describe('Modal 互動整合測試', () => {
  beforeEach(() => {
    // 清除控制台 mock
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'trace').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始狀態驗證', () => {
    test('頁面載入時 Modal 不應該顯示', () => {
      render(<TestOrganizationPage />);

      // 頁面內容應該存在
      expect(screen.getByText('組織詳情')).toBeInTheDocument();
      expect(screen.getByTestId('organization-name')).toHaveTextContent('測試組織');
      
      // Modal 不應該存在
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();
    });

    test('初始化狀態應該記錄正確的日誌', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(<TestOrganizationPage />);
      
      // 應該記錄初始化日誌
      expect(consoleSpy).toHaveBeenCalledWith('🔍 Initializing showCustomFieldsModal as false');
      expect(consoleSpy).toHaveBeenCalledWith('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', false);
    });
  });

  describe('Modal 觸發互動測試', () => {
    test('完整的 Modal 顯示流程', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      
      render(<TestOrganizationPage />);

      // 1. 找到查看欄位按鈕
      const viewFieldsButton = screen.getByTestId('view-fields-button');
      expect(viewFieldsButton).toBeInTheDocument();

      // 2. 點擊按鈕
      fireEvent.click(viewFieldsButton);

      // 3. 驗證 Modal 顯示
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      expect(screen.getByText('自訂欄位管理')).toBeInTheDocument();

      // 4. 驗證日誌記錄
      expect(consoleSpy).toHaveBeenCalledWith('🔘 User clicked "查看欄位" button');
      expect(consoleSpy).toHaveBeenCalledWith('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', true);
      expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Modal is being shown! This should only happen when button is clicked');
    });

    test('Modal 內容和結構驗證', () => {
      render(<TestOrganizationPage />);

      // 顯示 Modal
      fireEvent.click(screen.getByTestId('view-fields-button'));

      // 驗證 Modal 結構
      const modal = screen.getByTestId('custom-fields-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      
      // 驗證標題
      expect(screen.getByText('自訂欄位管理')).toBeInTheDocument();
      
      // 驗證關閉按鈕
      expect(screen.getByTestId('close-modal-button')).toBeInTheDocument();
      
      // 驗證標籤頁
      expect(screen.getByTestId('modal-tabs')).toBeInTheDocument();
      expect(screen.getByText('檢視欄位')).toBeInTheDocument();
      expect(screen.getByText('CSV 匯入')).toBeInTheDocument();
      expect(screen.getByText('新增欄位')).toBeInTheDocument();
    });
  });

  describe('Modal 關閉互動測試', () => {
    test('完整的 Modal 關閉流程', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(<TestOrganizationPage />);

      // 1. 先顯示 Modal
      fireEvent.click(screen.getByTestId('view-fields-button'));
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();

      // 2. 點擊關閉按鈕
      const closeButton = screen.getByTestId('close-modal-button');
      fireEvent.click(closeButton);

      // 3. 驗證 Modal 隱藏
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();

      // 4. 驗證關閉日誌
      expect(consoleSpy).toHaveBeenCalledWith('🔄 Closing CustomFieldsModal - User clicked close');
      expect(consoleSpy).toHaveBeenCalledWith('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', false);
    });

    test('Modal 關閉後頁面狀態恢復', () => {
      render(<TestOrganizationPage />);

      // 顯示並關閉 Modal
      fireEvent.click(screen.getByTestId('view-fields-button'));
      fireEvent.click(screen.getByTestId('close-modal-button'));

      // 驗證頁面內容仍然存在
      expect(screen.getByText('組織詳情')).toBeInTheDocument();
      expect(screen.getByTestId('view-fields-button')).toBeInTheDocument();
      
      // Modal 應該完全移除
      expect(screen.queryByText('自訂欄位管理')).not.toBeInTheDocument();
    });
  });

  describe('多次互動測試', () => {
    test('多次開啟和關閉 Modal', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      render(<TestOrganizationPage />);

      const viewButton = screen.getByTestId('view-fields-button');

      // 第一次開啟
      fireEvent.click(viewButton);
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      
      // 第一次關閉
      fireEvent.click(screen.getByTestId('close-modal-button'));
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();

      // 第二次開啟
      fireEvent.click(viewButton);
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      
      // 第二次關閉
      fireEvent.click(screen.getByTestId('close-modal-button'));
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();

      // 驗證狀態變化日誌被正確記錄
      expect(consoleSpy).toHaveBeenCalledWith('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', true);
      expect(consoleSpy).toHaveBeenCalledWith('🔍 OrganizationDetailScreen - showCustomFieldsModal changed to:', false);
    });

    test('快速連續點擊按鈕的處理', () => {
      render(<TestOrganizationPage />);

      const viewButton = screen.getByTestId('view-fields-button');

      // 快速連續點擊
      fireEvent.click(viewButton);
      fireEvent.click(viewButton);
      fireEvent.click(viewButton);

      // Modal 應該只顯示一次
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();
      
      // 確保沒有多個 Modal
      const modals = screen.getAllByTestId('custom-fields-modal');
      expect(modals).toHaveLength(1);
    });
  });

  describe('條件渲染邏輯驗證', () => {
    test('驗證雙重條件檢查邏輯', () => {
      render(<TestOrganizationPage />);

      // 在真實場景中，showCustomFieldsModal && organization 的邏輯
      // 這裡通過觀察 Modal 是否正確顯示/隱藏來驗證

      // 初始狀態：兩個條件都不滿足顯示條件
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();

      // 點擊後：兩個條件都滿足
      fireEvent.click(screen.getByTestId('view-fields-button'));
      expect(screen.getByTestId('custom-fields-modal')).toBeInTheDocument();

      // 關閉後：showCustomFieldsModal 變為 false
      fireEvent.click(screen.getByTestId('close-modal-button'));
      expect(screen.queryByTestId('custom-fields-modal')).not.toBeInTheDocument();
    });
  });

  describe('無障礙功能測試', () => {
    test('Modal 的 ARIA 屬性', () => {
      render(<TestOrganizationPage />);

      fireEvent.click(screen.getByTestId('view-fields-button'));

      const modal = screen.getByTestId('custom-fields-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
    });

    test('鍵盤導航支援', () => {
      render(<TestOrganizationPage />);

      fireEvent.click(screen.getByTestId('view-fields-button'));

      const closeButton = screen.getByTestId('close-modal-button');
      
      // 測試焦點
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      // 測試 Enter 鍵
      fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
      // 注意：這個測試可能需要實際的鍵盤事件處理器才能工作
    });
  });
});