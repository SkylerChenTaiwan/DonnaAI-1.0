/**
 * 資料庫頁面專用鍵盤快捷鍵 Hook
 * 提供 Notion 風格的快捷鍵支援
 */

import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

interface DatabaseShortcutConfig {
  onAddRow?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onSort?: () => void;
  onMultiSelect?: () => void;
  onEditMode?: () => void;
  onEscape?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
}

export const useDatabaseKeyboardShortcuts = (config: DatabaseShortcutConfig) => {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // 檢查是否在輸入框中
    const target = event.target as HTMLElement;
    const isInputActive = target.tagName === 'INPUT' || 
                         target.tagName === 'TEXTAREA' || 
                         target.contentEditable === 'true';
    
    // Cmd/Ctrl + N: 新增行
    if ((event.metaKey || event.ctrlKey) && event.key === 'n' && !isInputActive) {
      event.preventDefault();
      config.onAddRow?.();
    }
    
    // Cmd/Ctrl + K: 快速搜尋
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      config.onSearch?.();
    }
    
    // Cmd/Ctrl + F: 篩選
    if ((event.metaKey || event.ctrlKey) && event.key === 'f' && !isInputActive) {
      event.preventDefault();
      config.onFilter?.();
    }
    
    // Cmd/Ctrl + Shift + S: 排序
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 's') {
      event.preventDefault();
      config.onSort?.();
    }
    
    // Cmd/Ctrl + Shift + M: 切換多選模式
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'm') {
      event.preventDefault();
      config.onMultiSelect?.();
    }
    
    // Cmd/Ctrl + E: 切換編輯模式
    if ((event.metaKey || event.ctrlKey) && event.key === 'e' && !isInputActive) {
      event.preventDefault();
      config.onEditMode?.();
    }
    
    // Escape: 退出編輯/多選模式
    if (event.key === 'Escape') {
      event.preventDefault();
      config.onEscape?.();
    }
    
    // Cmd/Ctrl + A: 全選（在多選模式下）
    if ((event.metaKey || event.ctrlKey) && event.key === 'a' && !isInputActive) {
      event.preventDefault();
      config.onSelectAll?.();
    }
    
    // Delete/Backspace: 刪除選中項目
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isInputActive) {
      config.onDelete?.();
    }
  }, [config]);

  useEffect(() => {
    // 只在 Web 平台啟用
    if (Platform.OS !== 'web') return;
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // 返回快捷鍵列表供顯示用
  return {
    shortcuts: [
      { keys: ['Cmd/Ctrl', 'N'], description: '新增資料' },
      { keys: ['Cmd/Ctrl', 'K'], description: '快速搜尋' },
      { keys: ['Cmd/Ctrl', 'F'], description: '開啟篩選' },
      { keys: ['Cmd/Ctrl', 'Shift', 'S'], description: '排序' },
      { keys: ['Cmd/Ctrl', 'Shift', 'M'], description: '多選模式' },
      { keys: ['Cmd/Ctrl', 'E'], description: '編輯模式' },
      { keys: ['Cmd/Ctrl', 'A'], description: '全選' },
      { keys: ['Esc'], description: '退出模式' },
      { keys: ['Delete'], description: '刪除選中' },
    ],
  };
};