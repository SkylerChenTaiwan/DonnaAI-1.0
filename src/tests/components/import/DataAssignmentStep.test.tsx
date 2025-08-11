/**
 * DataAssignmentStep 元件單元測試
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { DataAssignmentStep } from '@/components/import/DataAssignmentStep';
import { ImportAssignmentConfig } from '@/types/assignment';
import { 
  mockUsers, 
  mockCSVData, 
  mockAssignmentPreview,
  mockDepartmentRules,
  createMockAssignmentEngine
} from '../../utils/assignmentMocks';

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
  ActivityIndicator: () => <div>Loading...</div>,
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

// Mock 子元件
vi.mock('@/components/import/AssignmentStrategySelector', () => ({
  AssignmentStrategySelector: ({ onSelect, onConfigChange }: any) => (
    <div data-testid="assignment-strategy-selector">
      <button onClick={() => onSelect('round_robin')} data-testid="select-round-robin">
        選擇輪流分配
      </button>
      <button onClick={() => onConfigChange({ strategy: 'round_robin', assigneeIds: ['user1', 'user2'] })} 
              data-testid="config-round-robin">
        配置輪流分配
      </button>
    </div>
  )
}));

vi.mock('@/components/import/AssignmentPreview', () => ({
  AssignmentPreview: ({ onConfirm, onCancel, onAdjust }: any) => (
    <div data-testid="assignment-preview">
      <button onClick={() => onConfirm(mockAssignmentPreview)} data-testid="confirm-preview">
        確認預覽
      </button>
      <button onClick={onCancel} data-testid="cancel-preview">
        取消預覽
      </button>
      <button onClick={() => onAdjust('user1', mockAssignmentPreview[0])} data-testid="adjust-preview">
        調整分配
      </button>
    </div>
  )
}));

vi.mock('@/components/import/UserSelector', () => ({
  UserSelector: ({ onSelect, onMultiSelect, onClose }: any) => (
    <div data-testid="user-selector">
      <button onClick={() => onSelect(mockUsers[0])} data-testid="select-user">
        選擇用戶
      </button>
      <button onClick={() => onMultiSelect(['user1', 'user2'])} data-testid="multi-select-users">
        多選用戶
      </button>
      <button onClick={onClose} data-testid="close-selector">
        關閉
      </button>
    </div>
  )
}));

// Mock AssignmentEngine
vi.mock('@/services/import/AssignmentEngine', () => ({
  AssignmentEngine: vi.fn().mockImplementation(() => createMockAssignmentEngine())
}));

describe('DataAssignmentStep', () => {
  const mockOnComplete = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnSkip = vi.fn();
  const mockOnError = vi.fn();

  const defaultProps = {
    csvData: mockCSVData,
    organizationId: 'test-org',
    onComplete: mockOnComplete,
    onBack: mockOnBack,
    onSkip: mockOnSkip,
    onError: mockOnError,
    users: mockUsers,
    departmentRules: mockDepartmentRules
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該顯示步驟標題', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      expect(screen.getByText('步驟 4：資料分配')).toBeDefined();
    });

    it('應該顯示步驟說明', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      expect(screen.getByText('設定如何將匯入的資料分配給用戶')).toBeDefined();
    });

    it('應該顯示資料統計', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      expect(screen.getByText(`總資料數：${mockCSVData.length} 筆`)).toBeDefined();
      expect(screen.getByText(`可用用戶：${mockUsers.length} 人`)).toBeDefined();
    });

    it('應該顯示策略選擇器', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      expect(screen.getByTestId('assignment-strategy-selector')).toBeDefined();
    });

    it('應該顯示跳過按鈕', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const skipButton = screen.getByTestId('skip-assignment-button');
      expect(skipButton).toBeDefined();
    });
  });

  describe('策略選擇和配置', () => {
    it('應該處理策略選擇', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const selectButton = screen.getByTestId('select-round-robin');
      fireEvent.click(selectButton);
      
      await waitFor(() => {
        expect(screen.getByText('已選擇：輪流分配')).toBeDefined();
      });
    });

    it('應該處理策略配置', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByText('配置已更新')).toBeDefined();
      });
    });

    it('應該在配置完成後自動產生預覽', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
    });
  });

  describe('預覽功能', () => {
    it('應該顯示產生預覽按鈕', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const previewButton = screen.getByTestId('generate-preview-button');
      expect(previewButton).toBeDefined();
    });

    it('應該在點擊後產生預覽', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 先配置
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      // 產生預覽
      const previewButton = screen.getByTestId('generate-preview-button');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
    });

    it('應該顯示預覽載入狀態', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      const previewButton = screen.getByTestId('generate-preview-button');
      fireEvent.click(previewButton);
      
      // 應該短暫顯示載入狀態
      expect(screen.getByText('Loading...')).toBeDefined();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeNull();
      });
    });

    it('應該處理預覽確認', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 配置並產生預覽
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      // 確認預覽
      const confirmButton = screen.getByTestId('confirm-preview');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          assignmentConfig: expect.any(Object),
          assignmentPreview: mockAssignmentPreview
        });
      });
    });

    it('應該處理預覽取消', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 配置並產生預覽
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      // 取消預覽
      const cancelButton = screen.getByTestId('cancel-preview');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('assignment-preview')).toBeNull();
      });
    });

    it('應該處理預覽調整', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 配置並產生預覽
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      // 調整預覽
      const adjustButton = screen.getByTestId('adjust-preview');
      fireEvent.click(adjustButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('adjustment-modal')).toBeDefined();
      });
    });
  });

  describe('執行分配', () => {
    it('應該在確認後執行分配', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 完整流程：配置 -> 預覽 -> 確認
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      const confirmButton = screen.getByTestId('confirm-preview');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('正在執行分配...')).toBeDefined();
      });
      
      await waitFor(() => {
        expect(screen.getByText('分配完成！')).toBeDefined();
      });
    });

    it('應該顯示執行進度', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 配置並確認
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      const confirmButton = screen.getByTestId('confirm-preview');
      fireEvent.click(confirmButton);
      
      // 應該顯示進度條
      await waitFor(() => {
        expect(screen.getByTestId('progress-bar')).toBeDefined();
      });
    });

    it('應該顯示執行結果摘要', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 執行完整流程
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      const confirmButton = screen.getByTestId('confirm-preview');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('分配完成！')).toBeDefined();
        expect(screen.getByTestId('result-summary')).toBeDefined();
      });
    });
  });

  describe('跳過功能', () => {
    it('應該允許跳過分配步驟', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const skipButton = screen.getByTestId('skip-assignment-button');
      fireEvent.click(skipButton);
      
      // 應該顯示確認對話框
      expect(vi.mocked(Alert.alert)).toHaveBeenCalledWith(
        '跳過分配',
        '確定要跳過資料分配嗎？資料將不會被分配給任何用戶。',
        expect.any(Array)
      );
    });

    it('應該在確認後觸發跳過回調', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const skipButton = screen.getByTestId('skip-assignment-button');
      fireEvent.click(skipButton);
      
      // 模擬確認
      const alertCall = vi.mocked(Alert.alert).mock.calls[0];
      const confirmButton = alertCall[2]?.find((btn: any) => btn.text === '確定');
      confirmButton?.onPress();
      
      expect(mockOnSkip).toHaveBeenCalled();
    });
  });

  describe('返回功能', () => {
    it('應該顯示返回按鈕', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const backButton = screen.getByTestId('back-button');
      expect(backButton).toBeDefined();
    });

    it('應該觸發返回回調', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(mockOnBack).toHaveBeenCalled();
    });

    it('應該在有未儲存變更時顯示確認', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 先進行配置（產生未儲存變更）
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByText('配置已更新')).toBeDefined();
      });
      
      // 嘗試返回
      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);
      
      expect(vi.mocked(Alert.alert)).toHaveBeenCalledWith(
        '未儲存的變更',
        '您有未儲存的分配設定，確定要返回嗎？',
        expect.any(Array)
      );
    });
  });

  describe('錯誤處理', () => {
    it('應該處理策略配置錯誤', async () => {
      const mockEngine = createMockAssignmentEngine();
      mockEngine.generatePreview.mockRejectedValueOnce(new Error('Preview failed'));
      
      render(<DataAssignmentStep {...defaultProps} />);
      
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      const previewButton = screen.getByTestId('generate-preview-button');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('無法產生預覽，請檢查配置')).toBeDefined();
        expect(mockOnError).toHaveBeenCalledWith('無法產生預覽，請檢查配置');
      });
    });

    it('應該處理執行分配錯誤', async () => {
      const mockEngine = createMockAssignmentEngine();
      mockEngine.executeAssignment.mockRejectedValueOnce(new Error('Assignment failed'));
      
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 配置並確認
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('assignment-preview')).toBeDefined();
      });
      
      const confirmButton = screen.getByTestId('confirm-preview');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('分配執行失敗')).toBeDefined();
        expect(mockOnError).toHaveBeenCalledWith('分配執行失敗');
      });
    });

    it('應該處理無效的 CSV 資料', () => {
      render(<DataAssignmentStep {...defaultProps} csvData={[]} />);
      
      expect(screen.getByText('沒有資料可供分配')).toBeDefined();
      expect(screen.getByTestId('generate-preview-button')).toBeDisabled();
    });

    it('應該處理無可用用戶', () => {
      render(<DataAssignmentStep {...defaultProps} users={[]} />);
      
      expect(screen.getByText('沒有可用的用戶')).toBeDefined();
      expect(screen.getByTestId('generate-preview-button')).toBeDisabled();
    });
  });

  describe('驗證功能', () => {
    it('應該在配置前驗證', async () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 未選擇策略就嘗試產生預覽
      const previewButton = screen.getByTestId('generate-preview-button');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('請先選擇分配策略')).toBeDefined();
      });
    });

    it('應該驗證配置完整性', async () => {
      const mockEngine = createMockAssignmentEngine();
      mockEngine.validateAssignment.mockResolvedValueOnce({
        isValid: false,
        errors: ['缺少必要的配置項'],
        warnings: [],
        stats: {
          totalData: 5,
          assignedData: 0,
          unassignedData: 5,
          uniqueAssignees: 0
        }
      });
      
      render(<DataAssignmentStep {...defaultProps} />);
      
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      const previewButton = screen.getByTestId('generate-preview-button');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        expect(screen.getByText('配置驗證失敗：缺少必要的配置項')).toBeDefined();
      });
    });
  });

  describe('提示和幫助', () => {
    it('應該顯示幫助按鈕', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const helpButton = screen.getByTestId('help-button');
      expect(helpButton).toBeDefined();
    });

    it('應該顯示幫助內容', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const helpButton = screen.getByTestId('help-button');
      fireEvent.click(helpButton);
      
      expect(screen.getByTestId('help-dialog')).toBeDefined();
      expect(screen.getByText('分配策略說明')).toBeDefined();
    });

    it('應該顯示策略建議', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      // 根據資料量和用戶數提供建議
      const suggestionButton = screen.getByTestId('show-suggestions-button');
      fireEvent.click(suggestionButton);
      
      expect(screen.getByText('建議使用輪流分配策略')).toBeDefined();
    });
  });

  describe('狀態保存和恢復', () => {
    it('應該保存當前配置', async () => {
      const mockOnSaveState = vi.fn();
      render(<DataAssignmentStep {...defaultProps} onSaveState={mockOnSaveState} />);
      
      const configButton = screen.getByTestId('config-round-robin');
      fireEvent.click(configButton);
      
      await waitFor(() => {
        expect(mockOnSaveState).toHaveBeenCalledWith({
          strategy: 'round_robin',
          config: expect.any(Object)
        });
      });
    });

    it('應該恢復已保存的配置', () => {
      const savedState = {
        strategy: 'csv_column' as const,
        config: {
          strategy: 'csv_column' as const,
          csvColumn: 'assignee',
          matchingStrategy: 'smart' as const
        }
      };
      
      render(<DataAssignmentStep {...defaultProps} savedState={savedState} />);
      
      expect(screen.getByText('已選擇：CSV 欄位分配')).toBeDefined();
    });
  });

  describe('無障礙功能', () => {
    it('應該有適當的 ARIA 標籤', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      expect(screen.getByRole('region', { name: '資料分配步驟' })).toBeDefined();
      expect(screen.getByRole('button', { name: '產生預覽' })).toBeDefined();
    });

    it('應該支援鍵盤導航', () => {
      render(<DataAssignmentStep {...defaultProps} />);
      
      const previewButton = screen.getByTestId('generate-preview-button');
      
      // 模擬 Tab 鍵導航
      fireEvent.keyDown(previewButton, { key: 'Tab' });
      
      // 模擬 Enter 鍵觸發
      fireEvent.keyDown(previewButton, { key: 'Enter' });
      
      // 應該觸發相同的行為
      expect(screen.getByText('請先選擇分配策略')).toBeDefined();
    });
  });
});