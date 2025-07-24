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
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QueryChat from './QueryChat';
import QuickSaveButton from './QuickSaveButton';
import { ChartDisplay } from '../charts/ChartDisplay';
import { useQueryStore, useCurrentChart } from '../../stores/queryStore';
import { saveReport } from '../../services/firebase/managerActions';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../utils/toast';

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
            friction: 11,
          }).start();
        }
      },
    })
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
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
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
        createdBy: user.id,
        createdByName: user.displayName,
        isPublic,
        teamId: user.teamIds?.[0] || '',
        organizationId: user.organizationId || '',
        tags: ['智能分析'],
      };

      await saveReport(reportData, user.id, user.displayName);
      toast.success('報表已保存到主頁');
      handleClose();
    } catch (error) {
      console.error('保存報表失敗:', error);
      toast.error('保存失敗，請稍後再試');
    }
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [DIALOG_HEIGHT, 0],
  });

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
                  outputRange: [0, 0.3],
                }),
              },
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
              transform: [{ translateY }],
            },
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
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  dialog: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chartContainer: {
    marginTop: 16,
    marginBottom: 80, // 為保存按鈕留空間
  },
});