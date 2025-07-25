/**
 * 報表匯出服務
 * 支援匯出各種格式的使用報表
 */

import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { 
  UsageReport, 
  UserActivity, 
  ToolUsage, 
  Department 
} from '@/types/admin';
import { showToast } from '@/utils/toast';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
  includeDetails?: boolean;
}

/**
 * 匯出使用報表
 */
export async function exportUsageReport(
  report: UsageReport,
  period: string,
  options: ExportOptions
): Promise<void> {
  try {
    const fileName = `使用報表_${period}_${new Date().toISOString().split('T')[0]}`;
    
    switch (options.format) {
      case 'csv':
        await exportReportAsCSV(report, fileName, options);
        break;
      case 'excel':
        await exportReportAsExcel(report, fileName, options);
        break;
      case 'pdf':
        // PDF 匯出需要額外的函式庫
        showToast('info', 'PDF 匯出功能即將推出');
        break;
      default:
        throw new Error('不支援的匯出格式');
    }
  } catch (error) {
    throw new Error(`匯出失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 匯出為 CSV 格式
 */
async function exportReportAsCSV(
  report: UsageReport,
  fileName: string,
  options: ExportOptions
): Promise<void> {
  // 準備摘要資料
  const summaryData = [
    ['使用報表摘要'],
    ['期間', `${report.period.start.toLocaleDateString('zh-TW')} - ${report.period.end.toLocaleDateString('zh-TW')}`],
    ['總使用時數', `${report.summary.totalUsageHours} 小時`],
    ['活躍用戶數', report.summary.activeUsers],
    ['AI 對話時數', `${report.summary.aiChatMinutes} 分鐘`],
    ['AI 通話時數', `${report.summary.aiCallMinutes} 分鐘`],
    [],
  ];
  
  // 準備用戶活動資料
  const userActivityData = [
    ['用戶活動統計'],
    ['用戶名稱', '登入次數', '使用時數', '最後登入時間'],
    ...report.userActivities.map(activity => [
      activity.userName,
      activity.loginCount,
      activity.totalHours,
      activity.lastActive.toLocaleString('zh-TW'),
    ]),
    [],
  ];
  
  // 準備工具使用資料
  const toolUsageData = [
    ['工具使用統計'],
    ['工具名稱', '使用次數', '使用分鐘數', '用戶數'],
    ...report.toolUsage.map(tool => [
      tool.toolName,
      tool.usageCount,
      tool.totalMinutes,
      tool.uniqueUsers,
    ]),
    [],
  ];
  
  // 準備部門統計資料
  const departmentData = [
    ['部門統計'],
    ['部門名稱', '用戶數', '活躍率', '平均使用時數'],
    ...report.departmentStats.map(dept => [
      dept.name,
      dept.userCount,
      `${(dept.activeRate * 100).toFixed(1)}%`,
      dept.avgHoursPerUser,
    ]),
  ];
  
  // 合併所有資料
  const allData = [
    ...summaryData,
    ...userActivityData,
    ...toolUsageData,
    ...departmentData,
  ];
  
  // 轉換為 CSV
  const csv = Papa.unparse(allData, {
    header: false,
    encoding: 'UTF-8',
  });
  
  // 寫入檔案並分享
  const fileUri = `${FileSystem.documentDirectory}${fileName}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: '匯出使用報表',
    });
  } else {
    throw new Error('您的裝置不支援檔案分享功能');
  }
}

/**
 * 匯出為 Excel 格式
 */
async function exportReportAsExcel(
  report: UsageReport,
  fileName: string,
  options: ExportOptions
): Promise<void> {
  // 建立工作簿
  const wb = XLSX.utils.book_new();
  
  // 摘要工作表
  const summarySheet = XLSX.utils.json_to_sheet([
    {
      項目: '期間',
      數值: `${report.period.start.toLocaleDateString('zh-TW')} - ${report.period.end.toLocaleDateString('zh-TW')}`,
    },
    { 項目: '總使用時數', 數值: `${report.summary.totalUsageHours} 小時` },
    { 項目: '活躍用戶數', 數值: report.summary.activeUsers },
    { 項目: 'AI 對話時數', 數值: `${report.summary.aiChatMinutes} 分鐘` },
    { 項目: 'AI 通話時數', 數值: `${report.summary.aiCallMinutes} 分鐘` },
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, '摘要');
  
  // 用戶活動工作表
  const userActivitySheet = XLSX.utils.json_to_sheet(
    report.userActivities.map(activity => ({
      用戶名稱: activity.userName,
      登入次數: activity.loginCount,
      使用時數: activity.totalHours,
      最後登入: activity.lastActive.toLocaleString('zh-TW'),
    }))
  );
  XLSX.utils.book_append_sheet(wb, userActivitySheet, '用戶活動');
  
  // 工具使用工作表
  const toolUsageSheet = XLSX.utils.json_to_sheet(
    report.toolUsage.map(tool => ({
      工具名稱: tool.toolName,
      使用次數: tool.usageCount,
      使用分鐘數: tool.totalMinutes,
      用戶數: tool.uniqueUsers,
    }))
  );
  XLSX.utils.book_append_sheet(wb, toolUsageSheet, '工具使用');
  
  // 部門統計工作表
  const departmentSheet = XLSX.utils.json_to_sheet(
    report.departmentStats.map(dept => ({
      部門名稱: dept.name,
      用戶數: dept.userCount,
      活躍率: `${(dept.activeRate * 100).toFixed(1)}%`,
      平均使用時數: dept.avgHoursPerUser,
    }))
  );
  XLSX.utils.book_append_sheet(wb, departmentSheet, '部門統計');
  
  // 如果需要詳細資料
  if (options.includeDetails) {
    // 每日統計工作表
    const dailySheet = XLSX.utils.json_to_sheet(
      report.dailyStats.map(stat => ({
        日期: stat.date.toLocaleDateString('zh-TW'),
        登入次數: stat.loginCount,
        活躍用戶: stat.activeUsers,
        使用時數: stat.totalHours,
      }))
    );
    XLSX.utils.book_append_sheet(wb, dailySheet, '每日統計');
  }
  
  // 轉換為二進位格式
  const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  
  // 寫入檔案並分享
  const fileUri = `${FileSystem.documentDirectory}${fileName}.xlsx`;
  await FileSystem.writeAsStringAsync(fileUri, excelBuffer, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: '匯出使用報表',
    });
  } else {
    throw new Error('您的裝置不支援檔案分享功能');
  }
}

/**
 * 匯出圖表為圖片
 * 注意：這需要額外的圖表截圖功能
 */
export async function exportChartAsImage(
  chartRef: any,
  fileName: string
): Promise<void> {
  // TODO: 實作圖表截圖功能
  showToast('info', '圖表匯出功能即將推出');
}

/**
 * 產生報表的文字摘要
 */
export function generateReportSummary(report: UsageReport): string {
  const period = `${report.period.start.toLocaleDateString('zh-TW')} - ${report.period.end.toLocaleDateString('zh-TW')}`;
  
  const summary = `
使用報表摘要
期間：${period}

總覽：
- 總使用時數：${report.summary.totalUsageHours} 小時
- 活躍用戶數：${report.summary.activeUsers} 人
- AI 對話時數：${report.summary.aiChatMinutes} 分鐘
- AI 通話時數：${report.summary.aiCallMinutes} 分鐘

最活躍用戶：
${report.userActivities.slice(0, 5).map((user, index) => 
  `${index + 1}. ${user.userName} - ${user.totalHours} 小時`
).join('\n')}

最常用工具：
${report.toolUsage.slice(0, 5).map((tool, index) => 
  `${index + 1}. ${tool.toolName} - ${tool.usageCount} 次使用`
).join('\n')}

部門表現：
${report.departmentStats.map(dept => 
  `- ${dept.name}：${dept.userCount} 人，活躍率 ${(dept.activeRate * 100).toFixed(1)}%`
).join('\n')}
  `.trim();
  
  return summary;
}

/**
 * 預覽報表內容
 */
export function previewReport(
  report: UsageReport,
  format: ExportFormat
): { headers: string[]; rows: any[][] } {
  switch (format) {
    case 'csv':
    case 'excel':
      return {
        headers: ['類別', '項目', '數值'],
        rows: [
          ['摘要', '期間', `${report.period.start.toLocaleDateString('zh-TW')} - ${report.period.end.toLocaleDateString('zh-TW')}`],
          ['摘要', '總使用時數', `${report.summary.totalUsageHours} 小時`],
          ['摘要', '活躍用戶數', report.summary.activeUsers],
          ['摘要', 'AI 對話時數', `${report.summary.aiChatMinutes} 分鐘`],
          ['摘要', 'AI 通話時數', `${report.summary.aiCallMinutes} 分鐘`],
        ],
      };
    default:
      return { headers: [], rows: [] };
  }
}