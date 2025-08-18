/**
 * 儀表板頁面
 * 顯示系統概覽和關鍵指標
 */

import { AppLayout } from '@/components/layout';
import { cn } from '@/lib/utils';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  PlusIcon, 
  DocumentIcon, 
  TaskIcon, 
  ChartIcon 
} from '@/components/ui/icons';

export default function DashboardPage() {
  // 模擬數據
  const stats = [
    {
      name: '總客戶數',
      value: '2,345',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      name: '本月新增',
      value: '147',
      change: '+5%',
      changeType: 'positive' as const,
    },
    {
      name: '活躍客戶',
      value: '1,892',
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      name: '待處理任務',
      value: '23',
      change: '-2%',
      changeType: 'negative' as const,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: '新客戶',
      description: '張小明 已註冊為新客戶',
      time: '2 小時前',
    },
    {
      id: 2,
      type: '任務完成',
      description: '客戶跟進電話 已完成',
      time: '3 小時前',
    },
    {
      id: 3,
      type: '新記錄',
      description: '會議記錄 已新增',
      time: '5 小時前',
    },
    {
      id: 4,
      type: '更新',
      description: '客戶資料 已更新',
      time: '1 天前',
    },
  ];

  const breadcrumbs = [
    { label: '首頁', href: '/' },
    { label: '儀表板' },
  ];

  return (
    <AppLayout
      title="儀表板"
      breadcrumbs={breadcrumbs}
      headerActions={
        <div className="flex space-x-3">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            匯出報表
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            新增客戶
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6">
        {/* 統計卡片 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </div>
                  <div
                    className={cn(
                      'flex items-center text-sm font-medium',
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    <span>{stat.change}</span>
                    {stat.changeType === 'positive' ? (
                      <ArrowUpIcon className="ml-1 h-4 w-4" />
                    ) : (
                      <ArrowDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 最近活動 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                最近活動
              </h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                              <div className="h-2 w-2 bg-gray-400 rounded-full" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium text-gray-600 mr-2">
                                  {activity.type}
                                </span>
                                {activity.description}
                              </p>
                              <p className="mt-1 text-sm text-gray-500">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                快速操作
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button className="flex flex-col items-center p-6 text-center border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  <PlusIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    新增客戶
                  </span>
                </button>
                <button className="flex flex-col items-center p-6 text-center border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  <DocumentIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    建立記錄
                  </span>
                </button>
                <button className="flex flex-col items-center p-6 text-center border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  <TaskIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    新增任務
                  </span>
                </button>
                <button className="flex flex-col items-center p-6 text-center border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                  <ChartIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    檢視報表
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

