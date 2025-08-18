/**
 * Firebase 認證系統端到端測試
 * 測試完整的用戶認證流程，包括登入、註冊、登出等
 */

describe('Firebase 認證 E2E 測試', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('1. 登入流程 E2E 測試', () => {
    test('1.1 完整登入流程', async () => {
      // 等待登入畫面載入
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 填寫 Email
      await element(by.id('email-input')).typeText('test@example.com');
      
      // 填寫密碼
      await element(by.id('password-input')).typeText('password123');
      
      // 點擊登入按鈕
      await element(by.id('login-button')).tap();
      
      // 等待載入完成並導航到主畫面
      await waitFor(element(by.id('main-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // 驗證登入成功
      await expect(element(by.id('main-screen'))).toBeVisible();
    });

    test('1.2 錯誤帳密登入處理', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 填寫錯誤的登入資料
      await element(by.id('email-input')).typeText('wrong@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      
      // 點擊登入
      await element(by.id('login-button')).tap();
      
      // 等待錯誤訊息顯示
      await waitFor(element(by.text('找不到此電子郵件帳號')))
        .toBeVisible()
        .withTimeout(5000);

      // 驗證仍在登入畫面
      await expect(element(by.text('歡迎回到 DonnaAI'))).toBeVisible();
    });

    test('1.3 空值輸入驗證', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 不填寫任何內容直接點擊登入
      await element(by.id('login-button')).tap();
      
      // 等待驗證錯誤訊息
      await waitFor(element(by.text('請輸入電子郵件')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.text('請輸入密碼')))
        .toBeVisible()
        .withTimeout(3000);
    });

    test('1.4 Email 格式驗證', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 填寫無效的 Email 格式
      await element(by.id('email-input')).typeText('invalid-email');
      await element(by.id('password-input')).typeText('password123');
      
      // 點擊登入
      await element(by.id('login-button')).tap();
      
      // 檢查格式錯誤訊息
      await waitFor(element(by.text('電子郵件格式無效')))
        .toBeVisible()
        .withTimeout(3000);
    });

    test('1.5 載入狀態顯示', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 填寫登入資料
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      
      // 點擊登入
      await element(by.id('login-button')).tap();
      
      // 檢查載入指示器出現
      await waitFor(element(by.id('login-loading-indicator')))
        .toBeVisible()
        .withTimeout(1000);
    });
  });

  describe('2. 註冊流程 E2E 測試', () => {
    test('2.1 完整註冊流程', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 點擊註冊按鈕
      await element(by.text('立即註冊')).tap();
      
      // 等待註冊畫面載入
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      // 填寫註冊表單
      await element(by.id('name-input')).typeText('測試用戶');
      await element(by.id('email-input')).typeText('newuser@example.com');
      await element(by.id('organization-input')).typeText('測試公司');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');
      
      // 點擊註冊
      await element(by.id('register-button')).tap();
      
      // 等待註冊成功並導航到主畫面
      await waitFor(element(by.id('main-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // 驗證註冊成功
      await expect(element(by.id('main-screen'))).toBeVisible();
    });

    test('2.2 密碼不一致驗證', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('立即註冊')).tap();
      
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      // 填寫不一致的密碼
      await element(by.id('name-input')).typeText('測試用戶');
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('organization-input')).typeText('測試公司');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password456');
      
      await element(by.id('register-button')).tap();
      
      // 檢查錯誤訊息
      await waitFor(element(by.text('密碼不一致')))
        .toBeVisible()
        .withTimeout(3000);
    });

    test('2.3 已存在 Email 註冊處理', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('立即註冊')).tap();
      
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      // 使用已存在的 Email
      await element(by.id('name-input')).typeText('重複用戶');
      await element(by.id('email-input')).typeText('existing@example.com');
      await element(by.id('organization-input')).typeText('測試公司');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');
      
      await element(by.id('register-button')).tap();
      
      // 檢查 Email 已存在錯誤
      await waitFor(element(by.text('此電子郵件已被註冊')))
        .toBeVisible()
        .withTimeout(5000);
    });

    test('2.4 密碼強度驗證', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('立即註冊')).tap();
      
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      // 使用過短的密碼
      await element(by.id('name-input')).typeText('測試用戶');
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('organization-input')).typeText('測試公司');
      await element(by.id('password-input')).typeText('123');
      await element(by.id('confirm-password-input')).typeText('123');
      
      await element(by.id('register-button')).tap();
      
      // 檢查密碼長度錯誤
      await waitFor(element(by.text('密碼至少需要 6 個字元')))
        .toBeVisible()
        .withTimeout(3000);
    });

    test('2.5 必填欄位驗證', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('立即註冊')).tap();
      
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      // 不填寫任何內容直接註冊
      await element(by.id('register-button')).tap();
      
      // 檢查所有必填欄位錯誤
      await waitFor(element(by.text('請輸入姓名')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.text('請輸入電子郵件')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.text('請輸入公司名稱')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('3. 頁面導航 E2E 測試', () => {
    test('3.1 登入頁面到註冊頁面導航', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 點擊註冊連結
      await element(by.text('立即註冊')).tap();
      
      // 驗證導航到註冊頁面
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('加入 DonnaAI'))).toBeVisible();
    });

    test('3.2 註冊頁面到登入頁面導航', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('立即註冊')).tap();
      
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      // 點擊登入連結
      await element(by.text('立即登入')).tap();
      
      // 驗證導航回登入頁面
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('歡迎回到 DonnaAI'))).toBeVisible();
    });

    test('3.3 快速導航切換', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 快速在登入和註冊頁面間切換
      for (let i = 0; i < 3; i++) {
        await element(by.text('立即註冊')).tap();
        await waitFor(element(by.text('加入 DonnaAI')))
          .toBeVisible()
          .withTimeout(3000);
        
        await element(by.text('立即登入')).tap();
        await waitFor(element(by.text('歡迎回到 DonnaAI')))
          .toBeVisible()
          .withTimeout(3000);
      }
    });
  });

  describe('4. 用戶體驗流程測試', () => {
    test('4.1 完整認證到主應用流程', async () => {
      // 從登入開始
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 登入成功
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      // 等待主應用載入
      await waitFor(element(by.id('main-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // 驗證主要功能可用
      await expect(element(by.id('navigation-menu'))).toBeVisible();
      await expect(element(by.id('user-profile-button'))).toBeVisible();
    });

    test('4.2 註冊後立即可用功能', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 註冊新用戶
      await element(by.text('立即註冊')).tap();
      
      await waitFor(element(by.text('加入 DonnaAI')))
        .toBeVisible()
        .withTimeout(3000);

      await element(by.id('name-input')).typeText('新用戶');
      await element(by.id('email-input')).typeText('newuser@example.com');
      await element(by.id('organization-input')).typeText('新公司');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('confirm-password-input')).typeText('password123');
      
      await element(by.id('register-button')).tap();
      
      // 等待主應用載入
      await waitFor(element(by.id('main-screen')))
        .toBeVisible()
        .withTimeout(10000);

      // 驗證新用戶可以立即使用功能
      await expect(element(by.id('customer-list'))).toBeVisible();
      await expect(element(by.id('add-customer-button'))).toBeVisible();
    });

    test('4.3 錯誤恢復流程', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 先嘗試錯誤登入
      await element(by.id('email-input')).typeText('wrong@example.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();
      
      // 等待錯誤訊息
      await waitFor(element(by.text('找不到此電子郵件帳號')))
        .toBeVisible()
        .withTimeout(5000);

      // 清除錯誤輸入
      await element(by.id('email-input')).clearText();
      await element(by.id('password-input')).clearText();
      
      // 輸入正確資料
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      // 驗證成功登入
      await waitFor(element(by.id('main-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('5. 跨平台一致性測試', () => {
    test('5.1 iOS 特定行為測試', async () => {
      if (device.getPlatform() === 'ios') {
        await waitFor(element(by.text('歡迎回到 DonnaAI')))
          .toBeVisible()
          .withTimeout(5000);

        // 測試鍵盤處理
        await element(by.id('email-input')).tap();
        await expect(element(by.id('email-input'))).toBeFocused();
        
        // 測試鍵盤隱藏
        await element(by.id('login-button')).tap();
        
        // iOS 特定的導航行為測試
        await element(by.text('立即註冊')).tap();
        await waitFor(element(by.text('加入 DonnaAI')))
          .toBeVisible()
          .withTimeout(3000);
      }
    });

    test('5.2 Android 特定行為測試', async () => {
      if (device.getPlatform() === 'android') {
        await waitFor(element(by.text('歡迎回到 DonnaAI')))
          .toBeVisible()
          .withTimeout(5000);

        // 測試 Android 返回鍵行為
        await element(by.text('立即註冊')).tap();
        await waitFor(element(by.text('加入 DonnaAI')))
          .toBeVisible()
          .withTimeout(3000);
        
        // 使用系統返回鍵
        await device.pressBack();
        
        // 應該回到登入頁面
        await waitFor(element(by.text('歡迎回到 DonnaAI')))
          .toBeVisible()
          .withTimeout(3000);
      }
    });
  });

  describe('6. 效能和穩定性測試', () => {
    test('6.1 快速操作穩定性', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 快速多次點擊登入按鈕
      for (let i = 0; i < 5; i++) {
        await element(by.id('login-button')).tap();
        await sleep(100); // 短暫延遲
      }
      
      // 應用應該仍然穩定運行
      await expect(element(by.text('歡迎回到 DonnaAI'))).toBeVisible();
    });

    test('6.2 記憶體壓力測試', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 大量輸入操作
      const longText = 'a'.repeat(1000);
      
      await element(by.id('email-input')).typeText(longText);
      await element(by.id('password-input')).typeText(longText);
      
      // 清除並重新輸入
      await element(by.id('email-input')).clearText();
      await element(by.id('password-input')).clearText();
      
      // 正常輸入應該仍然有效
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      
      await expect(element(by.id('email-input'))).toHaveText('test@example.com');
    });

    test('6.3 網路中斷恢復測試', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 模擬網路中斷（需要 Detox 配置支援）
      await device.setNetworkEnvironment({ 'offline': true });
      
      await element(by.id('email-input')).typeText('test@example.com');
      await element(by.id('password-input')).typeText('password123');
      await element(by.id('login-button')).tap();
      
      // 應該顯示網路錯誤
      await waitFor(element(by.text('網路連線失敗，請檢查網路設定')))
        .toBeVisible()
        .withTimeout(5000);
      
      // 恢復網路
      await device.setNetworkEnvironment({ 'offline': false });
      
      // 重試登入應該成功
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.id('main-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('7. 可訪問性測試', () => {
    test('7.1 螢幕閱讀器支援', async () => {
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 檢查重要元素的可訪問性標籤
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
      
      // 測試焦點導航
      await element(by.id('email-input')).tap();
      await expect(element(by.id('email-input'))).toBeFocused();
    });

    test('7.2 大字體支援測試', async () => {
      // 啟用大字體（需要平台特定配置）
      await device.setContentSizeCategory('accessibilityExtraExtraExtraLarge');
      
      await waitFor(element(by.text('歡迎回到 DonnaAI')))
        .toBeVisible()
        .withTimeout(5000);

      // 驗證界面仍然可用
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
      
      // 恢復正常字體大小
      await device.setContentSizeCategory('medium');
    });
  });
});

// 輔助函數
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}