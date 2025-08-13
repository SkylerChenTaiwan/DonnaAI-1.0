/**
 * 統計服務單元測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTotalOrganizations,
  getActiveOrganizations,
  getTotalUsers,
  getActiveUsers,
  calculateMonthlyRevenue,
  calculateOrganizationGrowthRate,
  calculateUserGrowthRate,
  getPlatformStats,
  getMonthlyRevenueStats,
  getOrganizationUsageStats } from '@/services/firebase/admin/statsService';
import { getCountFromServer, getDocs, collection, query, where } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  getCountFromServer: vi.fn(),
  Timestamp: {
    fromDate: vi.fn((date) => ({ toDate: () => date })),
    now: vi.fn(() => ({ toDate: () => new Date() })) } }));

vi.mock('@/services/firebase/config', () => ({
  getFirebaseDb: vi.fn(() => ({})) }));

// Mock 計費配置
vi.mock('@/config/billing', () => ({
  calculatePrice: vi.fn((users, cycle, gifted) => {
    const billableUsers = Math.max(0, users - gifted);
    const basePrice = billableUsers * 200;
    return cycle === 'yearly' ? basePrice * 12 * 0.8 : basePrice;
  }) }));

describe('Stats Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTotalOrganizations', () => {
    it('應該返回組織總數', async () => {
      const mockCount = { data: () => ({ count: 42 }) };
      vi.mocked(getCountFromServer).mockResolvedValue(mockCount as any);

      const result = await getTotalOrganizations();
      
      expect(getCountFromServer).toHaveBeenCalled();
      expect(result).toBe(42);
    });
  });

  describe('getActiveOrganizations', () => {
    it('應該返回活躍組織數', async () => {
      const mockCount = { data: () => ({ count: 35 }) };
      vi.mocked(getCountFromServer).mockResolvedValue(mockCount as any);

      const result = await getActiveOrganizations();
      
      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('status', '==', 'active');
      expect(result).toBe(35);
    });
  });

  describe('getTotalUsers', () => {
    it('應該返回總用戶數', async () => {
      const mockCount = { data: () => ({ count: 1234 }) };
      vi.mocked(getCountFromServer).mockResolvedValue(mockCount as any);

      const result = await getTotalUsers();
      
      expect(getCountFromServer).toHaveBeenCalled();
      expect(result).toBe(1234);
    });
  });

  describe('calculateMonthlyRevenue', () => {
    it('應該正確計算月度收入', async () => {
      const mockOrgs = [
        {
          data: () => ({
            monthlyUsage: { activeUsers: 10 },
            giftedSeats: 2,
            billingCycle: 'monthly' }) },
        {
          data: () => ({
            monthlyUsage: { activeUsers: 20 },
            giftedSeats: 5,
            billingCycle: 'yearly' }) },
      ];

      const mockSnapshot = {
        docs: mockOrgs };

      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await calculateMonthlyRevenue();
      
      // 第一個組織: (10-2) * 200 = 1600
      // 第二個組織: (20-5) * 200 * 12 * 0.8 / 12 = 2400
      expect(result).toBe(4000);
    });

    it('應該處理沒有活躍組織的情況', async () => {
      const mockSnapshot = { docs: [] };
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await calculateMonthlyRevenue();
      
      expect(result).toBe(0);
    });
  });

  describe('calculateOrganizationGrowthRate', () => {
    it('應該計算正成長率', async () => {
      // 上月10個，本月15個
      vi.mocked(getCountFromServer)
        .mockResolvedValueOnce({ data: () => ({ count: 15 }) } as any) // 本月
        .mockResolvedValueOnce({ data: () => ({ count: 10 }) } as any); // 上月

      const result = await calculateOrganizationGrowthRate();
      
      expect(result).toBe(50); // (15-10)/10 * 100 = 50%
    });

    it('應該計算負成長率', async () => {
      // 上月10個，本月8個
      vi.mocked(getCountFromServer)
        .mockResolvedValueOnce({ data: () => ({ count: 8 }) } as any) // 本月
        .mockResolvedValueOnce({ data: () => ({ count: 10 }) } as any); // 上月

      const result = await calculateOrganizationGrowthRate();
      
      expect(result).toBe(-20); // (8-10)/10 * 100 = -20%
    });

    it('上月為0時應返回0', async () => {
      vi.mocked(getCountFromServer)
        .mockResolvedValueOnce({ data: () => ({ count: 5 }) } as any) // 本月
        .mockResolvedValueOnce({ data: () => ({ count: 0 }) } as any); // 上月

      const result = await calculateOrganizationGrowthRate();
      
      expect(result).toBe(0);
    });
  });

  describe('getPlatformStats', () => {
    it('應該返回完整的平台統計資料', async () => {
      // Mock 所有統計函數的返回值
      vi.mocked(getCountFromServer).mockResolvedValue({ data: () => ({ count: 100 }) } as any);
      
      const mockOrgsSnapshot = {
        docs: [{
          data: () => ({
            monthlyUsage: { activeUsers: 10, aiProcessingCount: 50 },
            giftedSeats: 0,
            billingCycle: 'monthly' }) }] };
      vi.mocked(getDocs).mockResolvedValue(mockOrgsSnapshot as any);

      const stats = await getPlatformStats();
      
      expect(stats).toHaveProperty('totalOrganizations');
      expect(stats).toHaveProperty('activeOrganizations');
      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('monthlyRevenue');
      expect(stats).toHaveProperty('yearlyRevenue');
      expect(stats).toHaveProperty('organizationGrowthRate');
      expect(stats).toHaveProperty('userGrowthRate');
      expect(stats).toHaveProperty('totalRecords');
      expect(stats).toHaveProperty('totalAIProcessing');
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getMonthlyRevenueStats', () => {
    it('應該返回指定月份的收入統計', async () => {
      const mockBillingRecords = [
        {
          data: () => ({
            status: 'paid',
            amount: 5000 }) },
        {
          data: () => ({
            status: 'paid',
            amount: 3000 }) },
        {
          data: () => ({
            status: 'pending',
            amount: 2000 }) },
      ];

      const mockSnapshot = {
        docs: mockBillingRecords,
        forEach: (callback: any) => {
          mockBillingRecords.forEach(callback);
        }
      };

      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getMonthlyRevenueStats('2024-01');
      
      expect(result).toEqual({
        period: '2024-01',
        totalRevenue: 8000,
        paidOrganizations: 2,
        pendingPayments: 2000,
        averageRevenuePerOrg: 4000 });
    });
  });

  describe('getOrganizationUsageStats', () => {
    it('應該返回組織使用統計排行', async () => {
      const mockOrgs = [
        {
          id: 'org1',
          data: () => ({
            name: '組織 A',
            monthlyUsage: {
              activeUsers: 50,
              recordCount: 1000,
              aiProcessingCount: 200 },
            giftedSeats: 5,
            billingCycle: 'monthly',
            lastActive: { toDate: () => new Date() } }) },
        {
          id: 'org2',
          data: () => ({
            name: '組織 B',
            monthlyUsage: {
              activeUsers: 30,
              recordCount: 500,
              aiProcessingCount: 100 },
            giftedSeats: 0,
            billingCycle: 'yearly',
            lastActive: { toDate: () => new Date() } }) },
      ];

      const mockSnapshot = {
        docs: mockOrgs };

      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getOrganizationUsageStats(10, 'monthlyBill');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('organizationId', 'org1');
      expect(result[0]).toHaveProperty('organizationName', '組織 A');
      expect(result[0]).toHaveProperty('activeUsers', 50);
      expect(result[0]).toHaveProperty('totalRecords', 1000);
      expect(result[0]).toHaveProperty('aiProcessingCount', 200);
      expect(result[0]).toHaveProperty('monthlyBill');
      expect(result[1]).toHaveProperty('organizationId', 'org2');
    });

    it('應該處理空結果', async () => {
      const mockSnapshot = { docs: [] };
      vi.mocked(getDocs).mockResolvedValue(mockSnapshot as any);

      const result = await getOrganizationUsageStats(10);
      
      expect(result).toEqual([]);
    });
  });
});