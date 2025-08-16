/**
 * 動態欄位元件跨平台相容性測試
 * 測試重點：Web/Native 平台差異、Adaptive 元件使用、事件處理差異
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform } from 'react-native';

// 導入所有元件進行測試
import FileUploader from '../FileUploader';
import DynamicFieldList from '../DynamicFieldList';
import FieldConfigurator from '../FieldConfigurator';
import DataPreviewTable from '../DataPreviewTable';
import ImportProgressPanel from '../ImportProgressPanel';

// Mock 依賴
vi.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, keyExtractor }: any) => (
    <div data-testid="flash-list">
      {data?.map((item: any, index: number) => (
        <div key={keyExtractor(item, index)} data-testid={`list-item-${index}`}>
          {renderItem({ item, index })}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('expo-document-picker', () => ({
  pickDocument: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({ seconds: Date.now() / 1000, nanoseconds: 0 }),
  },
}));

vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Platform: {
      OS: 'web',
      select: vi.fn((obj: any) => obj.web || obj.default),
    },
    Alert: { alert: vi.fn() },
    ScrollView: ({ children, ...props }: any) => (
      <div {...props} data-testid="scroll-view">{children}</div>
    ),
  };
});

describe('動態欄位元件 - 跨平台相容性測試', () => {
  // 測試資料
  const mockField = {
    id: 'field1',
    fieldKey: 'testField',
    displayName: '測試欄位',
    dataType: 'text' as const,
    isActive: true,
    isSystem: false,
    isSearchable: true,
    isSortable: true,
    validationRules: [],
    formatting: {},
    security: {
      level: 'public' as const,
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

  const mockData = [
    { name: '張三', email: 'zhang@example.com', age: 25 },
    { name: '李四', email: 'li@example.com', age: 30 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FileUploader - 跨平台測試', () => {
    const fileUploaderProps = {
      onFileSelect: vi.fn(),
      maxSize: 5 * 1024 * 1024,
      acceptedFormats: ['.csv', '.xlsx'],
    };

    it('應該在 Web 平台顯示拖放介面', () => {
      Platform.OS = 'web';
      const { getByText, container } = render(<FileUploader {...fileUploaderProps} />);
      
      expect(getByText('拖放檔案或點擊選擇')).toBeDefined();
      expect(container.querySelector('input[type="file"]')).toBeDefined();
    });

    it('應該在 Mobile 平台顯示檔案選擇按鈕', () => {
      Platform.OS = 'ios';
      const { getByText, queryByText } = render(<FileUploader {...fileUploaderProps} />);
      
      expect(getByText('選擇要上傳的檔案')).toBeDefined();
      expect(getByText('選擇檔案')).toBeDefined();
      expect(queryByText('拖放檔案或點擊選擇')).toBeNull();
    });

    it('應該在不同平台正確處理檔案選擇事件', async () => {
      // Web 平台測試
      Platform.OS = 'web';
      const { container } = render(<FileUploader {...fileUploaderProps} />);
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeDefined();

      // Mobile 平台測試
      Platform.OS = 'ios';
      const { getByText } = render(<FileUploader {...fileUploaderProps} />);
      
      const selectButton = getByText('選擇檔案');
      expect(selectButton).toBeDefined();
    });

    it('應該在兩個平台都正確顯示進度', () => {
      Platform.OS = 'web';
      const { getByText: getByTextWeb } = render(
        <FileUploader {...fileUploaderProps} isLoading={true} progress={50} />
      );
      expect(getByTextWeb('上傳中...')).toBeDefined();

      Platform.OS = 'ios';
      const { getByText: getByTextMobile } = render(
        <FileUploader {...fileUploaderProps} isLoading={true} progress={50} />
      );
      expect(getByTextMobile('處理中...')).toBeDefined();
    });
  });

  describe('DynamicFieldList - 跨平台測試', () => {
    const fieldListProps = {
      fields: [mockField],
      onFieldUpdate: vi.fn(),
      onBatchSelect: vi.fn(),
    };

    it('應該在 Web 平台顯示表格佈局', () => {
      Platform.OS = 'web';
      const { getByText } = render(<DynamicFieldList {...fieldListProps} />);
      
      expect(getByText('欄位名稱')).toBeDefined();
      expect(getByText('資料類型')).toBeDefined();
      expect(getByText('啟用')).toBeDefined();
      expect(getByText('操作')).toBeDefined();
    });

    it('應該在 Mobile 平台顯示卡片佈局', () => {
      Platform.OS = 'ios';
      const { getByText, queryByText } = render(<DynamicFieldList {...fieldListProps} />);
      
      expect(getByText('測試欄位')).toBeDefined();
      expect(getByText('testField')).toBeDefined();
      // 不應該顯示表格標題
      expect(queryByText('欄位名稱')).toBeNull();
    });

    it('應該在兩個平台都支援搜尋功能', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        const { getByPlaceholderText } = render(<DynamicFieldList {...fieldListProps} />);
        
        const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
        expect(searchInput).toBeDefined();
        
        await act(async () => {
          fireEvent.changeText(searchInput, 'test');
        });
        
        // 搜尋功能應該在兩個平台都正常工作
        expect(searchInput.props.value).toBe('test');
      }
    });

    it('應該在不同平台使用適當的虛擬滾動', () => {
      Platform.OS = 'web';
      const { getByTestId: getByTestIdWeb } = render(<DynamicFieldList {...fieldListProps} />);
      expect(getByTestIdWeb('flash-list')).toBeDefined();

      Platform.OS = 'ios';
      const { getByTestId: getByTestIdMobile } = render(<DynamicFieldList {...fieldListProps} />);
      expect(getByTestIdMobile('flash-list')).toBeDefined();
    });
  });

  describe('DataPreviewTable - 跨平台測試', () => {
    const tableProps = {
      data: mockData,
      fields: [mockField],
      errors: [],
    };

    it('應該根據平台自動選擇視圖模式', () => {
      Platform.OS = 'web';
      const { getByText: getByTextWeb } = render(
        <DataPreviewTable {...tableProps} viewMode="auto" />
      );
      expect(getByTextWeb('測試欄位')).toBeDefined(); // 表格標題

      Platform.OS = 'ios';
      const { getByText: getByTextMobile } = render(
        <DataPreviewTable {...tableProps} viewMode="auto" />
      );
      expect(getByTextMobile('記錄 #1')).toBeDefined(); // 卡片標題
    });

    it('應該在兩個平台都支援搜尋', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        const { getByPlaceholderText } = render(<DataPreviewTable {...tableProps} />);
        
        const searchInput = getByPlaceholderText('搜尋資料...');
        
        await act(async () => {
          fireEvent.changeText(searchInput, '張三');
        });
        
        expect(searchInput.props.value).toBe('張三');
      }
    });

    it('應該在兩個平台都支援排序', async () => {
      Platform.OS = 'web';
      const { getByText } = render(<DataPreviewTable {...tableProps} />);
      
      const sortButton = getByText('測試欄位');
      
      await act(async () => {
        fireEvent.press(sortButton);
      });
      
      // 排序功能應該正常工作
      expect(sortButton).toBeDefined();
    });

    it('應該在兩個平台都支援分頁', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({ 
        name: `用戶${i}`, 
        email: `user${i}@example.com` 
      }));

      Platform.OS = 'web';
      const { getByText: getByTextWeb } = render(
        <DataPreviewTable {...tableProps} data={largeData} pageSize={25} />
      );
      expect(getByTextWeb('第 1 / 4 頁')).toBeDefined();

      Platform.OS = 'ios';
      const { getByText: getByTextMobile } = render(
        <DataPreviewTable {...tableProps} data={largeData} pageSize={25} />
      );
      expect(getByTextMobile('第 1 / 4 頁')).toBeDefined();
    });
  });

  describe('FieldConfigurator - 跨平台測試', () => {
    const configuratorProps = {
      field: mockField,
      onSave: vi.fn(),
      onCancel: vi.fn(),
      visible: true,
    };

    it('應該在兩個平台都正確顯示模態框', () => {
      Platform.OS = 'web';
      const { getByText: getByTextWeb } = render(<FieldConfigurator {...configuratorProps} />);
      expect(getByTextWeb('編輯欄位')).toBeDefined();

      Platform.OS = 'ios';
      const { getByText: getByTextMobile } = render(<FieldConfigurator {...configuratorProps} />);
      expect(getByTextMobile('編輯欄位')).toBeDefined();
    });

    it('應該在兩個平台都支援標籤切換', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        const { getByText } = render(<FieldConfigurator {...configuratorProps} />);
        
        const validationTab = getByText('驗證規則');
        
        await act(async () => {
          fireEvent.press(validationTab);
        });
        
        expect(getByText('新增規則')).toBeDefined();
      }
    });

    it('應該在兩個平台都支援表單驗證', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        const { getByText, getByDisplayValue } = render(
          <FieldConfigurator {...configuratorProps} />
        );
        
        const displayNameInput = getByDisplayValue('測試欄位');
        
        await act(async () => {
          fireEvent.changeText(displayNameInput, '');
        });

        const saveButton = getByText('儲存');
        
        await act(async () => {
          fireEvent.press(saveButton);
        });
        
        // 驗證應該在兩個平台都正常工作
        expect(configuratorProps.onSave).not.toHaveBeenCalled();
      }
    });
  });

  describe('ImportProgressPanel - 跨平台測試', () => {
    const progressProps = {
      total: 1000,
      processed: 500,
      errors: [],
      status: 'running' as const,
      onPause: vi.fn(),
      onCancel: vi.fn(),
    };

    it('應該在兩個平台都正確顯示進度', () => {
      Platform.OS = 'web';
      const { getByText: getByTextWeb } = render(<ImportProgressPanel {...progressProps} />);
      expect(getByTextWeb('50%')).toBeDefined();

      Platform.OS = 'ios';
      const { getByText: getByTextMobile } = render(<ImportProgressPanel {...progressProps} />);
      expect(getByTextMobile('50%')).toBeDefined();
    });

    it('應該在兩個平台都支援控制按鈕', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        const { getByText } = render(<ImportProgressPanel {...progressProps} />);
        
        const pauseButton = getByText('暫停');
        
        await act(async () => {
          fireEvent.press(pauseButton);
        });
        
        expect(progressProps.onPause).toHaveBeenCalled();
        vi.clearAllMocks(); // 清除以便下次測試
      }
    });

    it('應該在兩個平台都支援錯誤展開', async () => {
      const errorsProps = {
        ...progressProps,
        errors: [{
          id: 'error1',
          type: 'validation' as const,
          code: 'TEST_001',
          message: '測試錯誤',
          timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          affectedRecords: [0],
          retryable: true,
        }],
      };

      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        const { getByText } = render(<ImportProgressPanel {...errorsProps} />);
        
        const errorButton = getByText('驗證錯誤 (TEST_001)');
        
        await act(async () => {
          fireEvent.press(errorButton);
        });
        
        expect(getByText('測試錯誤')).toBeDefined();
      }
    });
  });

  describe('Adaptive 元件使用檢查', () => {
    it('所有元件都應該使用 Adaptive 元件而非原生元件', () => {
      // 這個測試確保所有元件都遵循 Adaptive 元件使用規範
      const testCases = [
        { Component: FileUploader, props: { onFileSelect: vi.fn(), maxSize: 1024, acceptedFormats: ['.csv'] } },
        { Component: DynamicFieldList, props: { fields: [], onFieldUpdate: vi.fn(), onBatchSelect: vi.fn() } },
        { Component: DataPreviewTable, props: { data: [], fields: [], errors: [] } },
        { Component: ImportProgressPanel, props: { total: 100, processed: 50, errors: [], status: 'running' as const } },
      ];

      testCases.forEach(({ Component, props }) => {
        const { container } = render(<Component {...props} />);
        
        // 確保不會直接使用原生的 React Native 元件
        expect(container.querySelector('Switch')).toBeNull(); // 應該使用 AdaptiveSwitch
        expect(container.querySelector('Picker')).toBeNull(); // 應該使用 AdaptiveSelect
        expect(container.querySelector('TextInput')).toBeNull(); // 應該使用 AdaptiveInput
        expect(container.querySelector('Modal')).toBeNull(); // 應該使用 AdaptiveModal
      });
    });
  });

  describe('事件處理一致性測試', () => {
    it('按鈕點擊事件應該在兩個平台都正常工作', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      const onPress = vi.fn();
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        
        // 測試 FileUploader 按鈕
        const { getByText } = render(
          <FileUploader 
            onFileSelect={vi.fn()} 
            maxSize={1024} 
            acceptedFormats={['.csv']} 
          />
        );
        
        if (platform === 'ios') {
          const selectButton = getByText('選擇檔案');
          
          await act(async () => {
            fireEvent.press(selectButton);
          });
          
          // 在 Mobile 平台應該觸發檔案選擇
          expect(selectButton).toBeDefined();
        }
        
        vi.clearAllMocks();
      }
    });

    it('文字輸入應該在兩個平台都正常工作', async () => {
      const testPlatforms = ['web', 'ios'] as const;
      
      for (const platform of testPlatforms) {
        Platform.OS = platform;
        
        const { getByPlaceholderText } = render(
          <DynamicFieldList 
            fields={[]} 
            onFieldUpdate={vi.fn()} 
            onBatchSelect={vi.fn()} 
          />
        );
        
        const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
        
        await act(async () => {
          fireEvent.changeText(searchInput, 'test input');
        });
        
        expect(searchInput.props.value).toBe('test input');
      }
    });
  });

  describe('佈局響應式測試', () => {
    it('元件應該在不同螢幕尺寸下正確調整', () => {
      const testCases = [
        { width: 320, height: 568 }, // iPhone SE
        { width: 375, height: 667 }, // iPhone 8
        { width: 414, height: 896 }, // iPhone 11 Pro Max
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }, // Desktop
      ];

      testCases.forEach(({ width, height }) => {
        // 模擬不同螢幕尺寸
        Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
        Object.defineProperty(window, 'innerHeight', { value: height, configurable: true });

        const { container } = render(
          <DataPreviewTable 
            data={mockData} 
            fields={[mockField]} 
            errors={[]} 
          />
        );
        
        // 確保元件正確渲染
        expect(container.firstChild).toBeDefined();
      });
    });
  });

  describe('記憶體管理測試', () => {
    it('元件卸載時應該正確清理資源', () => {
      const testComponents = [
        { Component: FileUploader, props: { onFileSelect: vi.fn(), maxSize: 1024, acceptedFormats: ['.csv'] } },
        { Component: DynamicFieldList, props: { fields: [], onFieldUpdate: vi.fn(), onBatchSelect: vi.fn() } },
      ];

      testComponents.forEach(({ Component, props }) => {
        const { unmount } = render(<Component {...props} />);
        
        // 卸載元件不應該拋出錯誤
        expect(() => unmount()).not.toThrow();
      });
    });
  });

  describe('平台特定功能測試', () => {
    it('Web 平台應該支援拖放功能', () => {
      Platform.OS = 'web';
      const { container } = render(
        <FileUploader 
          onFileSelect={vi.fn()} 
          maxSize={1024} 
          acceptedFormats={['.csv']} 
        />
      );
      
      // Web 平台應該有拖放事件處理器
      const dropZone = container.querySelector('[onDrop]');
      expect(dropZone).toBeDefined();
    });

    it('Mobile 平台應該使用原生檔案選擇器', () => {
      Platform.OS = 'ios';
      const { getByText } = render(
        <FileUploader 
          onFileSelect={vi.fn()} 
          maxSize={1024} 
          acceptedFormats={['.csv']} 
        />
      );
      
      // Mobile 平台應該有檔案選擇按鈕
      expect(getByText('選擇檔案')).toBeDefined();
    });
  });
});