/**
 * Firebase 錯誤型別定義
 * 提供完整的型別安全錯誤處理系統
 */

// Firebase Auth 錯誤碼
export type FirebaseAuthErrorCode =
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/invalid-email'
  | 'auth/too-many-requests'
  | 'auth/network-request-failed'
  | 'auth/requires-recent-login'
  | 'auth/invalid-credential'
  | 'auth/operation-not-allowed'
  | 'auth/account-exists-with-different-credential'
  | 'auth/credential-already-in-use'
  | 'auth/expired-action-code'
  | 'auth/invalid-action-code'
  | 'auth/missing-action-code'
  | 'auth/user-disabled'
  | 'auth/user-token-expired'
  | 'auth/web-storage-unsupported';

// Firestore 錯誤碼
export type FirestoreErrorCode =
  | 'cancelled'
  | 'unknown'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'not-found'
  | 'already-exists'
  | 'permission-denied'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated';

// Storage 錯誤碼
export type StorageErrorCode =
  | 'storage/unknown'
  | 'storage/object-not-found'
  | 'storage/bucket-not-found'
  | 'storage/project-not-found'
  | 'storage/quota-exceeded'
  | 'storage/unauthenticated'
  | 'storage/unauthorized'
  | 'storage/retry-limit-exceeded'
  | 'storage/invalid-checksum'
  | 'storage/canceled'
  | 'storage/invalid-event-name'
  | 'storage/invalid-url'
  | 'storage/invalid-argument'
  | 'storage/no-default-bucket'
  | 'storage/cannot-slice-blob'
  | 'storage/server-file-wrong-size';

// Functions 錯誤碼
export type FunctionsErrorCode =
  | 'functions/ok'
  | 'functions/cancelled'
  | 'functions/unknown'
  | 'functions/invalid-argument'
  | 'functions/deadline-exceeded'
  | 'functions/not-found'
  | 'functions/already-exists'
  | 'functions/permission-denied'
  | 'functions/resource-exhausted'
  | 'functions/failed-precondition'
  | 'functions/aborted'
  | 'functions/out-of-range'
  | 'functions/unimplemented'
  | 'functions/internal'
  | 'functions/unavailable'
  | 'functions/data-loss'
  | 'functions/unauthenticated';

// 統一的 Firebase 錯誤碼
export type FirebaseErrorCode =
  | FirebaseAuthErrorCode
  | FirestoreErrorCode
  | StorageErrorCode
  | FunctionsErrorCode;

// Firebase 錯誤介面
export interface FirebaseError extends Error {
  code: FirebaseErrorCode;
  customData?: Record<string, unknown>;
  details?: unknown;
}

// Firebase Auth 錯誤
export interface FirebaseAuthError extends FirebaseError {
  code: FirebaseAuthErrorCode;
  email?: string;
  credential?: unknown;
  phoneNumber?: string;
  tenantId?: string;
}

// Firestore 錯誤
export interface FirestoreError extends FirebaseError {
  code: FirestoreErrorCode;
  details?: string;
}

// Storage 錯誤
export interface StorageError extends FirebaseError {
  code: StorageErrorCode;
  serverResponse?: string;
}

// Functions 錯誤
export interface FunctionsError extends FirebaseError {
  code: FunctionsErrorCode;
  details?: unknown;
}

// 型別守衛函數
export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

export function isFirebaseAuthError(error: unknown): error is FirebaseAuthError {
  return (
    isFirebaseError(error) &&
    (error.code as string).startsWith('auth/')
  );
}

export function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    isFirebaseError(error) &&
    !((error.code as string).includes('/'))
  );
}

export function isStorageError(error: unknown): error is StorageError {
  return (
    isFirebaseError(error) &&
    (error.code as string).startsWith('storage/')
  );
}

export function isFunctionsError(error: unknown): error is FunctionsError {
  return (
    isFirebaseError(error) &&
    (error.code as string).startsWith('functions/')
  );
}

// 錯誤訊息對應表
export const AUTH_ERROR_MESSAGES: Record<FirebaseAuthErrorCode, string> = {
  'auth/user-not-found': '找不到此電子郵件帳號',
  'auth/wrong-password': '密碼錯誤',
  'auth/email-already-in-use': '此電子郵件已被註冊',
  'auth/weak-password': '密碼強度不足，請至少使用 6 個字元',
  'auth/invalid-email': '電子郵件格式無效',
  'auth/too-many-requests': '嘗試次數過多，請稍後再試',
  'auth/network-request-failed': '網路連線失敗，請檢查網路設定',
  'auth/requires-recent-login': '為了安全考量，請重新登入後再嘗試更新',
  'auth/invalid-credential': '認證資訊無效，請確認您的電子郵件和密碼',
  'auth/operation-not-allowed': '此操作不被允許',
  'auth/account-exists-with-different-credential': '此帳號已使用其他登入方式',
  'auth/credential-already-in-use': '此認證已被其他帳號使用',
  'auth/expired-action-code': '操作碼已過期',
  'auth/invalid-action-code': '操作碼無效',
  'auth/missing-action-code': '缺少操作碼',
  'auth/user-disabled': '此帳號已被停用',
  'auth/user-token-expired': '登入已過期，請重新登入',
  'auth/web-storage-unsupported': '瀏覽器不支援網頁儲存'
};

export const FIRESTORE_ERROR_MESSAGES: Record<FirestoreErrorCode, string> = {
  'cancelled': '操作已取消',
  'unknown': '發生未知錯誤',
  'invalid-argument': '參數無效',
  'deadline-exceeded': '操作逾時',
  'not-found': '找不到資源',
  'already-exists': '資源已存在',
  'permission-denied': '權限不足',
  'resource-exhausted': '資源耗盡',
  'failed-precondition': '前置條件失敗',
  'aborted': '操作中斷',
  'out-of-range': '超出範圍',
  'unimplemented': '功能未實作',
  'internal': '內部錯誤',
  'unavailable': '服務暫時無法使用',
  'data-loss': '資料遺失',
  'unauthenticated': '未經認證'
};

// 錯誤處理輔助函數
export function getFirebaseErrorMessage(error: unknown): string {
  if (!isFirebaseError(error)) {
    return error instanceof Error ? error.message : '發生未知錯誤';
  }

  if (isFirebaseAuthError(error)) {
    return AUTH_ERROR_MESSAGES[error.code] || error.message;
  }

  if (isFirestoreError(error)) {
    return FIRESTORE_ERROR_MESSAGES[error.code] || error.message;
  }

  return error.message || '發生未知錯誤';
}

// 錯誤轉換函數
export function normalizeFirebaseError(error: unknown): FirebaseError {
  if (isFirebaseError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return {
      ...error,
      code: 'unknown' as FirebaseErrorCode,
      message: error.message
    };
  }

  return {
    name: 'FirebaseError',
    code: 'unknown' as FirebaseErrorCode,
    message: String(error)
  } as FirebaseError;
}