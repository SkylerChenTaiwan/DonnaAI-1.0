/**
 * 權限管理服務
 */

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from './config';
import { User, Team } from '@/types/entities';

/**
 * 檢查使用者是否是特定團隊的主管
 */
export const isManagerOfTeam = async (userId: string, teamId: string): Promise<boolean> => {
  try {
    const teamDoc = await getDoc(doc(getFirebaseDb(), 'teams', teamId));
    if (!teamDoc.exists()) {
      return false;
    }
    
    const team = teamDoc.data() as Team;
    return team.managerIds?.includes(userId) || false;
  } catch (error) {
    console.error('檢查團隊主管權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否是特定團隊的成員
 */
export const isTeamMember = async (userId: string, teamId: string): Promise<boolean> => {
  try {
    const teamDoc = await getDoc(doc(getFirebaseDb(), 'teams', teamId));
    if (!teamDoc.exists()) {
      return false;
    }
    
    const team = teamDoc.data() as Team;
    return team.memberIds?.includes(userId) || false;
  } catch (error) {
    console.error('檢查團隊成員權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否是特定使用者的主管（透過團隊階層）
 */
export const isManagerOfUser = async (managerId: string, userId: string): Promise<boolean> => {
  try {
    // 取得被檢查使用者的資料
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    
    // 取得主管的資料
    const managerDoc = await getDoc(doc(getFirebaseDb(), 'users', managerId));
    if (!managerDoc.exists()) {
      return false;
    }
    
    const manager = managerDoc.data() as User;
    
    // 檢查主管管理的團隊是否包含使用者所在的團隊
    if (!manager.managedTeamIds) {
      return false;
    }
    
    return user.teamIds?.some(teamId => 
      manager.managedTeamIds?.includes(teamId)
    ) || false;
  } catch (error) {
    console.error('檢查使用者主管權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否是組織管理員
 */
export const isOrgAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    return user.role === 'admin' || user.role === 'super_admin' || user.role === 'system-admin';
  } catch (error) {
    console.error('檢查組織管理員權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 取得使用者可以查看的所有團隊成員
 */
export const getAccessibleTeamMembers = async (userId: string): Promise<User[]> => {
  try {
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }
    
    const user = userDoc.data() as User;
    let accessibleTeamIds: string[] = [];
    
    // 管理員可以看到組織內所有成員
    if (user.role === 'admin') {
      const teamsQuery = query(
        collection(getFirebaseDb(), 'teams'),
        where('organizationId', '==', user.organizationId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      accessibleTeamIds = teamsSnapshot.docs.map(doc => doc.id);
    } else if (user.role === 'manager' && user.managedTeamIds) {
      // 主管可以看到其管理的團隊成員
      accessibleTeamIds = user.managedTeamIds;
    } else {
      // 業務員只能看到自己團隊的成員
      accessibleTeamIds = user.teamIds || [];
    }
    
    // 取得所有可存取團隊的成員
    const membersQuery = query(
      collection(getFirebaseDb(), 'users'),
      where('teamIds', 'array-contains-any', accessibleTeamIds)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    return membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      lastLoginAt: doc.data().lastLoginAt.toDate() })) as User[];
  } catch (error) {
    console.error('取得可存取團隊成員時發生錯誤:', error);
    return [];
  }
};

/**
 * 檢查是否可以分配資料給特定用戶
 */
export const canAssignDataTo = async (
  assignerId: string, 
  assigneeId: string,
  organizationId: string
): Promise<boolean> => {
  try {
    // 檢查分配者權限
    const isAdmin = await isOrgAdmin(assignerId);
    if (isAdmin) {
      // 管理員可以分配給組織內任何用戶
      const assigneeDoc = await getDoc(doc(getFirebaseDb(), 'users', assigneeId));
      if (!assigneeDoc.exists()) return false;
      
      const assignee = assigneeDoc.data() as User;
      return assignee.organizationId === organizationId;
    }
    
    // 檢查是否為有權限的主管
    const isManager = await isManagerOfUser(assignerId, assigneeId);
    if (!isManager) return false;
    
    // 檢查被分配者是否在同組織
    const assigneeDoc = await getDoc(doc(getFirebaseDb(), 'users', assigneeId));
    if (!assigneeDoc.exists()) return false;
    
    const assignee = assigneeDoc.data() as User;
    return assignee.organizationId === organizationId;
  } catch (error) {
    console.error('檢查資料分配權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查用戶是否可以接收分配的資料
 */
export const canReceiveAssignedData = async (
  userId: string,
  dataType: 'customers' | 'records' | 'tasks' | 'users'
): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) return false;
    
    const user = userDoc.data() as User;
    
    // 檢查用戶狀態
    if (!user.isActive) return false;
    
    // 根據資料類型檢查權限
    switch (dataType) {
      case 'customers':
        // 業務員、主管和管理員可以接收客戶資料
        return ['salesperson', 'manager', 'admin'].includes(user.role);
      
      case 'records':
        // 業務員、主管和管理員可以接收記錄
        return ['salesperson', 'manager', 'admin'].includes(user.role);
      
      case 'tasks':
        // 所有活躍用戶都可以接收任務
        return true;
      
      case 'users':
        // 只有管理員可以處理用戶資料
        return user.role === 'admin';
      
      default:
        return false;
    }
  } catch (error) {
    console.error('檢查接收資料權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查分配歷史記錄的存取權限
 */
export const canAccessAssignmentHistory = async (
  userId: string,
  historyId: string
): Promise<boolean> => {
  try {
    // 管理員可以查看所有分配歷史
    const isAdmin = await isOrgAdmin(userId);
    if (isAdmin) return true;
    
    // 取得分配歷史記錄
    const historyDoc = await getDoc(doc(getFirebaseDb(), 'assignment_history', historyId));
    if (!historyDoc.exists()) return false;
    
    const history = historyDoc.data();
    
    // 被分配者可以查看自己的分配歷史
    if (history.assigneeId === userId) return true;
    
    // 分配者可以查看自己執行的分配
    if (history.assignerId === userId) return true;
    
    // 主管可以查看其團隊成員的分配歷史
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) return false;
    
    const user = userDoc.data() as User;
    if (user.role === 'manager' && user.managedTeamIds) {
      // 檢查被分配者是否在主管管理的團隊中
      const assigneeDoc = await getDoc(doc(getFirebaseDb(), 'users', history.assigneeId));
      if (assigneeDoc.exists()) {
        const assignee = assigneeDoc.data() as User;
        return assignee.teamIds?.some(teamId => 
          user.managedTeamIds?.includes(teamId)
        ) || false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('檢查分配歷史存取權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 取得使用者管理的所有團隊
 */
export const getManagedTeams = async (userId: string): Promise<Team[]> => {
  try {
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }
    
    const user = userDoc.data() as User;
    
    if (!user.managedTeamIds || user.managedTeamIds.length === 0) {
      return [];
    }
    
    const teams: Team[] = [];
    for (const teamId of user.managedTeamIds) {
      const teamDoc = await getDoc(doc(getFirebaseDb(), 'teams', teamId));
      if (teamDoc.exists()) {
        teams.push({ id: teamDoc.id, ...teamDoc.data() } as Team);
      }
    }
    
    return teams;
  } catch (error) {
    console.error('取得管理團隊時發生錯誤:', error);
    return [];
  }
};

/**
 * 檢查使用者是否可以編輯特定客戶資料
 */
export const canEditCustomer = async (userId: string, customerId: string): Promise<boolean> => {
  try {
    const customerDoc = await getDoc(doc(getFirebaseDb(), 'customers', customerId));
    if (!customerDoc.exists()) {
      return false;
    }
    
    const customer = customerDoc.data();
    
    // 組織管理員可以編輯任何客戶
    if (await isOrgAdmin(userId)) {
      return true;
    }
    
    // 檢查是否為客戶負責人
    if (customer.assignedTo === userId) {
      return true;
    }
    
    // 檢查團隊成員身份
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      console.log(`找不到使用者 ${userId}`);
      return false;
    }
    
    const userData = userDoc.data();
    if (!userData.teamIds?.includes(customer.teamId)) {
      console.log(`使用者 ${userId} 不是客戶團隊 ${customer.teamId} 的成員`);
      return false;
    }
    
    console.log(`使用者 ${userId} 是團隊成員但不是客戶負責人，也不是管理員`);
    return false;
  } catch (error) {
    console.error('檢查客戶編輯權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否可以查看特定客戶資料
 */
export const canViewCustomer = async (userId: string, customerId: string): Promise<boolean> => {
  try {
    const customerDoc = await getDoc(doc(getFirebaseDb(), 'customers', customerId));
    if (!customerDoc.exists()) {
      return false;
    }
    
    const customer = customerDoc.data();
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    
    // 負責的業務員可以查看
    if (customer.assignedTo === userId) {
      return true;
    }
    
    // 同團隊成員可以查看
    if (user.teamIds?.includes(customer.teamId)) {
      return true;
    }
    
    // 團隊主管可以查看其團隊客戶
    if (await isManagerOfTeam(userId, customer.teamId)) {
      return true;
    }
    
    // 組織管理員可以查看
    if (await isOrgAdmin(userId)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('檢查客戶查看權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否可以定義自訂欄位
 * 只有管理員和授權的主管可以定義自訂欄位
 */
export const canDefineCustomFields = async (userId: string, organizationId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    
    // 確認使用者屬於該組織
    if (user.organizationId !== organizationId) {
      return false;
    }
    
    // Super Admin 和管理員可以定義自訂欄位
    if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'system-admin') {
      return true;
    }
    
    // 主管需要特殊授權（可以在組織設定中配置）
    if (user.role === 'manager') {
      // TODO: 檢查組織設定中是否允許主管定義自訂欄位
      // 目前預設主管也可以定義
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('檢查自訂欄位定義權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否可以編輯特定的自訂欄位定義
 */
export const canEditCustomFieldDefinition = async (
  userId: string, 
  fieldCreatorId: string,
  fieldPermissions?: { canEdit: string[] }
): Promise<boolean> => {
  try {
    // 建立者可以編輯
    if (userId === fieldCreatorId) {
      return true;
    }
    
    // 在授權編輯清單中的使用者可以編輯
    if (fieldPermissions?.canEdit?.includes(userId)) {
      return true;
    }
    
    // 組織管理員可以編輯所有欄位
    if (await isOrgAdmin(userId)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('檢查自訂欄位編輯權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否可以查看特定紀錄
 */
export const canViewRecord = async (userId: string, recordId: string): Promise<boolean> => {
  try {
    const recordDoc = await getDoc(doc(getFirebaseDb(), 'records', recordId));
    if (!recordDoc.exists()) {
      return false;
    }
    
    const record = recordDoc.data();
    const userDoc = await getDoc(doc(getFirebaseDb(), 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    
    // 建立者可以查看
    if (record.createdBy === userId) {
      return true;
    }
    
    // 參與者可以查看
    if (record.participantIds?.includes(userId)) {
      return true;
    }
    
    // 同團隊成員可以查看
    if (user.teamIds?.includes(record.teamId)) {
      return true;
    }
    
    // 團隊主管可以查看
    if (await isManagerOfTeam(userId, record.teamId)) {
      return true;
    }
    
    // 組織管理員可以查看
    if (await isOrgAdmin(userId)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('檢查紀錄查看權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否可以編輯特定紀錄
 */
export const canEditRecord = async (userId: string, recordId: string): Promise<boolean> => {
  try {
    const recordDoc = await getDoc(doc(getFirebaseDb(), 'records', recordId));
    if (!recordDoc.exists()) {
      return false;
    }
    
    const record = recordDoc.data();
    
    // 建立者可以編輯
    if (record.createdBy === userId) {
      return true;
    }
    
    // 團隊主管可以編輯
    if (await isManagerOfTeam(userId, record.teamId)) {
      return true;
    }
    
    // 組織管理員可以編輯
    if (await isOrgAdmin(userId)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('檢查紀錄編輯權限時發生錯誤:', error);
    return false;
  }
};

/**
 * 檢查使用者是否可以分派任務給另一個使用者
 */
export const canAssignTaskTo = async (assignerId: string, assigneeId: string): Promise<boolean> => {
  try {
    // 使用者可以分派任務給自己
    if (assignerId === assigneeId) {
      return true;
    }
    
    // 主管可以分派任務給其管理的團隊成員
    if (await isManagerOfUser(assignerId, assigneeId)) {
      return true;
    }
    
    // 組織管理員可以分派任務給任何人
    if (await isOrgAdmin(assignerId)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('檢查任務分派權限時發生錯誤:', error);
    return false;
  }
};