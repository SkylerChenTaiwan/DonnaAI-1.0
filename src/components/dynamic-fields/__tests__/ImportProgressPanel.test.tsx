/**
 * ImportProgressPanel 元件互動測試
 * 測試重點：暫停/恢復、錯誤展開、狀態變化、進度顯示
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform, ScrollView } from 'react-native';
import ImportProgressPanel from '../ImportProgressPanel';
import { ImportError } from '@/types/dynamic-field-mapping';

// Mock ScrollView
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Platform: {
      OS: 'web',
      select: vi.fn(),
    },
    ScrollView: ({ children, ...props }: any) => (
      <div {...props} data-testid="scroll-view">{children}</div>
    ),
  };
});

describe('ImportProgressPanel - 互動測試', () => {
  const mockOnPause = vi.fn();
  const mockOnResume = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnClose = vi.fn();

  const mockErrors: ImportError[] = [
    {
      id: 'error1',
      type: 'validation',
      code: 'VALIDATION_001',
      message: '電子郵件格式不正確',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      affectedRecords: [0, 1, 2],
      retryable: true,
      details: {
        field: 'email',
        expectedFormat: 'user@domain.com',
        receivedValue: 'invalid-email',
      },
    },
    {
      id: 'error2',
      type: 'network',
      code: 'NETWORK_001',
      message: '網路連接超時',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      affectedRecords: [10, 11, 12, 13, 14],
      retryable: true,
      details: {
        timeout: 30000,
        endpoint: '/api/import',
      },
    },
    {
      id: 'error3',
      type: 'storage',
      code: 'STORAGE_001',
      message: '儲存空間不足',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      affectedRecords: [20],
      retryable: false,
      details: {
        availableSpace: '500MB',
        requiredSpace: '1GB',
      },
    },
    {
      id: 'error4',
      type: 'permission',
      code: 'PERMISSION_001',
      message: '沒有權限寫入此欄位',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      affectedRecords: [30, 31],
      retryable: false,
    },
    {
      id: 'error5',
      type: 'transformation',
      code: 'TRANSFORM_001',
      message: '資料轉換失敗',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      affectedRecords: [40],
      retryable: true,
    },
    {
      id: 'error6',
      type: 'unknown',
      code: 'UNKNOWN_001',
      message: '未知錯誤',
      timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      affectedRecords: [50],
      retryable: false,
    },
  ];

  const defaultProps = {
    total: 1000,
    processed: 500,
    errors: mockErrors.slice(0, 2), // 只用前兩個錯誤作為預設
    status: 'running' as const,
    speed: 50,
    estimatedTimeRemaining: 300,
    onPause: mockOnPause,
    onResume: mockOnResume,
    onCancel: mockOnCancel,
    onRetry: mockOnRetry,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Platform.OS = 'web';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該正確渲染進度面板', () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      expect(getByText('匯入進度')).toBeDefined();
      expect(getByText('50%')).toBeDefined();
      expect(getByText('500 / 1,000 筆記錄')).toBeDefined();
    });

    it('應該顯示狀態資訊', () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      expect(getByText('匯入中')).toBeDefined();
      expect(getByText('50/秒')).toBeDefined();
      expect(getByText('5分鐘')).toBeDefined(); // 300秒 = 5分鐘
    });

    it('應該顯示統計資料', () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      // 成功記錄數 = 已處理 - 失敗記錄數
      // 失敗記錄數 = 3 + 5 = 8 (來自前兩個錯誤)
      // 成功記錄數 = 500 - 8 = 492
      expect(getByText('492')).toBeDefined(); // 成功
      expect(getByText('8')).toBeDefined(); // 錯誤
      expect(getByText('500')).toBeDefined(); // 剩餘
    });

    it('應該根據狀態顯示對應的顏色', () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      const percentage = getByText('50%');
      expect(percentage.props.style.color).toBe('#007AFF'); // 運行中的藍色
    });
  });

  describe('進度條測試', () => {
    it('應該正確顯示進度百分比', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} processed={750} />
      );
      
      expect(getByText('75%')).toBeDefined();
    });

    it('應該處理邊界值', () => {
      const { getByText, rerender } = render(
        <ImportProgressPanel {...defaultProps} processed={0} />
      );
      
      expect(getByText('0%')).toBeDefined();

      rerender(<ImportProgressPanel {...defaultProps} processed={1000} />);
      expect(getByText('100%')).toBeDefined();
    });

    it('應該處理超過100%的情況', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} processed={1200} />
      );
      
      expect(getByText('100%')).toBeDefined(); // 應該限制在100%
    });

    it('應該處理負數情況', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} processed={-10} />
      );
      
      expect(getByText('0%')).toBeDefined(); // 應該限制在0%
    });
  });

  describe('狀態控制測試', () => {
    it('應該在運行狀態下顯示暫停按鈕', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="running" />
      );
      
      expect(getByText('暫停')).toBeDefined();
      expect(getByText('取消')).toBeDefined();
    });

    it('應該在暫停狀態下顯示恢復按鈕', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="paused" />
      );
      
      expect(getByText('恢復')).toBeDefined();
      expect(getByText('取消')).toBeDefined();
    });

    it('應該在失敗狀態下顯示重試按鈕', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="failed" />
      );
      
      expect(getByText('重試')).toBeDefined();
    });

    it('應該在完成狀態下顯示關閉按鈕', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="completed" />
      );
      
      expect(getByText('關閉')).toBeDefined();
    });

    it('應該在取消狀態下顯示關閉按鈕', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="cancelled" />
      );
      
      expect(getByText('關閉')).toBeDefined();
    });
  });

  describe('按鈕互動測試', () => {
    it('應該處理暫停按鈕點擊', async () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="running" />
      );
      
      const pauseButton = getByText('暫停');
      
      await act(async () => {
        fireEvent.press(pauseButton);
      });

      expect(mockOnPause).toHaveBeenCalled();
    });

    it('應該處理恢復按鈕點擊', async () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="paused" />
      );
      
      const resumeButton = getByText('恢復');
      
      await act(async () => {
        fireEvent.press(resumeButton);
      });

      expect(mockOnResume).toHaveBeenCalled();
    });

    it('應該處理取消按鈕點擊', async () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="running" />
      );
      
      const cancelButton = getByText('取消');
      
      await act(async () => {
        fireEvent.press(cancelButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('應該處理重試按鈕點擊', async () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="failed" />
      );
      
      const retryButton = getByText('重試');
      
      await act(async () => {
        fireEvent.press(retryButton);
      });

      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('應該處理關閉按鈕點擊', async () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="completed" />
      );
      
      const closeButton = getByText('關閉');
      
      await act(async () => {
        fireEvent.press(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('錯誤詳情測試', () => {
    it('應該顯示錯誤數量', () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      expect(getByText('錯誤詳情 (2)')).toBeDefined();
    });

    it('應該顯示錯誤類型標籤', () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      expect(getByText('驗證錯誤 (VALIDATION_001)')).toBeDefined();
      expect(getByText('網路錯誤 (NETWORK_001)')).toBeDefined();
    });

    it('應該支援錯誤詳情展開/收起', async () => {
      const { getByText, queryByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      // 初始狀態應該是收起的
      expect(queryByText('電子郵件格式不正確')).toBeNull();
      
      // 點擊第一個錯誤展開
      const firstErrorButton = getByText('驗證錯誤 (VALIDATION_001)');
      
      await act(async () => {
        fireEvent.press(firstErrorButton);
      });

      // 現在應該顯示詳細訊息
      expect(getByText('電子郵件格式不正確')).toBeDefined();
      expect(getByText('影響記錄 (3):')).toBeDefined();
      expect(getByText('#1, 2, 3')).toBeDefined();
    });

    it('應該顯示可重試的錯誤標記', async () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      // 展開第一個錯誤
      const firstErrorButton = getByText('驗證錯誤 (VALIDATION_001)');
      
      await act(async () => {
        fireEvent.press(firstErrorButton);
      });

      expect(getByText('✓ 此錯誤可重試')).toBeDefined();
    });

    it('應該顯示錯誤詳細資訊', async () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      const firstErrorButton = getByText('驗證錯誤 (VALIDATION_001)');
      
      await act(async () => {
        fireEvent.press(firstErrorButton);
      });

      // 檢查是否顯示 JSON 詳細資訊
      expect(getByText(/"field"/)).toBeDefined();
      expect(getByText(/"expectedFormat"/)).toBeDefined();
    });

    it('應該正確顯示影響記錄數量', async () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      const secondErrorButton = getByText('網路錯誤 (NETWORK_001)');
      
      await act(async () => {
        fireEvent.press(secondErrorButton);
      });

      expect(getByText('影響記錄 (5):')).toBeDefined();
      expect(getByText('#11, 12, 13, 14, 15')).toBeDefined();
    });

    it('應該處理大量影響記錄的顯示', () => {
      const manyRecordsError: ImportError = {
        ...mockErrors[0],
        affectedRecords: Array.from({ length: 15 }, (_, i) => i),
      };

      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={[manyRecordsError]}
        />
      );
      
      const errorButton = getByText('驗證錯誤 (VALIDATION_001)');
      
      act(() => {
        fireEvent.press(errorButton);
      });

      // 應該只顯示前10個，然後顯示總數
      expect(getByText(/等 15 筆/)).toBeDefined();
    });
  });

  describe('錯誤列表管理測試', () => {
    it('應該支援顯示更多錯誤', async () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={mockErrors} // 使用所有6個錯誤
        />
      );
      
      expect(getByText('錯誤詳情 (6)')).toBeDefined();
      expect(getByText('顯示全部')).toBeDefined();
      
      const showAllButton = getByText('顯示全部');
      
      await act(async () => {
        fireEvent.press(showAllButton);
      });

      expect(getByText('收起')).toBeDefined();
      // 應該顯示所有錯誤類型
      expect(getByText('儲存錯誤 (STORAGE_001)')).toBeDefined();
      expect(getByText('權限錯誤 (PERMISSION_001)')).toBeDefined();
      expect(getByText('轉換錯誤 (TRANSFORM_001)')).toBeDefined();
      expect(getByText('未知錯誤 (UNKNOWN_001)')).toBeDefined();
    });

    it('應該支援收起錯誤列表', async () => {
      const { getByText, queryByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={mockErrors}
        />
      );
      
      // 先展開
      const showAllButton = getByText('顯示全部');
      
      await act(async () => {
        fireEvent.press(showAllButton);
      });

      // 再收起
      const collapseButton = getByText('收起');
      
      await act(async () => {
        fireEvent.press(collapseButton);
      });

      expect(getByText('顯示全部')).toBeDefined();
      expect(queryByText('儲存錯誤 (STORAGE_001)')).toBeNull();
    });

    it('應該在錯誤少於5個時不顯示展開按鈕', () => {
      const { queryByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={mockErrors.slice(0, 3)}
        />
      );
      
      expect(queryByText('顯示全部')).toBeNull();
    });

    it('應該顯示隱藏錯誤數量提示', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={mockErrors}
        />
      );
      
      expect(getByText('還有 1 個錯誤...')).toBeDefined();
    });
  });

  describe('時間格式化測試', () => {
    it('應該正確格式化秒數', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          estimatedTimeRemaining={45}
        />
      );
      
      expect(getByText('45秒')).toBeDefined();
    });

    it('應該正確格式化分鐘', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          estimatedTimeRemaining={120}
        />
      );
      
      expect(getByText('2分鐘')).toBeDefined();
    });

    it('應該正確格式化小時', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          estimatedTimeRemaining={7200}
        />
      );
      
      expect(getByText('2小時')).toBeDefined();
    });
  });

  describe('速度格式化測試', () => {
    it('應該正確格式化每秒記錄數', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          speed={10}
        />
      );
      
      expect(getByText('10/秒')).toBeDefined();
    });

    it('應該正確格式化每分鐘記錄數', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          speed={0.5}
        />
      );
      
      expect(getByText('30/分鐘')).toBeDefined(); // 0.5 * 60 = 30
    });
  });

  describe('完成狀態訊息測試', () => {
    it('應該在完成時顯示成功訊息', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          status="completed"
          processed={1000}
        />
      );
      
      expect(getByText('✅ 匯入完成！')).toBeDefined();
      expect(getByText(/成功處理 992 筆記錄/)).toBeDefined(); // 1000 - 8(錯誤)
      expect(getByText(/8 筆失敗/)).toBeDefined();
    });

    it('應該在失敗時顯示失敗訊息', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          status="failed"
        />
      );
      
      expect(getByText('❌ 匯入失敗')).toBeDefined();
      expect(getByText('已處理 500 / 1,000 筆記錄')).toBeDefined();
    });

    it('應該在取消時顯示取消訊息', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          status="cancelled"
        />
      );
      
      expect(getByText('⏹️ 匯入已取消')).toBeDefined();
      expect(getByText('已處理 500 / 1,000 筆記錄')).toBeDefined();
    });
  });

  describe('無錯誤狀態測試', () => {
    it('應該在沒有錯誤時不顯示錯誤區塊', () => {
      const { queryByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={[]}
        />
      );
      
      expect(queryByText('錯誤詳情')).toBeNull();
    });
  });

  describe('showDetails 屬性測試', () => {
    it('應該在 showDetails=false 時隱藏詳細資訊', () => {
      const { queryByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          showDetails={false}
        />
      );
      
      expect(queryByText('匯入中')).toBeNull(); // 狀態資訊
      expect(queryByText('錯誤詳情')).toBeNull(); // 錯誤詳情
    });

    it('應該在 showDetails=true 時顯示詳細資訊', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          showDetails={true}
        />
      );
      
      expect(getByText('匯入中')).toBeDefined();
      expect(getByText('錯誤詳情 (2)')).toBeDefined();
    });
  });

  describe('邊界條件測試', () => {
    it('應該處理 total 為 0 的情況', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          total={0}
          processed={0}
        />
      );
      
      expect(getByText('0%')).toBeDefined();
      expect(getByText('0 / 0 筆記錄')).toBeDefined();
    });

    it('應該處理沒有回調函數的情況', () => {
      const { queryByText } = render(
        <ImportProgressPanel 
          {...defaultProps}
          onPause={undefined}
          onResume={undefined}
          onCancel={undefined}
          onRetry={undefined}
          onClose={undefined}
        />
      );
      
      // 不應該顯示按鈕
      expect(queryByText('暫停')).toBeNull();
    });

    it('應該處理準備狀態', () => {
      const { getByText } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          status="idle"
        />
      );
      
      expect(getByText('準備中')).toBeDefined();
    });
  });

  describe('滾動行為測試', () => {
    it('應該提供可滾動的錯誤列表', () => {
      const { getByTestId } = render(
        <ImportProgressPanel 
          {...defaultProps} 
          errors={mockErrors}
        />
      );
      
      expect(getByTestId('scroll-view')).toBeDefined();
    });
  });

  describe('無障礙性測試', () => {
    it('應該為按鈕提供適當的標籤', () => {
      const { getByText } = render(
        <ImportProgressPanel {...defaultProps} status="running" />
      );
      
      const pauseButton = getByText('暫停');
      expect(pauseButton).toBeDefined();
      
      const cancelButton = getByText('取消');
      expect(cancelButton).toBeDefined();
    });

    it('應該為錯誤詳情提供展開指示器', async () => {
      const { getByText } = render(<ImportProgressPanel {...defaultProps} />);
      
      // 檢查收起狀態的指示器
      expect(getByText('▶')).toBeDefined();
      
      // 展開後檢查展開狀態的指示器
      const errorButton = getByText('驗證錯誤 (VALIDATION_001)');
      
      await act(async () => {
        fireEvent.press(errorButton);
      });

      expect(getByText('▼')).toBeDefined();
    });
  });
});