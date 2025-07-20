/**
 * Firebase 連接工具
 * 處理 Firebase Admin SDK 的初始化和配置
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 初始化 Firebase Admin SDK
 * @returns Firestore 資料庫實例
 */
export function initializeFirebase(): admin.firestore.Firestore {
  // 檢查是否已經初始化
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin SDK 已經初始化');
    return admin.firestore();
  }

  // 檢查環境變數中的憑證
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('🔑 使用環境變數中的服務帳號憑證');
    admin.initializeApp();
  } else {
    // 嘗試載入本地服務帳號金鑰
    const serviceAccountPath = path.join(__dirname, '..', 'service-account-key.json');
    const rootServiceAccountPath = path.join(__dirname, '..', '..', '..', 'service-account-key.json');
    
    let serviceAccountKey;
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log('🔑 使用本地服務帳號金鑰:', serviceAccountPath);
      serviceAccountKey = require(serviceAccountPath);
    } else if (fs.existsSync(rootServiceAccountPath)) {
      console.log('🔑 使用專案根目錄的服務帳號金鑰:', rootServiceAccountPath);
      serviceAccountKey = require(rootServiceAccountPath);
    } else {
      console.error('❌ 找不到服務帳號金鑰！');
      console.log('請確保以下其中一項：');
      console.log('1. 設定 GOOGLE_APPLICATION_CREDENTIALS 環境變數');
      console.log('2. 在 scripts/seed-data/service-account-key.json 放置服務帳號金鑰');
      console.log('3. 在專案根目錄放置 service-account-key.json');
      console.log('\n取得服務帳號金鑰的步驟：');
      console.log('1. 前往 Firebase Console > 專案設定 > 服務帳戶');
      console.log('2. 點擊「產生新的私密金鑰」');
      console.log('3. 將下載的 JSON 檔案重新命名為 service-account-key.json');
      process.exit(1);
    }
    
    // 從環境變數或服務帳號金鑰中取得專案 ID
    const projectId = process.env.FIREBASE_PROJECT_ID || 
                     process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
                     serviceAccountKey?.project_id;
    
    if (!projectId) {
      console.error('❌ 找不到 Firebase 專案 ID！');
      console.log('請確保環境變數中有 FIREBASE_PROJECT_ID 或 EXPO_PUBLIC_FIREBASE_PROJECT_ID');
      process.exit(1);
    }
    
    // 初始化 Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
      projectId: projectId
    });
    
    console.log('✅ Firebase Admin SDK 初始化成功');
    console.log(`📍 專案 ID: ${projectId}`);
  }
  
  const db = admin.firestore();
  
  // 設定 Firestore 設定
  db.settings({
    ignoreUndefinedProperties: true,
    timestampsInSnapshots: true
  });
  
  return db;
}

/**
 * 取得 Firestore 時間戳記
 */
export function getTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

/**
 * 取得批次操作實例
 */
export function getBatch(db: admin.firestore.Firestore) {
  return db.batch();
}

/**
 * 產生文件 ID
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}