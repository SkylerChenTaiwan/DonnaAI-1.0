/**
 * Firebase 查詢型別安全定義
 * 提供型別安全的 Firestore 查詢建構系統
 */

import {
  Query,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  DocumentData,
  FieldPath,
  Timestamp
} from 'firebase/firestore';

// 支援的資料型別
export type FirestoreValue =
  | string
  | number
  | boolean
  | Date
  | Timestamp
  | null
  | undefined
  | FirestoreValue[]
  | { [key: string]: FirestoreValue };

// 欄位路徑輔助型別
export type PathImpl<T, K extends keyof T> =
  K extends string
    ? T[K] extends Record<string, any>
      ? T[K] extends ArrayLike<any>
        ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
        : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
      : K
    : never;

export type Path<T> = PathImpl<T, keyof T> | keyof T;

export type PathValue<T, P extends Path<T>> =
  P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? Rest extends Path<T[K]>
        ? PathValue<T[K], Rest>
        : never
      : never
    : P extends keyof T
      ? T[P]
      : never;

// 查詢過濾器型別
export interface TypedWhereFilter<T> {
  field: Path<T>;
  op: WhereFilterOp;
  value: FirestoreValue;
}

// 排序選項型別
export interface TypedOrderBy<T> {
  field: Path<T>;
  direction?: OrderByDirection;
}

// 型別安全的查詢建構器介面
export interface TypedQueryBuilder<T extends DocumentData> {
  where<P extends Path<T>>(
    field: P,
    op: WhereFilterOp,
    value: PathValue<T, P>
  ): TypedQueryBuilder<T>;
  
  orderBy<P extends Path<T>>(
    field: P,
    direction?: OrderByDirection
  ): TypedQueryBuilder<T>;
  
  limit(n: number): TypedQueryBuilder<T>;
  
  startAt(...fieldValues: FirestoreValue[]): TypedQueryBuilder<T>;
  
  startAfter(...fieldValues: FirestoreValue[]): TypedQueryBuilder<T>;
  
  endAt(...fieldValues: FirestoreValue[]): TypedQueryBuilder<T>;
  
  endBefore(...fieldValues: FirestoreValue[]): TypedQueryBuilder<T>;
  
  build(): Query<T>;
  
  getConstraints(): QueryConstraint[];
}

// 查詢選項介面
export interface QueryOptions<T extends DocumentData> {
  filters?: TypedWhereFilter<T>[];
  orderBy?: TypedOrderBy<T>[];
  limit?: number;
  startAt?: FirestoreValue[];
  startAfter?: FirestoreValue[];
  endAt?: FirestoreValue[];
  endBefore?: FirestoreValue[];
}

// 複合查詢條件
export type CompositeOperator = 'and' | 'or';

export interface CompositeFilter<T extends DocumentData> {
  operator: CompositeOperator;
  filters: (TypedWhereFilter<T> | CompositeFilter<T>)[];
}

// 聚合查詢型別
export type AggregateFunction = 'count' | 'sum' | 'average' | 'min' | 'max';

export interface AggregateQuery<T extends DocumentData> {
  function: AggregateFunction;
  field?: Path<T>;
  alias?: string;
}

// 查詢結果型別
export interface QueryResult<T extends DocumentData> {
  data: T[];
  metadata: {
    totalCount?: number;
    hasMore?: boolean;
    lastDoc?: DocumentData;
  };
}

// 分頁選項
export interface PaginationOptions {
  pageSize: number;
  pageToken?: string;
  cursor?: DocumentData;
}

// 快取選項
export interface CacheOptions {
  source?: 'default' | 'server' | 'cache';
  maxAge?: number; // 毫秒
  staleWhileRevalidate?: boolean;
}

// 完整的查詢配置
export interface FullQueryConfig<T extends DocumentData> extends QueryOptions<T> {
  pagination?: PaginationOptions;
  cache?: CacheOptions;
  includeMetadata?: boolean;
  realtime?: boolean;
}

// 查詢驗證錯誤
export interface QueryValidationError {
  field: string;
  error: string;
  suggestion?: string;
}

// 查詢驗證結果
export interface QueryValidationResult {
  valid: boolean;
  errors: QueryValidationError[];
}

// 欄位型別映射（用於驗證）
export type FieldTypeMap<T> = {
  [K in keyof T]: T[K] extends string ? 'string' :
                  T[K] extends number ? 'number' :
                  T[K] extends boolean ? 'boolean' :
                  T[K] extends Date ? 'date' :
                  T[K] extends Timestamp ? 'timestamp' :
                  T[K] extends Array<any> ? 'array' :
                  T[K] extends object ? 'object' :
                  'unknown';
};

// 查詢效能指標
export interface QueryPerformanceMetrics {
  executionTime: number;
  documentsScanned: number;
  documentsReturned: number;
  indexHit: boolean;
  cacheHit: boolean;
}

// 查詢執行上下文
export interface QueryExecutionContext {
  userId: string;
  organizationId: string;
  permissions: string[];
  timestamp: Date;
}

// 安全查詢包裝器
export interface SecureQuery<T extends DocumentData> {
  query: Query<T>;
  context: QueryExecutionContext;
  validate(): QueryValidationResult;
  execute(): Promise<QueryResult<T>>;
  explain(): Promise<QueryPerformanceMetrics>;
}

// 型別守衛函數
export function isTypedWhereFilter<T extends DocumentData>(
  filter: any
): filter is TypedWhereFilter<T> {
  return (
    filter &&
    typeof filter === 'object' &&
    'field' in filter &&
    'op' in filter &&
    'value' in filter
  );
}

export function isCompositeFilter<T extends DocumentData>(
  filter: any
): filter is CompositeFilter<T> {
  return (
    filter &&
    typeof filter === 'object' &&
    'operator' in filter &&
    'filters' in filter &&
    Array.isArray(filter.filters)
  );
}

// 查詢操作符驗證
export const VALID_WHERE_OPS: WhereFilterOp[] = [
  '==',
  '!=',
  '<',
  '<=',
  '>',
  '>=',
  'array-contains',
  'array-contains-any',
  'in',
  'not-in'
];

export function isValidWhereOp(op: string): op is WhereFilterOp {
  return VALID_WHERE_OPS.includes(op as WhereFilterOp);
}

// 查詢建構輔助函數
export function createTypedFilter<T extends DocumentData, P extends Path<T>>(
  field: P,
  op: WhereFilterOp,
  value: PathValue<T, P>
): TypedWhereFilter<T> {
  return {
    field,
    op,
    value: value as FirestoreValue
  };
}

export function createOrderBy<T extends DocumentData, P extends Path<T>>(
  field: P,
  direction: OrderByDirection = 'asc'
): TypedOrderBy<T> {
  return {
    field,
    direction
  };
}

// 查詢最佳化建議
export interface QueryOptimizationHint {
  type: 'index' | 'filter' | 'limit' | 'projection';
  description: string;
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}