/**
 * React Query Provider
 * 提供全域資料快取和查詢管理
 */

'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Query Client 配置
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // 預設快取時間 5 分鐘
      staleTime: 5 * 60 * 1000,
      // 預設垃圾回收時間 10 分鐘
      gcTime: 10 * 60 * 1000,
      // 網路錯誤時重試 1 次
      retry: (failureCount: number, error: any) => {
        // 認證錯誤不重試
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // 其他錯誤重試 1 次
        return failureCount < 1;
      },
      // 重新取得視窗焦點時重新查詢
      refetchOnWindowFocus: false,
      // 重新連線時重新查詢
      refetchOnReconnect: true,
    },
    mutations: {
      // 突變錯誤時重試 0 次
      retry: 0,
    },
  },
};

// 建立 Query Client 實例
function makeQueryClient() {
  return new QueryClient(queryClientConfig);
}

let browserQueryClient: QueryClient | undefined = undefined;

// 獲取 Query Client
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: 每次都建立新的 client
    return makeQueryClient();
  } else {
    // Browser: 重用現有的 client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Provider 組件屬性
interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 開發環境顯示 React Query DevTools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// 查詢鍵工廠函數
export const queryKeys = {
  // 用戶相關
  user: (uid?: string) => ['user', uid].filter(Boolean),
  users: (filters?: Record<string, any>) => ['users', filters].filter(Boolean),
  
  // 組織相關
  organization: (orgId?: string) => ['organization', orgId].filter(Boolean),
  organizations: (filters?: Record<string, any>) => ['organizations', filters].filter(Boolean),
  
  // 客戶相關
  customer: (customerId?: string) => ['customer', customerId].filter(Boolean),
  customers: (orgId?: string, filters?: Record<string, any>) => 
    ['customers', orgId, filters].filter(Boolean),
  
  // 記錄相關
  record: (recordId?: string) => ['record', recordId].filter(Boolean),
  records: (orgId?: string, filters?: Record<string, any>) => 
    ['records', orgId, filters].filter(Boolean),
  
  // 任務相關
  task: (taskId?: string) => ['task', taskId].filter(Boolean),
  tasks: (orgId?: string, filters?: Record<string, any>) => 
    ['tasks', orgId, filters].filter(Boolean),

  // 分析相關
  analytics: (type?: string, filters?: Record<string, any>) =>
    ['analytics', type, filters].filter(Boolean),
  
  // 儀表板相關
  dashboard: (orgId?: string, timeRange?: string) =>
    ['dashboard', orgId, timeRange].filter(Boolean),
} as const;

// 突變鍵工廠函數
export const mutationKeys = {
  // 用戶操作
  createUser: 'createUser',
  updateUser: 'updateUser',
  deleteUser: 'deleteUser',
  
  // 客戶操作
  createCustomer: 'createCustomer',
  updateCustomer: 'updateCustomer',
  deleteCustomer: 'deleteCustomer',
  
  // 記錄操作
  createRecord: 'createRecord',
  updateRecord: 'updateRecord',
  deleteRecord: 'deleteRecord',
  
  // 任務操作
  createTask: 'createTask',
  updateTask: 'updateTask',
  deleteTask: 'deleteTask',
  
  // AI 分析
  analyzeData: 'analyzeData',
  generateReport: 'generateReport',
} as const;