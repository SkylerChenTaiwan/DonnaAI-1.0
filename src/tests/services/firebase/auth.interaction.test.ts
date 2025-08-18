/**
 * Firebase 認證服務互動測試
 * 測試所有認證相關的用戶交互功能
 */

import { signIn, signUp, resetPassword, updateUserName, updateUserEmail } from '@/services/firebase/auth';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateEmail: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  },
  serverTimestamp: jest.fn()
}));

jest.mock('@/services/firebase/config', () => ({
  getFirebaseAuth: jest.fn(() => ({
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  })),
  getFirebaseDb: jest.fn()
}));

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail as firebaseUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/services/firebase/config';

describe('Firebase 認證互動測試', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. 登入流程測試', () => {
    test('1.1 成功登入流程', async () => {
      // 模擬成功的 Firebase 響應
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // 執行登入
      const result = await signIn({
        email: 'test@example.com',
        password: 'password123'
      });

      // 驗證結果
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          lastLoginAt: expect.anything()
        }),
        { merge: true }
      );
      expect(result).toEqual(mockUser);
    });

    test('1.2 登入失敗 - 用戶不存在', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'Firebase: Error (auth/user-not-found).'
      });

      await expect(signIn({
        email: 'nonexistent@example.com',
        password: 'password123'
      })).rejects.toThrow('找不到此電子郵件帳號');
    });

    test('1.3 登入失敗 - 密碼錯誤', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/wrong-password',
        message: 'Firebase: Error (auth/wrong-password).'
      });

      await expect(signIn({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow('密碼錯誤');
    });

    test('1.4 登入失敗 - 網路錯誤', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/network-request-failed',
        message: 'Firebase: A network error has occurred.'
      });

      await expect(signIn({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('網路連線失敗，請檢查網路設定');
    });

    test('1.5 登入失敗 - 嘗試次數過多', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/too-many-requests',
        message: 'Firebase: Too many unsuccessful sign-in attempts.'
      });

      await expect(signIn({
        email: 'test@example.com',
        password: 'password123'
      })).rejects.toThrow('嘗試次數過多，請稍後再試');
    });
  });

  describe('2. 註冊流程測試', () => {
    test('2.1 成功註冊流程', async () => {
      const mockUser = {
        uid: 'new-user-uid',
        email: 'newuser@example.com',
        displayName: null
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // 執行註冊
      const result = await signUp({
        email: 'newuser@example.com',
        password: 'password123',
        name: '新用戶',
        organizationName: '測試公司',
        role: 'salesperson'
      });

      // 驗證 Firebase 認證帳號創建
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );

      // 驗證用戶檔案更新
      expect(updateProfile).toHaveBeenCalledWith(
        mockUser,
        { displayName: '新用戶' }
      );

      // 驗證至少創建了用戶文檔
      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    test('2.2 註冊失敗 - Email 已存在', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'Firebase: The email address is already in use by another account.'
      });

      await expect(signUp({
        email: 'existing@example.com',
        password: 'password123',
        name: '測試用戶',
        organizationName: '測試公司',
        role: 'salesperson'
      })).rejects.toThrow('此電子郵件已被註冊');
    });

    test('2.3 註冊失敗 - 密碼強度不足', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/weak-password',
        message: 'Firebase: Password should be at least 6 characters.'
      });

      await expect(signUp({
        email: 'test@example.com',
        password: '123',
        name: '測試用戶',
        organizationName: '測試公司',
        role: 'salesperson'
      })).rejects.toThrow('密碼強度不足，請至少使用 6 個字元');
    });

    test('2.4 註冊失敗 - 無效的 Email 格式', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/invalid-email',
        message: 'Firebase: The email address is badly formatted.'
      });

      await expect(signUp({
        email: 'invalid-email',
        password: 'password123',
        name: '測試用戶',
        organizationName: '測試公司',
        role: 'salesperson'
      })).rejects.toThrow('電子郵件格式無效');
    });
  });

  describe('3. 密碼管理測試', () => {
    test('3.1 成功發送密碼重設郵件', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });

    test('3.2 密碼重設失敗 - 用戶不存在', async () => {
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'Firebase: There is no user record corresponding to this identifier.'
      });

      await expect(resetPassword('nonexistent@example.com')).rejects.toThrow('找不到此電子郵件帳號');
    });

    test('3.3 密碼重設失敗 - 無效 Email', async () => {
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue({
        code: 'auth/invalid-email',
        message: 'Firebase: The email address is badly formatted.'
      });

      await expect(resetPassword('invalid-email')).rejects.toThrow('電子郵件格式無效');
    });
  });

  describe('4. 用戶資料更新測試', () => {
    test('4.1 成功更新用戶名稱', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Old Name'
      };

      (getFirebaseAuth as jest.Mock).mockReturnValue({
        currentUser: mockCurrentUser
      });
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateUserName('New Name');

      expect(updateProfile).toHaveBeenCalledWith(
        mockCurrentUser,
        { displayName: 'New Name' }
      );
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          name: 'New Name',
          updatedAt: expect.anything()
        })
      );
    });

    test('4.2 更新用戶名稱失敗 - 未登入', async () => {
      (getFirebaseAuth as jest.Mock).mockReturnValue({
        currentUser: null
      });

      await expect(updateUserName('New Name')).rejects.toThrow('用戶未登入');
    });

    test('4.3 成功更新用戶電子郵件', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'old@example.com',
        displayName: 'Test User'
      };

      (getFirebaseAuth as jest.Mock).mockReturnValue({
        currentUser: mockCurrentUser
      });
      (EmailAuthProvider.credential as jest.Mock).mockReturnValue({});
      (reauthenticateWithCredential as jest.Mock).mockResolvedValue(undefined);
      (firebaseUpdateEmail as jest.Mock).mockResolvedValue(undefined);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateUserEmail('new@example.com', 'currentpassword');

      expect(reauthenticateWithCredential).toHaveBeenCalled();
      expect(firebaseUpdateEmail).toHaveBeenCalledWith(
        mockCurrentUser,
        'new@example.com'
      );
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: 'new@example.com',
          updatedAt: expect.anything()
        })
      );
    });

    test('4.4 更新電子郵件失敗 - 重新驗證失敗', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      (getFirebaseAuth as jest.Mock).mockReturnValue({
        currentUser: mockCurrentUser
      });
      (EmailAuthProvider.credential as jest.Mock).mockReturnValue({});
      (reauthenticateWithCredential as jest.Mock).mockRejectedValue({
        code: 'auth/wrong-password',
        message: 'Firebase: The password is invalid or the user does not have a password.'
      });

      await expect(updateUserEmail('new@example.com', 'wrongpassword')).rejects.toThrow('密碼錯誤');
    });

    test('4.5 更新電子郵件失敗 - 需要最近登入', async () => {
      const mockCurrentUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      (getFirebaseAuth as jest.Mock).mockReturnValue({
        currentUser: mockCurrentUser
      });
      (reauthenticateWithCredential as jest.Mock).mockRejectedValue({
        code: 'auth/requires-recent-login',
        message: 'Firebase: This operation is sensitive and requires recent authentication.'
      });

      await expect(updateUserEmail('new@example.com', 'password')).rejects.toThrow('為了安全考量，請重新登入後再嘗試更新');
    });
  });

  describe('5. 錯誤訊息本地化測試', () => {
    test('5.1 驗證所有錯誤碼的中文訊息', async () => {
      const errorCodes = [
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/email-already-in-use',
        'auth/weak-password',
        'auth/invalid-email',
        'auth/too-many-requests',
        'auth/network-request-failed',
        'auth/requires-recent-login',
        'auth/invalid-credential'
      ];

      const expectedMessages = [
        '找不到此電子郵件帳號',
        '密碼錯誤',
        '此電子郵件已被註冊',
        '密碼強度不足，請至少使用 6 個字元',
        '電子郵件格式無效',
        '嘗試次數過多，請稍後再試',
        '網路連線失敗，請檢查網路設定',
        '為了安全考量，請重新登入後再嘗試更新',
        '認證資訊無效，請確認您的電子郵件和密碼'
      ];

      for (let i = 0; i < errorCodes.length; i++) {
        (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
          code: errorCodes[i],
          message: `Firebase: Error (${errorCodes[i]}).`
        });

        try {
          await signIn({ email: 'test@example.com', password: 'password' });
        } catch (error) {
          expect(error.message).toBe(expectedMessages[i]);
        }
      }
    });

    test('5.2 未知錯誤的通用訊息', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({
        code: 'auth/unknown-error',
        message: 'Unknown Firebase error'
      });

      try {
        await signIn({ email: 'test@example.com', password: 'password' });
      } catch (error) {
        expect(error.message).toBe('Unknown Firebase error');
      }
    });
  });

  describe('6. 併發和競態條件測試', () => {
    test('6.1 同時多次登入請求', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // 同時發起多個登入請求
      const promises = Array(5).fill(null).map(() =>
        signIn({ email: 'test@example.com', password: 'password123' })
      );

      const results = await Promise.all(promises);

      // 驗證所有請求都成功
      results.forEach(result => {
        expect(result).toEqual(mockUser);
      });

      // 驗證 Firebase 被調用了 5 次
      expect(signInWithEmailAndPassword).toHaveBeenCalledTimes(5);
    });

    test('6.2 快速註冊和登入切換', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // 快速執行註冊和登入
      const signUpPromise = signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        organizationName: 'Test Org',
        role: 'salesperson'
      });

      const signInPromise = signIn({
        email: 'test@example.com',
        password: 'password123'
      });

      const [signUpResult, signInResult] = await Promise.all([signUpPromise, signInPromise]);

      expect(signUpResult).toEqual(mockUser);
      expect(signInResult).toEqual(mockUser);
    });
  });

  describe('7. 效能測試', () => {
    test('7.1 登入操作執行時間', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const startTime = Date.now();
      await signIn({ email: 'test@example.com', password: 'password123' });
      const endTime = Date.now();

      // 登入操作應該在合理時間內完成（這裡我們只測試同步部分）
      expect(endTime - startTime).toBeLessThan(100); // 100ms 內完成同步操作
    });

    test('7.2 批量操作效能測試', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser
      });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const startTime = Date.now();
      
      // 執行 10 次連續登入操作
      const promises = Array(10).fill(null).map((_, index) =>
        signIn({ 
          email: `test${index}@example.com`, 
          password: 'password123' 
        })
      );

      await Promise.all(promises);
      const endTime = Date.now();

      // 10 次操作應該在合理時間內完成
      expect(endTime - startTime).toBeLessThan(1000); // 1秒內完成
    });
  });
});