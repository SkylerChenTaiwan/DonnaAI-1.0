/**
 * Legacy Import Cloud Functions
 * 處理舊系統資料導入的後端服務
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";

// 初始化 Admin SDK（如果還沒有初始化）
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * 批量建立用戶帳號（不會影響當前登入狀態）
 */
export const createUsersForImport = onCall({
  memory: "1GiB",
  timeoutSeconds: 540, // 9 分鐘
  region: "asia-east1",
}, async (request) => {
  // 驗證呼叫者權限
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "必須登入才能執行此操作");
  }

  // 支援新舊 API 格式
  let { users, organizationId, teamId, defaultPassword, userData, options } = request.data;
  
  // 處理新格式（來自 UserCreationService）
  if (!organizationId && users && users.length > 0 && users[0].customClaims?.organizationId) {
    organizationId = users[0].customClaims.organizationId;
  }
  
  // 如果沒有提供 teamId，設為 null（可選）
  teamId = teamId || null;
  
  // 處理新格式的選項
  if (options) {
    if (options.generatePasswords && !defaultPassword) {
      defaultPassword = "DonnaAI2024!";
    }
  }
  
  if (!users || !Array.isArray(users)) {
    throw new HttpsError("invalid-argument", "users 必須是陣列");
  }
  
  if (!organizationId) {
    throw new HttpsError("invalid-argument", "必須提供 organizationId");
  }

  const auth = getAuth();
  const db = getFirestore();
  const results = [];
  const errors = [];

  // 檢查呼叫者是否為管理員
  const callerDoc = await db.collection("users").doc(request.auth.uid).get();
  const callerData = callerDoc.data();
  
  if (!callerData || (callerData.role !== "admin" && callerData.role !== "super_admin")) {
    throw new HttpsError("permission-denied", "只有管理員可以執行此操作");
  }

  // 批量處理用戶建立
  // 支援新格式：如果有 userData 陣列，使用它；否則使用 users
  const usersToProcess = userData || users;
  
  for (let i = 0; i < usersToProcess.length; i++) {
    const userInfo = usersToProcess[i];
    const authInfo = users[i]; // 可能包含密碼和其他認證資訊
    try {
      // 檢查用戶是否已存在
      let uid: string;
      let userRecord;
      let isExisting = false;
      
      try {
        // 嘗試取得現有用戶
        userRecord = await auth.getUserByEmail(userInfo.email);
        uid = userRecord.uid;
        isExisting = true;
        console.log(`用戶已存在: ${userInfo.email}, UID: ${uid}`);
        
        // 如果選項指定跳過已存在的用戶
        if (options?.skipExisting) {
          results.push({
            email: userInfo.email,
            uid: uid,
            success: true,
            isExisting: true,
            skipped: true,
          });
          continue;
        }
      } catch (error: any) {
        // 用戶不存在，建立新用戶
        if (error.code === "auth/user-not-found") {
          // 使用提供的密碼或生成密碼
          const password = authInfo?.password || defaultPassword || "DonnaAI2024!";
          
          userRecord = await auth.createUser({
            email: userInfo.email,
            password: password,
            displayName: authInfo?.displayName || userInfo.name || userInfo.businessName,
            disabled: false,
          });
          uid = userRecord.uid;
          console.log(`建立新用戶: ${userInfo.email}, UID: ${uid}`);
        } else {
          throw error;
        }
      }

      // 建立或更新 Firestore 用戶文檔
      const userDocData = {
        id: uid,
        uid: uid,
        email: userInfo.email,
        name: userInfo.name || userInfo.businessName,
        role: userInfo.role || "user",
        organizationId: organizationId,
        teamIds: teamId ? [teamId] : userInfo.teamIds || [],
        department: userInfo.department || userInfo.jobTitle || null,
        phone: userInfo.phone || userInfo.phoneNumber || null,
        isActive: userInfo.isActive !== false,
        createdAt: isExisting ? undefined : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null,
        supervisorId: userInfo.supervisorId || null,
        personalGoals: {},
        platformPermissions: userInfo.platformPermissions || {},
        ...(userInfo.customFields ? { customFields: userInfo.customFields } : {}),
      };
      
      // 移除 undefined 的欄位
      const cleanedUserDocData: any = {};
      Object.keys(userDocData).forEach(key => {
        if ((userDocData as any)[key] !== undefined) {
          cleanedUserDocData[key] = (userDocData as any)[key];
        }
      });
      const finalUserDocData = cleanedUserDocData;

      await db.collection("users").doc(uid).set(finalUserDocData, { merge: true });

      results.push({
        email: userInfo.email,
        uid: uid,
        success: true,
        isExisting: isExisting,
        isNew: !isExisting,
      });

    } catch (error: any) {
      console.error(`建立用戶失敗 ${userInfo.email}:`, error);
      errors.push({
        email: userInfo.email,
        error: error.message || "未知錯誤",
        code: error.code,
      });
      
      results.push({
        email: userData.email,
        success: false,
        error: error.message,
      });
    }
  }

  return {
    success: true,
    totalProcessed: users.length,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    results: results,
    errors: errors,
  };
});

/**
 * 建立主管關係
 */
export const linkSupervisorRelationships = onCall({
  memory: "512MiB",
  timeoutSeconds: 60,
  region: "asia-east1",
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "必須登入才能執行此操作");
  }

  const { supervisorMappings, organizationId } = request.data;
  
  if (!supervisorMappings || typeof supervisorMappings !== "object") {
    throw new HttpsError("invalid-argument", "supervisorMappings 必須是物件");
  }
  
  if (!organizationId) {
    throw new HttpsError("invalid-argument", "必須提供 organizationId");
  }

  const db = getFirestore();
  const batch = db.batch();
  let updateCount = 0;

  // 檢查權限
  const callerDoc = await db.collection("users").doc(request.auth.uid).get();
  const callerData = callerDoc.data();
  
  if (!callerData || (callerData.role !== "admin" && callerData.role !== "super_admin")) {
    throw new HttpsError("permission-denied", "只有管理員可以執行此操作");
  }

  // 更新每個用戶的主管關係
  for (const [supervisorId, subordinateIds] of Object.entries(supervisorMappings)) {
    if (Array.isArray(subordinateIds)) {
      for (const subordinateId of subordinateIds) {
        const userRef = db.collection("users").doc(subordinateId);
        batch.update(userRef, {
          supervisorId: supervisorId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        updateCount++;
      }
    }
  }

  if (updateCount > 0) {
    await batch.commit();
  }

  return {
    success: true,
    updatedCount: updateCount,
  };
});