/**
 * 增強版首頁 V2 - 解決嵌套問題
 * 使用單一 FlatList 渲染所有內容
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { ResponsiveLayout } from '@/components/common/ResponsiveLayout';
import { ModeToggle } from '@/components/common/ModeToggle';
import { isWebPlatform, isDesktopWeb, isTabletWeb } from '@/utils/web-detector';
import { TaskListSection } from '@/components/dashboard/TaskListSection';
import { RecentCustomersSection } from '@/components/dashboard/RecentCustomersSection';
import { ManagerDashboard } from './ManagerDashboard';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useTaskStore } from '@/stores/taskStore';
import { useCustomerStore } from '@/stores/customerStore';
import { showToast } from '@/utils/toast';
import { TaskDoc } from '@/types/task';
import { CustomerDoc } from '@/types/customer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

type DashboardSection = 
  | { type: 'header' }
  | { type: 'overdue_tasks'; tasks: TaskDoc[] }
  | { type: 'today_tasks'; tasks: TaskDoc[] }
  | { type: 'no_due_date_tasks'; tasks: TaskDoc[] }
  | { type: 'customers_header' }
  | { type: 'customer'; customer: CustomerDoc }
  | { type: 'empty_tasks' }
  | { type: 'empty_customers' };

export const EnhancedDashboardV2: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user: authUser } = useAuth();
  const { currentOrganization, currentTeam, loading: orgLoading } = useOrganization();
  const { user, mode, toggleMode } = useAuthStore();
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // 載入資料
  React.useEffect(() => {
    if (!authUser || !currentOrganization || !currentTeam) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTasks(authUser.uid, { 
            teamId: currentTeam.id 
          }),
          fetchCustomers(authUser, { 
            organizationId: currentOrganization.id,
            limit: 5,
            orderBy: 'updatedAt',
            orderDirection: 'desc'
          })
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [authUser, currentOrganization, currentTeam, fetchTasks, fetchCustomers]);

  // 下拉重新整理
  const onRefresh = useCallback(async () => {
    if (!authUser || !currentOrganization || !currentTeam) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        fetchTasks(authUser.uid, { 
          teamId: currentTeam.id 
        }),
        fetchCustomers(authUser, { 
          organizationId: currentOrganization.id,
          limit: 5,
          orderBy: 'updatedAt',
          orderDirection: 'desc'
        })
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [authUser, currentOrganization, currentTeam, fetchTasks, fetchCustomers]);

  // 處理任務資料
  const taskSections = useMemo(() => {
    const now = new Date();
    // 移除 console.log 以避免 Web 版無限重載
    // console.log('EnhancedDashboardV2 - Processing tasks:', {
    //   totalTasks: tasks.length,
    //   authUserId: authUser?.uid,
    //   currentTeamId: currentTeam?.id
    // });
    
    // 過濾屬於當前用戶的任務
    // 包含未完成的任務，以及今天完成的任務
    const userTasks = tasks.filter(task => {
      if (task.assigneeId !== authUser?.uid) return false;
      
      // 未完成的任務都顯示
      if (task.status !== 'completed') return true;
      
      // 已完成的任務，只顯示今天完成的
      if (task.completedAt) {
        const completedDate = task.completedAt.toDate();
        return completedDate.toDateString() === now.toDateString();
      }
      
      return false;
    });
    
    // 移除 console.log 以避免 Web 版無限重載
    // console.log('EnhancedDashboardV2 - User tasks:', {
    //   userTasksCount: userTasks.length,
    //   taskDetails: userTasks.map(t => ({ 
    //     id: t.id, 
    //     title: t.title, 
    //     assigneeId: t.assigneeId,
    //     teamId: t.teamId,
    //     dueDate: t.dueDate ? 'has date' : 'no date'
    //   }))
    // });

    const overdueTasks = userTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = task.dueDate!.toDate();
      const isToday = dueDate.toDateString() === now.toDateString();
      const isPast = dueDate < now;
      return isPast && !isToday;
    });

    const todayTasks = userTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = task.dueDate!.toDate();
      return dueDate.toDateString() === now.toDateString();
    });
    
    // 無日期的任務
    const noDueDateTasks = userTasks.filter(task => !task.dueDate);
    
    // 移除 console.log 以避免 Web 版無限重載
    // console.log('Task sections:', {
    //   overdue: overdueTasks.length,
    //   today: todayTasks.length,
    //   noDate: noDueDateTasks.length
    // });

    return { overdueTasks, todayTasks, noDueDateTasks };
  }, [tasks, authUser]);

  // 建立渲染資料
  const sections = useMemo((): DashboardSection[] => {
    const items: DashboardSection[] = [];

    // 任務區段
    if (taskSections.overdueTasks.length > 0) {
      items.push({ type: 'overdue_tasks', tasks: taskSections.overdueTasks });
    }
    if (taskSections.todayTasks.length > 0) {
      items.push({ type: 'today_tasks', tasks: taskSections.todayTasks });
    }
    if (taskSections.noDueDateTasks.length > 0) {
      items.push({ type: 'no_due_date_tasks', tasks: taskSections.noDueDateTasks });
    }
    if (taskSections.overdueTasks.length === 0 && 
        taskSections.todayTasks.length === 0 && 
        taskSections.noDueDateTasks.length === 0) {
      items.push({ type: 'empty_tasks' });
    }

    // 客戶區段
    items.push({ type: 'customers_header' });
    if (customers.length > 0) {
      customers.slice(0, 5).forEach(customer => {
        items.push({ type: 'customer', customer });
      });
    } else {
      items.push({ type: 'empty_customers' });
    }

    return items;
  }, [taskSections, customers]);

  // 渲染項目
  const renderItem = useCallback(({ item }: { item: DashboardSection }) => {
    switch (item.type) {
      case 'overdue_tasks':
        return (
          <View>
            <View style={[styles.sectionHeader, styles.overdueHeader]}>
              <Text style={[styles.sectionTitle, styles.overdueTitle]}>
                過期任務 ({item.tasks.length})
              </Text>
            </View>
            {item.tasks.map(task => renderTaskItem(task))}
          </View>
        );

      case 'today_tasks':
        return (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                今日任務 ({item.tasks.length})
              </Text>
            </View>
            {item.tasks.map(task => renderTaskItem(task))}
          </View>
        );
        
      case 'no_due_date_tasks':
        return (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                待辦任務 ({item.tasks.length})
              </Text>
            </View>
            {item.tasks.map(task => renderTaskItem(task))}
          </View>
        );

      case 'empty_tasks':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>沒有待辦任務</Text>
            <Text style={styles.emptyDescription}>所有任務都已完成！</Text>
          </View>
        );

      case 'customers_header':
        return (
          <View style={styles.customersHeader}>
            <Text style={styles.customersTitle}>近期接觸客戶</Text>
          </View>
        );

      case 'customer':
        return renderCustomerItem(item.customer);

      case 'empty_customers':
        return (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>還沒有客戶資料</Text>
            <Text style={styles.emptyDescription}>開始新增您的第一個客戶</Text>
          </View>
        );

      default:
        return null;
    }
  }, [user, authUser, mode, toggleMode]);

  // 渲染任務項目
  const renderTaskItem = (task: TaskDoc) => {
    const priorityColor = task.priority === 'high' ? '#EF4444' : 
                         task.priority === 'low' ? '#6B7280' : '#3B82F6';
    
    const toggleTaskStatus = async () => {
      if (!authUser || !task.id) {
        console.error('Missing authUser or task.id', { authUser, taskId: task.id });
        showToast('error', '無法更新任務狀態');
        return;
      }
      
      try {
        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        await updateTask(task.id, { 
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date() : null,
        }, authUser.uid);
        
        showToast('success', `任務已標記為${newStatus === 'completed' ? '完成' : '待辦'}`);
        await fetchTasks(authUser.uid, { teamId: currentTeam.id });
      } catch (error) {
        console.error('更新任務狀態失敗:', error);
        showToast('error', '更新任務狀態失敗');
      }
    };
    
    return (
      <View key={task.id} style={styles.taskItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={toggleTaskStatus}
          activeOpacity={0.7}
        >
          {task.status === 'completed' ? (
            <Ionicons name="checkmark-square" size={24} color="#10B981" />
          ) : (
            <Ionicons name="square-outline" size={24} color="#D1D5DB" />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.taskContent}
          onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.taskTitle,
            task.status === 'completed' && styles.taskCompleted
          ]}>
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            {task.dueDate && (
              <Text style={styles.taskDue}>
                {task.dueDate.toDate().toLocaleTimeString('zh-TW', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            )}
            {task.priority !== 'medium' && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityText}>
                  {task.priority === 'high' ? '高' : '低'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染客戶項目
  const renderCustomerItem = (customer: CustomerDoc) => {
    return (
      <TouchableOpacity 
        key={customer.id} 
        style={styles.customerItem}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: customer.id })}
        activeOpacity={0.7}
      >
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.customerCompany}>{customer.company}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  // 載入狀態檢查
  const isWeb = isWebPlatform();
  const isDesktop = isDesktopWeb();
  const isTablet = isTabletWeb();
  const useResponsiveLayout = isWeb && (isDesktop || isTablet);
  
  const LayoutComponent = useResponsiveLayout ? ResponsiveLayout : Layout;
  
  if (orgLoading) {
    return (
      <LayoutComponent style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>載入中...</Text>
        </View>
      </LayoutComponent>
    );
  }

  if (!authUser) {
    return (
      <LayoutComponent style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>請先登入</Text>
        </View>
      </LayoutComponent>
    );
  }

  if (!currentOrganization || !currentTeam) {
    return (
      <LayoutComponent style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>請先設定組織資訊</Text>
        </View>
      </LayoutComponent>
    );
  }

  // 主管模式：顯示 ManagerDashboard
  if (mode === 'manager') {
    return <ManagerDashboard />;
  }

  // 業務模式：顯示原本的內容
  // Web 桌面/平板版使用響應式佈局
  if (useResponsiveLayout) {
    const headerContent = (
      <View style={[styles.header, styles.webHeader]}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || authUser?.displayName || '使用者'}</Text>
          <Text style={styles.userEmail}>{user?.email || authUser?.email}</Text>
        </View>
        <ModeToggle
          value={mode}
          onToggle={toggleMode}
          label={mode === 'business' ? '業務模式' : '主管模式'}
        />
      </View>
    );
    
    return (
      <ResponsiveLayout 
        style={styles.container}
        header={headerContent}
        scrollable={false}
        padding={false}
      >
        <View style={styles.webContent}>
          <FlatList
            data={sections}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={[styles.listContent, styles.webListContent]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ResponsiveLayout>
    );
  }
  
  // 原生平台維持原有佈局
  return (
    <Layout style={styles.container} scrollable={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* 固定頭部 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || authUser?.displayName || '使用者'}</Text>
            <Text style={styles.userEmail}>{user?.email || authUser?.email}</Text>
          </View>
          <ModeToggle
            value={mode}
            onToggle={toggleMode}
            label={mode === 'business' ? '業務模式' : '主管模式'}
          />
        </View>
        
        {/* 可滾動內容 */}
        <FlatList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 120, // 增加底部間距避免被 navbar 擋住
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  overdueHeader: {
    backgroundColor: '#FEF2F2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  overdueTitle: {
    color: '#DC2626',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskDue: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  customersHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  customersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  customerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  customerCompany: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  // Web 響應式樣式
  webHeader: {
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        paddingVertical: 20,
      },
      default: {},
    }),
  },
  webContent: {
    flex: 1,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        width: '100%',
        marginHorizontal: 'auto' as any,
      },
      default: {},
    }),
  },
  webListContent: {
    ...Platform.select({
      web: {
        paddingHorizontal: 32,
        paddingBottom: 40,
      },
      default: {},
    }),
  },
});