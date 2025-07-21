/**
 * 快速修復團隊同步問題的工具函數
 * 可以在瀏覽器控制台中直接執行
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '../services/firebase/config';
import { auth } from '../services/firebase/config';

/**
 * 快速修復當前使用者的團隊資料
 * 在瀏覽器控制台執行: quickFixCurrentUserTeams()
 */
export async function quickFixCurrentUserTeams() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('❌ 請先登入');
    return;
  }

  const db = getFirebaseDb();
  const userId = currentUser.uid;

  try {
    console.log('🔄 開始修復當前使用者的團隊資料...');
    
    // 獲取使用者資料
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('❌ 找不到使用者資料');
      return;
    }

    const userData = userDoc.data();
    console.log('👤 使用者資料:', {
      id: userId,
      name: userData.name,
      teamIds: userData.teamIds || [],
      organizationId: userData.organizationId
    });

    // 如果沒有 teamIds，嘗試從組織的預設團隊獲取
    if (!userData.teamIds || userData.teamIds.length === 0) {
      console.log('⚠️ 使用者沒有設置 teamIds，嘗試查找組織的團隊...');
      
      // 這裡可以根據實際情況調整邏輯
      // 例如：查找組織的第一個團隊，或者特定名稱的團隊
      const { getDocs, query, collection, where, limit } = await import('firebase/firestore');
      
      const teamsQuery = query(
        collection(db, 'teams'),
        where('organizationId', '==', userData.organizationId),
        limit(1)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);
      
      if (!teamsSnapshot.empty) {
        const firstTeam = teamsSnapshot.docs[0];
        const teamId = firstTeam.id;
        const teamData = firstTeam.data();
        
        console.log('🏢 找到團隊:', {
          id: teamId,
          name: teamData.name
        });
        
        // 更新使用者的 teamIds
        await updateDoc(doc(db, 'users', userId), {
          teamIds: [teamId]
        });
        
        console.log('✅ 已將使用者加入團隊');
        
        // 更新團隊的 memberIds
        const memberIds = teamData.memberIds || [];
        if (!memberIds.includes(userId)) {
          await updateDoc(doc(db, 'teams', teamId), {
            memberIds: [...memberIds, userId]
          });
          console.log('✅ 已將使用者加入團隊成員列表');
        }
      } else {
        console.error('❌ 找不到任何團隊');
      }
    } else {
      console.log('✅ 使用者已有團隊設置:', userData.teamIds);
      
      // 確保每個團隊都包含此使用者
      for (const teamId of userData.teamIds) {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          const memberIds = teamData.memberIds || [];
          
          if (!memberIds.includes(userId)) {
            console.log(`🔧 修復團隊 ${teamId} 的成員列表...`);
            await updateDoc(doc(db, 'teams', teamId), {
              memberIds: [...memberIds, userId]
            });
            console.log(`✅ 已將使用者加入團隊 ${teamId}`);
          }
        }
      }
    }
    
    console.log('✅ 修復完成！請重新整理頁面。');
  } catch (error) {
    console.error('❌ 修復失敗:', error);
  }
}

/**
 * 檢查當前使用者的權限狀態
 */
export async function checkCurrentUserPermissions() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('❌ 請先登入');
    return;
  }

  const db = getFirebaseDb();
  const userId = currentUser.uid;

  try {
    // 獲取使用者資料
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('❌ 找不到使用者資料');
      return;
    }

    const userData = userDoc.data();
    console.log('👤 使用者資料:', userData);

    // 檢查團隊
    if (userData.teamIds && userData.teamIds.length > 0) {
      console.log('🏢 使用者所屬團隊:');
      for (const teamId of userData.teamIds) {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          console.log(`  - ${teamData.name} (${teamId})`);
          console.log(`    成員數: ${(teamData.memberIds || []).length}`);
          console.log(`    包含當前使用者: ${(teamData.memberIds || []).includes(userId) ? '✅' : '❌'}`);
        }
      }
    } else {
      console.log('⚠️ 使用者未設置任何團隊');
    }

    // 檢查組織
    if (userData.organizationId) {
      const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        console.log('🏢 組織:', orgData.name);
      }
    }

    // 檢查角色
    console.log('👔 角色:', userData.role || '未設置');
    console.log('🔐 是否為管理員:', userData.role === 'admin' ? '✅' : '❌');

  } catch (error) {
    console.error('❌ 檢查失敗:', error);
  }
}

// 將函數掛載到 window 物件，方便在控制台使用
if (typeof window !== 'undefined') {
  (window as any).quickFixCurrentUserTeams = quickFixCurrentUserTeams;
  (window as any).checkCurrentUserPermissions = checkCurrentUserPermissions;
  
  console.log('💡 團隊同步修復工具已載入！');
  console.log('📌 可用命令:');
  console.log('  - quickFixCurrentUserTeams() : 修復當前使用者的團隊資料');
  console.log('  - checkCurrentUserPermissions() : 檢查當前使用者的權限狀態');
}