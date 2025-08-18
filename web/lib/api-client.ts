/**
 * 統一的 API 呼叫工具 - 整合錯誤處理和載入狀態管理
 */

import { AppError, createError, handleApiError, logError } from './errors';

// API 回應格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

// API 呼叫配置
export interface ApiCallConfig extends RequestInit {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  skipErrorHandling?: boolean;
}

// API 呼叫結果
export interface ApiCallResult<T = any> {
  data?: T;
  error?: AppError;
  success: boolean;
  response?: Response;
}

// 預設配置
const DEFAULT_CONFIG: Required<Pick<ApiCallConfig, 'baseUrl' | 'timeout' | 'retryAttempts' | 'retryDelay'>> = {
  baseUrl: '',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// API 客戶端類別
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private interceptors: {
    request: Array<(config: RequestInit) => RequestInit | Promise<RequestInit>>;
    response: Array<(response: Response) => Response | Promise<Response>>;
  };

  constructor(baseUrl: string = '', defaultHeaders: HeadersInit = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.interceptors = {
      request: [],
      response: [],
    };
  }

  // 添加請求攔截器
  addRequestInterceptor(interceptor: (config: RequestInit) => RequestInit | Promise<RequestInit>) {
    this.interceptors.request.push(interceptor);
  }

  // 添加回應攔截器
  addResponseInterceptor(interceptor: (response: Response) => Response | Promise<Response>) {
    this.interceptors.response.push(interceptor);
  }

  // 執行攔截器
  private async executeRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let result = config;
    for (const interceptor of this.interceptors.request) {
      result = await interceptor(result);
    }
    return result;
  }

  private async executeResponseInterceptors(response: Response): Promise<Response> {
    let result = response;
    for (const interceptor of this.interceptors.response) {
      result = await interceptor(result);
    }
    return result;
  }

  // 建構完整 URL
  private buildUrl(endpoint: string, config: ApiCallConfig): string {
    const baseUrl = config.baseUrl || this.baseUrl;
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    return `${baseUrl}${endpoint}`;
  }

  // 建構請求配置
  private buildRequestConfig(config: ApiCallConfig): RequestInit {
    const headers = {
      ...this.defaultHeaders,
      ...(config.headers as Record<string, string>),
    };

    return {
      ...config,
      headers,
    };
  }

  // 超時處理
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(createError.network(`請求超時（${timeout}ms）`));
      }, timeout);
    });
  }

  // 延遲函數
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 核心請求方法
  async request<T = any>(
    endpoint: string, 
    config: ApiCallConfig = {}
  ): Promise<ApiCallResult<T>> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    let lastError: AppError | undefined;

    // 回調函數
    mergedConfig.onStart?.();

    try {
      for (let attempt = 1; attempt <= mergedConfig.retryAttempts; attempt++) {
        try {
          const url = this.buildUrl(endpoint, mergedConfig);
          let requestConfig = this.buildRequestConfig(mergedConfig);
          
          // 執行請求攔截器
          requestConfig = await this.executeRequestInterceptors(requestConfig);

          // 建立請求和超時 Promise
          const fetchPromise = fetch(url, requestConfig);
          const timeoutPromise = this.createTimeoutPromise(mergedConfig.timeout);

          // 執行請求（帶超時）
          let response = await Promise.race([fetchPromise, timeoutPromise]);

          // 執行回應攔截器
          response = await this.executeResponseInterceptors(response);

          // 解析回應內容
          let responseData: any;
          const contentType = response.headers.get('content-type');
          
          if (contentType?.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          // 檢查 HTTP 狀態
          if (!response.ok) {
            const error = handleApiError(response, responseData);
            lastError = error;
            
            // 如果是客戶端錯誤（4xx），不重試
            if (response.status >= 400 && response.status < 500) {
              throw error;
            }
            
            // 伺服器錯誤可能重試
            if (attempt === mergedConfig.retryAttempts) {
              throw error;
            }
            
            await this.delay(mergedConfig.retryDelay * attempt);
            continue;
          }

          // 成功回應
          const result: ApiCallResult<T> = {
            data: responseData.data || responseData,
            success: true,
            response,
          };

          mergedConfig.onSuccess?.(result.data);
          mergedConfig.onEnd?.();

          return result;

        } catch (error) {
          // 網路錯誤或其他異常
          if (error instanceof AppError) {
            lastError = error;
          } else if (error instanceof TypeError && error.message.includes('fetch')) {
            lastError = createError.network('網路連線失敗，請檢查您的網路狀態');
          } else {
            lastError = createError.internal(
              error instanceof Error ? error.message : '未知錯誤'
            );
          }

          // 最後一次嘗試後拋出錯誤
          if (attempt === mergedConfig.retryAttempts) {
            break;
          }

          // 等待後重試
          await this.delay(mergedConfig.retryDelay * attempt);
        }
      }

      throw lastError;

    } catch (error) {
      const finalError = error instanceof AppError ? error : lastError || createError.internal('請求失敗');
      
      if (!mergedConfig.skipErrorHandling) {
        logError(finalError, { 
          endpoint, 
          method: config.method || 'GET',
          attempts: mergedConfig.retryAttempts 
        });
      }

      mergedConfig.onError?.(finalError);
      mergedConfig.onEnd?.();

      const result: ApiCallResult<T> = {
        error: finalError,
        success: false,
      };

      return result;
    }
  }

  // GET 請求
  async get<T = any>(endpoint: string, config: Omit<ApiCallConfig, 'method' | 'body'> = {}): Promise<ApiCallResult<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  // POST 請求
  async post<T = any>(endpoint: string, data?: any, config: Omit<ApiCallConfig, 'method' | 'body'> = {}): Promise<ApiCallResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT 請求
  async put<T = any>(endpoint: string, data?: any, config: Omit<ApiCallConfig, 'method' | 'body'> = {}): Promise<ApiCallResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH 請求
  async patch<T = any>(endpoint: string, data?: any, config: Omit<ApiCallConfig, 'method' | 'body'> = {}): Promise<ApiCallResult<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 請求
  async delete<T = any>(endpoint: string, config: Omit<ApiCallConfig, 'method' | 'body'> = {}): Promise<ApiCallResult<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// 建立預設實例
export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_BASE_URL || '');

// 添加認證攔截器
apiClient.addRequestInterceptor(async (config) => {
  // 在這裡添加 JWT token 或其他認證資訊
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }
  return config;
});

// 添加回應攔截器處理認證失效
apiClient.addResponseInterceptor(async (response) => {
  if (response.status === 401) {
    // 清除過期的 token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      // 可以在這裡重導向到登入頁面
    }
  }
  return response;
});

// Hook 用於在 React 元件中使用 API
export function useApi() {
  return apiClient;
}

// 快捷方法
export const api = {
  get: <T = any>(endpoint: string, config?: Omit<ApiCallConfig, 'method' | 'body'>) => 
    apiClient.get<T>(endpoint, config),
  
  post: <T = any>(endpoint: string, data?: any, config?: Omit<ApiCallConfig, 'method' | 'body'>) => 
    apiClient.post<T>(endpoint, data, config),
  
  put: <T = any>(endpoint: string, data?: any, config?: Omit<ApiCallConfig, 'method' | 'body'>) => 
    apiClient.put<T>(endpoint, data, config),
  
  patch: <T = any>(endpoint: string, data?: any, config?: Omit<ApiCallConfig, 'method' | 'body'>) => 
    apiClient.patch<T>(endpoint, data, config),
  
  delete: <T = any>(endpoint: string, config?: Omit<ApiCallConfig, 'method' | 'body'>) => 
    apiClient.delete<T>(endpoint, config),
};