/**
 * GET/POST /api/records
 * 客戶互動記錄管理 API 路由
 */

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/middleware';
import { FirestoreService } from '@/lib/firebase-admin';

interface Record {
  id: string;
  title: string;
  content: string;
  type: 'call' | 'email' | 'meeting' | 'visit' | 'follow_up' | 'demo' | 'proposal' | 'contract' | 'other';
  status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  customerId: string;
  customerName?: string; // 為了查詢方便
  organizationId: string;
  assignedTo: string;
  assignedToName?: string; // 為了顯示方便
  tags?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  scheduledDate?: string;
  completedDate?: string;
  duration?: number; // 持續時間（分鐘）
  location?: string;
  outcome?: string; // 結果描述
  nextAction?: string; // 下一步行動
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 取得記錄列表
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search');
    const type = url.searchParams.get('type') as Record['type'] | null;
    const status = url.searchParams.get('status') as Record['status'] | null;
    const customerId = url.searchParams.get('customerId');
    const assignedTo = url.searchParams.get('assignedTo');
    const organizationId = url.searchParams.get('organizationId');
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

    let records: any[] = [];
    
    // 基礎查詢
    let result = await FirestoreService.queryDocuments(
      'records',
      'organizationId',
      '==',
      targetOrgId
    );

    if (!result.success) {
      return createErrorResponse(
        result.error || '獲取記錄資料失敗',
        500,
        'FETCH_ERROR'
      );
    }

    records = result.data || [];

    // 應用過濾器
    if (customerId) {
      records = records.filter((record: any) => record.customerId === customerId);
    }

    if (assignedTo) {
      records = records.filter((record: any) => record.assignedTo === assignedTo);
    }

    if (type) {
      records = records.filter((record: any) => record.type === type);
    }

    if (status) {
      records = records.filter((record: any) => record.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      records = records.filter((record: any) => 
        record.title?.toLowerCase().includes(searchLower) ||
        record.content?.toLowerCase().includes(searchLower) ||
        record.customerName?.toLowerCase().includes(searchLower) ||
        record.outcome?.toLowerCase().includes(searchLower)
      );
    }

    // 日期範圍過濾
    if (startDate) {
      const start = new Date(startDate);
      records = records.filter((record: any) => {
        const recordDate = record.scheduledDate ? new Date(record.scheduledDate) : new Date(record.createdAt);
        return recordDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // 包含整天
      records = records.filter((record: any) => {
        const recordDate = record.scheduledDate ? new Date(record.scheduledDate) : new Date(record.createdAt);
        return recordDate <= end;
      });
    }

    // 如果不是 Super Admin，只顯示自己的記錄
    if (user.role !== 'superAdmin' && user.role !== 'orgAdmin') {
      records = records.filter((record: any) => record.assignedTo === user.uid);
    }

    // 按日期排序（最新的在前）
    records.sort((a: any, b: any) => {
      const dateA = new Date(a.scheduledDate || a.createdAt);
      const dateB = new Date(b.scheduledDate || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    // 分頁
    const totalCount = records.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecords = records.slice(startIndex, endIndex);

    const response = {
      records: paginatedRecords,
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
        customerId,
        assignedTo,
        startDate,
        endDate,
        organizationId: targetOrgId,
      },
    };

    return createSuccessResponse(
      response,
      `成功獲取 ${paginatedRecords.length} 筆記錄資料`
    );

  } catch (error) {
    console.error('Get records error:', error);
    return createErrorResponse(
      '獲取記錄資料失敗',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// 建立新記錄
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    
    // 基本資料驗證
    if (!body.title || typeof body.title !== 'string') {
      return createErrorResponse(
        '記錄標題為必填項目',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!body.customerId) {
      return createErrorResponse(
        '客戶 ID 為必填項目',
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
        '無權限在此組織建立記錄',
        403,
        'FORBIDDEN'
      );
    }

    // 檢查客戶是否存在
    const customerResult = await FirestoreService.getDocument('customers', body.customerId);
    
    if (!customerResult.success || !customerResult.data) {
      return createErrorResponse(
        '找不到指定的客戶',
        404,
        'CUSTOMER_NOT_FOUND'
      );
    }

    const customer = customerResult.data as any;

    // 檢查客戶是否屬於同一組織
    if (customer.organizationId !== organizationId) {
      return createErrorResponse(
        '客戶不屬於指定的組織',
        400,
        'CUSTOMER_ORGANIZATION_MISMATCH'
      );
    }

    // 建立記錄資料
    const recordData: Omit<Record, 'id'> = {
      title: body.title.trim(),
      content: body.content?.trim() || '',
      type: body.type || 'other',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      customerId: body.customerId,
      customerName: customer.name,
      organizationId,
      assignedTo: body.assignedTo || user.uid,
      tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      scheduledDate: body.scheduledDate || undefined,
      completedDate: body.status === 'completed' ? (body.completedDate || new Date().toISOString()) : undefined,
      duration: body.duration || undefined,
      location: body.location?.trim() || undefined,
      outcome: body.outcome?.trim() || undefined,
      nextAction: body.nextAction?.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
    };

    // 如果是完成狀態，確保有完成日期
    if (recordData.status === 'completed' && !recordData.completedDate) {
      recordData.completedDate = new Date().toISOString();
    }

    // 儲存到 Firestore
    const result = await FirestoreService.createDocument('records', recordData);

    if (!result.success) {
      return createErrorResponse(
        result.error || '建立記錄失敗',
        500,
        'CREATE_ERROR'
      );
    }

    return createSuccessResponse(
      result.data,
      '記錄建立成功',
      201
    );

  } catch (error) {
    console.error('Create record error:', error);
    return createErrorResponse(
      '建立記錄失敗',
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