/**
 * 錯誤報告元件
 * 提供錯誤報告的格式化和分享功能
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import { errorLogger } from './ErrorLogger';
import { ErrorReport } from '../../types/error';
import { formatLocalDateTime } from '../../utils/dateHelpers';
import { UI_CONSTANTS } from '../../config/constants';

interface ErrorReporterProps {
  errorId?: string;
  error?: Error;
  visible: boolean;
  onClose: () => void;
}

/**
 * 錯誤報告元件
 * 允許使用者查看、複製和分享錯誤報告
 */
export const ErrorReporter = ({
  errorId,
  error,
  visible,
  onClose
}: ErrorReporterProps) => {
  const [reportText, setReportText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  /**
   * 生成錯誤報告
   */
  const generateReport = useCallback(async () => {
    let report = '';
    
    if (errorId) {
      // 從日誌獲取錯誤報告
      report = errorLogger.formatErrorForSharing(errorId);
    } else if (error) {
      // 直接格式化錯誤
      report = formatErrorForReport(error);
    }
    
    setReportText(report);
    return report;
  }, [errorId, error]);
  
  /**
   * 複製錯誤報告
   */
  const handleCopy = async () => {
    try {
      const report = await generateReport();
      await Clipboard.setStringAsync(report);
      
      Alert.alert(
        '複製成功',
        '錯誤報告已複製到剪貼簿',
        [{ text: '確定', style: 'default' }]
      );
    } catch (err) {
      Alert.alert(
        '複製失敗',
        '無法複製錯誤報告',
        [{ text: '確定', style: 'default' }]
      );
    }
  };
  
  /**
   * 分享錯誤報告
   */
  const handleShare = async () => {
    try {
      const report = await generateReport();
      
      const result = await Share.share({
        message: report,
        title: 'Donna AI 錯誤報告'
      });
      
      if (result.action === Share.sharedAction) {
        console.log('錯誤報告已分享');
      }
    } catch (err) {
      Alert.alert(
        '分享失敗',
        '無法分享錯誤報告',
        [{ text: '確定', style: 'default' }]
      );
    }
  };
  
  /**
   * 預覽錯誤報告
   */
  const handlePreview = async () => {
    await generateReport();
    setShowPreview(true);
  };
  
  /**
   * 發送到支援信箱
   */
  const handleEmail = async () => {
    try {
      const report = await generateReport();
      const subject = encodeURIComponent('Donna AI 錯誤報告');
      const body = encodeURIComponent(report);
      const mailtoUrl = `mailto:support@donna-ai.com?subject=${subject}&body=${body}`;
      
      // 使用 Linking 開啟郵件應用
      const { Linking } = await import('react-native');
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          '無法開啟郵件',
          '請手動複製錯誤報告並發送至 support@donna-ai.com',
          [{ text: '複製報告', onPress: handleCopy }, { text: '取消' }]
        );
      }
    } catch (err) {
      console.error('發送郵件失敗:', err);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 標題列 */}
          <View style={styles.header}>
            <Text style={styles.title}>錯誤報告工具</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* 描述 */}
          <Text style={styles.description}>
            選擇以下方式處理錯誤報告：
          </Text>
          
          {/* 操作選項 */}
          <View style={styles.options}>
            <TouchableOpacity 
              style={styles.option}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>📋</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>複製報告</Text>
                <Text style={styles.optionDesc}>
                  複製錯誤詳情到剪貼簿
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.option}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>📤</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>分享報告</Text>
                <Text style={styles.optionDesc}>
                  透過其他應用程式分享
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.option}
              onPress={handleEmail}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>📧</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>發送郵件</Text>
                <Text style={styles.optionDesc}>
                  發送到技術支援信箱
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.option}
              onPress={handlePreview}
              activeOpacity={0.7}
            >
              <Text style={styles.optionIcon}>👁️</Text>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>預覽報告</Text>
                <Text style={styles.optionDesc}>
                  查看完整錯誤報告內容
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* 提示文字 */}
          <Text style={styles.helpText}>
            錯誤報告包含技術細節，有助於快速解決問題
          </Text>
        </View>
      </View>
      
      {/* 預覽模態框 */}
      <Modal
        visible={showPreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>錯誤報告預覽</Text>
              <TouchableOpacity 
                onPress={() => setShowPreview(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.previewScroll}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.previewText}>{reportText}</Text>
            </ScrollView>
            
            <View style={styles.previewActions}>
              <TouchableOpacity 
                style={StyleSheet.flatten([styles.actionButton, styles.copyButton])}
                onPress={() => {
                  handleCopy();
                  setShowPreview(false);
                }}
              >
                <Text style={styles.actionButtonText}>複製</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={StyleSheet.flatten([styles.actionButton, styles.shareButton])}
                onPress={() => {
                  handleShare();
                  setShowPreview(false);
                }}
              >
                <Text style={styles.actionButtonText}>分享</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

/**
 * 格式化錯誤為報告格式
 */
function formatErrorForReport(error: Error): string {
  const now = new Date();
  
  return `
📱 Donna AI 錯誤報告
━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 時間: ${formatLocalDateTime(now)}
💬 錯誤訊息: ${error.message}
📛 錯誤類型: ${error.name}

📱 裝置資訊:
- 平台: ${Platform.OS}
- 版本: ${Platform.Version}

🔍 堆疊追蹤:
${error.stack || '無堆疊資訊'}

━━━━━━━━━━━━━━━━━━━━━━━━━━

此報告由 Donna AI 自動生成
如需協助請聯絡：support@donna-ai.com
`.trim();
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C'
  },
  closeButton: {
    padding: 5
  },
  closeIcon: {
    fontSize: 20,
    color: '#718096'
  },
  description: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 20
  },
  options: {
    marginBottom: 20
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 16
  },
  optionContent: {
    flex: 1
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2
  },
  optionDesc: {
    fontSize: 13,
    color: '#718096'
  },
  helpText: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 10
  },
  
  // 預覽樣式
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20
  },
  previewContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%'
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748'
  },
  previewScroll: {
    padding: 20,
    maxHeight: 400
  },
  previewText: {
    fontSize: 13,
    color: '#4A5568',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20
  },
  previewActions: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5
  },
  copyButton: {
    backgroundColor: '#E2E8F0'
  },
  shareButton: {
    backgroundColor: '#3182CE'
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});