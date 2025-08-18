/**
 * 通知觸發器
 * 監聽各種事件並自動觸發相應的通知
 */

import { getNotificationService } from './notification-service';
import { NotificationEventType } from './notification-types';

const notificationService = getNotificationService();

/**
 * Dashboard 資料變更觸發器
 */
export class DashboardDataTrigger {
  /**
   * 觸發儀表板指標更新通知
   */
  static async triggerMetricsUpdate(
    organizationId: string,
    metricsChanges: {
      revenue?: { old: number; new: number; change: number };
      customers?: { old: number; new: number; change: number };
      tasks?: { old: number; new: number; change: number };
      meetings?: { old: number; new: number; change: number };
    }
  ): Promise<void> {
    const significantChanges = Object.entries(metricsChanges)
      .filter(([key, value]) => Math.abs(value.change) > 0.05) // 5% 以上變化
      .map(([key, value]) => ({
        metric: key,
        oldValue: value.old,
        newValue: value.new,
        changePercent: (value.change * 100).toFixed(1),
        trend: value.change > 0 ? 'increase' : 'decrease',
      }));

    if (significantChanges.length === 0) {
      return; // 沒有顯著變化
    }

    await notificationService.triggerEventNotification(
      NotificationEventType.DASHBOARD_METRICS_CHANGED,
      {
        changes: significantChanges,
        timestamp: new Date().toISOString(),
        sourceId: organizationId,
        sourceType: 'dashboard',
        actionUrl: '/dashboard',
        summary: `${significantChanges.length} 項指標出現顯著變化`,
      },
      organizationId
    );
  }

  /**
   * 觸發儀表板警報通知
   */
  static async triggerDashboardAlert(
    organizationId: string,
    alertType: 'performance_drop' | 'target_missed' | 'anomaly_detected' | 'threshold_exceeded',
    details: {
      metric: string;
      currentValue: number;
      threshold?: number;
      targetValue?: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.DASHBOARD_ALERT_TRIGGERED,
      {
        alertType,
        metric: details.metric,
        currentValue: details.currentValue,
        threshold: details.threshold,
        targetValue: details.targetValue,
        severity: details.severity,
        description: details.description,
        timestamp: new Date().toISOString(),
        sourceId: organizationId,
        sourceType: 'dashboard',
        actionUrl: `/dashboard?alert=${alertType}&metric=${details.metric}`,
      },
      organizationId
    );
  }

  /**
   * 觸發資料更新通知
   */
  static async triggerDataUpdate(
    organizationId: string,
    updateType: 'real_time' | 'scheduled' | 'manual',
    dataTypes: string[],
    statistics: {
      recordsUpdated: number;
      recordsAdded: number;
      recordsRemoved: number;
      processingTime: number;
    }
  ): Promise<void> {
    await notificationService.notifyDashboardDataUpdate(
      organizationId,
      'metrics',
      {
        updateType,
        dataTypes,
        statistics,
        timestamp: new Date().toISOString(),
      }
    );
  }
}

/**
 * 任務相關觸發器
 */
export class TaskEventTrigger {
  /**
   * 觸發任務創建通知
   */
  static async triggerTaskCreated(
    taskId: string,
    taskData: {
      title: string;
      assigneeId: string;
      createdBy: string;
      organizationId: string;
      departmentId?: string;
      priority: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: Date;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.TASK_CREATED,
      {
        taskId,
        title: taskData.title,
        assigneeId: taskData.assigneeId,
        createdBy: taskData.createdBy,
        priority: taskData.priority,
        dueDate: taskData.dueDate,
        sourceId: taskId,
        sourceType: 'task',
        actionUrl: `/tasks/${taskId}`,
      },
      taskData.organizationId,
      [taskData.assigneeId] // 額外通知指派人
    );
  }

  /**
   * 觸發任務逾期通知
   */
  static async triggerTaskOverdue(
    taskId: string,
    taskData: {
      title: string;
      assigneeId: string;
      organizationId: string;
      dueDate: Date;
      overdueDays: number;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.TASK_OVERDUE,
      {
        taskId,
        title: taskData.title,
        assigneeId: taskData.assigneeId,
        dueDate: taskData.dueDate,
        overdueDays: taskData.overdueDays,
        sourceId: taskId,
        sourceType: 'task',
        actionUrl: `/tasks/${taskId}`,
      },
      taskData.organizationId,
      [taskData.assigneeId]
    );
  }

  /**
   * 觸發任務完成通知
   */
  static async triggerTaskCompleted(
    taskId: string,
    taskData: {
      title: string;
      assigneeId: string;
      createdBy: string;
      organizationId: string;
      completedAt: Date;
      completionTime: number; // 完成時間（分鐘）
    }
  ): Promise<void> {
    const recipients = [taskData.createdBy];
    if (taskData.assigneeId !== taskData.createdBy) {
      recipients.push(taskData.assigneeId);
    }

    await notificationService.triggerEventNotification(
      NotificationEventType.TASK_COMPLETED,
      {
        taskId,
        title: taskData.title,
        assigneeId: taskData.assigneeId,
        completedAt: taskData.completedAt,
        completionTime: taskData.completionTime,
        sourceId: taskId,
        sourceType: 'task',
        actionUrl: `/tasks/${taskId}`,
      },
      taskData.organizationId,
      recipients
    );
  }
}

/**
 * 客戶相關觸發器
 */
export class CustomerEventTrigger {
  /**
   * 觸發客戶狀態變更通知
   */
  static async triggerCustomerStatusChanged(
    customerId: string,
    customerData: {
      name: string;
      organizationId: string;
      assigneeId: string;
      oldStatus: string;
      newStatus: string;
      reason?: string;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.CUSTOMER_STATUS_CHANGED,
      {
        customerId,
        customerName: customerData.name,
        oldStatus: customerData.oldStatus,
        newStatus: customerData.newStatus,
        reason: customerData.reason,
        assigneeId: customerData.assigneeId,
        sourceId: customerId,
        sourceType: 'customer',
        actionUrl: `/customers/${customerId}`,
      },
      customerData.organizationId,
      [customerData.assigneeId]
    );
  }

  /**
   * 觸發新客戶創建通知
   */
  static async triggerCustomerCreated(
    customerId: string,
    customerData: {
      name: string;
      organizationId: string;
      assigneeId: string;
      createdBy: string;
      source: string; // 客戶來源
      potentialValue?: number;
    }
  ): Promise<void> {
    const recipients = [customerData.assigneeId];
    if (customerData.createdBy !== customerData.assigneeId) {
      recipients.push(customerData.createdBy);
    }

    await notificationService.triggerEventNotification(
      NotificationEventType.CUSTOMER_CREATED,
      {
        customerId,
        customerName: customerData.name,
        assigneeId: customerData.assigneeId,
        createdBy: customerData.createdBy,
        source: customerData.source,
        potentialValue: customerData.potentialValue,
        sourceId: customerId,
        sourceType: 'customer',
        actionUrl: `/customers/${customerId}`,
      },
      customerData.organizationId,
      recipients
    );
  }
}

/**
 * 會議相關觸發器
 */
export class MeetingEventTrigger {
  /**
   * 觸發會議安排通知
   */
  static async triggerMeetingScheduled(
    meetingId: string,
    meetingData: {
      title: string;
      organizationId: string;
      organizer: string;
      participants: string[];
      scheduledAt: Date;
      duration: number; // 分鐘
      location?: string;
      isOnline?: boolean;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.MEETING_SCHEDULED,
      {
        meetingId,
        title: meetingData.title,
        organizer: meetingData.organizer,
        participants: meetingData.participants,
        scheduledAt: meetingData.scheduledAt,
        duration: meetingData.duration,
        location: meetingData.location,
        isOnline: meetingData.isOnline,
        sourceId: meetingId,
        sourceType: 'meeting',
        actionUrl: `/meetings/${meetingId}`,
      },
      meetingData.organizationId,
      meetingData.participants
    );
  }

  /**
   * 觸發會議開始通知
   */
  static async triggerMeetingStarted(
    meetingId: string,
    meetingData: {
      title: string;
      organizationId: string;
      participants: string[];
      joinUrl?: string;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.MEETING_STARTED,
      {
        meetingId,
        title: meetingData.title,
        participants: meetingData.participants,
        joinUrl: meetingData.joinUrl,
        sourceId: meetingId,
        sourceType: 'meeting',
        actionUrl: meetingData.joinUrl || `/meetings/${meetingId}`,
      },
      meetingData.organizationId,
      meetingData.participants
    );
  }
}

/**
 * 使用者相關觸發器
 */
export class UserEventTrigger {
  /**
   * 觸發使用者邀請通知
   */
  static async triggerUserInvited(
    inviteId: string,
    inviteData: {
      email: string;
      organizationId: string;
      invitedBy: string;
      role: string;
      departmentId?: string;
      expiresAt: Date;
    }
  ): Promise<void> {
    // 這個通知需要特殊處理，因為受邀人還不是系統使用者
    await notificationService.sendNotification({
      eventType: NotificationEventType.USER_INVITED,
      title: '您被邀請加入組織',
      message: `您已被邀請加入組織，角色為 ${inviteData.role}`,
      priority: 'normal' as any,
      channels: ['email' as any], // 只透過 email 通知
      recipientId: inviteData.email, // 使用 email 作為收件人 ID
      recipientType: 'user',
      organizationId: inviteData.organizationId,
      data: {
        inviteId,
        invitedBy: inviteData.invitedBy,
        role: inviteData.role,
        departmentId: inviteData.departmentId,
        expiresAt: inviteData.expiresAt,
      },
      metadata: {
        sourceId: inviteId,
        sourceType: 'user_invite',
        actionUrl: `/invite/${inviteId}`,
      },
      maxRetries: 3,
    });
  }

  /**
   * 觸發使用者角色變更通知
   */
  static async triggerUserRoleChanged(
    userId: string,
    userData: {
      organizationId: string;
      oldRole: string;
      newRole: string;
      changedBy: string;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.USER_ROLE_CHANGED,
      {
        userId,
        oldRole: userData.oldRole,
        newRole: userData.newRole,
        changedBy: userData.changedBy,
        sourceId: userId,
        sourceType: 'user',
        actionUrl: `/profile`,
      },
      userData.organizationId,
      [userId]
    );
  }
}

/**
 * AI 相關觸發器
 */
export class AIEventTrigger {
  /**
   * 觸發 AI 分析完成通知
   */
  static async triggerAIAnalysisCompleted(
    analysisId: string,
    analysisData: {
      type: 'customer_insights' | 'performance_analysis' | 'trend_prediction' | 'risk_assessment';
      organizationId: string;
      requestedBy: string;
      results: {
        insights: number;
        recommendations: number;
        confidence: number;
      };
      processingTime: number;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.AI_ANALYSIS_COMPLETED,
      {
        analysisId,
        analysisType: analysisData.type,
        requestedBy: analysisData.requestedBy,
        insights: analysisData.results.insights,
        recommendations: analysisData.results.recommendations,
        confidence: analysisData.results.confidence,
        processingTime: analysisData.processingTime,
        sourceId: analysisId,
        sourceType: 'ai_analysis',
        actionUrl: `/ai/analysis/${analysisId}`,
      },
      analysisData.organizationId,
      [analysisData.requestedBy]
    );
  }

  /**
   * 觸發 AI 洞察可用通知
   */
  static async triggerAIInsightsAvailable(
    organizationId: string,
    insightData: {
      category: 'sales' | 'customer' | 'performance' | 'market';
      priority: 'low' | 'medium' | 'high';
      insightCount: number;
      actionableItems: number;
    }
  ): Promise<void> {
    // 通知組織管理員
    await notificationService.triggerEventNotification(
      NotificationEventType.AI_INSIGHTS_AVAILABLE,
      {
        category: insightData.category,
        priority: insightData.priority,
        insightCount: insightData.insightCount,
        actionableItems: insightData.actionableItems,
        sourceId: organizationId,
        sourceType: 'ai_insights',
        actionUrl: `/ai/insights?category=${insightData.category}`,
      },
      organizationId
    );
  }
}

/**
 * 系統相關觸發器
 */
export class SystemEventTrigger {
  /**
   * 觸發系統維護通知
   */
  static async triggerSystemMaintenance(
    organizationId: string,
    maintenanceData: {
      type: 'scheduled' | 'emergency' | 'completed';
      startTime: Date;
      endTime: Date;
      affectedServices: string[];
      description: string;
    }
  ): Promise<void> {
    await notificationService.triggerEventNotification(
      NotificationEventType.SYSTEM_MAINTENANCE,
      {
        maintenanceType: maintenanceData.type,
        startTime: maintenanceData.startTime,
        endTime: maintenanceData.endTime,
        affectedServices: maintenanceData.affectedServices,
        description: maintenanceData.description,
        sourceId: `maintenance_${Date.now()}`,
        sourceType: 'system',
        actionUrl: '/system/status',
      },
      organizationId
    );
  }

  /**
   * 觸發系統錯誤通知
   */
  static async triggerSystemError(
    organizationId: string,
    errorData: {
      errorType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      affectedUsers?: number;
      resolution?: string;
    }
  ): Promise<void> {
    // 只通知管理員
    await notificationService.triggerEventNotification(
      NotificationEventType.SYSTEM_ERROR,
      {
        errorType: errorData.errorType,
        severity: errorData.severity,
        message: errorData.message,
        affectedUsers: errorData.affectedUsers,
        resolution: errorData.resolution,
        sourceId: `error_${Date.now()}`,
        sourceType: 'system',
        actionUrl: '/admin/system/errors',
      },
      organizationId
    );
  }
}

/**
 * 批次通知觸發器
 */
export class BatchNotificationTrigger {
  /**
   * 觸發每日摘要通知
   */
  static async triggerDailySummary(organizationId: string): Promise<void> {
    // TODO: 實作每日摘要邏輯
    console.log('Triggering daily summary for organization:', organizationId);
  }

  /**
   * 觸發週報通知
   */
  static async triggerWeeklyReport(organizationId: string): Promise<void> {
    // TODO: 實作週報邏輯
    console.log('Triggering weekly report for organization:', organizationId);
  }
}