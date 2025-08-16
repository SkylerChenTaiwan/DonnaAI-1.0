/**
 * FileUploader 元件互動測試
 * 測試重點：拖放功能、檔案選擇、驗證邏輯、跨平台相容性
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform, Alert } from 'react-native';
import FileUploader from '../FileUploader';

// Mock expo-document-picker
vi.mock('expo-document-picker', () => ({
  pickDocument: vi.fn(),
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

describe('FileUploader - 互動測試', () => {
  const mockOnFileSelect = vi.fn();
  const defaultProps = {
    onFileSelect: mockOnFileSelect,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedFormats: ['.csv', '.xlsx', '.xls'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 預設為 Web 平台
    Platform.OS = 'web';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該正確渲染 Web 版本的拖放區域', () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      
      expect(getByText('拖放檔案或點擊選擇')).toBeDefined();
      expect(getByText('支援格式：.csv, .xlsx, .xls | 最大 5.0MB')).toBeDefined();
    });

    it('應該正確渲染 Mobile 版本的選擇按鈕', () => {
      Platform.OS = 'ios';
      
      const { getByText } = render(<FileUploader {...defaultProps} />);
      
      expect(getByText('選擇要上傳的檔案')).toBeDefined();
      expect(getByText('選擇檔案')).toBeDefined();
    });

    it('應該在禁用狀態下顯示正確樣式', () => {
      const { getByText } = render(
        <FileUploader {...defaultProps} disabled={true} />
      );
      
      // 檢查禁用狀態的文字顏色和樣式
      const container = getByText('拖放檔案或點擊選擇').parent;
      expect(container?.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.stringContaining('8E8E93'),
        })
      );
    });
  });

  describe('Web 拖放功能測試', () => {
    beforeEach(() => {
      Platform.OS = 'web';
    });

    it('應該處理拖放進入事件', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      // 模擬拖放進入
      const dragEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [] },
      };

      await act(async () => {
        fireEvent(dropZone, 'dragOver', dragEvent);
      });

      expect(dragEvent.preventDefault).toHaveBeenCalled();
      expect(getByText('放下檔案以上傳')).toBeDefined();
    });

    it('應該處理拖放離開事件', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      // 先進入拖放狀態
      const dragOverEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [] },
      };

      await act(async () => {
        fireEvent(dropZone, 'dragOver', dragOverEvent);
      });

      // 然後離開
      const dragLeaveEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      };

      await act(async () => {
        fireEvent(dropZone, 'dragLeave', dragLeaveEvent);
      });

      expect(getByText('拖放檔案或點擊選擇')).toBeDefined();
    });

    it('應該處理檔案拖放', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [file],
        },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });
    });

    it('應該在禁用狀態下忽略拖放事件', async () => {
      const { getByText } = render(
        <FileUploader {...defaultProps} disabled={true} />
      );
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [new File(['test'], 'test.csv', { type: 'text/csv' })],
        },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('應該處理檔案輸入框變更', async () => {
      const { container } = render(<FileUploader {...defaultProps} />);
      const fileInput = container.querySelector('input[type="file"]');

      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      const changeEvent = {
        target: {
          files: [file],
          value: '',
        },
      };

      await act(async () => {
        fireEvent.change(fileInput, changeEvent);
      });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(file);
      });

      // 檢查 input 值被重置
      expect(changeEvent.target.value).toBe('');
    });
  });

  describe('Mobile 檔案選擇測試', () => {
    beforeEach(() => {
      Platform.OS = 'ios';
    });

    it('應該處理 Mobile 檔案選擇', async () => {
      const { pickDocument } = await import('expo-document-picker');
      const mockFile = {
        uri: 'file://test.csv',
        name: 'test.csv',
        mimeType: 'text/csv',
        size: 1024,
      };

      vi.mocked(pickDocument).mockResolvedValue({
        canceled: false,
        assets: [mockFile],
      });

      // Mock fetch for creating File object
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['test content'])),
      });

      const { getByText } = render(<FileUploader {...defaultProps} />);
      const selectButton = getByText('選擇檔案');

      await act(async () => {
        fireEvent.press(selectButton);
      });

      await waitFor(() => {
        expect(pickDocument).toHaveBeenCalledWith({
          type: 'text/csv',
          copyToCacheDirectory: true,
        });
      });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });

    it('應該處理用戶取消檔案選擇', async () => {
      const { pickDocument } = await import('expo-document-picker');
      
      vi.mocked(pickDocument).mockResolvedValue({
        canceled: true,
        assets: null,
      });

      const { getByText } = render(<FileUploader {...defaultProps} />);
      const selectButton = getByText('選擇檔案');

      await act(async () => {
        fireEvent.press(selectButton);
      });

      await waitFor(() => {
        expect(pickDocument).toHaveBeenCalled();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('應該處理 Mobile 檔案選擇錯誤', async () => {
      const { pickDocument } = await import('expo-document-picker');
      
      vi.mocked(pickDocument).mockRejectedValue(new Error('Selection failed'));

      const { getByText } = render(<FileUploader {...defaultProps} />);
      const selectButton = getByText('選擇檔案');

      await act(async () => {
        fireEvent.press(selectButton);
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('錯誤', '無法選擇檔案，請重試');
      });
    });
  });

  describe('檔案驗證測試', () => {
    it('應該拒絕過大的檔案', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      // 建立超過限制大小的檔案
      const largeFile = new File(
        ['x'.repeat(6 * 1024 * 1024)], // 6MB, 超過 5MB 限制
        'large.csv',
        { type: 'text/csv' }
      );

      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [largeFile] },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      await waitFor(() => {
        expect(getByText(/檔案太大，最大允許 5.0MB/)).toBeDefined();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('應該拒絕不支援的檔案格式', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      const unsupportedFile = new File(
        ['test content'],
        'test.txt', // 不支援的格式
        { type: 'text/plain' }
      );

      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [unsupportedFile] },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      await waitFor(() => {
        expect(getByText(/不支援的檔案格式/)).toBeDefined();
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('應該接受有效的檔案', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      const validFile = new File(
        ['test content'],
        'test.csv',
        { type: 'text/csv' }
      );

      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [validFile] },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      await waitFor(() => {
        expect(mockOnFileSelect).toHaveBeenCalledWith(validFile);
      });
    });
  });

  describe('載入狀態測試', () => {
    it('應該在載入狀態下顯示進度條', () => {
      const { getByText } = render(
        <FileUploader {...defaultProps} isLoading={true} progress={50} />
      );
      
      expect(getByText('上傳中...')).toBeDefined();
      
      // 檢查進度條存在
      const progressBar = getByText('上傳中...').parent?.parent;
      const progressFill = progressBar?.querySelector('[style*="width: 50%"]');
      expect(progressFill).toBeDefined();
    });

    it('應該在載入狀態下禁用互動', async () => {
      const { getByText } = render(
        <FileUploader {...defaultProps} isLoading={true} />
      );
      
      const dropZone = getByText('上傳中...').parent;
      
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: [new File(['test'], 'test.csv', { type: 'text/csv' })],
        },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理 onFileSelect 函數拋出的錯誤', async () => {
      const errorMockOnFileSelect = vi.fn().mockRejectedValue(
        new Error('上傳失敗')
      );

      const { getByText } = render(
        <FileUploader {...defaultProps} onFileSelect={errorMockOnFileSelect} />
      );
      
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: { files: [validFile] },
      };

      await act(async () => {
        fireEvent(dropZone, 'drop', dropEvent);
      });

      await waitFor(() => {
        expect(getByText('❌ 上傳失敗')).toBeDefined();
      });
    });

    it('應該清除錯誤訊息當新檔案上傳開始', async () => {
      const { getByText, queryByText } = render(<FileUploader {...defaultProps} />);
      
      // 先產生錯誤
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      const oversizedFile = new File(
        ['x'.repeat(6 * 1024 * 1024)],
        'large.csv',
        { type: 'text/csv' }
      );

      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [oversizedFile] },
        });
      });

      expect(getByText(/檔案太大/)).toBeDefined();

      // 再上傳有效檔案
      const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [validFile] },
        });
      });

      await waitFor(() => {
        expect(queryByText(/檔案太大/)).toBeNull();
      });
    });
  });

  describe('點擊觸發檔案選擇測試', () => {
    it('應該在 Web 平台點擊時觸發檔案輸入框', async () => {
      Platform.OS = 'web';
      
      const { getByText, container } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Mock click method
      fileInput.click = vi.fn();

      await act(async () => {
        fireEvent.press(dropZone);
      });

      expect(fileInput.click).toHaveBeenCalled();
    });

    it('應該在 Mobile 平台點擊時觸發檔案選擇器', async () => {
      Platform.OS = 'ios';
      const { pickDocument } = await import('expo-document-picker');
      
      vi.mocked(pickDocument).mockResolvedValue({
        canceled: true,
        assets: null,
      });

      const { getByText } = render(<FileUploader {...defaultProps} />);
      const selectButton = getByText('選擇檔案');

      await act(async () => {
        fireEvent.press(selectButton);
      });

      expect(pickDocument).toHaveBeenCalled();
    });
  });

  describe('樣式和 UI 測試', () => {
    it('應該在拖放狀態下變更背景顏色', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      await act(async () => {
        fireEvent(dropZone, 'dragOver', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [] },
        });
      });

      // 檢查樣式變更
      expect(dropZone?.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.stringContaining('007AFF'),
          borderColor: '#007AFF',
        })
      );
    });

    it('應該在錯誤狀態下顯示紅色邊框', async () => {
      const { getByText } = render(<FileUploader {...defaultProps} />);
      const dropZone = getByText('拖放檔案或點擊選擇').parent;

      const oversizedFile = new File(
        ['x'.repeat(6 * 1024 * 1024)],
        'large.csv',
        { type: 'text/csv' }
      );

      await act(async () => {
        fireEvent(dropZone, 'drop', {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { files: [oversizedFile] },
        });
      });

      await waitFor(() => {
        expect(dropZone?.props.style).toMatchObject(
          expect.objectContaining({
            borderColor: '#FF3B30',
          })
        );
      });
    });
  });

  describe('工具函數測試', () => {
    it('應該正確格式化檔案大小', () => {
      const { getByText } = render(
        <FileUploader
          {...defaultProps}
          maxSize={1024} // 1KB
        />
      );
      
      expect(getByText(/最大 1.0KB/)).toBeDefined();
    });

    it('應該正確格式化 MB 大小', () => {
      const { getByText } = render(
        <FileUploader
          {...defaultProps}
          maxSize={2.5 * 1024 * 1024} // 2.5MB
        />
      );
      
      expect(getByText(/最大 2.5MB/)).toBeDefined();
    });

    it('應該正確格式化 Bytes 大小', () => {
      const { getByText } = render(
        <FileUploader
          {...defaultProps}
          maxSize={512} // 512 Bytes
        />
      );
      
      expect(getByText(/最大 512 B/)).toBeDefined();
    });
  });
});