/**
 * 分配策略選擇器元件
 * 用於選擇資料分配策略
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { DesignSystem } from '@/theme/designSystem';
import { AssignmentStrategy } from '@/types/assignment';
import { withAlpha } from '@/utils/colorUtils';

interface AssignmentStrategySelectorProps {
  strategy: AssignmentStrategy;
  onStrategyChange: (strategy: AssignmentStrategy) => void;
  dataCount?: number;
}

interface StrategyOption {
  value: AssignmentStrategy;
  icon: string;
  title: string;
  description: string;
  example?: string;
  recommended?: boolean;
}

const AssignmentStrategySelector: React.FC<AssignmentStrategySelectorProps> = ({
  strategy,
  onStrategyChange,
  dataCount = 0
}) => {
  const colors = DesignSystem.colors;

  const strategies: StrategyOption[] = [
    {
      value: 'single_user',
      icon: 'person',
      title: '單一用戶',
      description: '將所有資料分配給同一個用戶',
      example: '適合：小批量資料或特定負責人處理的情況',
      recommended: dataCount <= 50
    },
    {
      value: 'round_robin',
      icon: 'loop',
      title: '輪流分配',
      description: '將資料平均分配給多個用戶',
      example: '適合：需要平衡工作負載的大批量資料',
      recommended: dataCount > 50 && dataCount <= 500
    },
    {
      value: 'csv_column',
      icon: 'table-chart',
      title: 'CSV 欄位指定',
      description: '根據 CSV 中的負責人欄位自動分配',
      example: '適合：從舊系統匯入且包含負責人資訊的資料',
      recommended: false
    },
    {
      value: 'department_rule',
      icon: 'business',
      title: '部門規則',
      description: '根據部門規則和條件自動分配',
      example: '適合：有明確部門分工的組織',
      recommended: false
    },
    {
      value: 'manual_mapping',
      icon: 'edit',
      title: '手動對應',
      description: '逐筆手動指定負責人',
      example: '適合：需要精確控制每筆資料分配的情況',
      recommended: dataCount <= 20
    }
  ];

  const renderStrategyCard = (strategyOption: StrategyOption) => {
    const isSelected = strategy === strategyOption.value;
    
    return (
      <TouchableOpacity
        key={strategyOption.value}
        style={[
          styles.strategyCard,
          {
            backgroundColor: isSelected ? withAlpha(colors.primary, 0.063) : colors.white,
            borderColor: isSelected ? colors.primary : colors.gray200,
            borderWidth: isSelected ? 2 : 1
          }
        ]}
        onPress={() => onStrategyChange(strategyOption.value)}
        activeOpacity={0.7}
      >
        {/* 推薦標籤 */}
        {strategyOption.recommended && (
          <View 
            style={[
              styles.recommendedBadge,
              { backgroundColor: colors.success }
            ]}
          >
            <MaterialIcon name="star" size={12} color={colors.white} />
            <Text style={[styles.recommendedText, { color: colors.white }]}>
              推薦
            </Text>
          </View>
        )}

        {/* 策略圖標和標題 */}
        <View style={styles.strategyHeader}>
          <View 
            style={[
              styles.iconContainer,
              {
                backgroundColor: isSelected 
                  ? withAlpha(colors.primary, 0.125) 
                  : colors.gray100
              }
            ]}
          >
            <MaterialIcon 
              name={strategyOption.icon} 
              size={24} 
              color={isSelected ? colors.primary : colors.gray500}
            />
          </View>
          
          <View style={styles.strategyInfo}>
            <Text 
              style={[
                styles.strategyTitle,
                { color: isSelected ? colors.primary : colors.text }
              ]}
            >
              {strategyOption.title}
            </Text>
            <Text style={[styles.strategyDescription, { color: colors.gray600 }]}>
              {strategyOption.description}
            </Text>
          </View>

          {/* 選中標記 */}
          {isSelected && (
            <View 
              style={[
                styles.checkmark,
                { backgroundColor: colors.primary }
              ]}
            >
              <MaterialIcon name="check" size={16} color={colors.white} />
            </View>
          )}
        </View>

        {/* 使用範例 */}
        {strategyOption.example && (
          <View 
            style={[
              styles.exampleContainer,
              { 
                backgroundColor: isSelected 
                  ? withAlpha(colors.primary, 0.020) 
                  : colors.gray50,
                borderTopColor: isSelected 
                  ? withAlpha(colors.primary, 0.125) 
                  : colors.gray100
              }
            ]}
          >
            <MaterialIcon 
              name="lightbulb-outline" 
              size={14} 
              color={colors.gray500}
            />
            <Text style={[styles.exampleText, { color: colors.gray600 }]}>
              {strategyOption.example}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 資料數量提示 */}
      {dataCount > 0 && (
        <View style={[styles.dataInfo, { backgroundColor: withAlpha(colors.info, 0.063) }]}>
          <MaterialIcon name="info-outline" size={16} color={colors.info} />
          <Text style={[styles.dataInfoText, { color: colors.info }]}>
            將分配 {dataCount} 筆資料
          </Text>
        </View>
      )}

      {/* 策略選項 */}
      <ScrollView 
        style={styles.strategiesList}
        showsVerticalScrollIndicator={false}
      >
        {strategies.map(renderStrategyCard)}
      </ScrollView>

      {/* 策略說明 */}
      <View style={[styles.helpSection, { backgroundColor: colors.gray50 }]}>
        <MaterialIcon name="help-outline" size={16} color={colors.gray500} />
        <Text style={[styles.helpText, { color: colors.gray600 }]}>
          選擇最適合您組織結構和資料特性的分配策略。
          {dataCount > 100 && ' 建議使用輪流分配或 CSV 欄位指定以提高效率。'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  dataInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8
  },
  dataInfoText: {
    fontSize: 14,
    fontWeight: '500'
  },
  strategiesList: {
    flex: 1
  },
  strategyCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  recommendedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 1
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600'
  },
  strategyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  strategyInfo: {
    flex: 1
  },
  strategyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  strategyDescription: {
    fontSize: 13
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exampleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 8
  },
  exampleText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8
  },
  helpText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16
  }
});

export default AssignmentStrategySelector;