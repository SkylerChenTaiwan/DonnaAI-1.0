/**
 * AssignmentPreview 元件單元測試
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AssignmentPreview } from '@/components/import/AssignmentPreview';
import { AssignmentPreview as AssignmentPreviewType } from '@/types/assignment';
import { mockAssignmentPreview, mockCSVData } from '../../utils/assignmentMocks';

// Mock React Native 元件
vi.mock('react-native', () => ({
  View: ({ children, testID }: any) => <div data-testid={testID}>{children}</div>,
  Text: ({ children }: any) => <span>{children}</span>,
  TouchableOpacity: ({ children, onPress, disabled, testID }: any) => (
    <button onClick={onPress} disabled={disabled} data-testid={testID}>
      {children}
    </button>
  ),
  ScrollView: ({ children }: any) => <div>{children}</div>,
  FlatList: ({ data, renderItem, keyExtractor, ListEmptyComponent }: any) => (
    <div>
      {data && data.length > 0 
        ? data.map((item: any, index: number) => (
            <div key={keyExtractor ? keyExtractor(item, index) : index}>
              {renderItem({ item, index })}
            </div>
          ))
        : ListEmptyComponent && <ListEmptyComponent />
      }
    </div>
  ),
  ActivityIndicator: () => <div>Loading...</div>,
  Modal: ({ visible, children }: any) => (
    visible ? <div role="dialog">{children}</div> : null
  ),
  Alert: {
    alert: vi.fn()
  },
  Platform: {
    OS: 'web'
  },
  StyleSheet: {
    create: (styles: any) => styles
  }
}));

// Mock react-native-chart-kit
vi.mock('react-native-chart-kit', () => ({
  PieChart: ({ data, accessor }: any) => (
    <div data-testid="pie-chart">
      {data.map((item: any, index: number) => (
        <div key={index}>
          {item.name}: {item[accessor || 'population']}
        </div>
      ))}
    </div>
  ),
  BarChart: ({ data }: any) => (
    <div data-testid="bar-chart">
      {data.labels && data.labels.join(', ')}
      {data.datasets && data.datasets[0].data.join(', ')}
    </div>
  )
}));

describe('AssignmentPreview', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnAdjust = vi.fn();

  const defaultProps = {
    preview: mockAssignmentPreview,
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    onAdjust: mockOnAdjust,
    loading: false,
    totalRows: mockCSVData.length
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該顯示預覽標題', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      expect(screen.getByText('分配預覽')).toBeDefined();
    });

    it('應該顯示總資料數量', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      expect(screen.getByText(`總資料數：${mockCSVData.length} 筆`)).toBeDefined();
    });

    it('應該顯示每個用戶的分配資訊', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      mockAssignmentPreview.forEach(userPreview => {
        expect(screen.getByText(userPreview.userName)).toBeDefined();
        expect(screen.getByText(`${userPreview.assignedCount} 筆`)).toBeDefined();
        expect(screen.getByText(`${userPreview.workloadPercentage}%`)).toBeDefined();
      });
    });

    it('應該顯示載入狀態', () => {
      render(<AssignmentPreview {...defaultProps} loading={true} />);
      
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('應該顯示空預覽狀態', () => {
      render(<AssignmentPreview {...defaultProps} preview={[]} />);
      
      expect(screen.getByText('尚未產生分配預覽')).toBeDefined();
    });
  });

  describe('統計圖表', () => {
    it('應該顯示圓餅圖', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const pieChart = screen.getByTestId('pie-chart');
      expect(pieChart).toBeDefined();
      
      // 檢查圓餅圖資料
      mockAssignmentPreview.forEach(userPreview => {
        expect(within(pieChart).getByText(`${userPreview.userName}: ${userPreview.assignedCount}`))
          .toBeDefined();
      });
    });

    it('應該顯示長條圖', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeDefined();
      
      // 檢查長條圖標籤
      const labels = mockAssignmentPreview.map(p => p.userName).join(', ');
      expect(within(barChart).getByText(labels)).toBeDefined();
    });

    it('應該根據視圖切換顯示不同圖表', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      // 初始應該顯示列表視圖
      expect(screen.getByTestId('list-view')).toBeDefined();
      
      // 切換到圖表視圖
      const chartViewButton = screen.getByTestId('view-chart-button');
      fireEvent.click(chartViewButton);
      
      expect(screen.getByTestId('chart-view')).toBeDefined();
      
      // 切換回列表視圖
      const listViewButton = screen.getByTestId('view-list-button');
      fireEvent.click(listViewButton);
      
      expect(screen.getByTestId('list-view')).toBeDefined();
    });
  });

  describe('詳細資料展開', () => {
    it('應該允許展開查看詳細分配項目', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const expandButton = screen.getByTestId(`expand-user-${mockAssignmentPreview[0].userId}`);
      fireEvent.click(expandButton);
      
      // 應該顯示分配的詳細項目
      mockAssignmentPreview[0].assignedItems.forEach(item => {
        expect(screen.getByText(item.rowData.name)).toBeDefined();
      });
    });

    it('應該顯示每個項目的信心度', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const expandButton = screen.getByTestId(`expand-user-${mockAssignmentPreview[0].userId}`);
      fireEvent.click(expandButton);
      
      mockAssignmentPreview[0].assignedItems.forEach(item => {
        expect(screen.getByText(`信心度：${item.matchConfidence}%`)).toBeDefined();
      });
    });

    it('應該允許收合詳細資料', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const expandButton = screen.getByTestId(`expand-user-${mockAssignmentPreview[0].userId}`);
      
      // 展開
      fireEvent.click(expandButton);
      expect(screen.getByTestId(`details-${mockAssignmentPreview[0].userId}`)).toBeDefined();
      
      // 收合
      fireEvent.click(expandButton);
      expect(screen.queryByTestId(`details-${mockAssignmentPreview[0].userId}`)).toBeNull();
    });
  });

  describe('調整功能', () => {
    it('應該顯示調整按鈕', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      mockAssignmentPreview.forEach(userPreview => {
        const adjustButton = screen.getByTestId(`adjust-user-${userPreview.userId}`);
        expect(adjustButton).toBeDefined();
      });
    });

    it('應該在點擊調整時觸發回調', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const adjustButton = screen.getByTestId(`adjust-user-${mockAssignmentPreview[0].userId}`);
      fireEvent.click(adjustButton);
      
      expect(mockOnAdjust).toHaveBeenCalledWith(
        mockAssignmentPreview[0].userId,
        mockAssignmentPreview[0]
      );
    });

    it('應該顯示調整數量的輸入框', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const adjustButton = screen.getByTestId(`adjust-user-${mockAssignmentPreview[0].userId}`);
      fireEvent.click(adjustButton);
      
      const adjustModal = screen.getByRole('dialog');
      const input = within(adjustModal).getByTestId('adjust-count-input');
      
      expect(input).toBeDefined();
      expect(input).toHaveValue(String(mockAssignmentPreview[0].assignedCount));
    });

    it('應該驗證調整數量的有效性', async () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const adjustButton = screen.getByTestId(`adjust-user-${mockAssignmentPreview[0].userId}`);
      fireEvent.click(adjustButton);
      
      const adjustModal = screen.getByRole('dialog');
      const input = within(adjustModal).getByTestId('adjust-count-input');
      
      // 輸入無效數量（負數）
      fireEvent.change(input, { target: { value: '-1' } });
      
      const confirmButton = within(adjustModal).getByTestId('confirm-adjust-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('請輸入有效的數量')).toBeDefined();
      });
    });
  });

  describe('確認和取消', () => {
    it('應該顯示確認和取消按鈕', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      expect(screen.getByTestId('confirm-assignment-button')).toBeDefined();
      expect(screen.getByTestId('cancel-assignment-button')).toBeDefined();
    });

    it('應該在點擊確認時觸發回調', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const confirmButton = screen.getByTestId('confirm-assignment-button');
      fireEvent.click(confirmButton);
      
      expect(mockOnConfirm).toHaveBeenCalledWith(mockAssignmentPreview);
    });

    it('應該在點擊取消時觸發回調', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const cancelButton = screen.getByTestId('cancel-assignment-button');
      fireEvent.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('應該在載入時禁用按鈕', () => {
      render(<AssignmentPreview {...defaultProps} loading={true} />);
      
      const confirmButton = screen.getByTestId('confirm-assignment-button');
      const cancelButton = screen.getByTestId('cancel-assignment-button');
      
      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('統計資訊', () => {
    it('應該顯示平均信心度', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const avgConfidence = mockAssignmentPreview.reduce((sum, p) => {
        const itemAvg = p.assignedItems.reduce((s, i) => s + i.matchConfidence, 0) / 
                       p.assignedItems.length;
        return sum + itemAvg;
      }, 0) / mockAssignmentPreview.length;
      
      expect(screen.getByText(`平均信心度：${avgConfidence.toFixed(1)}%`)).toBeDefined();
    });

    it('應該顯示分配覆蓋率', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const totalAssigned = mockAssignmentPreview.reduce((sum, p) => sum + p.assignedCount, 0);
      const coverage = (totalAssigned / mockCSVData.length * 100).toFixed(1);
      
      expect(screen.getByText(`覆蓋率：${coverage}%`)).toBeDefined();
    });

    it('應該顯示用戶工作量分布', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const maxWorkload = Math.max(...mockAssignmentPreview.map(p => p.workloadPercentage));
      const minWorkload = Math.min(...mockAssignmentPreview.map(p => p.workloadPercentage));
      
      expect(screen.getByText(`工作量範圍：${minWorkload}% - ${maxWorkload}%`)).toBeDefined();
    });

    it('應該顯示警告當工作量不平衡', () => {
      const unbalancedPreview = [
        { ...mockAssignmentPreview[0], workloadPercentage: 80 },
        { ...mockAssignmentPreview[1], workloadPercentage: 15 },
        { ...mockAssignmentPreview[2], workloadPercentage: 5 }
      ];
      
      render(<AssignmentPreview {...defaultProps} preview={unbalancedPreview} />);
      
      expect(screen.getByText('⚠️ 工作量分配不平衡')).toBeDefined();
    });
  });

  describe('篩選和排序', () => {
    it('應該允許按工作量排序', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const sortButton = screen.getByTestId('sort-by-workload');
      fireEvent.click(sortButton);
      
      const userList = screen.getAllByTestId(/^user-preview-/);
      const workloads = userList.map(el => {
        const text = within(el).getByTestId('workload-percentage').textContent;
        return parseInt(text?.replace('%', '') || '0');
      });
      
      // 檢查是否降序排列
      for (let i = 1; i < workloads.length; i++) {
        expect(workloads[i - 1]).toBeGreaterThanOrEqual(workloads[i]);
      }
    });

    it('應該允許篩選低信心度項目', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const filterButton = screen.getByTestId('filter-low-confidence');
      fireEvent.click(filterButton);
      
      // 展開所有用戶的詳細資料
      mockAssignmentPreview.forEach(userPreview => {
        const expandButton = screen.getByTestId(`expand-user-${userPreview.userId}`);
        fireEvent.click(expandButton);
      });
      
      // 應該只顯示低信心度的項目（< 80%）
      const items = screen.getAllByTestId(/^assignment-item-/);
      items.forEach(item => {
        const confidence = within(item).getByTestId('item-confidence').textContent;
        const confidenceValue = parseInt(confidence?.replace(/[^0-9]/g, '') || '0');
        expect(confidenceValue).toBeLessThan(80);
      });
    });
  });

  describe('匯出功能', () => {
    it('應該顯示匯出按鈕', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      expect(screen.getByTestId('export-preview-button')).toBeDefined();
    });

    it('應該提供多種匯出格式', () => {
      render(<AssignmentPreview {...defaultProps} />);
      
      const exportButton = screen.getByTestId('export-preview-button');
      fireEvent.click(exportButton);
      
      expect(screen.getByTestId('export-csv')).toBeDefined();
      expect(screen.getByTestId('export-json')).toBeDefined();
      expect(screen.getByTestId('export-pdf')).toBeDefined();
    });

    it('應該觸發匯出功能', async () => {
      const mockExport = vi.fn();
      render(<AssignmentPreview {...defaultProps} onExport={mockExport} />);
      
      const exportButton = screen.getByTestId('export-preview-button');
      fireEvent.click(exportButton);
      
      const exportCSV = screen.getByTestId('export-csv');
      fireEvent.click(exportCSV);
      
      await waitFor(() => {
        expect(mockExport).toHaveBeenCalledWith('csv', mockAssignmentPreview);
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該處理無效的預覽資料', () => {
      const invalidPreview = [
        { ...mockAssignmentPreview[0], userId: undefined } as any,
        { ...mockAssignmentPreview[1], assignedCount: -1 } as any
      ];
      
      render(<AssignmentPreview {...defaultProps} preview={invalidPreview} />);
      
      // 應該優雅地處理並顯示錯誤訊息
      expect(screen.getByText('預覽資料格式錯誤')).toBeDefined();
    });

    it('應該處理確認失敗', async () => {
      const errorOnConfirm = vi.fn().mockRejectedValue(new Error('Confirmation failed'));
      
      render(<AssignmentPreview {...defaultProps} onConfirm={errorOnConfirm} />);
      
      const confirmButton = screen.getByTestId('confirm-assignment-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('確認失敗，請重試')).toBeDefined();
      });
    });
  });
});