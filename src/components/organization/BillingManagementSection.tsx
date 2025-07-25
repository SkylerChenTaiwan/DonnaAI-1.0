/**
 * 計費管理區塊組件
 * 顯示組織的計費資訊、使用統計和計費歷史
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getOrganizationBillingSummary,
  upgradeOrganizationPlan,
  isTrialActive 
} from '@/services/firebase/admin/organizationService';
import { getUsageHistory, generateBillingRecord } from '@/services/firebase/admin/billingService';
import { Organization, BillingRecord } from '@/types/entities';
import { DesignSystem } from '@/theme/designSystem';
import { toast } from '@/utils/toast';

interface BillingManagementSectionProps {
  organization: Organization;
  onUpdate?: () => void;
}

interface BillingSummary {
  currentPlan: 'trial' | 'pro';
  billingCycle: 'monthly' | 'yearly';
  activeUsers: number;
  giftedSeats: number;
  billableUsers: number;
  monthlyAmount: number;
  trialDaysLeft?: number;
}

export const BillingManagementSection: React.FC<BillingManagementSectionProps> = ({
  organization,
  onUpdate,
}) => {
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // TODO: 暫時停用計費資料載入，等有實際資料時再啟用
    // loadBillingData();
  }, [organization.id]);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      const [summary, history] = await Promise.all([
        getOrganizationBillingSummary(organization.id),
        getUsageHistory(organization.id, 6)
      ]);
      setBillingSummary(summary);
      setBillingHistory(history);
    } catch (error) {
      console.error('載入計費資訊失敗:', error);
      toast.error('載入計費資訊失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradePlan = async () => {
    Alert.alert(
      '升級到 Pro 方案',
      '確定要將此組織升級到 Pro 方案嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '升級',
          onPress: async () => {
            try {
              await upgradeOrganizationPlan(organization.id, 'pro');
              toast.success('已升級到 Pro 方案');
              await loadBillingData();
              onUpdate?.();
            } catch (error) {
              console.error('升級方案失敗:', error);
              toast.error('升級失敗');
            }
          },
        },
      ]
    );
  };

  const handleGenerateBilling = async () => {
    Alert.alert(
      '生成計費記錄',
      '確定要為此組織生成本月的計費記錄嗎？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '生成',
          onPress: async () => {
            try {
              setIsGenerating(true);
              await generateBillingRecord(organization.id);
              toast.success('計費記錄已生成');
              await loadBillingData();
            } catch (error) {
              console.error('生成計費記錄失敗:', error);
              toast.error('生成失敗');
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return DesignSystem.colors.success;
      case 'pending':
        return DesignSystem.colors.warning;
      case 'overdue':
        return DesignSystem.colors.error;
      case 'cancelled':
        return DesignSystem.colors.gray[500];
      default:
        return DesignSystem.colors.gray[500];
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      paid: '已付款',
      pending: '待付款',
      overdue: '逾期',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 開發中通知 */}
      <View style={styles.developmentNotice}>
        <Text style={styles.developmentTitle}>🚧 計費功能開發中</Text>
        <Text style={styles.developmentText}>
          計費統計功能將在後續版本中提供，包括：{'\n'}
          • 即時計費摘要{'\n'}
          • 使用量統計{'\n'}
          • 歷史帳單記錄{'\n'}
          • 自動計費管理
        </Text>
      </View>
      
      {/* TODO: 當月計費摘要（暫時隱藏）
      {billingSummary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>當月計費摘要</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateBilling}
              disabled={isGenerating}
            >
              <Ionicons name="receipt-outline" size={16} color={DesignSystem.colors.primary} />
              <Text style={styles.generateButtonText}>
                {isGenerating ? '生成中...' : '生成帳單'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.planInfo}>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>{billingSummary.currentPlan.toUpperCase()}</Text>
            </View>
            <Text style={styles.billingCycleText}>
              {billingSummary.billingCycle === 'yearly' ? '年付' : '月付'}
            </Text>
          </View>

          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>活躍用戶數</Text>
            <Text style={styles.billingValue}>{billingSummary.activeUsers}</Text>
          </View>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>贈送人數</Text>
            <Text style={styles.billingValue}>-{billingSummary.giftedSeats}</Text>
          </View>
          
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>計費用戶數</Text>
            <Text style={styles.billingValue}>{billingSummary.billableUsers}</Text>
          </View>
          
          <View style={[styles.billingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>月費總額</Text>
            <Text style={styles.totalValue}>NT$ {billingSummary.monthlyAmount.toLocaleString()}</Text>
          </View>

          {/* 試用期資訊 */}
          {billingSummary.trialDaysLeft !== undefined && (
            <View style={styles.trialInfo}>
              <Text style={styles.trialText}>
                試用期還剩 {billingSummary.trialDaysLeft} 天
              </Text>
              {isTrialActive(organization) && (
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgradePlan}
                >
                  <Text style={styles.upgradeButtonText}>升級到 Pro</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* 計費功能選項 */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>計費功能</Text>
        
        <TouchableOpacity style={styles.featureItem}>
          <Ionicons name="calendar-outline" size={20} color={DesignSystem.colors.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>計費週期管理</Text>
            <Text style={styles.featureDesc}>切換月付/年付計費方式</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureItem}>
          <Ionicons name="gift-outline" size={20} color={DesignSystem.colors.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>贈送人數管理</Text>
            <Text style={styles.featureDesc}>設定不計費的用戶人數</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureItem}>
          <Ionicons name="analytics-outline" size={20} color={DesignSystem.colors.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>使用分析報告</Text>
            <Text style={styles.featureDesc}>檢視詳細的使用統計報告</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureItem}>
          <Ionicons name="download-outline" size={20} color={DesignSystem.colors.primary} />
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>匯出計費資料</Text>
            <Text style={styles.featureDesc}>下載計費記錄和發票</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={DesignSystem.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* 計費歷史 */}
      {billingHistory.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>計費歷史</Text>
          
          {billingHistory.slice(0, 5).map((record) => (
            <View key={record.id} style={styles.historyRow}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyPeriod}>{record.period}</Text>
                <Text style={styles.historyDetails}>
                  {record.activeUsers} 用戶 • {record.billableUsers} 計費
                </Text>
              </View>
              
              <View style={styles.historyAmount}>
                <Text style={styles.amountText}>NT$ {record.totalAmount.toLocaleString()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(record.status)}</Text>
                </View>
              </View>
            </View>
          ))}

          {billingHistory.length > 5 && (
            <TouchableOpacity style={styles.showMoreButton}>
              <Text style={styles.showMoreText}>查看更多計費記錄</Text>
              <Ionicons name="chevron-down" size={16} color={DesignSystem.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 價格資訊 */}
      <View style={styles.pricingCard}>
        <Text style={styles.pricingTitle}>價格資訊</Text>
        
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>每用戶月費</Text>
          <Text style={styles.pricingValue}>NT$ 200</Text>
        </View>
        
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>年付折扣</Text>
          <Text style={styles.pricingValue}>20% 折扣</Text>
        </View>
        
        <View style={styles.pricingNote}>
          <Ionicons name="information-circle-outline" size={16} color={DesignSystem.colors.primary} />
          <Text style={styles.pricingNoteText}>
            按實際使用的活躍用戶數計費，可設定贈送人數以減少計費用戶
          </Text>
        </View>
      </View>
      
      {/* 結束註解標記 */}
      {/* */ }
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.xl,
  },
  loadingText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  summaryCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.md,
  },
  summaryTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  generateButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.spacing.sm,
    marginBottom: DesignSystem.spacing.lg,
  },
  planBadge: {
    backgroundColor: DesignSystem.colors.primary,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  planText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
  },
  billingCycleText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
  },
  billingLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  billingValue: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.border.light,
    marginTop: DesignSystem.spacing.sm,
    paddingTop: DesignSystem.spacing.md,
  },
  totalLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '600',
  },
  totalValue: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  trialInfo: {
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.warning + '20',
    borderRadius: DesignSystem.borderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trialText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.warning,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: DesignSystem.colors.success,
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  upgradeButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
  },
  featuresCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  featuresTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  featureContent: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
  },
  featureName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  featureDesc: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  historyCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  historyTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.border.light,
  },
  historyInfo: {
    flex: 1,
  },
  historyPeriod: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  historyDetails: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    marginTop: DesignSystem.spacing.xs,
  },
  historyAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
    marginBottom: DesignSystem.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  statusText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.inverse,
    fontWeight: '600',
  },
  showMoreButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DesignSystem.spacing.xs,
    paddingVertical: DesignSystem.spacing.md,
    marginTop: DesignSystem.spacing.sm,
  },
  showMoreText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
  pricingCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    marginBottom: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  pricingTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.text.primary,
    marginBottom: DesignSystem.spacing.md,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignSystem.spacing.sm,
  },
  pricingLabel: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
  },
  pricingValue: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  pricingNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignSystem.spacing.sm,
    marginTop: DesignSystem.spacing.md,
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.primary + '10',
    borderRadius: DesignSystem.borderRadius.sm,
  },
  pricingNoteText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  developmentNotice: {
    backgroundColor: DesignSystem.colors.warning + '20',
    padding: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.warning + '40',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  developmentTitle: {
    ...DesignSystem.typography.h4,
    color: DesignSystem.colors.warning,
    marginBottom: DesignSystem.spacing.sm,
  },
  developmentText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});