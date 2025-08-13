/**
 * 智能分析對話框狀態管理
 */

import { create } from 'zustand';

interface AnalyticsStore {
  isDialogOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  isDialogOpen: false,
  openDialog: () => set({ isDialogOpen: true }),
  closeDialog: () => set({ isDialogOpen: false }) }));