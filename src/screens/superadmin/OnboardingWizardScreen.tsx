/**
 * 組織入職精靈畫面
 * Organization Onboarding Wizard Screen
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import OnboardingWizard from '@/components/superadmin/onboarding/OnboardingWizard';
import { showSuccessToast } from '@/utils/toast';

type NavigationProp = StackNavigationProp<RootStackParamList, 'OnboardingWizardScreen'>;
type RoutePropType = RouteProp<RootStackParamList, 'OnboardingWizardScreen'>;

export const OnboardingWizardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  
  // 從路由參數獲取模式和會話 ID
  const mode = route.params?.mode || 'create';
  const sessionId = route.params?.sessionId;

  // 處理完成
  const handleComplete = (organizationId: string) => {
    showSuccessToast('組織建立成功！');
    
    // 導航到組織詳情頁面
    navigation.navigate('OrganizationDetailScreen', { 
      organizationId 
    });
  };

  // 處理取消
  const handleCancel = () => {
    navigation.goBack();
  };

  // 處理儲存草稿
  const handleSaveDraft = (sessionId: string) => {
    showSuccessToast('草稿已儲存');
    // 可以選擇返回列表或停留在當前頁面
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <OnboardingWizard
        mode={mode}
        sessionId={sessionId}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onSaveDraft={handleSaveDraft}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' ? { 
      height: '100vh',
      width: '100vw',
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    } : {}) } });