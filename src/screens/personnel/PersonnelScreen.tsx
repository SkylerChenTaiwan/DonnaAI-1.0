/**
 * 人事管理頁面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolbarIcons } from '@/components/common/ToolbarIcons';
import { Icon } from '@/components/common/Icon';
import { FilterModal } from '@/components/common/FilterModal';
import { ColumnSettingsModal } from '@/components/common/ColumnSettingsModal';
import { FilterBadge, FilterCondition } from '@/components/common/FilterBadge';
import { PersonnelTabs } from './PersonnelTabs';
import { TableView } from './TableView';
import { TreeView } from './TreeView';
import { useOrganization } from '@/hooks/useOrganization';
import { getFirebaseDb } from '@/services/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';
import { useAuthStore } from '@/stores/authStore';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate?: Date;
  lastActive?: Date;
  performance?: {
    meetings: number;
    customers: number;
    deals: number;
  };
}

export const PersonnelScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeView, setActiveView] = useState<'tree' | 'table'>('table');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCondition[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user: authStoreUser } = useAuthStore();
  const { currentTeam } = useOrganization();
  
  // 使用 authStore 的 user，因為它有正確的資料結構
  const user = authStoreUser;

  // 獲取下屬成員
  const fetchSubordinates = async () => {
    if (!user) {
      console.log('等待用戶資料載入...');
      return;
    }

    try {
      setLoading(true);
      
      const db = getFirebaseDb();
      
      // 確保用戶有組織ID
      if (!user.organizationId) {
        console.error('用戶缺少組織ID:', {
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          userData: user
        });
        
        // 嘗試從 Firestore 重新載入用戶資料
        try {
          const userDoc = await getDoc(doc(db, 'users', user.id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.organizationId) {
              showToast('error', '您的帳號尚未設定組織，請聯繡管理員');
              setLoading(false);
              return;
            }
            // 使用重新載入的組織ID
            user.organizationId = userData.organizationId;
          }
        } catch (error) {
          console.error('重新載入用戶資料失敗:', error);
        }
        
        if (!user.organizationId) {
          setLoading(false);
          return;
        }
      }
      
      // 查詢以當前用戶為上級的所有成員
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('organizationId', '==', user.organizationId),
        where('supervisorId', '==', user.id)
      );
      
      const snapshot = await getDocs(q);
      const subordinates: TeamMember[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        subordinates.push({
          id: doc.id,
          name: data.name || '未命名',
          email: data.email,
          role: data.role || 'salesperson',
          department: data.department,
          phone: data.phone,
          status: data.status || 'active',
          joinDate: data.joinDate?.toDate(),
          lastActive: data.lastActive?.toDate(),
          performance: {
            meetings: data.performance?.meetings || 0,
            customers: data.performance?.customers || 0,
            deals: data.performance?.deals || 0,
          },
        });
      });
      
      console.log(`找到 ${subordinates.length} 位下屬`);
      setTeamMembers(subordinates);
    } catch (error) {
      console.error('獲取下屬成員失敗:', error);
      showToast('error', '無法載入下屬成員資料');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubordinates();
  }, [user]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchSubordinates();
  }, [user]);

  // 處理檢視切換
  const handleViewChange = (view: 'tree' | 'table') => {
    setActiveView(view);
  };

  if (loading) {
    return (
      <Layout>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>載入團隊成員...</Text>
        </View>
      </Layout>
    );
  }

  return (
    <Layout>
      <View style={styles.container}>
        {/* 標籤切換 */}
        <PersonnelTabs 
          activeView={activeView} 
          onViewChange={handleViewChange} 
        />
        
        {/* 整合工具列和搜尋欄 */}
        <View style={styles.toolbar}>
          <View style={styles.searchWrapper}>
            <SearchBar
              placeholder="搜尋成員姓名、電子郵件或角色..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchBar}
            />
          </View>
          <View style={styles.toolbarButtons}>
            <ToolbarIcons
              multiSelectMode={multiSelectMode}
              showSort={false}
              showFilter={true}
              showMultiSelect={true}
              showColumns={true}
              showModeToggle={false}
              onFilterPress={() => setShowFilterModal(true)}
              onMultiSelectPress={() => {
                setMultiSelectMode(!multiSelectMode);
                if (!multiSelectMode) {
                  setSelectedIds([]);
                }
              }}
              onColumnsPress={() => setShowColumnSettings(true)}
            />
            {/* 編輯模式切換按鈕 */}
            <TouchableOpacity
              style={[
                styles.iconButton,
                isEditMode && styles.iconButtonActive,
              ]}
              onPress={() => {
                if (!user) {
                  Alert.alert('無權限', '您沒有編輯資料的權限');
                  return;
                }
                // 切換編輯模式時關閉多選模式
                if (!isEditMode) {
                  setMultiSelectMode(false);
                  setSelectedIds([]);
                }
                setIsEditMode(!isEditMode);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="edit-button"
            >
              <Icon
                name={isEditMode ? 'create' : 'create-outline'}
                size={20}
                color={isEditMode ? "#1A1A1A" : "#6B6B6B"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 篩選條件顯示 */}
        <FilterBadge
          filters={activeFilters}
          onRemoveFilter={(key: string) => {
            setActiveFilters(prev => prev.filter(f => f.key !== key));
          }}
          onClearAll={() => setActiveFilters([])}
        />

        {/* 內容區域 */}
        <View style={styles.contentArea}>
          {activeView === 'table' ? (
            <TableView
              teamMembers={teamMembers}
              searchQuery={searchQuery}
              refreshing={refreshing}
              onRefresh={onRefresh}
              multiSelectMode={multiSelectMode}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              activeFilters={activeFilters}
              isEditMode={isEditMode}
            />
          ) : (
            <TreeView
              teamMembers={teamMembers}
              searchQuery={searchQuery}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          )}
        </View>
      </View>

      {/* Modal 元件 */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setActiveFilters(filters);
          setShowFilterModal(false);
        }}
        filters={activeFilters}
        columns={[
          { key: 'status', title: '狀態' },
          { key: 'role', title: '角色' },
          { key: 'department', title: '部門' },
        ]}
        tabType="customers"
      />
      
      <ColumnSettingsModal
        visible={showColumnSettings}
        onClose={() => setShowColumnSettings(false)}
        tableName="personnel"
        columns={[
          { key: 'name', title: '姓名', required: true },
          { key: 'status', title: '狀態' },
          { key: 'role', title: '角色權限' },
          { key: 'department', title: '部門' },
          { key: 'performance', title: '績效指標' },
          { key: 'joinDate', title: '入職日期' },
        ]}
      />
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: DesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
    gap: 12,
  },
  searchWrapper: {
    flex: 1,
  },
  searchBar: {
    flex: 1,
  },
  toolbarButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contentArea: {
    flex: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 92, 0, 0.1)',
  },
});