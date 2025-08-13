/**
 * 用戶選擇器元件
 * 用於選擇要分配資料的用戶
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform
 } from 'react-native';
import { AdaptiveInput } from '@/components/adaptive';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { DesignSystem } from '@/theme/designSystem';
import { User, UserRole } from '@/types/user';
import { AssignableUserFilter } from '@/types/assignment';
import { getFirebaseDb } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { withAlpha } from '@/utils/colorUtils';

interface UserSelectorProps {
  organizationId: string;
  currentUserId: string;
  multiple?: boolean;
  selectedUsers: User[];
  onSelection: (users: User[]) => void;
  filterByRole?: UserRole[];
  filterByDepartment?: string[];
  excludeUserIds?: string[];
}

const UserSelector: React.FC<UserSelectorProps> = ({
  organizationId,
  currentUserId,
  multiple = false,
  selectedUsers,
  onSelection,
  filterByRole,
  filterByDepartment,
  excludeUserIds = []
}) => {
  const colors = DesignSystem.colors;
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [departments, setDepartments] = useState<string[]>([]);

  // 載入組織用戶
  useEffect(() => {
    loadUsers();
  }, [organizationId]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const db = getFirebaseDb();
      const usersQuery = query(
        collection(db, 'users'),
        where('organizationId', '==', organizationId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(usersQuery);
      const loadedUsers: User[] = [];
      const departmentSet = new Set<string>();
      
      snapshot.forEach(doc => {
        const user = { id: doc.id, ...doc.data() } as User;
        
        // 過濾角色
        if (filterByRole && filterByRole.length > 0) {
          if (!filterByRole.includes(user.role)) {
            return;
          }
        }
        
        // 過濾部門
        if (filterByDepartment && filterByDepartment.length > 0) {
          if (!user.department || !filterByDepartment.includes(user.department)) {
            return;
          }
        }
        
        // 排除特定用戶
        if (excludeUserIds.includes(user.id)) {
          return;
        }
        
        loadedUsers.push(user);
        
        if (user.department) {
          departmentSet.add(user.department);
        }
      });
      
      setUsers(loadedUsers);
      setDepartments(Array.from(departmentSet).sort());
    } catch (error) {
      console.error('載入用戶失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 過濾用戶
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 搜尋過濾
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = user.name?.toLowerCase().includes(query);
        const matchEmail = user.email?.toLowerCase().includes(query);
        const matchDept = user.department?.toLowerCase().includes(query);
        
        if (!matchName && !matchEmail && !matchDept) {
          return false;
        }
      }
      
      // 部門過濾
      if (selectedDepartment !== 'all') {
        if (user.department !== selectedDepartment) {
          return false;
        }
      }
      
      return true;
    });
  }, [users, searchQuery, selectedDepartment]);

  // 切換用戶選擇
  const toggleUserSelection = (user: User) => {
    if (multiple) {
      const isSelected = selectedUsers.some(u => u.id === user.id);
      if (isSelected) {
        onSelection(selectedUsers.filter(u => u.id !== user.id));
      } else {
        onSelection([...selectedUsers, user]);
      }
    } else {
      onSelection([user]);
    }
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      onSelection([]);
    } else {
      onSelection(filteredUsers);
    }
  };

  // 獲取角色標籤
  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      admin: '管理員',
      manager: '主管',
      salesperson: '業務員',
      viewer: '檢視者'
    };
    return labels[role] || role;
  };

  // 獲取角色顏色
  const getRoleColor = (role: UserRole): string => {
    const roleColors: Record<UserRole, string> = {
      admin: colors.error,
      manager: colors.primary,
      salesperson: colors.success,
      viewer: colors.gray500
    };
    return roleColors[role] || colors.gray500;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={StyleSheet.flatten([styles.loadingText, { color: colors.gray500 }])}>
          載入用戶中...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 搜尋和篩選 */}
      <View style={styles.filterSection}>
        <View style={StyleSheet.flatten([styles.searchBox, { backgroundColor: colors.gray50, borderColor: colors.gray200 }])}>
          <MaterialIcon name="search" size={20} color={colors.gray400} />
          <AdaptiveInput
            style={StyleSheet.flatten([styles.searchInput, { color: colors.text }])}
            placeholder="搜尋用戶姓名、Email 或部門"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcon name="close" size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>

        {departments.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.departmentFilter}
          >
            <TouchableOpacity
              style={StyleSheet.flatten([
                styles.departmentChip,
                {
                  backgroundColor: selectedDepartment === 'all' ? colors.primary : colors.gray100,
                  borderColor: selectedDepartment === 'all' ? colors.primary : colors.gray200
                }
              ])}
              onPress={() => setSelectedDepartment('all')}
            >
              <Text
                style={StyleSheet.flatten([
                  styles.departmentText,
                  { color: selectedDepartment === 'all' ? colors.white : colors.text }
                ])}
              >
                全部部門
              </Text>
            </TouchableOpacity>
            
            {departments.map(dept => (
              <TouchableOpacity
                key={dept}
                style={StyleSheet.flatten([
                  styles.departmentChip,
                  {
                    backgroundColor: selectedDepartment === dept ? colors.primary : colors.gray100,
                    borderColor: selectedDepartment === dept ? colors.primary : colors.gray200
                  }
                ])}
                onPress={() => setSelectedDepartment(dept)}
              >
                <Text
                  style={StyleSheet.flatten([
                    styles.departmentText,
                    { color: selectedDepartment === dept ? colors.white : colors.text }
                  ])}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 全選按鈕 */}
      {multiple && filteredUsers.length > 0 && (
        <TouchableOpacity
          style={StyleSheet.flatten([styles.selectAllButton, { borderColor: colors.gray200 }])}
          onPress={toggleSelectAll}
        >
          <View style={styles.selectAllContent}>
            <View
              style={StyleSheet.flatten([
                styles.checkbox,
                {
                  backgroundColor: selectedUsers.length === filteredUsers.length 
                    ? colors.primary 
                    : colors.white,
                  borderColor: selectedUsers.length === filteredUsers.length
                    ? colors.primary
                    : colors.gray300
                }
              ])}
            >
              {selectedUsers.length === filteredUsers.length && (
                <MaterialIcon name="check" size={16} color={colors.white} />
              )}
            </View>
            <Text style={StyleSheet.flatten([styles.selectAllText, { color: colors.text }])}>
              {selectedUsers.length === filteredUsers.length ? '取消全選' : '全選'}
              {` (${selectedUsers.length}/${filteredUsers.length})`}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* 用戶列表 */}
      <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcon name="person-off" size={48} color={colors.gray300} />
            <Text style={StyleSheet.flatten([styles.emptyText, { color: colors.gray500 }])}>
              沒有找到符合條件的用戶
            </Text>
          </View>
        ) : (
          filteredUsers.map(user => {
            const isSelected = selectedUsers.some(u => u.id === user.id);
            
            return (
              <TouchableOpacity
                key={user.id}
                style={StyleSheet.flatten([
                  styles.userItem,
                  {
                    backgroundColor: isSelected ? withAlpha(colors.primary, 0.063) : colors.white,
                    borderColor: isSelected ? colors.primary : colors.gray200
                  }
                ])}
                onPress={() => toggleUserSelection(user)}
                activeOpacity={0.7}
              >
                <View style={styles.userInfo}>
                  {/* 用戶頭像 */}
                  <View 
                    style={StyleSheet.flatten([
                      styles.avatar,
                      { backgroundColor: withAlpha(getRoleColor(user.role), 0.125) }
                    ])}
                  >
                    <Text style={StyleSheet.flatten([styles.avatarText, { color: getRoleColor(user.role) }])}>
                      {(user.name || user.email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  
                  {/* 用戶資訊 */}
                  <View style={styles.userDetails}>
                    <Text style={StyleSheet.flatten([styles.userName, { color: colors.text }])}>
                      {user.name || user.email}
                    </Text>
                    <View style={styles.userMeta}>
                      <View
                        style={StyleSheet.flatten([
                          styles.roleBadge,
                          { backgroundColor: withAlpha(getRoleColor(user.role), 0.125) }
                        ])}
                      >
                        <Text
                          style={StyleSheet.flatten([
                            styles.roleText,
                            { color: getRoleColor(user.role) }
                          ])}
                        >
                          {getRoleLabel(user.role)}
                        </Text>
                      </View>
                      {user.department && (
                        <Text style={StyleSheet.flatten([styles.departmentText, { color: colors.gray500 }])}>
                          {user.department}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* 選擇狀態 */}
                {multiple ? (
                  <View
                    style={StyleSheet.flatten([
                      styles.checkbox,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.white,
                        borderColor: isSelected ? colors.primary : colors.gray300
                      }
                    ])}
                  >
                    {isSelected && (
                      <MaterialIcon name="check" size={16} color={colors.white} />
                    )}
                  </View>
                ) : (
                  <View
                    style={StyleSheet.flatten([
                      styles.radio,
                      {
                        borderColor: isSelected ? colors.primary : colors.gray300
                      }
                    ])}
                  >
                    {isSelected && (
                      <View
                        style={StyleSheet.flatten([
                          styles.radioInner,
                          { backgroundColor: colors.primary }
                        ])}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8
  },
  loadingText: {
    fontSize: 14
  },
  filterSection: {
    marginBottom: 12
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0
  },
  departmentFilter: {
    marginTop: 12,
    maxHeight: 40
  },
  departmentChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8
  },
  departmentText: {
    fontSize: 12,
    fontWeight: '500'
  },
  selectAllButton: {
    padding: 12,
    borderBottomWidth: 1,
    marginBottom: 8
  },
  selectAllContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500'
  },
  userList: {
    flex: 1
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600'
  },
  userDetails: {
    flex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600'
  },
  departmentText: {
    fontSize: 12
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5
  }
});

export default UserSelector;