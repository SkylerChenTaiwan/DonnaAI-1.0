/**
 * 欄位順序管理 Hook - 持久化儲存使用者自訂的欄位順序
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { TableColumn } from '@/types/table';

interface UseColumnOrderReturn {
  getOrderedColumns: (columns: TableColumn[]) => TableColumn[];
  saveColumnOrder: (newOrder: string[]) => Promise<void>;
  resetColumnOrder: () => Promise<void>;
}

export function useColumnOrder(tableKey: string, defaultColumns: TableColumn[]): UseColumnOrderReturn {
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const storageKey = `column_order_${tableKey}`;

  useEffect(() => {
    loadColumnOrder();
  }, [tableKey]);

  const loadColumnOrder = async () => {
    try {
      let savedOrder: string | null = null;
      
      if (Platform.OS === 'web') {
        savedOrder = localStorage.getItem(storageKey);
      } else {
        savedOrder = await AsyncStorage.getItem(storageKey);
      }
      
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        // 驗證儲存的順序是否為有效的字串陣列
        if (Array.isArray(parsedOrder) && parsedOrder.every(item => typeof item === 'string')) {
          setColumnOrder(parsedOrder);
        } else {
          // 如果資料格式不正確，使用預設順序
          setColumnOrder(defaultColumns.map(col => col.key));
        }
      } else {
        setColumnOrder(defaultColumns.map(col => col.key));
      }
    } catch (error) {
      console.error('Error loading column order:', error);
      setColumnOrder(defaultColumns.map(col => col.key));
    }
  };

  const saveColumnOrder = useCallback(async (newOrder: string[]) => {
    try {
      const orderString = JSON.stringify(newOrder);
      
      if (Platform.OS === 'web') {
        localStorage.setItem(storageKey, orderString);
      } else {
        await AsyncStorage.setItem(storageKey, orderString);
      }
      
      setColumnOrder(newOrder);
    } catch (error) {
      console.error('Error saving column order:', error);
      throw error;
    }
  }, [storageKey]);

  const resetColumnOrder = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(storageKey);
      } else {
        await AsyncStorage.removeItem(storageKey);
      }
      
      const defaultOrder = defaultColumns.map(col => col.key);
      setColumnOrder(defaultOrder);
    } catch (error) {
      console.error('Error resetting column order:', error);
      throw error;
    }
  }, [storageKey, defaultColumns]);

  // 根據儲存的順序重新排序欄位
  const getOrderedColumns = useCallback((columns: TableColumn[]): TableColumn[] => {
    if (columnOrder.length === 0) return columns;
    
    const orderedColumns: TableColumn[] = [];
    const columnMap = new Map(columns.map(col => [col.key, col]));
    
    // 先加入已儲存順序的欄位
    columnOrder.forEach(key => {
      const col = columnMap.get(key);
      if (col) {
        orderedColumns.push(col);
        columnMap.delete(key);
      }
    });
    
    // 加入新欄位（未在儲存順序中的）
    // 這確保新增的欄位不會消失
    columnMap.forEach(col => {
      orderedColumns.push(col);
    });
    
    return orderedColumns;
  }, [columnOrder]);

  return {
    getOrderedColumns,
    saveColumnOrder,
    resetColumnOrder };
}