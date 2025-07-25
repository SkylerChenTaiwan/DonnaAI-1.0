/**
 * 團隊實體統一定義
 * 這是 Team 介面的單一真實來源
 */

import { Timestamp } from 'firebase/firestore';

// 基礎團隊介面
export interface BaseTeam {
  id: string;
  name: string;
  organizationId: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// 完整的團隊介面
export interface Team extends BaseTeam {
  // 基本資訊
  description?: string;
  
  // 階層結構
  parentTeamId?: string; // 用於樹狀結構
  
  // 成員資訊
  leaderId?: string; // 團隊負責人
  managerIds?: string[]; // 管理者們
  memberIds?: string[]; // 成員們
  memberCount?: number; // 成員數量（可能用於快速顯示）
}

// 團隊建立資料（用於建立新團隊時）
export interface CreateTeamData {
  name: string;
  organizationId: string;
  description?: string;
  parentTeamId?: string;
  leaderId?: string;
  managerIds?: string[];
  memberIds?: string[];
}

// 團隊更新資料（用於更新團隊時）
export interface UpdateTeamData {
  name?: string;
  description?: string;
  parentTeamId?: string;
  leaderId?: string;
  managerIds?: string[];
  memberIds?: string[];
}

// 團隊成員角色
export type TeamMemberRole = 'leader' | 'manager' | 'member';

// 團隊成員資訊（用於顯示團隊成員詳情）
export interface TeamMember {
  userId: string;
  teamId: string;
  role: TeamMemberRole;
  joinedAt: Date | Timestamp;
}

// 類型防護函式
export function isTeam(obj: any): obj is Team {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.organizationId === 'string'
  );
}