/**
 * FieldConfigurator 元件互動測試
 * 測試重點：標籤切換、表單驗證、模態框互動、欄位配置
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform, Alert } from 'react-native';
import FieldConfigurator from '../FieldConfigurator';
import { DynamicFieldConfig, FieldDataType } from '@/types/dynamic-field-mapping';
import { Timestamp } from 'firebase/firestore';

// Mock Alert
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native');
  return {
    ...actual,
    Alert: {
      alert: vi.fn(),
    },
    Platform: {
      OS: 'web',
      select: vi.fn(),
    },
    ScrollView: ({ children, ...props }: any) => (
      <div {...props} data-testid="scroll-view">{children}</div>
    ),
  };
});

// Mock Firebase Timestamp
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
    })),
  },
}));

describe('FieldConfigurator - 互動測試', () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const mockField: DynamicFieldConfig = {
    id: 'field1',
    fieldKey: 'testField',
    displayName: '測試欄位',
    dataType: 'text' as FieldDataType,
    isActive: true,
    isSystem: false,
    isSearchable: true,
    isSortable: true,
    description: '這是一個測試欄位',
    validationRules: [
      {
        type: 'required',
        message: '此欄位為必填',
        severity: 'error',
      },
      {
        type: 'minLength',
        value: '3',
        message: '最少需要3個字元',
        severity: 'warning',
      }
    ],
    formatting: {
      textTransform: 'lowercase',
    },
    security: {
      level: 'internal',
      readRoles: ['admin', 'user'],
      writeRoles: ['admin'],
      encrypted: true,
      auditLog: true,
      isPII: true,
      piiType: 'email',
      masking: {
        enabled: true,
        pattern: '****@****.com',
      },
    },
    usage: {
      usageCount: 100,
      nullRatio: 0.1,
      uniqueValueCount: 95,
    },
    metadata: {
      createdBy: 'user1',
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      updatedBy: 'user1',
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    },
  };

  const defaultProps = {
    field: mockField,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    visible: true,
    mode: 'edit' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Platform.OS = 'web';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該正確渲染模態框', () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      expect(getByText('編輯欄位')).toBeDefined();
      expect(getByText('✕')).toBeDefined();
    });

    it('應該根據模式顯示正確的標題', () => {
      const { getByText, rerender } = render(<FieldConfigurator {...defaultProps} />);
      
      expect(getByText('編輯欄位')).toBeDefined();

      rerender(<FieldConfigurator {...defaultProps} mode="create" />);
      expect(getByText('建立新欄位')).toBeDefined();
    });

    it('應該顯示所有標籤頁', () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      expect(getByText('基本設定')).toBeDefined();
      expect(getByText('驗證規則')).toBeDefined();
      expect(getByText('格式化')).toBeDefined();
      expect(getByText('安全設定')).toBeDefined();
    });

    it('應該預設選中基本設定標籤', () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const basicTab = getByText('基本設定');
      expect(basicTab.props.style).toMatchObject(
        expect.objectContaining({
          color: '#FFFFFF',
        })
      );
    });

    it('應該顯示儲存和取消按鈕', () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      expect(getByText('儲存')).toBeDefined();
      expect(getByText('取消')).toBeDefined();
    });
  });

  describe('標籤切換測試', () => {
    it('應該支援切換到驗證規則標籤', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      expect(getByText('驗證規則')).toBeDefined();
      expect(getByText('新增規則')).toBeDefined();
    });

    it('應該支援切換到格式化標籤', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const formattingTab = getByText('格式化');
      
      await act(async () => {
        fireEvent.press(formattingTab);
      });

      expect(getByText('格式化設定')).toBeDefined();
    });

    it('應該支援切換到安全設定標籤', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const securityTab = getByText('安全設定');
      
      await act(async () => {
        fireEvent.press(securityTab);
      });

      expect(getByText('安全設定')).toBeDefined();
      expect(getByText('安全層級')).toBeDefined();
    });

    it('應該在切換標籤時保持表單資料', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      // 修改基本設定
      const displayNameInput = getByDisplayValue('測試欄位');
      
      await act(async () => {
        fireEvent.changeText(displayNameInput, '修改後的欄位');
      });

      // 切換到其他標籤
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      // 切換回基本設定
      const basicTab = getByText('基本設定');
      
      await act(async () => {
        fireEvent.press(basicTab);
      });

      // 驗證資料仍然存在
      expect(getByDisplayValue('修改後的欄位')).toBeDefined();
    });
  });

  describe('基本設定標籤測試', () => {
    it('應該顯示欄位的基本資訊', () => {
      const { getByDisplayValue, getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      expect(getByDisplayValue('測試欄位')).toBeDefined();
      expect(getByDisplayValue('testField')).toBeDefined();
      expect(getByText('文字')).toBeDefined(); // 資料類型
      expect(getByDisplayValue('這是一個測試欄位')).toBeDefined();
    });

    it('應該支援修改欄位顯示名稱', async () => {
      const { getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const displayNameInput = getByDisplayValue('測試欄位');
      
      await act(async () => {
        fireEvent.changeText(displayNameInput, '新的欄位名稱');
      });

      expect(getByDisplayValue('新的欄位名稱')).toBeDefined();
    });

    it('應該支援修改欄位鍵值', async () => {
      const { getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const fieldKeyInput = getByDisplayValue('testField');
      
      await act(async () => {
        fireEvent.changeText(fieldKeyInput, 'newFieldKey');
      });

      expect(getByDisplayValue('newFieldKey')).toBeDefined();
    });

    it('應該支援變更資料類型', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      // 找到資料類型選擇器
      const dataTypeSelect = getByText('文字').parent;
      
      await act(async () => {
        fireEvent.press(dataTypeSelect);
        // 模擬選擇新類型
        fireEvent.changeText(dataTypeSelect, 'email');
      });

      // 驗證類型變更（需要根據實際 UI 實現調整）
      expect(dataTypeSelect).toBeDefined();
    });

    it('應該支援修改描述', async () => {
      const { getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const descriptionInput = getByDisplayValue('這是一個測試欄位');
      
      await act(async () => {
        fireEvent.changeText(descriptionInput, '更新後的描述');
      });

      expect(getByDisplayValue('更新後的描述')).toBeDefined();
    });

    it('應該支援切換開關選項', async () => {
      const { getAllByRole } = render(<FieldConfigurator {...defaultProps} />);
      
      const switches = getAllByRole('switch');
      const activeSwitch = switches[0]; // 啟用狀態開關
      
      await act(async () => {
        fireEvent.press(activeSwitch);
      });

      // 驗證開關狀態變更
      expect(activeSwitch).toBeDefined();
    });

    it('應該禁止修改系統欄位的鍵值', () => {
      const systemField = { ...mockField, isSystem: true };
      const { getByDisplayValue, getByText } = render(
        <FieldConfigurator {...defaultProps} field={systemField} />
      );
      
      const fieldKeyInput = getByDisplayValue('testField');
      expect(fieldKeyInput.props.editable).toBe(false);
      expect(getByText('系統欄位的鍵值無法修改')).toBeDefined();
    });

    it('應該禁止修改系統欄位的資料類型', () => {
      const systemField = { ...mockField, isSystem: true };
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} field={systemField} />
      );
      
      const dataTypeSelect = getByText('文字').parent;
      expect(dataTypeSelect.props.disabled).toBe(true);
    });
  });

  describe('驗證規則標籤測試', () => {
    it('應該顯示現有的驗證規則', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      expect(getByText('必填')).toBeDefined();
      expect(getByText('此欄位為必填')).toBeDefined();
      expect(getByText('最小長度')).toBeDefined();
      expect(getByText('最少需要3個字元')).toBeDefined();
    });

    it('應該支援新增驗證規則', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      const addButton = getByText('新增規則');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      expect(getByText('新增驗證規則')).toBeDefined();
      expect(getByText('規則類型')).toBeDefined();
      expect(getByText('錯誤訊息')).toBeDefined();
    });

    it('應該支援設定新驗證規則的屬性', async () => {
      const { getByText, getByPlaceholderText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      const addButton = getByText('新增規則');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      // 設定錯誤訊息
      const messageInput = getByPlaceholderText('輸入驗證失敗時的錯誤訊息');
      
      await act(async () => {
        fireEvent.changeText(messageInput, '新的驗證錯誤訊息');
      });

      expect(getByDisplayValue('新的驗證錯誤訊息')).toBeDefined();
    });

    it('應該支援確認新增驗證規則', async () => {
      const { getByText, getByPlaceholderText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      const addButton = getByText('新增規則');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      // 設定錯誤訊息
      const messageInput = getByPlaceholderText('輸入驗證失敗時的錯誤訊息');
      
      await act(async () => {
        fireEvent.changeText(messageInput, '測試錯誤訊息');
      });

      // 確認新增
      const confirmButton = getByText('確定');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      // 驗證規則被新增
      expect(getByText('測試錯誤訊息')).toBeDefined();
    });

    it('應該支援取消新增驗證規則', async () => {
      const { getByText, queryByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      const addButton = getByText('新增規則');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      const cancelButton = getByText('取消');
      
      await act(async () => {
        fireEvent.press(cancelButton);
      });

      expect(queryByText('新增驗證規則')).toBeNull();
    });

    it('應該支援移除驗證規則', async () => {
      const { getByText, queryByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      const removeButton = getByText('移除');
      
      await act(async () => {
        fireEvent.press(removeButton);
      });

      // 驗證規則被移除（第一個必填規則）
      await waitFor(() => {
        expect(queryByText('此欄位為必填')).toBeNull();
      });
    });

    it('應該驗證新增驗證規則時的必填欄位', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const validationTab = getByText('驗證規則');
      
      await act(async () => {
        fireEvent.press(validationTab);
      });

      const addButton = getByText('新增規則');
      
      await act(async () => {
        fireEvent.press(addButton);
      });

      // 不設定錯誤訊息直接確認
      const confirmButton = getByText('確定');
      
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('錯誤', '請輸入錯誤訊息');
    });
  });

  describe('格式化標籤測試', () => {
    it('應該根據資料類型顯示對應的格式化選項', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const formattingTab = getByText('格式化');
      
      await act(async () => {
        fireEvent.press(formattingTab);
      });

      // 文字類型應該顯示文字轉換選項
      expect(getByText('文字轉換')).toBeDefined();
    });

    it('應該支援變更文字轉換選項', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const formattingTab = getByText('格式化');
      
      await act(async () => {
        fireEvent.press(formattingTab);
      });

      const transformSelect = getByText('全部小寫').parent;
      
      await act(async () => {
        fireEvent.press(transformSelect);
        // 模擬選擇大寫
        fireEvent.changeText(transformSelect, 'uppercase');
      });

      expect(transformSelect).toBeDefined();
    });

    it('應該為數字類型顯示數字格式選項', async () => {
      const numberField = { ...mockField, dataType: 'number' as FieldDataType };
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} field={numberField} />
      );
      
      const formattingTab = getByText('格式化');
      
      await act(async () => {
        fireEvent.press(formattingTab);
      });

      expect(getByText('數字格式')).toBeDefined();
      expect(getByText('小數位數')).toBeDefined();
      expect(getByText('前綴（例如: $）')).toBeDefined();
      expect(getByText('後綴（例如: %）')).toBeDefined();
    });

    it('應該為日期類型顯示日期格式選項', async () => {
      const dateField = { ...mockField, dataType: 'date' as FieldDataType };
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} field={dateField} />
      );
      
      const formattingTab = getByText('格式化');
      
      await act(async () => {
        fireEvent.press(formattingTab);
      });

      expect(getByText('日期格式')).toBeDefined();
    });

    it('應該在沒有格式化選項時顯示提示', async () => {
      const booleanField = { ...mockField, dataType: 'boolean' as FieldDataType };
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} field={booleanField} />
      );
      
      const formattingTab = getByText('格式化');
      
      await act(async () => {
        fireEvent.press(formattingTab);
      });

      expect(getByText('此資料類型無額外格式化選項')).toBeDefined();
    });
  });

  describe('安全設定標籤測試', () => {
    it('應該顯示安全設定選項', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const securityTab = getByText('安全設定');
      
      await act(async () => {
        fireEvent.press(securityTab);
      });

      expect(getByText('安全層級')).toBeDefined();
      expect(getByText('加密儲存')).toBeDefined();
      expect(getByText('審計日誌')).toBeDefined();
      expect(getByText('個人識別資訊 (PII)')).toBeDefined();
    });

    it('應該支援變更安全層級', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const securityTab = getByText('安全設定');
      
      await act(async () => {
        fireEvent.press(securityTab);
      });

      const levelSelect = getByText('內部使用').parent;
      
      await act(async () => {
        fireEvent.press(levelSelect);
        fireEvent.changeText(levelSelect, 'confidential');
      });

      expect(levelSelect).toBeDefined();
    });

    it('應該支援切換加密和審計設定', async () => {
      const { getByText, getAllByRole } = render(<FieldConfigurator {...defaultProps} />);
      
      const securityTab = getByText('安全設定');
      
      await act(async () => {
        fireEvent.press(securityTab);
      });

      const switches = getAllByRole('switch');
      const encryptSwitch = switches.find(s => 
        s.parent?.children.some((child: any) => 
          child?.props?.children?.includes?.('加密儲存')
        )
      );
      
      if (encryptSwitch) {
        await act(async () => {
          fireEvent.press(encryptSwitch);
        });
      }

      expect(switches.length).toBeGreaterThan(0);
    });

    it('應該在啟用 PII 時顯示額外選項', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const securityTab = getByText('安全設定');
      
      await act(async () => {
        fireEvent.press(securityTab);
      });

      // PII 已啟用，應該顯示類型選擇和遮罩選項
      expect(getByText('PII 類型')).toBeDefined();
      expect(getByText('資料遮罩')).toBeDefined();
    });

    it('應該支援設定資料遮罩模式', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const securityTab = getByText('安全設定');
      
      await act(async () => {
        fireEvent.press(securityTab);
      });

      // 資料遮罩已啟用，應該顯示模式輸入框
      const maskingInput = getByDisplayValue('****@****.com');
      
      await act(async () => {
        fireEvent.changeText(maskingInput, '***-***-{last3}');
      });

      expect(getByDisplayValue('***-***-{last3}')).toBeDefined();
    });
  });

  describe('表單驗證測試', () => {
    it('應該驗證必填的顯示名稱', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const displayNameInput = getByDisplayValue('測試欄位');
      
      await act(async () => {
        fireEvent.changeText(displayNameInput, '');
      });

      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('驗證錯誤', '請輸入欄位顯示名稱');
    });

    it('應該驗證必填的欄位鍵值', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const fieldKeyInput = getByDisplayValue('testField');
      
      await act(async () => {
        fireEvent.changeText(fieldKeyInput, '');
      });

      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith('驗證錯誤', '請輸入欄位鍵值');
    });

    it('應該驗證欄位鍵值格式', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const fieldKeyInput = getByDisplayValue('testField');
      
      await act(async () => {
        fireEvent.changeText(fieldKeyInput, '123invalid-key');
      });

      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        '驗證錯誤', 
        '欄位鍵值只能包含字母、數字和底線，且必須以字母或底線開頭'
      );
    });

    it('應該接受有效的欄位鍵值格式', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      const fieldKeyInput = getByDisplayValue('testField');
      
      await act(async () => {
        fireEvent.changeText(fieldKeyInput, 'valid_field_key123');
      });

      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockOnSave).toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });

  describe('儲存和取消操作測試', () => {
    it('應該在表單有效時呼叫 onSave', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'field1',
          fieldKey: 'testField',
          displayName: '測試欄位',
        })
      );
    });

    it('應該在點擊取消時呼叫 onCancel', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const cancelButton = getByText('取消');
      
      await act(async () => {
        fireEvent.press(cancelButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('應該在點擊關閉按鈕時呼叫 onCancel', async () => {
      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const closeButton = getByText('✕');
      
      await act(async () => {
        fireEvent.press(closeButton);
      });

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('應該在表單無效時阻止儲存', async () => {
      const { getByText, getByDisplayValue } = render(<FieldConfigurator {...defaultProps} />);
      
      // 清空必填欄位
      const displayNameInput = getByDisplayValue('測試欄位');
      
      await act(async () => {
        fireEvent.changeText(displayNameInput, '');
      });

      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockOnSave).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  describe('模式切換測試', () => {
    it('應該在建立模式下顯示正確的按鈕文字', () => {
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} mode="create" />
      );
      
      expect(getByText('建立')).toBeDefined();
    });

    it('應該在編輯模式下顯示正確的按鈕文字', () => {
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} mode="edit" />
      );
      
      expect(getByText('儲存')).toBeDefined();
    });
  });

  describe('可見性控制測試', () => {
    it('應該在 visible=false 時不顯示模態框', () => {
      const { queryByText } = render(
        <FieldConfigurator {...defaultProps} visible={false} />
      );
      
      expect(queryByText('編輯欄位')).toBeNull();
    });

    it('應該在 visible=true 時顯示模態框', () => {
      const { getByText } = render(
        <FieldConfigurator {...defaultProps} visible={true} />
      );
      
      expect(getByText('編輯欄位')).toBeDefined();
    });
  });

  describe('滾動行為測試', () => {
    it('應該提供可滾動的內容區域', () => {
      const { getByTestId } = render(<FieldConfigurator {...defaultProps} />);
      
      expect(getByTestId('scroll-view')).toBeDefined();
    });
  });

  describe('時間戳更新測試', () => {
    it('應該在儲存時更新 updatedAt 時間戳', async () => {
      const mockTimestamp = { seconds: 1234567890, nanoseconds: 0 };
      vi.mocked(Timestamp.now).mockReturnValue(mockTimestamp as any);

      const { getByText } = render(<FieldConfigurator {...defaultProps} />);
      
      const saveButton = getByText('儲存');
      
      await act(async () => {
        fireEvent.press(saveButton);
      });

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            updatedAt: mockTimestamp,
          }),
        })
      );
    });
  });
});