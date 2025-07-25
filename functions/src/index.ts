/**
 * DonnaAI Cloud Functions 主入口
 * 生產環境配置
 */

import { setGlobalOptions } from 'firebase-functions/v2';

// 設定全域配置 - 生產環境最佳化
setGlobalOptions({
  maxInstances: 10,          // 最大實例數
  region: 'asia-east1',      // 台灣地區
  memory: '1GiB',            // 預設記憶體
  timeoutSeconds: 300,       // 預設逾時 5 分鐘
  minInstances: 0            // 最小實例數（節省成本）
});

// 匯出所有 Cloud Functions
export { processAudioFile } from "./audio-processing";
export { extractFieldsFromContent } from "./field-extraction";
export { aiProcessingAPI } from "./ai-processing-api";
export { scheduledCalendarSync, triggerCalendarSync } from "./calendar-sync-scheduler";