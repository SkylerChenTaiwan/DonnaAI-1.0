/**
 * 舊系統資料導入介面
 * 現在使用 UserImportWizard 進行資料匯入
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { useAuthStore } from '@/stores/authStore';
import UserImportWizard from '@/components/users/UserImportWizard';
import { getOrganization } from '@/services/firebase/admin/organizationService';
import { Organization } from '@/types/entities';

export function LegacyDataImportScreen({ navigation, route }: any) {
  const { user } = useAuthStore();
  // 優先使用路由參數中的 organizationId，否則使用當前用戶的
  const organizationId = route?.params?.organizationId || user?.organizationId;
  
  // 新增：組織物件狀態
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  // 獲取組織詳情
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!organizationId) {
        setIsLoadingOrg(false);
        return;
      }
      
      try {
        setIsLoadingOrg(true);
        const org = await getOrganization(organizationId);
        
        if (!org) {
          Alert.alert('錯誤', '找不到組織資訊');
          navigation.goBack();
          return;
        }
        
        setOrganization(org);
      } catch (error) {
        console.error('獲取組織失敗:', error);
        Alert.alert('錯誤', '無法載入組織資訊');
        navigation.goBack();
      } finally {
        setIsLoadingOrg(false);
      }
    };
    
    fetchOrganization();
  }, [organizationId, navigation]);

  // 載入中的顯示
  if (isLoadingOrg) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignSystem.colors.primary} />
        <Text style={styles.loadingText}>載入組織資訊...</Text>
      </View>
    );
  }

  // 無組織資訊的錯誤顯示
  if (!organization) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color={DesignSystem.colors.gray500} />
        <Text style={styles.errorTitle}>無法載入組織資訊</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 使用新的 UserImportWizard
  return (
    <UserImportWizard
      visible={true}
      organization={organization}
      onClose={() => navigation.goBack()}
      onImportComplete={(result) => {
        Alert.alert(
          '匯入完成',
          `成功匯入 ${result.imported} 位用戶`,
          [{ text: '確定', onPress: () => navigation.goBack() }]
        );
      }}
      useIntelligentMapping={true}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.primary
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: DesignSystem.colors.text.secondary
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignSystem.colors.background.primary,
    padding: 24
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: DesignSystem.colors.text.primary,
    marginBottom: 24
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: DesignSystem.colors.primary,
    borderRadius: 8
  },
  retryText: {
    color: DesignSystem.colors.text.inverse,
    fontSize: 16,
    fontWeight: '600'
  }
});

// 匯出元件
export default LegacyDataImportScreen;