import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Animated,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QueryChat from './QueryChat';
import QuickSaveButton from './QuickSaveButton';
import { ChartDisplay } from '../charts/ChartDisplay';
import { useQueryStore, useCurrentChart } from '../../stores/queryStore';
import { saveReport } from '../../services/firebase/managerActions';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../utils/toast';
import { colors } from '../../theme/colors';
import { DesignSystem } from '../../theme/designSystem';

interface AnalyticsDialogProps {
  visible: boolean;
  onClose: () => void;
}

const DIALOG_HEIGHT = Dimensions.get('window').height * 0.75;
const SWIPE_THRESHOLD = 100;

export default function AnalyticsDialog({ visible, onClose }: AnalyticsDialogProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const insets = useSafeAreaInsets();
  
  const { currentSession } = useQueryStore();
  const { user } = useAuthStore();
  const chartData = useCurrentChart();
  
  const hasResult = currentSession?.status === 'completed' && chartData;

  // 手勢處理 - 下滑關閉
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0 && gestureState.moveY < 100;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(1 - gestureState.dy / DIALOG_HEIGHT);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SWIPE_THRESHOLD) {
          handleClose();
        } else {
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11 }).start();
        }
      } })
  ).current;

  // 動畫效果
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11 }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible, slideAnim, fadeAnim]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = async (name: string, isPublic: boolean = false) => {
    if (!hasResult || !chartData || !user || !currentSession) return;

    try {
      const reportData = {
        name,
        query: currentSession.originalQuery || '',
        chartType: chartData.type,
        chartData: chartData,
        isPublic,
        createdBy: user.id,
        createdByName: user.name,
        teamId: user.teamIds?.[0] || '',
        organizationId: user.organizationId || '',
        tags: ['智能分析'] };

      await saveReport(reportData, user.id, user.name);
      toast.success('報表已保存到主頁');
      handleClose();
    } catch (error) {
      console.error('保存報表失敗:', error);
      toast.error('保存失敗，請稍後再試');
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DIALOG_HEIGHT, 0] });

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View
            style={[
              styles.overlay,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3] }) },
            ]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.dialog,
            {
              height: DIALOG_HEIGHT,
              paddingBottom: insets.bottom,
              transform: Platform.OS === 'web' ? `translateY(${0}px)` : [{ translateY: 0 }] },
          ]}
        >
          {/* 拖曳手柄 */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* 對話內容 */}
          <View style={styles.content}>
            <QueryChat />
            
            {hasResult && chartData && (
              <>
                <View style={styles.chartContainer}>
                  <ChartDisplay
                    chartData={chartData}
                    isLoading={false}
                    error={null}
                  />
                </View>
                <QuickSaveButton onSave={handleSave} />
              </>
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.text, // 使用深灰黑色
  },
  dialog: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: DesignSystem.borderRadius.lg,
    borderTopRightRadius: DesignSystem.borderRadius.lg,
    ...DesignSystem.shadows.lg },
  handleContainer: {
    alignItems: 'center',
    paddingTop: DesignSystem.spacing.sm,
    paddingBottom: DesignSystem.spacing.sm },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2 },
  content: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.lg },
  chartContainer: {
    marginTop: DesignSystem.spacing.md,
    marginBottom: 80, // 為保存按鈕留空間
  } });