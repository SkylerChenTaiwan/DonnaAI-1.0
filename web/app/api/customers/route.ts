/**
 * GET/POST /api/customers
 * 客戶管理 API 路由
 */

import { NextRequest } from 'next/server';
import { 
  withAuth, 
  withSuperAdmin,
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/middleware';
import { FirestoreService } from '@/lib/firebase-admin';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source?: string;
  status: 'active' | 'inactive' | 'prospect' | 'lead';
  tags?: string[];
  notes?: string;
  organizationId: string;
  assignedTo?: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 取得客戶列表
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status') as Customer['status'] | null;
    const organizationId = url.searchParams.get('organizationId');

    // 權限檢查 - 用戶只能看到自己組織的客戶
    const targetOrgId = organizationId || user.organizationId;
    
    if (!targetOrgId) {
      return createErrorResponse(
        '缺少組織 ID',
        400,
        'MISSING_ORGANIZATION_ID'
      );
    }

    // Super Admin 可以查看所有組織，其他用戶只能查看自己的組織
    if (user.role !== 'superAdmin' && targetOrgId !== user.organizationId) {
      return createErrorResponse(
        '無權限存取此組織資料',
        403,
        'FORBIDDEN'
      );
    }

    let customers: any[] = [];
    
    // 基礎查詢
    let result = await FirestoreService.queryDocuments(
      'customers',
      'organizationId',
      '==',
      targetOrgId
    );

    if (!result.success) {
      return createErrorResponse(
        result.error || '獲取客戶資料失敗',
        500,
        'FETCH_ERROR'
      );
    }

    customers = result.data || [];

    // 應用過濾器
    if (status) {
      customers = customers.filter((customer: any) => customer.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter((customer: any) => 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(search)
      );
    }

    // 分頁
    const totalCount = customers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    const response = {
      customers: paginatedCustomers,
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
        status,
        organizationId: targetOrgId,
      },
    };

    return createSuccessResponse(
      response,
      `成功獲取 ${paginatedCustomers.length} 筆客戶資料`
    );

  } catch (error) {
    console.error('Get customers error:', error);
    return createErrorResponse(
      '獲取客戶資料失敗',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// 建立新客戶
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    
    // 基本資料驗證
    if (!body.name || typeof body.name !== 'string') {
      return createErrorResponse(
        '客戶姓名為必填項目',
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
        '無權限在此組織建立客戶',
        403,
        'FORBIDDEN'
      );
    }

    // 檢查重複的電子郵件
    if (body.email) {
      const duplicateCheck = await FirestoreService.queryDocuments(
        'customers',
        'email',
        '==',
        body.email
      );
      
      if (duplicateCheck.success && duplicateCheck.data && duplicateCheck.data.length > 0) {
        const existingCustomer = duplicateCheck.data.find((c: any) => 
          c.organizationId === organizationId
        );
        
        if (existingCustomer) {
          return createErrorResponse(
            '此電子郵件已存在於系統中',
            409,
            'DUPLICATE_EMAIL'
          );
        }
      }
    }

    // 建立客戶資料
    const customerData: Omit<Customer, 'id'> = {
      name: body.name.trim(),
      email: body.email?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      company: body.company?.trim() || undefined,
      position: body.position?.trim() || undefined,
      source: body.source?.trim() || undefined,
      status: body.status || 'prospect',
      tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
      notes: body.notes?.trim() || undefined,
      organizationId,
      assignedTo: body.assignedTo || user.uid,
      lastContactDate: body.lastContactDate || undefined,
      nextFollowUpDate: body.nextFollowUpDate || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
    };

    // 儲存到 Firestore
    const result = await FirestoreService.createDocument('customers', customerData);

    if (!result.success) {
      return createErrorResponse(
        result.error || '建立客戶失敗',
        500,
        'CREATE_ERROR'
      );
    }

    return createSuccessResponse(
      result.data,
      '客戶建立成功',
      201
    );

  } catch (error) {
    console.error('Create customer error:', error);
    return createErrorResponse(
      '建立客戶失敗',
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