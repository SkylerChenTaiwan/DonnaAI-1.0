/**
 * 步驟 2: 計費方案選擇
 * Step 2: Billing Plan Selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import {
  StepProps,
  BillingPlanData,
  BillingPlan,
  DEFAULT_BILLING_PLANS,
} from '@/types/onboarding';

const BillingPlanStep: React.FC<StepProps> = ({
  data,
  onChange,
  onValidate,
  isActive,
}) => {
  const colors = DesignSystem.colors;
  
  // 初始化資料
  const [formData, setFormData] = useState<BillingPlanData>({
    planId: 'basic',
    billingCycle: 'monthly',
    seats: 10,
    addons: [],
    paymentMethod: 'card', // 預設為信用卡
    billingEmail: '',
    notes: '',
    ...data,
  });

  // 當資料變更時通知父元件
  useEffect(() => {
    if (isActive) {
      onChange(formData);
    }
  }, [formData, isActive]);

  // 選擇計費方案
  const selectPlan = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      planId,
      // 根據方案調整預設座位數
      seats: planId === 'trial' ? 5 : planId === 'enterprise' ? 100 : prev.seats,
    }));
  };

  // 切換計費週期
  const toggleBillingCycle = () => {
    setFormData(prev => ({
      ...prev,
      billingCycle: prev.billingCycle === 'monthly' ? 'yearly' : 'monthly',
    }));
  };

  // 計算價格
  const calculatePrice = (plan: BillingPlan): string => {
    if (plan.price === 0 && plan.priceUnit === 'custom') {
      return '聯絡我們';
    }
    
    if (plan.price === 0) {
      return '免費';
    }
    
    const basePrice = plan.price * formData.seats;
    const discount = formData.billingCycle === 'yearly' ? 0.85 : 1; // 年付85折
    const finalPrice = basePrice * discount;
    
    if (formData.billingCycle === 'yearly') {
      return `$${Math.round(finalPrice * 12).toLocaleString()}/年`;
    }
    
    return `$${finalPrice.toLocaleString()}/月`;
  };

  // 渲染計費方案卡片
  const renderPlanCard = (plan: BillingPlan) => {
    const isSelected = formData.planId === plan.id;
    const isPopular = plan.popular;
    
    return (
      <TouchableOpacity
        key={plan.id}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          isPopular && styles.planCardPopular,
        ]}
        onPress={() => selectPlan(plan.id)}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>最受歡迎</Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Text style={[
            styles.planName,
            isSelected && styles.planNameSelected,
          ]}>
            {plan.name}
          </Text>
          <Text style={[
            styles.planPrice,
            isSelected && styles.planPriceSelected,
          ]}>
            {calculatePrice(plan)}
          </Text>
          {plan.priceUnit && plan.priceUnit !== 'custom' && (
            <Text style={[
              styles.planPriceUnit,
              isSelected && styles.planPriceUnitSelected,
            ]}>
              每用戶
            </Text>
          )}
        </View>
        
        <View style={styles.planFeatures}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <MaterialIcons 
                name="check-circle" 
                size={16} 
                color={isSelected ? colors.primary : colors.success}
              />
              <Text style={[
                styles.featureText,
                isSelected && styles.featureTextSelected,
              ]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <MaterialIcons name="check-circle" size={24} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // 渲染計費週期切換
  const renderBillingCycleToggle = () => {
    if (formData.planId === 'trial' || formData.planId === 'enterprise') {
      return null; // 試用版和企業版不需要選擇週期
    }
    
    return (
      <View style={styles.billingCycleContainer}>
        <TouchableOpacity
          style={[
            styles.cycleOption,
            formData.billingCycle === 'monthly' && styles.cycleOptionActive,
          ]}
          onPress={() => setFormData(prev => ({ ...prev, billingCycle: 'monthly' }))}
        >
          <Text style={[
            styles.cycleText,
            formData.billingCycle === 'monthly' && styles.cycleTextActive,
          ]}>
            月付
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.cycleOption,
            formData.billingCycle === 'yearly' && styles.cycleOptionActive,
          ]}
          onPress={() => setFormData(prev => ({ ...prev, billingCycle: 'yearly' }))}
        >
          <Text style={[
            styles.cycleText,
            formData.billingCycle === 'yearly' && styles.cycleTextActive,
          ]}>
            年付
          </Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>省 15%</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // 渲染用戶數選擇
  const renderSeatsSelector = () => {
    if (formData.planId === 'trial') {
      return null; // 試用版固定5個用戶
    }
    
    return (
      <View style={styles.seatsContainer}>
        <Text style={styles.seatsLabel}>用戶數量</Text>
        <View style={styles.seatsSelector}>
          <TouchableOpacity
            style={styles.seatButton}
            onPress={() => setFormData(prev => ({ 
              ...prev, 
              seats: Math.max(1, prev.seats - 10) 
            }))}
          >
            <MaterialIcons name="remove" size={20} color={colors.gray600} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.seatsInput}
            value={formData.seats.toString()}
            onChangeText={(text) => {
              const seats = parseInt(text) || 1;
              setFormData(prev => ({ ...prev, seats: Math.max(1, seats) }));
            }}
            keyboardType="number-pad"
            textAlign="center"
          />
          
          <TouchableOpacity
            style={styles.seatButton}
            onPress={() => setFormData(prev => ({ 
              ...prev, 
              seats: prev.seats + 10 
            }))}
          >
            <MaterialIcons name="add" size={20} color={colors.gray600} />
          </TouchableOpacity>
        </View>
        <Text style={styles.seatsHint}>
          建議根據您的團隊規模選擇適當的用戶數
        </Text>
      </View>
    );
  };

  // 渲染付款方式
  const renderPaymentMethod = () => {
    if (formData.planId === 'trial') {
      return null; // 試用版不需要付款方式
    }
    
    const paymentMethods = [
      { value: 'credit_card', label: '信用卡', icon: 'credit-card' },
      { value: 'invoice', label: '發票', icon: 'receipt' },
      { value: 'bank_transfer', label: '銀行轉帳', icon: 'account-balance' },
    ];
    
    return (
      <View style={styles.paymentContainer}>
        <Text style={styles.paymentLabel}>付款方式</Text>
        <View style={styles.paymentOptions}>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.value}
              style={[
                styles.paymentOption,
                formData.paymentMethod === method.value && styles.paymentOptionActive,
              ]}
              onPress={() => setFormData(prev => ({ 
                ...prev, 
                paymentMethod: method.value as any 
              }))}
            >
              <MaterialIcons 
                name={method.icon as any} 
                size={24} 
                color={formData.paymentMethod === method.value ? colors.primary : colors.gray600}
              />
              <Text style={[
                styles.paymentText,
                formData.paymentMethod === method.value && styles.paymentTextActive,
              ]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 渲染額外資訊
  const renderAdditionalInfo = () => {
    return (
      <View style={styles.additionalInfo}>
        <Text style={styles.additionalLabel}>額外資訊（選填）</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>計費 Email</Text>
          <TextInput
            style={styles.input}
            value={formData.billingEmail}
            onChangeText={(text) => setFormData(prev => ({ ...prev, billingEmail: text }))}
            placeholder="billing@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>備註</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="請輸入任何特殊需求或備註..."
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    );
  };

  // 渲染價格摘要
  const renderPriceSummary = () => {
    const selectedPlan = DEFAULT_BILLING_PLANS.find(p => p.id === formData.planId);
    if (!selectedPlan) return null;
    
    const basePrice = selectedPlan.price * formData.seats;
    const discount = formData.billingCycle === 'yearly' ? 0.15 : 0;
    const discountAmount = basePrice * discount;
    const finalPrice = basePrice - discountAmount;
    
    if (selectedPlan.price === 0) {
      return null; // 免費或自訂方案不顯示摘要
    }
    
    return (
      <View style={styles.priceSummary}>
        <Text style={styles.summaryTitle}>價格摘要</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {selectedPlan.name} × {formData.seats} 用戶
          </Text>
          <Text style={styles.summaryValue}>
            ${basePrice.toLocaleString()}
          </Text>
        </View>
        
        {discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>年付優惠 (15%)</Text>
            <Text style={[styles.summaryValue, styles.discountValue]}>
              -${discountAmount.toLocaleString()}
            </Text>
          </View>
        )}
        
        <View style={[styles.summaryRow, styles.summaryTotal]}>
          <Text style={styles.totalLabel}>
            總計
            {formData.billingCycle === 'yearly' ? '/年' : '/月'}
          </Text>
          <Text style={styles.totalValue}>
            ${formData.billingCycle === 'yearly' 
              ? (finalPrice * 12).toLocaleString()
              : finalPrice.toLocaleString()
            }
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 計費週期切換 */}
      {renderBillingCycleToggle()}
      
      {/* 計費方案選擇 */}
      <View style={styles.plansGrid}>
        {DEFAULT_BILLING_PLANS.map(plan => renderPlanCard(plan))}
      </View>
      
      {/* 用戶數量選擇 */}
      {renderSeatsSelector()}
      
      {/* 付款方式 */}
      {renderPaymentMethod()}
      
      {/* 額外資訊 */}
      {renderAdditionalInfo()}
      
      {/* 價格摘要 */}
      {renderPriceSummary()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  billingCycleContainer: {
    flexDirection: 'row',
    backgroundColor: DesignSystem.colors.gray[100],
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  cycleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    position: 'relative',
  },
  cycleOptionActive: {
    backgroundColor: DesignSystem.colors.background.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cycleText: {
    fontSize: 14,
    color: DesignSystem.colors.gray[600],
    fontWeight: '500',
  },
  cycleTextActive: {
    color: DesignSystem.colors.text.primary,
  },
  discountBadge: {
    backgroundColor: DesignSystem.colors.status.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 11,
    color: DesignSystem.colors.background.surface,
    fontWeight: '600',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  planCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 280 : '100%',
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[200],
    padding: 20,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: DesignSystem.colors.primary,
    borderWidth: 2,
  },
  planCardPopular: {
    borderColor: DesignSystem.colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  popularText: {
    fontSize: 11,
    color: DesignSystem.colors.background.surface,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 8,
  },
  planNameSelected: {
    color: DesignSystem.colors.primary,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: DesignSystem.colors.text.primary,
  },
  planPriceSelected: {
    color: DesignSystem.colors.primary,
  },
  planPriceUnit: {
    fontSize: 14,
    color: DesignSystem.colors.gray[600],
    marginTop: 4,
  },
  planPriceUnitSelected: {
    color: DesignSystem.colors.primary,
  },
  planFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: DesignSystem.colors.gray[700],
    lineHeight: 20,
  },
  featureTextSelected: {
    color: DesignSystem.colors.text.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  seatsContainer: {
    marginBottom: 24,
  },
  seatsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 12,
  },
  seatsSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  seatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignSystem.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatsInput: {
    flex: 1,
    maxWidth: 100,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  seatsHint: {
    fontSize: 13,
    color: DesignSystem.colors.gray[600],
    marginTop: 8,
  },
  paymentContainer: {
    marginBottom: 24,
  },
  paymentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 12,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    backgroundColor: DesignSystem.colors.background.surface,
    gap: 8,
  },
  paymentOptionActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primary + '10',
  },
  paymentText: {
    fontSize: 12,
    color: DesignSystem.colors.gray[700],
    fontWeight: '500',
  },
  paymentTextActive: {
    color: DesignSystem.colors.primary,
  },
  additionalInfo: {
    marginBottom: 24,
  },
  additionalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: DesignSystem.colors.gray[700],
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: DesignSystem.colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  priceSummary: {
    backgroundColor: DesignSystem.colors.gray[50],
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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
    color: DesignSystem.colors.gray[600],
  },
  summaryValue: {
    fontSize: 14,
    color: DesignSystem.colors.text.primary,
    fontWeight: '500',
  },
  discountValue: {
    color: DesignSystem.colors.status.success,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: DesignSystem.colors.gray[200],
    paddingTop: 12,
    marginTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: DesignSystem.colors.primary,
  },
});

export default BillingPlanStep;