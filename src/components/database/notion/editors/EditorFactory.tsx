/**
 * 編輯器工廠 - 根據欄位類型建立對應的編輯器
 */

import React from 'react';
import { TextEditor } from './TextEditor';
import { NumberEditor } from './NumberEditor';
import { DateEditor } from './DateEditor';
import { SelectEditor } from './SelectEditor';
import { MultiSelectEditor } from './MultiSelectEditor';
import { CheckboxEditor } from './CheckboxEditor';
// import { UrlEditor } from './UrlEditor';
// import { EmailEditor } from './EmailEditor';
// import { PhoneEditor } from './PhoneEditor';
import { EditorProps } from './types';

export const EditorFactory = {
  createEditor: (type: string, props: EditorProps) => {
    switch (type) {
      case 'text':
        return <TextEditor {...props} />;
      case 'number':
        return <NumberEditor {...props} />;
      case 'date':
        return <DateEditor {...props} />;
      case 'select':
        return <SelectEditor {...props} />;
      case 'multi_select':
        return <MultiSelectEditor {...props} />;
      case 'checkbox':
        return <CheckboxEditor {...props} />;
      case 'url':
        return <TextEditor {...props} />; // 暫時使用 TextEditor
      case 'email':
        return <TextEditor {...props} />; // 暫時使用 TextEditor
      case 'phone':
        return <TextEditor {...props} />; // 暫時使用 TextEditor
      default:
        return <TextEditor {...props} />;
    }
  },
  
  getEditorType: (columnType: string): string => {
    // 返回對應的編輯器類型
    const typeMap: Record<string, string> = {
      text: 'text',
      title: 'text',
      number: 'number',
      date: 'date',
      select: 'select',
      multi_select: 'multi_select',
      checkbox: 'checkbox',
      url: 'url',
      email: 'email',
      phone: 'phone',
      status: 'select',
      priority: 'select',
      person: 'select',
      relation: 'select',
    };
    
    return typeMap[columnType] || 'text';
  }
};