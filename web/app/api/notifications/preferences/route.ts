/**
 * 通知偏好設定 API
 * 管理使用者的通知偏好設定
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/auth-middleware';
import { Permission } from '@/lib/auth/permissions';
import { db } from '@/lib/firebase/admin';
import { 
  NotificationPreferences, 
  NotificationEventType, 
  NotificationChannel,
  NotificationPriority 
} from '@/lib/notifications/notification-types';

/**
 * 獲取使用者通知偏好設定
 */
export async function GET(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.SETTINGS_VIEW],
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
    // 獲取使用者偏好設定
    const preferencesDoc = await db
      .collection('notification-preferences')
      .doc(user.uid)
      .get();

    let preferences: NotificationPreferences;

    if (!preferencesDoc.exists) {
      // 建立預設偏好設定
      preferences = createDefaultPreferences(user.uid, user.organizationId);
      await db
        .collection('notification-preferences')
        .doc(user.uid)
        .set(preferences);
    } else {
      preferences = preferencesDoc.data() as NotificationPreferences;
    }

    return NextResponse.json({
      success: true,
      data: preferences,
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GET_PREFERENCES_ERROR',
          message: '獲取通知偏好設定失敗',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 更新使用者通知偏好設定
 */
export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.SETTINGS_EDIT],
    resource: 'notifications',
    action: 'write'
  });

  if (!authResult.success || !authResult.session) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.error?.status || 401 }
    );
  }

  const { user } = authResult.session;

  try {
    const updates = await request.json();

    // 驗證更新資料
    const validationResult = validatePreferencesUpdate(updates);
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PREFERENCES',
            message: validationResult.error,
          },
        },
        { status: 400 }
      );
    }

    // 準備更新資料
    const updateData: Partial<NotificationPreferences> = {
      ...updates,
      updatedAt: new Date(),
    };

    // 更新偏好設定
    const preferencesRef = db
      .collection('notification-preferences')
      .doc(user.uid);

    await preferencesRef.set(updateData, { merge: true });

    // 獲取更新後的完整資料
    const updatedDoc = await preferencesRef.get();
    const updatedPreferences = updatedDoc.data() as NotificationPreferences;

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: '通知偏好設定已更新',
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_PREFERENCES_ERROR',
          message: '更新通知偏好設定失敗',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 重置為預設偏好設定
 */
export async function DELETE(request: NextRequest) {
  const authResult = await withAuth(request, {
    requireAuth: true,
    requiredPermissions: [Permission.SETTINGS_EDIT],
    resource: 'notifications',
    action: 'write'
  });

  if (!authResult.success || !authResult.session) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.error?.status || 401 }
    );
  }

  const { user } = authResult.session;

  try {
    // 建立預設偏好設定
    const defaultPreferences = createDefaultPreferences(user.uid, user.organizationId);

    // 重置偏好設定
    await db
      .collection('notification-preferences')
      .doc(user.uid)
      .set(defaultPreferences);

    return NextResponse.json({
      success: true,
      data: defaultPreferences,
      message: '通知偏好設定已重置為預設值',
    });

  } catch (error) {
    console.error('Reset notification preferences error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RESET_PREFERENCES_ERROR',
          message: '重置通知偏好設定失敗',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 建立預設偏好設定
 */
function createDefaultPreferences(userId: string, organizationId: string): NotificationPreferences {
  const defaultEventPreferences: NotificationPreferences['eventPreferences'] = {};
  
  // 為每個事件類型設定預設偏好
  Object.values(NotificationEventType).forEach(eventType => {
    switch (eventType) {
      case NotificationEventType.DASHBOARD_ALERT_TRIGGERED:
      case NotificationEventType.SYSTEM_ERROR:
      case NotificationEventType.TASK_OVERDUE:
        // 高優先級事件：啟用所有渠道
        defaultEventPreferences[eventType] = {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
          priority: NotificationPriority.HIGH,
          grouping: 'immediate',
          frequency: 'real_time',
        };
        break;

      case NotificationEventType.TASK_CREATED:
      case NotificationEventType.TASK_ASSIGNED:
      case NotificationEventType.MEETING_SCHEDULED:
      case NotificationEventType.CUSTOMER_STATUS_CHANGED:
        // 重要事件：應用內和推送通知
        defaultEventPreferences[eventType] = {
          enabled: true,
          channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
          priority: NotificationPriority.NORMAL,
          grouping: 'immediate',
          frequency: 'real_time',
        };
        break;

      case NotificationEventType.DASHBOARD_DATA_UPDATED:
      case NotificationEventType.DASHBOARD_METRICS_CHANGED:
      case NotificationEventType.AI_ANALYSIS_COMPLETED:
        // 資訊性事件：僅應用內通知
        defaultEventPreferences[eventType] = {
          enabled: true,
          channels: [NotificationChannel.IN_APP],
          priority: NotificationPriority.LOW,
          grouping: 'batch',
          frequency: 'hourly',
        };
        break;

      default:
        // 其他事件：基本設定
        defaultEventPreferences[eventType] = {
          enabled: true,
          channels: [NotificationChannel.IN_APP],
          priority: NotificationPriority.NORMAL,
          grouping: 'immediate',
          frequency: 'real_time',
        };
        break;
    }
  });

  return {
    userId,
    organizationId,
    enabled: true,
    globalChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
    doNotDisturbHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'Asia/Taipei',
    },
    eventPreferences: defaultEventPreferences,
    channelSettings: {
      [NotificationChannel.EMAIL]: {
        address: '', // 將由系統填入使用者 email
        verified: false,
        digestFrequency: 'daily',
        includeUnread: true,
      },
      [NotificationChannel.SMS]: {
        phoneNumber: '',
        verified: false,
        onlyUrgent: true,
      },
      [NotificationChannel.PUSH]: {
        tokens: [],
        allowSound: true,
        allowVibration: true,
      },
      [NotificationChannel.SLACK]: {
        webhookUrl: '',
        channelId: '',
        mentionUser: false,
      },
    },
    updatedAt: new Date(),
  };
}

/**
 * 驗證偏好設定更新資料
 */
function validatePreferencesUpdate(updates: any): { valid: boolean; error?: string } {
  // 基本型別檢查
  if (typeof updates !== 'object' || updates === null) {
    return { valid: false, error: '更新資料必須是物件' };
  }

  // 驗證 enabled 欄位
  if ('enabled' in updates && typeof updates.enabled !== 'boolean') {
    return { valid: false, error: 'enabled 欄位必須是布林值' };
  }

  // 驗證 globalChannels
  if ('globalChannels' in updates) {
    if (!Array.isArray(updates.globalChannels)) {
      return { valid: false, error: 'globalChannels 必須是陣列' };
    }
    
    const validChannels = Object.values(NotificationChannel);
    const invalidChannels = updates.globalChannels.filter((channel: string) => 
      !validChannels.includes(channel as NotificationChannel)
    );
    
    if (invalidChannels.length > 0) {
      return { valid: false, error: `無效的通知渠道: ${invalidChannels.join(', ')}` };
    }
  }

  // 驗證 doNotDisturbHours
  if ('doNotDisturbHours' in updates) {
    const dndHours = updates.doNotDisturbHours;
    if (dndHours && typeof dndHours === 'object') {
      if ('start' in dndHours && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(dndHours.start)) {
        return { valid: false, error: '勿擾時段開始時間格式無效 (應為 HH:mm)' };
      }
      if ('end' in dndHours && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(dndHours.end)) {
        return { valid: false, error: '勿擾時段結束時間格式無效 (應為 HH:mm)' };
      }
    }
  }

  // 驗證 eventPreferences
  if ('eventPreferences' in updates) {
    const eventPrefs = updates.eventPreferences;
    if (typeof eventPrefs !== 'object') {
      return { valid: false, error: 'eventPreferences 必須是物件' };
    }

    for (const [eventType, prefs] of Object.entries(eventPrefs)) {
      if (!Object.values(NotificationEventType).includes(eventType as NotificationEventType)) {
        return { valid: false, error: `無效的事件類型: ${eventType}` };
      }

      if (typeof prefs !== 'object' || prefs === null) {
        return { valid: false, error: `事件偏好設定必須是物件: ${eventType}` };
      }

      const prefObj = prefs as any;
      
      if ('enabled' in prefObj && typeof prefObj.enabled !== 'boolean') {
        return { valid: false, error: `事件啟用狀態必須是布林值: ${eventType}` };
      }

      if ('channels' in prefObj) {
        if (!Array.isArray(prefObj.channels)) {
          return { valid: false, error: `事件通知渠道必須是陣列: ${eventType}` };
        }
        
        const validChannels = Object.values(NotificationChannel);
        const invalidChannels = prefObj.channels.filter((channel: string) => 
          !validChannels.includes(channel as NotificationChannel)
        );
        
        if (invalidChannels.length > 0) {
          return { valid: false, error: `無效的通知渠道在事件 ${eventType}: ${invalidChannels.join(', ')}` };
        }
      }

      if ('priority' in prefObj && 
          !Object.values(NotificationPriority).includes(prefObj.priority)) {
        return { valid: false, error: `無效的優先級在事件 ${eventType}` };
      }
    }
  }

  return { valid: true };
}