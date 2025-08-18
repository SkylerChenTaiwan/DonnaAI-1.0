/**
 * 通知讀取狀態 API
 * 標記通知為已讀/未讀
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/permissions';
import { db, admin } from '@/lib/firebase/admin';

/**
 * 標記通知為已讀
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const notificationId = params.id;

  try {
    const notificationRef = db
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .doc(notificationId);

    // 檢查通知是否存在
    const notificationDoc = await notificationRef.get();
    if (!notificationDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: '通知不存在',
          },
        },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // 如果已經是已讀狀態，直接返回
    if (notificationData?.readAt) {
      return NextResponse.json({
        success: true,
        data: {
          message: '通知已經是已讀狀態',
          readAt: notificationData.readAt,
        },
      });
    }

    // 標記為已讀
    const readAt = new Date();
    await notificationRef.update({
      readAt,
      status: 'read',
      updatedAt: new Date(),
    });

    // 更新使用者的未讀計數
    const userRef = db.collection('users').doc(user.uid);
    await userRef.update({
      'notificationCount.unread': admin.firestore.FieldValue.increment(-1),
      'notificationCount.lastUpdated': new Date(),
    });

    // 同步更新主要通知記錄
    try {
      await db.collection('notifications').doc(notificationId).update({
        readAt,
        status: 'read',
        updatedAt: new Date(),
      });
    } catch (error) {
      // 主要記錄可能不存在，忽略錯誤
      console.warn('Update main notification record failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '通知已標記為已讀',
        readAt,
      },
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MARK_READ_ERROR',
          message: '標記通知為已讀失敗',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 標記通知為未讀
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const notificationId = params.id;

  try {
    const notificationRef = db
      .collection('users')
      .doc(user.uid)
      .collection('notifications')
      .doc(notificationId);

    // 檢查通知是否存在
    const notificationDoc = await notificationRef.get();
    if (!notificationDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: '通知不存在',
          },
        },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // 如果已經是未讀狀態，直接返回
    if (!notificationData?.readAt) {
      return NextResponse.json({
        success: true,
        data: {
          message: '通知已經是未讀狀態',
        },
      });
    }

    // 標記為未讀
    await notificationRef.update({
      readAt: admin.firestore.FieldValue.delete(),
      status: 'delivered',
      updatedAt: new Date(),
    });

    // 更新使用者的未讀計數
    const userRef = db.collection('users').doc(user.uid);
    await userRef.update({
      'notificationCount.unread': admin.firestore.FieldValue.increment(1),
      'notificationCount.lastUpdated': new Date(),
    });

    // 同步更新主要通知記錄
    try {
      await db.collection('notifications').doc(notificationId).update({
        readAt: admin.firestore.FieldValue.delete(),
        status: 'delivered',
        updatedAt: new Date(),
      });
    } catch (error) {
      console.warn('Update main notification record failed:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        message: '通知已標記為未讀',
      },
    });

  } catch (error) {
    console.error('Mark notification as unread error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MARK_UNREAD_ERROR',
          message: '標記通知為未讀失敗',
        },
      },
      { status: 500 }
    );
  }
}