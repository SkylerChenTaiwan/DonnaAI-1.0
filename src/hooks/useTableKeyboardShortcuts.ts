/**
 * Table 鍵盤快捷鍵 Hook - 提供類似 Google Sheets 的鍵盤操作
 */

import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Tab' | 'ShiftTab';

interface TableKeyboardShortcutsProps {
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onNavigate?: (key: ArrowKey) => void;
  onEscape?: () => void;
  onEnter?: () => void;
  enabled?: boolean;
}

// 檢查是否為輸入元素
const isInputElement = (target: any): boolean => {
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.contentEditable === 'true';
};

export function useTableKeyboardShortcuts({
  onCopy,
  onPaste,
  onUndo,
  onRedo,
  onDelete,
  onSelectAll,
  onNavigate,
  onEscape,
  onEnter,
  enabled = true }: TableKeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const metaKey = isMac ? e.metaKey : e.ctrlKey;
    
    // 複製 (Cmd/Ctrl + C)
    if (metaKey && e.key === 'c' && !e.shiftKey) {
      e.preventDefault();
      onCopy?.();
      return;
    }
    
    // 貼上 (Cmd/Ctrl + V)
    if (metaKey && e.key === 'v' && !e.shiftKey) {
      e.preventDefault();
      onPaste?.();
      return;
    }
    
    // 復原 (Cmd/Ctrl + Z)
    if (metaKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      onUndo?.();
      return;
    }
    
    // 重做 (Cmd/Ctrl + Shift + Z 或 Cmd/Ctrl + Y)
    if ((metaKey && e.key === 'z' && e.shiftKey) || (metaKey && e.key === 'y')) {
      e.preventDefault();
      onRedo?.();
      return;
    }
    
    // 全選 (Cmd/Ctrl + A)
    if (metaKey && e.key === 'a') {
      e.preventDefault();
      onSelectAll?.();
      return;
    }
    
    // 刪除 (Delete 或 Backspace) - 只在非輸入元素時觸發
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputElement(e.target)) {
      e.preventDefault();
      onDelete?.();
      return;
    }
    
    // Escape 鍵
    if (e.key === 'Escape') {
      e.preventDefault();
      onEscape?.();
      return;
    }
    
    // Enter 鍵 - 只在非輸入元素時觸發
    if (e.key === 'Enter' && !isInputElement(e.target)) {
      e.preventDefault();
      onEnter?.();
      return;
    }
    
    // 方向鍵導航 - 只在非輸入元素時觸發
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isInputElement(e.target)) {
      e.preventDefault();
      onNavigate?.(e.key as ArrowKey);
      return;
    }
    
    // Tab 鍵導航
    if (e.key === 'Tab') {
      e.preventDefault();
      onNavigate?.(e.shiftKey ? 'ShiftTab' : 'Tab');
      return;
    }
  }, [enabled, onCopy, onPaste, onUndo, onRedo, onDelete, onSelectAll, onNavigate, onEscape, onEnter]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// 剪貼簿工具函數
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (Platform.OS !== 'web') return false;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        return true;
      } catch (err) {
        console.error('Failed to copy:', err);
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};

export const readFromClipboard = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') return null;
  
  try {
    if (navigator.clipboard && window.isSecureContext) {
      const text = await navigator.clipboard.readText();
      return text;
    }
    return null;
  } catch (err) {
    console.error('Failed to read from clipboard:', err);
    return null;
  }
};