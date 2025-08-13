/**
 * Firebase 監控服務配置
 * 包含 Crashlytics 錯誤追蹤和 Performance Monitoring
 */

import { Platform } from 'react-native';

// 動態導入以避免在不支援的平台上出錯
let crashlytics: any = null;
let performance: any = null;

// 只在原生平台載入 Firebase 監控服務
if (Platform.OS !== 'web') {
  try {
    crashlytics = require('@react-native-firebase/crashlytics').default;
    performance = require('@react-native-firebase/performance').default;
  } catch (error) {
    console.warn('Firebase 監控服務未安裝或不可用:', error);
  }
}

/**
 * 初始化監控服務
 * 只在生產環境啟用
 */
export const initializeMonitoring = async () => {
  if (__DEV__) {
    console.log('📊 開發環境：監控服務已停用');
    return;
  }

  if (Platform.OS === 'web') {
    console.log('📊 Web 平台：使用 Firebase Web SDK 監控');
    return;
  }

  try {
    // 啟用 Crashlytics
    if (crashlytics) {
      await crashlytics().setCrashlyticsCollectionEnabled(true);
      console.log('✅ Crashlytics 已啟用');
    }

    // 啟用 Performance Monitoring
    if (performance) {
      await performance().setPerformanceCollectionEnabled(true);
      console.log('✅ Performance Monitoring 已啟用');
    }
  } catch (error) {
    console.error('監控服務初始化失敗:', error);
  }
};

/**
 * 記錄錯誤到 Crashlytics
 * @param error 錯誤物件
 * @param context 額外的上下文資訊
 */
export const logError = (error: Error, context?: Record<string, any>) => {
  if (__DEV__) {
    console.error('開發環境錯誤:', error, context);
    return;
  }

  if (Platform.OS === 'web') {
    // Web 平台使用 console.error 或其他錯誤追蹤服務
    console.error('生產環境錯誤:', error, context);
    return;
  }

  if (crashlytics) {
    crashlytics().recordError(error);
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        crashlytics().setAttribute(key, String(value));
      });
    }
  }
};

/**
 * 設定使用者識別符（用於錯誤追蹤）
 * @param userId 使用者 ID
 */
export const setUserId = (userId: string) => {
  if (__DEV__ || Platform.OS === 'web' || !crashlytics) {
    return;
  }

  crashlytics().setUserId(userId);
};

/**
 * 設定使用者屬性
 * @param attributes 使用者屬性
 */
export const setUserAttributes = (attributes: Record<string, string>) => {
  if (__DEV__ || Platform.OS === 'web' || !crashlytics) {
    return;
  }

  Object.entries(attributes).forEach(([key, value]) => {
    crashlytics().setAttribute(key, value);
  });
};

/**
 * 記錄自訂事件
 * @param message 事件訊息
 */
export const logEvent = (message: string) => {
  if (__DEV__ || Platform.OS === 'web' || !crashlytics) {
    return;
  }

  crashlytics().log(message);
};

/**
 * 效能追蹤：AI 處理時間
 * @param processFunction AI 處理函數
 */
export const trackAIProcessingTime = async <T>(
  processName: string,
  processFunction: () => Promise<T>
): Promise<T> => {
  if (__DEV__ || Platform.OS === 'web' || !performance) {
    return processFunction();
  }

  const trace = await performance().newTrace(`ai_processing_${processName}`);
  await trace.start();

  try {
    const result = await processFunction();
    await trace.putAttribute('success', 'true');
    await trace.putAttribute('process_name', processName);
    return result;
  } catch (error) {
    await trace.putAttribute('success', 'false');
    await trace.putAttribute('error', error.message || 'Unknown error');
    throw error;
  } finally {
    await trace.stop();
  }
};

/**
 * 效能追蹤：API 呼叫
 * @param url API 端點
 * @param method HTTP 方法
 * @param fetchFunction 實際的 fetch 函數
 */
export const trackAPICall = async <T>(
  url: string,
  method: string,
  fetchFunction: () => Promise<T>
): Promise<T> => {
  if (__DEV__ || Platform.OS === 'web' || !performance) {
    return fetchFunction();
  }

  const trace = await performance().newHttpMetric(url, method);
  await trace.start();

  try {
    const result = await fetchFunction();
    await trace.setHttpResponseCode(200);
    await trace.putAttribute('success', 'true');
    return result;
  } catch (error) {
    await trace.setHttpResponseCode(error.status || 500);
    await trace.putAttribute('success', 'false');
    throw error;
  } finally {
    await trace.stop();
  }
};

/**
 * 效能追蹤：螢幕載入時間
 * @param screenName 螢幕名稱
 */
export const startScreenTrace = async (screenName: string) => {
  if (__DEV__ || Platform.OS === 'web' || !performance) {
    return {
      stop: () => Promise.resolve(),
      putAttribute: () => Promise.resolve() };
  }

  const trace = await performance().newTrace(`screen_load_${screenName}`);
  await trace.start();

  return {
    stop: () => trace.stop(),
    putAttribute: (key: string, value: string) => trace.putAttribute(key, value) };
};

/**
 * 測試崩潰（僅用於測試 Crashlytics）
 */
export const testCrash = () => {
  if (!__DEV__ && Platform.OS !== 'web' && crashlytics) {
    crashlytics().crash();
  }
};