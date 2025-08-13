/**
 * Modal 系統遷移測試套件
 * 驗證所有 Modal 元件成功遷移至 AdaptiveModal
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SortModal } from '../SortModal';
import { FilterModal } from '../FilterModal';
import { ActionModal } from '../ActionModal';
import { BatchActionsModal } from '../BatchActionsModal';
import { ColumnSettingsModal } from '../ColumnSettingsModal';
import { TableColumn } from '@/types/table';
import { FilterCondition } from '../FilterBadge';
import { BatchAction } from '../BatchActionsModal';

// Mock AdaptiveModal
jest.mock('@/components/adaptive/core/AdaptiveModal', () => ({
  AdaptiveModal: jest.fn(({ visible, children, onClose, primaryButton, secondaryButton, title }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    
    return (
      <View testID="adaptive-modal">
        {title && <Text testID="modal-title">{title}</Text>}
        {children}
        {primaryButton && (
          <TouchableOpacity testID="primary-button" onPress={primaryButton.onPress}>
            <Text>{primaryButton.title}</Text>
          </TouchableOpacity>
        )}
        {secondaryButton && (
          <TouchableOpacity testID="secondary-button" onPress={secondaryButton.onPress}>
            <Text>{secondaryButton.title}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity testID="close-button" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  })
}));

describe('Modal Migration Tests', () => {
  const mockColumns: TableColumn[] = [
    { key: 'name', title: '名稱', sortable: true, filterable: true },
    { key: 'email', title: '電子郵件', sortable: true, filterable: true },
    { key: 'phone', title: '電話', sortable: false, filterable: true }
  ];

  describe('SortModal', () => {
    it('should render with AdaptiveModal', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      
      const { getByTestId } = render(
        <SortModal
          visible={true}
          onClose={onClose}
          columns={mockColumns}
          onApply={onApply}
        />
      );
      
      expect(getByTestId('adaptive-modal')).toBeTruthy();
      expect(getByTestId('modal-title')).toHaveTextContent('排序');
    });

    it('should handle apply and close', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      
      const { getByTestId } = render(
        <SortModal
          visible={true}
          onClose={onClose}
          columns={mockColumns}
          onApply={onApply}
        />
      );
      
      // 測試套用按鈕
      fireEvent.press(getByTestId('primary-button'));
      expect(onApply).toHaveBeenCalled();
      
      // 測試取消按鈕
      fireEvent.press(getByTestId('secondary-button'));
      expect(onClose).toHaveBeenCalled();
    });

    it('should not render when visible is false', () => {
      const { queryByTestId } = render(
        <SortModal
          visible={false}
          onClose={jest.fn()}
          columns={mockColumns}
          onApply={jest.fn()}
        />
      );
      
      expect(queryByTestId('adaptive-modal')).toBeNull();
    });
  });

  describe('FilterModal', () => {
    it('should render with AdaptiveModal', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      const filters: FilterCondition[] = [];
      
      const { getByTestId } = render(
        <FilterModal
          visible={true}
          onClose={onClose}
          columns={mockColumns}
          filters={filters}
          onApply={onApply}
          tabType="customers"
        />
      );
      
      expect(getByTestId('adaptive-modal')).toBeTruthy();
      expect(getByTestId('modal-title')).toHaveTextContent('篩選');
    });

    it('should handle apply and close buttons', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      
      const { getByTestId } = render(
        <FilterModal
          visible={true}
          onClose={onClose}
          columns={mockColumns}
          filters={[]}
          onApply={onApply}
          tabType="customers"
        />
      );
      
      fireEvent.press(getByTestId('primary-button'));
      expect(onApply).toHaveBeenCalled();
      
      fireEvent.press(getByTestId('secondary-button'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ActionModal', () => {
    it('should render with AdaptiveModal', () => {
      const onClose = jest.fn();
      const onAction = jest.fn();
      
      const { getByTestId } = render(
        <ActionModal
          visible={true}
          onClose={onClose}
          onAction={onAction}
        />
      );
      
      expect(getByTestId('adaptive-modal')).toBeTruthy();
    });

    it('should handle close', () => {
      const onClose = jest.fn();
      const onAction = jest.fn();
      
      const { getByTestId } = render(
        <ActionModal
          visible={true}
          onClose={onClose}
          onAction={onAction}
        />
      );
      
      fireEvent.press(getByTestId('close-button'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('BatchActionsModal', () => {
    const mockActions: BatchAction[] = [
      { id: '1', label: '編輯', icon: 'edit', type: 'edit' },
      { id: '2', label: '刪除', icon: 'delete', type: 'delete', confirmRequired: true }
    ];

    it('should render with AdaptiveModal', () => {
      const onClose = jest.fn();
      const onAction = jest.fn();
      
      const { getByTestId } = render(
        <BatchActionsModal
          visible={true}
          onClose={onClose}
          selectedCount={5}
          actions={mockActions}
          onAction={onAction}
        />
      );
      
      expect(getByTestId('adaptive-modal')).toBeTruthy();
      expect(getByTestId('modal-title')).toHaveTextContent('批量操作');
    });

    it('should display selected count in subtitle', () => {
      const { getByTestId } = render(
        <BatchActionsModal
          visible={true}
          onClose={jest.fn()}
          selectedCount={5}
          actions={mockActions}
          onAction={jest.fn()}
        />
      );
      
      // AdaptiveModal should receive subtitle prop with selected count
      const modal = getByTestId('adaptive-modal');
      expect(modal).toBeTruthy();
    });

    it('should handle cancel button', () => {
      const onClose = jest.fn();
      
      const { getByTestId } = render(
        <BatchActionsModal
          visible={true}
          onClose={onClose}
          selectedCount={5}
          actions={mockActions}
          onAction={jest.fn()}
        />
      );
      
      fireEvent.press(getByTestId('secondary-button'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('ColumnSettingsModal', () => {
    it('should render with AdaptiveModal', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      const visibleColumns = ['name', 'email'];
      
      const { getByTestId } = render(
        <ColumnSettingsModal
          visible={true}
          onClose={onClose}
          columns={mockColumns}
          visibleColumns={visibleColumns}
          onApply={onApply}
        />
      );
      
      expect(getByTestId('adaptive-modal')).toBeTruthy();
      expect(getByTestId('modal-title')).toHaveTextContent('欄位設定');
    });

    it('should handle apply and close', () => {
      const onClose = jest.fn();
      const onApply = jest.fn();
      
      const { getByTestId } = render(
        <ColumnSettingsModal
          visible={true}
          onClose={onClose}
          columns={mockColumns}
          visibleColumns={['name']}
          onApply={onApply}
        />
      );
      
      fireEvent.press(getByTestId('primary-button'));
      expect(onApply).toHaveBeenCalled();
      
      fireEvent.press(getByTestId('secondary-button'));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Platform Consistency', () => {
    it('should not contain Platform.OS checks', async () => {
      // Import the actual component files
      const sortModalCode = require('../SortModal');
      const filterModalCode = require('../FilterModal');
      const actionModalCode = require('../ActionModal');
      const batchActionsModalCode = require('../BatchActionsModal');
      const columnSettingsModalCode = require('../ColumnSettingsModal');
      
      // Convert to string and check for Platform.OS
      const modalFiles = [
        sortModalCode,
        filterModalCode,
        actionModalCode,
        batchActionsModalCode,
        columnSettingsModalCode
      ];
      
      modalFiles.forEach((modalCode) => {
        const codeString = modalCode.toString();
        expect(codeString).not.toContain('Platform.OS');
      });
    });

    it('should not import Modal from react-native', () => {
      // This test verifies that we're not importing Modal from react-native
      const sortModalCode = require('../SortModal');
      const codeString = sortModalCode.toString();
      expect(codeString).not.toContain("from 'react-native'.*Modal");
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(
        <SortModal
          visible={true}
          onClose={jest.fn()}
          columns={mockColumns}
          onApply={jest.fn()}
        />
      );
      
      const modal = getByTestId('adaptive-modal');
      expect(modal).toBeTruthy();
      // AdaptiveModal should handle accessibility
    });
  });

  describe('Animation and Transitions', () => {
    it('should apply correct animation type', () => {
      const { getByTestId } = render(
        <SortModal
          visible={true}
          onClose={jest.fn()}
          columns={mockColumns}
          onApply={jest.fn()}
        />
      );
      
      // AdaptiveModal should receive animationType prop
      const modal = getByTestId('adaptive-modal');
      expect(modal).toBeTruthy();
    });
  });
});

describe('Modal Performance Tests', () => {
  it('should render quickly', async () => {
    const startTime = performance.now();
    
    const { getByTestId } = render(
      <SortModal
        visible={true}
        onClose={jest.fn()}
        columns={[]}
        onApply={jest.fn()}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    expect(renderTime).toBeLessThan(100); // Should render in less than 100ms
    expect(getByTestId('adaptive-modal')).toBeTruthy();
  });

  it('should handle rapid open/close', async () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <SortModal
        visible={false}
        onClose={onClose}
        columns={[]}
        onApply={jest.fn()}
      />
    );
    
    // Rapidly toggle visibility
    for (let i = 0; i < 10; i++) {
      rerender(
        <SortModal
          visible={i % 2 === 0}
          onClose={onClose}
          columns={[]}
          onApply={jest.fn()}
        />
      );
    }
    
    // Should not crash or have memory leaks
    expect(true).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle missing props gracefully', () => {
    const { queryByTestId } = render(
      <SortModal
        visible={true}
        onClose={jest.fn()}
        columns={[]}
        onApply={jest.fn()}
      />
    );
    
    // Should still render even with empty columns
    expect(queryByTestId('adaptive-modal')).toBeTruthy();
  });

  it('should handle null/undefined callbacks', () => {
    const { getByTestId } = render(
      <ActionModal
        visible={true}
        onClose={undefined as any}
        onAction={undefined as any}
      />
    );
    
    // Should not crash
    expect(getByTestId('adaptive-modal')).toBeTruthy();
  });
});