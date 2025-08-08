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
import { Ionicons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import { StepProps, BillingPlanData } from '@/types/onboarding';

const SimpleBillingStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  const colors = DesignSystem.colors;
  
  // 簡化的資料結構
  const [formData, setFormData] = useState({
    totalSeats: 10,  // 總人數
    freeSeats: 5,    // 免費人數
    pricePerSeat: 10, // 每個付費席位的價格（美元）
    ...data,
  });

  // 計算付費人數
  const paidSeats = Math.max(0, formData.totalSeats - formData.freeSeats);
  
  // 計算月費
  const monthlyPrice = paidSeats * formData.pricePerSeat;

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      // 轉換為原本的格式
      const billingData: BillingPlanData = {
        planId: 'custom',
        billingCycle: 'monthly',
        seats: formData.totalSeats,
        addons: [],
        paymentMethod: 'invoice',
        billingEmail: '',
        notes: `免費人數: ${formData.freeSeats}, 每人月費: $${formData.pricePerSeat}`,
      };
      onChange(billingData);
    }
  }, [formData, isActive]);

  // 調整數量的函數
  const adjustNumber = (field: 'totalSeats' | 'freeSeats' | 'pricePerSeat', delta: number) => {
    setFormData(prev => {
      const newValue = Math.max(0, prev[field] + delta);
      
      // 確保免費人數不超過總人數
      if (field === 'freeSeats') {
        return { ...prev, [field]: Math.min(newValue, prev.totalSeats) };
      }
      
      // 確保總人數不少於免費人數
      if (field === 'totalSeats') {
        return { ...prev, [field]: Math.max(newValue, prev.freeSeats) };
      }
      
      return { ...prev, [field]: newValue };
    });
  };

  return (
    <View style={styles.container}>
      {/* 標題說明 */}
      <View style={styles.header}>
        <Text style={styles.title}>設定組織人數與費用</Text>
        <Text style={styles.subtitle}>
          設定這個組織可以有多少使用者，以及其中多少是免費名額
        </Text>
      </View>

      {/* 總人數設定 */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Ionicons name="people-outline" size={24} color={colors.primary} />
          <Text style={styles.settingTitle}>組織總人數</Text>
        </View>
        
        <View style={styles.numberSelector}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('totalSeats', -5)}
          >
            <Ionicons name="remove" size={20} color={colors.gray600} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.numberInput}
            value={formData.totalSeats.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              setFormData(prev => ({ 
                ...prev, 
                totalSeats: Math.max(value, prev.freeSeats) 
              }));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('totalSeats', 5)}
          >
            <Ionicons name="add" size={20} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.hint}>可以加入組織的最大人數</Text>
      </View>

      {/* 免費人數設定 */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Ionicons name="gift-outline" size={24} color={colors.success} />
          <Text style={styles.settingTitle}>免費名額</Text>
        </View>
        
        <View style={styles.numberSelector}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('freeSeats', -1)}
          >
            <Ionicons name="remove" size={20} color={colors.gray600} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.numberInput}
            value={formData.freeSeats.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              setFormData(prev => ({ 
                ...prev, 
                freeSeats: Math.min(value, prev.totalSeats) 
              }));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('freeSeats', 1)}
          >
            <Ionicons name="add" size={20} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.hint}>不需付費的使用者數量</Text>
      </View>

      {/* 每人月費設定 */}
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <Ionicons name="cash-outline" size={24} color={colors.warning} />
          <Text style={styles.settingTitle}>每人月費（美元）</Text>
        </View>
        
        <View style={styles.numberSelector}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => adjustNumber('pricePerSeat', -5)}
          >
            <Ionicons name="remove" size={20} color={colors.gray600} />
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
            <Ionicons name="add" size={20} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.hint}>超過免費名額後，每位使用者的月費</Text>
      </View>

      {/* 費用摘要 */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>費用摘要</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>總人數</Text>
          <Text style={styles.summaryValue}>{formData.totalSeats} 人</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>免費名額</Text>
          <Text style={[styles.summaryValue, styles.freeText]}>
            {formData.freeSeats} 人
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>付費人數</Text>
          <Text style={styles.summaryValue}>{paidSeats} 人</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>預估月費</Text>
          <Text style={styles.totalValue}>
            ${monthlyPrice.toLocaleString()}
          </Text>
        </View>
        
        {paidSeats > 0 && (
          <Text style={styles.calculation}>
            {paidSeats} 人 × ${formData.pricePerSeat}/月
          </Text>
        )}
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
    color: DesignSystem.colors.gray[600],
    lineHeight: 20,
  },
  settingCard: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[200],
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
    backgroundColor: DesignSystem.colors.gray[100],
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
    color: DesignSystem.colors.gray[600],
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
    color: DesignSystem.colors.gray[600],
    marginTop: 8,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: DesignSystem.colors.primary + '10',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.primary + '30',
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
    color: DesignSystem.colors.gray[700],
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
    backgroundColor: DesignSystem.colors.gray[300],
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
    color: DesignSystem.colors.gray[600],
    textAlign: 'right',
    marginTop: 4,
  },
});

export default SimpleBillingStep;