/**
 * 權限管理服務
 */

import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './config';
import { User, Team } from '@/types/user';

/**
 * 檢查使用者是否是特定團隊的主管
 */
export const isManagerOfTeam = async (userId: string, teamId: string): Promise<boolean> => {
  try {
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists()) {
      return false;
    }
    
    const team = teamDoc.data() as Team;
    return team.managerIds.includes(userId);
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
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists()) {
      return false;
    }
    
    const team = teamDoc.data() as Team;
    return team.memberIds.includes(userId);
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    
    // 取得主管的資料
    const managerDoc = await getDoc(doc(db, 'users', managerId));
    if (!managerDoc.exists()) {
      return false;
    }
    
    const manager = managerDoc.data() as User;
    
    // 檢查主管管理的團隊是否包含使用者所在的團隊
    if (!manager.managedTeamIds) {
      return false;
    }
    
    return user.teamIds.some(teamId => 
      manager.managedTeamIds!.includes(teamId)
    );
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    return user.role === 'admin';
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
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }
    
    const user = userDoc.data() as User;
    let accessibleTeamIds: string[] = [];
    
    // 管理員可以看到組織內所有成員
    if (user.role === 'admin') {
      const teamsQuery = query(
        collection(db, 'teams'),
        where('organizationId', '==', user.organizationId)
      );
      const teamsSnapshot = await getDocs(teamsQuery);
      accessibleTeamIds = teamsSnapshot.docs.map(doc => doc.id);
    } else if (user.role === 'manager' && user.managedTeamIds) {
      // 主管可以看到其管理的團隊成員
      accessibleTeamIds = user.managedTeamIds;
    } else {
      // 業務員只能看到自己團隊的成員
      accessibleTeamIds = user.teamIds;
    }
    
    // 取得所有可存取團隊的成員
    const membersQuery = query(
      collection(db, 'users'),
      where('teamIds', 'array-contains-any', accessibleTeamIds)
    );
    const membersSnapshot = await getDocs(membersQuery);
    
    return membersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      lastLoginAt: doc.data().lastLoginAt.toDate(),
    })) as User[];
  } catch (error) {
    console.error('取得可存取團隊成員時發生錯誤:', error);
    return [];
  }
};

/**
 * 取得使用者管理的所有團隊
 */
export const getManagedTeams = async (userId: string): Promise<Team[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }
    
    const user = userDoc.data() as User;
    
    if (!user.managedTeamIds || user.managedTeamIds.length === 0) {
      return [];
    }
    
    const teams: Team[] = [];
    for (const teamId of user.managedTeamIds) {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
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
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    if (!customerDoc.exists()) {
      return false;
    }
    
    const customer = customerDoc.data();
    
    // 負責的業務員可以編輯
    if (customer.assignedTo === userId) {
      return true;
    }
    
    // 團隊主管可以編輯其團隊客戶
    if (await isManagerOfTeam(userId, customer.teamId)) {
      return true;
    }
    
    // 組織管理員可以編輯
    if (await isOrgAdmin(userId)) {
      return true;
    }
    
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
    const customerDoc = await getDoc(doc(db, 'customers', customerId));
    if (!customerDoc.exists()) {
      return false;
    }
    
    const customer = customerDoc.data();
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return false;
    }
    
    const user = userDoc.data() as User;
    
    // 負責的業務員可以查看
    if (customer.assignedTo === userId) {
      return true;
    }
    
    // 同團隊成員可以查看
    if (user.teamIds.includes(customer.teamId)) {
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