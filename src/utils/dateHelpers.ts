/**
 * 日期相關的輔助函數
 */

/**
 * 格式化日期為相對時間（例如：5 分鐘前）
 */
export function formatDistanceToNow(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMillis = now.getTime() - targetDate.getTime();
  
  const seconds = Math.floor(diffInMillis / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小時前`;
  } else if (minutes > 0) {
    return `${minutes} 分鐘前`;
  } else {
    return '剛剛';
  }
}

/**
 * 格式化日期為本地時間字串
 */
export function formatLocalDateTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 格式化日期為簡短格式
 */
export function formatShortDate(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return targetDate.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * 檢查是否為今天
 */
export function isToday(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return targetDate.getDate() === today.getDate() &&
         targetDate.getMonth() === today.getMonth() &&
         targetDate.getFullYear() === today.getFullYear();
}

/**
 * 檢查是否為昨天
 */
export function isYesterday(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return targetDate.getDate() === yesterday.getDate() &&
         targetDate.getMonth() === yesterday.getMonth() &&
         targetDate.getFullYear() === yesterday.getFullYear();
}