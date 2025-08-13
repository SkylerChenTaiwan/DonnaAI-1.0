/**
 * 錄音用途選擇器
 * 在錄音完成後顯示，讓使用者選擇錄音的用途類型
 */

import React, { useCallback } from 'react';
import {
  AdaptiveModal,
  AdaptiveButton
} from '@/components/adaptive';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Platform
 } from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AudioPurpose } from '@/components/input/AudioInput';

interface RecordPurposeSelectorProps {
  visible: boolean;
  onSelect: (purpose: AudioPurpose) => void;
  onCancel: () => void;
  audioUri: string;
  duration: number;
}

interface PurposeOption {
  key: AudioPurpose;
  title: string;
  icon: string;
}

const PURPOSES: PurposeOption[] = [
  { key: 'meeting', title: '會議記錄', icon: 'people-outline' },
  { key: 'note', title: '補充記錄', icon: 'document-text-outline' },
  { key: 'task', title: '任務說明', icon: 'checkbox-outline' },
  { key: 'customer', title: '客戶通話', icon: 'call-outline' },
  { key: 'other', title: '其他用途', icon: 'mic-outline' },
];

export const RecordPurposeSelector: React.FC<RecordPurposeSelectorProps> = ({
  visible,
  onSelect,
  onCancel,
  duration }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0] });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5] });

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handlePurposeSelect = useCallback((purpose: AudioPurpose) => {
    onSelect(purpose);
  }, [onSelect]);

  return (
    <AdaptiveModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        {/* 背景遮罩 */}
        <TouchableWithoutFeedback onPress={onCancel}>
          <Animated.View style={StyleSheet.flatten([styles.overlay, { opacity }])} />
        </TouchableWithoutFeedback>

        {/* 底部彈出面板 */}
        <Animated.View
          style={[
            styles.panel,
            {
              transform: Platform.OS === 'web' ? `translateY(${0}px)` : [{ translateY: 0 }],
              paddingBottom: insets.bottom + 20 },
          ]}
        >
          {/* 標題區域 */}
          <View style={styles.header}>
            <View style={styles.indicator} />
            <Text style={styles.title}>選擇錄音類型</Text>
            <Text style={styles.duration}>
              錄音長度：{formatDuration(duration)}
            </Text>
          </View>

          {/* 用途選項 */}
          <View style={styles.optionsContainer}>
            {PURPOSES.map((purpose) => (
              <TouchableOpacity
                key={purpose.key}
                style={styles.purposeOption}
                onPress={() => handlePurposeSelect(purpose.key)}
                activeOpacity={0.7}
              >
                <View style={styles.purposeIcon}>
                  <Icon name={purpose.icon} size={24} color="#1A1A1A" />
                </View>
                <Text style={styles.purposeTitle}>{purpose.title}</Text>
                <Icon name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>

          {/* 取消按鈕 */}
          <View style={styles.buttonContainer}>
            <AdaptiveButton
              title="取消"
              variant="secondary"
              onPress={onCancel}
              style={styles.cancelButton}
            />
          </View>
        </Animated.View>
      </View>
    </AdaptiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000' },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: -2 } }),
    shadowOpacity: 0.1,
    shadowRadius: 8,
    ...(Platform.OS === 'web' ? {} : { elevation: 5 }) },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20 },
  indicator: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 20 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8 },
  duration: {
    fontSize: 14,
    color: '#7A7A7A' },
  optionsContainer: {
    paddingHorizontal: 20 },
  purposeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7' },
  purposeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16 },
  purposeTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A' },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20 },
  cancelButton: {
    width: '100%' } });