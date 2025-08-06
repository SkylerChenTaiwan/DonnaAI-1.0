/**
 * 強制登出工具
 * 用於處理異常登入狀態
 */

import { getAuth } from 'firebase/auth';

export async function forceLogout() {
  try {
    const auth = getAuth();
    
    // 顯示當前登入用戶
    if (auth.currentUser) {
      console.log('當前登入用戶:', auth.currentUser.email);
      console.log('UID:', auth.currentUser.uid);
      
      // 執行登出
      await auth.signOut();
      console.log('✅ 已成功登出');
      
      // 清除本地儲存
      if (typeof window !== 'undefined') {
        // Web 環境
        localStorage.clear();
        sessionStorage.clear();
        console.log('✅ 已清除瀏覽器儲存');
        
        // 重新載入頁面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } else {
      console.log('⚠️ 目前沒有登入的用戶');
    }
  } catch (error) {
    console.error('❌ 登出失敗:', error);
  }
}

// 將函數暴露到全域，方便在 console 中使用
if (typeof window !== 'undefined') {
  (window as any).forceLogout = forceLogout;
}