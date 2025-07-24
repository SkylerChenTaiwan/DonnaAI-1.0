/**
 * 人事管理頁面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SearchBar } from '@/components/common/SearchBar';
import { PersonnelTabs } from './PersonnelTabs';
import { TableView } from './TableView';
import { TreeView } from './TreeView';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { getUserPermissionContext } from '@/services/firebase/permissions-v2';
import { db } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { showToast } from '@/utils/toast';
import { DesignSystem } from '@/theme/designSystem';

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
  const { user } = useAuth();
  const { currentTeam } = useOrganization();

  // 獲取團隊成員
  const fetchTeamMembers = async () => {
    if (!user || !currentTeam) return;

    try {
      setLoading(true);
      
      // 獲取用戶權限上下文
      const permissionContext = await getUserPermissionContext(user.uid);
      
      // 查詢團隊成員
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('teamIds', 'array-contains', currentTeam.id)
      );
      
      const snapshot = await getDocs(q);
      const members: TeamMember[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
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
      
      setTeamMembers(members);
    } catch (error) {
      console.error('獲取團隊成員失敗:', error);
      showToast('error', '無法載入團隊成員資料');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user, currentTeam]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchTeamMembers();
  }, []);

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
        
        {/* 搜尋欄 */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="搜尋成員姓名、電子郵件或角色..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 內容區域 */}
        <View style={styles.contentArea}>
          {activeView === 'table' ? (
            <TableView
              teamMembers={teamMembers}
              searchQuery={searchQuery}
              refreshing={refreshing}
              onRefresh={onRefresh}
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: DesignSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  contentArea: {
    flex: 1,
  },
});