/**
 * 任務列表區塊 - 顯示過期任務和當日任務
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TaskDoc } from '@/types/task';
import { useTaskStore } from '@/stores/taskStore';
import { showToast } from '@/utils/toast';
import { RootStackParamList } from '@/types/navigation';
// TODO: Install date-fns for better date formatting
// import { format, isToday, isPast, startOfDay } from 'date-fns';
// import { zhTW } from 'date-fns/locale';

// Temporary date helpers
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isPast = (date: Date): boolean => {
  return date < new Date();
};

const format = (date: Date, formatStr: string): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDueDate = (date: Date): string => {
  // 檢查是否有具體時間（不是 00:00）
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
  
  if (isToday(date)) {
    return hasTime ? `今天 ${format(date, 'HH:mm')}` : '今天';
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return hasTime ? `明天 ${format(date, 'HH:mm')}` : '明天';
  }
  
  // 格式化為 MM/DD
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateStr = `${month}/${day}`;
  
  return hasTime ? `${dateStr} ${format(date, 'HH:mm')}` : dateStr;
};

interface TaskListSectionProps {
  userId: string;
  organizationId: string;
  teamId: string;
}

interface TaskSection {
  title: string;
  type: 'overdue' | 'today';
  data: TaskDoc[];
}

export const TaskListSection: React.FC<TaskListSectionProps> = ({
  userId,
  organizationId,
  teamId,
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());

  // 載入任務
  useEffect(() => {
    const loadTasks = async () => {
      if (!userId || !organizationId || !teamId) {
        console.log('Missing required IDs for task loading');
        return;
      }
      setLoading(true);
      await fetchTasks(userId, { teamId }).finally(() => setLoading(false));
    };
    loadTasks();
  }, [fetchTasks, userId, organizationId, teamId]);

  // 下拉重新整理
  const handleRefresh = useCallback(async () => {
    if (!userId || !organizationId || !teamId) return;
    setRefreshing(true);
    await fetchTasks(userId, { teamId });
    setRefreshing(false);
  }, [fetchTasks, userId, organizationId, teamId]);

  // 切換任務狀態
  const toggleTaskStatus = useCallback(async (task: TaskDoc) => {
    console.log('Toggle task status called:', { taskId: task.id, title: task.title, currentStatus: task.status });
    
    if (!task.id) {
      console.error('Task ID is missing!', task);
      showToast('error', '任務 ID 遺失，無法更新狀態');
      return;
    }
    
    if (updatingTaskIds.has(task.id)) return;

    setUpdatingTaskIds(prev => new Set(prev).add(task.id));

    try {
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      await updateTask(task.id!, { 
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : null,
      }, userId);
      
      showToast('success', `任務已標記為${newStatus === 'completed' ? '完成' : '待辦'}`);
      await fetchTasks(userId, { teamId }); // 重新載入以更新列表
    } catch (error) {
      console.error('更新任務狀態失敗:', error);
      showToast('error', '更新任務狀態失敗');
    } finally {
      setUpdatingTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.id);
        return newSet;
      });
    }
  }, [updatingTaskIds, updateTask, fetchTasks, userId, organizationId, teamId]);

  // 導航到任務詳情
  const handleTaskPress = useCallback((task: TaskDoc) => {
    if (!task.id) {
      console.error('Task ID is missing!', task);
      showToast('error', '無法開啟任務詳情');
      return;
    }
    navigation.navigate('TaskDetail', { taskId: task.id });
  }, [navigation]);

  // 過濾並分組任務
  const getTaskSections = useCallback((): TaskSection[] => {
    const now = new Date();
    
    console.log('All tasks from store:', tasks.length, tasks);

    // 過濾屬於當前用戶的任務
    // 包含未完成的任務，以及今天完成的任務
    const userTasks = tasks.filter(task => {
      if (task.assigneeId !== userId) return false;
      
      // 未完成的任務都顯示
      if (task.status !== 'completed') return true;
      
      // 已完成的任務，只顯示今天完成的
      if (task.completedAt) {
        const completedDate = task.completedAt.toDate();
        return completedDate.toDateString() === now.toDateString();
      }
      
      return false;
    });
    
    console.log('User tasks after filter:', userTasks.length, userTasks);

    // 分組任務
    const overdueTasks = userTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = task.dueDate!.toDate();
      return isPast(dueDate) && !isToday(dueDate);
    });

    const todayTasks = userTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = task.dueDate!.toDate();
      return isToday(dueDate);
    });

    // 新增：所有其他待辦任務（只包含沒有截止日期的任務，排除未來的任務）
    const otherTasks = userTasks.filter(task => {
      return !task.dueDate; // 只顯示沒有截止日期的任務
    });
    
    console.log('Tasks without due date:', otherTasks.length, otherTasks);

    const sections: TaskSection[] = [];

    if (overdueTasks.length > 0) {
      sections.push({
        title: `過期任務 (${overdueTasks.length})`,
        type: 'overdue',
        data: overdueTasks.sort((a, b) => 
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
        ),
      });
    }

    if (todayTasks.length > 0) {
      sections.push({
        title: `今日任務 (${todayTasks.length})`,
        type: 'today',
        data: todayTasks.sort((a, b) => 
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
        ),
      });
    }

    // 新增：顯示所有其他待辦任務
    if (otherTasks.length > 0) {
      sections.push({
        title: `待辦任務 (${otherTasks.length})`,
        type: 'today', // 使用 'today' 類型以保持樣式一致
        data: otherTasks.sort((a, b) => {
          // 按建立時間排序，新的在前面
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }),
      });
    }

    return sections;
  }, [tasks, userId]);

  // 渲染任務項目
  const renderTaskItem = ({ item }: { item: TaskDoc }) => {
    console.log('Rendering task item:', { id: item.id, title: item.title, hasId: !!item.id });
    const isUpdating = updatingTaskIds.has(item.id);
    const priorityColor = getPriorityColor(item.priority);

    return (
      <View style={styles.taskItem}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleTaskStatus(item)}
          disabled={isUpdating}
          activeOpacity={0.7}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <View style={[styles.checkbox, item.status === 'completed' && styles.checkboxChecked]}>
              {item.status === 'completed' && (
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              )}
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.taskContent}
          onPress={() => handleTaskPress(item)}
          activeOpacity={0.7}
        >
          <Text style={[styles.taskTitle, item.status === 'completed' && styles.taskTitleCompleted]}>
            {item.title}
          </Text>
          <View style={styles.taskMeta}>
            {item.dueDate && (
              <Text style={styles.taskDue}>
                {formatDueDate(item.dueDate.toDate())}
              </Text>
            )}
            {item.priority !== 'medium' && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                <Text style={styles.priorityText}>
                  {item.priority === 'high' || item.priority === 'urgent' ? '高' : '低'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染區段標題
  const renderSectionHeader = ({ section }: { section: TaskSection }) => (
    <View style={[styles.sectionHeader, section.type === 'overdue' && styles.overdueHeader]}>
      <Text style={[styles.sectionTitle, section.type === 'overdue' && styles.overdueTitle]}>
        {section.title}
      </Text>
    </View>
  );

  // 空狀態
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="checkmark-done-outline" size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>沒有待辦任務</Text>
      <Text style={styles.emptyDescription}>所有任務都已完成！</Text>
    </View>
  );

  const sections = getTaskSections();

  if (loading && tasks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTaskItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmptyState}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

// 取得優先級顏色
const getPriorityColor = (priority: 'low' | 'medium' | 'high' | 'urgent'): string => {
  switch (priority) {
    case 'high':
    case 'urgent':
      return '#EF4444';
    case 'low':
      return '#6B7280';
    default:
      return '#3B82F6';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  listContent: {
    flexGrow: 1,
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
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  taskTitleCompleted: {
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
});