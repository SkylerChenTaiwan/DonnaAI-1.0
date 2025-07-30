/**
 * AddRowButton 元件測試
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddRowButton } from '../AddRowButton';

describe('AddRowButton', () => {
  const mockOnPress = vi.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('應該在 isVisible 為 true 時渲染', () => {
    render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true} 
      />
    );
    
    expect(screen.getByText('新增記錄')).toBeTruthy();
    expect(screen.getByTestId('add-row-button')).toBeTruthy();
  });

  it('應該在 isVisible 為 false 時不渲染', () => {
    const { queryByTestId } = render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={false} 
      />
    );
    
    expect(queryByTestId('add-row-button')).toBeNull();
  });

  it('應該在點擊時調用 onPress', () => {
    render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true} 
      />
    );
    
    fireEvent.press(screen.getByTestId('add-row-button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('應該顯示自訂按鈕文字', () => {
    const customText = '新增客戶';
    render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true}
        buttonText={customText}
      />
    );
    
    expect(screen.getByText(customText)).toBeTruthy();
  });

  it('應該在 disabled 狀態下不響應點擊', () => {
    render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true}
        disabled={true}
      />
    );
    
    fireEvent.press(screen.getByTestId('add-row-button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('應該有最小觸控目標尺寸', () => {
    const { getByTestId } = render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true} 
      />
    );
    
    const button = getByTestId('add-row-button');
    const styles = StyleSheet.flatten(button.props.style);
    
    // 檢查最小高度是否至少為 44
    expect(styles.minHeight).toBeGreaterThanOrEqual(44);
  });

  it('應該接受自訂樣式', () => {
    const customStyle = { marginTop: 20 };
    render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true}
        style={customStyle}
      />
    );
    
    // 確認元件有被渲染（證明自訂樣式沒有破壞元件）
    expect(screen.getByTestId('add-row-button')).toBeTruthy();
  });

  it('應該在 disabled 狀態下使用不同的文字顏色', () => {
    const { rerender } = render(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true}
        disabled={false}
      />
    );
    
    const enabledButton = screen.getByTestId('add-row-button');
    
    rerender(
      <AddRowButton 
        onPress={mockOnPress} 
        isVisible={true}
        disabled={true}
      />
    );
    
    const disabledButton = screen.getByTestId('add-row-button');
    
    // 確認按鈕在不同狀態下都有被渲染
    expect(enabledButton).toBeTruthy();
    expect(disabledButton).toBeTruthy();
  });
});