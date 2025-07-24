/**
 * 人事管理狀態管理 Store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { User } from '../types/user';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Unsubscribe } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getUserPermissionContext } from '../services/firebase/permissions-v2';

// 擴展的使用者類型（包含活動和組織資訊）
export interface EnhancedUser extends User {
  // 使用狀態
  isOnline?: boolean;
  lastActiveAt?: Date;
  activityStats?: {
    dailyLogins: number[];
    totalActions: number;
    lastActions: string[];
  };
  
  // 組織結構
  reportingTo?: string;
  subordinates?: string[];
  level?: number;
  
  // 詳細權限
  permissions?: {
    modules: string[];
    actions: string[];
    dataAccess: 'own' | 'team' | 'organization';
    customPermissions?: Record<string, boolean>;
  };
}

// 組織節點類型
export interface OrgNode {
  id: string;
  user: EnhancedUser;
  children: OrgNode[];
  expanded: boolean;
  position: { x: number; y: number };
}

interface PersonnelState {
  // 狀態
  users: EnhancedUser[];
  orgStructure: OrgNode | null;
  selectedUser: EnhancedUser | null;
  activeView: 'tree' | 'table';
  isLoading: boolean;
  error: string | null;
  
  // 篩選和排序
  searchQuery: string;
  filterRole: 'all' | 'admin' | 'manager' | 'salesperson';
  filterStatus: 'all' | 'online' | 'offline';
  sortBy: 'name' | 'role' | 'lastActive' | 'team';
  sortOrder: 'asc' | 'desc';
  
  // 訂閱管理
  unsubscribe: Unsubscribe | null;
  
  // 動作 - 資料操作
  fetchUsers: (currentUser: User) => Promise<void>;
  selectUser: (user: EnhancedUser | null) => void;
  updateUserOrganization: (userId: string, reportingTo: string | null) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: EnhancedUser['permissions']) => Promise<void>;
  
  // 動作 - 檢視和篩選
  setActiveView: (view: 'tree' | 'table') => void;
  setSearchQuery: (query: string) => void;
  setFilterRole: (role: 'all' | 'admin' | 'manager' | 'salesperson') => void;
  setFilterStatus: (status: 'all' | 'online' | 'offline') => void;
  setSortBy: (field: 'name' | 'role' | 'lastActive' | 'team') => void;
  toggleSortOrder: () => void;
  
  // 動作 - 組織結構
  buildOrgStructure: () => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  
  // 訂閱管理
  subscribeToUsers: (currentUser: User) => void;
  unsubscribeFromUsers: () => void;
  
  // 工具函數
  getFilteredUsers: () => EnhancedUser[];
  getSortedUsers: () => EnhancedUser[];
  reset: () => void;
}

const initialState = {
  users: [],
  orgStructure: null,
  selectedUser: null,
  activeView: 'table' as const,
  isLoading: false,
  error: null,
  searchQuery: '',
  filterRole: 'all' as const,
  filterStatus: 'all' as const,
  sortBy: 'name' as const,
  sortOrder: 'asc' as const,
  unsubscribe: null,
};

export const usePersonnelStore = create<PersonnelState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 資料操作
      fetchUsers: async (currentUser: User) => {
        set({ isLoading: true, error: null });
        
        try {
          const permissionContext = await getUserPermissionContext(currentUser);
          const usersRef = collection(db, 'users');
          
          let q;
          if (permissionContext.role === 'admin') {
            // 管理員：查看組織內所有使用者
            q = query(
              usersRef,
              where('organizationId', '==', permissionContext.organizationId),
              orderBy('displayName')
            );
          } else if (permissionContext.role === 'manager' && permissionContext.managedTeamIds.length > 0) {
            // 主管：查看管理團隊的使用者
            q = query(
              usersRef,
              where('teamIds', 'array-contains-any', permissionContext.managedTeamIds),
              orderBy('displayName')
            );
          } else {
            // 一般使用者：只看自己團隊
            q = query(
              usersRef,
              where('teamIds', 'array-contains-any', permissionContext.teamIds),
              orderBy('displayName')
            );
          }
          
          // 執行查詢
          const snapshot = await getDocs(q);
          const users: EnhancedUser[] = [];
          
          snapshot.forEach(doc => {
            const data = doc.data();
            users.push({
              id: doc.id,
              ...data,
              lastActiveAt: data.lastActiveAt?.toDate(),
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
            } as EnhancedUser);
          });
          
          set({ users, isLoading: false });
          
          // 建立組織結構
          get().buildOrgStructure();
        } catch (error) {
          console.error('載入使用者失敗:', error);
          set({ error: '載入使用者失敗', isLoading: false });
        }
      },
      
      selectUser: (user) => set({ selectedUser: user }),
      
      updateUserOrganization: async (userId: string, reportingTo: string | null) => {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            reportingTo,
            updatedAt: new Date(),
          });
          
          // 更新本地狀態
          set(state => ({
            users: state.users.map(user =>
              user.id === userId
                ? { ...user, reportingTo }
                : user
            ),
          }));
          
          // 重建組織結構
          get().buildOrgStructure();
        } catch (error) {
          console.error('更新組織結構失敗:', error);
          set({ error: '更新組織結構失敗' });
        }
      },
      
      updateUserPermissions: async (userId: string, permissions: EnhancedUser['permissions']) => {
        try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, {
            permissions,
            updatedAt: new Date(),
          });
          
          // 更新本地狀態
          set(state => ({
            users: state.users.map(user =>
              user.id === userId
                ? { ...user, permissions }
                : user
            ),
          }));
        } catch (error) {
          console.error('更新權限失敗:', error);
          set({ error: '更新權限失敗' });
        }
      },
      
      // 檢視和篩選
      setActiveView: (view) => set({ activeView: view }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterRole: (role) => set({ filterRole: role }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSortBy: (field) => set({ sortBy: field }),
      toggleSortOrder: () => set(state => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' })),
      
      // 組織結構
      buildOrgStructure: () => {
        const { users } = get();
        if (users.length === 0) return;
        
        // 建立使用者映射
        const userMap = new Map<string, EnhancedUser>();
        users.forEach(user => userMap.set(user.id, user));
        
        // 找出根節點（沒有上級或上級不存在的使用者）
        const rootUsers = users.filter(user => 
          !user.reportingTo || !userMap.has(user.reportingTo)
        );
        
        // 遞迴建立組織樹
        const buildNode = (user: EnhancedUser, level: number = 0): OrgNode => {
          const subordinates = users.filter(u => u.reportingTo === user.id);
          
          return {
            id: user.id,
            user: { ...user, level },
            children: subordinates.map(sub => buildNode(sub, level + 1)),
            expanded: true,
            position: { x: 0, y: level * 150 }, // 預設位置
          };
        };
        
        // 如果有多個根節點，創建虛擬根節點
        let orgStructure: OrgNode;
        if (rootUsers.length === 1) {
          orgStructure = buildNode(rootUsers[0]);
        } else if (rootUsers.length > 1) {
          // 創建虛擬根節點
          const virtualRoot: EnhancedUser = {
            id: 'root',
            email: '',
            displayName: '組織',
            role: 'admin',
            organizationId: users[0].organizationId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          orgStructure = {
            id: 'root',
            user: virtualRoot,
            children: rootUsers.map(user => buildNode(user)),
            expanded: true,
            position: { x: 0, y: 0 },
          };
        } else {
          orgStructure = null;
        }
        
        set({ orgStructure });
      },
      
      expandNode: (nodeId: string) => {
        const updateNodeExpansion = (node: OrgNode): OrgNode => {
          if (node.id === nodeId) {
            return { ...node, expanded: true };
          }
          return {
            ...node,
            children: node.children.map(updateNodeExpansion),
          };
        };
        
        set(state => ({
          orgStructure: state.orgStructure ? updateNodeExpansion(state.orgStructure) : null,
        }));
      },
      
      collapseNode: (nodeId: string) => {
        const updateNodeExpansion = (node: OrgNode): OrgNode => {
          if (node.id === nodeId) {
            return { ...node, expanded: false };
          }
          return {
            ...node,
            children: node.children.map(updateNodeExpansion),
          };
        };
        
        set(state => ({
          orgStructure: state.orgStructure ? updateNodeExpansion(state.orgStructure) : null,
        }));
      },
      
      updateNodePosition: (nodeId: string, position: { x: number; y: number }) => {
        const updatePosition = (node: OrgNode): OrgNode => {
          if (node.id === nodeId) {
            return { ...node, position };
          }
          return {
            ...node,
            children: node.children.map(updatePosition),
          };
        };
        
        set(state => ({
          orgStructure: state.orgStructure ? updatePosition(state.orgStructure) : null,
        }));
      },
      
      // 訂閱管理
      subscribeToUsers: (currentUser: User) => {
        const { unsubscribe: existingUnsubscribe } = get();
        if (existingUnsubscribe) {
          existingUnsubscribe();
        }
        
        get().fetchUsers(currentUser).then(() => {
          const permissionContext = getUserPermissionContext(currentUser);
          permissionContext.then(context => {
            const usersRef = collection(db, 'users');
            
            let q;
            if (context.role === 'admin') {
              q = query(
                usersRef,
                where('organizationId', '==', context.organizationId),
                orderBy('displayName')
              );
            } else if (context.role === 'manager' && context.managedTeamIds.length > 0) {
              q = query(
                usersRef,
                where('teamIds', 'array-contains-any', context.managedTeamIds),
                orderBy('displayName')
              );
            } else {
              q = query(
                usersRef,
                where('teamIds', 'array-contains-any', context.teamIds),
                orderBy('displayName')
              );
            }
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
              const users: EnhancedUser[] = [];
              
              snapshot.forEach(doc => {
                const data = doc.data();
                users.push({
                  id: doc.id,
                  ...data,
                  lastActiveAt: data.lastActiveAt?.toDate(),
                  createdAt: data.createdAt?.toDate(),
                  updatedAt: data.updatedAt?.toDate(),
                } as EnhancedUser);
              });
              
              set({ users });
              get().buildOrgStructure();
            });
            
            set({ unsubscribe });
          });
        });
      },
      
      unsubscribeFromUsers: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },
      
      // 工具函數
      getFilteredUsers: () => {
        const { users, searchQuery, filterRole, filterStatus } = get();
        
        return users.filter(user => {
          // 搜尋篩選
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = 
              user.displayName.toLowerCase().includes(query) ||
              user.email.toLowerCase().includes(query) ||
              (user.teamNames?.some(team => team.toLowerCase().includes(query)));
            
            if (!matchesSearch) return false;
          }
          
          // 角色篩選
          if (filterRole !== 'all' && user.role !== filterRole) {
            return false;
          }
          
          // 狀態篩選
          if (filterStatus !== 'all') {
            const isOnline = user.isOnline || false;
            if (filterStatus === 'online' && !isOnline) return false;
            if (filterStatus === 'offline' && isOnline) return false;
          }
          
          return true;
        });
      },
      
      getSortedUsers: () => {
        const { sortBy, sortOrder } = get();
        const filteredUsers = get().getFilteredUsers();
        
        return [...filteredUsers].sort((a, b) => {
          let compareValue = 0;
          
          switch (sortBy) {
            case 'name':
              compareValue = a.displayName.localeCompare(b.displayName);
              break;
            case 'role':
              compareValue = a.role.localeCompare(b.role);
              break;
            case 'lastActive':
              const aTime = a.lastActiveAt?.getTime() || 0;
              const bTime = b.lastActiveAt?.getTime() || 0;
              compareValue = aTime - bTime;
              break;
            case 'team':
              const aTeam = a.teamNames?.[0] || '';
              const bTeam = b.teamNames?.[0] || '';
              compareValue = aTeam.localeCompare(bTeam);
              break;
          }
          
          return sortOrder === 'asc' ? compareValue : -compareValue;
        });
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'personnel-store',
    }
  )
);

// 匯入缺少的函數
import { getDocs } from 'firebase/firestore';