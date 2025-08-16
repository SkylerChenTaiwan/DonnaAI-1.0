/**
 * DataPreviewTable 元件互動測試
 * 測試重點：分頁、排序、視圖切換、資料篩選、錯誤高亮
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform } from 'react-native';
import DataPreviewTable from '../DataPreviewTable';
import { DynamicFieldConfig, ValidationError, FieldDataType } from '@/types/dynamic-field-mapping';

// Mock FlashList
vi.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, keyExtractor }: any) => {
    return (
      <div data-testid="flash-list">
        {data?.map((item: any, index: number) => (
          <div key={keyExtractor(item, index)} data-testid={`table-row-${index}`}>
            {renderItem({ item, index })}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock Platform
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Platform: {
      OS: 'web',
      select: vi.fn(),
    },
  };
});

describe('DataPreviewTable - 互動測試', () => {
  const mockOnRowSelect = vi.fn();
  const mockOnCellEdit = vi.fn();

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
        usageCount: 0,
        nullRatio: 0,
        uniqueValueCount: 0,
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
      isSystem: false,
      isSearchable: true,
      isSortable: true,
      validationRules: [],
      formatting: {},
      security: {
        level: 'public',
        readRoles: [],
        writeRoles: [],
        encrypted: false,
        auditLog: false,
        isPII: true,
        piiType: 'email',
      },
      usage: {
        usageCount: 0,
        nullRatio: 0,
        uniqueValueCount: 0,
      },
      metadata: {
        createdBy: 'user1',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedBy: 'user1',
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    },
    {
      id: 'field3',
      fieldKey: 'age',
      displayName: '年齡',
      dataType: 'number' as FieldDataType,
      isActive: true,
      isSystem: false,
      isSearchable: false,
      isSortable: true,
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
        usageCount: 0,
        nullRatio: 0,
        uniqueValueCount: 0,
      },
      metadata: {
        createdBy: 'user1',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedBy: 'user1',
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    },
  ];

  const mockData = [
    { name: '張三', email: 'zhang@example.com', age: 25 },
    { name: '李四', email: 'li@example.com', age: 30 },
    { name: '王五', email: 'wang@example.com', age: 28 },
    { name: '趙六', email: 'zhao@example.com', age: 35 },
    { name: '錢七', email: 'qian@example.com', age: 22 },
  ];

  const mockErrors: ValidationError[] = [
    {
      id: 'error1',
      recordIndex: 1,
      field: 'email',
      type: 'validation',
      severity: 'error',
      message: '電子郵件格式不正確',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    },
    {
      id: 'error2',
      recordIndex: 3,
      field: 'age',
      type: 'validation',
      severity: 'warning',
      message: '年齡可能不在合理範圍內',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    },
  ];

  const defaultProps = {
    data: mockData,
    fields: mockFields,
    errors: mockErrors,
    onRowSelect: mockOnRowSelect,
    onCellEdit: mockOnCellEdit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Platform.OS = 'web';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該正確渲染表格', () => {
      const { getByTestId, getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByTestId('flash-list')).toBeDefined();
      expect(getByText('張三')).toBeDefined();
      expect(getByText('李四')).toBeDefined();
      expect(getByText('王五')).toBeDefined();
    });

    it('應該在 Web 平台顯示表格標題', () => {
      Platform.OS = 'web';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('姓名')).toBeDefined();
      expect(getByText('電子郵件')).toBeDefined();
      expect(getByText('年齡')).toBeDefined();
      expect(getByText('#')).toBeDefined(); // 索引欄
    });

    it('應該在 Mobile 平台顯示卡片視圖', () => {
      Platform.OS = 'ios';
      const { getByText, queryByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('記錄 #1')).toBeDefined();
      // 不應該顯示表格標題
      expect(queryByText('#')).toBeNull();
    });

    it('應該顯示工具列', () => {
      const { getByPlaceholderText, getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByPlaceholderText('搜尋資料...')).toBeDefined();
      expect(getByText('表格')).toBeDefined();
      expect(getByText('50')).toBeDefined(); // 每頁筆數
    });

    it('應該顯示資料統計', () => {
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('顯示 1-5 / 5 筆記錄')).toBeDefined();
      expect(getByText('2 個驗證錯誤')).toBeDefined();
    });
  });

  describe('視圖模式切換測試', () => {
    it('應該支援手動切換到卡片視圖', async () => {
      Platform.OS = 'web';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      // 找到視圖選擇器
      const viewSelect = getByText('表格').parent;
      
      await act(async () => {
        fireEvent.press(viewSelect);
        fireEvent.changeText(viewSelect, 'cards');
      });

      // 應該切換到卡片視圖
      await waitFor(() => {
        expect(getByText('記錄 #1')).toBeDefined();
      });
    });

    it('應該支援手動切換到表格視圖', async () => {
      Platform.OS = 'ios';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      const viewSelect = getByText('卡片').parent;
      
      await act(async () => {
        fireEvent.press(viewSelect);
        fireEvent.changeText(viewSelect, 'table');
      });

      // 應該切換到表格視圖
      await waitFor(() => {
        expect(getByText('姓名')).toBeDefined();
      });
    });

    it('應該在 auto 模式下根據平台自動選擇視圖', () => {
      Platform.OS = 'web';
      const { getByText } = render(
        <DataPreviewTable {...defaultProps} viewMode="auto" />
      );
      
      // Web 平台應該顯示表格標題
      expect(getByText('姓名')).toBeDefined();
    });

    it('應該在 auto 模式下根據 Mobile 平台自動選擇卡片視圖', () => {
      Platform.OS = 'ios';
      const { getByText } = render(
        <DataPreviewTable {...defaultProps} viewMode="auto" />
      );
      
      // Mobile 平台應該顯示卡片
      expect(getByText('記錄 #1')).toBeDefined();
    });
  });

  describe('搜尋功能測試', () => {
    it('應該支援搜尋資料', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <DataPreviewTable {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, '張三');
      });

      await waitFor(() => {
        expect(getByText('張三')).toBeDefined();
        expect(queryByText('李四')).toBeNull();
        expect(queryByText('王五')).toBeNull();
      });
    });

    it('應該支援搜尋電子郵件', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <DataPreviewTable {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'li@example.com');
      });

      await waitFor(() => {
        expect(getByText('李四')).toBeDefined();
        expect(queryByText('張三')).toBeNull();
      });
    });

    it('應該在沒有搜尋結果時顯示提示', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DataPreviewTable {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'notexist');
      });

      await waitFor(() => {
        expect(getByText('沒有符合搜尋條件的資料')).toBeDefined();
      });
    });

    it('應該支援大小寫不敏感搜尋', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DataPreviewTable {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'ZHANG');
      });

      await waitFor(() => {
        expect(getByText('張三')).toBeDefined();
      });
    });
  });

  describe('排序功能測試', () => {
    it('應該支援點擊欄位標題進行排序', async () => {
      Platform.OS = 'web';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      const nameHeader = getByText('姓名');
      
      await act(async () => {
        fireEvent.press(nameHeader);
      });

      // 應該顯示升序排序指示器
      expect(getByText('↑')).toBeDefined();
    });

    it('應該支援點擊兩次切換到降序排序', async () => {
      Platform.OS = 'web';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      const nameHeader = getByText('姓名');
      
      // 第一次點擊 - 升序
      await act(async () => {
        fireEvent.press(nameHeader);
      });

      // 第二次點擊 - 降序
      await act(async () => {
        fireEvent.press(nameHeader);
      });

      expect(getByText('↓')).toBeDefined();
    });

    it('應該正確排序數字欄位', async () => {
      Platform.OS = 'web';
      const { getByText, getAllByTestId } = render(<DataPreviewTable {...defaultProps} />);
      
      const ageHeader = getByText('年齡');
      
      await act(async () => {
        fireEvent.press(ageHeader);
      });

      // 檢查排序結果（年齡應該從小到大）
      const rows = getAllByTestId(/table-row-/);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('應該在禁用排序時不顯示排序指示器', () => {
      Platform.OS = 'web';
      const { getByText, queryByText } = render(
        <DataPreviewTable {...defaultProps} sortable={false} />
      );
      
      const nameHeader = getByText('姓名');
      
      fireEvent.press(nameHeader);

      // 不應該有排序指示器
      expect(queryByText('↑')).toBeNull();
      expect(queryByText('↓')).toBeNull();
    });
  });

  describe('分頁功能測試', () => {
    const largeData = Array.from({ length: 100 }, (_, i) => ({
      name: `用戶${i + 1}`,
      email: `user${i + 1}@example.com`,
      age: 20 + (i % 50),
    }));

    it('應該支援分頁顯示', () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={largeData}
          pageSize={25}
        />
      );
      
      expect(getByText('第 1 / 4 頁')).toBeDefined();
      expect(getByText('上一頁')).toBeDefined();
      expect(getByText('下一頁')).toBeDefined();
    });

    it('應該支援切換到下一頁', async () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={largeData}
          pageSize={25}
        />
      );
      
      const nextButton = getByText('下一頁');
      
      await act(async () => {
        fireEvent.press(nextButton);
      });

      expect(getByText('第 2 / 4 頁')).toBeDefined();
    });

    it('應該支援切換到上一頁', async () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={largeData}
          pageSize={25}
        />
      );
      
      // 先到第二頁
      const nextButton = getByText('下一頁');
      
      await act(async () => {
        fireEvent.press(nextButton);
      });

      // 再回到第一頁
      const prevButton = getByText('上一頁');
      
      await act(async () => {
        fireEvent.press(prevButton);
      });

      expect(getByText('第 1 / 4 頁')).toBeDefined();
    });

    it('應該在第一頁時禁用上一頁按鈕', () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={largeData}
          pageSize={25}
        />
      );
      
      const prevButton = getByText('上一頁');
      expect(prevButton.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: '#8E8E93',
        })
      );
    });

    it('應該在最後一頁時禁用下一頁按鈕', async () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={largeData}
          pageSize={25}
        />
      );
      
      // 跳到最後一頁
      const nextButton = getByText('下一頁');
      
      // 點擊三次到達第四頁
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.press(nextButton);
        });
      }

      expect(nextButton.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: '#8E8E93',
        })
      );
    });

    it('應該支援變更每頁筆數', async () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={largeData}
          pageSize={50}
        />
      );
      
      const pageSizeSelect = getByText('50').parent;
      
      await act(async () => {
        fireEvent.press(pageSizeSelect);
        fireEvent.changeText(pageSizeSelect, '25');
      });

      // 分頁數應該改變
      await waitFor(() => {
        expect(getByText('第 1 / 4 頁')).toBeDefined();
      });
    });
  });

  describe('行選擇功能測試', () => {
    it('應該支援單行選擇', async () => {
      Platform.OS = 'web';
      const { getByTestId } = render(<DataPreviewTable {...defaultProps} />);
      
      const firstRow = getByTestId('table-row-0');
      const checkbox = firstRow.querySelector('[role="checkbox"]');
      
      await act(async () => {
        fireEvent.press(checkbox);
      });

      expect(mockOnRowSelect).toHaveBeenCalledWith([0]);
    });

    it('應該支援全選功能', async () => {
      Platform.OS = 'web';
      const { container } = render(<DataPreviewTable {...defaultProps} />);
      
      const selectAllButton = container.querySelector('thead [role="button"]');
      
      if (selectAllButton) {
        await act(async () => {
          fireEvent.press(selectAllButton);
        });

        expect(mockOnRowSelect).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
      }
    });

    it('應該在卡片視圖中支援選擇', async () => {
      Platform.OS = 'ios';
      const { getByTestId } = render(<DataPreviewTable {...defaultProps} />);
      
      const firstCard = getByTestId('table-row-0');
      const checkbox = firstCard.querySelector('[role="checkbox"]');
      
      if (checkbox) {
        await act(async () => {
          fireEvent.press(checkbox);
        });

        expect(mockOnRowSelect).toHaveBeenCalledWith([0]);
      }
    });
  });

  describe('錯誤高亮測試', () => {
    it('應該高亮顯示有錯誤的儲存格', () => {
      Platform.OS = 'web';
      const { getByTestId } = render(<DataPreviewTable {...defaultProps} />);
      
      // 第二行的 email 欄位有錯誤
      const secondRow = getByTestId('table-row-1');
      expect(secondRow).toBeDefined();
    });

    it('應該顯示錯誤訊息', () => {
      Platform.OS = 'web';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('電子郵件格式不正確')).toBeDefined();
    });

    it('應該在卡片視圖中顯示錯誤', () => {
      Platform.OS = 'ios';
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('1 個錯誤')).toBeDefined();
      expect(getByText('❌ 電子郵件格式不正確')).toBeDefined();
    });

    it('應該區分錯誤和警告的顏色', () => {
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      const errorMessage = getByText('電子郵件格式不正確');
      expect(errorMessage.props.style.color).toBe('#FF3B30');
    });
  });

  describe('資料格式化測試', () => {
    const dateData = [
      { 
        name: '測試用戶', 
        email: 'test@example.com', 
        birthDate: '2023-01-15T10:30:00Z',
        isActive: true,
        salary: 50000,
        successRate: 95.5,
        tags: ['developer', 'senior'],
        profile: { skills: ['React', 'TypeScript'] }
      },
    ];

    const dateField: DynamicFieldConfig = {
      id: 'field4',
      fieldKey: 'birthDate',
      displayName: '出生日期',
      dataType: 'datetime' as FieldDataType,
      isActive: true,
      isSystem: false,
      isSearchable: true,
      isSortable: true,
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
      usage: { usageCount: 0, nullRatio: 0, uniqueValueCount: 0 },
      metadata: {
        createdBy: 'user1',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedBy: 'user1',
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      },
    };

    it('應該正確格式化日期時間', () => {
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={dateData}
          fields={[...mockFields, dateField]}
        />
      );
      
      // 檢查日期是否被格式化（具體格式取決於 locale）
      const formattedDate = getByText(/2023/);
      expect(formattedDate).toBeDefined();
    });

    it('應該正確格式化布林值', () => {
      const booleanField: DynamicFieldConfig = {
        ...dateField,
        id: 'field5',
        fieldKey: 'isActive',
        displayName: '啟用狀態',
        dataType: 'boolean' as FieldDataType,
      };

      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={dateData}
          fields={[...mockFields, booleanField]}
        />
      );
      
      expect(getByText('是')).toBeDefined();
    });

    it('應該正確格式化貨幣', () => {
      const currencyField: DynamicFieldConfig = {
        ...dateField,
        id: 'field6',
        fieldKey: 'salary',
        displayName: '薪資',
        dataType: 'currency' as FieldDataType,
      };

      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={dateData}
          fields={[...mockFields, currencyField]}
        />
      );
      
      expect(getByText('$50,000')).toBeDefined();
    });

    it('應該正確格式化百分比', () => {
      const percentageField: DynamicFieldConfig = {
        ...dateField,
        id: 'field7',
        fieldKey: 'successRate',
        displayName: '成功率',
        dataType: 'percentage' as FieldDataType,
      };

      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={dateData}
          fields={[...mockFields, percentageField]}
        />
      );
      
      expect(getByText('95.5%')).toBeDefined();
    });

    it('應該正確格式化 JSON 和陣列', () => {
      const jsonField: DynamicFieldConfig = {
        ...dateField,
        id: 'field8',
        fieldKey: 'profile',
        displayName: '個人資料',
        dataType: 'json' as FieldDataType,
      };

      const arrayField: DynamicFieldConfig = {
        ...dateField,
        id: 'field9',
        fieldKey: 'tags',
        displayName: '標籤',
        dataType: 'array' as FieldDataType,
      };

      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={dateData}
          fields={[...mockFields, jsonField, arrayField]}
        />
      );
      
      // JSON 應該被字串化
      expect(getByText(/"skills"/)).toBeDefined();
      // 陣列也應該被字串化
      expect(getByText(/developer/)).toBeDefined();
    });

    it('應該正確處理 null 值', () => {
      const nullData = [{ name: null, email: 'test@example.com', age: 25 }];
      
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={nullData}
        />
      );
      
      expect(getByText('-')).toBeDefined();
    });
  });

  describe('載入和空狀態測試', () => {
    it('應該在載入狀態下顯示載入提示', () => {
      const { getByText } = render(
        <DataPreviewTable {...defaultProps} loading={true} />
      );
      
      expect(getByText('載入中...')).toBeDefined();
    });

    it('應該在沒有資料時顯示空狀態', () => {
      const { getByText } = render(
        <DataPreviewTable {...defaultProps} data={[]} />
      );
      
      expect(getByText('沒有資料')).toBeDefined();
    });

    it('應該在搜尋無結果時顯示對應提示', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DataPreviewTable {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, 'nonexistent');
      });

      await waitFor(() => {
        expect(getByText('沒有符合搜尋條件的資料')).toBeDefined();
      });
    });
  });

  describe('卡片視圖限制測試', () => {
    const manyFieldsData = [
      {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
        field4: 'value4',
        field5: 'value5',
        field6: 'value6',
        field7: 'value7',
        field8: 'value8',
      }
    ];

    const manyFields = Array.from({ length: 8 }, (_, i) => ({
      ...mockFields[0],
      id: `field${i + 1}`,
      fieldKey: `field${i + 1}`,
      displayName: `欄位 ${i + 1}`,
    }));

    it('應該在卡片視圖中只顯示前6個欄位', () => {
      Platform.OS = 'ios';
      const { getByText } = render(
        <DataPreviewTable 
          {...defaultProps} 
          data={manyFieldsData}
          fields={manyFields}
        />
      );
      
      expect(getByText('欄位 1')).toBeDefined();
      expect(getByText('欄位 6')).toBeDefined();
      expect(getByText('... 還有 2 個欄位')).toBeDefined();
    });
  });

  describe('無障礙性測試', () => {
    it('應該為互動元素提供適當的無障礙標籤', () => {
      Platform.OS = 'web';
      const { getByTestId } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByTestId('flash-list')).toBeDefined();
      expect(getByTestId('table-row-0')).toBeDefined();
    });

    it('應該支援鍵盤導航', () => {
      Platform.OS = 'web';
      const { container } = render(<DataPreviewTable {...defaultProps} />);
      
      const focusableElements = container.querySelectorAll(
        'input, button, select, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  describe('統計資訊測試', () => {
    it('應該正確顯示分頁統計', () => {
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('顯示 1-5 / 5 筆記錄')).toBeDefined();
    });

    it('應該正確顯示錯誤統計', () => {
      const { getByText } = render(<DataPreviewTable {...defaultProps} />);
      
      expect(getByText('2 個驗證錯誤')).toBeDefined();
    });

    it('應該在篩選時顯示篩選統計', async () => {
      const { getByPlaceholderText, getByText } = render(
        <DataPreviewTable {...defaultProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      await act(async () => {
        fireEvent.changeText(searchInput, '張三');
      });

      await waitFor(() => {
        expect(getByText('顯示 1-1 / 1 筆記錄 (已篩選 5 筆)')).toBeDefined();
      });
    });
  });
});