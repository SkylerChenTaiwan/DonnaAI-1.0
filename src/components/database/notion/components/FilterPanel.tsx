/**
 * Notion 風格過濾面板
 * 提供過濾條件建構器界面，支援嵌套過濾組和複雜邏輯
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { 
  FilterPanelProps, 
  Filter, 
  FilterGroup, 
  FilterOperator, 
  ColumnConfig 
} from '../types';
import { FilterManager, createFilter, createEmptyFilterGroup } from '../managers/FilterManager';
import { NotionIcons } from '../NotionIcons';

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  columns,
  currentFilters,
  onFiltersChange,
  anchorEl
}) => {
  // 將所有 Hook 宣告移到條件檢查之前
  const [filterManager] = useState(() => new FilterManager());
  
  // 處理添加新過濾條件
  const handleAddFilter = useCallback((groupId: string, parentGroup?: FilterGroup) => {
    const targetGroup = parentGroup || currentFilters;
    const firstColumn = columns[0];
    
    if (!firstColumn) return;

    const newFilter = createFilter(
      firstColumn.key,
      filterManager.getOperatorsForColumnType(firstColumn.type)[0],
      ''
    );

    const updatedGroup = addFilterToGroup(targetGroup, groupId, newFilter);
    onFiltersChange(updatedGroup);
  }, [columns, currentFilters, onFiltersChange, filterManager]);

  // 處理添加新過濾組
  const handleAddGroup = useCallback((parentGroupId: string) => {
    const newGroup = createEmptyFilterGroup();
    const updatedGroup = addFilterToGroup(currentFilters, parentGroupId, newGroup);
    onFiltersChange(updatedGroup);
  }, [currentFilters, onFiltersChange]);

  // 處理更新過濾條件
  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<Filter>) => {
    const updatedGroup = updateFilterInGroup(currentFilters, filterId, updates);
    onFiltersChange(updatedGroup);
  }, [currentFilters, onFiltersChange]);

  // 處理移除過濾條件
  const handleRemoveFilter = useCallback((filterId: string) => {
    const updatedGroup = removeFilterFromGroup(currentFilters, filterId);
    onFiltersChange(updatedGroup);
  }, [currentFilters, onFiltersChange]);

  // 處理更新過濾組操作符
  const handleUpdateGroupOperator = useCallback((groupId: string, operator: 'and' | 'or') => {
    const updatedGroup = updateGroupOperator(currentFilters, groupId, operator);
    onFiltersChange(updatedGroup);
  }, [currentFilters, onFiltersChange]);
  
  // 條件檢查移到所有 Hook 宣告之後
  console.log('🔍 FilterPanel 渲染:', { isOpen, platform: Platform.OS });
  
  if (!isOpen || Platform.OS !== 'web') {
    return null;
  }
  
  console.log('🔍 FilterPanel 將要渲染面板');

  return React.createElement('div', {
    className: 'notion-filter-panel-overlay',
    onClick: (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  },
    React.createElement('div', {
      className: 'notion-filter-panel',
      style: anchorEl ? getPositionStyle(anchorEl) : undefined
    },
      // 面板標題
      React.createElement('div', {
        className: 'notion-filter-panel-header'
      },
        React.createElement('h3', {
          className: 'notion-filter-panel-title'
        }, '過濾'),
        React.createElement('button', {
          className: 'notion-filter-panel-close',
          onClick: onClose
        }, '✕')
      ),

      // 過濾條件內容
      React.createElement('div', {
        className: 'notion-filter-panel-content'
      },
        renderFilterGroup(
          currentFilters, 
          columns, 
          filterManager,
          handleUpdateFilter,
          handleRemoveFilter,
          handleUpdateGroupOperator,
          handleAddFilter,
          handleAddGroup,
          0
        )
      ),

      // 面板底部
      React.createElement('div', {
        className: 'notion-filter-panel-footer'
      },
        React.createElement('button', {
          className: 'notion-button',
          onClick: () => handleAddFilter(currentFilters.id)
        }, 
          NotionIcons.plus(),
          ' 新增過濾條件'
        ),
        React.createElement('button', {
          className: 'notion-button',
          onClick: () => handleAddGroup(currentFilters.id)
        }, 
          NotionIcons.group(),
          ' 新增過濾組'
        )
      )
    )
  );
};

// === 輔助函數 ===

function renderFilterGroup(
  group: FilterGroup,
  columns: ColumnConfig[],
  filterManager: FilterManager,
  onUpdateFilter: (filterId: string, updates: Partial<Filter>) => void,
  onRemoveFilter: (filterId: string) => void,
  onUpdateGroupOperator: (groupId: string, operator: 'and' | 'or') => void,
  onAddFilter: (groupId: string) => void,
  onAddGroup: (groupId: string) => void,
  nestingLevel: number
): React.ReactElement {
  return React.createElement('div', {
    className: `notion-filter-group notion-filter-group-level-${nestingLevel}`,
    key: group.id
  },
    // 組操作符選擇器
    group.filters.length > 1 && React.createElement('div', {
      className: 'notion-filter-group-operator'
    },
      React.createElement('span', {
        className: 'notion-filter-group-label'
      }, '滿足'),
      React.createElement('select', {
        className: 'notion-filter-operator-select',
        value: group.operator,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          onUpdateGroupOperator(group.id, e.target.value as 'and' | 'or');
        }
      },
        React.createElement('option', { value: 'and' }, '所有條件'),
        React.createElement('option', { value: 'or' }, '任一條件')
      )
    ),

    // 渲染過濾條件
    React.createElement('div', {
      className: 'notion-filter-conditions'
    },
      ...group.filters.map((filter, index) => {
        if ('filters' in filter) {
          // 遞迴渲染子組
          return renderFilterGroup(
            filter as FilterGroup,
            columns,
            filterManager,
            onUpdateFilter,
            onRemoveFilter,
            onUpdateGroupOperator,
            onAddFilter,
            onAddGroup,
            nestingLevel + 1
          );
        } else {
          // 渲染過濾條件
          return renderFilterCondition(
            filter as Filter,
            columns,
            filterManager,
            onUpdateFilter,
            onRemoveFilter,
            index
          );
        }
      })
    ),

    // 如果組為空，顯示提示
    group.filters.length === 0 && React.createElement('div', {
      className: 'notion-filter-empty'
    }, '此組沒有過濾條件'),

    // 嵌套組的操作按鈕
    nestingLevel < 2 && React.createElement('div', {
      className: 'notion-filter-group-actions'
    },
      React.createElement('button', {
        className: 'notion-button-text',
        onClick: () => onAddFilter(group.id)
      }, '+ 新增條件'),
      nestingLevel < 1 && React.createElement('button', {
        className: 'notion-button-text',
        onClick: () => onAddGroup(group.id)
      }, '+ 新增群組')
    )
  );
}

function renderFilterCondition(
  filter: Filter,
  columns: ColumnConfig[],
  filterManager: FilterManager,
  onUpdateFilter: (filterId: string, updates: Partial<Filter>) => void,
  onRemoveFilter: (filterId: string) => void,
  index: number
): React.ReactElement {
  const column = columns.find(col => col.key === filter.columnKey);
  const availableOperators = column 
    ? filterManager.getOperatorsForColumnType(column.type)
    : [];

  return React.createElement('div', {
    className: 'notion-filter-condition',
    key: filter.id
  },
    // 欄位選擇
    React.createElement('select', {
      className: 'notion-filter-column-select',
      value: filter.columnKey,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newColumn = columns.find(col => col.key === e.target.value);
        const newOperators = newColumn 
          ? filterManager.getOperatorsForColumnType(newColumn.type)
          : [];
        
        onUpdateFilter(filter.id, {
          columnKey: e.target.value,
          operator: newOperators[0] || 'equals',
          value: ''
        });
      }
    },
      ...columns.map(col => 
        React.createElement('option', {
          key: col.key,
          value: col.key
        }, col.title)
      )
    ),

    // 操作符選擇
    React.createElement('select', {
      className: 'notion-filter-operator-select',
      value: filter.operator,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateFilter(filter.id, { 
          operator: e.target.value as FilterOperator,
          value: '' // 重置值當操作符改變
        });
      }
    },
      ...availableOperators.map(op => 
        React.createElement('option', {
          key: op,
          value: op
        }, getOperatorLabel(op))
      )
    ),

    // 值輸入（如果操作符需要值）
    needsValue(filter.operator) && React.createElement('div', {
      className: 'notion-filter-value'
    },
      renderValueInput(filter, column, onUpdateFilter)
    ),

    // 啟用/停用切換
    React.createElement('button', {
      className: `notion-filter-toggle ${filter.isActive ? 'active' : 'inactive'}`,
      onClick: () => onUpdateFilter(filter.id, { isActive: !filter.isActive }),
      title: filter.isActive ? '停用此過濾條件' : '啟用此過濾條件'
    }, filter.isActive ? '●' : '○'),

    // 移除按鈕
    React.createElement('button', {
      className: 'notion-filter-remove',
      onClick: () => onRemoveFilter(filter.id),
      title: '移除此過濾條件'
    }, '✕')
  );
}

function renderValueInput(
  filter: Filter,
  column: ColumnConfig | undefined,
  onUpdateFilter: (filterId: string, updates: Partial<Filter>) => void
): React.ReactElement {
  switch (column?.type) {
    case 'select':
      return React.createElement('select', {
        className: 'notion-filter-value-select',
        value: filter.value || '',
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          onUpdateFilter(filter.id, { value: e.target.value });
        }
      },
        React.createElement('option', { value: '' }, '選擇選項...'),
        ...(column.options || []).map(option => 
          React.createElement('option', {
            key: option.id,
            value: option.value
          }, option.label)
        )
      );

    case 'multiselect':
    case 'tags':
      return React.createElement('select', {
        className: 'notion-filter-value-select',
        value: filter.value || '',
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          onUpdateFilter(filter.id, { value: e.target.value });
        }
      },
        React.createElement('option', { value: '' }, '選擇標籤...'),
        ...(column.options || []).map(option => 
          React.createElement('option', {
            key: option.id,
            value: option.value
          }, option.label)
        )
      );

    case 'date':
      return React.createElement('input', {
        type: 'date',
        className: 'notion-filter-value-input',
        value: filter.value || '',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          onUpdateFilter(filter.id, { value: e.target.value });
        }
      });

    case 'number':
      return React.createElement('input', {
        type: 'number',
        className: 'notion-filter-value-input',
        value: filter.value || '',
        placeholder: '輸入數字...',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          onUpdateFilter(filter.id, { value: e.target.value });
        }
      });

    case 'checkbox':
      return React.createElement('span', {
        className: 'notion-filter-value-text'
      }, '（布林值操作符不需要值）');

    default:
      return React.createElement('input', {
        type: 'text',
        className: 'notion-filter-value-input',
        value: filter.value || '',
        placeholder: '輸入值...',
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          onUpdateFilter(filter.id, { value: e.target.value });
        }
      });
  }
}

// === 資料操作輔助函數 ===

function addFilterToGroup(
  group: FilterGroup, 
  targetGroupId: string, 
  newItem: Filter | FilterGroup
): FilterGroup {
  if (group.id === targetGroupId) {
    return {
      ...group,
      filters: [...group.filters, newItem]
    };
  }

  return {
    ...group,
    filters: group.filters.map(filter => {
      if ('filters' in filter) {
        return addFilterToGroup(filter as FilterGroup, targetGroupId, newItem);
      }
      return filter;
    })
  };
}

function updateFilterInGroup(
  group: FilterGroup, 
  filterId: string, 
  updates: Partial<Filter>
): FilterGroup {
  return {
    ...group,
    filters: group.filters.map(filter => {
      if ('filters' in filter) {
        return updateFilterInGroup(filter as FilterGroup, filterId, updates);
      } else if ((filter as Filter).id === filterId) {
        return { ...(filter as Filter), ...updates };
      }
      return filter;
    })
  };
}

function removeFilterFromGroup(group: FilterGroup, filterId: string): FilterGroup {
  return {
    ...group,
    filters: group.filters
      .filter(filter => {
        if ('filters' in filter) {
          return true; // 保留組，讓遞迴處理
        }
        return (filter as Filter).id !== filterId;
      })
      .map(filter => {
        if ('filters' in filter) {
          return removeFilterFromGroup(filter as FilterGroup, filterId);
        }
        return filter;
      })
  };
}

function updateGroupOperator(
  group: FilterGroup, 
  groupId: string, 
  operator: 'and' | 'or'
): FilterGroup {
  if (group.id === groupId) {
    return { ...group, operator };
  }

  return {
    ...group,
    filters: group.filters.map(filter => {
      if ('filters' in filter) {
        return updateGroupOperator(filter as FilterGroup, groupId, operator);
      }
      return filter;
    })
  };
}

function needsValue(operator: FilterOperator): boolean {
  const noValueOperators: FilterOperator[] = [
    'is_empty', 'is_not_empty', 'checkbox_checked', 'checkbox_unchecked'
  ];
  return !noValueOperators.includes(operator);
}

function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    'equals': '等於',
    'not_equals': '不等於',
    'contains': '包含',
    'not_contains': '不包含',
    'starts_with': '開始於',
    'ends_with': '結束於',
    'is_empty': '為空',
    'is_not_empty': '不為空',
    'greater_than': '大於',
    'less_than': '小於',
    'greater_than_or_equal': '大於等於',
    'less_than_or_equal': '小於等於',
    'date_is': '日期是',
    'date_before': '日期早於',
    'date_after': '日期晚於',
    'checkbox_checked': '已勾選',
    'checkbox_unchecked': '未勾選',
    'select_is': '是',
    'select_is_not': '不是',
    'multi_select_contains': '包含',
    'multi_select_not_contains': '不包含',
  };
  return labels[operator] || operator;
}

function getPositionStyle(anchorEl: HTMLElement): React.CSSProperties {
  const rect = anchorEl.getBoundingClientRect();
  return {
    position: 'absolute',
    top: rect.bottom + 8,
    left: rect.left,
    zIndex: 1000,
  };
}