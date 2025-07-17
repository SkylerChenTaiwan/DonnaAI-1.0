/**
 * Firestore 文件型別定義
 */

import { Timestamp } from 'firebase/firestore';

export interface FirestoreDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CustomerDoc extends FirestoreDoc {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  assignedTo: string; // 業務員 ID
  teamId: string;
  notes?: string;
  
  // 新增欄位
  customFields?: Record<string, any>;  // 自訂欄位值
  organizationId: string;              // 所屬組織
  relatedUserIds?: string[];           // 關聯使用者 IDs
  tags?: string[];                     // 標籤
  lastContactDate?: Timestamp;         // 最後聯絡日期
  nextFollowUpDate?: Timestamp;        // 下次跟進日期
  
  // AI 自動更新追蹤
  aiAutoUpdates?: {
    lastUpdated: Timestamp;            // 最後更新時間
    updatedFields: string[];           // 哪些欄位被 AI 更新過
    updateSource: string;              // 來源紀錄 ID
  };
}

export interface MeetingDoc extends FirestoreDoc {
  title: string;
  customerIds: string[];
  attendeeIds: string[];
  scheduledAt: Timestamp;
  duration?: number; // 分鐘
  location?: string;
  notes?: string;
  audioFileUrl?: string;
  transcription?: string;
  aiSummary?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface AIUsageDoc extends FirestoreDoc {
  organizationId: string;
  userId: string;
  serviceType: 'transcription' | 'summary' | 'analysis';
  minutesUsed: number;
  cost?: number;
  timestamp: Timestamp;
}