/**
 * 用戶匯入階段指示器組件
 * 顯示用戶匯入流程的不同階段和進度
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserImportStage } from '@/types/userImport';
import { DesignSystem } from '@/theme/designSystem';
import { Icon } from '@/components/common/Icon';

export interface UserImportStageIndicatorProps {
  currentStage: UserImportStage;
  completedStages?: UserImportStage[];
  style?: object;
  compact?: boolean; // 緊湊模式，用於較小的空間
}

/**
 * 階段配置
 */
interface StageConfig {
  key: UserImportStage;
  title: string;
  description: string;
  icon: string;
}

const STAGE_CONFIGS: StageConfig[] = [
  {
    key: 'upload',
    title: '上傳檔案',
    description: '選擇CSV檔案',
    icon: 'cloud-upload-outline'
  },
  {
    key: 'preview',
    title: '預覽資料',
    description: '檢查並編輯用戶資料',
    icon: 'eye-outline'
  },
  {
    key: 'configure',
    title: '配置選項',
    description: '設定匯入參數',
    icon: 'settings-outline'
  },
  {
    key: 'importing',
    title: '匯入中',
    description: '正在創建用戶帳號',
    icon: 'sync-outline'
  },
  {
    key: 'complete',
    title: '完成',
    description: '匯入結果摘要',
    icon: 'checkmark-circle-outline'
  }
];

/**
 * 用戶匯入階段指示器
 */
export const UserImportStageIndicator: React.FC<UserImportStageIndicatorProps> = ({
  currentStage,
  completedStages = [],
  style,
  compact = false
}) => {
  
  /**
   * 獲取階段狀態
   */
  const getStageStatus = (stage: UserImportStage): 'completed' | 'active' | 'pending' => {
    if (completedStages.includes(stage)) {
      return 'completed';
    }
    if (stage === currentStage) {
      return 'active';
    }
    return 'pending';
  };

  /**
   * 獲取階段索引
   */
  const getStageIndex = (stage: UserImportStage): number => {
    return STAGE_CONFIGS.findIndex(config => config.key === stage);
  };

  /**
   * 檢查階段是否可達到（基於當前階段）
   */
  const isStageReachable = (stage: UserImportStage): boolean => {
    const currentIndex = getStageIndex(currentStage);
    const stageIndex = getStageIndex(stage);
    return stageIndex <= currentIndex || completedStages.includes(stage);
  };

  /**
   * 渲染階段項目
   */
  const renderStageItem = (config: StageConfig, index: number) => {
    const status = getStageStatus(config.key);
    const isReachable = isStageReachable(config.key);
    
    const isCompleted = status === 'completed';
    const isActive = status === 'active';
    
    return (
      <View key={config.key} style={styles.stageItem}>
        {/* 階段圓圈 */}
        <View style={[
          styles.stageCircle,
          isActive && styles.stageCircleActive,
          isCompleted && styles.stageCircleCompleted,
          !isReachable && styles.stageCircleDisabled
        ]}>
          {isCompleted ? (
            <Icon 
              name="checkmark" 
              size={compact ? 14 : 16} 
              color={DesignSystem.colors.text.inverse} 
            />
          ) : isActive && config.key === 'importing' ? (
            <Icon 
              name="sync" 
              size={compact ? 14 : 16} 
              color={DesignSystem.colors.text.inverse} 
            />
          ) : (
            <Text style={[
              styles.stageNumber,
              isActive && styles.stageNumberActive,
              isCompleted && styles.stageNumberActive,
              !isReachable && styles.stageNumberDisabled,
              compact && styles.stageNumberCompact
            ]}>
              {index + 1}
            </Text>
          )}
        </View>
        
        {/* 階段標題和描述 */}
        {!compact && (
          <View style={styles.stageTextContainer}>
            <Text style={[
              styles.stageTitle,
              isActive && styles.stageTitleActive,
              isCompleted && styles.stageTitleCompleted,
              !isReachable && styles.stageTitleDisabled
            ]}>
              {config.title}
            </Text>
            <Text style={[
              styles.stageDescription,
              isActive && styles.stageDescriptionActive,
              !isReachable && styles.stageDescriptionDisabled
            ]}>
              {config.description}
            </Text>
          </View>
        )}
        
        {/* 連接線（除了最後一個階段） */}
        {index < STAGE_CONFIGS.length - 1 && (
          <View style={[
            styles.stageLine,
            isCompleted && styles.stageLineCompleted,
            compact && styles.stageLineCompact
          ]} />
        )}
      </View>
    );
  };

  return (
    <View style={[
      compact ? styles.containerCompact : styles.container,
      style
    ]}>
      {STAGE_CONFIGS.map((config, index) => renderStageItem(config, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.lg,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.surface,
  },
  stageItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stageCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DesignSystem.colors.background.primary,
    borderWidth: 2,
    borderColor: DesignSystem.colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stageCircleActive: {
    borderColor: DesignSystem.colors.primary,
    backgroundColor: DesignSystem.colors.primary,
  },
  stageCircleCompleted: {
    borderColor: DesignSystem.colors.success,
    backgroundColor: DesignSystem.colors.success,
  },
  stageCircleDisabled: {
    borderColor: DesignSystem.colors.border.light,
    backgroundColor: DesignSystem.colors.background.secondary,
  },
  stageNumber: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  stageNumberActive: {
    color: DesignSystem.colors.text.inverse,
  },
  stageNumberDisabled: {
    color: DesignSystem.colors.text.disabled,
  },
  stageNumberCompact: {
    fontSize: 12,
  },
  stageTextContainer: {
    marginTop: DesignSystem.spacing.xs,
    alignItems: 'center',
  },
  stageTitle: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 12,
  },
  stageTitleActive: {
    color: DesignSystem.colors.primary,
    fontWeight: '600',
  },
  stageTitleCompleted: {
    color: DesignSystem.colors.success,
  },
  stageTitleDisabled: {
    color: DesignSystem.colors.text.disabled,
  },
  stageDescription: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
    fontSize: 10,
    lineHeight: 12,
  },
  stageDescriptionActive: {
    color: DesignSystem.colors.text.secondary,
  },
  stageDescriptionDisabled: {
    color: DesignSystem.colors.text.disabled,
  },
  stageLine: {
    position: 'absolute',
    top: 17, // 半個圓圈的高度
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: DesignSystem.colors.border.light,
    zIndex: 1,
  },
  stageLineCompleted: {
    backgroundColor: DesignSystem.colors.success,
  },
  stageLineCompact: {
    top: 17, // 調整緊湊模式下的位置
  },
});

export default UserImportStageIndicator;