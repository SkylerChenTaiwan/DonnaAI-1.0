/**
 * 團隊資料驗證與正規化工具
 */

import { Team, isTeam } from '@/types/entities';
import { Timestamp } from 'firebase/firestore';

// 驗證團隊資料是否合法
export function validateTeam(data: any): data is Team {
  return isTeam(data);
}

// 正規化團隊資料，確保所有必要欄位都有預設值
export function normalizeTeam(data: Partial<Team>): Team {
  const now = new Date();
  
  return {
    // 必要欄位
    id: data.id || '',
    name: data.name || '',
    organizationId: data.organizationId || '',
    
    // 選擇性欄位
    ...(data.description && { description: data.description }),
    ...(data.createdAt && { createdAt: data.createdAt }),
    ...(data.updatedAt && { updatedAt: data.updatedAt }),
    ...(data.parentTeamId && { parentTeamId: data.parentTeamId }),
    ...(data.leaderId && { leaderId: data.leaderId }),
    ...(data.managerIds && { managerIds: data.managerIds }),
    ...(data.memberIds && { memberIds: data.memberIds }),
    ...(data.memberCount !== undefined && { memberCount: data.memberCount }) };
}

// 從 Firestore 文檔轉換為 Team 物件
export function teamFromFirestore(doc: any): Team | null {
  if (!doc || !doc.data) {
    return null;
  }
  
  const data = doc.data();
  
  // 轉換 Timestamp 為 Date
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate();
  }
  if (data.updatedAt instanceof Timestamp) {
    data.updatedAt = data.updatedAt.toDate();
  }
  
  // 確保必要欄位存在
  const normalized = normalizeTeam({
    id: doc.id,
    ...data
  });
  
  return validateTeam(normalized) ? normalized : null;
}

// 準備團隊資料以儲存到 Firestore
export function teamToFirestore(team: Team): Record<string, any> {
  const { id, ...data } = team;
  
  // 移除 undefined 值
  const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
  
  return cleanData;
}

// 檢查使用者是否為團隊成員
export function isTeamMember(team: Team, userId: string): boolean {
  return (
    team.leaderId === userId ||
    team.managerIds?.includes(userId) ||
    team.memberIds?.includes(userId) ||
    false
  );
}

// 檢查使用者是否為團隊管理者
export function isTeamManager(team: Team, userId: string): boolean {
  return (
    team.leaderId === userId ||
    team.managerIds?.includes(userId) ||
    false
  );
}

// 獲取團隊總人數
export function getTeamSize(team: Team): number {
  // 如果有 memberCount，優先使用
  if (team.memberCount !== undefined) {
    return team.memberCount;
  }
  
  // 否則計算所有成員
  const members = new Set<string>();
  
  if (team.leaderId) {
    members.add(team.leaderId);
  }
  
  if (team.managerIds) {
    team.managerIds.forEach(id => members.add(id));
  }
  
  if (team.memberIds) {
    team.memberIds.forEach(id => members.add(id));
  }
  
  return members.size;
}

// 獲取所有團隊成員 ID
export function getAllTeamMemberIds(team: Team): string[] {
  const members = new Set<string>();
  
  if (team.leaderId) {
    members.add(team.leaderId);
  }
  
  if (team.managerIds) {
    team.managerIds.forEach(id => members.add(id));
  }
  
  if (team.memberIds) {
    team.memberIds.forEach(id => members.add(id));
  }
  
  return Array.from(members);
}

// 檢查團隊是否為子團隊
export function isSubTeam(team: Team): boolean {
  return !!team.parentTeamId;
}

// 檢查團隊是否為根團隊
export function isRootTeam(team: Team): boolean {
  return !team.parentTeamId;
}