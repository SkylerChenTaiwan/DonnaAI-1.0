/**
 * 核取方塊編輯器 - 立即切換狀態
 */

import React, { useEffect } from 'react';
import { EditorProps } from './types';

export const CheckboxEditor: React.FC<EditorProps> = ({
  value,
  onChange,
  onBlur,
  column }) => {
  useEffect(() => {
    // 核取方塊立即切換狀態
    onChange(!value);
    onBlur();
  }, [value, onChange, onBlur]);

  return null; // 核取方塊不需要顯示編輯器
};