/**
 * 使用者管理工具
 * 處理管理員使用者的查詢和建立
 */

import * as admin from 'firebase-admin';
import { generateId, getTimestamp } from './firebase';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  organizationId: string;
  teamIds: string[];
  createdAt: admin.firestore.FieldValue;
  updatedAt: admin.firestore.FieldValue;
}

/**
 * 取得或建立管理員使用者
 * @param email 使用者電子郵件
 * @param db Firestore 資料庫實例
 * @returns 管理員使用者資料
 */
export async function getOrCreateAdminUser(
  email: string, 
  db: admin.firestore.Firestore
): Promise<AdminUser> {
  console.log(`🔍 查詢使用者: ${email}`);
  
  // 查詢現有使用者
  const usersRef = db.collection('users');
  const query = await usersRef.where('email', '==', email).limit(1).get();
  
  if (!query.empty) {
    const userData = query.docs[0].data();
    console.log(`✅ 找到現有使用者: ${userData.name} (${userData.id})`);
    return userData as AdminUser;
  }
  
  console.log('📝 建立新的管理員使用者...');
  
  // 取得或建立預設組織
  const organization = await getOrCreateDefaultOrganization(db);
  
  // 取得或建立預設團隊
  const team = await getOrCreateDefaultTeam(db, organization.id);
  
  // 建立新使用者
  const userId = generateId('user');
  const userData: AdminUser = {
    id: userId,
    email,
    name: '系統管理員',
    role: 'admin',
    organizationId: organization.id,
    teamIds: [team.id],
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };
  
  // 儲存到 Firestore
  await usersRef.doc(userId).set(userData);
  
  console.log(`✅ 建立新使用者成功: ${userData.name} (${userId})`);
  console.log(`   組織: ${organization.name} (${organization.id})`);
  console.log(`   團隊: ${team.name} (${team.id})`);
  
  return userData;
}

/**
 * 取得或建立預設組織
 */
async function getOrCreateDefaultOrganization(db: admin.firestore.Firestore) {
  const orgsRef = db.collection('organizations');
  const orgId = 'default_org';
  
  const orgDoc = await orgsRef.doc(orgId).get();
  
  if (orgDoc.exists) {
    return orgDoc.data() as any;
  }
  
  const orgData = {
    id: orgId,
    name: '預設組織',
    subscriptionPlan: 'enterprise',
    aiMinutesQuota: 10000,
    aiMinutesUsed: 0,
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };
  
  await orgsRef.doc(orgId).set(orgData);
  console.log('✅ 建立預設組織');
  
  return orgData;
}

/**
 * 取得或建立預設團隊
 */
async function getOrCreateDefaultTeam(
  db: admin.firestore.Firestore, 
  organizationId: string
) {
  const teamsRef = db.collection('teams');
  const teamId = 'default_team';
  
  const teamDoc = await teamsRef.doc(teamId).get();
  
  if (teamDoc.exists) {
    return teamDoc.data() as any;
  }
  
  const teamData = {
    id: teamId,
    name: '預設團隊',
    organizationId,
    managerIds: [],
    memberIds: [],
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  };
  
  await teamsRef.doc(teamId).set(teamData);
  console.log('✅ 建立預設團隊');
  
  return teamData;
}