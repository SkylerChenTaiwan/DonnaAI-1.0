/**
 * 資料庫頁面測試
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DatabaseScreen } from '../DatabaseScreen';
import { NavigationContainer } from '@react-navigation/native';
import { describe, it, expect, vi } from 'vitest';

// Mock 相依套件
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
  },
}));

vi.mock('expo-file-system', () => ({
  documentDirectory: '/mock/',
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

vi.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

vi.mock('expo-mail-composer', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  composeAsync: jest.fn(() => Promise.resolve()),
}));

// Mock stores
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      teamIds: ['team1'],
    },
  }),
}));

vi.mock('@/stores/customerStore', () => ({
  useCustomerStore: () => ({
    customers: [
      { id: '1', name: '測試客戶 1', company: '公司 A', phone: '0912345678', tags: ['VIP'] },
      { id: '2', name: '測試客戶 2', company: '公司 B', phone: '0987654321', tags: [] },
    ],
    isLoading: false,
    fetchCustomers: vi.fn(),
  }),
}));

vi.mock('@/stores/recordStore', () => ({
  useRecordStore: () => ({
    records: [
      { 
        id: '1', 
        type: 'meeting', 
        customerIds: ['1'], 
        createdAt: { seconds: Date.now() / 1000 },
        aiSummary: '會議摘要',
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      {
        id: '1',
        title: '測試任務',
        assigneeId: 'user1',
        dueDate: { seconds: Date.now() / 1000 },
        status: 'todo',
      },
    ],
    isLoading: false,
  }),
}));

describe('DatabaseScreen', () => {
  const renderScreen = () => {
    return render(
      <NavigationContainer>
        <DatabaseScreen />
      </NavigationContainer>
    );
  };

  it('應該正確渲染所有 Tab', () => {
    const { getByText } = renderScreen();
    
    expect(getByText('客戶')).toBeTruthy();
    expect(getByText('紀錄')).toBeTruthy();
    expect(getByText('任務')).toBeTruthy();
  });

  it('應該顯示客戶資料', () => {
    const { getByText } = renderScreen();
    
    expect(getByText('測試客戶 1')).toBeTruthy();
    expect(getByText('測試客戶 2')).toBeTruthy();
  });

  it('點擊篩選按鈕應該顯示篩選 Modal', () => {
    const { getByTestId, getByText } = renderScreen();
    
    // 找到並點擊篩選按鈕
    const filterButton = getByTestId('filter-button');
    fireEvent.press(filterButton);
    
    // 檢查 Modal 是否顯示
    expect(getByText('篩選')).toBeTruthy();
    expect(getByText('新增篩選條件')).toBeTruthy();
  });

  it('點擊排序按鈕應該顯示排序 Modal', () => {
    const { getByTestId, getByText } = renderScreen();
    
    // 找到並點擊排序按鈕
    const sortButton = getByTestId('sort-button');
    fireEvent.press(sortButton);
    
    // 檢查 Modal 是否顯示
    expect(getByText('排序')).toBeTruthy();
    expect(getByText('選擇排序欄位')).toBeTruthy();
  });

  it('多選模式應該正常運作', () => {
    const { getByTestId, queryByText } = renderScreen();
    
    // 點擊多選按鈕
    const multiSelectButton = getByTestId('multi-select-button');
    fireEvent.press(multiSelectButton);
    
    // 檢查是否進入多選模式
    // 在多選模式下，應該顯示勾選框
    expect(queryByText('已選擇 0 個項目')).toBeTruthy();
  });

  it('點擊欄位設定按鈕應該顯示欄位設定 Modal', () => {
    const { getByTestId, getByText } = renderScreen();
    
    // 找到並點擊欄位設定按鈕
    const columnsButton = getByTestId('columns-button');
    fireEvent.press(columnsButton);
    
    // 檢查 Modal 是否顯示
    expect(getByText('欄位設定')).toBeTruthy();
    expect(getByText('選擇要顯示的欄位')).toBeTruthy();
  });

  it('切換 Tab 應該清除選擇狀態', () => {
    const { getByText, getByTestId, queryByText } = renderScreen();
    
    // 進入多選模式
    const multiSelectButton = getByTestId('multi-select-button');
    fireEvent.press(multiSelectButton);
    
    // 切換到紀錄 Tab
    fireEvent.press(getByText('紀錄'));
    
    // 多選模式應該被關閉
    // 可以通過檢查多選按鈕的狀態來確認
    expect(queryByText('已選擇 0 個項目')).toBeFalsy();
  });
});