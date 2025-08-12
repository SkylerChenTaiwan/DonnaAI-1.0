/**
 * Native 平台進度指示器元件
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DesignSystem } from '@/theme/designSystem';

interface ProgressIndicatorProps {
  currentStage: number;
  totalStages?: number;
  labels?: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStage,
  totalStages = 4,
  labels = []
}) => {
  const colors = DesignSystem.colors;
  const stages = Array.from({ length: totalStages }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {stages.map(stage => (
        <View key={stage} style={styles.item}>
          <View style={[
            styles.circle,
            {
              backgroundColor: stage <= currentStage ? colors.primary : colors.gray100,
              borderColor: stage === currentStage ? colors.primary : colors.gray600,
              borderWidth: stage === currentStage ? 2 : 1.5
            }
          ]}>
            <Text style={[
              styles.number,
              { color: stage <= currentStage ? colors.white : colors.gray700 }
            ]}>
              {stage}
            </Text>
          </View>
          {labels[stage - 1] && (
            <Text style={[
              styles.label,
              { color: stage === currentStage ? colors.text.primary : colors.gray500 }
            ]}>
              {labels[stage - 1]}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 20
  },
  item: {
    alignItems: 'center',
    flex: 1
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  number: {
    fontSize: 16,
    fontWeight: '600'
  },
  label: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center'
  }
});

export default ProgressIndicator;