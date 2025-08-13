/**
 * 組織結構 Hook - 提供組織架構相關功能
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePersonnelStore, EnhancedUser, OrgNode } from '../stores/personnelStore';
import { useAuth } from './useAuth';

interface UseOrgStructureReturn {
  // 組織結構資料
  orgStructure: OrgNode | null;
  flattenedNodes: OrgNode[];
  totalNodes: number;
  maxDepth: number;
  
  // 節點操作
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  toggleNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // 組織結構操作
  moveUser: (userId: string, newManagerId: string | null) => Promise<void>;
  canMoveUser: (userId: string, targetManagerId: string | null) => boolean;
  
  // 搜尋和篩選
  searchInTree: (query: string) => OrgNode[];
  getNodePath: (nodeId: string) => OrgNode[];
  getNodeById: (nodeId: string) => OrgNode | null;
  
  // 統計資訊
  getTeamSize: (managerId: string) => number;
  getDirectReports: (managerId: string) => EnhancedUser[];
  getAllSubordinates: (managerId: string) => EnhancedUser[];
  
  // 狀態
  isLoading: boolean;
  error: string | null;
}

export const useOrgStructure = (): UseOrgStructureReturn => {
  const { user: currentUser } = useAuth();
  const {
    orgStructure,
    users,
    isLoading,
    error,
    expandNode,
    collapseNode,
    updateUserOrganization,
    subscribeToUsers,
    unsubscribeFromUsers } = usePersonnelStore();
  
  // 訂閱使用者資料
  useEffect(() => {
    if (currentUser) {
      subscribeToUsers(currentUser);
    }
    
    return () => {
      unsubscribeFromUsers();
    };
  }, [currentUser]);
  
  // 扁平化組織結構
  const flattenedNodes = useMemo(() => {
    if (!orgStructure) return [];
    
    const flatten = (node: OrgNode): OrgNode[] => {
      return [node, ...node.children.flatMap(flatten)];
    };
    
    return flatten(orgStructure);
  }, [orgStructure]);
  
  // 計算最大深度
  const maxDepth = useMemo(() => {
    if (!orgStructure) return 0;
    
    const getDepth = (node: OrgNode): number => {
      if (node.children.length === 0) return 1;
      return 1 + Math.max(...node.children.map(getDepth));
    };
    
    return getDepth(orgStructure);
  }, [orgStructure]);
  
  // 切換節點展開/收合
  const toggleNode = useCallback((nodeId: string) => {
    const node = getNodeById(nodeId);
    if (node?.expanded) {
      collapseNode(nodeId);
    } else {
      expandNode(nodeId);
    }
  }, [expandNode, collapseNode]);
  
  // 展開所有節點
  const expandAll = useCallback(() => {
    flattenedNodes.forEach(node => {
      if (!node.expanded && node.children.length > 0) {
        expandNode(node.id);
      }
    });
  }, [flattenedNodes, expandNode]);
  
  // 收合所有節點
  const collapseAll = useCallback(() => {
    flattenedNodes.forEach(node => {
      if (node.expanded && node.id !== orgStructure?.id) {
        collapseNode(node.id);
      }
    });
  }, [flattenedNodes, orgStructure, collapseNode]);
  
  // 移動使用者到新主管
  const moveUser = useCallback(async (userId: string, newManagerId: string | null) => {
    if (!canMoveUser(userId, newManagerId)) {
      throw new Error('無法移動使用者到該位置');
    }
    
    await updateUserOrganization(userId, newManagerId);
  }, [updateUserOrganization]);
  
  // 檢查是否可以移動使用者
  const canMoveUser = useCallback((userId: string, targetManagerId: string | null): boolean => {
    // 不能移動到自己
    if (userId === targetManagerId) return false;
    
    // 不能移動到自己的下屬
    if (targetManagerId) {
      const subordinates = getAllSubordinates(userId);
      if (subordinates.some(sub => sub.id === targetManagerId)) {
        return false;
      }
    }
    
    return true;
  }, []);
  
  // 在樹中搜尋
  const searchInTree = useCallback((query: string): OrgNode[] => {
    if (!query || !orgStructure) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: OrgNode[] = [];
    
    const search = (node: OrgNode) => {
      const user = node.user;
      if (
        user.displayName.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery) ||
        user.teamNames?.some(team => team.toLowerCase().includes(lowerQuery))
      ) {
        results.push(node);
      }
      
      node.children.forEach(search);
    };
    
    search(orgStructure);
    return results;
  }, [orgStructure]);
  
  // 獲取節點路徑
  const getNodePath = useCallback((nodeId: string): OrgNode[] => {
    if (!orgStructure) return [];
    
    const path: OrgNode[] = [];
    
    const findPath = (node: OrgNode, target: string): boolean => {
      if (node.id === target) {
        path.push(node);
        return true;
      }
      
      for (const child of node.children) {
        if (findPath(child, target)) {
          path.unshift(node);
          return true;
        }
      }
      
      return false;
    };
    
    findPath(orgStructure, nodeId);
    return path;
  }, [orgStructure]);
  
  // 根據 ID 獲取節點
  const getNodeById = useCallback((nodeId: string): OrgNode | null => {
    return flattenedNodes.find(node => node.id === nodeId) || null;
  }, [flattenedNodes]);
  
  // 獲取團隊大小
  const getTeamSize = useCallback((managerId: string): number => {
    const subordinates = getAllSubordinates(managerId);
    return subordinates.length;
  }, []);
  
  // 獲取直屬下屬
  const getDirectReports = useCallback((managerId: string): EnhancedUser[] => {
    return users.filter(user => user.reportingTo === managerId);
  }, [users]);
  
  // 獲取所有下屬（遞迴）
  const getAllSubordinates = useCallback((managerId: string): EnhancedUser[] => {
    const subordinates: EnhancedUser[] = [];
    const visited = new Set<string>();
    
    const collectSubordinates = (currentManagerId: string) => {
      if (visited.has(currentManagerId)) return;
      visited.add(currentManagerId);
      
      const directReports = users.filter(user => user.reportingTo === currentManagerId);
      subordinates.push(...directReports);
      
      directReports.forEach(report => {
        collectSubordinates(report.id);
      });
    };
    
    collectSubordinates(managerId);
    return subordinates;
  }, [users]);
  
  return {
    // 組織結構資料
    orgStructure,
    flattenedNodes,
    totalNodes: flattenedNodes.length,
    maxDepth,
    
    // 節點操作
    expandNode,
    collapseNode,
    toggleNode,
    expandAll,
    collapseAll,
    
    // 組織結構操作
    moveUser,
    canMoveUser,
    
    // 搜尋和篩選
    searchInTree,
    getNodePath,
    getNodeById,
    
    // 統計資訊
    getTeamSize,
    getDirectReports,
    getAllSubordinates,
    
    // 狀態
    isLoading,
    error };
};