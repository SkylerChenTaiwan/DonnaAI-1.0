import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CustomFieldsModal } from '@/components/organization/CustomFieldsModal';

export const TestModalScreen = () => {
  const [showModal, setShowModal] = useState(false);
  
  // 測試組織資料
  const testOrg = {
    id: 'test-org-123',
    name: '測試組織',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'active' as const,
    subscriptionPlan: 'professional' as const,
    billingCycle: 'monthly' as const,
    giftedSeats: 0,
    features: {
      allowDataImport: true,
      allowDataExport: true,
      allowCustomFields: true,
      allowAPIAccess: false
    }
  };
  
  useEffect(() => {
    console.log('🧪 TestModalScreen - showModal:', showModal);
  }, [showModal]);
  
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Modal 測試頁面
      </Text>
      
      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Modal 狀態: {showModal ? '✅ 顯示中' : '❌ 隱藏'}
      </Text>
      
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20
        }}
        onPress={() => {
          console.log('🔘 按鈕被點擊，設置 showModal = true');
          setShowModal(true);
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>
          打開 Modal
        </Text>
      </TouchableOpacity>
      
      <View style={{ padding: 10, backgroundColor: '#fff', borderRadius: 8 }}>
        <Text style={{ fontSize: 14 }}>調試資訊：</Text>
        <Text>- showModal: {String(showModal)}</Text>
        <Text>- typeof showModal: {typeof showModal}</Text>
        <Text>- 組織 ID: {testOrg.id}</Text>
      </View>
      
      {/* 只在 showModal 為 true 時渲染 Modal */}
      {showModal && (
        <CustomFieldsModal
          visible={showModal}
          organization={testOrg}
          onClose={() => {
            console.log('❌ Modal 關閉');
            setShowModal(false);
          }}
          onFieldsUpdated={() => {
            console.log('✅ 欄位更新');
            setShowModal(false);
          }}
        />
      )}
    </View>
  );
};

export default TestModalScreen;