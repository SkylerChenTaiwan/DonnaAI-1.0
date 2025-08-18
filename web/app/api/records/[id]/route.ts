/**
 * GET/PUT/DELETE /api/records/[id]
 * 個別記錄管理 API 路由
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

// 取得單一記錄資料
export async function GET(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return createErrorResponse(
          '缺少記錄 ID',
          400,
          'MISSING_RECORD_ID'
        );
      }

      // 取得記錄資料
      const result = await FirestoreService.getDocument('records', id);

      if (!result.success) {
        return createErrorResponse(
          result.error || '獲取記錄資料失敗',
          500,
          'FETCH_ERROR'
        );
      }

      if (!result.data) {
        return createErrorResponse(
          '找不到記錄資料',
          404,
          'RECORD_NOT_FOUND'
        );
      }

      const record = result.data as any;

      // 權限檢查
      if (user.role !== 'superAdmin' && record.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限存取此記錄資料',
          403,
          'FORBIDDEN'
        );
      }

      // 如果不是管理員，只能看自己的記錄
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin' && record.assignedTo !== user.uid) {
        return createErrorResponse(
          '無權限存取此記錄資料',
          403,
          'FORBIDDEN'
        );
      }

      return createSuccessResponse(
        record,
        '成功獲取記錄資料'
      );

    } catch (error) {
      console.error('Get record error:', error);
      return createErrorResponse(
        '獲取記錄資料失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 更新記錄資料
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
          '缺少記錄 ID',
          400,
          'MISSING_RECORD_ID'
        );
      }

      // 首先檢查記錄是否存在
      const existingResult = await FirestoreService.getDocument('records', id);

      if (!existingResult.success || !existingResult.data) {
        return createErrorResponse(
          '找不到記錄資料',
          404,
          'RECORD_NOT_FOUND'
        );
      }

      const existingRecord = existingResult.data as any;

      // 權限檢查
      if (user.role !== 'superAdmin' && existingRecord.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限修改此記錄資料',
          403,
          'FORBIDDEN'
        );
      }

      // 如果不是管理員，只能修改自己的記錄或被指派的記錄
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin') {
        if (existingRecord.assignedTo !== user.uid && existingRecord.createdBy !== user.uid) {
          return createErrorResponse(
            '無權限修改此記錄資料',
            403,
            'FORBIDDEN'
          );
        }
      }

      // 如果有客戶 ID 變更，檢查客戶是否存在且屬於同組織
      if (body.customerId && body.customerId !== existingRecord.customerId) {
        const customerResult = await FirestoreService.getDocument('customers', body.customerId);
        
        if (!customerResult.success || !customerResult.data) {
          return createErrorResponse(
            '找不到指定的客戶',
            404,
            'CUSTOMER_NOT_FOUND'
          );
        }

        const customer = customerResult.data as any;
        if (customer.organizationId !== existingRecord.organizationId) {
          return createErrorResponse(
            '客戶不屬於同一組織',
            400,
            'CUSTOMER_ORGANIZATION_MISMATCH'
          );
        }
      }

      // 準備更新資料
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      // 只更新提供的欄位
      const allowedFields = [
        'title', 'content', 'type', 'status', 'priority', 'customerId',
        'tags', 'attachments', 'scheduledDate', 'completedDate', 'duration',
        'location', 'outcome', 'nextAction'
      ];

      allowedFields.forEach(field => {
        if (field in body) {
          if (field === 'title' && (!body[field] || typeof body[field] !== 'string')) {
            throw new Error('記錄標題為必填項目且必須是字串');
          }
          
          if (['tags', 'attachments'].includes(field) && body[field] !== undefined) {
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

      // 執行更新
      const result = await FirestoreService.updateDocument('records', id, updateData);

      if (!result.success) {
        return createErrorResponse(
          result.error || '更新記錄資料失敗',
          500,
          'UPDATE_ERROR'
        );
      }

      return createSuccessResponse(
        result.data,
        '記錄資料更新成功'
      );

    } catch (error) {
      console.error('Update record error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '更新記錄資料失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 刪除記錄
export async function DELETE(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return createErrorResponse(
          '缺少記錄 ID',
          400,
          'MISSING_RECORD_ID'
        );
      }

      // 首先檢查記錄是否存在
      const existingResult = await FirestoreService.getDocument('records', id);

      if (!existingResult.success || !existingResult.data) {
        return createErrorResponse(
          '找不到記錄資料',
          404,
          'RECORD_NOT_FOUND'
        );
      }

      const existingRecord = existingResult.data as any;

      // 權限檢查 - 只有 Super Admin 或組織管理員可以刪除
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin') {
        return createErrorResponse(
          '無權限刪除記錄資料',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      if (user.role !== 'superAdmin' && existingRecord.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限刪除此記錄資料',
          403,
          'FORBIDDEN'
        );
      }

      // 檢查是否有相關的任務
      const tasksCheck = await FirestoreService.queryDocuments(
        'tasks',
        'recordId',
        '==',
        id,
        1 // 只需要檢查是否有任務存在
      );

      if (tasksCheck.success && tasksCheck.data && tasksCheck.data.length > 0) {
        return createErrorResponse(
          '無法刪除記錄，因為仍有相關的任務存在',
          409,
          'HAS_RELATED_TASKS'
        );
      }

      // 執行刪除
      const result = await FirestoreService.deleteDocument('records', id);

      if (!result.success) {
        return createErrorResponse(
          result.error || '刪除記錄失敗',
          500,
          'DELETE_ERROR'
        );
      }

      return createSuccessResponse(
        { id },
        '記錄刪除成功'
      );

    } catch (error) {
      console.error('Delete record error:', error);
      return createErrorResponse(
        '刪除記錄失敗',
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