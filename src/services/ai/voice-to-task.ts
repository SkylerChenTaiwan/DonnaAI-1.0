/**
 * 語音轉任務處理服務
 * 將語音輸入轉換為結構化的任務資料
 */

import { transcribeAudio, cleanTranscriptionText, SpeechToTextOptions } from './speech-to-text';
import { TaskFormData } from '@/services/validation/form-schemas';

export interface VoiceToTaskOptions {
  language?: string;
  extractDeadline?: boolean;
  extractPriority?: boolean;
  extractAssignee?: boolean;
  autoDetectTaskType?: boolean;
}

export interface ExtractedTaskData {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
  confidence: number;
  rawTranscription: string;
}

export interface VoiceToTaskResult {
  success: boolean;
  extractedTask?: ExtractedTaskData;
  taskFormData?: Partial<TaskFormData>;
  audioUri: string;
  duration: number;
  processingTime: number;
  error?: string;
}

export interface TaskExtractionProgress {
  stage: 'transcribing' | 'analyzing' | 'extracting' | 'completing';
  percentage: number;
  message: string;
}

/**
 * 將語音轉換為任務資料
 */
export async function convertVoiceToTask(
  audioUri: string,
  options: VoiceToTaskOptions = {},
  onProgress?: (progress: TaskExtractionProgress) => void
): Promise<VoiceToTaskResult> {
  const startTime = Date.now();
  
  const {
    language = 'zh-TW',
    extractDeadline = true,
    extractPriority = true,
    extractAssignee = true,
    autoDetectTaskType = true } = options;

  try {
    // 階段 1：語音轉文字
    onProgress?.({
      stage: 'transcribing',
      percentage: 10,
      message: '正在進行語音識別...' });

    const speechOptions: SpeechToTextOptions = {
      language,
      enableAutomaticPunctuation: true,
      maxAlternatives: 2 };

    const transcriptionResult = await transcribeAudio(
      audioUri,
      speechOptions,
      (speechProgress) => {
        onProgress?.({
          stage: 'transcribing',
          percentage: 10 + (speechProgress.percentage * 0.4), // 10%-50%
          message: speechProgress.message });
      }
    );

    if (!transcriptionResult.transcription) {
      throw new Error('語音識別失敗，無法取得轉錄內容');
    }

    // 清理轉錄文本
    const cleanedText = cleanTranscriptionText(transcriptionResult.transcription);

    // 階段 2：分析和結構化提取
    onProgress?.({
      stage: 'analyzing',
      percentage: 50,
      message: '正在分析任務內容...' });

    const extractedTask = await extractTaskFromText(cleanedText, {
      extractDeadline,
      extractPriority,
      extractAssignee,
      autoDetectTaskType });

    onProgress?.({
      stage: 'extracting',
      percentage: 80,
      message: '正在提取任務資訊...' });

    // 階段 3：轉換為表單資料格式
    const taskFormData = convertToTaskFormData(extractedTask);

    onProgress?.({
      stage: 'completing',
      percentage: 100,
      message: '任務提取完成' });

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      extractedTask: {
        ...extractedTask,
        rawTranscription: cleanedText },
      taskFormData,
      audioUri,
      duration: transcriptionResult.duration || 0,
      processingTime };

  } catch (error) {
    console.error('語音轉任務失敗:', error);
    
    const processingTime = Date.now() - startTime;
    
    return {
      success: false,
      audioUri,
      duration: 0,
      processingTime,
      error: error instanceof Error ? error.message : '語音轉任務處理失敗' };
  }
}

/**
 * 從文本中提取任務資訊
 */
async function extractTaskFromText(
  text: string,
  options: {
    extractDeadline: boolean;
    extractPriority: boolean;
    extractAssignee: boolean;
    autoDetectTaskType: boolean;
  }
): Promise<ExtractedTaskData> {
  // 使用簡化的規則提取（在實際應用中應該使用更複雜的 NLP 或 AI 模型）
  
  // 1. 提取任務標題（通常是第一句話或關鍵動詞短語）
  const title = extractTaskTitle(text);
  
  // 2. 提取描述（整段文本，去除提取出的其他資訊）
  let description = text;
  
  // 3. 提取優先級
  let priority: 'low' | 'medium' | 'high' | 'urgent' | undefined;
  if (options.extractPriority) {
    priority = extractPriority(text);
    if (priority) {
      description = description.replace(getPriorityPatterns(), '').trim();
    }
  }
  
  // 4. 提取截止日期
  let dueDate: string | undefined;
  if (options.extractDeadline) {
    dueDate = extractDueDate(text);
    if (dueDate) {
      description = description.replace(getDatePatterns(), '').trim();
    }
  }
  
  // 5. 提取指派人員
  let assignedTo: string | undefined;
  if (options.extractAssignee) {
    assignedTo = extractAssignee(text);
    if (assignedTo) {
      description = description.replace(getAssigneePatterns(), '').trim();
    }
  }
  
  // 6. 提取標籤
  const tags = extractTags(text);
  
  // 7. 計算置信度
  const confidence = calculateExtractionConfidence(text, {
    title,
    description,
    priority,
    dueDate,
    assignedTo });

  return {
    title: title || '語音任務',
    description: description || text,
    priority,
    dueDate,
    assignedTo,
    tags,
    confidence };
}

/**
 * 提取任務標題
 */
function extractTaskTitle(text: string): string {
  // 尋找表示任務的關鍵詞
  const taskPatterns = [
    /^(.{1,50}?)(?=[，。！？\n]|$)/,                    // 第一句話（最多50字）
    /(?:需要|要|請|幫我|提醒|記得)(.{5,30})(?=[，。！？]|$)/, // 任務動詞後面的內容
    /(.{5,30})(?:這件事|這個|任務|工作)/,                  // 任務相關詞前面的內容
  ];

  for (const pattern of taskPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // 如果沒找到特定模式，返回前30個字
  return text.substring(0, 30).trim() || '語音任務';
}

/**
 * 提取優先級
 */
function extractPriority(text: string): 'low' | 'medium' | 'high' | 'urgent' | undefined {
  const priorityKeywords = {
    urgent: ['緊急', '急', '馬上', '立刻', '立即', '火急', '超急'],
    high: ['重要', '優先', '高', '趕快', '儘快', '盡快'],
    low: ['不急', '低', '有空', '慢慢', '不趕', '晚點'],
    medium: ['一般', '普通', '正常'], // 中等優先級關鍵字較少，大多是預設值
  };

  for (const [level, keywords] of Object.entries(priorityKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return level as 'low' | 'medium' | 'high' | 'urgent';
    }
  }

  return undefined; // 預設為 medium
}

/**
 * 提取截止日期
 */
function extractDueDate(text: string): string | undefined {
  // 日期模式匹配
  const datePatterns = [
    // 絕對日期
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})月(\d{1,2})日/,
    /(\d{1,2})\/(\d{1,2})/,
    
    // 相對日期
    /(今天|明天|後天|昨天)/,
    /(下周|下週|下星期)([一二三四五六日])?/,
    /(\d+)天後/,
    /(\d+)週後/,
    /(\d+)個月後/,
    
    // 時間相關
    /(這周|這週|本週|本周)([一二三四五六日])?/,
    /(下個月|下月)/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return convertToISODate(match[0]);
    }
  }

  return undefined;
}

/**
 * 轉換為 ISO 日期格式
 */
function convertToISODate(dateText: string): string {
  const now = new Date();
  
  // 相對日期轉換
  if (dateText.includes('今天')) {
    return now.toISOString().split('T')[0];
  } else if (dateText.includes('明天')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  } else if (dateText.includes('後天')) {
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    return dayAfterTomorrow.toISOString().split('T')[0];
  }
  
  // 週數轉換
  const weeksMatch = dateText.match(/(\d+)週後/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + (weeks * 7));
    return futureDate.toISOString().split('T')[0];
  }
  
  // 天數轉換
  const daysMatch = dateText.match(/(\d+)天後/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    return futureDate.toISOString().split('T')[0];
  }
  
  // 月份轉換（簡化處理）
  const monthsMatch = dateText.match(/(\d+)個月後/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + months);
    return futureDate.toISOString().split('T')[0];
  }
  
  // 絕對日期（簡化處理，需要更複雜的邏輯）
  const absoluteMatch = dateText.match(/(\d{1,2})月(\d{1,2})日/);
  if (absoluteMatch) {
    const month = parseInt(absoluteMatch[1]) - 1; // JS 月份從 0 開始
    const day = parseInt(absoluteMatch[2]);
    const date = new Date(now.getFullYear(), month, day);
    
    // 如果日期已過，設為明年
    if (date < now) {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    return date.toISOString().split('T')[0];
  }
  
  // 預設返回一週後
  const defaultDate = new Date(now);
  defaultDate.setDate(defaultDate.getDate() + 7);
  return defaultDate.toISOString().split('T')[0];
}

/**
 * 提取指派人員
 */
function extractAssignee(text: string): string | undefined {
  const assigneePatterns = [
    /給(.{2,10})(?:做|處理|負責|執行)/,
    /請(.{2,10})(?:幫忙|協助|處理)/,
    /(.{2,10})(?:來做|負責|執行|處理)這個/,
    /指派給(.{2,10})/,
  ];

  for (const pattern of assigneePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * 提取標籤
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  
  // 項目相關標籤
  const projectPatterns = ['專案', '項目', '計畫', '企劃'];
  for (const pattern of projectPatterns) {
    if (text.includes(pattern)) {
      tags.push(pattern);
      break;
    }
  }
  
  // 類型相關標籤
  const typePatterns = ['會議', '電話', '文件', '報告', '簡報', '設計'];
  for (const pattern of typePatterns) {
    if (text.includes(pattern)) {
      tags.push(pattern);
    }
  }
  
  // 部門相關標籤
  const departmentPatterns = ['業務', '行銷', '技術', '設計', '財務', '人資'];
  for (const pattern of departmentPatterns) {
    if (text.includes(pattern)) {
      tags.push(pattern);
    }
  }
  
  // 語音輸入標籤
  tags.push('語音輸入');
  
  return tags;
}

/**
 * 計算提取置信度
 */
function calculateExtractionConfidence(
  text: string,
  extracted: {
    title: string;
    description: string;
    priority?: string;
    dueDate?: string;
    assignedTo?: string;
  }
): number {
  let confidence = 0.3; // 基礎置信度
  
  // 文本長度影響
  if (text.length > 10) confidence += 0.1;
  if (text.length > 50) confidence += 0.1;
  
  // 任務標題品質
  if (extracted.title && extracted.title.length > 5) confidence += 0.2;
  
  // 有明確的任務關鍵詞
  const taskKeywords = ['做', '完成', '處理', '準備', '安排', '提醒', '記得'];
  if (taskKeywords.some(keyword => text.includes(keyword))) {
    confidence += 0.15;
  }
  
  // 有時間相關資訊
  if (extracted.dueDate) confidence += 0.15;
  
  // 有優先級資訊
  if (extracted.priority) confidence += 0.1;
  
  // 有指派人員資訊
  if (extracted.assignedTo) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

/**
 * 轉換為任務表單資料格式
 */
function convertToTaskFormData(extractedTask: ExtractedTaskData): Partial<TaskFormData> {
  return {
    title: extractedTask.title,
    description: extractedTask.description,
    priority: extractedTask.priority || 'medium',
    status: 'pending',
    dueDate: extractedTask.dueDate,
    assignedTo: extractedTask.assignedTo,
    tags: extractedTask.tags || [] };
}

// 輔助函數：取得各種模式的正則表達式
function getPriorityPatterns(): RegExp {
  return /(?:緊急|急|馬上|立刻|立即|火急|超急|重要|優先|高|趕快|儘快|盡快|不急|低|有空|慢慢|不趕|晚點|一般|普通|正常)/g;
}

function getDatePatterns(): RegExp {
  return /(?:\d{4}年\d{1,2}月\d{1,2}日|\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2}|今天|明天|後天|昨天|下周|下週|下星期|這周|這週|本週|本周|下個月|下月|\d+天後|\d+週後|\d+個月後)/g;
}

function getAssigneePatterns(): RegExp {
  return /(?:給.{2,10}(?:做|處理|負責|執行)|請.{2,10}(?:幫忙|協助|處理)|.{2,10}(?:來做|負責|執行|處理)這個|指派給.{2,10})/g;
}

/**
 * 驗證提取結果品質
 */
export function validateExtractionQuality(result: ExtractedTaskData): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 標題驗證
  if (!result.title || result.title.length < 3) {
    issues.push('任務標題過短或缺失');
    suggestions.push('建議手動修改任務標題，使其更具描述性');
  }

  // 描述驗證
  if (!result.description || result.description.length < 10) {
    issues.push('任務描述過短');
    suggestions.push('建議添加更詳細的任務描述');
  }

  // 置信度驗證
  if (result.confidence < 0.6) {
    issues.push('語音識別置信度較低');
    suggestions.push('建議檢查並修正任務內容');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions };
}

/**
 * 生成語音轉任務報告
 */
export function generateVoiceToTaskReport(result: VoiceToTaskResult): string {
  const report = [
    '=== 語音轉任務報告 ===',
    `處理時間: ${new Date().toLocaleString()}`,
    `音訊時長: ${result.duration} 秒`,
    `處理耗時: ${(result.processingTime / 1000).toFixed(2)} 秒`,
    '',
    '提取結果:',
  ];

  if (result.success && result.extractedTask) {
    const task = result.extractedTask;
    
    report.push(
      `- 任務標題: ${task.title}`,
      `- 任務描述: ${task.description}`,
      `- 優先級: ${task.priority || '未設定'}`,
      `- 截止日期: ${task.dueDate || '未設定'}`,
      `- 指派人員: ${task.assignedTo || '未設定'}`,
      `- 標籤: ${task.tags?.join(', ') || '無'}`,
      `- 置信度: ${(task.confidence * 100).toFixed(1)}%`,
      '',
      '原始轉錄:',
      task.rawTranscription,
    );
  } else {
    report.push(`處理失敗: ${result.error || '未知錯誤'}`);
  }

  return report.join('\n');
}