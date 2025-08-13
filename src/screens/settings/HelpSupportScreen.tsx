/**
 * 說明與支援頁面
 */

import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform
} from 'react-native';
// Icon import removed - using platform-specific Icon component;
import { Icon } from '@/components/common/Icon';
import { Layout } from '@/components/common/Layout';
import Constants from 'expo-constants';

interface HelpItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

export const HelpSupportScreen: React.FC = () => {
  // 常見問題
  const faqItems: FAQItem[] = [
    {
      question: '如何開始錄音？',
      answer: '在主畫面點擊「開始錄音」按鈕，選擇會議類型和客戶後即可開始錄音。錄音會自動儲存並使用 AI 分析內容。' },
    {
      question: '如何查看 AI 分析結果？',
      answer: '錄音完成後，系統會自動進行 AI 分析。您可以在「錄音記錄」頁面查看分析結果，包括會議摘要、行動項目和重點內容。' },
    {
      question: '如何管理客戶資料？',
      answer: '在「客戶」頁面可以新增、編輯和查看客戶資料。點擊客戶可以查看詳細資訊，包括相關的會議記錄和任務。' },
    {
      question: '如何設定任務提醒？',
      answer: '在新增或編輯任務時，可以設定到期日和提醒時間。確保已開啟推播通知權限，系統會在指定時間發送提醒。' },
    {
      question: '資料會儲存在哪裡？',
      answer: '所有資料都安全地儲存在雲端，並與您的組織帳號關聯。您可以隨時匯出資料備份。' },
  ];

  // 幫助項目
  const helpItems: HelpItem[] = [
    {
      id: 'guide',
      title: '使用指南',
      description: '查看完整的使用教學',
      icon: 'book-outline',
      action: () => {
        Alert.alert(
          '使用指南',
          '完整使用指南正在準備中，敬請期待！',
          [{ text: '確定' }]
        );
      } },
    {
      id: 'video',
      title: '影片教學',
      description: '觀看操作示範影片',
      icon: 'play-circle-outline',
      action: () => {
        Alert.alert(
          '影片教學',
          '教學影片正在製作中，敬請期待！',
          [{ text: '確定' }]
        );
      } },
    {
      id: 'contact',
      title: '聯絡支援',
      description: '透過 Email 聯絡客服團隊',
      icon: 'mail-outline',
      action: () => {
        const email = 'support@donnaai.com';
        const subject = 'DonnaAI 支援請求';
        const body = `\n\n\n---\n應用程式版本：${Constants.expoConfig?.version || '1.0.0'}\n裝置：${Constants.platform?.ios ? 'iOS' : 'Android'}`;
        
        Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
          .catch(() => {
            Alert.alert(
              '無法開啟郵件',
              `請直接寄信至：${email}`,
              [{ text: '確定' }]
            );
          });
      } },
    {
      id: 'feedback',
      title: '意見回饋',
      description: '告訴我們您的想法',
      icon: 'chatbubble-outline',
      action: () => {
        Alert.alert(
          '意見回饋',
          '感謝您的寶貴意見！請透過 Email 告訴我們您的想法。',
          [
            { text: '取消', style: 'cancel' },
            { 
              text: '寄送郵件', 
              onPress: () => {
                const email = 'feedback@donnaai.com';
                const subject = 'DonnaAI 意見回饋';
                Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}`)
                  .catch(console.error);
              }
            },
          ]
        );
      } },
    {
      id: 'report',
      title: '回報問題',
      description: '回報錯誤或技術問題',
      icon: 'bug-outline',
      action: () => {
        const email = 'bugs@donnaai.com';
        const subject = 'DonnaAI 問題回報';
        const body = `問題描述：\n\n重現步驟：\n1. \n2. \n3. \n\n預期結果：\n\n實際結果：\n\n---\n應用程式版本：${Constants.expoConfig?.version || '1.0.0'}\n裝置：${Constants.platform?.ios ? 'iOS' : 'Android'}`;
        
        Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
          .catch(() => {
            Alert.alert(
              '無法開啟郵件',
              `請直接寄信至：${email}`,
              [{ text: '確定' }]
            );
          });
      } },
  ];

  return (
    <Layout style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 幫助選項 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>需要幫助嗎？</Text>
          {helpItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.helpItem}
              onPress={item.action}
            >
              <View style={styles.helpIconContainer}>
                <Icon name={item.icon} size={24} color="#007AFF" />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>{item.title}</Text>
                <Text style={styles.helpDescription}>{item.description}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 常見問題 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>常見問題</Text>
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Q: {item.question}</Text>
              <Text style={styles.faqAnswer}>A: {item.answer}</Text>
            </View>
          ))}
        </View>

        {/* 其他資源 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他資源</Text>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => {
              Linking.openURL('https://donnaai.com/terms')
                .catch(() => {
                  Alert.alert('無法開啟連結', '請稍後再試', [{ text: '確定' }]);
                });
            }}
          >
            <Text style={styles.resourceText}>服務條款</Text>
            <Icon name="open-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.resourceItem}
            onPress={() => {
              Linking.openURL('https://donnaai.com/privacy')
                .catch(() => {
                  Alert.alert('無法開啟連結', '請稍後再試', [{ text: '確定' }]);
                });
            }}
          >
            <Text style={styles.resourceText}>隱私權政策</Text>
            <Icon name="open-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* 聯絡資訊 */}
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>聯絡我們</Text>
          <Text style={styles.contactText}>Email: support@donnaai.com</Text>
          <Text style={styles.contactText}>服務時間：週一至週五 9:00-18:00</Text>
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5' },
  section: {
    marginTop: 24,
    paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16 },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }),
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2 },
  helpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 },
  helpContent: {
    flex: 1 },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4 },
  helpDescription: {
    fontSize: 14,
    color: '#8E8E93' },
  faqItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }),
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2 },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8 },
  faqAnswer: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20 },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }),
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2 },
  resourceText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500' },
  contactInfo: {
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA' },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12 },
  contactText: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4 },
  footer: {
    height: 40 } });