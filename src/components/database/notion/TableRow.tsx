/**
 * 表格列元件 - 顯示一行資料
 */

import React, { memo, useCallback, useState } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { TableData, ColumnConfig, CellPosition } from './types';
import { TableCell } from './TableCell';
import { tableStyles, getRowStyles } from './styles/tableStyles';
import { Icon } from '@/components/common/Icon';

interface TableRowProps {
  rowData: TableData;
  rowIndex: number;
  columns: ColumnConfig[];
  isSelected?: boolean;
  onRowClick?: (row: TableData) => void;
  onCellClick?: (position: CellPosition) => void;
  onCellDoubleClick?: (position: CellPosition) => void;
  onCellMouseEnter?: (position: CellPosition) => void;
  onCellMouseLeave?: (position: CellPosition) => void;
  onCellEdit?: (rowId: string, columnKey: string, value: any) => void;
  getCellState?: (position: CellPosition) => 'default' | 'hover' | 'selected' | 'editing';
  multiSelectMode?: boolean;
  onSelectRow?: (rowId: string, selected: boolean) => void;
}

export const TableRow: React.FC<TableRowProps> = memo(({
  rowData,
  rowIndex,
  columns,
  isSelected = false,
  onRowClick,
  onCellClick,
  onCellDoubleClick,
  onCellMouseEnter,
  onCellMouseLeave,
  onCellEdit,
  getCellState,
  multiSelectMode,
  onSelectRow }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleRowClick = useCallback(() => {
    onRowClick?.(rowData);
  }, [rowData, onRowClick]);
  
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);
  
  const handleCheckboxToggle = useCallback(() => {
    onSelectRow?.(rowData.id, !isSelected);
  }, [rowData.id, isSelected, onSelectRow]);
  
  return (
    <TouchableOpacity
      onPress={handleRowClick}
      {...(Platform.OS === 'web' ? {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave } : {})}
      activeOpacity={1}
      style={getRowStyles(isHovered, isSelected)}
    >
      {/* Multi-select checkbox */}
      {multiSelectMode && (
        <TouchableOpacity
          style={[tableStyles.cell, { width: 40 }]}
          onPress={handleCheckboxToggle}
          activeOpacity={0.7}
        >
          <View
            style={[
              tableStyles.checkbox,
              isSelected && tableStyles.checkboxChecked,
            ]}
          >
            {isSelected && (
              <Icon name="checkmark" size={12} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      )}
      
      {/* Data cells */}
      {columns.map((column, colIndex) => {
        const position: CellPosition = { row: rowIndex, col: colIndex };
        const cellState = getCellState?.(position) || 'default';
        
        return (
          <TableCell
            key={column.id}
            value={rowData[column.key]}
            column={column}
            position={position}
            state={cellState}
            onCellClick={onCellClick}
            onCellDoubleClick={onCellDoubleClick}
            onCellMouseEnter={onCellMouseEnter}
            onCellMouseLeave={onCellMouseLeave}
            onCellEdit={(value) => onCellEdit?.(rowData.id, column.key, value)}
          />
        );
      })}
    </TouchableOpacity>
  );
});

TableRow.displayName = 'TableRow';