/**
 * GET/POST /api/organizations
 * 組織管理 API 路由（僅 Super Admin 可完全存取）
 */

import { NextRequest } from 'next/server';
import { 
  withAuth,
  withSuperAdmin,
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/middleware';
import { FirestoreService } from '@/lib/firebase-admin';

interface Organization {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  settings: {
    allowUserRegistration: boolean;
    maxUsers: number;
    features: string[];
    timezone: string;
    locale: string;
    dateFormat: string;
    currency: string;
  };
  subscription?: {
    plan: 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'suspended' | 'cancelled';
    startDate: string;
    endDate?: string;
    maxUsers: number;
    features: string[];
  };
  stats?: {
    totalUsers: number;
    activeUsers: number;
    totalCustomers: number;
    totalRecords: number;
    totalTasks: number;
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// 取得組織列表（Super Admin）或單一組織資訊（組織用戶）
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status') as Organization['status'] | null;
    const includeStats = url.searchParams.get('includeStats') === 'true';

    // Super Admin 可以查看所有組織
    if (user.role === 'superAdmin') {
      let organizations: any[] = [];
      
      // 取得所有組織
      const result = await FirestoreService.getCollection('organizations');

      if (!result.success) {
        return createErrorResponse(
          result.error || '獲取組織資料失敗',
          500,
          'FETCH_ERROR'
        );
      }

      organizations = result.data || [];

      // 應用過濾器
      if (status) {
        organizations = organizations.filter((org: any) => org.status === status);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        organizations = organizations.filter((org: any) => 
          org.name?.toLowerCase().includes(searchLower) ||
          org.displayName?.toLowerCase().includes(searchLower) ||
          org.description?.toLowerCase().includes(searchLower) ||
          org.industry?.toLowerCase().includes(searchLower)
        );
      }

      // 如果需要統計資訊，為每個組織計算統計
      if (includeStats) {
        for (const org of organizations) {
          try {
            // 計算用戶數
            const usersResult = await FirestoreService.queryDocuments(
              'users',
              'organizationId',
              '==',
              org.id
            );
            const users = usersResult.success ? (usersResult.data || []) : [];

            // 計算客戶數
            const customersResult = await FirestoreService.queryDocuments(
              'customers',
              'organizationId',
              '==',
              org.id
            );
            const customers = customersResult.success ? (customersResult.data || []) : [];

            // 計算記錄數
            const recordsResult = await FirestoreService.queryDocuments(
              'records',
              'organizationId',
              '==',
              org.id
            );
            const records = recordsResult.success ? (recordsResult.data || []) : [];

            // 計算任務數
            const tasksResult = await FirestoreService.queryDocuments(
              'tasks',
              'organizationId',
              '==',
              org.id
            );
            const tasks = tasksResult.success ? (tasksResult.data || []) : [];

            // 計算活躍用戶（最近30天有活動）
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const activeUsers = users.filter((u: any) => {
              const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt) : null;
              return lastLogin && lastLogin >= thirtyDaysAgo;
            });

            org.stats = {
              totalUsers: users.length,
              activeUsers: activeUsers.length,
              totalCustomers: customers.length,
              totalRecords: records.length,
              totalTasks: tasks.length,
            };
          } catch (error) {
            console.warn(`Failed to calculate stats for organization ${org.id}:`, error);
            org.stats = {
              totalUsers: 0,
              activeUsers: 0,
              totalCustomers: 0,
              totalRecords: 0,
              totalTasks: 0,
            };
          }
        }
      }

      // 按建立日期排序（最新的在前）
      organizations.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      // 分頁
      const totalCount = organizations.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrganizations = organizations.slice(startIndex, endIndex);

      const response = {
        organizations: paginatedOrganizations,
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
          includeStats,
        },
      };

      return createSuccessResponse(
        response,
        `成功獲取 ${paginatedOrganizations.length} 個組織資料`
      );

    } else {
      // 一般用戶只能查看自己的組織
      if (!user.organizationId) {
        return createErrorResponse(
          '用戶未關聯到任何組織',
          400,
          'NO_ORGANIZATION'
        );
      }

      const result = await FirestoreService.getDocument('organizations', user.organizationId);

      if (!result.success || !result.data) {
        return createErrorResponse(
          '找不到組織資料',
          404,
          'ORGANIZATION_NOT_FOUND'
        );
      }

      let organization = result.data as any;

      // 如果需要統計資訊且用戶是組織管理員
      if (includeStats && user.role === 'orgAdmin') {
        try {
          // 計算組織統計資訊（同上面邏輯）
          const [usersResult, customersResult, recordsResult, tasksResult] = await Promise.all([
            FirestoreService.queryDocuments('users', 'organizationId', '==', organization.id),
            FirestoreService.queryDocuments('customers', 'organizationId', '==', organization.id),
            FirestoreService.queryDocuments('records', 'organizationId', '==', organization.id),
            FirestoreService.queryDocuments('tasks', 'organizationId', '==', organization.id),
          ]);

          const users = usersResult.success ? (usersResult.data || []) : [];
          const customers = customersResult.success ? (customersResult.data || []) : [];
          const records = recordsResult.success ? (recordsResult.data || []) : [];
          const tasks = tasksResult.success ? (tasksResult.data || []) : [];

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const activeUsers = users.filter((u: any) => {
            const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt) : null;
            return lastLogin && lastLogin >= thirtyDaysAgo;
          });

          organization.stats = {
            totalUsers: users.length,
            activeUsers: activeUsers.length,
            totalCustomers: customers.length,
            totalRecords: records.length,
            totalTasks: tasks.length,
          };
        } catch (error) {
          console.warn(`Failed to calculate stats for organization ${organization.id}:`, error);
        }
      }

      return createSuccessResponse(
        organization,
        '成功獲取組織資料'
      );
    }

  } catch (error) {
    console.error('Get organizations error:', error);
    return createErrorResponse(
      '獲取組織資料失敗',
      500,
      'INTERNAL_ERROR'
    );
  }
});

// 建立新組織（僅 Super Admin）
export const POST = withSuperAdmin(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    
    // 基本資料驗證
    if (!body.name || typeof body.name !== 'string') {
      return createErrorResponse(
        '組織名稱為必填項目',
        400,
        'VALIDATION_ERROR'
      );
    }

    // 檢查組織名稱是否重複
    const duplicateCheck = await FirestoreService.queryDocuments(
      'organizations',
      'name',
      '==',
      body.name.trim()
    );
    
    if (duplicateCheck.success && duplicateCheck.data && duplicateCheck.data.length > 0) {
      return createErrorResponse(
        '組織名稱已存在',
        409,
        'DUPLICATE_NAME'
      );
    }

    // 建立組織資料
    const organizationData: Omit<Organization, 'id'> = {
      name: body.name.trim(),
      displayName: body.displayName?.trim() || body.name.trim(),
      description: body.description?.trim() || undefined,
      industry: body.industry?.trim() || undefined,
      website: body.website?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
      email: body.email?.trim() || undefined,
      address: body.address || undefined,
      settings: {
        allowUserRegistration: body.settings?.allowUserRegistration ?? false,
        maxUsers: body.settings?.maxUsers || 10,
        features: Array.isArray(body.settings?.features) ? body.settings.features : [],
        timezone: body.settings?.timezone || 'Asia/Taipei',
        locale: body.settings?.locale || 'zh-TW',
        dateFormat: body.settings?.dateFormat || 'YYYY-MM-DD',
        currency: body.settings?.currency || 'TWD',
      },
      subscription: body.subscription || {
        plan: 'basic',
        status: 'active',
        startDate: new Date().toISOString(),
        maxUsers: 10,
        features: ['basic_crm', 'basic_reports'],
      },
      status: body.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
    };

    // 儲存到 Firestore
    const result = await FirestoreService.createDocument('organizations', organizationData);

    if (!result.success) {
      return createErrorResponse(
        result.error || '建立組織失敗',
        500,
        'CREATE_ERROR'
      );
    }

    return createSuccessResponse(
      result.data,
      '組織建立成功',
      201
    );

  } catch (error) {
    console.error('Create organization error:', error);
    return createErrorResponse(
      '建立組織失敗',
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