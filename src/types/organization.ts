// 組織架構相關類型定義

import { EnhancedUser } from './personnel';

// 組織節點
export interface OrgNode {
  id: string;
  user: EnhancedUser;
  children: OrgNode[];
  expanded?: boolean;
  position?: { x: number; y: number };
}

// 組織層級
export interface OrgLevel {
  level: number;
  name: string;
  color?: string;
  permissions?: string[];
}

// 組織結構設定
export interface OrgStructureConfig {
  maxLevels?: number;
  defaultExpanded?: boolean;
  showActivityIndicators?: boolean;
  enableDragDrop?: boolean;
  nodeSpacing?: {
    horizontal: number;
    vertical: number;
  };
}

// 拖放事件
export interface DragDropEvent {
  nodeId: string;
  sourceParentId?: string;
  targetParentId: string;
  targetIndex: number;
}

// 組織變更記錄
export interface OrgChangeRecord {
  id: string;
  type: 'move' | 'add' | 'remove' | 'update';
  nodeId: string;
  previousParentId?: string;
  newParentId?: string;
  changedBy: string;
  timestamp: Date;
  reason?: string;
}

// 組織統計
export interface OrgStatistics {
  totalMembers: number;
  byLevel: Record<number, number>;
  byRole: Record<string, number>;
  activeUsers: number;
  inactiveUsers: number;
  avgSubordinates: number;
  maxDepth: number;
}