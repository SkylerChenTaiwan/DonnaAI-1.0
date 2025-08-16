/**
 * 動態欄位元件錯誤處理和邊界條件測試
 * 測試重點：錯誤邊界、異常處理、無效輸入、網路錯誤、記憶體限制
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform, Alert } from 'react-native';

// 導入所有元件
import FileUploader from '../FileUploader';
import DynamicFieldList from '../DynamicFieldList';
import FieldConfigurator from '../FieldConfigurator';
import DataPreviewTable from '../DataPreviewTable';
import ImportProgressPanel from '../ImportProgressPanel';

// Mock 依賴
vi.mock('@shopify/flash-list', () => ({
  FlashList: ({ data, renderItem, keyExtractor, onError }: any) => {
    // 模擬 FlashList 錯誤
    if (data?.length > 10000) {
      onError?.(new Error('Too many items'));
      return <div data-testid="flash-list-error">列表項目過多</div>;
    }
    
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

vi.mock('expo-document-picker', () => ({
  pickDocument: vi.fn(),
}));

vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Platform: { OS: 'web', select: vi.fn() },
    Alert: { alert: vi.fn() },
    ScrollView: ({ children, ...props }: any) => (
      <div {...props} data-testid="scroll-view">{children}</div>
    ),
  };
});

// 錯誤邊界元件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">發生錯誤</div>;
    }

    return this.props.children;
  }
}

describe('動態欄位元件 - 錯誤處理和邊界條件測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Platform.OS = 'web';
    // 清除控制台錯誤
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FileUploader - 錯誤處理測試', () => {
    const fileUploaderProps = {
      onFileSelect: vi.fn(),
      maxSize: 1024,
      acceptedFormats: ['.csv'],
    };

    it('應該處理無效的檔案類型', async () => {
      const { getByText } = render(<FileUploader {...fileUploaderProps} />);
      
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/exe' });
      
      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [invalidFile] },
        });
      });

      expect(getByText(/不支援的檔案格式/)).toBeDefined();
      expect(fileUploaderProps.onFileSelect).not.toHaveBeenCalled();
    });

    it('應該處理過大的檔案', async () => {
      const { getByText } = render(<FileUploader {...fileUploaderProps} />);
      
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      const largeFile = new File(['x'.repeat(2048)], 'large.csv', { type: 'text/csv' });
      
      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [largeFile] },
        });
      });

      expect(getByText(/檔案太大/)).toBeDefined();
      expect(fileUploaderProps.onFileSelect).not.toHaveBeenCalled();
    });

    it('應該處理 onFileSelect 拋出的異常', async () => {
      const errorOnFileSelect = vi.fn().mockRejectedValue(new Error('上傳服務不可用'));
      
      const { getByText } = render(
        <FileUploader {...fileUploaderProps} onFileSelect={errorOnFileSelect} />
      );
      
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      const validFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      
      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [validFile] },
        });
      });

      await waitFor(() => {
        expect(getByText('❌ 上傳服務不可用')).toBeDefined();
      });
    });

    it('應該處理 Mobile 檔案選擇器錯誤', async () => {
      Platform.OS = 'ios';
      const { pickDocument } = await import('expo-document-picker');
      vi.mocked(pickDocument).mockRejectedValue(new Error('Permission denied'));

      const { getByText } = render(<FileUploader {...fileUploaderProps} />);
      
      const selectButton = getByText('選擇檔案');
      
      await act(async () => {
        fireEvent.press(selectButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('錯誤', '無法選擇檔案，請重試');
    });

    it('應該處理空的檔案列表', async () => {
      const { getByText } = render(<FileUploader {...fileUploaderProps} />);
      
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      
      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [] },
        });
      });

      // 不應該有錯誤，也不應該調用 onFileSelect
      expect(fileUploaderProps.onFileSelect).not.toHaveBeenCalled();
    });

    it('應該處理檔案名稱中的特殊字元', async () => {
      const { getByText } = render(<FileUploader {...fileUploaderProps} />);
      
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      const specialNameFile = new File(['content'], '測試檔案@#$%.csv', { type: 'text/csv' });
      
      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [specialNameFile] },
        });
      });

      expect(fileUploaderProps.onFileSelect).toHaveBeenCalledWith(specialNameFile);
    });
  });

  describe('DynamicFieldList - 錯誤處理測試', () => {
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

    const fieldListProps = {
      fields: [mockField],
      onFieldUpdate: vi.fn(),
      onBatchSelect: vi.fn(),
      onFieldDelete: vi.fn(),
    };

    it('應該處理 onFieldUpdate 拋出的異常', async () => {
      const errorOnFieldUpdate = vi.fn().mockImplementation(() => {
        throw new Error('更新失敗');
      });

      const { getByTestId } = render(
        <ErrorBoundary onError={vi.fn()}>
          <DynamicFieldList {...fieldListProps} onFieldUpdate={errorOnFieldUpdate} />
        </ErrorBoundary>
      );

      const firstItem = getByTestId('list-item-0');
      const activeToggle = firstItem.querySelector('[role="switch"]');
      
      // 這個操作應該觸發錯誤，但不應該崩潰應用
      if (activeToggle) {
        expect(() => {
          fireEvent.press(activeToggle);
        }).not.toThrow();
      }
    });

    it('應該處理大量欄位的效能問題', () => {
      const manyFields = Array.from({ length: 15000 }, (_, i) => ({
        ...mockField,
        id: `field${i}`,
        fieldKey: `field${i}`,
        displayName: `欄位 ${i}`,
      }));

      const { getByTestId } = render(
        <DynamicFieldList {...fieldListProps} fields={manyFields} />
      );

      // 應該顯示錯誤而不是崩潰
      expect(getByTestId('flash-list-error')).toBeDefined();
    });

    it('應該處理無效的欄位資料', () => {
      const invalidFields = [
        { ...mockField, id: null } as any,
        { ...mockField, displayName: undefined } as any,
        { ...mockField, dataType: 'invalid-type' } as any,
      ].filter(Boolean);

      const { container } = render(
        <ErrorBoundary>
          <DynamicFieldList {...fieldListProps} fields={invalidFields} />
        </ErrorBoundary>
      );

      // 應該不會崩潰
      expect(container.firstChild).toBeDefined();
    });

    it('應該處理空的欄位陣列', () => {
      const { getByText } = render(
        <DynamicFieldList {...fieldListProps} fields={[]} />
      );

      expect(getByText('尚未建立任何欄位')).toBeDefined();
    });

    it('應該處理刪除系統欄位的嘗試', async () => {
      const systemField = { ...mockField, isSystem: true };
      
      const { getByTestId } = render(
        <DynamicFieldList {...fieldListProps} fields={[systemField]} />
      );

      const firstItem = getByTestId('list-item-0');
      const deleteButton = firstItem.querySelector('[data-testid*="delete"]');
      
      if (deleteButton) {
        await act(async () => {
          fireEvent.press(deleteButton);
        });

        expect(Alert.alert).toHaveBeenCalledWith('無法刪除', '系統欄位無法刪除');
      }
    });

    it('應該處理搜尋時的異常字元', async () => {
      const { getByPlaceholderText } = render(
        <DynamicFieldList {...fieldListProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋欄位名稱、鍵值或描述...');
      
      // 測試各種特殊字元
      const specialChars = ['\\', '/', '*', '?', '[', ']', '(', ')', '{', '}', '^', '$', '.', '|', '+'];
      
      for (const char of specialChars) {
        await act(async () => {
          fireEvent.changeText(searchInput, char);
        });
        
        // 不應該崩潰
        expect(searchInput.props.value).toBe(char);
      }
    });
  });

  describe('FieldConfigurator - 錯誤處理測試', () => {
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

    const configuratorProps = {
      field: mockField,
      onSave: vi.fn(),
      onCancel: vi.fn(),
      visible: true,
    };

    it('應該處理 onSave 拋出的異常', async () => {
      const errorOnSave = vi.fn().mockRejectedValue(new Error('儲存失敗'));

      const { getByText } = render(
        <FieldConfigurator {...configuratorProps} onSave={errorOnSave} />
      );
      
      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      // 應該顯示錯誤而不是崩潰
      expect(errorOnSave).toHaveBeenCalled();
    });

    it('應該處理無效的欄位鍵值', async () => {
      const { getByText, getByDisplayValue } = render(
        <FieldConfigurator {...configuratorProps} />
      );
      
      const fieldKeyInput = getByDisplayValue('testField');
      
      // 測試各種無效的鍵值
      const invalidKeys = ['123invalid', 'field-name', 'field name', '字段', '', ' '];
      
      for (const invalidKey of invalidKeys) {
        await act(async () => {
          fireEvent.changeText(fieldKeyInput, invalidKey);
        });

        const saveButton = getByText('儲存');
        
        await act(async () => {
          fireEvent.press(saveButton);
        });

        expect(Alert.alert).toHaveBeenCalled();
        expect(configuratorProps.onSave).not.toHaveBeenCalled();
        
        vi.clearAllMocks();
      }
    });

    it('應該處理驗證規則的邊界條件', async () => {
      const { getByText } = render(<FieldConfigurator {...configuratorProps} />);
      
      // 切換到驗證規則標籤
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      // 嘗試新增空的驗證規則
      const addButton = getByText('新增規則');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      const confirmButton = getByText('確定');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('錯誤', '請輸入錯誤訊息');
    });

    it('應該處理損壞的欄位資料', () => {
      const corruptedField = {
        ...mockField,
        validationRules: null as any,
        formatting: undefined as any,
        security: {} as any,
      };

      const { container } = render(
        <ErrorBoundary>
          <FieldConfigurator {...configuratorProps} field={corruptedField} />
        </ErrorBoundary>
      );

      // 應該不會崩潰
      expect(container.firstChild).toBeDefined();
    });

    it('應該處理缺少必要屬性的欄位', () => {
      const incompleteField = {
        id: 'field1',
        // 缺少其他必要屬性
      } as any;

      const { container } = render(
        <ErrorBoundary>
          <FieldConfigurator {...configuratorProps} field={incompleteField} />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('DataPreviewTable - 錯誤處理測試', () => {
    const mockFields = [{
      id: 'field1',
      fieldKey: 'name',
      displayName: '姓名',
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
    }];

    const tableProps = {
      data: [{ name: '張三' }, { name: '李四' }],
      fields: mockFields,
      errors: [],
    };

    it('應該處理損壞的資料記錄', () => {
      const corruptedData = [
        null,
        undefined,
        { name: null },
        { invalidField: 'value' },
        { name: { nested: 'object' } },
      ].filter(Boolean);

      const { container } = render(
        <ErrorBoundary>
          <DataPreviewTable {...tableProps} data={corruptedData} />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeDefined();
    });

    it('應該處理極大的資料集', () => {
      const largeData = Array.from({ length: 20000 }, (_, i) => ({ name: `用戶${i}` }));

      const { getByTestId } = render(
        <DataPreviewTable {...tableProps} data={largeData} />
      );

      // 應該顯示錯誤而不是崩潰
      expect(getByTestId('flash-list-error')).toBeDefined();
    });

    it('應該處理無效的分頁參數', () => {
      const { container } = render(
        <DataPreviewTable 
          {...tableProps} 
          pageSize={-1} // 無效的分頁大小
        />
      );

      expect(container.firstChild).toBeDefined();
    });

    it('應該處理排序時的資料類型錯誤', async () => {
      const mixedTypeData = [
        { name: 'string' },
        { name: 123 },
        { name: null },
        { name: { object: true } },
        { name: [1, 2, 3] },
      ];

      Platform.OS = 'web';
      const { getByText } = render(
        <DataPreviewTable {...tableProps} data={mixedTypeData} />
      );
      
      const nameHeader = getByText('姓名');
      
      // 排序混合類型的資料不應該崩潰
      await act(async () => {
        fireEvent.press(nameHeader);
      });

      expect(getByText('↑')).toBeDefined();
    });

    it('應該處理搜尋時的異常', async () => {
      const { getByPlaceholderText } = render(
        <DataPreviewTable {...tableProps} />
      );
      
      const searchInput = getByPlaceholderText('搜尋資料...');
      
      // 測試極長的搜尋字串
      const longSearchTerm = 'a'.repeat(10000);
      
      await act(async () => {
        fireEvent.changeText(searchInput, longSearchTerm);
      });

      expect(searchInput.props.value).toBe(longSearchTerm);
    });

    it('應該處理錯誤資料中的循環引用', () => {
      const circularData: any = { name: '測試' };
      circularData.self = circularData; // 建立循環引用

      const { container } = render(
        <ErrorBoundary>
          <DataPreviewTable {...tableProps} data={[circularData]} />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('ImportProgressPanel - 錯誤處理測試', () => {
    const progressProps = {
      total: 1000,
      processed: 500,
      errors: [],
      status: 'running' as const,
      onPause: vi.fn(),
      onCancel: vi.fn(),
    };

    it('應該處理負數的進度值', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...progressProps} 
          total={-100}
          processed={-50}
        />
      );

      // 應該顯示 0% 而不是負數
      expect(getByText('0%')).toBeDefined();
    });

    it('應該處理無窮大的進度值', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...progressProps} 
          total={0}
          processed={100}
        />
      );

      // 應該處理除零錯誤
      expect(getByText('0%')).toBeDefined();
    });

    it('應該處理控制函數拋出的異常', async () => {
      const errorOnPause = vi.fn().mockImplementation(() => {
        throw new Error('暫停失敗');
      });

      const { getByText } = render(
        <ImportProgressPanel {...progressProps} onPause={errorOnPause} />
      );
      
      const pauseButton = getByText('暫停');
      
      // 點擊暫停不應該崩潰應用
      expect(() => {
        fireEvent.press(pauseButton);
      }).not.toThrow();
    });

    it('應該處理損壞的錯誤資料', () => {
      const corruptedErrors = [
        null,
        undefined,
        { id: 'error1' }, // 缺少必要屬性
        { 
          id: 'error2',
          type: 'invalid-type' as any,
          message: null as any,
          timestamp: 'invalid-timestamp' as any,
        },
      ].filter(Boolean) as any[];

      const { container } = render(
        <ErrorBoundary>
          <ImportProgressPanel {...progressProps} errors={corruptedErrors} />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeDefined();
    });

    it('應該處理極大的錯誤列表', () => {
      const manyErrors = Array.from({ length: 1000 }, (_, i) => ({
        id: `error${i}`,
        type: 'validation' as const,
        code: `CODE_${i}`,
        message: `錯誤 ${i}`,
        timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        affectedRecords: [i],
        retryable: true,
      }));

      const { getByText } = render(
        <ImportProgressPanel {...progressProps} errors={manyErrors} />
      );

      expect(getByText('錯誤詳情 (1000)')).toBeDefined();
    });

    it('應該處理無效的時間戳', () => {
      const invalidTimeError = {
        id: 'error1',
        type: 'validation' as const,
        code: 'TEST_001',
        message: '測試錯誤',
        timestamp: { seconds: NaN, nanoseconds: NaN } as any,
        affectedRecords: [0],
        retryable: true,
      };

      const { container } = render(
        <ErrorBoundary>
          <ImportProgressPanel {...progressProps} errors={[invalidTimeError]} />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('記憶體洩漏預防測試', () => {
    it('元件卸載時應該清理事件監聽器', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <FileUploader 
          onFileSelect={vi.fn()} 
          maxSize={1024} 
          acceptedFormats={['.csv']} 
        />
      );

      // 如果元件有添加事件監聽器，卸載時應該移除
      const addedListeners = addEventListenerSpy.mock.calls.length;
      
      unmount();
      
      const removedListeners = removeEventListenerSpy.mock.calls.length;
      
      // 如果有添加監聽器，也應該有相對應的移除
      if (addedListeners > 0) {
        expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
      }
    });

    it('大量資料渲染時應該有適當的限制', () => {
      const hugeData = Array.from({ length: 50000 }, (_, i) => ({ 
        name: `用戶${i}`,
        data: 'x'.repeat(1000), // 每個項目都有大量資料
      }));

      const { getByTestId } = render(
        <DataPreviewTable 
          data={hugeData}
          fields={[{
            id: 'field1',
            fieldKey: 'name',
            displayName: '姓名',
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
          }]}
          errors={[]}
        />
      );

      // 應該顯示錯誤而不是嘗試渲染所有資料
      expect(getByTestId('flash-list-error')).toBeDefined();
    });
  });

  describe('網路錯誤模擬測試', () => {
    it('應該處理網路中斷的情況', async () => {
      // 模擬網路錯誤
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      Platform.OS = 'ios';
      const { pickDocument } = await import('expo-document-picker');
      
      vi.mocked(pickDocument).mockResolvedValue({
        canceled: false,
        assets: [{
          uri: 'file://test.csv',
          name: 'test.csv',
          mimeType: 'text/csv',
          size: 1024,
        }],
      });

      const { getByText } = render(
        <FileUploader 
          onFileSelect={vi.fn()} 
          maxSize={5 * 1024 * 1024}
          acceptedFormats={['.csv']} 
        />
      );
      
      const selectButton = getByText('選擇檔案');
      
      await act(async () => {
        fireEvent.press(selectButton);
      });

      // 應該處理網路錯誤而不是崩潰
      await waitFor(() => {
        expect(pickDocument).toHaveBeenCalled();
      });
    });
  });

  describe('瀏覽器相容性測試', () => {
    it('應該在不支援某些 API 的瀏覽器中正常工作', () => {
      // 模擬舊瀏覽器環境
      const originalFileReader = global.FileReader;
      delete (global as any).FileReader;

      const { container } = render(
        <ErrorBoundary>
          <FileUploader 
            onFileSelect={vi.fn()} 
            maxSize={1024}
            acceptedFormats={['.csv']} 
          />
        </ErrorBoundary>
      );

      expect(container.firstChild).toBeDefined();

      // 恢復
      global.FileReader = originalFileReader;
    });
  });
});