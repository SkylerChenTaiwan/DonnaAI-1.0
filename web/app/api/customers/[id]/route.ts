/**
 * GET/PUT/DELETE /api/customers/[id]
 * 個別客戶管理 API 路由
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

// 取得單一客戶資料
export async function GET(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return createErrorResponse(
          '缺少客戶 ID',
          400,
          'MISSING_CUSTOMER_ID'
        );
      }

      // 取得客戶資料
      const result = await FirestoreService.getDocument('customers', id);

      if (!result.success) {
        return createErrorResponse(
          result.error || '獲取客戶資料失敗',
          500,
          'FETCH_ERROR'
        );
      }

      if (!result.data) {
        return createErrorResponse(
          '找不到客戶資料',
          404,
          'CUSTOMER_NOT_FOUND'
        );
      }

      const customer = result.data as any;

      // 權限檢查
      if (user.role !== 'superAdmin' && customer.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限存取此客戶資料',
          403,
          'FORBIDDEN'
        );
      }

      return createSuccessResponse(
        customer,
        '成功獲取客戶資料'
      );

    } catch (error) {
      console.error('Get customer error:', error);
      return createErrorResponse(
        '獲取客戶資料失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 更新客戶資料
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
          '缺少客戶 ID',
          400,
          'MISSING_CUSTOMER_ID'
        );
      }

      // 首先檢查客戶是否存在
      const existingResult = await FirestoreService.getDocument('customers', id);

      if (!existingResult.success || !existingResult.data) {
        return createErrorResponse(
          '找不到客戶資料',
          404,
          'CUSTOMER_NOT_FOUND'
        );
      }

      const existingCustomer = existingResult.data as any;

      // 權限檢查
      if (user.role !== 'superAdmin' && existingCustomer.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限修改此客戶資料',
          403,
          'FORBIDDEN'
        );
      }

      // 檢查電子郵件是否重複
      if (body.email && body.email !== existingCustomer.email) {
        const duplicateCheck = await FirestoreService.queryDocuments(
          'customers',
          'email',
          '==',
          body.email
        );
        
        if (duplicateCheck.success && duplicateCheck.data && duplicateCheck.data.length > 0) {
          const duplicate = duplicateCheck.data.find((c: any) => 
            c.id !== id && c.organizationId === existingCustomer.organizationId
          );
          
          if (duplicate) {
            return createErrorResponse(
              '此電子郵件已被其他客戶使用',
              409,
              'DUPLICATE_EMAIL'
            );
          }
        }
      }

      // 準備更新資料
      const updateData: Record<string, any> = {
        updatedAt: new Date(),
      };

      // 只更新提供的欄位
      const allowedFields = [
        'name', 'email', 'phone', 'company', 'position', 'source',
        'status', 'tags', 'notes', 'assignedTo', 'lastContactDate', 'nextFollowUpDate'
      ];

      allowedFields.forEach(field => {
        if (field in body) {
          if (field === 'name' && (!body[field] || typeof body[field] !== 'string')) {
            throw new Error('客戶姓名為必填項目且必須是字串');
          }
          
          if (field === 'tags' && body[field] !== undefined) {
            updateData[field] = Array.isArray(body[field]) 
              ? body[field].filter(Boolean) 
              : [];
          } else {
            updateData[field] = body[field]?.trim?.() || body[field];
          }
        }
      });

      // 執行更新
      const result = await FirestoreService.updateDocument('customers', id, updateData);

      if (!result.success) {
        return createErrorResponse(
          result.error || '更新客戶資料失敗',
          500,
          'UPDATE_ERROR'
        );
      }

      return createSuccessResponse(
        result.data,
        '客戶資料更新成功'
      );

    } catch (error) {
      console.error('Update customer error:', error);
      return createErrorResponse(
        error instanceof Error ? error.message : '更新客戶資料失敗',
        500,
        'INTERNAL_ERROR'
      );
    }
  })(request, user);
}

// 刪除客戶
export async function DELETE(
  request: NextRequest, 
  context: RouteParams
) {
  return withAuth(async (request: NextRequest, user) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return createErrorResponse(
          '缺少客戶 ID',
          400,
          'MISSING_CUSTOMER_ID'
        );
      }

      // 首先檢查客戶是否存在
      const existingResult = await FirestoreService.getDocument('customers', id);

      if (!existingResult.success || !existingResult.data) {
        return createErrorResponse(
          '找不到客戶資料',
          404,
          'CUSTOMER_NOT_FOUND'
        );
      }

      const existingCustomer = existingResult.data as any;

      // 權限檢查 - 只有 Super Admin 或組織管理員可以刪除
      if (user.role !== 'superAdmin' && user.role !== 'orgAdmin') {
        return createErrorResponse(
          '無權限刪除客戶資料',
          403,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      if (user.role !== 'superAdmin' && existingCustomer.organizationId !== user.organizationId) {
        return createErrorResponse(
          '無權限刪除此客戶資料',
          403,
          'FORBIDDEN'
        );
      }

      // 檢查是否有相關的記錄或任務
      const recordsCheck = await FirestoreService.queryDocuments(
        'records',
        'customerId',
        '==',
        id,
        1 // 只需要檢查是否有記錄存在
      );

      const tasksCheck = await FirestoreService.queryDocuments(
        'tasks',
        'customerId',
        '==',
        id,
        1 // 只需要檢查是否有任務存在
      );

      if (
        (recordsCheck.success && recordsCheck.data && recordsCheck.data.length > 0) ||
        (tasksCheck.success && tasksCheck.data && tasksCheck.data.length > 0)
      ) {
        return createErrorResponse(
          '無法刪除客戶，因為仍有相關的記錄或任務存在',
          409,
          'HAS_RELATED_DATA'
        );
      }

      // 執行刪除
      const result = await FirestoreService.deleteDocument('customers', id);

      if (!result.success) {
        return createErrorResponse(
          result.error || '刪除客戶失敗',
          500,
          'DELETE_ERROR'
        );
      }

      return createSuccessResponse(
        { id },
        '客戶刪除成功'
      );

    } catch (error) {
      console.error('Delete customer error:', error);
      return createErrorResponse(
        '刪除客戶失敗',
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