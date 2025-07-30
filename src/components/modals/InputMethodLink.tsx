/**
 * 輸入方式切換連結組件
 * 提供統一的視覺樣式和交互體驗
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { Icon } from '@/components/common/Icon';

interface InputMethodLinkProps {
  targetLabel: string;
  onSwitch: () => void;
  disabled?: boolean;
}

export const InputMethodLink: React.FC<InputMethodLinkProps> = ({
  targetLabel,
  onSwitch,
  disabled = false,
}) => {
  return (
    <TouchableOpacity 
      style={[styles.container, disabled && styles.disabled]}
      onPress={onSwitch}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.linkContent}>
        <Text style={[styles.linkText, disabled && styles.disabledText]}>
          {targetLabel}
        </Text>
        <Icon 
          name="arrow-forward" 
          size={16} 
          color={disabled ? '#C7C7CC' : '#7A7A7A'} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F7',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  disabled: {
    backgroundColor: '#F5F5F7',
    borderColor: '#E5E5EA',
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7A7A7A',
    marginRight: 4,
  },
  disabledText: {
    color: '#8E8E93',
  },
});