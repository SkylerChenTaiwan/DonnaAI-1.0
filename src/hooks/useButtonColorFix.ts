/**
 * 修復按鈕顏色的 Hook
 * 在組件載入時自動修復按鈕顏色
 */
import { useEffect } from 'react';
import { Platform } from 'react-native';

export const useButtonColorFix = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    // 修復所有按鈕的顏色
    const fixButtonColors = () => {
      const buttons = document.querySelectorAll('button');
      
      buttons.forEach(button => {
        const bgColor = window.getComputedStyle(button).backgroundColor;
        
        // 根據背景色設定文字顏色
        if (bgColor === 'rgb(0, 122, 255)' || bgColor === '#007AFF') {
          button.style.color = '#FFFFFF';
          // 修復所有子元素
          button.querySelectorAll('*').forEach(child => {
            (child as HTMLElement).style.color = '#FFFFFF';
          });
        } else if (bgColor === 'rgb(242, 242, 247)' || bgColor === '#F2F2F7') {
          button.style.color = '#000000';
          button.querySelectorAll('*').forEach(child => {
            (child as HTMLElement).style.color = '#000000';
          });
        }
      });
    };
    
    // 初始修復
    fixButtonColors();
    
    // 監聽 DOM 變化
    const observer = new MutationObserver(fixButtonColors);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => observer.disconnect();
  }, []);
};
