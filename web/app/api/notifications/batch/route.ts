/**
 * 批次通知操作 API
 * 處理批次標記讀取、刪除等操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/permissions';
import { db, admin } from '@/lib/firebase/admin';

/**
 * 批次操作通知
 */
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.DASHBOARD_VIEW],
    resource: 'notifications',
    action: 'read'
  });

  if (!authResult.success || !authResult.session) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.error?.status || 401 }
    );
  }

  const { user } = authResult.session;

  try {
    const body = await request.json();
    const { action, notificationIds } = body;

    // 驗證輸入
    if (!action || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '無效的批次操作參數',
          },
        },
        { status: 400 }
      );
    }

    if (notificationIds.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TOO_MANY_ITEMS',
            message: '批次操作最多支援 100 個項目',
          },
        },
        { status: 400 }
      );
    }

    let result: any = {};

    switch (action) {
      case 'mark_read':
        result = await batchMarkAsRead(user.uid, notificationIds);
        break;

      case 'mark_unread':
        result = await batchMarkAsUnread(user.uid, notificationIds);
        break;

      case 'delete':
        result = await batchDelete(user.uid, notificationIds);
        break;

      case 'mark_all_read':
        result = await markAllAsRead(user.uid);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: '不支援的批次操作類型',
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error('Batch notification operation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BATCH_OPERATION_ERROR',
          message: '批次操作失敗',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 批次標記為已讀
 */
async function batchMarkAsRead(userId: string, notificationIds: string[]) {
  const batch = db.batch();
  const userNotificationsRef = db
    .collection('users')
    .doc(userId)
    .collection('notifications');

  const readAt = new Date();
  let successCount = 0;
  let unreadCountDecrease = 0;

  // 首先檢查哪些通知確實需要標記為已讀
  const notificationsToUpdate = await Promise.all(
    notificationIds.map(async (notificationId) => {
      try {
        const notificationRef = userNotificationsRef.doc(notificationId);
        const doc = await notificationRef.get();
        
        if (doc.exists && !doc.data()?.readAt) {
          return { id: notificationId, ref: notificationRef };
        }
        return null;
      } catch (error) {
        console.error(`Error checking notification ${notificationId}:`, error);
        return null;
      }
    })
  );

  // 過濾出有效的通知
  const validNotifications = notificationsToUpdate.filter(Boolean);

  if (validNotifications.length === 0) {
    return {
      message: '沒有需要標記為已讀的通知',
      successCount: 0,
      totalCount: notificationIds.length,
    };
  }

  // 批次更新通知
  validNotifications.forEach(notification => {
    if (notification) {
      batch.update(notification.ref, {
        readAt,
        status: 'read',
        updatedAt: new Date(),
      });
      successCount++;
      unreadCountDecrease++;
    }
  });

  // 更新使用者未讀計數
  if (unreadCountDecrease > 0) {
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, {
      'notificationCount.unread': admin.firestore.FieldValue.increment(-unreadCountDecrease),
      'notificationCount.lastUpdated': new Date(),
    });
  }

  // 執行批次操作
  await batch.commit();

  return {
    message: `成功標記 ${successCount} 個通知為已讀`,
    successCount,
    totalCount: notificationIds.length,
    unreadCountDecrease,
  };
}

/**
 * 批次標記為未讀
 */
async function batchMarkAsUnread(userId: string, notificationIds: string[]) {
  const batch = db.batch();
  const userNotificationsRef = db
    .collection('users')
    .doc(userId)
    .collection('notifications');

  let successCount = 0;
  let unreadCountIncrease = 0;

  // 檢查哪些通知需要標記為未讀
  const notificationsToUpdate = await Promise.all(
    notificationIds.map(async (notificationId) => {
      try {
        const notificationRef = userNotificationsRef.doc(notificationId);
        const doc = await notificationRef.get();
        
        if (doc.exists && doc.data()?.readAt) {
          return { id: notificationId, ref: notificationRef };
        }
        return null;
      } catch (error) {
        console.error(`Error checking notification ${notificationId}:`, error);
        return null;
      }
    })
  );

  const validNotifications = notificationsToUpdate.filter(Boolean);

  if (validNotifications.length === 0) {
    return {
      message: '沒有需要標記為未讀的通知',
      successCount: 0,
      totalCount: notificationIds.length,
    };
  }

  // 批次更新通知
  validNotifications.forEach(notification => {
    if (notification) {
      batch.update(notification.ref, {
        readAt: admin.firestore.FieldValue.delete(),
        status: 'delivered',
        updatedAt: new Date(),
      });
      successCount++;
      unreadCountIncrease++;
    }
  });

  // 更新使用者未讀計數
  if (unreadCountIncrease > 0) {
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, {
      'notificationCount.unread': admin.firestore.FieldValue.increment(unreadCountIncrease),
      'notificationCount.lastUpdated': new Date(),
    });
  }

  await batch.commit();

  return {
    message: `成功標記 ${successCount} 個通知為未讀`,
    successCount,
    totalCount: notificationIds.length,
    unreadCountIncrease,
  };
}

/**
 * 批次刪除通知
 */
async function batchDelete(userId: string, notificationIds: string[]) {
  const batch = db.batch();
  const userNotificationsRef = db
    .collection('users')
    .doc(userId)
    .collection('notifications');

  let successCount = 0;
  let unreadCountDecrease = 0;

  // 檢查要刪除的通知
  const notificationsToDelete = await Promise.all(
    notificationIds.map(async (notificationId) => {
      try {
        const notificationRef = userNotificationsRef.doc(notificationId);
        const doc = await notificationRef.get();
        
        if (doc.exists) {
          const isUnread = !doc.data()?.readAt;
          return { 
            id: notificationId, 
            ref: notificationRef, 
            isUnread 
          };
        }
        return null;
      } catch (error) {
        console.error(`Error checking notification ${notificationId}:`, error);
        return null;
      }
    })
  );

  const validNotifications = notificationsToDelete.filter(Boolean);

  if (validNotifications.length === 0) {
    return {
      message: '沒有需要刪除的通知',
      successCount: 0,
      totalCount: notificationIds.length,
    };
  }

  // 批次刪除通知
  validNotifications.forEach(notification => {
    if (notification) {
      batch.delete(notification.ref);
      successCount++;
      if (notification.isUnread) {
        unreadCountDecrease++;
      }
    }
  });

  // 更新使用者未讀計數
  if (unreadCountDecrease > 0) {
    const userRef = db.collection('users').doc(userId);
    batch.update(userRef, {
      'notificationCount.unread': admin.firestore.FieldValue.increment(-unreadCountDecrease),
      'notificationCount.lastUpdated': new Date(),
    });
  }

  await batch.commit();

  return {
    message: `成功刪除 ${successCount} 個通知`,
    successCount,
    totalCount: notificationIds.length,
    unreadCountDecrease,
  };
}

/**
 * 標記所有通知為已讀
 */
async function markAllAsRead(userId: string) {
  const userNotificationsRef = db
    .collection('users')
    .doc(userId)
    .collection('notifications');

  // 分批處理，每次最多 500 個
  const batchSize = 500;
  let processedCount = 0;
  let hasMore = true;

  while (hasMore) {
    // 查詢未讀通知
    const snapshot = await userNotificationsRef
      .where('readAt', '==', null)
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    const batch = db.batch();
    const readAt = new Date();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        readAt,
        status: 'read',
        updatedAt: new Date(),
      });
    });

    await batch.commit();
    processedCount += snapshot.docs.length;

    // 如果這批少於 batchSize，表示沒有更多了
    if (snapshot.docs.length < batchSize) {
      hasMore = false;
    }
  }

  // 重置使用者未讀計數
  if (processedCount > 0) {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      'notificationCount.unread': 0,
      'notificationCount.lastUpdated': new Date(),
    });
  }

  return {
    message: processedCount > 0 
      ? `成功標記所有 ${processedCount} 個通知為已讀` 
      : '沒有未讀的通知',
    successCount: processedCount,
  };
}