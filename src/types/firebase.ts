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