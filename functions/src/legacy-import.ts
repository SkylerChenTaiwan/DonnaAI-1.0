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

  const { users, organizationId, teamId, defaultPassword } = request.data;
  
  if (!users || !Array.isArray(users)) {
    throw new HttpsError("invalid-argument", "users 必須是陣列");
  }
  
  if (!organizationId || !teamId) {
    throw new HttpsError("invalid-argument", "必須提供 organizationId 和 teamId");
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
  for (const userData of users) {
    try {
      // 檢查用戶是否已存在
      let uid: string;
      let userRecord;
      
      try {
        // 嘗試取得現有用戶
        userRecord = await auth.getUserByEmail(userData.email);
        uid = userRecord.uid;
        console.log(`用戶已存在: ${userData.email}, UID: ${uid}`);
      } catch (error: any) {
        // 用戶不存在，建立新用戶
        if (error.code === "auth/user-not-found") {
          userRecord = await auth.createUser({
            email: userData.email,
            password: defaultPassword || "DonnaAI2024!",
            displayName: userData.name || userData.businessName,
            disabled: false,
          });
          uid = userRecord.uid;
          console.log(`建立新用戶: ${userData.email}, UID: ${uid}`);
        } else {
          throw error;
        }
      }

      // 建立或更新 Firestore 用戶文檔
      const userDocData = {
        id: uid,
        uid: uid,
        email: userData.email,
        name: userData.name || userData.businessName,
        role: userData.role || "salesperson",
        organizationId: organizationId,
        teamIds: [teamId],
        department: userData.department || null,
        phone: userData.phone || null,
        isActive: userData.isActive !== false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: null,
        supervisorId: userData.supervisorId || null,
        personalGoals: {},
        ...(userData.customFields ? { customFields: userData.customFields } : {}),
      };

      await db.collection("users").doc(uid).set(userDocData, { merge: true });

      results.push({
        email: userData.email,
        uid: uid,
        success: true,
        isNew: !userRecord.metadata.creationTime || 
                (Date.now() - new Date(userRecord.metadata.creationTime).getTime() < 1000),
      });

    } catch (error: any) {
      console.error(`建立用戶失敗 ${userData.email}:`, error);
      errors.push({
        email: userData.email,
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