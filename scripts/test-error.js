#!/usr/bin/env node

/**
 * 錯誤測試腳本
 * 用於測試應用程式的錯誤處理功能
 */

console.log('🧪 DonnaAI 錯誤處理測試腳本');
console.log('=====================================\n');

// 測試案例列表
const testCases = [
  {
    name: '元件渲染錯誤',
    description: '測試錯誤邊界是否能捕捉元件錯誤',
    code: `
// 在任何元件中加入以下程式碼：
throw new Error('測試元件渲染錯誤');
    `
  },
  {
    name: '事件處理錯誤',
    description: '測試事件處理器中的錯誤',
    code: `
// 在按鈕點擊事件中：
const handlePress = () => {
  throw new Error('測試事件處理錯誤');
};
    `
  },
  {
    name: '非同步錯誤',
    description: '測試 Promise 和 async/await 錯誤',
    code: `
// 非同步函數錯誤：
const fetchData = async () => {
  throw new Error('測試非同步錯誤');
};

// Promise 錯誤：
Promise.reject(new Error('測試 Promise 錯誤'));
    `
  },
  {
    name: '網路錯誤',
    description: '測試網路請求錯誤',
    code: `
// 模擬網路錯誤：
fetch('https://invalid-url-that-does-not-exist.com')
  .catch(error => console.error('網路錯誤:', error));
    `
  },
  {
    name: 'Firebase 錯誤',
    description: '測試 Firebase 相關錯誤',
    code: `
// 模擬 Firebase 認證錯誤：
auth.signInWithEmailAndPassword('invalid@email', 'wrong-password')
  .catch(error => console.error('Firebase 錯誤:', error));
    `
  },
  {
    name: '驗證錯誤',
    description: '測試表單驗證錯誤',
    code: `
// 觸發驗證錯誤：
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

schema.parse({ email: 'invalid', age: 10 });
    `
  }
];

// 顯示測試案例
console.log('📋 可用的測試案例：\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   ${testCase.description}`);
  console.log(testCase.code);
  console.log();
});

// 測試步驟
console.log('🔧 測試步驟：');
console.log();
console.log('1. 在 Expo Go 或開發版本中執行應用程式');
console.log('2. 搖晃裝置開啟開發者選單');
console.log('3. 點擊「測試錯誤」觸發錯誤');
console.log('4. 或手動在程式碼中加入上述測試案例');
console.log();

// 驗證檢查清單
console.log('✅ 驗證檢查清單：');
console.log();
console.log('[ ] 錯誤邊界顯示友善的錯誤介面');
console.log('[ ] 開發模式顯示詳細錯誤堆疊');
console.log('[ ] 錯誤 ID 正確顯示');
console.log('[ ] 複製錯誤功能正常');
console.log('[ ] 分享錯誤報告功能正常');
console.log('[ ] 重試按鈕能恢復應用程式');
console.log('[ ] 錯誤日誌正確記錄在 AsyncStorage');
console.log('[ ] 開發者選單的錯誤日誌功能正常');
console.log();

// 自動化測試提示
console.log('💡 提示：');
console.log();
console.log('- 使用 React Native Debugger 查看詳細錯誤資訊');
console.log('- 檢查 console 輸出確認錯誤日誌記錄');
console.log('- 測試不同嚴重程度的錯誤');
console.log('- 驗證生產環境不顯示敏感資訊');
console.log();

console.log('=====================================');
console.log('測試愉快！🚀');