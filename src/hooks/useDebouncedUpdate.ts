/**
 * Debounced 更新 Hook - 用於延遲批次更新以避免過多的 Firebase 呼叫
 */

import { useRef, useCallback } from 'react';

export function useDebouncedUpdate(
  updateFn: (rowId: string, columnKey: string, value: any) => Promise<void>,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<Map<string, any>>(new Map());

  const debouncedUpdate = useCallback((rowId: string, columnKey: string, value: any) => {
    // 儲存待更新的值
    const key = `${rowId}_${columnKey}`;
    pendingUpdates.current.set(key, { rowId, columnKey, value });

    // 清除之前的計時器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 設定新的計時器
    timeoutRef.current = setTimeout(async () => {
      // 執行所有待更新的項目
      const updates = Array.from(pendingUpdates.current.values());
      pendingUpdates.current.clear();

      // 批次執行更新
      for (const update of updates) {
        try {
          await updateFn(update.rowId, update.columnKey, update.value);
        } catch (error) {
          console.error('更新失敗:', error);
        }
      }
    }, delay);
  }, [updateFn, delay]);

  // 清理函數
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pendingUpdates.current.clear();
  }, []);

  return { debouncedUpdate, cleanup };
}