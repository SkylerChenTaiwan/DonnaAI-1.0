/**
 * Google Calendar 同步排程 Cloud Function
 * 定期執行行事曆同步
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// 初始化服務
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * 定期執行的 Calendar 同步函數
 * 每 30 分鐘執行一次
 */
export const scheduledCalendarSync = functions.pubsub
  .schedule("every 30 minutes")
  .timeZone("Asia/Taipei")
  .onRun(async (context) => {
    console.log("開始執行定期 Calendar 同步");
    
    try {
      // 獲取所有啟用自動同步的使用者
      const syncSettingsSnapshot = await db
        .collection("calendarSyncSettings")
        .where("enabled", "==", true)
        .get();
      
      if (syncSettingsSnapshot.empty) {
        console.log("沒有使用者啟用自動同步");
        return;
      }
      
      const syncPromises: Promise<void>[] = [];
      
      for (const doc of syncSettingsSnapshot.docs) {
        const settings = doc.data();
        const userId = doc.id;
        
        // 檢查是否需要同步（根據設定的間隔）
        if (shouldSync(settings)) {
          syncPromises.push(
            syncUserCalendar(userId, settings.teamId)
              .catch((error) => {
                console.error(`同步使用者 ${userId} 的行事曆失敗:`, error);
              })
          );
        }
      }
      
      await Promise.all(syncPromises);
      console.log(`完成 ${syncPromises.length} 個使用者的行事曆同步`);
      
    } catch (error) {
      console.error("定期同步失敗:", error);
    }
  });

/**
 * 手動觸發的 Calendar 同步函數
 * 可透過 HTTP 請求觸發特定使用者的同步
 */
export const triggerCalendarSync = functions.https.onCall(
  async (data, context) => {
    // 驗證使用者身份
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "必須登入才能執行同步"
      );
    }
    
    const userId = context.auth.uid;
    const { teamId } = data;
    
    if (!teamId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "必須提供 teamId"
      );
    }
    
    try {
      await syncUserCalendar(userId, teamId);
      return { success: true, message: "同步完成" };
    } catch (error) {
      console.error("手動同步失敗:", error);
      throw new functions.https.HttpsError(
        "internal",
        "同步失敗"
      );
    }
  }
);

/**
 * 檢查是否需要同步
 */
function shouldSync(settings: any): boolean {
  if (!settings.lastSyncAt) {
    return true;
  }
  
  const lastSync = settings.lastSyncAt.toDate();
  const intervalMs = (settings.intervalMinutes || 30) * 60 * 1000;
  const nextSyncTime = new Date(lastSync.getTime() + intervalMs);
  
  return new Date() >= nextSyncTime;
}

/**
 * 同步特定使用者的行事曆
 */
async function syncUserCalendar(
  userId: string,
  teamId: string
): Promise<void> {
  // 獲取使用者的 Google Calendar 權杖
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("找不到使用者");
  }
  
  const userData = userDoc.data();
  const accessToken = userData?.googleCalendarToken;
  const tokenExpiry = userData?.googleCalendarTokenExpiry?.toDate();
  
  // 檢查權杖有效性
  if (!accessToken || !tokenExpiry || tokenExpiry < new Date()) {
    console.log(`使用者 ${userId} 的 Calendar 權杖已過期或不存在`);
    
    // 發送通知提醒使用者重新授權
    await createNotification(userId, {
      type: "calendar_auth_required",
      title: "需要重新授權 Google Calendar",
      message: "您的 Google Calendar 授權已過期，請重新授權以繼續同步行事曆。",
      priority: "high"
    });
    
    return;
  }
  
  // 執行同步邏輯
  // 注意：這裡需要實作實際的 Google Calendar API 呼叫
  // 由於 Cloud Functions 環境的限制，建議將主要邏輯放在前端服務中
  
  // 更新同步狀態
  await db.collection("calendarSync").doc(userId).set({
    lastSyncAt: admin.firestore.FieldValue.serverTimestamp(),
    status: "completed",
    syncedItems: 0 // 實際同步的項目數
  }, { merge: true });
}

/**
 * 建立通知
 */
async function createNotification(
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    priority: string;
  }
): Promise<void> {
  await db.collection("notifications").add({
    userId,
    ...notification,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}