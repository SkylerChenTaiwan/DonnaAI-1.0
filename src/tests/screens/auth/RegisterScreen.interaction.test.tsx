/**
 * RegisterScreen 互動測試
 * 測試註冊畫面的所有用戶交互功能
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { signUp } from '@/services/firebase/auth';

// Mock dependencies
jest.mock('@/services/firebase/auth');
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    Alert: {
      alert: jest.fn()
    },
    Platform: {
      OS: 'ios'
    }
  };
});

// Mock adaptive components
jest.mock('@/components/adaptive', () => ({
  AdaptiveButton: ({ title, onPress, loading, testID }: any) => {
    const MockedButton = require('react-native').TouchableOpacity;
    const MockedText = require('react-native').Text;
    const MockedActivityIndicator = require('react-native').ActivityIndicator;
    
    return (
      <MockedButton onPress={onPress} testID={testID} disabled={loading}>
        {loading ? (
          <MockedActivityIndicator testID={`${testID}-loading`} />
        ) : (
          <MockedText>{title}</MockedText>
        )}
      </MockedButton>
    );
  },
  AdaptiveInput: ({ value, onChangeText, placeholder, error, testID }: any) => {
    const MockedTextInput = require('react-native').TextInput;
    const MockedText = require('react-native').Text;
    const MockedView = require('react-native').View;
    
    return (
      <MockedView>
        <MockedTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          testID={testID}
        />
        {error && <MockedText testID={`${testID}-error`}>{error}</MockedText>}
      </MockedView>
    );
  }
}));

jest.mock('@/components/common/Layout', () => ({
  Layout: ({ children }: any) => {
    const MockedView = require('react-native').View;
    return <MockedView testID="layout">{children}</MockedView>;
  }
}));

describe('RegisterScreen 互動測試', () => {
  const mockNavigateToLogin = jest.fn();
  const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 基本渲染測試', () => {
    test('1.1 所有重要元素正確渲染', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      expect(screen.getByText('加入 DonnaAI')).toBeTruthy();
      expect(screen.getByText('開始您的 AI 助理之旅')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的姓名')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的電子郵件')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的公司名稱')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）')).toBeTruthy();
      expect(screen.getByPlaceholderText('請再次輸入密碼')).toBeTruthy();
      expect(screen.getByText('註冊')).toBeTruthy();
      expect(screen.getByText('已有帳號？')).toBeTruthy();
      expect(screen.getByText('立即登入')).toBeTruthy();
    });

    test('1.2 初始狀態檢查', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');

      expect(nameInput.props.value).toBe('');
      expect(emailInput.props.value).toBe('');
      expect(orgInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
      expect(confirmPasswordInput.props.value).toBe('');
    });
  });

  describe('2. 表單輸入互動測試', () => {
    test('2.1 姓名輸入功能', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      
      fireEvent.changeText(nameInput, '張三');
      
      expect(nameInput.props.value).toBe('張三');
    });

    test('2.2 電子郵件輸入功能', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    test('2.3 公司名稱輸入功能', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      
      fireEvent.changeText(orgInput, '測試公司有限公司');
      
      expect(orgInput.props.value).toBe('測試公司有限公司');
    });

    test('2.4 密碼輸入功能', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      
      fireEvent.changeText(passwordInput, 'password123');
      
      expect(passwordInput.props.value).toBe('password123');
    });

    test('2.5 確認密碼輸入功能', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      expect(confirmPasswordInput.props.value).toBe('password123');
    });

    test('2.6 所有欄位連續輸入', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');

      // 連續填寫所有欄位
      fireEvent.changeText(nameInput, '李四');
      fireEvent.changeText(emailInput, 'lisi@example.com');
      fireEvent.changeText(orgInput, '創新科技股份有限公司');
      fireEvent.changeText(passwordInput, 'securepass123');
      fireEvent.changeText(confirmPasswordInput, 'securepass123');

      expect(nameInput.props.value).toBe('李四');
      expect(emailInput.props.value).toBe('lisi@example.com');
      expect(orgInput.props.value).toBe('創新科技股份有限公司');
      expect(passwordInput.props.value).toBe('securepass123');
      expect(confirmPasswordInput.props.value).toBe('securepass123');
    });
  });

  describe('3. 表單驗證互動測試', () => {
    test('3.1 所有欄位空值驗證', async () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const registerButton = screen.getByText('註冊');
      
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入姓名')).toBeTruthy();
        expect(screen.getByText('請輸入電子郵件')).toBeTruthy();
        expect(screen.getByText('請輸入公司名稱')).toBeTruthy();
        expect(screen.getByText('請輸入密碼')).toBeTruthy();
        expect(screen.getByText('請確認密碼')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('3.2 電子郵件格式驗證', async () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 填寫所有欄位，但 email 格式錯誤
      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'invalid-email-format');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('電子郵件格式無效')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('3.3 密碼長度驗證', async () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 密碼少於 6 個字元
      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.changeText(confirmPasswordInput, '123');
      
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('密碼至少需要 6 個字元')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('3.4 密碼不一致驗證', async () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 密碼不一致
      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password456');
      
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('密碼不一致')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('3.5 部分欄位驗證', async () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const registerButton = screen.getByText('註冊');

      // 只填寫部分欄位
      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入公司名稱')).toBeTruthy();
        expect(screen.getByText('請輸入密碼')).toBeTruthy();
        expect(screen.getByText('請確認密碼')).toBeTruthy();
      });

      expect(mockSignUp).not.toHaveBeenCalled();
    });

    test('3.6 驗證錯誤清除機制', async () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 先觸發驗證錯誤
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入姓名')).toBeTruthy();
      });

      // 填寫正確資料，錯誤應該清除
      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      mockSignUp.mockResolvedValueOnce({} as any);
      fireEvent.press(registerButton);

      await waitFor(() => {
        expect(screen.queryByText('請輸入姓名')).toBeNull();
        expect(screen.queryByText('請輸入電子郵件')).toBeNull();
      });
    });
  });

  describe('4. 註冊流程互動測試', () => {
    test('4.1 成功註冊流程', async () => {
      mockSignUp.mockResolvedValueOnce({
        uid: 'new-user-uid',
        email: 'newuser@example.com'
      } as any);

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 填寫完整表單
      fireEvent.changeText(nameInput, '新用戶');
      fireEvent.changeText(emailInput, 'newuser@example.com');
      fireEvent.changeText(orgInput, '新公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      // 點擊註冊
      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          name: '新用戶',
          organizationName: '新公司',
          role: 'salesperson'
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('註冊成功', '歡迎加入 DonnaAI！');
      });
    });

    test('4.2 註冊載入狀態', async () => {
      let resolveSignUp: (value: any) => void;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValueOnce(signUpPromise);

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 填寫表單
      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      // 點擊註冊
      await act(async () => {
        fireEvent.press(registerButton);
      });

      // 檢查載入狀態
      await waitFor(() => {
        expect(screen.getByTestId('register-button-loading')).toBeTruthy();
      });

      // 完成註冊
      await act(async () => {
        resolveSignUp!({ uid: 'test-uid' });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('register-button-loading')).toBeNull();
      });
    });

    test('4.3 輸入自動去除前後空格', async () => {
      mockSignUp.mockResolvedValueOnce({} as any);

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      // 輸入帶有前後空格的資料
      fireEvent.changeText(nameInput, '  測試用戶  ');
      fireEvent.changeText(emailInput, '  test@example.com  ');
      fireEvent.changeText(orgInput, '  測試公司  ');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@example.com', // 空格應該被去除
          password: 'password123',
          name: '測試用戶', // 空格應該被去除
          organizationName: '測試公司', // 空格應該被去除
          role: 'salesperson'
        });
      });
    });
  });

  describe('5. 錯誤處理互動測試', () => {
    test('5.1 Firebase 註冊錯誤顯示 - Email 已存在', async () => {
      mockSignUp.mockRejectedValueOnce(new Error('此電子郵件已被註冊'));

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('此電子郵件已被註冊')).toBeTruthy();
        expect(Alert.alert).toHaveBeenCalledWith('註冊失敗', '此電子郵件已被註冊');
      });
    });

    test('5.2 Firebase 註冊錯誤顯示 - 密碼強度不足', async () => {
      mockSignUp.mockRejectedValueOnce(new Error('密碼強度不足，請至少使用 6 個字元'));

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'weak');
      fireEvent.changeText(confirmPasswordInput, 'weak');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('密碼強度不足，請至少使用 6 個字元')).toBeTruthy();
      });
    });

    test('5.3 網路錯誤處理', async () => {
      mockSignUp.mockRejectedValueOnce(new Error('網路連線失敗，請檢查網路設定'));

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('網路連線失敗，請檢查網路設定')).toBeTruthy();
      });
    });

    test('5.4 未知錯誤處理', async () => {
      mockSignUp.mockRejectedValueOnce('Unexpected error');

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('註冊失敗')).toBeTruthy();
        expect(Alert.alert).toHaveBeenCalledWith('註冊失敗', '註冊失敗');
      });
    });

    test('5.5 錯誤後重新嘗試', async () => {
      // 第一次失敗
      mockSignUp.mockRejectedValueOnce(new Error('此電子郵件已被註冊'));

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(screen.getByText('此電子郵件已被註冊')).toBeTruthy();
      });

      // 第二次成功
      mockSignUp.mockResolvedValueOnce({ uid: 'test-uid' } as any);

      fireEvent.changeText(emailInput, 'newemail@example.com');

      await act(async () => {
        fireEvent.press(registerButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('此電子郵件已被註冊')).toBeNull();
      });

      expect(mockSignUp).toHaveBeenCalledTimes(2);
    });
  });

  describe('6. 導航互動測試', () => {
    test('6.1 登入頁面導航', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const loginButton = screen.getByText('立即登入');

      fireEvent.press(loginButton);

      expect(mockNavigateToLogin).toHaveBeenCalledTimes(1);
    });

    test('6.2 登入按鈕多次點擊', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const loginButton = screen.getByText('立即登入');

      // 快速多次點擊
      fireEvent.press(loginButton);
      fireEvent.press(loginButton);
      fireEvent.press(loginButton);

      expect(mockNavigateToLogin).toHaveBeenCalledTimes(3);
    });
  });

  describe('7. 可訪問性測試', () => {
    test('7.1 表單元素可訪問性屬性', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');

      // 檢查 placeholder 是否正確設定
      expect(nameInput.props.placeholder).toBe('請輸入您的姓名');
      expect(emailInput.props.placeholder).toBe('請輸入您的電子郵件');
      expect(orgInput.props.placeholder).toBe('請輸入您的公司名稱');
      expect(passwordInput.props.placeholder).toBe('請輸入密碼（至少 6 個字元）');
      expect(confirmPasswordInput.props.placeholder).toBe('請再次輸入密碼');
    });

    test('7.2 按鈕狀態變化', async () => {
      let resolveSignUp: (value: any) => void;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValueOnce(signUpPromise);

      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');
      const registerButton = screen.getByText('註冊');

      fireEvent.changeText(nameInput, '測試用戶');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(orgInput, '測試公司');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      // 檢查按鈕初始狀態
      expect(registerButton.props.disabled).toBeFalsy();

      await act(async () => {
        fireEvent.press(registerButton);
      });

      // 檢查載入期間按鈕是否被禁用
      await waitFor(() => {
        const buttonElement = screen.getByTestId('register-button');
        expect(buttonElement.props.disabled).toBeTruthy();
      });

      // 完成載入
      await act(async () => {
        resolveSignUp!({ uid: 'test-uid' });
      });

      await waitFor(() => {
        const buttonElement = screen.getByTestId('register-button');
        expect(buttonElement.props.disabled).toBeFalsy();
      });
    });
  });

  describe('8. 邊界條件測試', () => {
    test('8.1 極長輸入處理', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const veryLongName = 'a'.repeat(1000);

      fireEvent.changeText(nameInput, veryLongName);

      expect(nameInput.props.value).toBe(veryLongName);
    });

    test('8.2 特殊字符輸入', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');

      // 測試特殊字符
      const specialName = '王小明-李';
      const specialEmail = 'test+special@example.com';
      const specialOrg = '測試公司(股)有限公司';

      fireEvent.changeText(nameInput, specialName);
      fireEvent.changeText(emailInput, specialEmail);
      fireEvent.changeText(orgInput, specialOrg);

      expect(nameInput.props.value).toBe(specialName);
      expect(emailInput.props.value).toBe(specialEmail);
      expect(orgInput.props.value).toBe(specialOrg);
    });

    test('8.3 Unicode 字符處理', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');

      // 測試各種語言字符
      const unicodeName = '田中太郎';
      const unicodeOrg = '株式会社テスト';

      fireEvent.changeText(nameInput, unicodeName);
      fireEvent.changeText(orgInput, unicodeOrg);

      expect(nameInput.props.value).toBe(unicodeName);
      expect(orgInput.props.value).toBe(unicodeOrg);
    });

    test('8.4 快速連續輸入', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');

      // 快速連續輸入
      for (let i = 0; i < 10; i++) {
        fireEvent.changeText(nameInput, `用戶${i}`);
      }

      expect(nameInput.props.value).toBe('用戶9');
    });
  });

  describe('9. 記憶體和效能測試', () => {
    test('9.1 組件重新渲染測試', () => {
      const { rerender } = render(
        <RegisterScreen onNavigateToLogin={mockNavigateToLogin} />
      );

      // 多次重新渲染
      for (let i = 0; i < 10; i++) {
        rerender(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);
      }

      // 檢查組件仍然正常工作
      expect(screen.getByText('加入 DonnaAI')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的姓名')).toBeTruthy();
    });

    test('9.2 大量狀態更新', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');

      // 大量快速狀態更新
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(nameInput, `用戶${i}`);
      }

      expect(nameInput.props.value).toBe('用戶99');
    });

    test('9.3 併發表單填寫', () => {
      render(<RegisterScreen onNavigateToLogin={mockNavigateToLogin} />);

      const nameInput = screen.getByPlaceholderText('請輸入您的姓名');
      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const orgInput = screen.getByPlaceholderText('請輸入您的公司名稱');
      const passwordInput = screen.getByPlaceholderText('請輸入密碼（至少 6 個字元）');
      const confirmPasswordInput = screen.getByPlaceholderText('請再次輸入密碼');

      // 同時更新多個欄位
      const updatePromises = [
        () => fireEvent.changeText(nameInput, '併發用戶'),
        () => fireEvent.changeText(emailInput, 'concurrent@example.com'),
        () => fireEvent.changeText(orgInput, '併發公司'),
        () => fireEvent.changeText(passwordInput, 'password123'),
        () => fireEvent.changeText(confirmPasswordInput, 'password123')
      ];

      updatePromises.forEach(update => update());

      expect(nameInput.props.value).toBe('併發用戶');
      expect(emailInput.props.value).toBe('concurrent@example.com');
      expect(orgInput.props.value).toBe('併發公司');
      expect(passwordInput.props.value).toBe('password123');
      expect(confirmPasswordInput.props.value).toBe('password123');
    });
  });
});