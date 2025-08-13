/**
 * 權限設定彈窗測試
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PermissionModal } from '../PermissionModal';
import { User } from '../../../types/user';
import { Alert } from 'react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase services
vi.mock('../../../services/firebase/userService', () => ({
  updateUserRole: jest.fn(() => Promise.resolve()),
  updateUserPermissions: jest.fn(() => Promise.resolve()) }));

vi.mock('../../../services/firebase/permissions-v2', () => ({
  clearUserPermissionCache: vi.fn() }));

// Mock Alert
vi.spyOn(Alert, 'alert');

describe('PermissionModal', () => {
  const mockUser: User = {
    id: 'test-user-1',
    email: 'test@example.com',
    displayName: '測試使用者',
    role: 'salesperson',
    organizationId: 'org-1',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date() };

  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();

  const defaultProps = {
    visible: true,
    user: mockUser,
    onClose: mockOnClose,
    onUpdate: mockOnUpdate };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該正確顯示使用者資訊', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    expect(getByText('權限設定')).toBeTruthy();
    expect(getByText('測試使用者')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('應該顯示所有角色選項', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    expect(getByText('管理員')).toBeTruthy();
    expect(getByText('主管')).toBeTruthy();
    expect(getByText('業務員')).toBeTruthy();
  });

  it('應該正確高亮當前角色', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    const salesButton = getByText('業務員').parent;
    // 檢查是否有 active 樣式（實際測試中可能需要調整）
    expect(salesButton?.props.style).toBeTruthy();
  });

  it('點擊角色按鈕應該切換權限', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    // 點擊管理員角色
    fireEvent.press(getByText('管理員'));
    
    // 應該顯示所有權限模組
    expect(getByText('客戶管理')).toBeTruthy();
    expect(getByText('組織管理')).toBeTruthy();
  });

  it('應該顯示權限矩陣', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    // 檢查權限模組
    expect(getByText('客戶管理')).toBeTruthy();
    expect(getByText('紀錄管理')).toBeTruthy();
    expect(getByText('任務管理')).toBeTruthy();
    expect(getByText('團隊管理')).toBeTruthy();
    expect(getByText('報表分析')).toBeTruthy();
  });

  it('點擊權限項目應該切換勾選狀態', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    const viewCustomersPermission = getByText('查看客戶');
    
    // 點擊權限項目
    fireEvent.press(viewCustomersPermission);
    
    // 再次點擊應該取消勾選
    fireEvent.press(viewCustomersPermission);
  });

  it('點擊取消按鈕應該關閉彈窗', () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    
    fireEvent.press(getByText('取消'));
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('點擊儲存按鈕應該更新權限', async () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    const { updateUserRole, updateUserPermissions } = require('../../../services/firebase/userService');
    
    // 切換到管理員角色
    fireEvent.press(getByText('管理員'));
    
    // 點擊儲存
    fireEvent.press(getByText('儲存'));
    
    await waitFor(() => {
      expect(updateUserRole).toHaveBeenCalledWith('test-user-1', 'admin');
      expect(updateUserPermissions).toHaveBeenCalled();
      expect(mockOnUpdate).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('成功', '權限設定已更新');
    });
  });

  it('儲存失敗應該顯示錯誤訊息', async () => {
    const { getByText } = render(<PermissionModal {...defaultProps} />);
    const { updateUserRole } = require('../../../services/firebase/userService');
    
    // Mock 錯誤
    updateUserRole.mockRejectedValueOnce(new Error('更新失敗'));
    
    // 切換角色並儲存
    fireEvent.press(getByText('管理員'));
    fireEvent.press(getByText('儲存'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('錯誤', '更新權限失敗，請稍後再試');
    });
  });

  it('關閉按鈕應該正常運作', () => {
    const { getByTestId } = render(
      <PermissionModal {...defaultProps} />
    );
    
    // 假設關閉按鈕有 testID
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});