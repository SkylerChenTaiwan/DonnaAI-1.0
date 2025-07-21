/**
 * 團隊資料同步工具
 * 用於確保 User.teamIds 和 Team.memberIds 的資料一致性
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import { getFirebaseDb } from '../services/firebase/config';
import { User } from '../types/user';
import { Team } from '../types/user';

/**
 * 同步單一使用者的團隊資料
 * 確保 User.teamIds 和所有相關 Team.memberIds 保持一致
 */
export async function syncUserTeams(userId: string): Promise<void> {
  const db = getFirebaseDb();
  
  try {
    // 獲取使用者資料
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error(`找不到使用者: ${userId}`);
    }
    
    const user = userDoc.data() as User;
    const userTeamIds = user.teamIds || [];
    
    // 查詢所有包含此使用者的團隊
    const teamsWithUser = await getDocs(
      query(collection(db, 'teams'), where('memberIds', 'array-contains', userId))
    );
    
    const teamIdsWithUser = teamsWithUser.docs.map(doc => doc.id);
    
    // 找出需要新增和移除的團隊
    const teamsToAdd = userTeamIds.filter(teamId => !teamIdsWithUser.includes(teamId));
    const teamsToRemove = teamIdsWithUser.filter(teamId => !userTeamIds.includes(teamId));
    
    const batch = writeBatch(db);
    
    // 將使用者加入到缺失的團隊
    for (const teamId of teamsToAdd) {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const team = teamDoc.data() as Team;
        const updatedMemberIds = [...(team.memberIds || []), userId];
        batch.update(teamRef, { memberIds: updatedMemberIds });
        console.log(`✅ 將使用者 ${userId} 加入團隊 ${teamId}`);
      }
    }
    
    // 從不應該存在的團隊中移除使用者
    for (const teamId of teamsToRemove) {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (teamDoc.exists()) {
        const team = teamDoc.data() as Team;
        const updatedMemberIds = (team.memberIds || []).filter(id => id !== userId);
        batch.update(teamRef, { memberIds: updatedMemberIds });
        console.log(`❌ 從團隊 ${teamId} 移除使用者 ${userId}`);
      }
    }
    
    await batch.commit();
    console.log(`✅ 使用者 ${userId} 的團隊資料同步完成`);
  } catch (error) {
    console.error(`同步使用者 ${userId} 的團隊資料失敗:`, error);
    throw error;
  }
}

/**
 * 同步單一團隊的成員資料
 * 確保 Team.memberIds 中的所有成員都在其 User.teamIds 中包含此團隊
 */
export async function syncTeamMembers(teamId: string): Promise<void> {
  const db = getFirebaseDb();
  
  try {
    // 獲取團隊資料
    const teamDoc = await getDoc(doc(db, 'teams', teamId));
    if (!teamDoc.exists()) {
      throw new Error(`找不到團隊: ${teamId}`);
    }
    
    const team = teamDoc.data() as Team;
    const memberIds = team.memberIds || [];
    
    const batch = writeBatch(db);
    
    // 更新每個成員的 teamIds
    for (const memberId of memberIds) {
      const userRef = doc(db, 'users', memberId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const user = userDoc.data() as User;
        const userTeamIds = user.teamIds || [];
        
        if (!userTeamIds.includes(teamId)) {
          const updatedTeamIds = [...userTeamIds, teamId];
          batch.update(userRef, { teamIds: updatedTeamIds });
          console.log(`✅ 將團隊 ${teamId} 加入使用者 ${memberId} 的 teamIds`);
        }
      }
    }
    
    await batch.commit();
    console.log(`✅ 團隊 ${teamId} 的成員資料同步完成`);
  } catch (error) {
    console.error(`同步團隊 ${teamId} 的成員資料失敗:`, error);
    throw error;
  }
}

/**
 * 全面同步組織內的所有團隊和使用者資料
 */
export async function syncOrganizationTeamData(organizationId: string): Promise<void> {
  const db = getFirebaseDb();
  
  try {
    console.log(`🔄 開始同步組織 ${organizationId} 的團隊資料...`);
    
    // 獲取組織內的所有使用者
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('organizationId', '==', organizationId))
    );
    
    // 獲取組織內的所有團隊
    const teamsSnapshot = await getDocs(
      query(collection(db, 'teams'), where('organizationId', '==', organizationId))
    );
    
    console.log(`📊 找到 ${usersSnapshot.size} 個使用者，${teamsSnapshot.size} 個團隊`);
    
    // 同步每個使用者的團隊資料
    for (const userDoc of usersSnapshot.docs) {
      await syncUserTeams(userDoc.id);
    }
    
    // 同步每個團隊的成員資料
    for (const teamDoc of teamsSnapshot.docs) {
      await syncTeamMembers(teamDoc.id);
    }
    
    console.log(`✅ 組織 ${organizationId} 的團隊資料同步完成`);
  } catch (error) {
    console.error(`同步組織 ${organizationId} 的團隊資料失敗:`, error);
    throw error;
  }
}

/**
 * 檢查並報告資料不一致的情況
 */
export async function checkTeamDataConsistency(organizationId: string): Promise<{
  inconsistencies: Array<{
    type: 'user_missing_team' | 'team_missing_user';
    userId: string;
    teamId: string;
    userName?: string;
    teamName?: string;
  }>;
}> {
  const db = getFirebaseDb();
  const inconsistencies: Array<{
    type: 'user_missing_team' | 'team_missing_user';
    userId: string;
    teamId: string;
    userName?: string;
    teamName?: string;
  }> = [];
  
  try {
    // 獲取組織內的所有使用者和團隊
    const [usersSnapshot, teamsSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('organizationId', '==', organizationId))),
      getDocs(query(collection(db, 'teams'), where('organizationId', '==', organizationId)))
    ]);
    
    // 建立查詢映射
    const usersMap = new Map<string, User>();
    const teamsMap = new Map<string, Team>();
    
    usersSnapshot.forEach(doc => {
      usersMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
    });
    
    teamsSnapshot.forEach(doc => {
      teamsMap.set(doc.id, { id: doc.id, ...doc.data() } as Team);
    });
    
    // 檢查每個使用者的 teamIds
    for (const [userId, user] of usersMap) {
      const userTeamIds = user.teamIds || [];
      
      for (const teamId of userTeamIds) {
        const team = teamsMap.get(teamId);
        if (team && !(team.memberIds || []).includes(userId)) {
          inconsistencies.push({
            type: 'team_missing_user',
            userId,
            teamId,
            userName: user.name,
            teamName: team.name
          });
        }
      }
    }
    
    // 檢查每個團隊的 memberIds
    for (const [teamId, team] of teamsMap) {
      const memberIds = team.memberIds || [];
      
      for (const memberId of memberIds) {
        const user = usersMap.get(memberId);
        if (user && !(user.teamIds || []).includes(teamId)) {
          inconsistencies.push({
            type: 'user_missing_team',
            userId: memberId,
            teamId,
            userName: user.name,
            teamName: team.name
          });
        }
      }
    }
    
    return { inconsistencies };
  } catch (error) {
    console.error('檢查團隊資料一致性失敗:', error);
    throw error;
  }
}

/**
 * 加入使用者到團隊（雙向同步）
 */
export async function addUserToTeam(userId: string, teamId: string): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  try {
    // 更新使用者的 teamIds
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error(`找不到使用者: ${userId}`);
    }
    
    const user = userDoc.data() as User;
    const userTeamIds = user.teamIds || [];
    
    if (!userTeamIds.includes(teamId)) {
      batch.update(userRef, { teamIds: [...userTeamIds, teamId] });
    }
    
    // 更新團隊的 memberIds
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (!teamDoc.exists()) {
      throw new Error(`找不到團隊: ${teamId}`);
    }
    
    const team = teamDoc.data() as Team;
    const memberIds = team.memberIds || [];
    
    if (!memberIds.includes(userId)) {
      batch.update(teamRef, { memberIds: [...memberIds, userId] });
    }
    
    await batch.commit();
    console.log(`✅ 成功將使用者 ${userId} 加入團隊 ${teamId}`);
  } catch (error) {
    console.error('加入使用者到團隊失敗:', error);
    throw error;
  }
}

/**
 * 從團隊移除使用者（雙向同步）
 */
export async function removeUserFromTeam(userId: string, teamId: string): Promise<void> {
  const db = getFirebaseDb();
  const batch = writeBatch(db);
  
  try {
    // 更新使用者的 teamIds
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const user = userDoc.data() as User;
      const updatedTeamIds = (user.teamIds || []).filter(id => id !== teamId);
      batch.update(userRef, { teamIds: updatedTeamIds });
    }
    
    // 更新團隊的 memberIds
    const teamRef = doc(db, 'teams', teamId);
    const teamDoc = await getDoc(teamRef);
    
    if (teamDoc.exists()) {
      const team = teamDoc.data() as Team;
      const updatedMemberIds = (team.memberIds || []).filter(id => id !== userId);
      batch.update(teamRef, { memberIds: updatedMemberIds });
    }
    
    await batch.commit();
    console.log(`✅ 成功從團隊 ${teamId} 移除使用者 ${userId}`);
  } catch (error) {
    console.error('從團隊移除使用者失敗:', error);
    throw error;
  }
}