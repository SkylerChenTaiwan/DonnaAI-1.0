/**
 * 隱私權政策頁面
 */

import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { Icon } from '@/components/common/Icon';

export const PrivacyPolicyScreen: React.FC = () => {
  const lastUpdated = '2024年12月1日';

  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(console.error);
  };

  return (
    <Layout style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.updateInfo}>最後更新日期：{lastUpdated}</Text>

          {/* 簡介 */}
          <View style={styles.section}>
            <Text style={styles.title}>隱私權政策</Text>
            <Text style={styles.paragraph}>
              DonnaAI（以下簡稱「我們」）非常重視您的隱私權。本隱私權政策說明我們如何收集、使用、揭露、處理及保護您在使用我們的應用程式時所提供的資訊。
            </Text>
          </View>

          {/* 資訊收集 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. 我們收集的資訊</Text>
            
            <Text style={styles.subtitle}>1.1 您提供的資訊</Text>
            <Text style={styles.paragraph}>
              • 帳戶資訊：姓名、電子郵件地址、公司名稱{'\n'}
              • 客戶資料：客戶姓名、聯絡方式、公司資訊{'\n'}
              • 會議記錄：錄音檔案、轉錄文字、會議筆記{'\n'}
              • 任務資訊：任務內容、排程、提醒設定
            </Text>

            <Text style={styles.subtitle}>1.2 自動收集的資訊</Text>
            <Text style={styles.paragraph}>
              • 裝置資訊：裝置型號、作業系統版本、唯一裝置識別碼{'\n'}
              • 使用資訊：應用程式使用情況、功能使用統計{'\n'}
              • 錯誤報告：當機報告、效能資料
            </Text>
          </View>

          {/* 資訊使用 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. 我們如何使用您的資訊</Text>
            <Text style={styles.paragraph}>
              我們使用收集的資訊用於以下目的：{'\n\n'}
              • 提供、維護和改善我們的服務{'\n'}
              • 處理您的會議錄音和 AI 分析{'\n'}
              • 發送任務提醒和通知{'\n'}
              • 回應您的詢問和支援請求{'\n'}
              • 分析使用趨勢以改善使用者體驗{'\n'}
              • 遵守法律義務
            </Text>
          </View>

          {/* 資訊分享 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. 資訊分享與揭露</Text>
            <Text style={styles.paragraph}>
              我們不會出售、出租或分享您的個人資訊給第三方，除非：{'\n\n'}
              • 獲得您的同意{'\n'}
              • 與受信任的服務提供商合作（如雲端儲存、AI 分析服務）{'\n'}
              • 遵守法律要求或回應法律程序{'\n'}
              • 保護我們的權利、財產或安全
            </Text>
          </View>

          {/* 資料安全 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. 資料安全</Text>
            <Text style={styles.paragraph}>
              我們採用業界標準的安全措施來保護您的資訊：{'\n\n'}
              • 使用加密技術傳輸和儲存敏感資料{'\n'}
              • 定期安全審查和更新{'\n'}
              • 限制員工存取個人資訊{'\n'}
              • 使用安全的雲端基礎設施
            </Text>
          </View>

          {/* 資料保存 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. 資料保存期限</Text>
            <Text style={styles.paragraph}>
              我們會在提供服務所需的期間內保存您的資訊。當您刪除帳戶時，我們會刪除或匿名化您的個人資訊，除非法律要求我們保留特定資料。
            </Text>
          </View>

          {/* 您的權利 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. 您的權利</Text>
            <Text style={styles.paragraph}>
              您對您的個人資訊享有以下權利：{'\n\n'}
              • 存取權：要求查看我們持有的您的資訊{'\n'}
              • 更正權：要求更正不準確的資訊{'\n'}
              • 刪除權：要求刪除您的個人資訊{'\n'}
              • 資料可攜權：要求以結構化格式匯出您的資料{'\n'}
              • 拒絕權：拒絕特定的資料處理活動
            </Text>
          </View>

          {/* 兒童隱私 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. 兒童隱私</Text>
            <Text style={styles.paragraph}>
              我們的服務不針對 13 歲以下的兒童。我們不會故意收集 13 歲以下兒童的個人資訊。
            </Text>
          </View>

          {/* 變更通知 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. 隱私權政策變更</Text>
            <Text style={styles.paragraph}>
              我們可能會不定期更新本隱私權政策。重大變更時，我們會透過應用程式通知或電子郵件告知您。
            </Text>
          </View>

          {/* 聯絡資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. 聯絡我們</Text>
            <Text style={styles.paragraph}>
              如果您對本隱私權政策有任何疑問，請聯絡我們：
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => openExternalLink('mailto:privacy@donnaai.com')}
            >
              <Icon name="mail-outline" size={20} color="#007AFF" />
              <Text style={styles.contactText}>privacy@donnaai.com</Text>
            </TouchableOpacity>
          </View>

          {/* 法律資訊 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10. 適用法律</Text>
            <Text style={styles.paragraph}>
              本隱私權政策受中華民國法律管轄。任何因本政策產生的爭議，應由台灣台北地方法院管轄。
            </Text>
          </View>

          <View style={styles.footer} />
        </View>
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  updateInfo: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3C3C43',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 22,
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  footer: {
    height: 40,
  },
});