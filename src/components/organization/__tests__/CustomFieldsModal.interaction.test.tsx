/**
 * CustomFieldsModal 互動邏輯測試
 * 測試 Modal 的顯示/隱藏邏輯、按鈕點擊響應和狀態管理
 */

import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CustomFieldsModal } from '../CustomFieldsModal';
import { Organization } from '@/types/entities';

// Mock 外部依賴
vi.mock('@/services/dynamic-fields/DynamicFieldService');
vi.mock('@/services/dynamic-fields/CSVAnalysisService');
vi.mock('@/utils/toast');

// Mock 組織資料
const mockOrganization: Organization = {
  id: 'test-org-123',
  name: '測試組織',
  email: 'test@example.com',
  subscriptionPlan: 'pro',
  billingCycle: 'monthly',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  giftedSeats: 0,
  features: {
    allowCustomFields: true,
    allowDataImport: true,
    allowDataExport: true,
    allowAPIAccess: false,
  },
};

describe('CustomFieldsModal 互動邏輯測試', () => {
  const defaultProps = {
    organization: mockOrganization,
    onClose: vi.fn(),
    onFieldsUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal 顯示/隱藏邏輯', () => {
    test('當 visible=false 時，Modal 不應該渲染', () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={false}
        />
      );

      // Modal 不應該存在於 DOM 中
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('自訂欄位管理')).not.toBeInTheDocument();
    });

    test('當 visible=true 時，Modal 應該正確渲染', () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // Modal 標題應該可見
      expect(screen.getByText('自訂欄位管理')).toBeInTheDocument();
      
      // 關閉按鈕應該存在
      expect(screen.getByText('✕')).toBeInTheDocument();
      
      // 預設應該顯示「檢視欄位」標籤
      expect(screen.getByText('檢視欄位')).toBeInTheDocument();
    });

    test('Modal 從隱藏到顯示的狀態轉換', async () => {
      const { rerender } = render(
        <CustomFieldsModal
          {...defaultProps}
          visible={false}
        />
      );

      // 初始狀態：Modal 不可見
      expect(screen.queryByText('自訂欄位管理')).not.toBeInTheDocument();

      // 重新渲染，設置 visible=true
      rerender(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // Modal 應該立即可見
      await waitFor(() => {
        expect(screen.getByText('自訂欄位管理')).toBeInTheDocument();
      });
    });
  });

  describe('按鈕點擊響應測試', () => {
    test('點擊關閉按鈕應該調用 onClose 回調', async () => {
      const onCloseMock = vi.fn();
      
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
          onClose={onCloseMock}
        />
      );

      // 找到關閉按鈕並點擊
      const closeButton = screen.getByText('✕');
      fireEvent.click(closeButton);

      // 應該調用 onClose 回調
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    test('標籤頁切換功能', async () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // 預設應該顯示「檢視欄位」標籤
      expect(screen.getByText('檢視欄位')).toBeInTheDocument();

      // 點擊「CSV 匯入」標籤
      const csvImportTab = screen.getByText('CSV 匯入');
      fireEvent.click(csvImportTab);

      // 應該顯示 CSV 匯入內容
      await waitFor(() => {
        expect(screen.getByText('從 CSV 檔案匯入欄位')).toBeInTheDocument();
      });

      // 點擊「新增欄位」標籤
      const configureTab = screen.getByText('新增欄位');
      fireEvent.click(configureTab);

      // 應該顯示新增欄位內容
      await waitFor(() => {
        expect(screen.getByText('建立新欄位')).toBeInTheDocument();
      });
    });

    test('在新增欄位標籤中點擊建立按鈕', async () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // 切換到新增欄位標籤
      const configureTab = screen.getByText('新增欄位');
      fireEvent.click(configureTab);

      // 等待內容載入
      await waitFor(() => {
        expect(screen.getByText('建立新欄位')).toBeInTheDocument();
      });

      // 點擊建立按鈕
      const createButton = screen.getByText('建立新欄位');
      fireEvent.click(createButton);

      // 應該開啟欄位編輯器（這裡可能需要 mock FieldConfigurator）
      // 具體的測試邏輯會根據 FieldConfigurator 的實作而定
    });
  });

  describe('狀態管理測試', () => {
    test('Modal 應該正確管理內部狀態', async () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // 切換到不同標籤，狀態應該保持
      const csvImportTab = screen.getByText('CSV 匯入');
      fireEvent.click(csvImportTab);

      // 等待標籤切換
      await waitFor(() => {
        expect(screen.getByText('從 CSV 檔案匯入欄位')).toBeInTheDocument();
      });

      // 切換回檢視欄位標籤
      const viewTab = screen.getByText('檢視欄位');
      fireEvent.click(viewTab);

      // 應該正確切換回來
      await waitFor(() => {
        expect(screen.getByText('尚未建立自訂欄位')).toBeInTheDocument();
      });
    });

    test('搜尋功能應該正確工作', async () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // 找到搜尋輸入框
      const searchInput = screen.getByPlaceholderText('搜尋欄位...');
      expect(searchInput).toBeInTheDocument();

      // 輸入搜尋關鍵字
      fireEvent.change(searchInput, { target: { value: '測試' } });

      // 搜尋輸入框的值應該更新
      expect(searchInput).toHaveValue('測試');
    });
  });

  describe('Edge Cases 測試', () => {
    test('沒有組織資料時的處理', () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          organization={null as any}
          visible={true}
        />
      );

      // 應該能正常渲染（不會崩潰）
      expect(screen.getByText('自訂欄位管理')).toBeInTheDocument();
    });

    test('快速連續切換 visible 狀態', async () => {
      const { rerender } = render(
        <CustomFieldsModal
          {...defaultProps}
          visible={false}
        />
      );

      // 快速切換狀態
      rerender(<CustomFieldsModal {...defaultProps} visible={true} />);
      rerender(<CustomFieldsModal {...defaultProps} visible={false} />);
      rerender(<CustomFieldsModal {...defaultProps} visible={true} />);

      // 最終狀態應該是可見的
      await waitFor(() => {
        expect(screen.getByText('自訂欄位管理')).toBeInTheDocument();
      });
    });

    test('雙重點擊關閉按鈕', async () => {
      const onCloseMock = vi.fn();
      
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
          onClose={onCloseMock}
        />
      );

      const closeButton = screen.getByText('✕');
      
      // 快速雙重點擊
      fireEvent.click(closeButton);
      fireEvent.click(closeButton);

      // onClose 應該被調用，但不應該造成錯誤
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  describe('載入狀態測試', () => {
    test('當 isLoading 為 true 時應該顯示載入指示器', () => {
      // 這個測試需要能夠控制內部的 isLoading 狀態
      // 可能需要 mock DynamicFieldService 來觸發載入狀態
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // 如果有載入狀態，應該顯示載入指示器
      // 這裡的具體實作會根據如何觸發載入狀態而定
    });
  });

  describe('無障礙功能測試', () => {
    test('Modal 應該有正確的 ARIA 屬性', () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      // 檢查是否有 dialog role
      const modal = screen.getByRole('dialog', { hidden: true });
      expect(modal).toBeInTheDocument();
    });

    test('按鈕應該可以通過鍵盤導航', () => {
      render(
        <CustomFieldsModal
          {...defaultProps}
          visible={true}
        />
      );

      const closeButton = screen.getByText('✕');
      
      // 模擬 Tab 鍵導航到按鈕
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      // 模擬 Enter 鍵點擊
      fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
      // 具體的鍵盤事件處理需要檢查元件的實作
    });
  });
});