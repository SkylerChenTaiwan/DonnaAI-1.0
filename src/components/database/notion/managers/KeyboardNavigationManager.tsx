/**
 * 鍵盤導航管理器 - 處理表格的鍵盤導航邏輯
 */

import { useEffect, useRef, useCallback } from 'react';
import { CellPosition } from '../types';

interface NavigationCell {
  rowId: string;
  columnKey: string;
}

interface NavigationContext {
  currentCell: NavigationCell | null;
  editingCell: NavigationCell | null;
  rows: any[];
  columns: any[];
  onCellSelect: (cell: NavigationCell) => void;
  onCellEdit: (cell: NavigationCell) => void;
  onCellUpdate: (rowId: string, columnKey: string, value: any) => void;
  onEditComplete: () => void;
}

export class KeyboardNavigationManager {
  private context: NavigationContext;
  private clipboard: { value: any; columnKey: string } | null = null;

  constructor(context: NavigationContext) {
    this.context = context;
  }

  updateContext(context: NavigationContext) {
    this.context = context;
  }

  // 處理鍵盤事件
  handleKeyDown(event: KeyboardEvent) {
    const { currentCell, editingCell, rows, columns } = this.context;

    // 如果正在編輯，讓編輯器處理
    if (editingCell) {
      if (event.key === 'Tab') {
        event.preventDefault();
        this.navigateNext(event.shiftKey);
      }
      return;
    }

    // 非編輯模式的鍵盤處理
    if (!currentCell) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateRight();
        break;
      case 'Tab':
        event.preventDefault();
        this.navigateNext(event.shiftKey);
        break;
      case 'Enter':
        event.preventDefault();
        if (event.shiftKey) {
          this.navigateUp();
        } else {
          this.enterEditMode();
        }
        break;
      case 'F2':
        event.preventDefault();
        this.enterEditMode();
        break;
      case 'Escape':
        event.preventDefault();
        this.context.onEditComplete();
        break;
      case 'Delete':
      case 'Backspace':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.clearCell();
        }
        break;
      case 'c':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.copyCell();
        }
        break;
      case 'v':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.pasteCell();
        }
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.selectAll();
        }
        break;
      default:
        // 如果是可打印字符，進入編輯模式
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.enterEditMode();
        }
        break;
    }
  }

  // 導航方法
  private navigateUp() {
    const { currentCell, rows, columns } = this.context;
    if (!currentCell) return;

    const currentRowIndex = rows.findIndex(row => row.id === currentCell.rowId);
    if (currentRowIndex > 0) {
      const newRowId = rows[currentRowIndex - 1].id;
      this.context.onCellSelect({ rowId: newRowId, columnKey: currentCell.columnKey });
    }
  }

  private navigateDown() {
    const { currentCell, rows, columns } = this.context;
    if (!currentCell) return;

    const currentRowIndex = rows.findIndex(row => row.id === currentCell.rowId);
    if (currentRowIndex < rows.length - 1) {
      const newRowId = rows[currentRowIndex + 1].id;
      this.context.onCellSelect({ rowId: newRowId, columnKey: currentCell.columnKey });
    }
  }

  private navigateLeft() {
    const { currentCell, rows, columns } = this.context;
    if (!currentCell) return;

    const currentColumnIndex = columns.findIndex(col => col.key === currentCell.columnKey);
    if (currentColumnIndex > 0) {
      const newColumnKey = columns[currentColumnIndex - 1].key;
      this.context.onCellSelect({ rowId: currentCell.rowId, columnKey: newColumnKey });
    }
  }

  private navigateRight() {
    const { currentCell, rows, columns } = this.context;
    if (!currentCell) return;

    const currentColumnIndex = columns.findIndex(col => col.key === currentCell.columnKey);
    if (currentColumnIndex < columns.length - 1) {
      const newColumnKey = columns[currentColumnIndex + 1].key;
      this.context.onCellSelect({ rowId: currentCell.rowId, columnKey: newColumnKey });
    }
  }

  private navigateNext(reverse: boolean = false) {
    const { currentCell, rows, columns } = this.context;
    if (!currentCell) return;

    const currentRowIndex = rows.findIndex(row => row.id === currentCell.rowId);
    const currentColumnIndex = columns.findIndex(col => col.key === currentCell.columnKey);

    if (reverse) {
      // Shift+Tab - 向前導航
      if (currentColumnIndex > 0) {
        const newColumnKey = columns[currentColumnIndex - 1].key;
        this.context.onCellSelect({ rowId: currentCell.rowId, columnKey: newColumnKey });
      } else if (currentRowIndex > 0) {
        const newRowId = rows[currentRowIndex - 1].id;
        const newColumnKey = columns[columns.length - 1].key;
        this.context.onCellSelect({ rowId: newRowId, columnKey: newColumnKey });
      }
    } else {
      // Tab - 向後導航
      if (currentColumnIndex < columns.length - 1) {
        const newColumnKey = columns[currentColumnIndex + 1].key;
        this.context.onCellSelect({ rowId: currentCell.rowId, columnKey: newColumnKey });
      } else if (currentRowIndex < rows.length - 1) {
        const newRowId = rows[currentRowIndex + 1].id;
        const newColumnKey = columns[0].key;
        this.context.onCellSelect({ rowId: newRowId, columnKey: newColumnKey });
      }
    }
  }

  private enterEditMode() {
    const { currentCell } = this.context;
    if (currentCell) {
      this.context.onCellEdit(currentCell);
    }
  }

  private clearCell() {
    const { currentCell, rows } = this.context;
    if (!currentCell) return;

    const row = rows.find(r => r.id === currentCell.rowId);
    if (row) {
      this.context.onCellUpdate(currentCell.rowId, currentCell.columnKey, null);
    }
  }

  private copyCell() {
    const { currentCell, rows } = this.context;
    if (!currentCell) return;

    const row = rows.find(r => r.id === currentCell.rowId);
    if (row) {
      this.clipboard = {
        value: row[currentCell.columnKey],
        columnKey: currentCell.columnKey
      };
      console.log('已複製:', this.clipboard.value);
    }
  }

  private pasteCell() {
    const { currentCell } = this.context;
    if (!currentCell || !this.clipboard) return;

    this.context.onCellUpdate(currentCell.rowId, currentCell.columnKey, this.clipboard.value);
    console.log('已貼上:', this.clipboard.value);
  }

  private selectAll() {
    // 在實際應用中，這裡應該選擇所有儲存格
    console.log('選擇全部');
  }
}

// React Hook 包裝
export const useKeyboardNavigation = (context: NavigationContext) => {
  const managerRef = useRef<KeyboardNavigationManager | null>(null);

  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = new KeyboardNavigationManager(context);
    } else {
      managerRef.current.updateContext(context);
    }
  }, [context]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    managerRef.current?.handleKeyDown(event);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return managerRef.current;
};