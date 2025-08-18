/**
 * 活動動態組件
 * 顯示系統最近活動和警報通知
 */

'use client';

import React from 'react';
import { 
  Clock, 
  User, 
  UserPlus, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  TrendingUp,
  MessageSquare,
  Calendar,
  Mail,
  Phone,
  Settings
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { DashboardData } from '@/services/analytics.service';

// 活動類型圖標映射
const activityIconMap = {
  customer_created: UserPlus,
  customer_updated: User,
  deal_closed: CheckCircle,
  task_completed: CheckCircle,
  task_created: FileText,
  record_created: FileText,
  record_updated: FileText,
  ai_analysis: TrendingUp,
  email_sent: Mail,
  call_made: Phone,
  meeting_scheduled: Calendar,
  note_added: MessageSquare,
  system_update: Settings,
  default: Clock,
};

// 警報類型圖標映射
const alertIconMap = {
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  success: CheckCircle,
};

// 活動類型顏色映射
const activityColorMap = {
  customer_created: 'bg-green-100 text-green-600',
  customer_updated: 'bg-blue-100 text-blue-600',
  deal_closed: 'bg-emerald-100 text-emerald-600',
  task_completed: 'bg-green-100 text-green-600',
  task_created: 'bg-yellow-100 text-yellow-600',
  record_created: 'bg-blue-100 text-blue-600',
  record_updated: 'bg-blue-100 text-blue-600',
  ai_analysis: 'bg-purple-100 text-purple-600',
  email_sent: 'bg-indigo-100 text-indigo-600',
  call_made: 'bg-orange-100 text-orange-600',
  meeting_scheduled: 'bg-teal-100 text-teal-600',
  note_added: 'bg-gray-100 text-gray-600',
  system_update: 'bg-slate-100 text-slate-600',
  default: 'bg-gray-100 text-gray-600',
};

// 警報類型顏色映射
const alertColorMap = {
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
};

// 時間格式化函數
function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return '剛剛';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘前`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} 小時前`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} 天前`;
  }
}

// 單個活動項目組件
interface ActivityItemProps {
  activity: DashboardData['recentActivities'][0];
  showUser?: boolean;
}

function ActivityItem({ activity, showUser = true }: ActivityItemProps) {
  const IconComponent = activityIconMap[activity.type as keyof typeof activityIconMap] || activityIconMap.default;
  const colorClass = activityColorMap[activity.type as keyof typeof activityColorMap] || activityColorMap.default;
  
  return (
    <div className="flex items-start space-x-3 group">
      {/* 活動圖標 */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      
      {/* 活動內容 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 group-hover:text-gray-700">
          {activity.description}
        </p>
        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(activity.timestamp)}</span>
          {showUser && activity.user && (
            <>
              <span>•</span>
              <span>{activity.user}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 活動動態列表組件
interface ActivityFeedProps {
  activities: DashboardData['recentActivities'];
  className?: string;
  maxItems?: number;
  showUser?: boolean;
  title?: string;
  loading?: boolean;
}

export function ActivityFeed({
  activities,
  className = '',
  maxItems = 10,
  showUser = true,
  title = '最近活動',
  loading = false
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);
  
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-start space-x-3 animate-pulse">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {activities.length > maxItems && (
          <Button variant="outline" size="sm">
            查看全部
          </Button>
        )}
      </div>
      
      {displayedActivities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">目前沒有活動記錄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <ActivityItem 
              key={activity.id} 
              activity={activity} 
              showUser={showUser}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// 單個警報項目組件
interface AlertItemProps {
  alert: DashboardData['alerts'][0];
  onDismiss?: (id: string) => void;
  onActionClick?: (alert: DashboardData['alerts'][0]) => void;
}

function AlertItem({ alert, onDismiss, onActionClick }: AlertItemProps) {
  const IconComponent = alertIconMap[alert.type];
  const colorClass = alertColorMap[alert.type];
  
  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium">{alert.title}</h4>
          <p className="text-sm mt-1 opacity-90">{alert.message}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs opacity-75">
              {formatTimeAgo(alert.timestamp)}
            </span>
            <div className="flex items-center space-x-2">
              {alert.actionUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick?.(alert)}
                  className="text-xs"
                >
                  查看詳情
                </Button>
              )}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(alert.id)}
                  className="text-xs"
                >
                  關閉
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 警報列表組件
interface AlertListProps {
  alerts: DashboardData['alerts'];
  className?: string;
  maxItems?: number;
  title?: string;
  onDismiss?: (id: string) => void;
  onActionClick?: (alert: DashboardData['alerts'][0]) => void;
  loading?: boolean;
}

export function AlertList({
  alerts,
  className = '',
  maxItems = 5,
  title = '系統通知',
  onDismiss,
  onActionClick,
  loading = false
}: AlertListProps) {
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set());
  
  const handleDismiss = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };
  
  const visibleAlerts = alerts
    .filter(alert => !dismissedAlerts.has(alert.id))
    .slice(0, maxItems);
  
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-start">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }
  
  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {alerts.length > 0 && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            visibleAlerts.some(alert => alert.type === 'error') ? 'bg-red-100 text-red-800' :
            visibleAlerts.some(alert => alert.type === 'warning') ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {visibleAlerts.length} 個通知
          </span>
        )}
      </div>
      
      {visibleAlerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">目前沒有系統通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
              onActionClick={onActionClick}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

// 組合活動和警報的儀表板側邊欄
interface DashboardSidebarProps {
  activities: DashboardData['recentActivities'];
  alerts: DashboardData['alerts'];
  className?: string;
  loading?: boolean;
}

export function DashboardSidebar({
  activities,
  alerts,
  className = '',
  loading = false
}: DashboardSidebarProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 系統警報 */}
      <AlertList
        alerts={alerts}
        maxItems={3}
        loading={loading}
      />
      
      {/* 最近活動 */}
      <ActivityFeed
        activities={activities}
        maxItems={8}
        loading={loading}
      />
    </div>
  );
}