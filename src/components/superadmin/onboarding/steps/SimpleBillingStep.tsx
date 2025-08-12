import { Icon } from '../../../../components/common/Icon';
/**
 * 簡化版計費設定
 * 只設定總人數和免費人數
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { DesignSystem } from '@/theme/designSystem';
import { StepProps, BillingPlanData } from '@/types/onboarding';
import { withAlpha } from '@/utils/colorUtils';

const SimpleBillingStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  const colors = DesignSystem.colors;
  
  // 簡化的資料結構
  const [formData, setFormData] = useState({
    freeSeats: 5,    // 免費人數（精確數量）
    pricePerSeat: 10, // 超過免費人數後，每個付費席位的價格（美元）
    ...data,
  });

  // 注意：實際付費人數會根據組織實際使用人數動態計算
  // 這裡只是顯示計費邏輯說明

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      // 轉換為原本的格式
      const billingData: BillingPlanData = {
        planId: 'custom',
        billingCycle: 'monthly',
        seats: formData.freeSeats, // 使用免費人數作為基礎席位
        addons: [],
        paymentMethod: 'invoice',
        billingEmail: '',
        notes: `免費人數: ${formData.freeSeats}, 超額每人月費: $${formData.pricePerSeat}`,
      };
      onChange(billingData);
    }
  }, [formData, isActive]);

  // 調整數量的函數
  const adjustNumber = (field: 'freeSeats' | 'pricePerSeat', delta: number) => {
    setFormData(prev => {
      const newValue = Math.max(0, prev[field] + delta);
      return { ...prev, [field]: newValue };
    });
  };

  return (
    <View style={styles.container}>
      {/* 標題說明 */}
      <View style={styles.header}>
        <Text style={styles.title}>設定計費方案</Text>
        <Text style={styles.subtitle}>
          設定免費使用者名額，超過的使用者將按人數收費
        </Text>
      </View>

      {/* 免費人數設定 */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Icon name="gift-outline" size={24} color={colors.success}  />
          <Text style={styles.settingTitle}>免費名額</Text>
        </View>
        
        <View style={styles.numberSelector}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('freeSeats', -1)}
          >
            <Icon name="remove" size={20} color={colors.gray600}  />
          </TouchableOpacity>
          
          <TextInput
            style={styles.numberInput}
            value={formData.freeSeats.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              setFormData(prev => ({ 
                ...prev, 
                freeSeats: Math.max(0, value) 
              }));
            }}
            keyboardType="number-pad"
            textAlign="center"
            placeholder="人數"
          />
          
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('freeSeats', 1)}
          >
            <Icon name="add" size={20} color={colors.gray600}  />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.hint}>組織內不需付費的精確使用者數量</Text>
      </View>

      {/* 每人月費設定 */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Icon name="cash-outline" size={24} color={colors.warning}  />
          <Text style={styles.settingTitle}>每人月費（美元）</Text>
        </View>
        
        <View style={styles.numberSelector}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('pricePerSeat', -5)}
          >
            <Icon name="remove" size={20} color={colors.gray600}  />
          </TouchableOpacity>
          
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={formData.pricePerSeat.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                setFormData(prev => ({ ...prev, pricePerSeat: Math.max(0, value) }));
              }}
              keyboardType="number-pad"
              textAlign="center"
            />
          </View>
          
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('pricePerSeat', 5)}
          >
            <Icon name="add" size={20} color={colors.gray600}  />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.hint}>超過免費名額後，每位使用者的月費</Text>
      </View>

      {/* 計費說明 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>計費方式說明</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>免費名額</Text>
          <Text style={[styles.summaryValue, styles.freeText]}>
            {formData.freeSeats} 人
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>超額費用</Text>
          <Text style={styles.summaryValue}>
            ${formData.pricePerSeat}/人/月
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.billingNote}>
          <Icon name="information-circle-outline" size={16} color={colors.primary}  />
          {' '}計費方式
        </Text>
        
        <Text style={styles.billingDescription}>
          • 前 {formData.freeSeats} 位使用者免費
        </Text>
        <Text style={styles.billingDescription}>
          • 超過免費名額的使用者，每人每月收費 ${formData.pricePerSeat}
        </Text>
        <Text style={styles.billingDescription}>
          • 實際費用依當月使用人數計算
        </Text>
        
        <View style={styles.exampleBox}>
          <Text style={styles.exampleTitle}>計費範例：</Text>
          <Text style={styles.exampleText}>
            若組織有 {formData.freeSeats + 10} 位使用者：
          </Text>
          <Text style={styles.exampleCalculation}>
            月費 = ({formData.freeSeats + 10} - {formData.freeSeats}) × ${formData.pricePerSeat} = ${10 * formData.pricePerSeat}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: DesignSystem.colors.gray600,
    lineHeight: 20,
  },
  settingCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  numberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  adjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignSystem.colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberInput: {
    width: 80,
    height: 48,
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DesignSystem.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.gray600,
    marginRight: 4,
  },
  priceInput: {
    width: 60,
    height: 48,
    fontSize: 24,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  hint: {
    fontSize: 13,
    color: DesignSystem.colors.gray600,
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: withAlpha(DesignSystem.colors.primary, 0.063),
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: withAlpha(DesignSystem.colors.primary, 0.188),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray700,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: DesignSystem.colors.text.primary,
  },
  freeText: {
    color: DesignSystem.colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: DesignSystem.colors.gray300,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: DesignSystem.colors.primary,
  },
  calculation: {
    fontSize: 12,
    color: DesignSystem.colors.gray600,
    textAlign: 'right',
    marginTop: 4,
  },
  billingNote: {
    fontSize: 14,
    fontWeight: '600',
    color: DesignSystem.colors.primary,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  billingDescription: {
    fontSize: 13,
    color: DesignSystem.colors.gray700,
    marginBottom: 6,
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray200,
  },
  exampleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 6,
  },
  exampleText: {
    fontSize: 12,
    color: DesignSystem.colors.gray600,
    marginBottom: 4,
  },
  exampleCalculation: {
    fontSize: 12,
    color: DesignSystem.colors.primary,
    fontWeight: '500',
  },
});

export default SimpleBillingStep;