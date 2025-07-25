/**
 * 計費相關配置
 * 包含價格、試用期等設定
 */

export const BILLING_CONFIG = {
  // 價格設定
  PRICE_PER_USER: 200, // NTD per user per month
  CURRENCY: 'NTD',
  
  // 試用設定
  TRIAL_DAYS: 30,
  
  // 計費週期
  BILLING_CYCLES: ['monthly', 'yearly'] as const,
  
  // 年付折扣
  YEARLY_DISCOUNT: 0.2, // 20% off for yearly
  
  // 批量折扣
  VOLUME_DISCOUNTS: [
    { minUsers: 50, discount: 0.1 }, // 10% off for 50+ users
    { minUsers: 100, discount: 0.15 }, // 15% off for 100+ users
    { minUsers: 200, discount: 0.2 }, // 20% off for 200+ users
  ],
  
  // 最小計費用戶數
  MIN_BILLABLE_USERS: 1,
  
  // 贈送人數上限
  MAX_GIFTED_SEATS: 1000,
} as const;

// 計算價格的輔助函數
export function calculatePrice(
  users: number,
  billingCycle: 'monthly' | 'yearly' = 'monthly',
  giftedSeats: number = 0
): number {
  const billableUsers = Math.max(0, users - giftedSeats);
  
  if (billableUsers === 0) return 0;
  
  let unitPrice = BILLING_CONFIG.PRICE_PER_USER;
  
  // 應用批量折扣
  const volumeDiscount = BILLING_CONFIG.VOLUME_DISCOUNTS
    .reverse()
    .find(d => billableUsers >= d.minUsers);
  
  if (volumeDiscount) {
    unitPrice *= (1 - volumeDiscount.discount);
  }
  
  // 應用年付折扣
  if (billingCycle === 'yearly') {
    unitPrice *= (1 - BILLING_CONFIG.YEARLY_DISCOUNT);
  }
  
  // 計算總價
  const monthlyTotal = unitPrice * billableUsers;
  
  return billingCycle === 'yearly' 
    ? Math.round(monthlyTotal * 12) 
    : Math.round(monthlyTotal);
}