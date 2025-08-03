/**
 * 簡化版欄位寬度調整器 - 只負責渲染 UI
 */

import React from 'react';
import { Platform } from 'react-native';

export interface ColumnResizerSimpleProps {
  columnId: string;
}

export const ColumnResizerSimple: React.FC<ColumnResizerSimpleProps> = ({ columnId }) => {
  if (Platform.OS !== 'web') {
    return null;
  }
  
  return React.createElement('div', {
    className: 'notion-column-resizer',
    'data-column-id': columnId
  });
};