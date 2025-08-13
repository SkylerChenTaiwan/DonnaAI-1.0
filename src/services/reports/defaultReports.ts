/**
 * 預設報表模板系統
 * 提供 6 個預設報表模板，讓新用戶立即看到價值
 */

import { SavedReport } from '../firebase/types';
import { ChartData } from '../../stores/queryStore';

export interface DefaultReportTemplate {
  name: string;
  query: string;
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  generateData: (organizationId: string, teamId?: string) => ChartData;
  tags: string[];
  description?: string;
}

/**
 * 生成本月每日銷售趨勢數據
 */
const generateMonthlyTrend = (): ChartData => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = today.getDate();
  
  // 生成當月每日數據
  const labels = [];
  const data = [];
  
  let baseValue = 80000; // 基礎銷售額
  
  for (let day = 1; day <= currentDay; day++) {
    labels.push(`${currentMonth + 1}/${day}`);
    
    // 模擬真實的銷售波動
    const isWeekend = new Date(currentYear, currentMonth, day).getDay() % 6 === 0;
    const weekendFactor = isWeekend ? 1.3 : 1.0; // 週末銷售較高
    const randomFactor = 0.85 + Math.random() * 0.3; // 15% 的隨機波動
    const trendFactor = 1 + (day / daysInMonth) * 0.1; // 月底逐漸增長
    
    const dailySales = Math.round(baseValue * weekendFactor * randomFactor * trendFactor);
    data.push(dailySales);
  }
  
  return {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: '每日銷售額（元）',
        data,
        borderColor: '#1A1A1A',
        backgroundColor: 'rgba(26, 26, 26, 0.1)',
        tension: 0.4,
        fill: true }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => `銷售額：$${context.parsed.y.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: any) => `$${(value / 1000).toFixed(0)}K`
          }
        }
      }
    }
  };
};

/**
 * 生成團隊績效對比數據
 */
const generateTeamPerformance = (): ChartData => {
  const teams = ['業務一組', '業務二組', '業務三組', '客服團隊', '技術支援'];
  const performances = teams.map(team => ({
    team,
    score: 70 + Math.round(Math.random() * 25), // 70-95 的績效分數
    target: 85, // 目標值
  }));
  
  return {
    type: 'bar',
    data: {
      labels: performances.map(p => p.team),
      datasets: [
        {
          label: '實際績效',
          data: performances.map(p => p.score),
          backgroundColor: '#1A1A1A',
          borderRadius: 4 },
        {
          label: '目標績效',
          data: performances.map(p => p.target),
          backgroundColor: '#E5E7EB',
          borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const },
        tooltip: {
          callbacks: {
            label: (context: any) => `${context.dataset.label}：${context.parsed.y}分`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value: any) => `${value}分`
          }
        }
      }
    }
  };
};

/**
 * 生成客戶分布圖數據
 */
const generateCustomerDistribution = (): ChartData => {
  const regions = [
    { name: '北部地區', value: 35, color: '#1A1A1A' },
    { name: '中部地區', value: 25, color: '#525252' },
    { name: '南部地區', value: 22, color: '#737373' },
    { name: '東部地區', value: 10, color: '#A3A3A3' },
    { name: '離島地區', value: 8, color: '#D4D4D4' },
  ];
  
  return {
    type: 'pie',
    data: {
      labels: regions.map(r => r.name),
      datasets: [{
        data: regions.map(r => r.value),
        backgroundColor: regions.map(r => r.color),
        borderWidth: 2,
        borderColor: '#FFFFFF' }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed;
              return `${label}：${value}%`;
            }
          }
        }
      }
    }
  };
};

/**
 * 生成任務完成率數據
 */
const generateTaskCompletion = (): ChartData => {
  const weeks = ['第一週', '第二週', '第三週', '第四週'];
  const currentWeek = Math.ceil(new Date().getDate() / 7);
  
  const data = weeks.map((week, index) => {
    if (index >= currentWeek) return null; // 未來的週次沒有數據
    
    // 生成合理的完成率（通常在 75-95% 之間）
    const baseRate = 75;
    const variation = Math.random() * 20;
    return Math.round(baseRate + variation);
  });
  
  return {
    type: 'bar',
    data: {
      labels: weeks,
      datasets: [{
        label: '任務完成率（%）',
        data: data,
        backgroundColor: data.map(d => d && d >= 85 ? '#34C759' : '#1A1A1A'),
        borderRadius: 4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => `完成率：${context.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value: any) => `${value}%`
          }
        }
      }
    }
  };
};

/**
 * 生成會議效率分析數據
 */
const generateMeetingEfficiency = (): ChartData => {
  const meetingTypes = [
    { type: '每日站會', avgDuration: 15, targetDuration: 15 },
    { type: '週會', avgDuration: 55, targetDuration: 60 },
    { type: '專案檢討', avgDuration: 45, targetDuration: 30 },
    { type: '客戶會議', avgDuration: 40, targetDuration: 45 },
    { type: '培訓會議', avgDuration: 90, targetDuration: 90 },
  ];
  
  return {
    type: 'bar',
    data: {
      labels: meetingTypes.map(m => m.type),
      datasets: [
        {
          label: '平均時長（分鐘）',
          data: meetingTypes.map(m => m.avgDuration),
          backgroundColor: meetingTypes.map(m => 
            m.avgDuration <= m.targetDuration ? '#34C759' : '#FF9500'
          ),
          borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const, // 橫向條形圖
      plugins: {
        legend: {
          display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => `平均時長：${context.parsed.x} 分鐘`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: (value: any) => `${value}分`
          }
        }
      }
    }
  };
};

/**
 * 生成 AI 使用統計數據
 */
const generateAIUsageStats = (): ChartData => {
  const features = [
    { name: '智能分析', usage: 156 },
    { name: '任務建議', usage: 89 },
    { name: '報表生成', usage: 67 },
    { name: '自動回覆', usage: 234 },
    { name: '情緒分析', usage: 45 },
  ];
  
  // 按使用次數排序
  features.sort((a, b) => b.usage - a.usage);
  
  return {
    type: 'bar',
    data: {
      labels: features.map(f => f.name),
      datasets: [{
        label: '使用次數',
        data: features.map(f => f.usage),
        backgroundColor: '#1A1A1A',
        borderRadius: 4 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => `使用次數：${context.parsed.y} 次`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value: any) => `${value} 次`
          }
        }
      }
    }
  };
};

/**
 * 預設報表模板列表
 */
export const defaultReportTemplates: DefaultReportTemplate[] = [
  {
    name: '本月銷售趨勢',
    query: '顯示本月每日銷售額趨勢',
    chartType: 'line',
    generateData: generateMonthlyTrend,
    tags: ['銷售', '月度', '趨勢'],
    description: '追蹤本月每日銷售表現，識別銷售模式和趨勢' },
  {
    name: '團隊績效對比',
    query: '比較各團隊的績效表現',
    chartType: 'bar',
    generateData: generateTeamPerformance,
    tags: ['團隊', '績效', '對比'],
    description: '對比不同團隊的績效分數，找出表現優異和需要改進的團隊' },
  {
    name: '客戶分布圖',
    query: '顯示客戶的地理分布',
    chartType: 'pie',
    generateData: generateCustomerDistribution,
    tags: ['客戶', '分布', '地區'],
    description: '了解客戶在不同地區的分布情況，優化市場策略' },
  {
    name: '任務完成率',
    query: '顯示每週任務完成率',
    chartType: 'bar',
    generateData: generateTaskCompletion,
    tags: ['任務', '完成率', '週報'],
    description: '追蹤團隊每週的任務完成情況，評估工作效率' },
  {
    name: '會議效率分析',
    query: '分析各類會議的時間效率',
    chartType: 'bar',
    generateData: generateMeetingEfficiency,
    tags: ['會議', '效率', '時間'],
    description: '評估不同類型會議的時間使用效率，優化會議安排' },
  {
    name: 'AI 使用統計',
    query: '統計 AI 功能的使用情況',
    chartType: 'bar',
    generateData: generateAIUsageStats,
    tags: ['AI', '統計', '使用率'],
    description: '了解團隊對各項 AI 功能的使用情況，優化功能投資' },
];

/**
 * 創建預設報表數據
 * @param template 報表模板
 * @param organizationId 組織 ID
 * @param teamId 團隊 ID（可選）
 * @returns 報表數據
 */
export const createDefaultReport = (
  template: DefaultReportTemplate,
  organizationId: string,
  teamId?: string
): Omit<SavedReport, 'id' | 'userId' | 'createdAt' | 'updatedAt'> => {
  const chartData = template.generateData(organizationId, teamId);
  
  return {
    name: template.name,
    query: template.query,
    chartType: template.chartType,
    chartData,
    tags: template.tags,
    isPublic: true,
    organizationId,
    teamId,
    // 標記為預設報表
    isDefault: true,
    isEditable: false,
    description: template.description };
};

/**
 * 檢查是否已存在預設報表
 * @param reports 現有報表列表
 * @returns 是否已有預設報表
 */
export const hasDefaultReports = (reports: SavedReport[]): boolean => {
  return reports.some(report => report.isDefault === true);
};

/**
 * 過濾出預設報表
 * @param reports 報表列表
 * @returns 預設報表列表
 */
export const filterDefaultReports = (reports: SavedReport[]): SavedReport[] => {
  return reports.filter(report => report.isDefault === true);
};

/**
 * 過濾出用戶自定義報表
 * @param reports 報表列表
 * @returns 用戶報表列表
 */
export const filterUserReports = (reports: SavedReport[]): SavedReport[] => {
  return reports.filter(report => !report.isDefault);
};