/**
 * Firestore 資料庫服務
 * 提供型別安全的資料庫操作
 */

import { 
  DocumentData, 
  WhereFilterOp, 
  OrderByDirection,
  FieldValue,
  Timestamp,
  Query,
  DocumentReference,
  CollectionReference,
  WriteBatch,
  Transaction
} from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';

// 基礎文檔介面
export interface BaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 查詢條件介面
export interface QueryCondition {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

// 排序條件介面
export interface OrderByCondition {
  field: string;
  direction: OrderByDirection;
}

// 查詢選項介面
export interface QueryOptions {
  where?: QueryCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
  startAfter?: any;
  startAt?: any;
  endBefore?: any;
  endAt?: any;
}

// 分頁結果介面
export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: any;
  total?: number;
}

// 操作結果介面
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class FirestoreService {
  /**
   * 取得集合參考
   */
  static getCollection(collectionPath: string): CollectionReference {
    return adminDb.collection(collectionPath);
  }

  /**
   * 取得文檔參考
   */
  static getDocRef(collectionPath: string, docId: string): DocumentReference {
    return adminDb.collection(collectionPath).doc(docId);
  }

  /**
   * 取得單一文檔
   */
  static async getDocument<T extends BaseDocument>(
    collectionPath: string,
    docId: string
  ): Promise<OperationResult<T | null>> {
    try {
      const docRef = this.getDocRef(collectionPath, docId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return {
          success: true,
          data: null,
        };
      }

      const data = doc.data() as Omit<T, 'id'>;
      return {
        success: true,
        data: {
          ...data,
          id: doc.id,
        } as T,
      };
    } catch (error) {
      console.error(`[FirestoreService] Get document ${collectionPath}/${docId} failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get document',
        code: 'GET_DOC_ERROR',
      };
    }
  }

  /**
   * 取得多個文檔
   */
  static async getDocuments<T extends BaseDocument>(
    collectionPath: string,
    docIds: string[]
  ): Promise<OperationResult<T[]>> {
    try {
      const docs = await Promise.all(
        docIds.map(id => this.getDocRef(collectionPath, id).get())
      );

      const results: T[] = [];
      docs.forEach(doc => {
        if (doc.exists) {
          const data = doc.data() as Omit<T, 'id'>;
          results.push({
            ...data,
            id: doc.id,
          } as T);
        }
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error(`[FirestoreService] Get documents failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get documents',
        code: 'GET_DOCS_ERROR',
      };
    }
  }

  /**
   * 查詢文檔
   */
  static async queryDocuments<T extends BaseDocument>(
    collectionPath: string,
    options: QueryOptions = {}
  ): Promise<OperationResult<T[]>> {
    try {
      let query: Query = this.getCollection(collectionPath);

      // 套用 where 條件
      if (options.where) {
        options.where.forEach(condition => {
          query = query.where(condition.field, condition.operator, condition.value);
        });
      }

      // 套用排序
      if (options.orderBy) {
        options.orderBy.forEach(order => {
          query = query.orderBy(order.field, order.direction);
        });
      }

      // 套用分頁
      if (options.startAfter) {
        query = query.startAfter(options.startAfter);
      }
      if (options.startAt) {
        query = query.startAt(options.startAt);
      }
      if (options.endBefore) {
        query = query.endBefore(options.endBefore);
      }
      if (options.endAt) {
        query = query.endAt(options.endAt);
      }

      // 套用限制
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      const results: T[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as Omit<T, 'id'>;
        results.push({
          ...data,
          id: doc.id,
        } as T);
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error(`[FirestoreService] Query documents failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query documents',
        code: 'QUERY_ERROR',
      };
    }
  }

  /**
   * 分頁查詢
   */
  static async queryWithPagination<T extends BaseDocument>(
    collectionPath: string,
    pageSize: number,
    options: QueryOptions = {},
    lastDoc?: any
  ): Promise<OperationResult<PaginatedResult<T>>> {
    try {
      const queryOptions = { ...options };
      
      // 設定分頁
      queryOptions.limit = pageSize + 1; // 多取一筆來判斷是否有下一頁
      if (lastDoc) {
        queryOptions.startAfter = lastDoc;
      }

      const result = await this.queryDocuments<T>(collectionPath, queryOptions);
      
      if (!result.success || !result.data) {
        return result as OperationResult<PaginatedResult<T>>;
      }

      const hasMore = result.data.length > pageSize;
      const data = hasMore ? result.data.slice(0, pageSize) : result.data;
      const lastDocument = data.length > 0 ? data[data.length - 1] : undefined;

      return {
        success: true,
        data: {
          data,
          hasMore,
          lastDoc: lastDocument,
        },
      };
    } catch (error) {
      console.error(`[FirestoreService] Paginated query failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query with pagination',
        code: 'PAGINATION_ERROR',
      };
    }
  }

  /**
   * 建立文檔
   */
  static async createDocument<T extends Partial<BaseDocument>>(
    collectionPath: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    customId?: string
  ): Promise<OperationResult<T>> {
    try {
      const timestamp = Timestamp.now();
      const docData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      let docRef: DocumentReference;
      
      if (customId) {
        docRef = this.getDocRef(collectionPath, customId);
        await docRef.set(docData);
      } else {
        docRef = await this.getCollection(collectionPath).add(docData);
      }

      return {
        success: true,
        data: {
          ...docData,
          id: docRef.id,
          createdAt: timestamp.toDate(),
          updatedAt: timestamp.toDate(),
        } as T,
      };
    } catch (error) {
      console.error(`[FirestoreService] Create document failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create document',
        code: 'CREATE_ERROR',
      };
    }
  }

  /**
   * 更新文檔
   */
  static async updateDocument<T extends Partial<BaseDocument>>(
    collectionPath: string,
    docId: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<OperationResult<T>> {
    try {
      const docRef = this.getDocRef(collectionPath, docId);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await docRef.update(updateData);

      // 取得更新後的文檔
      const updatedDoc = await docRef.get();
      const docData = updatedDoc.data() as Omit<T, 'id'>;

      return {
        success: true,
        data: {
          ...docData,
          id: docId,
        } as T,
      };
    } catch (error) {
      console.error(`[FirestoreService] Update document failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update document',
        code: 'UPDATE_ERROR',
      };
    }
  }

  /**
   * 更新或建立文檔 (Upsert)
   */
  static async upsertDocument<T extends Partial<BaseDocument>>(
    collectionPath: string,
    docId: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<OperationResult<T>> {
    try {
      const docRef = this.getDocRef(collectionPath, docId);
      const doc = await docRef.get();
      
      if (doc.exists) {
        // 更新現有文檔
        return this.updateDocument<T>(collectionPath, docId, data);
      } else {
        // 建立新文檔
        return this.createDocument<T>(collectionPath, data, docId);
      }
    } catch (error) {
      console.error(`[FirestoreService] Upsert document failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upsert document',
        code: 'UPSERT_ERROR',
      };
    }
  }

  /**
   * 刪除文檔
   */
  static async deleteDocument(
    collectionPath: string,
    docId: string
  ): Promise<OperationResult<void>> {
    try {
      await this.getDocRef(collectionPath, docId).delete();
      return {
        success: true,
      };
    } catch (error) {
      console.error(`[FirestoreService] Delete document failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete document',
        code: 'DELETE_ERROR',
      };
    }
  }

  /**
   * 批次寫入
   */
  static async batchWrite(
    operations: Array<{
      type: 'create' | 'update' | 'delete';
      collection: string;
      id?: string;
      data?: any;
    }>
  ): Promise<OperationResult<void>> {
    try {
      const batch = adminDb.batch();

      operations.forEach(op => {
        const docRef = op.id 
          ? this.getDocRef(op.collection, op.id)
          : this.getCollection(op.collection).doc();

        switch (op.type) {
          case 'create':
            batch.set(docRef, {
              ...op.data,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: Timestamp.now(),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
      return {
        success: true,
      };
    } catch (error) {
      console.error(`[FirestoreService] Batch write failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute batch write',
        code: 'BATCH_ERROR',
      };
    }
  }

  /**
   * 交易操作
   */
  static async runTransaction<T>(
    transactionFn: (transaction: Transaction) => Promise<T>
  ): Promise<OperationResult<T>> {
    try {
      const result = await adminDb.runTransaction(transactionFn);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`[FirestoreService] Transaction failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
        code: 'TRANSACTION_ERROR',
      };
    }
  }

  /**
   * 計算集合中的文檔數量
   */
  static async countDocuments(
    collectionPath: string,
    options: QueryOptions = {}
  ): Promise<OperationResult<number>> {
    try {
      let query: Query = this.getCollection(collectionPath);

      // 套用 where 條件
      if (options.where) {
        options.where.forEach(condition => {
          query = query.where(condition.field, condition.operator, condition.value);
        });
      }

      const snapshot = await query.count().get();
      return {
        success: true,
        data: snapshot.data().count,
      };
    } catch (error) {
      console.error(`[FirestoreService] Count documents failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to count documents',
        code: 'COUNT_ERROR',
      };
    }
  }

  /**
   * 聚合查詢
   */
  static async aggregateQuery(
    collectionPath: string,
    options: {
      sum?: string[];
      average?: string[];
      where?: QueryCondition[];
    }
  ): Promise<OperationResult<Record<string, number>>> {
    try {
      let query: Query = this.getCollection(collectionPath);

      // 套用 where 條件
      if (options.where) {
        options.where.forEach(condition => {
          query = query.where(condition.field, condition.operator, condition.value);
        });
      }

      // 建立聚合查詢
      const aggregations: Record<string, any> = {};
      
      if (options.sum) {
        options.sum.forEach(field => {
          aggregations[`sum_${field}`] = FieldValue.sum(field);
        });
      }

      if (options.average) {
        options.average.forEach(field => {
          aggregations[`avg_${field}`] = FieldValue.average(field);
        });
      }

      const snapshot = await query.aggregate(aggregations).get();
      
      return {
        success: true,
        data: snapshot.data() as Record<string, number>,
      };
    } catch (error) {
      console.error(`[FirestoreService] Aggregate query failed:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute aggregate query',
        code: 'AGGREGATE_ERROR',
      };
    }
  }

  /**
   * 監聽文檔變化 (Realtime)
   */
  static subscribeToDocument(
    collectionPath: string,
    docId: string,
    callback: (data: any) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const unsubscribe = this.getDocRef(collectionPath, docId).onSnapshot(
      snapshot => {
        if (snapshot.exists) {
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          callback(null);
        }
      },
      error => {
        console.error(`[FirestoreService] Document subscription error:`, error);
        errorCallback?.(error);
      }
    );

    return unsubscribe;
  }

  /**
   * 監聽集合變化 (Realtime)
   */
  static subscribeToCollection(
    collectionPath: string,
    options: QueryOptions = {},
    callback: (data: any[]) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    let query: Query = this.getCollection(collectionPath);

    // 套用查詢條件
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach(order => {
        query = query.orderBy(order.field, order.direction);
      });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const unsubscribe = query.onSnapshot(
      snapshot => {
        const results: any[] = [];
        snapshot.forEach(doc => {
          results.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        callback(results);
      },
      error => {
        console.error(`[FirestoreService] Collection subscription error:`, error);
        errorCallback?.(error);
      }
    );

    return unsubscribe;
  }
}