/**
 * LoginScreen 互動測試
 * 測試登入畫面的所有用戶交互功能
 */

import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { signIn } from '@/services/firebase/auth';

// Mock dependencies
jest.mock('@/services/firebase/auth');
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  return {
    ...ReactNative,
    Alert: {
      alert: jest.fn()
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

describe('LoginScreen 互動測試', () => {
  const mockNavigateToRegister = jest.fn();
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 基本渲染測試', () => {
    test('1.1 所有重要元素正確渲染', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      expect(screen.getByText('歡迎回到 DonnaAI')).toBeTruthy();
      expect(screen.getByText('您的 AI 業務助理')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的電子郵件')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的密碼')).toBeTruthy();
      expect(screen.getByText('登入')).toBeTruthy();
      expect(screen.getByText('還沒有帳號？')).toBeTruthy();
      expect(screen.getByText('立即註冊')).toBeTruthy();
    });

    test('1.2 初始狀態檢查', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');

      expect(emailInput.props.value).toBe('');
      expect(passwordInput.props.value).toBe('');
    });
  });

  describe('2. 表單輸入互動測試', () => {
    test('2.1 Email 輸入功能', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      
      expect(emailInput.props.value).toBe('test@example.com');
    });

    test('2.2 密碼輸入功能', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      
      fireEvent.changeText(passwordInput, 'password123');
      
      expect(passwordInput.props.value).toBe('password123');
    });

    test('2.3 連續輸入和修改', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      
      // 多次修改輸入
      fireEvent.changeText(emailInput, 'test');
      expect(emailInput.props.value).toBe('test');
      
      fireEvent.changeText(emailInput, 'test@');
      expect(emailInput.props.value).toBe('test@');
      
      fireEvent.changeText(emailInput, 'test@example.com');
      expect(emailInput.props.value).toBe('test@example.com');
    });
  });

  describe('3. 表單驗證互動測試', () => {
    test('3.1 空值驗證 - Email 和密碼都為空', async () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const loginButton = screen.getByText('登入');
      
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-input-error')).toBeTruthy();
        expect(screen.getByTestId('password-input-error')).toBeTruthy();
        expect(screen.getByText('請輸入電子郵件')).toBeTruthy();
        expect(screen.getByText('請輸入密碼')).toBeTruthy();
      });

      // 確保沒有調用 signIn
      expect(mockSignIn).not.toHaveBeenCalled();
    });

    test('3.2 Email 格式驗證', async () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      // 輸入無效的 email 格式
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('電子郵件格式無效')).toBeTruthy();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    test('3.3 部分填寫驗證', async () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const loginButton = screen.getByText('登入');

      // 只填寫 email，密碼留空
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入密碼')).toBeTruthy();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });

    test('3.4 驗證錯誤清除機制', async () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      // 先觸發驗證錯誤
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.getByText('請輸入電子郵件')).toBeTruthy();
      });

      // 填寫正確資料，錯誤應該清除
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      
      mockSignIn.mockResolvedValueOnce({} as any);
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(screen.queryByText('請輸入電子郵件')).toBeNull();
        expect(screen.queryByText('請輸入密碼')).toBeNull();
      });
    });
  });

  describe('4. 登入流程互動測試', () => {
    test('4.1 成功登入流程', async () => {
      mockSignIn.mockResolvedValueOnce({
        uid: 'test-uid',
        email: 'test@example.com'
      } as any);

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      // 填寫表單
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // 點擊登入
      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    test('4.2 登入載入狀態', async () => {
      // 創建一個 Promise 來控制登入時間
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      // 填寫表單
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // 點擊登入
      await act(async () => {
        fireEvent.press(loginButton);
      });

      // 檢查載入狀態
      await waitFor(() => {
        expect(screen.getByTestId('login-button-loading')).toBeTruthy();
      });

      // 完成登入
      await act(async () => {
        resolveSignIn!({ uid: 'test-uid' });
      });

      await waitFor(() => {
        expect(screen.queryByTestId('login-button-loading')).toBeNull();
      });
    });

    test('4.3 Email 自動去除空格', async () => {
      mockSignIn.mockResolvedValueOnce({} as any);

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      // 輸入帶有前後空格的 email
      fireEvent.changeText(emailInput, '  test@example.com  ');
      fireEvent.changeText(passwordInput, 'password123');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith({
          email: 'test@example.com', // 空格應該被去除
          password: 'password123'
        });
      });
    });
  });

  describe('5. 錯誤處理互動測試', () => {
    test('5.1 Firebase 認證錯誤顯示', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('找不到此電子郵件帳號'));

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('找不到此電子郵件帳號')).toBeTruthy();
        expect(Alert.alert).toHaveBeenCalledWith('登入失敗', '找不到此電子郵件帳號');
      });
    });

    test('5.2 網路錯誤處理', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('網路連線失敗，請檢查網路設定'));

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('網路連線失敗，請檢查網路設定')).toBeTruthy();
      });
    });

    test('5.3 未知錯誤處理', async () => {
      mockSignIn.mockRejectedValueOnce('Unexpected error');

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('登入失敗')).toBeTruthy();
        expect(Alert.alert).toHaveBeenCalledWith('登入失敗', '登入失敗');
      });
    });

    test('5.4 錯誤後重新嘗試', async () => {
      // 第一次失敗
      mockSignIn.mockRejectedValueOnce(new Error('密碼錯誤'));
      
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(screen.getByText('密碼錯誤')).toBeTruthy();
      });

      // 第二次成功
      mockSignIn.mockResolvedValueOnce({ uid: 'test-uid' } as any);
      
      fireEvent.changeText(passwordInput, 'correctpassword');

      await act(async () => {
        fireEvent.press(loginButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('密碼錯誤')).toBeNull();
      });

      expect(mockSignIn).toHaveBeenCalledTimes(2);
    });
  });

  describe('6. 導航互動測試', () => {
    test('6.1 註冊頁面導航', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const registerButton = screen.getByText('立即註冊');
      
      fireEvent.press(registerButton);

      expect(mockNavigateToRegister).toHaveBeenCalledTimes(1);
    });

    test('6.2 註冊按鈕多次點擊', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const registerButton = screen.getByText('立即註冊');
      
      // 快速多次點擊
      fireEvent.press(registerButton);
      fireEvent.press(registerButton);
      fireEvent.press(registerButton);

      expect(mockNavigateToRegister).toHaveBeenCalledTimes(3);
    });
  });

  describe('7. 可訪問性測試', () => {
    test('7.1 表單元素可訪問性屬性', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');

      // 檢查 placeholder 是否正確設定
      expect(emailInput.props.placeholder).toBe('請輸入您的電子郵件');
      expect(passwordInput.props.placeholder).toBe('請輸入您的密碼');
    });

    test('7.2 按鈕狀態變化', async () => {
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValueOnce(signInPromise);

      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');
      const loginButton = screen.getByText('登入');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // 檢查按鈕初始狀態
      expect(loginButton.props.disabled).toBeFalsy();

      await act(async () => {
        fireEvent.press(loginButton);
      });

      // 檢查載入期間按鈕是否被禁用
      await waitFor(() => {
        const buttonElement = screen.getByTestId('login-button');
        expect(buttonElement.props.disabled).toBeTruthy();
      });

      // 完成載入
      await act(async () => {
        resolveSignIn!({ uid: 'test-uid' });
      });

      await waitFor(() => {
        const buttonElement = screen.getByTestId('login-button');
        expect(buttonElement.props.disabled).toBeFalsy();
      });
    });
  });

  describe('8. 邊界條件測試', () => {
    test('8.1 極長輸入處理', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const veryLongEmail = 'a'.repeat(1000) + '@example.com';

      fireEvent.changeText(emailInput, veryLongEmail);

      expect(emailInput.props.value).toBe(veryLongEmail);
    });

    test('8.2 特殊字符輸入', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      const passwordInput = screen.getByPlaceholderText('請輸入您的密碼');

      // 測試特殊字符
      const specialEmail = 'test+special@example.com';
      const specialPassword = 'password!@#$%^&*()';

      fireEvent.changeText(emailInput, specialEmail);
      fireEvent.changeText(passwordInput, specialPassword);

      expect(emailInput.props.value).toBe(specialEmail);
      expect(passwordInput.props.value).toBe(specialPassword);
    });

    test('8.3 快速連續輸入', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');

      // 快速連續輸入
      for (let i = 0; i < 10; i++) {
        fireEvent.changeText(emailInput, `test${i}@example.com`);
      }

      expect(emailInput.props.value).toBe('test9@example.com');
    });
  });

  describe('9. 記憶體和效能測試', () => {
    test('9.1 組件重新渲染測試', () => {
      const { rerender } = render(
        <LoginScreen onNavigateToRegister={mockNavigateToRegister} />
      );

      // 多次重新渲染
      for (let i = 0; i < 10; i++) {
        rerender(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);
      }

      // 檢查組件仍然正常工作
      expect(screen.getByText('歡迎回到 DonnaAI')).toBeTruthy();
      expect(screen.getByPlaceholderText('請輸入您的電子郵件')).toBeTruthy();
    });

    test('9.2 大量狀態更新', () => {
      render(<LoginScreen onNavigateToRegister={mockNavigateToRegister} />);

      const emailInput = screen.getByPlaceholderText('請輸入您的電子郵件');
      
      // 大量快速狀態更新
      for (let i = 0; i < 100; i++) {
        fireEvent.changeText(emailInput, `test${i}@example.com`);
      }

      expect(emailInput.props.value).toBe('test99@example.com');
    });
  });
});