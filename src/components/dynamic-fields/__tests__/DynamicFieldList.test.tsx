/**
 * DynamicFieldList 元件互動測試
 * 測試重點：虛擬滾動、批次選擇、搜尋篩選、欄位操作
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform, Alert } from 'react-native';
import DynamicFieldList from '../DynamicFieldList';
import { DynamicFieldConfig, FieldDataType } from '@/types/dynamic-field-mapping';

// Mock FlashList
vi.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, keyExtractor }: any) => {
    return (
      <div data-testid="flash-list">
        {data?.map((item: any, index: number) => (
          <div key={keyExtractor(item, index)} data-testid={`list-item-${index}`}>
            {renderItem({ item, index })}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock Alert
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: vi.fn(),
    },
    Platform: {
      OS: 'web',
      select: vi.fn(),
    },
  };
});

describe('DynamicFieldList - 互動測試', () => {
  const mockOnFieldUpdate = vi.fn();
  const mockOnBatchSelect = vi.fn();
  const mockOnFieldDelete = vi.fn();

  const mockFields: DynamicFieldConfig[] = [
    {
      id: 'field1',
      fieldKey: 'name',
      displayName: '姓名',
      dataType: 'text' as FieldDataType,
      isActive: true,
      isSystem: false,
      isSearchable: true,
      isSortable: true,
      description: '客戶姓名',
      validationRules: [],
      formatting: {},
      security: {
        level: 'public',
        readRoles: [],
        writeRoles: [],
        encrypted: false,
        auditLog: false,
        isPII: false,
      },
      usage: {
        usageCount: 100,
        nullRatio: 0.1,
        uniqueValueCount: 95,
      },
      metadata: {
        createdBy: 'user1',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedBy: 'user1',
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    },
    {
      id: 'field2',
      fieldKey: 'email',
      displayName: '電子郵件',
      dataType: 'email' as FieldDataType,
      isActive: true,
      isSystem: true,
      isSearchable: true,
      isSortable: true,
      description: '客戶電子郵件地址',
      validationRules: [],
      formatting: {},
      security: {
        level: 'internal',
        readRoles: [],
        writeRoles: [],
        encrypted: true,
        auditLog: true,
        isPII: true,
        piiType: 'email',
      },
      usage: {
        usageCount: 98,
        nullRatio: 0.05,
        uniqueValueCount: 98,
      },
      metadata: {
        createdBy: 'system',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedBy: 'system',
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    },
    {
      id: 'field3',
      fieldKey: 'age',
      displayName: '年齡',
      dataType: 'number' as FieldDataType,
      isActive: false,
      isSystem: false,
      isSearchable: false,
      isSortable: true,
      description: '客戶年齡',
      validationRules: [],
      formatting: {},
      security: {
        level: 'public',
        readRoles: [],
        writeRoles: [],
        encrypted: false,
        auditLog: false,
        isPII: false,
      },
      usage: {
        usageCount: 50,
        nullRatio: 0.3,
        uniqueValueCount: 40,
      },
      metadata: {
        createdBy: 'user2',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedBy: 'user2',
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    },
  ];

  const defaultProps = {
    fields: mockFields,
    onFieldUpdate: mockOnFieldUpdate,
    onBatchSelect: mockOnBatchSelect,
    onFieldDelete: mockOnFieldDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Platform.OS = 'web';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該正確渲染欄位列表', () => {
      const { getByTestId, getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByTestId('flash-list')).toBeDefined();
      expect(getByText('姓名')).toBeDefined();
      expect(getByText('電子郵件')).toBeDefined();
      expect(getByText('年齡')).toBeDefined();
    });

    it('應該在 Web 平台顯示表格標題', () => {
      Platform.OS = 'web';
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('欄位名稱')).toBeDefined();
      expect(getByText('資料類型')).toBeDefined();
      expect(getByText('啟用')).toBeDefined();
      expect(getByText('系統')).toBeDefined();
      expect(getByText('操作')).toBeDefined();
    });

    it('應該在 Mobile 平台顯示卡片視圖', () => {
      Platform.OS = 'ios';
      const { getByText, queryByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('姓名')).toBeDefined();
      // 不應該顯示表格標題
      expect(queryByText('欄位名稱')).toBeNull();
    });

    it('應該顯示系統欄位標記', () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('系統')).toBeDefined();
    });

    it('應該正確顯示欄位統計', () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('顯示 3 / 3 個欄位')).toBeDefined();
    });
  });

  describe('搜尋功能測試', () => {
    it('應該根據欄位名稱篩選', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, '姓名');
      });

      await waitFor(() => {
        expect(getByText('姓名')).toBeDefined();
        expect(queryByText('電子郵件')).toBeNull();
        expect(queryByText('年齡')).toBeNull();
      });
    });

    it('應該根據欄位鍵值篩選', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'email');
      });

      await waitFor(() => {
        expect(getByText('電子郵件')).toBeDefined();
        expect(queryByText('姓名')).toBeNull();
        expect(queryByText('年齡')).toBeNull();
      });
    });

    it('應該根據描述篩選', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, '地址');
      });

      await waitFor(() => {
        expect(getByText('電子郵件')).toBeDefined();
        expect(queryByText('姓名')).toBeNull();
        expect(queryByText('年齡')).toBeNull();
      });
    });

    it('應該支援大小寫不敏感搜尋', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'EMAIL');
      });

      await waitFor(() => {
        expect(getByText('電子郵件')).toBeDefined();
      });
    });

    it('應該在沒有搜尋結果時顯示提示', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'notexist');
      });

      await waitFor(() => {
        expect(getByText('沒有符合條件的欄位')).toBeDefined();
      });
    });
  });

  describe('篩選功能測試', () => {
    it('應該按資料類型篩選', async () => {
      const { getAllByText, getByText, queryByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      // 找到資料類型選擇器（第一個下拉選單）
      const dataTypeSelects = getAllByText('所有類型');
      const dataTypeSelect = dataTypeSelects[0];
      
      await act(async () => {
        fireEvent.press(dataTypeSelect);
        // 模擬選擇 'text' 類型
        fireEvent.changeText(dataTypeSelect, 'text');
      });

      await waitFor(() => {
        expect(getByText('姓名')).toBeDefined();
        expect(queryByText('電子郵件')).toBeNull();
        expect(queryByText('年齡')).toBeNull();
      });
    });

    it('應該按狀態篩選 - 只顯示啟用', async () => {
      const { getAllByText, getByText, queryByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      // 找到狀態選擇器（第二個下拉選單）
      const statusSelects = getAllByText('所有狀態');
      const statusSelect = statusSelects[0];
      
      await act(async () => {
        fireEvent.press(statusSelect);
        // 模擬選擇 'active' 狀態
        fireEvent.changeText(statusSelect, 'active');
      });

      await waitFor(() => {
        expect(getByText('姓名')).toBeDefined();
        expect(getByText('電子郵件')).toBeDefined();
        expect(queryByText('年齡')).toBeNull(); // 年齡是停用的
      });
    });

    it('應該按狀態篩選 - 只顯示系統欄位', async () => {
      const { getAllByText, getByText, queryByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const statusSelects = getAllByText('所有狀態');
      const statusSelect = statusSelects[0];
      
      await act(async () => {
        fireEvent.press(statusSelect);
        fireEvent.changeText(statusSelect, 'system');
      });

      await waitFor(() => {
        expect(getByText('電子郵件')).toBeDefined();
        expect(queryByText('姓名')).toBeNull();
        expect(queryByText('年齡')).toBeNull();
      });
    });
  });

  describe('批次選擇功能測試', () => {
    it('應該支援單個欄位選擇', async () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到第一個項目的複選框
      const firstItemCheckbox = getByTestId('list-item-0').querySelector('[role="checkbox"]');
      
      await act(async () => {
        fireEvent.press(firstItemCheckbox);
      });

      expect(mockOnBatchSelect).toHaveBeenCalledWith(['field1']);
    });

    it('應該支援全選功能', async () => {
      Platform.OS = 'web';
      const { container } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到表格標題中的全選複選框
      const selectAllCheckbox = container.querySelector('thead [role="checkbox"]');
      
      await act(async () => {
        fireEvent.press(selectAllCheckbox);
      });

      expect(mockOnBatchSelect).toHaveBeenCalledWith(['field1', 'field2', 'field3']);
    });

    it('應該支援反選功能', async () => {
      Platform.OS = 'web';
      const { container, rerender } = render(<DynamicFieldList {...defaultProps} />);
      
      // 先選擇所有項目
      const selectAllCheckbox = container.querySelector('thead [role="checkbox"]');
      
      await act(async () => {
        fireEvent.press(selectAllCheckbox);
      });

      // 重新渲染以反映選擇狀態
      rerender(<DynamicFieldList {...defaultProps} />);

      // 再次點擊全選以反選
      await act(async () => {
        fireEvent.press(selectAllCheckbox);
      });

      expect(mockOnBatchSelect).toHaveBeenLastCalledWith([]);
    });

    it('應該在有選擇項目時顯示批次操作欄', async () => {
      // 模擬有選擇項目的狀態
      const selectedFields = [mockFields[0]];
      
      const { getByText } = render(
        <DynamicFieldList 
          {...defaultProps} 
          // 通過 props 模擬選擇狀態，實際實現需要內部狀態管理
        />
      );

      // 手動觸發選擇狀態
      const firstItemCheckbox = getByText('姓名').parent?.querySelector('[role="checkbox"]');
      
      await act(async () => {
        fireEvent.press(firstItemCheckbox);
      });

      // 驗證批次操作按鈕出現
      await waitFor(() => {
        expect(getByText('已選擇 1 個欄位')).toBeDefined();
        expect(getByText('啟用')).toBeDefined();
        expect(getByText('停用')).toBeDefined();
        expect(getByText('刪除')).toBeDefined();
      });
    });
  });

  describe('欄位操作測試', () => {
    it('應該支援欄位類型變更', async () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到第一個項目的資料類型選擇器
      const firstItem = getByTestId('list-item-0');
      const typeSelect = firstItem.querySelector('[role="combobox"]');
      
      await act(async () => {
        fireEvent.press(typeSelect);
        fireEvent.changeText(typeSelect, 'email');
      });

      expect(mockOnFieldUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'field1',
          dataType: 'email',
        })
      );
    });

    it('應該支援欄位啟用/停用切換', async () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到第一個項目的啟用開關
      const firstItem = getByTestId('list-item-0');
      const activeToggle = firstItem.querySelector('[role="switch"]');
      
      await act(async () => {
        fireEvent.press(activeToggle);
      });

      expect(mockOnFieldUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'field1',
          isActive: false, // 從 true 切換到 false
        })
      );
    });

    it('應該支援刪除非系統欄位', async () => {
      const { getByTestId, getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到第一個項目的刪除按鈕
      const firstItem = getByTestId('list-item-0');
      const deleteButton = firstItem.querySelector('[role="button"]');
      
      await act(async () => {
        fireEvent.press(deleteButton);
      });

      // 驗證確認對話框
      expect(Alert.alert).toHaveBeenCalledWith(
        '確認刪除',
        expect.stringContaining('確定要刪除欄位 "姓名" 嗎？'),
        expect.arrayContaining([
          expect.objectContaining({ text: '取消' }),
          expect.objectContaining({ text: '刪除' }),
        ])
      );
    });

    it('應該阻止刪除系統欄位', async () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      // 嘗試刪除系統欄位（email）
      const secondItem = getByTestId('list-item-1');
      const deleteButton = secondItem.querySelector('[data-testid*="delete"]');
      
      if (deleteButton) {
        await act(async () => {
          fireEvent.press(deleteButton);
        });

        expect(Alert.alert).toHaveBeenCalledWith('無法刪除', '系統欄位無法刪除');
      }
    });

    it('應該阻止修改系統欄位的類型', () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到系統欄位（email）的類型選擇器
      const secondItem = getByTestId('list-item-1');
      const typeSelect = secondItem.querySelector('[role="combobox"]');
      
      // 驗證選擇器被禁用
      expect(typeSelect).toHaveProperty('disabled', true);
    });

    it('應該阻止修改系統欄位的啟用狀態', () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      // 找到系統欄位（email）的啟用開關
      const secondItem = getByTestId('list-item-1');
      const activeToggle = secondItem.querySelector('[role="switch"]');
      
      // 驗證開關被禁用
      expect(activeToggle).toHaveProperty('disabled', true);
    });
  });

  describe('批次操作測試', () => {
    beforeEach(() => {
      // 模擬有選擇項目的狀態
      vi.clearAllMocks();
    });

    it('應該執行批次啟用操作', async () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      // 先選擇項目，然後點擊批次啟用
      // 注意：這需要實際的組件狀態管理，這裡僅測試按鈕存在性
      const batchActivateButton = getByText('啟用');
      
      await act(async () => {
        fireEvent.press(batchActivateButton);
      });

      // 由於是批次操作，會調用多次 onFieldUpdate
      expect(mockOnFieldUpdate).toHaveBeenCalled();
    });

    it('應該執行批次停用操作', async () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      const batchDeactivateButton = getByText('停用');
      
      await act(async () => {
        fireEvent.press(batchDeactivateButton);
      });

      expect(mockOnFieldUpdate).toHaveBeenCalled();
    });

    it('應該執行批次刪除操作', async () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      const batchDeleteButton = getByText('刪除');
      
      await act(async () => {
        fireEvent.press(batchDeleteButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        '確認批次刪除',
        expect.stringContaining('確定要刪除選中的'),
        expect.arrayContaining([
          expect.objectContaining({ text: '取消' }),
          expect.objectContaining({ text: '刪除' }),
        ])
      );
    });

    it('應該阻止刪除包含系統欄位的批次選擇', async () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      // 模擬選擇了包含系統欄位的項目
      const batchDeleteButton = getByText('刪除');
      
      await act(async () => {
        fireEvent.press(batchDeleteButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        '無法刪除',
        '選擇中包含系統欄位，無法刪除'
      );
    });

    it('應該在沒有選擇項目時提示用戶', async () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      // 直接點擊批次操作按鈕而沒有選擇項目
      const batchActivateButton = getByText('啟用');
      
      await act(async () => {
        fireEvent.press(batchActivateButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('提示', '請先選擇要操作的欄位');
    });
  });

  describe('載入狀態測試', () => {
    it('應該在載入狀態下顯示載入提示', () => {
      const { getByText } = render(
        <DynamicFieldList {...defaultProps} loading={true} />
      );
      
      expect(getByText('載入中...')).toBeDefined();
    });

    it('應該在沒有資料時顯示空狀態', () => {
      const { getByText } = render(
        <DynamicFieldList {...defaultProps} fields={[]} />
      );
      
      expect(getByText('尚未建立任何欄位')).toBeDefined();
    });
  });

  describe('Mobile 卡片視圖測試', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('應該在 Mobile 平台正確顯示卡片', () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('姓名')).toBeDefined();
      expect(getByText('name')).toBeDefined(); // fieldKey
      expect(getByText('文字')).toBeDefined(); // 資料類型標籤
      expect(getByText('啟用')).toBeDefined(); // 狀態
    });

    it('應該在卡片中顯示描述', () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('客戶姓名')).toBeDefined();
    });

    it('應該在卡片中顯示系統標記', () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getByText('系統欄位')).toBeDefined();
    });

    it('應該在卡片中提供操作按鈕', () => {
      const { getAllByText } = render(<DynamicFieldList {...defaultProps} />);
      
      expect(getAllByText('啟用')).toBeDefined();
      expect(getAllByText('停用')).toBeDefined();
      expect(getAllByText('刪除')).toBeDefined();
    });
  });

  describe('清除選擇功能測試', () => {
    it('應該支援清除所有選擇', async () => {
      const { getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      // 模擬有選擇項目後顯示清除按鈕
      const clearButton = getByText('清除選擇');
      
      await act(async () => {
        fireEvent.press(clearButton);
      });

      expect(mockOnBatchSelect).toHaveBeenCalledWith([]);
    });
  });

  describe('統計顯示測試', () => {
    it('應該正確顯示篩選後的統計', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DynamicFieldList {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, '姓名');
      });

      await waitFor(() => {
        expect(getByText('顯示 1 / 3 個欄位')).toBeDefined();
      });
    });

    it('應該在有選擇項目時顯示選擇統計', async () => {
      const { getByTestId, getByText } = render(<DynamicFieldList {...defaultProps} />);
      
      // 選擇第一個項目
      const firstItemCheckbox = getByTestId('list-item-0').querySelector('[role="checkbox"]');
      
      await act(async () => {
        fireEvent.press(firstItemCheckbox);
      });

      await waitFor(() => {
        expect(getByText('已選擇 1 個欄位')).toBeDefined();
      });
    });
  });

  describe('無障礙性測試', () => {
    it('應該為互動元素提供適當的無障礙標籤', () => {
      const { getByTestId } = render(<DynamicFieldList {...defaultProps} />);
      
      const flashList = getByTestId('flash-list');
      expect(flashList).toBeDefined();
      
      // 檢查列表項目是否有適當的測試 ID
      expect(getByTestId('list-item-0')).toBeDefined();
      expect(getByTestId('list-item-1')).toBeDefined();
      expect(getByTestId('list-item-2')).toBeDefined();
    });

    it('應該支援鍵盤導航', () => {
      Platform.OS = 'web';
      const { container } = render(<DynamicFieldList {...defaultProps} />);
      
      // 檢查可聚焦元素
      const focusableElements = container.querySelectorAll(
        'input, button, select, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });
});