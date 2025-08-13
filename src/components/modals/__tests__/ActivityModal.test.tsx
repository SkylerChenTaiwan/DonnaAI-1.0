/**
 * 活動詳情彈窗測試
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ActivityModal } from '../ActivityModal';
import { User } from '../../../types/user';
import { getDocs } from 'firebase/firestore';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn() }));

vi.mock('../../../services/firebase', () => ({
  db: {} }));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: jest.fn((date, format) => '2024/01/01 12:00'),
  formatDistanceToNow: jest.fn(() => '5 分鐘前') }));

vi.mock('date-fns/locale', () => ({
  zhTW: {} }));

// Mock ActivityChart
vi.mock('../../personnel/ActivityChart', () => ({
  ActivityChart: ({ data }: { data: number[] }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="activity-chart">
        <Text>{`Chart with ${data.length} data points`}</Text>
      </View>
    );
  } }));

describe('ActivityModal', () => {
  const mockUser: User & {
    isOnline?: boolean;
    lastActiveAt?: Date;
    activityStats?: any;
  } = {
    id: 'test-user-1',
    email: 'test@example.com',
    displayName: '測試使用者',
    role: 'salesperson',
    organizationId: 'org-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    isOnline: true,
    lastActiveAt: new Date(),
    activityStats: {
      dailyLogins: [1, 2, 0, 3, 1, 2, 0, 1, 2, 3],
      totalActions: 150,
      lastActions: ['login', 'view', 'create'] } };

  const mockOnClose = vi.fn();

  const defaultProps = {
    visible: true,
    user: mockUser,
    onClose: mockOnClose };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDocs as jest.Mock).mockResolvedValue({
      forEach: jest.fn((callback) => {
        // Mock 活動日誌
        [
          {
            id: 'log-1',
            data: () => ({
              action: 'login',
              timestamp: { toDate: () => new Date() },
              details: '使用者登入',
              module: 'auth' }) },
          {
            id: 'log-2',
            data: () => ({
              action: 'create',
              timestamp: { toDate: () => new Date() },
              details: '建立新客戶',
              module: 'customers' }) },
        ].forEach(callback);
      }) });
  });

  it('應該正確顯示使用者資訊', () => {
    const { getByText } = render(<ActivityModal {...defaultProps} />);
    
    expect(getByText('活動詳情')).toBeTruthy();
    expect(getByText('測試使用者')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('應該顯示標籤切換', () => {
    const { getByText } = render(<ActivityModal {...defaultProps} />);
    
    expect(getByText('總覽')).toBeTruthy();
    expect(getByText('活動日誌')).toBeTruthy();
  });

  it('總覽標籤應該顯示狀態資訊', () => {
    const { getByText } = render(<ActivityModal {...defaultProps} />);
    
    expect(getByText('線上')).toBeTruthy();
    expect(getByText('5 分鐘前')).toBeTruthy();
    expect(getByText('150')).toBeTruthy(); // 總操作次數
    expect(getByText('總操作次數')).toBeTruthy();
  });

  it('應該顯示活動圖表', () => {
    const { getByTestId } = render(<ActivityModal {...defaultProps} />);
    
    expect(getByTestId('activity-chart')).toBeTruthy();
  });

  it('切換到活動日誌標籤應該顯示日誌', async () => {
    const { getByText } = render(<ActivityModal {...defaultProps} />);
    
    // 切換到活動日誌
    fireEvent.press(getByText('活動日誌'));
    
    await waitFor(() => {
      expect(getByText('login')).toBeTruthy();
      expect(getByText('使用者登入')).toBeTruthy();
      expect(getByText('create')).toBeTruthy();
      expect(getByText('建立新客戶')).toBeTruthy();
    });
  });

  it('離線使用者應該顯示正確狀態', () => {
    const offlineUser = {
      ...mockUser,
      isOnline: false };
    
    const { getByText } = render(
      <ActivityModal {...defaultProps} user={offlineUser} />
    );
    
    expect(getByText('離線')).toBeTruthy();
  });

  it('沒有活動記錄時應該顯示空狀態', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: vi.fn() });
    
    const { getByText } = render(<ActivityModal {...defaultProps} />);
    
    // 切換到活動日誌
    fireEvent.press(getByText('活動日誌'));
    
    await waitFor(() => {
      expect(getByText('暫無活動記錄')).toBeTruthy();
    });
  });

  it('點擊關閉按鈕應該關閉彈窗', () => {
    const { getByTestId } = render(<ActivityModal {...defaultProps} />);
    
    // 假設關閉按鈕有 testID
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('載入失敗應該處理錯誤', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('載入失敗'));
    
    const { getByText } = render(<ActivityModal {...defaultProps} />);
    
    // 切換到活動日誌
    fireEvent.press(getByText('活動日誌'));
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('載入活動日誌失敗:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('沒有統計資料時應該顯示預設值', () => {
    const userWithoutStats = {
      ...mockUser,
      activityStats: undefined };
    
    const { getByText } = render(
      <ActivityModal {...defaultProps} user={userWithoutStats} />
    );
    
    expect(getByText('0')).toBeTruthy(); // 總操作次數為 0
  });
});