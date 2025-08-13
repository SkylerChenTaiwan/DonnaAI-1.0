/**
 * 鍵盤快捷鍵 Hook
 * 為 Web 桌面版提供鍵盤快捷鍵支援
 */

import { useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { isDesktopWeb } from '@/utils/web-detector';
import { useAuthStore } from '@/stores/authStore';
import { showToast } from '@/utils/toast';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = () => {
  const navigation = useNavigation<NavigationProp>();
  const { mode, toggleMode } = useAuthStore();
  
  // 定義快捷鍵配置
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'h',
      ctrl: true,
      description: '回到首頁',
      action: () => navigation.navigate('Home') },
    {
      key: 'd',
      ctrl: true,
      description: '開啟客戶資料庫',
      action: () => navigation.navigate('Database') },
    {
      key: 'n',
      ctrl: true,
      description: '新增客戶',
      action: () => navigation.navigate('CustomerAdd') },
    {
      key: 't',
      ctrl: true,
      description: '開啟任務列表',
      action: () => navigation.navigate('Tasks') },
    {
      key: 'a',
      ctrl: true,
      shift: true,
      description: '新增任務',
      action: () => navigation.navigate('TaskAdd') },
    {
      key: 'm',
      ctrl: true,
      description: '切換主管/業務模式',
      action: () => {
        toggleMode();
        showToast('success', `已切換至${mode === 'business' ? '主管' : '業務'}模式`);
      } },
    {
      key: '/',
      ctrl: true,
      description: '顯示快捷鍵說明',
      action: () => showKeyboardShortcutsHelp() },
    {
      key: 'Escape',
      description: '返回上一頁',
      action: () => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } },
  ];
  
  // 顯示快捷鍵說明
  const showKeyboardShortcutsHelp = useCallback(() => {
    const helpText = shortcuts
      .map(s => {
        const keys = [];
        if (s.ctrl) keys.push('Ctrl');
        if (s.alt) keys.push('Alt');
        if (s.shift) keys.push('Shift');
        keys.push(s.key === 'Escape' ? 'Esc' : s.key.toUpperCase());
        return `${keys.join('+')} - ${s.description}`;
      })
      .join('\\n');
    
    // 在 Web 平台使用 alert 顯示
    if (typeof window !== 'undefined') {
      alert(`鍵盤快捷鍵：\\n\\n${helpText}`);
    }
  }, [shortcuts]);
  
  useEffect(() => {
    // 只在桌面版 Web 啟用
    if (!isDesktopWeb()) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // 檢查是否在輸入框中
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // 尋找匹配的快捷鍵
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatch = s.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const altMatch = s.alt ? event.altKey : !event.altKey;
        const shiftMatch = s.shift ? event.shiftKey : !event.shiftKey;
        
        return keyMatch && ctrlMatch && altMatch && shiftMatch;
      });
      
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, navigation, mode]);
  
  return {
    shortcuts,
    showKeyboardShortcutsHelp };
};

// 匯出快捷鍵列表供其他元件使用
export const getKeyboardShortcuts = (): ShortcutConfig[] => [
  {
    key: 'h',
    ctrl: true,
    description: '回到首頁',
    action: () => {} },
  {
    key: 'd',
    ctrl: true,
    description: '開啟客戶資料庫',
    action: () => {} },
  {
    key: 'n',
    ctrl: true,
    description: '新增客戶',
    action: () => {} },
  {
    key: 't',
    ctrl: true,
    description: '開啟任務列表',
    action: () => {} },
  {
    key: 'a',
    ctrl: true,
    shift: true,
    description: '新增任務',
    action: () => {} },
  {
    key: 'm',
    ctrl: true,
    description: '切換主管/業務模式',
    action: () => {} },
  {
    key: '/',
    ctrl: true,
    description: '顯示快捷鍵說明',
    action: () => {} },
  {
    key: 'Escape',
    description: '返回上一頁',
    action: () => {} },
];