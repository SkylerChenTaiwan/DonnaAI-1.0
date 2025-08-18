/**
 * 通知管理 API
 * 處理通知的查詢、標記讀取、偏好設定等操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/permissions';
import { db, admin } from '@/lib/firebase/admin';
import { getNotificationService } from '@/lib/notifications/notification-service';
import { 
  NotificationStatus, 
  NotificationEventType, 
  NotificationChannel,
  NotificationPriority 
} from '@/lib/notifications/notification-types';

const notificationService = getNotificationService();

/**
 * 獲取使用者通知列表
 */
export async function GET(request: NextRequest) {
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
  const { searchParams } = new URL(request.url);

  try {
    // 查詢參數
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') as NotificationStatus | null;
    const eventType = searchParams.get('eventType') as NotificationEventType | null;
    const priority = searchParams.get('priority') as NotificationPriority | null;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // 建立查詢
    let query = db
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .orderBy('createdAt', 'desc');

    // 篩選條件
    if (status) {
      query = query.where('status', '==', status);
    }

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    if (priority) {
      query = query.where('priority', '==', priority);
    }

    if (unreadOnly) {
      query = query.where('readAt', '==', null);
    }

    // 分頁
    const offset = (page - 1) * limit;
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    // 執行查詢
    const snapshot = await query.limit(limit).get();
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 獲取總數（僅在第一頁時計算）
    let totalCount = 0;
    if (page === 1) {
      const countQuery = db
        .collection('users')
        .doc(user.uid)
        .collection('notifications');
      
      const countSnapshot = await countQuery.count().get();
      totalCount = countSnapshot.data().count;
    }

    // 獲取未讀計數
    const unreadQuery = db
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .where('readAt', '==', null);

    const unreadSnapshot = await unreadQuery.count().get();
    const unreadCount = unreadSnapshot.data().count;

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount: page === 1 ? totalCount : null,
          hasMore: notifications.length === limit,
        },
        statistics: {
          unreadCount,
        },
      },
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_NOTIFICATIONS_ERROR',
          message: '獲取通知失敗',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 發送測試通知
 */
export async function POST(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.DASHBOARD_ADMIN],
    resource: 'notifications',
    action: 'admin'
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
    const { 
      title, 
      message, 
      priority = NotificationPriority.NORMAL,
      channels = [NotificationChannel.IN_APP],
      eventType = NotificationEventType.SYSTEM_UPDATE,
      recipientId = user.uid,
      data = {}
    } = body;

    // 驗證必要欄位
    if (!title || !message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: '標題和內容為必填欄位',
          },
        },
        { status: 400 }
      );
    }

    // 發送通知
    const notificationId = await notificationService.sendNotification({
      eventType,
      title,
      message,
      priority,
      channels,
      recipientId,
      recipientType: 'user',
      organizationId: user.organizationId,
      data,
      metadata: {
        sourceId: user.uid,
        sourceType: 'manual',
        actionUrl: '/notifications',
      },
      maxRetries: 3,
    });

    return NextResponse.json({
      success: true,
      data: {
        notificationId,
        message: '通知已成功發送',
      },
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEND_NOTIFICATION_ERROR',
          message: '發送通知失敗',
        },
      },
      { status: 500 }
    );
  }
}