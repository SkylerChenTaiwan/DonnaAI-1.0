/**
 * GET/POST /api/tasks
 * 任務管理 API 路由
 */

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/middleware';
import { FirestoreService } from '@/lib/firebase-admin';

interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'proposal' | 'contract' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId?: string;
  customerName?: string;
  recordId?: string; // 關聯的記錄 ID
  organizationId: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  tags?: string[];
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  estimatedDuration?: number; // 預估持續時間（分鐘）
  actualDuration?: number; // 實際持續時間（分鐘）
  location?: string;
  notes?: string;
  result?: string; // 任務結果
  nextAction?: string; // 下一步行動
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  reminders?: Array<{
    type: 'email' | 'push';
    time: string; // 提醒時間
    sent: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 取得任務列表
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type') as Task['type'] | null;
    const status = url.searchParams.get('status') as Task['status'] | null;
    const priority = url.searchParams.get('priority') as Task['priority'] | null;
    const customerId = url.searchParams.get('customerId');
    const assignedTo = url.searchParams.get('assignedTo');
    const organizationId = url.searchParams.get('organizationId');
    const dueDate = url.searchParams.get('dueDate'); // specific date or 'overdue'
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // 權限檢查
    const targetOrgId = organizationId || user.organizationId;
    
    if (!targetOrgId) {
      return createErrorResponse(
        '缺少組織 ID',
        400,
        'MISSING_ORGANIZATION_ID'
      );
    }

    if (user.role !== 'superAdmin' && targetOrgId !== user.organizationId) {
      return createErrorResponse(
        '無權限存取此組織資料',
        403,
        'FORBIDDEN'
      );
    }

    let tasks: any[] = [];
    
    // 基礎查詢
    let result = await FirestoreService.queryDocuments(
      'tasks',
      'organizationId',
      '==',
      targetOrgId
    );

    if (!result.success) {
      return createErrorResponse(
        result.error || '獲取任務資料失敗',
        500,
        'FETCH_ERROR'
      );
    }

    tasks = result.data || [];

    // 應用過濾器
    if (customerId) {
      tasks = tasks.filter((task: any) => task.customerId === customerId);
    }

    if (assignedTo) {
      tasks = tasks.filter((task: any) => task.assignedTo === assignedTo);
    }

    if (type) {
      tasks = tasks.filter((task: any) => task.type === type);
    }

    if (priority) {
      tasks = tasks.filter((task: any) => task.priority === priority);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      tasks = tasks.filter((task: any) => 
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.customerName?.toLowerCase().includes(searchLower) ||
        task.notes?.toLowerCase().includes(searchLower)
      );
    }

    // 狀態過濾和逾期檢查
    const now = new Date();
    tasks.forEach((task: any) => {
      // 自動標記逾期任務
      if (task.status === 'pending' || task.status === 'in_progress') {
        if (task.dueDate && new Date(task.dueDate) < now) {
          task.status = 'overdue';
        }
      }
    });

    if (status) {
      tasks = tasks.filter((task: any) => task.status === status);
    }

    // 特殊日期過濾
    if (dueDate === 'overdue') {
      tasks = tasks.filter((task: any) => task.status === 'overdue');
    } else if (dueDate === 'today') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      tasks = tasks.filter((task: any) => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDueDate === todayStr;
      });
    } else if (dueDate === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      tasks = tasks.filter((task: any) => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate);
        return taskDueDate >= now && taskDueDate <= weekFromNow;
      });
    }

    // 日期範圍過濾
    if (startDate) {
      const start = new Date(startDate);
      tasks = tasks.filter((task: any) => {
        const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
        return taskDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      tasks = tasks.filter((task: any) => {
        const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
        return taskDate <= end;
      });
    }

    // 如果不是 Super Admin 或組織管理員，只顯示指派給自己的任務
    if (user.role !== 'superAdmin' && user.role !== 'orgAdmin') {
      tasks = tasks.filter((task: any) => task.assignedTo === user.uid);
    }

    // 排序：優先級 -> 到期日 -> 建立日期
    tasks.sort((a: any, b: any) => {
      // 優先級排序
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;

      // 到期日排序
      const aDate = a.dueDate ? new Date(a.dueDate) : new Date(0);
      const bDate = b.dueDate ? new Date(b.dueDate) : new Date(0);
      const dateDiff = aDate.getTime() - bDate.getTime();
      if (dateDiff !== 0) return dateDiff;

      // 建立日期排序（最新的在前）
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 分頁
    const totalCount = tasks.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    // 統計各狀態任務數量
    const statusStats = {
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
    };

    const response = {
      tasks: paginatedTasks,
      statusStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        search,
        type,
        status,
        priority,
        customerId,
        assignedTo,
        dueDate,
        startDate,
        endDate,
        organizationId: targetOrgId,
      },
    };

    return createSuccessResponse(
      response,
      `成功獲取 ${paginatedTasks.length} 筆任務資料`
    );

  } catch (error) {
    console.error('Get tasks error:', error);
    return createErrorResponse(
      '獲取任務資料失敗',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// 建立新任務
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    
    // 基本資料驗證
    if (!body.title || typeof body.title !== 'string') {
      return createErrorResponse(
        '任務標題為必填項目',
        400,
        'VALIDATION_ERROR'
      );
    }

    // 設定組織 ID
    const organizationId = body.organizationId || user.organizationId;
    
    if (!organizationId) {
      return createErrorResponse(
        '缺少組織 ID',
        400,
        'MISSING_ORGANIZATION_ID'
      );
    }

    // 權限檢查
    if (user.role !== 'superAdmin' && organizationId !== user.organizationId) {
      return createErrorResponse(
        '無權限在此組織建立任務',
        403,
        'FORBIDDEN'
      );
    }

    // 如果有客戶 ID，檢查客戶是否存在
    let customerName: string | undefined;
    if (body.customerId) {
      const customerResult = await FirestoreService.getDocument('customers', body.customerId);
      
      if (!customerResult.success || !customerResult.data) {
        return createErrorResponse(
          '找不到指定的客戶',
          404,
          'CUSTOMER_NOT_FOUND'
        );
      }

      const customer = customerResult.data as any;
      if (customer.organizationId !== organizationId) {
        return createErrorResponse(
          '客戶不屬於指定的組織',
          400,
          'CUSTOMER_ORGANIZATION_MISMATCH'
        );
      }

      customerName = customer.name;
    }

    // 檢查指派的使用者是否存在且屬於同組織
    const assignedTo = body.assignedTo || user.uid;
    let assignedToName: string | undefined;

    if (assignedTo !== user.uid) {
      const assigneeResult = await FirestoreService.getDocument('users', assignedTo);
      
      if (!assigneeResult.success || !assigneeResult.data) {
        return createErrorResponse(
          '找不到指派的使用者',
          404,
          'ASSIGNEE_NOT_FOUND'
        );
      }

      const assignee = assigneeResult.data as any;
      if (assignee.organizationId !== organizationId) {
        return createErrorResponse(
          '指派的使用者不屬於同一組織',
          400,
          'ASSIGNEE_ORGANIZATION_MISMATCH'
        );
      }

      assignedToName = assignee.displayName || assignee.email;
    }

    // 建立任務資料
    const taskData: Omit<Task, 'id'> = {
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      type: body.type || 'other',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      customerId: body.customerId || undefined,
      customerName,
      recordId: body.recordId || undefined,
      organizationId,
      assignedTo,
      assignedToName,
      assignedBy: user.uid,
      tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
      dueDate: body.dueDate || undefined,
      scheduledDate: body.scheduledDate || undefined,
      completedDate: body.status === 'completed' ? (body.completedDate || new Date().toISOString()) : undefined,
      estimatedDuration: body.estimatedDuration || undefined,
      actualDuration: body.actualDuration || undefined,
      location: body.location?.trim() || undefined,
      notes: body.notes?.trim() || undefined,
      result: body.result?.trim() || undefined,
      nextAction: body.nextAction?.trim() || undefined,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      reminders: Array.isArray(body.reminders) ? body.reminders : [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
    };

    // 如果是完成狀態，確保有完成日期
    if (taskData.status === 'completed' && !taskData.completedDate) {
      taskData.completedDate = new Date().toISOString();
    }

    // 儲存到 Firestore
    const result = await FirestoreService.createDocument('tasks', taskData);

    if (!result.success) {
      return createErrorResponse(
        result.error || '建立任務失敗',
        500,
        'CREATE_ERROR'
      );
    }

    return createSuccessResponse(
      result.data,
      '任務建立成功',
      201
    );

  } catch (error) {
    console.error('Create task error:', error);
    return createErrorResponse(
      '建立任務失敗',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// 支援 OPTIONS 請求（CORS preflight）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}