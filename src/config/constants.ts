/**
 * 應用程式常數定義
 */

/**
 * 錯誤相關常數
 */
export const ERROR_CONSTANTS = {
  // 錯誤報告保留天數
  ERROR_RETENTION_DAYS: 7,
  
  // 最大錯誤日誌數量
  MAX_ERROR_LOGS: 100,
  
  // 錯誤堆疊最大行數
  MAX_STACK_LINES: 10,
  
  // 錯誤重試次數
  MAX_RETRY_ATTEMPTS: 3,
  
  // 錯誤重試延遲（毫秒）
  RETRY_DELAY_MS: 1000
} as const;

/**
 * 開發者工具常數
 */
export const DEV_TOOLS_CONSTANTS = {
  // 搖晃偵測閾值
  SHAKE_THRESHOLD: 2.5,
  
  // 長按偵測時間（毫秒）
  LONG_PRESS_DURATION: 1000,
  
  // 開發選單動畫時間
  MENU_ANIMATION_DURATION: 300,
  
  // 狀態檢查更新間隔
  STATE_UPDATE_INTERVAL: 1000
} as const;

/**
 * 儲存相關常數
 */
export const STORAGE_KEYS = {
  // 錯誤日誌
  ERROR_LOGS: '@donna_ai/error_logs',
  
  // 開發者設定
  DEV_SETTINGS: '@donna_ai/dev_settings',
  
  // 環境設定
  ENV_OVERRIDE: '@donna_ai/env_override',
  
  // 使用者偏好
  USER_PREFERENCES: '@donna_ai/user_preferences',
  
  // 使用者模式（業務/主管）
  USER_MODE: '@donna_ai/user_mode',
  
  // 使用者設定（通知、音效等）
  USER_SETTINGS: '@donna_ai/user_settings'
} as const;

/**
 * API 相關常數
 */
export const API_CONSTANTS = {
  // 請求超時時間（毫秒）
  REQUEST_TIMEOUT: 30000,
  
  // 上傳超時時間（毫秒）
  UPLOAD_TIMEOUT: 60000,
  
  // API 版本
  API_VERSION: 'v1',
  
  // 重試狀態碼
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504]
} as const;

/**
 * UI 相關常數
 */
export const UI_CONSTANTS = {
  // 錯誤訊息顯示時間（毫秒）
  ERROR_MESSAGE_DURATION: 5000,
  
  // 成功訊息顯示時間（毫秒）
  SUCCESS_MESSAGE_DURATION: 3000,
  
  // 動畫時間
  ANIMATION_DURATION: 200,
  
  // 模態框背景透明度
  MODAL_BACKDROP_OPACITY: 0.5
} as const;

/**
 * 錯誤類型定義
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
  FIREBASE: 'FIREBASE_ERROR',
  STORAGE: 'STORAGE_ERROR',
  SYNC: 'SYNC_ERROR'
} as const;

/**
 * 日誌等級
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
} as const;

/**
 * 支援的檔案類型
 */
export const SUPPORTED_FILE_TYPES = {
  AUDIO: ['.mp3', '.wav', '.m4a', '.aac'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  DOCUMENT: ['.pdf', '.doc', '.docx', '.txt'],
  VIDEO: ['.mp4', '.mov', '.avi']
} as const;

/**
 * 預設值
 */
export const DEFAULT_VALUES = {
  // 預設使用者名稱
  DEFAULT_USERNAME: '訪客',
  
  // 預設錯誤訊息
  DEFAULT_ERROR_MESSAGE: '發生未預期的錯誤，請稍後再試',
  
  // 預設載入訊息
  DEFAULT_LOADING_MESSAGE: '載入中...',
  
  // 預設空資料訊息
  DEFAULT_EMPTY_MESSAGE: '目前沒有資料'
} as const;

/**
 * 正規表達式
 */
export const REGEX_PATTERNS = {
  // Email 驗證
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // 電話號碼驗證（台灣）
  PHONE_TW: /^09\d{8}$/,
  
  // URL 驗證
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // 密碼強度（至少8字元，包含大小寫字母和數字）
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8 }$/
} as const;

/**
 * 時間相關常數
 */
export const TIME_CONSTANTS = {
  // 一分鐘的毫秒數
  ONE_MINUTE_MS: 60 * 1000,
  
  // 一小時的毫秒數
  ONE_HOUR_MS: 60 * 60 * 1000,
  
  // 一天的毫秒數
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  
  // 工作時間定義
  BUSINESS_HOURS: {
    START: 9, // 9:00 AM
    END: 18   // 6:00 PM
  }
} as const;