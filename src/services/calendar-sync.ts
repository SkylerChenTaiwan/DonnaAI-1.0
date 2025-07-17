/**
 * Google Calendar 同步服務
 * 處理 OAuth 2.0 認證和行事曆事件同步
 */

import { 
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential
} from 'firebase/auth';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase/config';
import { TaskDoc, TaskStatus } from '../types/task';
import { RecordDoc } from '../types/record';
import { createTask, updateTask, getTasks } from './firebase/tasks';
import { createRecord, updateRecord } from './firebase/records';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  status?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

interface CalendarSyncState {
  lastSyncAt?: Date;
  syncToken?: string;
  calendarId?: string;
}

/**
 * 請求 Google Calendar 授權
 */
export async function requestCalendarAuthorization(): Promise<string | null> {
  try {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    // 添加 Calendar 範圍
    provider.addScope(GOOGLE_CALENDAR_SCOPE);
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    
    // 強制重新選擇帳號
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline'
    });
    
    const result: UserCredential = await signInWithPopup(auth, provider);
    
    // 獲取 OAuth 憑證
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential || !credential.accessToken) {
      throw new Error('無法獲取存取權杖');
    }
    
    // 儲存存取權杖到使用者文件
    const userId = result.user.uid;
    await updateDoc(doc(db, 'users', userId), {
      googleCalendarToken: credential.accessToken,
      googleCalendarTokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 小時後過期
      googleCalendarSyncEnabled: true,
      updatedAt: new Date()
    });
    
    return credential.accessToken;
  } catch (error) {
    console.error('Google Calendar 授權失敗:', error);
    throw error;
  }
}

/**
 * 獲取使用者的 Google Calendar 存取權杖
 */
async function getCalendarAccessToken(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    const token = userData.googleCalendarToken;
    const expiry = userData.googleCalendarTokenExpiry?.toDate();
    
    // 檢查權杖是否過期
    if (!token || !expiry || expiry < new Date()) {
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('獲取 Calendar 權杖失敗:', error);
    return null;
  }
}

/**
 * 獲取使用者的行事曆列表
 */
export async function getCalendarList(userId: string): Promise<any[]> {
  const accessToken = await getCalendarAccessToken(userId);
  if (!accessToken) {
    throw new Error('需要重新授權 Google Calendar');
  }
  
  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.status}`);
    }
    
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('獲取行事曆列表失敗:', error);
    throw error;
  }
}

/**
 * 同步 Google Calendar 事件
 */
export async function syncCalendarEvents(
  userId: string,
  teamId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const accessToken = await getCalendarAccessToken(userId);
  if (!accessToken) {
    throw new Error('需要重新授權 Google Calendar');
  }
  
  try {
    // 獲取同步狀態
    const syncStateDoc = await getDoc(doc(db, 'calendarSync', userId));
    const syncState: CalendarSyncState = syncStateDoc.exists() 
      ? syncStateDoc.data() as CalendarSyncState
      : {};
    
    // 設定時間範圍（過去 7 天到未來 30 天）
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 7);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);
    
    // 構建請求 URL
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    });
    
    if (syncState.syncToken) {
      params.append('syncToken', syncState.syncToken);
    }
    
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.status}`);
    }
    
    const data = await response.json();
    const events: GoogleCalendarEvent[] = data.items || [];
    
    // 處理每個事件
    for (const event of events) {
      await processCalendarEvent(event, userId, teamId);
    }
    
    // 更新同步狀態
    await setDoc(doc(db, 'calendarSync', userId), {
      lastSyncAt: new Date(),
      syncToken: data.nextSyncToken || syncState.syncToken,
      calendarId
    });
    
    console.log(`同步了 ${events.length} 個行事曆事件`);
  } catch (error) {
    console.error('同步行事曆事件失敗:', error);
    throw error;
  }
}

/**
 * 處理單個行事曆事件
 */
async function processCalendarEvent(
  event: GoogleCalendarEvent,
  userId: string,
  teamId: string
): Promise<void> {
  try {
    // 檢查是否已存在相關任務或紀錄
    const existingTasks = await getTasks(userId, {
      googleCalendarEventId: event.id
    });
    
    if (existingTasks.length > 0) {
      // 更新現有任務
      const task = existingTasks[0];
      await updateTaskFromCalendarEvent(task.id!, event, userId);
    } else {
      // 建立新任務或紀錄
      if (isEventAMeeting(event)) {
        await createRecordFromCalendarEvent(event, userId, teamId);
      } else {
        await createTaskFromCalendarEvent(event, userId, teamId);
      }
    }
  } catch (error) {
    console.error(`處理行事曆事件失敗 (${event.id}):`, error);
  }
}

/**
 * 判斷事件是否為會議
 */
function isEventAMeeting(event: GoogleCalendarEvent): boolean {
  // 有參與者或包含會議相關關鍵字
  const hasMeetingKeywords = /會議|meeting|討論|review|sync|call/i.test(
    event.summary + ' ' + (event.description || '')
  );
  
  return (event.attendees && event.attendees.length > 1) || hasMeetingKeywords;
}

/**
 * 從行事曆事件建立任務
 */
async function createTaskFromCalendarEvent(
  event: GoogleCalendarEvent,
  userId: string,
  teamId: string
): Promise<void> {
  const startDate = event.start.dateTime 
    ? new Date(event.start.dateTime)
    : event.start.date 
    ? new Date(event.start.date)
    : undefined;
  
  const taskData: Omit<TaskDoc, 'id' | 'createdAt' | 'updatedAt'> = {
    title: event.summary,
    description: event.description,
    type: startDate ? 'scheduled' : 'unscheduled',
    scheduledAt: startDate,
    priority: 'medium',
    status: 'todo',
    assigneeId: userId,
    googleCalendarEventId: event.id,
    source: 'calendar_sync',
    teamId,
    organizationId: teamId // 假設 teamId 即為 organizationId
  };
  
  await createTask(taskData, userId);
}

/**
 * 從行事曆事件建立紀錄
 */
async function createRecordFromCalendarEvent(
  event: GoogleCalendarEvent,
  userId: string,
  teamId: string
): Promise<void> {
  const startDate = event.start.dateTime 
    ? new Date(event.start.dateTime)
    : event.start.date 
    ? new Date(event.start.date)
    : new Date();
  
  // 提取參與者名稱
  const participantNames = event.attendees
    ?.filter(a => a.responseStatus !== 'declined')
    .map(a => a.displayName || a.email)
    || [];
  
  const recordData: Omit<RecordDoc, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
    type: 'meeting',
    title: event.summary,
    participantIds: [], // 需要根據 email 查找使用者 ID
    scheduledAt: startDate,
    location: event.location,
    content: event.description || '',
    status: 'draft',
    teamId,
    organizationId: teamId,
    googleCalendarEventId: event.id,
    participantNames
  };
  
  await createRecord(recordData, userId);
}

/**
 * 更新任務從行事曆事件
 */
async function updateTaskFromCalendarEvent(
  taskId: string,
  event: GoogleCalendarEvent,
  userId: string
): Promise<void> {
  const startDate = event.start.dateTime 
    ? new Date(event.start.dateTime)
    : event.start.date 
    ? new Date(event.start.date)
    : undefined;
  
  const updates: Partial<TaskDoc> = {
    title: event.summary,
    description: event.description,
    scheduledAt: startDate
  };
  
  // 如果事件已取消，更新任務狀態
  if (event.status === 'cancelled') {
    updates.status = 'cancelled';
  }
  
  await updateTask(taskId, updates, userId);
}

/**
 * 將任務同步到 Google Calendar
 */
export async function syncTaskToCalendar(
  task: TaskDoc,
  userId: string,
  calendarId: string = 'primary'
): Promise<string | null> {
  const accessToken = await getCalendarAccessToken(userId);
  if (!accessToken) {
    throw new Error('需要重新授權 Google Calendar');
  }
  
  try {
    const eventData: Partial<GoogleCalendarEvent> = {
      summary: task.title,
      description: task.description
    };
    
    // 設定時間
    if (task.scheduledAt) {
      const startTime = task.scheduledAt instanceof Date 
        ? task.scheduledAt 
        : task.scheduledAt.toDate();
      
      // 預設持續時間為 1 小時
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      
      eventData.start = {
        dateTime: startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
      
      eventData.end = {
        dateTime: endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } else if (task.dueDate) {
      // 如果只有截止日期，設為全天事件
      const dueDate = task.dueDate instanceof Date 
        ? task.dueDate 
        : task.dueDate.toDate();
      
      eventData.start = {
        date: dueDate.toISOString().split('T')[0]
      };
      
      eventData.end = {
        date: dueDate.toISOString().split('T')[0]
      };
    }
    
    // 如果任務已有 Google Calendar ID，則更新；否則建立新事件
    const method = task.googleCalendarEventId ? 'PATCH' : 'POST';
    const url = task.googleCalendarEventId
      ? `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${task.googleCalendarEventId}`
      : `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    
    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.status}`);
    }
    
    const createdEvent = await response.json();
    
    // 更新任務的 Google Calendar ID
    if (!task.googleCalendarEventId && createdEvent.id) {
      await updateTask(task.id!, {
        googleCalendarEventId: createdEvent.id
      }, userId);
    }
    
    return createdEvent.id;
  } catch (error) {
    console.error('同步任務到 Calendar 失敗:', error);
    throw error;
  }
}

/**
 * 刪除 Google Calendar 事件
 */
export async function deleteCalendarEvent(
  eventId: string,
  userId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const accessToken = await getCalendarAccessToken(userId);
  if (!accessToken) {
    throw new Error('需要重新授權 Google Calendar');
  }
  
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`API 錯誤: ${response.status}`);
    }
  } catch (error) {
    console.error('刪除 Calendar 事件失敗:', error);
    throw error;
  }
}

/**
 * 設定自動同步排程
 */
export async function setupAutoSync(
  userId: string,
  teamId: string,
  intervalMinutes: number = 30
): Promise<void> {
  // 這個函數應該在 Cloud Functions 中實作為定期觸發器
  // 這裡只是記錄設定
  await setDoc(doc(db, 'calendarSyncSettings', userId), {
    enabled: true,
    intervalMinutes,
    teamId,
    lastConfiguredAt: new Date()
  });
}