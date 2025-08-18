/**
 * 查詢輔助工具
 * 為 Firestore 查詢添加權限過濾的便利方法
 */

import { DataFilter } from './data-filter';

/**
 * 權限過濾查詢輔助器
 */
export class PermissionAwareQueryHelper {
  constructor(private dataFilter: DataFilter) {}

  /**
   * 創建帶權限過濾的營收查詢
   */
  createRevenueQuery(
    db: FirebaseFirestore.Firestore,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    let query = db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('type', '==', 'sales')
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate);

    return this.dataFilter.applyFirestoreFilters(
      query,
      'records',
      { enforceOrganization: true, enforceDepartment: true, enforceUser: false }
    );
  }

  /**
   * 創建帶權限過濾的客戶查詢
   */
  createCustomerQuery(
    db: FirebaseFirestore.Firestore,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    let query = db
      .collection('customers')
      .where('organizationId', '==', organizationId);

    if (startDate && endDate) {
      query = query
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate);
    }

    return this.dataFilter.applyFirestoreFilters(
      query,
      'customers',
      { enforceOrganization: true, enforceDepartment: true, enforceUser: false }
    );
  }

  /**
   * 創建帶權限過濾的任務查詢
   */
  createTaskQuery(
    db: FirebaseFirestore.Firestore,
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    let query = db
      .collection('tasks')
      .where('organizationId', '==', organizationId);

    if (startDate && endDate) {
      query = query
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate);
    }

    return this.dataFilter.applyFirestoreFilters(
      query,
      'tasks',
      { enforceOrganization: true, enforceDepartment: true, enforceUser: true }
    );
  }

  /**
   * 創建帶權限過濾的會議查詢
   */
  createMeetingQuery(
    db: FirebaseFirestore.Firestore,
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    let query = db
      .collection('records')
      .where('organizationId', '==', organizationId)
      .where('type', 'in', ['meeting', 'call'])
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate);

    return this.dataFilter.applyFirestoreFilters(
      query,
      'records',
      { enforceOrganization: true, enforceDepartment: true, enforceUser: false }
    );
  }

  /**
   * 創建帶權限過濾的使用者查詢
   */
  createUserQuery(
    db: FirebaseFirestore.Firestore,
    organizationId: string
  ) {
    let query = db
      .collection('users')
      .where('organizationId', '==', organizationId);

    return this.dataFilter.applyFirestoreFilters(
      query,
      'users',
      { enforceOrganization: true, enforceDepartment: true, enforceUser: false }
    );
  }

  /**
   * 獲取存取層級資訊
   */
  getAccessInfo() {
    return this.dataFilter.getMetricsAccessLevel();
  }
}