/**
 * 快速修復團隊資料同步問題
 * 可以在瀏覽器控制台直接執行
 */

import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { useAuthStore } from '@/stores/authStore';

/**
 * 快速修復當前使用者的團隊資料
 */
export async function quickFixCurrentUserTeams() {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔧 開始修復使用者團隊資料:', user.email);

  try {
    const db = getFirebaseDb();
    
    // 查詢所有包含此使用者的團隊
    const teamsQuery = query(
      collection(db, 'teams'),
      where('memberIds', 'array-contains', user.id)
    );
    const teamsSnapshot = await getDocs(teamsQuery);
    
    const userTeamIds = teamsSnapshot.docs.map(doc => doc.id);
    console.log('📋 找到使用者所屬的團隊:', userTeamIds);

    // 更新使用者的 teamIds
    await updateDoc(doc(db, 'users', user.id), {
      teamIds: userTeamIds,
      updatedAt: new Date()
    });

    // 更新本地狀態
    useAuthStore.setState({
      user: {
        ...user,
        teamIds: userTeamIds
      }
    });

    console.log('✅ 團隊資料同步完成！請重新整理頁面。');
    
    return userTeamIds;
  } catch (error) {
    console.error('❌ 修復失敗:', error);
    throw error;
  }
}

/**
 * 檢查當前使用者的權限狀態
 */
export async function checkCurrentUserPermissions() {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.error('❌ 使用者未登入');
    return;
  }

  console.log('🔍 檢查使用者權限狀態:');
  console.log('👤 使用者:', user.email);
  console.log('🏢 組織 ID:', user.organizationId);
  console.log('👥 團隊 IDs:', user.teamIds);
  console.log('🔑 角色:', user.role);
  console.log('📊 管理的團隊:', user.managedTeamIds);

  const db = getFirebaseDb();
  
  // 檢查團隊成員資格
  if (user.teamIds && user.teamIds.length > 0) {
    for (const teamId of user.teamIds) {
      try {
        const teamDoc = await getDoc(doc(db, 'teams', teamId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          const isMember = teamData.memberIds?.includes(user.id);
          console.log(`📌 團隊 ${teamId}: ${isMember ? '✅ 是成員' : '❌ 非成員'}`);
        } else {
          console.log(`⚠️ 團隊 ${teamId} 不存在`);
        }
      } catch (error) {
        console.error(`❌ 無法檢查團隊 ${teamId}:`, error);
      }
    }
  } else {
    console.log('⚠️ 使用者沒有分配到任何團隊');
  }
}

// 將函數掛載到 window 以便在控制台使用
if (typeof window !== 'undefined') {
  (window as any).quickFixCurrentUserTeams = quickFixCurrentUserTeams;
  (window as any).checkCurrentUserPermissions = checkCurrentUserPermissions;
  
  console.log('💡 快速修復工具已載入！');
  console.log('可用命令：');
  console.log('- checkCurrentUserPermissions() : 檢查權限狀態');
  console.log('- quickFixCurrentUserTeams() : 修復團隊資料同步');
}