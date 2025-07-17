/**
 * 紀錄系統型別定義（取代原本的 MeetingDoc）
 */

import { Timestamp } from 'firebase/firestore';
import { FirestoreDoc } from './firebase';
import { AIFieldMapping } from './custom-fields';

// 紀錄類型
export type RecordType = 'meeting' | 'call' | 'note' | 'other';

// 紀錄狀態
export type RecordStatus = 'draft' | 'processing' | 'completed';

// AI 確認狀態
export type AIConfirmationStatus = 'pending' | 'confirmed' | 'rejected' | 'modified';

// 紀錄文件
export interface RecordDoc extends FirestoreDoc {
  id?: string;                         // 文件 ID（從 Firestore 獲取時會有）
  type: RecordType;                    // 紀錄類型
  title: string;                       // 標題
  customerIds: string[];               // 關聯客戶 IDs
  participantIds: string[];            // 參與人員 IDs
  scheduledAt?: Timestamp;             // 排程時間
  duration?: number;                   // 持續時間（分鐘）
  location?: string;                   // 地點
  content?: string;                    // 文字內容
  audioFileUrl?: string;               // 錄音檔案 URL
  transcription?: string;              // AI 轉錄文字
  aiSummary?: string;                  // AI 摘要
  aiActionItems?: string[];            // AI 提取的行動項目
  status: RecordStatus;                // 紀錄狀態
  customFields?: Record<string, any>;  // 自訂欄位值
  
  // 音訊錄製相關
  audioRecordingState?: {
    status: 'recording' | 'paused' | 'stopped' | 'editing' | 'processing';
    startTime?: Timestamp;
    endTime?: Timestamp;
    duration?: number;          // 秒數
    fileSize?: number;          // bytes
    format?: string;            // mp3, wav, m4a
    trimSettings?: {            // 編輯設定
      originalDuration: number;
      trimStart: number;        // 秒數
      trimEnd: number;          // 秒數
    };
  };
  
  // 處理偏好設定
  processingPreference?: 'immediate' | 'edit_first' | 'manual';
  
  // 補救錄音標識
  recordingType?: 'live' | 'voice_summary' | 'text_summary';
  
  // 使用者確認狀態
  userConfirmationStatus?: {
    aiSuggestionsReviewed: boolean;
    customModifications?: Record<string, any>;
    confirmedAt?: Timestamp;
    rejectedSuggestions?: string[];
  };
  
  // AI 欄位自動填入結果
  aiFieldMappings?: AIFieldMapping[]; // AI 建議的欄位對應
  aiProcessingMetadata?: {
    processedAt: Timestamp;            // 處理時間
    modelUsed: string;                 // 使用的模型
    totalConfidence: number;           // 整體信心分數
  };
  
  // AI 處理確認狀態
  aiConfirmationId?: string;           // 關聯的確認請求 ID
  aiConfirmationStatus?: AIConfirmationStatus;
  
  // 組織關聯
  teamId: string;                      // 所屬團隊
  organizationId: string;              // 所屬組織
}

// 紀錄上傳請求
export interface RecordUploadRequest {
  type: RecordType;
  title: string;
  customerIds?: string[];
  participantIds?: string[];
  scheduledAt?: Date;
  audioFile?: File;                    // 音訊檔案
  content?: string;                    // 文字內容
  teamId: string;
}

// 紀錄處理結果
export interface RecordProcessingResult {
  recordId: string;
  transcription?: string;
  aiSummary?: string;
  aiActionItems?: string[];
  aiFieldMappings?: AIFieldMapping[];
  processingTime: number;
  success: boolean;
  error?: string;
}

// 紀錄查詢過濾器
export interface RecordFilter {
  type?: RecordType | RecordType[];
  status?: RecordStatus | RecordStatus[];
  customerIds?: string[];
  participantIds?: string[];
  teamId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasAudio?: boolean;
  hasCustomFields?: boolean;
}

// 紀錄統計資料
export interface RecordStats {
  totalCount: number;
  byType: Record<RecordType, number>;
  byStatus: Record<RecordStatus, number>;
  averageDuration?: number;
  totalAudioMinutes?: number;
}

// 音訊編輯相關類型
export interface AudioEditingSession {
  recordId: string;
  originalAudioUrl: string;
  editedAudioUrl?: string;
  waveformData?: number[];     // 波形視覺化資料
  editHistory: Array<{
    action: 'trim' | 'cut' | 'volume_adjust';
    timestamp: Date;
    parameters: Record<string, any>;
  }>;
  isEditing: boolean;
}

// 推播通知類型
export interface MeetingReminder {
  id: string;
  meetingId?: string;
  userId: string;
  scheduledTime: Timestamp;
  reminderType: 'pre_meeting' | 'in_meeting' | 'post_meeting';
  notificationSent: boolean;
  userResponse?: 'dismissed' | 'snoozed' | 'started_recording';
}