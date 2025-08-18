/**
 * GET/PUT/DELETE /api/tasks/[id]
 * 個別任務管理 API 路由
 */

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/middleware';
import { FirestoreService } from '@/lib/firebase-admin';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// 取得單一任務資料
export async function GET(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return createErrorResponse(
          '缺少任務 ID',
          400,
          'MISSING_TASK_ID'
        );
      }

      // 取得任務資料
      const result = await FirestoreService.getDocument('tasks', id);

      if (!result.success) {
        return createErrorResponse(
          result.error || '獲取任務資料失敗',
          500,
          'FETCH_ERROR'
        );
      }

      if (!result.data) {
        return createErrorResponse(
          '找不到任務資料',
          404,
          'TASK_NOT_FOUND'
        );
      }

      const task = result.data as any;

      // 權限檢查
      if (user.role !== 'superAdmin' && task.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限存取此任務資料',
          403,
          'FORBIDDEN'
        );
      }

      // 如果不是管理員，只能看自己被指派的任務
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin' && task.assignedTo !== user.uid) {
        return createErrorResponse(
          '無權限存取此任務資料',
          403,
          'FORBIDDEN'
        );
      }

      // 檢查是否逾期
      if ((task.status === 'pending' || task.status === 'in_progress') && task.dueDate) {
        if (new Date(task.dueDate) < new Date()) {
          task.status = 'overdue';
        }
      }

      return createSuccessResponse(
        task,
        '成功獲取任務資料'
      );

    } catch (error) {
      console.error('Get task error:', error);
      return createErrorResponse(
        '獲取任務資料失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 更新任務資料
export async function PUT(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;
      const body = await request.json();

      if (!id) {
        return createErrorResponse(
          '缺少任務 ID',
          400,
          'MISSING_TASK_ID'
        );
      }

      // 首先檢查任務是否存在
      const existingResult = await FirestoreService.getDocument('tasks', id);

      if (!existingResult.success || !existingResult.data) {
        return createErrorResponse(
          '找不到任務資料',
          404,
          'TASK_NOT_FOUND'
        );
      }

      const existingTask = existingResult.data as any;

      // 權限檢查
      if (user.role !== 'superAdmin' && existingTask.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限修改此任務資料',
          403,
          'FORBIDDEN'
        );
      }

      // 如果不是管理員，只能修改指派給自己的任務或自己建立的任務
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin') {
        if (existingTask.assignedTo !== user.uid && existingTask.createdBy !== user.uid) {
          return createErrorResponse(
            '無權限修改此任務資料',
            403,
            'FORBIDDEN'
          );
        }
      }

      // 如果有客戶 ID 變更，檢查客戶是否存在且屬於同組織
      if (body.customerId && body.customerId !== existingTask.customerId) {
        const customerResult = await FirestoreService.getDocument('customers', body.customerId);
        
        if (!customerResult.success || !customerResult.data) {
          return createErrorResponse(
            '找不到指定的客戶',
            404,
            'CUSTOMER_NOT_FOUND'
          );
        }

        const customer = customerResult.data as any;
        if (customer.organizationId !== existingTask.organizationId) {
          return createErrorResponse(
            '客戶不屬於同一組織',
            400,
            'CUSTOMER_ORGANIZATION_MISMATCH'
          );
        }
      }

      // 如果有指派的使用者變更，檢查使用者是否存在且屬於同組織
      if (body.assignedTo && body.assignedTo !== existingTask.assignedTo) {
        const assigneeResult = await FirestoreService.getDocument('users', body.assignedTo);
        
        if (!assigneeResult.success || !assigneeResult.data) {
          return createErrorResponse(
            '找不到指派的使用者',
            404,
            'ASSIGNEE_NOT_FOUND'
          );
        }

        const assignee = assigneeResult.data as any;
        if (assignee.organizationId !== existingTask.organizationId) {
          return createErrorResponse(
            '指派的使用者不屬於同一組織',
            400,
            'ASSIGNEE_ORGANIZATION_MISMATCH'
          );
        }
      }

      // 準備更新資料
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      // 只更新提供的欄位
      const allowedFields = [
        'title', 'description', 'type', 'status', 'priority', 'customerId',
        'recordId', 'assignedTo', 'tags', 'dueDate', 'scheduledDate', 
        'completedDate', 'estimatedDuration', 'actualDuration', 'location',
        'notes', 'result', 'nextAction', 'attachments', 'reminders'
      ];

      allowedFields.forEach(field => {
        if (field in body) {
          if (field === 'title' && (!body[field] || typeof body[field] !== 'string')) {
            throw new Error('任務標題為必填項目且必須是字串');
          }
          
          if (['tags', 'attachments', 'reminders'].includes(field) && body[field] !== undefined) {
            updateData[field] = Array.isArray(body[field]) 
              ? (field === 'tags' ? body[field].filter(Boolean) : body[field])
              : [];
          } else {
            updateData[field] = body[field]?.trim?.() || body[field];
          }
        }
      });

      // 如果狀態更改為完成且沒有完成日期，設定當前時間
      if (updateData.status === 'completed' && !updateData.completedDate) {
        updateData.completedDate = new Date().toISOString();
      }

      // 如果有客戶 ID，更新客戶名稱
      if (updateData.customerId) {
        const customerResult = await FirestoreService.getDocument('customers', updateData.customerId);
        if (customerResult.success && customerResult.data) {
          updateData.customerName = (customerResult.data as any).name;
        }
      }

      // 如果有指派使用者 ID，更新使用者名稱
      if (updateData.assignedTo) {
        const userResult = await FirestoreService.getDocument('users', updateData.assignedTo);
        if (userResult.success && userResult.data) {
          const userData = userResult.data as any;
          updateData.assignedToName = userData.displayName || userData.email;
        }
      }

      // 執行更新
      const result = await FirestoreService.updateDocument('tasks', id, updateData);

      if (!result.success) {
        return createErrorResponse(
          result.error || '更新任務資料失敗',
          500,
          'UPDATE_ERROR'
        );
      }

      return createSuccessResponse(
        result.data,
        '任務資料更新成功'
      );

    } catch (error) {
      console.error('Update task error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '更新任務資料失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 刪除任務
export async function DELETE(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return createErrorResponse(
          '缺少任務 ID',
          400,
          'MISSING_TASK_ID'
        );
      }

      // 首先檢查任務是否存在
      const existingResult = await FirestoreService.getDocument('tasks', id);

      if (!existingResult.success || !existingResult.data) {
        return createErrorResponse(
          '找不到任務資料',
          404,
          'TASK_NOT_FOUND'
        );
      }

      const existingTask = existingResult.data as any;

      // 權限檢查 - 只有 Super Admin、組織管理員或任務創建者可以刪除
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin' && existingTask.createdBy !== user.uid) {
        return createErrorResponse(
          '無權限刪除任務資料',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      if (user.role !== 'superAdmin' && existingTask.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限刪除此任務資料',
          403,
          'FORBIDDEN'
        );
      }

      // 執行刪除
      const result = await FirestoreService.deleteDocument('tasks', id);

      if (!result.success) {
        return createErrorResponse(
          result.error || '刪除任務失敗',
          500,
          'DELETE_ERROR'
        );
      }

      return createSuccessResponse(
        { id },
        '任務刪除成功'
      );

    } catch (error) {
      console.error('Delete task error:', error);
      return createErrorResponse(
        '刪除任務失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 支援 OPTIONS 請求（CORS preflight）
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}