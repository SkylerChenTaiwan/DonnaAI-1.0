/**
 * Google Calendar 同步狀態管理
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  requestCalendarAuthorization,
  getCalendarList,
  syncCalendarEvents,
  syncTaskToCalendar,
  deleteCalendarEvent,
  setupAutoSync
} from '../services/calendar-sync';
import { TaskDoc } from '../types/task';

interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole: string;
  backgroundColor?: string;
}

interface CalendarSyncState {
  // 授權狀態
  isAuthorized: boolean;
  authorizationLoading: boolean;
  authorizationError: string | null;
  
  // 行事曆列表
  calendars: CalendarInfo[];
  selectedCalendarId: string | null;
  calendarsLoading: boolean;
  
  // 同步狀態
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncAt: Date | null;
  syncError: string | null;
  syncProgress: {
    current: number;
    total: number;
    message: string;
  } | null;
  
  // 自動同步設定
  autoSyncEnabled: boolean;
  autoSyncInterval: number; // 分鐘
  
  // 動作
  requestAuthorization: () => Promise<void>;
  loadCalendars: (userId: string) => Promise<void>;
  selectCalendar: (calendarId: string) => void;
  syncEvents: (userId: string, teamId: string) => Promise<void>;
  syncSingleTask: (task: TaskDoc, userId: string) => Promise<void>;
  deleteEvent: (eventId: string, userId: string) => Promise<void>;
  enableAutoSync: (userId: string, teamId: string, interval?: number) => Promise<void>;
  disableAutoSync: () => void;
  reset: () => void;
}

const initialState = {
  isAuthorized: false,
  authorizationLoading: false,
  authorizationError: null,
  calendars: [],
  selectedCalendarId: null,
  calendarsLoading: false,
  syncStatus: 'idle' as const,
  lastSyncAt: null,
  syncError: null,
  syncProgress: null,
  autoSyncEnabled: false,
  autoSyncInterval: 30
};

export const useCalendarSyncStore = create<CalendarSyncState>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // 請求授權
      requestAuthorization: async () => {
        set({ authorizationLoading: true, authorizationError: null });
        
        try {
          const token = await requestCalendarAuthorization();
          if (token) {
            set({ 
              isAuthorized: true, 
              authorizationLoading: false 
            });
          } else {
            throw new Error('未獲得授權');
          }
        } catch (error) {
          set({ 
            authorizationError: error instanceof Error ? error.message : '授權失敗',
            authorizationLoading: false,
            isAuthorized: false
          });
          throw error;
        }
      },
      
      // 載入行事曆列表
      loadCalendars: async (userId: string) => {
        set({ calendarsLoading: true });
        
        try {
          const calendarList = await getCalendarList(userId);
          const calendars: CalendarInfo[] = calendarList.map(cal => ({
            id: cal.id,
            summary: cal.summary,
            primary: cal.primary,
            accessRole: cal.accessRole,
            backgroundColor: cal.backgroundColor
          }));
          
          // 自動選擇主要行事曆
          const primaryCalendar = calendars.find(cal => cal.primary);
          
          set({ 
            calendars,
            selectedCalendarId: primaryCalendar?.id || calendars[0]?.id || null,
            calendarsLoading: false,
            isAuthorized: true
          });
        } catch (error) {
          console.error('載入行事曆列表失敗:', error);
          set({ 
            calendarsLoading: false,
            isAuthorized: false,
            authorizationError: '需要重新授權'
          });
        }
      },
      
      // 選擇行事曆
      selectCalendar: (calendarId: string) => {
        set({ selectedCalendarId: calendarId });
      },
      
      // 同步事件
      syncEvents: async (userId: string, teamId: string) => {
        const { selectedCalendarId } = get();
        if (!selectedCalendarId) {
          throw new Error('請先選擇行事曆');
        }
        
        set({ 
          syncStatus: 'syncing',
          syncError: null,
          syncProgress: {
            current: 0,
            total: 0,
            message: '開始同步...'
          }
        });
        
        try {
          await syncCalendarEvents(userId, teamId, selectedCalendarId);
          
          set({ 
            syncStatus: 'success',
            lastSyncAt: new Date(),
            syncProgress: null
          });
        } catch (error) {
          set({ 
            syncStatus: 'error',
            syncError: error instanceof Error ? error.message : '同步失敗',
            syncProgress: null
          });
          throw error;
        }
      },
      
      // 同步單個任務
      syncSingleTask: async (task: TaskDoc, userId: string) => {
        const { selectedCalendarId } = get();
        if (!selectedCalendarId) {
          throw new Error('請先選擇行事曆');
        }
        
        try {
          await syncTaskToCalendar(task, userId, selectedCalendarId);
        } catch (error) {
          console.error('同步任務失敗:', error);
          throw error;
        }
      },
      
      // 刪除事件
      deleteEvent: async (eventId: string, userId: string) => {
        const { selectedCalendarId } = get();
        if (!selectedCalendarId) {
          throw new Error('請先選擇行事曆');
        }
        
        try {
          await deleteCalendarEvent(eventId, userId, selectedCalendarId);
        } catch (error) {
          console.error('刪除事件失敗:', error);
          throw error;
        }
      },
      
      // 啟用自動同步
      enableAutoSync: async (userId: string, teamId: string, interval: number = 30) => {
        try {
          await setupAutoSync(userId, teamId, interval);
          set({ 
            autoSyncEnabled: true,
            autoSyncInterval: interval
          });
        } catch (error) {
          console.error('啟用自動同步失敗:', error);
          throw error;
        }
      },
      
      // 停用自動同步
      disableAutoSync: () => {
        set({ autoSyncEnabled: false });
      },
      
      // 重置狀態
      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'calendar-sync-store'
    }
  )
);