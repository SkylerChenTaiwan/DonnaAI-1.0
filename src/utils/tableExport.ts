/**
 * 表格資料匯出工具
 */

import { TableData, TableColumn } from '@/types/table';
import { FileSystem } from '@/services/filesystem/FileSystemService';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { Platform } from 'react-native';

export type ExportFormat = 'csv' | 'json';

interface ExportOptions {
  format: ExportFormat;
  includeHeaders?: boolean;
  filename?: string;
  email?: string;
}

/**
 * 將資料轉換為 CSV 格式
 */
const dataToCSV = (
  data: TableData[],
  columns: TableColumn[],
  includeHeaders = true
): string => {
  const lines: string[] = [];

  // 標題行
  if (includeHeaders) {
    const headers = columns.map(col => `"${col.title}"`).join(',');
    lines.push(headers);
  }

  // 資料行
  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '""';
      
      // 處理特殊字元
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    lines.push(values.join(','));
  });

  return lines.join('\n');
};

/**
 * 將資料轉換為 JSON 格式
 */
const dataToJSON = (
  data: TableData[],
  columns: TableColumn[]
): string => {
  // 只包含可見欄位的資料
  const exportData = data.map(row => {
    const filteredRow: Record<string, any> = {};
    columns.forEach(col => {
      filteredRow[col.key] = row[col.key];
    });
    return filteredRow;
  });

  return JSON.stringify(exportData, null, 2);
};

/**
 * 匯出表格資料
 */
export const exportTableData = async (
  data: TableData[],
  columns: TableColumn[],
  options: ExportOptions
): Promise<void> => {
  try {
    // 產生檔名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `export_${timestamp}`;
    const filename = options.filename || defaultFilename;
    const extension = options.format === 'csv' ? 'csv' : 'json';
    const fullFilename = `${filename}.${extension}`;

    // 轉換資料
    let content: string;
    if (options.format === 'csv') {
      content = dataToCSV(data, columns, options.includeHeaders);
    } else {
      content = dataToJSON(data, columns);
    }

    // 寫入暫存檔案
    const fileUri = `${FileSystem.documentDirectory}${fullFilename}`;
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8 });

    // 根據選項決定如何處理檔案
    if (Platform.OS === 'web') {
      // Web 平台：直接下載
      const mimeType = options.format === 'csv' ? 'text/csv' : 'application/json';
      if (FileSystem.downloadToBrowser) {
        FileSystem.downloadToBrowser(fullFilename, content, mimeType);
      } else {
        throw new Error('Web 平台下載功能不可用');
      }
    } else if (options.email && await MailComposer.isAvailableAsync()) {
      // 透過郵件發送
      await MailComposer.composeAsync({
        recipients: [options.email],
        subject: `資料匯出 - ${fullFilename}`,
        body: `請查收附件中的匯出資料。\n\n匯出時間：${new Date().toLocaleString('zh-TW')}`,
        attachments: [fileUri] });
    } else if (await Sharing.isAvailableAsync()) {
      // 分享檔案
      await Sharing.shareAsync(fileUri, {
        mimeType: options.format === 'csv' ? 'text/csv' : 'application/json',
        dialogTitle: '匯出資料' });
    } else {
      throw new Error('無法匯出檔案，裝置不支援分享功能');
    }

    // 清理暫存檔案（Web 平台不需要）
    if (Platform.OS !== 'web') {
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch (error) {
          console.error('清理暫存檔案失敗:', error);
        }
      }, 60000); // 1 分鐘後刪除
    }

  } catch (error) {
    console.error('匯出資料失敗:', error);
    throw error;
  }
};

/**
 * 取得匯出檔案大小預估
 */
export const getExportSizeEstimate = (
  data: TableData[],
  columns: TableColumn[],
  format: ExportFormat
): string => {
  let content: string;
  if (format === 'csv') {
    content = dataToCSV(data, columns);
  } else {
    content = dataToJSON(data, columns);
  }
  
  const bytes = new Blob([content]).size;
  
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};