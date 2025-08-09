import { MaterialIcon } from '../components/common/MaterialIcon';
/**
 * 智能匯入系統使用範例
 * 展示如何使用新的批量資料匯入與智能映射功能
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ImportWizard } from '@/components/import/ImportWizard';
// MaterialIcon import removed - using platform-specific MaterialIcon component;

/**
 * 範例：智能匯入系統的使用
 */
export const IntelligentImportExample: React.FC = () => {
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // 組織和團隊資訊（實際使用時從認證或路由獲取）
  const organizationId = 'org123';
  const teamId = 'team456';
  
  // OpenAI API 金鑰（實際使用時從環境變數或設定獲取）
  const openAIKey = process.env.REACT_APP_OPENAI_KEY;

  /**
   * 處理匯入完成
   */
  const handleImportComplete = (result: any) => {
    console.log('匯入完成:', result);
    setImportResult(result);
    setShowImportWizard(false);
    
    // 顯示成功訊息
    alert(`成功匯入 ${result.importedCount} 筆資料！`);
  };

  /**
   * 處理取消匯入
   */
  const handleImportCancel = () => {
    setShowImportWizard(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>批量資料匯入示範</Text>
        <Text style={styles.subtitle}>使用智能映射與進階功能</Text>
      </View>

      {/* 功能介紹 */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>🚀 新功能特點</Text>
        
        <View style={styles.featureItem}>
          <MaterialIcon name="auto-awesome" size={20} color="#4CAF50"  />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>AI 智能映射</Text>
            <Text style={styles.featureDesc}>
              使用機器學習自動識別和映射欄位，支援中文別名識別
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcon name="merge-type" size={20} color="#2196F3"  />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>多檔案合併</Text>
            <Text style={styles.featureDesc}>
              自動偵測檔案關聯，支援多種 JOIN 策略
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcon name="speed" size={20} color="#FF9800"  />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>串流處理</Text>
            <Text style={styles.featureDesc}>
              處理大型檔案（大於100MB），支援暫停/恢復
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcon name="check-circle" size={20} color="#9C27B0"  />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>資料驗證</Text>
            <Text style={styles.featureDesc}>
              內建驗證規則，自動檢測和修正資料問題
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <MaterialIcon name="cleaning-services" size={20} color="#00BCD4"  />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>資料清理</Text>
            <Text style={styles.featureDesc}>
              自動標準化電話、日期、地址等格式
            </Text>
          </View>
        </View>
      </View>

      {/* 使用說明 */}
      <View style={styles.usage}>
        <Text style={styles.sectionTitle}>📋 使用方式</Text>
        
        <View style={styles.codeBlock}>
          <Text style={styles.codeTitle}>// 基本使用</Text>
          <Text style={styles.code}>{`<ImportWizard
  organizationId={organizationId}
  useIntelligentMapping={true}
  openAIKey={openAIKey}
  onComplete={handleComplete}
/>`}</Text>
        </View>

        <View style={styles.codeBlock}>
          <Text style={styles.codeTitle}>// 指定初始資料庫</Text>
          <Text style={styles.code}>{`<ImportWizard
  organizationId={organizationId}
  initialTargetDatabase="customers"
  useIntelligentMapping={true}
  onComplete={handleComplete}
/>`}</Text>
        </View>
      </View>

      {/* 支援的檔案格式 */}
      <View style={styles.formats}>
        <Text style={styles.sectionTitle}>📁 支援格式</Text>
        <View style={styles.formatList}>
          <View style={styles.formatItem}>
            <Text style={styles.formatExt}>.csv</Text>
            <Text style={styles.formatDesc}>逗號分隔值</Text>
          </View>
          <View style={styles.formatItem}>
            <Text style={styles.formatExt}>.xlsx</Text>
            <Text style={styles.formatDesc}>Excel 檔案</Text>
          </View>
          <View style={styles.formatItem}>
            <Text style={styles.formatExt}>.json</Text>
            <Text style={styles.formatDesc}>JSON 陣列</Text>
          </View>
          <View style={styles.formatItem}>
            <Text style={styles.formatExt}>.tsv</Text>
            <Text style={styles.formatDesc}>Tab 分隔值</Text>
          </View>
        </View>
      </View>

      {/* 啟動按鈕 */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => setShowImportWizard(true)}
      >
        <MaterialIcon name="upload-file" size={24} color="#fff"  />
        <Text style={styles.startButtonText}>開始智能匯入</Text>
      </TouchableOpacity>

      {/* 匯入結果 */}
      {importResult && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>✅ 匯入結果</Text>
          <Text style={styles.resultText}>
            資料庫: {importResult.targetDatabase}
          </Text>
          <Text style={styles.resultText}>
            成功匯入: {importResult.importedCount} 筆
          </Text>
          <Text style={styles.resultText}>
            錯誤: {importResult.errors?.length || 0} 筆
          </Text>
        </View>
      )}

      {/* 匯入精靈 Modal */}
      {showImportWizard && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <ImportWizard
              organizationId={organizationId}
              teamId={teamId}
              useIntelligentMapping={true}
              openAIKey={openAIKey}
              onComplete={handleImportComplete}
              onCancel={handleImportCancel}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  features: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureContent: {
    marginLeft: 12,
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  usage: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  codeBlock: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  codeTitle: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  code: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    lineHeight: 20,
  },
  formats: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  formatList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formatExt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  formatDesc: {
    fontSize: 12,
    color: '#666',
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  result: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 4,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 800,
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default IntelligentImportExample;