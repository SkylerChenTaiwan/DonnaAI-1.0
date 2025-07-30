/**
 * 匯出選項元件
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '@/components/common/Icon';
import { ExportFormat, getExportSizeEstimate } from '@/utils/tableExport';
import { TableData, TableColumn } from '@/types/table';

interface ExportOptionsProps {
  data: TableData[];
  columns: TableColumn[];
  onExport: (options: {
    format: ExportFormat;
    includeHeaders: boolean;
    filename?: string;
    email?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  data,
  columns,
  onExport,
  onCancel,
  loading = false,
}) => {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [filename, setFilename] = useState('');
  const [email, setEmail] = useState('');
  const [sendByEmail, setSendByEmail] = useState(false);

  const handleExport = () => {
    onExport({
      format,
      includeHeaders,
      filename: filename.trim() || undefined,
      email: sendByEmail && email.trim() ? email.trim() : undefined,
    });
  };

  // 計算檔案大小預估
  const sizeEstimate = getExportSizeEstimate(data, columns, format);

  return (
    <View style={styles.container}>
      {/* 標頭 */}
      <View style={styles.header}>
        <Text style={styles.title}>匯出選項</Text>
        <Text style={styles.subtitle}>
          匯出 {data.length} 筆資料，預估大小：{sizeEstimate}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>準備匯出...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/* 格式選擇 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>匯出格式</Text>
            <View style={styles.formatOptions}>
              <TouchableOpacity
                style={[
                  styles.formatOption,
                  format === 'csv' && styles.formatOptionActive,
                ]}
                onPress={() => setFormat('csv')}
                activeOpacity={0.7}
              >
                <Icon
                  name="document-text-outline"
                  size={24}
                  color={format === 'csv' ? '#1A1A1A' : '#999999'}
                />
                <Text
                  style={[
                    styles.formatOptionText,
                    format === 'csv' && styles.formatOptionTextActive,
                  ]}
                >
                  CSV
                </Text>
                <Text style={styles.formatDescription}>
                  適合 Excel 開啟
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formatOption,
                  format === 'json' && styles.formatOptionActive,
                ]}
                onPress={() => setFormat('json')}
                activeOpacity={0.7}
              >
                <Icon
                  name="code-outline"
                  size={24}
                  color={format === 'json' ? '#1A1A1A' : '#999999'}
                />
                <Text
                  style={[
                    styles.formatOptionText,
                    format === 'json' && styles.formatOptionTextActive,
                  ]}
                >
                  JSON
                </Text>
                <Text style={styles.formatDescription}>
                  適合程式處理
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CSV 選項 */}
          {format === 'csv' && (
            <View style={styles.section}>
              <View style={styles.optionRow}>
                <Text style={styles.optionLabel}>包含標題列</Text>
                <Switch
                  value={includeHeaders}
                  onValueChange={setIncludeHeaders}
                  trackColor={{ false: '#E3E1DC', true: '#1A1A1A' }}
                />
              </View>
            </View>
          )}

          {/* 檔名設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>檔案名稱（選填）</Text>
            <TextInput
              style={styles.input}
              value={filename}
              onChangeText={setFilename}
              placeholder="輸入檔案名稱"
              placeholderTextColor="#7A7A7A"
            />
          </View>

          {/* 發送方式 */}
          <View style={styles.section}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>透過郵件發送</Text>
              <Switch
                value={sendByEmail}
                onValueChange={setSendByEmail}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
              />
            </View>
            {sendByEmail && (
              <TextInput
                style={[styles.input, styles.emailInput]}
                value={email}
                onChangeText={setEmail}
                placeholder="輸入郵件地址"
                placeholderTextColor="#7A7A7A"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          </View>

          {/* 包含欄位預覽 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>包含欄位</Text>
            <View style={styles.columnsPreview}>
              {columns.map((col) => (
                <View key={col.key} style={styles.columnChip}>
                  <Text style={styles.columnChipText}>{col.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 底部按鈕 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.exportButton]}
          onPress={handleExport}
          activeOpacity={0.7}
          disabled={loading}
        >
          <Icon name="download-outline" size={20} color="#F7F6F3" />
          <Text style={styles.exportButtonText}>匯出</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A7A7A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7A7A7A',
    marginTop: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7A7A7A',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E3E1DC',
  },
  formatOptionActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#FFF5F0',
  },
  formatOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7A7A7A',
    marginTop: 8,
    marginBottom: 4,
  },
  formatOptionTextActive: {
    color: '#1A1A1A',
  },
  formatDescription: {
    fontSize: 12,
    color: '#7A7A7A',
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  emailInput: {
    marginTop: 12,
  },
  columnsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  columnChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  columnChipText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E3E1DC',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  exportButton: {
    backgroundColor: '#1A1A1A',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F7F6F3',
  },
});