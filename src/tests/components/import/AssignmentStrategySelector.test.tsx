/**
 * AssignmentStrategySelector 元件單元測試
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { AssignmentStrategySelector } from '@/components/import/AssignmentStrategySelector';
import { AssignmentStrategy, ImportAssignmentConfig } from '@/types/assignment';
import { mockUsers, mockDepartmentRules } from '../../utils/assignmentMocks';

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
  TextInput: ({ value, onChangeText, placeholder, testID, multiline, numberOfLines }: any) => 
    multiline ? (
      <textarea
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        data-testid={testID}
        rows={numberOfLines || 4}
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        placeholder={placeholder}
        data-testid={testID}
      />
    ),
  Switch: ({ value, onValueChange, testID }: any) => (
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onValueChange(e.target.checked)}
      data-testid={testID}
    />
  ),
  Picker: ({ selectedValue, onValueChange, children, testID }: any) => (
    <select
      value={selectedValue}
      onChange={(e) => onValueChange(e.target.value)}
      data-testid={testID}
    >
      {children}
    </select>
  ),
  'Picker.Item': ({ label, value }: any) => (
    <option value={value}>{label}</option>
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

describe('AssignmentStrategySelector', () => {
  const mockOnSelect = vi.fn();
  const mockOnConfigChange = vi.fn();

  const defaultProps = {
    selectedStrategy: 'single_user' as AssignmentStrategy,
    onSelect: mockOnSelect,
    onConfigChange: mockOnConfigChange,
    users: mockUsers,
    csvColumns: ['name', 'email', 'assignee', 'department'],
    departmentRules: mockDepartmentRules
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('應該顯示所有策略選項', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      expect(screen.getByTestId('strategy-single_user')).toBeDefined();
      expect(screen.getByTestId('strategy-round_robin')).toBeDefined();
      expect(screen.getByTestId('strategy-csv_column')).toBeDefined();
      expect(screen.getByTestId('strategy-department_rule')).toBeDefined();
      expect(screen.getByTestId('strategy-manual_mapping')).toBeDefined();
    });

    it('應該顯示策略說明', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      expect(screen.getByText('分配給單一用戶')).toBeDefined();
      expect(screen.getByText('輪流分配給多個用戶')).toBeDefined();
      expect(screen.getByText('根據 CSV 欄位分配')).toBeDefined();
      expect(screen.getByText('根據部門規則分配')).toBeDefined();
      expect(screen.getByText('手動對應分配')).toBeDefined();
    });

    it('應該高亮顯示選中的策略', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const selectedStrategy = screen.getByTestId('strategy-single_user');
      expect(selectedStrategy.className).toContain('selected');
    });

    it('應該顯示策略圖示', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      expect(screen.getByTestId('icon-single_user')).toBeDefined();
      expect(screen.getByTestId('icon-round_robin')).toBeDefined();
      expect(screen.getByTestId('icon-csv_column')).toBeDefined();
      expect(screen.getByTestId('icon-department_rule')).toBeDefined();
      expect(screen.getByTestId('icon-manual_mapping')).toBeDefined();
    });
  });

  describe('策略選擇', () => {
    it('應該在點擊時切換策略', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const roundRobinStrategy = screen.getByTestId('strategy-round_robin');
      fireEvent.click(roundRobinStrategy);
      
      expect(mockOnSelect).toHaveBeenCalledWith('round_robin');
    });

    it('應該顯示對應的配置選項', () => {
      const { rerender } = render(<AssignmentStrategySelector {...defaultProps} />);
      
      // single_user 策略
      expect(screen.getByTestId('config-single_user')).toBeDefined();
      
      // 切換到 round_robin
      rerender(
        <AssignmentStrategySelector 
          {...defaultProps} 
          selectedStrategy="round_robin" 
        />
      );
      expect(screen.getByTestId('config-round_robin')).toBeDefined();
      
      // 切換到 csv_column
      rerender(
        <AssignmentStrategySelector 
          {...defaultProps} 
          selectedStrategy="csv_column" 
        />
      );
      expect(screen.getByTestId('config-csv_column')).toBeDefined();
    });
  });

  describe('single_user 配置', () => {
    it('應該顯示用戶選擇下拉選單', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const userSelect = screen.getByTestId('single-user-select');
      expect(userSelect).toBeDefined();
      
      // 檢查選項
      mockUsers.forEach(user => {
        expect(screen.getByText(`${user.name} (${user.email})`)).toBeDefined();
      });
    });

    it('應該觸發配置變更', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const userSelect = screen.getByTestId('single-user-select');
      fireEvent.change(userSelect, { target: { value: 'user2' } });
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'single_user',
        assigneeId: 'user2'
      });
    });
  });

  describe('round_robin 配置', () => {
    beforeEach(() => {
      defaultProps.selectedStrategy = 'round_robin';
    });

    it('應該顯示用戶多選列表', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      mockUsers.forEach(user => {
        const checkbox = screen.getByTestId(`user-checkbox-${user.id}`);
        expect(checkbox).toBeDefined();
      });
    });

    it('應該允許選擇多個用戶', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const checkbox1 = screen.getByTestId('user-checkbox-user1');
      const checkbox2 = screen.getByTestId('user-checkbox-user2');
      
      fireEvent.click(checkbox1);
      fireEvent.click(checkbox2);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'round_robin',
        assigneeIds: ['user1']
      });
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'round_robin',
        assigneeIds: ['user1', 'user2']
      });
    });

    it('應該顯示選擇全部按鈕', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const selectAllButton = screen.getByTestId('select-all-users');
      fireEvent.click(selectAllButton);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'round_robin',
        assigneeIds: mockUsers.map(u => u.id)
      });
    });

    it('應該顯示清除選擇按鈕', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const clearButton = screen.getByTestId('clear-selection');
      fireEvent.click(clearButton);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'round_robin',
        assigneeIds: []
      });
    });
  });

  describe('csv_column 配置', () => {
    beforeEach(() => {
      defaultProps.selectedStrategy = 'csv_column';
    });

    it('應該顯示欄位選擇下拉選單', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const columnSelect = screen.getByTestId('csv-column-select');
      expect(columnSelect).toBeDefined();
      
      defaultProps.csvColumns.forEach(column => {
        expect(screen.getByText(column)).toBeDefined();
      });
    });

    it('應該顯示匹配策略選項', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      expect(screen.getByTestId('match-strategy-exact')).toBeDefined();
      expect(screen.getByTestId('match-strategy-fuzzy')).toBeDefined();
      expect(screen.getByTestId('match-strategy-smart')).toBeDefined();
    });

    it('應該觸發欄位選擇變更', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const columnSelect = screen.getByTestId('csv-column-select');
      fireEvent.change(columnSelect, { target: { value: 'assignee' } });
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'csv_column',
        csvColumn: 'assignee',
        matchingStrategy: 'smart'
      });
    });

    it('應該觸發匹配策略變更', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const fuzzyMatch = screen.getByTestId('match-strategy-fuzzy');
      fireEvent.click(fuzzyMatch);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'csv_column',
        matchingStrategy: 'fuzzy'
      });
    });

    it('應該顯示預設用戶選項', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const defaultUserSelect = screen.getByTestId('default-user-select');
      expect(defaultUserSelect).toBeDefined();
    });

    it('應該顯示跳過未分配選項', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const skipUnassigned = screen.getByTestId('skip-unassigned-switch');
      expect(skipUnassigned).toBeDefined();
      
      fireEvent.click(skipUnassigned);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'csv_column',
        skipUnassigned: true
      });
    });
  });

  describe('department_rule 配置', () => {
    beforeEach(() => {
      defaultProps.selectedStrategy = 'department_rule';
    });

    it('應該顯示部門規則列表', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      mockDepartmentRules.forEach(rule => {
        expect(screen.getByText(rule.department)).toBeDefined();
      });
    });

    it('應該顯示規則詳情', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      mockDepartmentRules.forEach(rule => {
        const ruleElement = screen.getByTestId(`rule-${rule.department}`);
        
        if (rule.conditions.customerType) {
          expect(within(ruleElement).getByText(`客戶類型：${rule.conditions.customerType}`))
            .toBeDefined();
        }
        
        if (rule.conditions.region) {
          expect(within(ruleElement).getByText(`區域：${rule.conditions.region}`))
            .toBeDefined();
        }
      });
    });

    it('應該允許新增規則', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const addRuleButton = screen.getByTestId('add-rule-button');
      fireEvent.click(addRuleButton);
      
      // 應該顯示新增規則表單
      expect(screen.getByTestId('new-rule-form')).toBeDefined();
    });

    it('應該允許編輯規則', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const editButton = screen.getByTestId(`edit-rule-${mockDepartmentRules[0].department}`);
      fireEvent.click(editButton);
      
      // 應該顯示編輯表單
      expect(screen.getByTestId('edit-rule-form')).toBeDefined();
    });

    it('應該允許刪除規則', () => {
      const mockOnRuleDelete = vi.fn();
      render(
        <AssignmentStrategySelector 
          {...defaultProps} 
          onRuleDelete={mockOnRuleDelete}
        />
      );
      
      const deleteButton = screen.getByTestId(`delete-rule-${mockDepartmentRules[0].department}`);
      fireEvent.click(deleteButton);
      
      // 應該顯示確認對話框
      expect(vi.mocked(Alert.alert)).toHaveBeenCalled();
    });
  });

  describe('manual_mapping 配置', () => {
    beforeEach(() => {
      defaultProps.selectedStrategy = 'manual_mapping';
    });

    it('應該顯示手動映射表格', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      expect(screen.getByTestId('manual-mapping-table')).toBeDefined();
    });

    it('應該允許新增映射', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const addMappingButton = screen.getByTestId('add-mapping-button');
      fireEvent.click(addMappingButton);
      
      // 應該顯示新增映射表單
      expect(screen.getByTestId('new-mapping-form')).toBeDefined();
    });

    it('應該顯示映射輸入欄位', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const addMappingButton = screen.getByTestId('add-mapping-button');
      fireEvent.click(addMappingButton);
      
      expect(screen.getByPlaceholderText('資料識別值（如客戶名稱）')).toBeDefined();
      expect(screen.getByTestId('mapping-user-select')).toBeDefined();
    });

    it('應該觸發映射新增', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const addMappingButton = screen.getByTestId('add-mapping-button');
      fireEvent.click(addMappingButton);
      
      const keyInput = screen.getByPlaceholderText('資料識別值（如客戶名稱）');
      const userSelect = screen.getByTestId('mapping-user-select');
      const confirmButton = screen.getByTestId('confirm-mapping-button');
      
      fireEvent.change(keyInput, { target: { value: '客戶A' } });
      fireEvent.change(userSelect, { target: { value: 'user1' } });
      fireEvent.click(confirmButton);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'manual_mapping',
        assigneeMapping: expect.any(Map)
      });
    });

    it('應該允許批量匯入映射', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const importButton = screen.getByTestId('import-mapping-button');
      expect(importButton).toBeDefined();
      
      fireEvent.click(importButton);
      
      // 應該顯示匯入對話框
      expect(screen.getByTestId('import-mapping-dialog')).toBeDefined();
    });

    it('應該支援 CSV 格式匯入', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const importButton = screen.getByTestId('import-mapping-button');
      fireEvent.click(importButton);
      
      const csvInput = screen.getByTestId('csv-import-input');
      const csvData = '客戶A,user1\n客戶B,user2\n客戶C,user3';
      
      fireEvent.change(csvInput, { target: { value: csvData } });
      
      const confirmImport = screen.getByTestId('confirm-import-button');
      fireEvent.click(confirmImport);
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: 'manual_mapping',
        assigneeMapping: expect.any(Map)
      });
    });
  });

  describe('進階選項', () => {
    it('應該顯示進階選項開關', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const advancedToggle = screen.getByTestId('advanced-options-toggle');
      expect(advancedToggle).toBeDefined();
    });

    it('應該在展開時顯示進階選項', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const advancedToggle = screen.getByTestId('advanced-options-toggle');
      fireEvent.click(advancedToggle);
      
      expect(screen.getByTestId('advanced-options-panel')).toBeDefined();
      expect(screen.getByTestId('confidence-threshold-input')).toBeDefined();
      expect(screen.getByTestId('max-assignments-input')).toBeDefined();
      expect(screen.getByTestId('auto-balance-switch')).toBeDefined();
    });

    it('應該觸發進階選項變更', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const advancedToggle = screen.getByTestId('advanced-options-toggle');
      fireEvent.click(advancedToggle);
      
      const thresholdInput = screen.getByTestId('confidence-threshold-input');
      fireEvent.change(thresholdInput, { target: { value: '75' } });
      
      expect(mockOnConfigChange).toHaveBeenCalledWith({
        strategy: defaultProps.selectedStrategy,
        confidenceThreshold: 75
      });
    });
  });

  describe('驗證和錯誤處理', () => {
    it('應該驗證必填欄位', async () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      // 不選擇用戶就觸發配置
      const confirmButton = screen.getByTestId('confirm-config-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('請選擇至少一個用戶')).toBeDefined();
      });
    });

    it('應該防止無效的配置', async () => {
      render(
        <AssignmentStrategySelector 
          {...defaultProps} 
          selectedStrategy="csv_column"
        />
      );
      
      // 不選擇欄位就確認
      const confirmButton = screen.getByTestId('confirm-config-button');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText('請選擇 CSV 欄位')).toBeDefined();
      });
    });

    it('應該處理配置錯誤', async () => {
      const errorOnConfigChange = vi.fn().mockRejectedValue(new Error('Config failed'));
      
      render(
        <AssignmentStrategySelector 
          {...defaultProps} 
          onConfigChange={errorOnConfigChange}
        />
      );
      
      const userSelect = screen.getByTestId('single-user-select');
      fireEvent.change(userSelect, { target: { value: 'user1' } });
      
      await waitFor(() => {
        expect(screen.getByText('配置失敗，請重試')).toBeDefined();
      });
    });
  });

  describe('說明和提示', () => {
    it('應該顯示策略說明提示', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const helpButtons = screen.getAllByTestId(/help-button-/);
      expect(helpButtons.length).toBeGreaterThan(0);
      
      // 點擊說明按鈕
      fireEvent.click(helpButtons[0]);
      
      // 應該顯示說明對話框
      expect(screen.getByRole('dialog')).toBeDefined();
    });

    it('應該顯示範例配置', () => {
      render(<AssignmentStrategySelector {...defaultProps} />);
      
      const exampleButton = screen.getByTestId('show-example-button');
      fireEvent.click(exampleButton);
      
      expect(screen.getByTestId('example-config')).toBeDefined();
    });
  });
});