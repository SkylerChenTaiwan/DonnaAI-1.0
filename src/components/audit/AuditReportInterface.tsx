import { Icon } from '../../components/common/Icon';
/**
 * 審計報告介面元件
 * 提供報告生成、排程和匯出功能
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ComplianceReport,
  SecurityReport,
  ReportPeriod,
  TimeRange } from '@/types/audit';
import { auditReportGenerator } from '@/services/audit/AuditReportGenerator';
// Icon import removed - using platform-specific Icon component;
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface AuditReportInterfaceProps {
  organizationId: string;
  onReportGenerated?: (report: ComplianceReport | SecurityReport) => void;
}

/**
 * 審計報告介面
 */
export const AuditReportInterface: React.FC<AuditReportInterfaceProps> = ({
  organizationId,
  onReportGenerated }) => {
  // 狀態管理
  const [activeTab, setActiveTab] = useState<'generate' | 'schedule' | 'history'>('generate');
  const [reportType, setReportType] = useState<'compliance' | 'security'>('compliance');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 報告參數
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor((new Date().getMonth() + 3) / 3));
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'year'>('month');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date() });
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  
  // 排程參數
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [scheduleEmails, setScheduleEmails] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  
  // 生成的報告
  const [generatedReport, setGeneratedReport] = useState<ComplianceReport | SecurityReport | null>(null);
  const [reportHistory, setReportHistory] = useState<Array<{
    id: string;
    type: string;
    period: string;
    generatedAt: Date;
    downloadUrl?: string;
  }>>([]);

  /**
   * 生成報告
   */
  const handleGenerateReport = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setGeneratedReport(null);

    try {
      let report: ComplianceReport | SecurityReport;
      
      if (reportType === 'compliance') {
        // 生成合規報告
        const period: ReportPeriod = {
          year: selectedYear };
        
        if (periodType === 'month') {
          period.month = selectedMonth;
        } else if (periodType === 'quarter') {
          period.quarter = selectedQuarter;
        }
        
        report = await auditReportGenerator.generateComplianceReport(organizationId, period);
      } else {
        // 生成安全報告
        const timeRange: TimeRange = {
          start: dateRange.start,
          end: dateRange.end,
          granularity: 'day' };
        
        report = await auditReportGenerator.generateSecurityReport(organizationId, timeRange);
      }
      
      setGeneratedReport(report);
      onReportGenerated?.(report);
      
      // 添加到歷史記錄
      const historyItem = {
        id: `report_${Date.now()}`,
        type: reportType === 'compliance' ? '合規報告' : '安全報告',
        period: reportType === 'compliance' 
          ? formatReportPeriod({ year: selectedYear, month: periodType === 'month' ? selectedMonth : undefined, quarter: periodType === 'quarter' ? selectedQuarter : undefined })
          : `${format(dateRange.start, 'yyyy-MM-dd')} 至 ${format(dateRange.end, 'yyyy-MM-dd')}`,
        generatedAt: new Date() };
      setReportHistory(prev => [historyItem, ...prev].slice(0, 20)); // 保留最近 20 條記錄
      
      Alert.alert('成功', '報告已生成');
    } catch (err) {
      console.error('生成報告失敗:', err);
      setError('生成報告失敗，請稍後再試');
      Alert.alert('錯誤', '生成報告失敗');
    } finally {
      setGenerating(false);
    }
  }, [reportType, organizationId, selectedYear, selectedMonth, selectedQuarter, periodType, dateRange, onReportGenerated]);

  /**
   * 匯出報告
   */
  const handleExportReport = useCallback(async (format: 'pdf' | 'excel') => {
    if (!generatedReport) {
      Alert.alert('提示', '請先生成報告');
      return;
    }

    setExporting(true);
    setError(null);

    try {
      let blob: Blob;
      let fileName: string;
      let mimeType: string;
      
      if (format === 'pdf') {
        blob = await auditReportGenerator.exportToPDF(generatedReport, reportType);
        fileName = `${reportType}_report_${Date.now()}.pdf`;
        mimeType = 'application/pdf';
      } else {
        blob = await auditReportGenerator.exportToExcel(generatedReport, reportType);
        fileName = `${reportType}_report_${Date.now()}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }
      
      if (Platform.OS === 'web') {
        // Web 平台：直接下載
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Alert.alert('成功', '報告已下載');
      } else {
        // 移動平台：保存到檔案系統並分享
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1];
          
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64 });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType,
              dialogTitle: '分享報告' });
          } else {
            Alert.alert('成功', `報告已保存到 ${fileUri}`);
          }
        };
        
        reader.readAsDataURL(blob);
      }
    } catch (err) {
      console.error('匯出報告失敗:', err);
      setError('匯出報告失敗，請稍後再試');
      Alert.alert('錯誤', '匯出報告失敗');
    } finally {
      setExporting(false);
    }
  }, [generatedReport, reportType]);

  /**
   * 設定報告排程
   */
  const handleScheduleReport = useCallback(async () => {
    if (!scheduleEmails) {
      Alert.alert('提示', '請輸入收件人電子郵件');
      return;
    }

    const recipients = scheduleEmails.split(',').map(email => email.trim()).filter(email => email);
    
    if (recipients.length === 0) {
      Alert.alert('提示', '請輸入有效的電子郵件地址');
      return;
    }

    try {
      await auditReportGenerator.scheduleReport(
        organizationId,
        reportType,
        scheduleFrequency,
        recipients
      );
      
      Alert.alert('成功', '報告排程已設定');
      setScheduleEmails('');
    } catch (err) {
      console.error('設定排程失敗:', err);
      Alert.alert('錯誤', '設定排程失敗');
    }
  }, [organizationId, reportType, scheduleFrequency, scheduleEmails]);

  /**
   * 處理日期選擇
   */
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null);
    if (selectedDate) {
      if (showDatePicker === 'start') {
        setDateRange(prev => ({ ...prev, start: selectedDate }));
      } else {
        setDateRange(prev => ({ ...prev, end: selectedDate }));
      }
    }
  };

  /**
   * 渲染生成報告標籤頁
   */
  const renderGenerateTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* 報告類型選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>報告類型</Text>
        <View style={styles.reportTypeSelector}>
          <TouchableOpacity
            style={[styles.reportTypeButton, reportType === 'compliance' && styles.reportTypeButtonActive]}
            onPress={() => setReportType('compliance')}
          >
            <Icon name="shield-checkmark" size={24} color={reportType === 'compliance' ? '#FFFFFF' : '#666666'}  />
            <Text style={[styles.reportTypeText, reportType === 'compliance' && styles.reportTypeTextActive]}>
              合規報告
            </Text>
            <Text style={[styles.reportTypeDescription, reportType === 'compliance' && styles.reportTypeDescriptionActive]}>
              符合法規要求的詳細報告
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.reportTypeButton, reportType === 'security' && styles.reportTypeButtonActive]}
            onPress={() => setReportType('security')}
          >
            <Icon name="lock-closed" size={24} color={reportType === 'security' ? '#FFFFFF' : '#666666'}  />
            <Text style={[styles.reportTypeText, reportType === 'security' && styles.reportTypeTextActive]}>
              安全報告
            </Text>
            <Text style={[styles.reportTypeDescription, reportType === 'security' && styles.reportTypeDescriptionActive]}>
              威脅和異常分析報告
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 時間範圍選擇 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>時間範圍</Text>
        
        {reportType === 'compliance' ? (
          <>
            {/* 合規報告：選擇年/季/月 */}
            <View style={styles.periodTypeSelector}>
              {(['month', 'quarter', 'year'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.periodTypeButton, periodType === type && styles.periodTypeButtonActive]}
                  onPress={() => setPeriodType(type)}
                >
                  <Text style={[styles.periodTypeText, periodType === type && styles.periodTypeTextActive]}>
                    {type === 'month' ? '月報' : type === 'quarter' ? '季報' : '年報'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.periodSelector}>
              {/* 年份選擇 */}
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>年份</Text>
                {Platform.OS === 'web' ? (
                  <select
                    style={styles.webSelect}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[2024, 2023, 2022, 2021, 2020].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                ) : (
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={setSelectedYear}
                    style={styles.picker}
                  >
                    {[2024, 2023, 2022, 2021, 2020].map(year => (
                      <Picker.Item key={year} label={year.toString()} value={year} />
                    ))}
                  </Picker>
                )}
              </View>
              
              {/* 月份選擇（月報） */}
              {periodType === 'month' && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>月份</Text>
                  {Platform.OS === 'web' ? (
                    <select
                      style={styles.webSelect}
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>{month} 月</option>
                      ))}
                    </select>
                  ) : (
                    <Picker
                      selectedValue={selectedMonth}
                      onValueChange={setSelectedMonth}
                      style={styles.picker}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <Picker.Item key={month} label={`${month} 月`} value={month} />
                      ))}
                    </Picker>
                  )}
                </View>
              )}
              
              {/* 季度選擇（季報） */}
              {periodType === 'quarter' && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>季度</Text>
                  {Platform.OS === 'web' ? (
                    <select
                      style={styles.webSelect}
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4].map(quarter => (
                        <option key={quarter} value={quarter}>第 {quarter} 季</option>
                      ))}
                    </select>
                  ) : (
                    <Picker
                      selectedValue={selectedQuarter}
                      onValueChange={setSelectedQuarter}
                      style={styles.picker}
                    >
                      {[1, 2, 3, 4].map(quarter => (
                        <Picker.Item key={quarter} label={`第 ${quarter} 季`} value={quarter} />
                      ))}
                    </Picker>
                  )}
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            {/* 安全報告：選擇日期範圍 */}
            <View style={styles.dateRangeSelector}>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('start')}
              >
                <Icon name="calendar" size={20} color="#666666"  />
                <Text style={styles.dateButtonText}>
                  開始日期: {format(dateRange.start, 'yyyy-MM-dd', { locale: zhTW })}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker('end')}
              >
                <Icon name="calendar" size={20} color="#666666"  />
                <Text style={styles.dateButtonText}>
                  結束日期: {format(dateRange.end, 'yyyy-MM-dd', { locale: zhTW })}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* 生成按鈕 */}
      <TouchableOpacity
        style={[styles.generateButton, generating && styles.generateButtonDisabled]}
        onPress={handleGenerateReport}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Icon name="document-text" size={20} color="#FFFFFF"  />
            <Text style={styles.generateButtonText}>生成報告</Text>
          </>
        )}
      </TouchableOpacity>

      {/* 生成的報告 */}
      {generatedReport && (
        <View style={styles.generatedReportContainer}>
          <View style={styles.generatedReportHeader}>
            <Icon name="checkmark-circle" size={24} color="#4CAF50"  />
            <Text style={styles.generatedReportTitle}>報告已生成</Text>
          </View>
          
          {reportType === 'compliance' && (
            <View style={styles.reportSummary}>
              <Text style={styles.reportSummaryItem}>
                總事件數: {(generatedReport as ComplianceReport).summary.totalEvents}
              </Text>
              <Text style={styles.reportSummaryItem}>
                關鍵事件: {(generatedReport as ComplianceReport).summary.criticalEvents}
              </Text>
              <Text style={styles.reportSummaryItem}>
                失敗認證: {(generatedReport as ComplianceReport).summary.failedAuthentications}
              </Text>
            </View>
          )}
          
          {reportType === 'security' && (
            <View style={styles.reportSummary}>
              <Text style={styles.reportSummaryItem}>
                威脅數量: {(generatedReport as SecurityReport).threats.length}
              </Text>
              <Text style={styles.reportSummaryItem}>
                異常數量: {(generatedReport as SecurityReport).anomalies.length}
              </Text>
              <Text style={styles.reportSummaryItem}>
                風險等級: {(generatedReport as SecurityReport).riskAssessment.overallRisk}
              </Text>
            </View>
          )}
          
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
              onPress={() => handleExportReport('pdf')}
              disabled={exporting}
            >
              <Icon name="document" size={18} color="#FFFFFF"  />
              <Text style={styles.exportButtonText}>匯出 PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButton, styles.exportButtonExcel, exporting && styles.exportButtonDisabled]}
              onPress={() => handleExportReport('excel')}
              disabled={exporting}
            >
              <Icon name="grid" size={18} color="#FFFFFF"  />
              <Text style={styles.exportButtonText}>匯出 Excel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 日期選擇器 */}
      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'start' ? dateRange.start : dateRange.end}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );

  /**
   * 渲染排程標籤頁
   */
  const renderScheduleTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>排程設定</Text>
        
        {/* 報告類型 */}
        <View style={styles.scheduleField}>
          <Text style={styles.scheduleFieldLabel}>報告類型</Text>
          {Platform.OS === 'web' ? (
            <select
              style={styles.webSelect}
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'compliance' | 'security')}
            >
              <option value="compliance">合規報告</option>
              <option value="security">安全報告</option>
            </select>
          ) : (
            <Picker
              selectedValue={reportType}
              onValueChange={setReportType}
              style={styles.picker}
            >
              <Picker.Item label="合規報告" value="compliance" />
              <Picker.Item label="安全報告" value="security" />
            </Picker>
          )}
        </View>
        
        {/* 頻率 */}
        <View style={styles.scheduleField}>
          <Text style={styles.scheduleFieldLabel}>執行頻率</Text>
          {Platform.OS === 'web' ? (
            <select
              style={styles.webSelect}
              value={scheduleFrequency}
              onChange={(e) => setScheduleFrequency(e.target.value as any)}
            >
              <option value="daily">每日</option>
              <option value="weekly">每週</option>
              <option value="monthly">每月</option>
              <option value="quarterly">每季</option>
            </select>
          ) : (
            <Picker
              selectedValue={scheduleFrequency}
              onValueChange={setScheduleFrequency}
              style={styles.picker}
            >
              <Picker.Item label="每日" value="daily" />
              <Picker.Item label="每週" value="weekly" />
              <Picker.Item label="每月" value="monthly" />
              <Picker.Item label="每季" value="quarterly" />
            </Picker>
          )}
        </View>
        
        {/* 收件人 */}
        <View style={styles.scheduleField}>
          <Text style={styles.scheduleFieldLabel}>收件人電子郵件</Text>
          <TextInput
            style={styles.emailInput}
            placeholder="輸入電子郵件，多個請用逗號分隔"
            value={scheduleEmails}
            onChangeText={setScheduleEmails}
            keyboardType="email-address"
            autoCapitalize="none"
            multiline
          />
        </View>
        
        {/* 設定按鈕 */}
        <TouchableOpacity
          style={styles.scheduleButton}
          onPress={handleScheduleReport}
        >
          <Icon name="time" size={20} color="#FFFFFF"  />
          <Text style={styles.scheduleButtonText}>設定排程</Text>
        </TouchableOpacity>
      </View>
      
      {/* 現有排程 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>現有排程</Text>
        <View style={styles.emptyState}>
          <Icon name="calendar-outline" size={48} color="#999999"  />
          <Text style={styles.emptyStateText}>尚無排程設定</Text>
        </View>
      </View>
    </ScrollView>
  );

  /**
   * 渲染歷史標籤頁
   */
  const renderHistoryTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>報告歷史</Text>
        
        {reportHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="document-text-outline" size={48} color="#999999"  />
            <Text style={styles.emptyStateText}>尚無報告歷史</Text>
          </View>
        ) : (
          reportHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyItemIcon}>
                <Icon name="document-text" size={24} color="#0066CC"  />
              </View>
              <View style={styles.historyItemContent}>
                <Text style={styles.historyItemType}>{item.type}</Text>
                <Text style={styles.historyItemPeriod}>{item.period}</Text>
                <Text style={styles.historyItemDate}>
                  {format(item.generatedAt, 'yyyy-MM-dd HH:mm:ss')}
                </Text>
              </View>
              {item.downloadUrl && (
                <TouchableOpacity style={styles.historyItemDownload}>
                  <Icon name="download" size={20} color="#0066CC"  />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* 標籤頁導航 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'generate' && styles.tabActive]}
          onPress={() => setActiveTab('generate')}
        >
          <Icon name="create" size={20} 
            color={activeTab === 'generate' ? '#0066CC' : '#666666'} 
           />
          <Text style={[styles.tabText, activeTab === 'generate' && styles.tabTextActive]}>
            生成報告
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Icon name="time" size={20} 
            color={activeTab === 'schedule' ? '#0066CC' : '#666666'} 
           />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
            排程設定
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Icon name="archive" size={20} 
            color={activeTab === 'history' ? '#0066CC' : '#666666'} 
           />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            歷史記錄
          </Text>
        </TouchableOpacity>
      </View>

      {/* 錯誤提示 */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* 標籤頁內容 */}
      {activeTab === 'generate' && renderGenerateTab()}
      {activeTab === 'schedule' && renderScheduleTab()}
      {activeTab === 'history' && renderHistoryTab()}
    </View>
  );
};

/**
 * 輔助函數
 */
const formatReportPeriod = (period: ReportPeriod): string => {
  if (period.month) {
    return `${period.year}年${period.month}月`;
  }
  if (period.quarter) {
    return `${period.year}年第${period.quarter}季`;
  }
  return `${period.year}年`;
};

/**
 * 樣式定義
 */
const styles: any = {
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0' },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0066CC' },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666' },
  tabTextActive: {
    color: '#0066CC',
    fontWeight: '600' },
  tabContent: {
    flex: 1 },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 2 } }),
        shadowOpacity: 0.1,
        shadowRadius: 4 },
      android: {
        elevation: 2 } }) },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16 },
  reportTypeSelector: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column' },
  reportTypeButton: {
    flex: 1,
    padding: 16,
    margin: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center' },
  reportTypeButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC' },
  reportTypeText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#333333' },
  reportTypeTextActive: {
    color: '#FFFFFF' },
  reportTypeDescription: {
    marginTop: 4,
    fontSize: 12,
    color: '#666666',
    textAlign: 'center' },
  reportTypeDescriptionActive: {
    color: '#E3F2FD' },
  periodTypeSelector: {
    flexDirection: 'row',
    marginBottom: 16 },
  periodTypeButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center' },
  periodTypeButtonActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC' },
  periodTypeText: {
    fontSize: 14,
    color: '#666666' },
  periodTypeTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' },
  periodSelector: {
    flexDirection: 'row' },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 4 },
  pickerLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4 },
  picker: {
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 4 },
  webSelect: {
    height: 44,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14 },
  dateRangeSelector: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column' },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8 },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333333' },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    margin: 8,
    padding: 16,
    borderRadius: 8 },
  generateButtonDisabled: {
    opacity: 0.6 },
  generateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF' },
  generatedReportContainer: {
    backgroundColor: '#FFFFFF',
    margin: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50' },
  generatedReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12 },
  generatedReportTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50' },
  reportSummary: {
    marginBottom: 16 },
  reportSummaryItem: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4 },
  exportButtons: {
    flexDirection: 'row' },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D32F2F',
    margin: 4,
    padding: 12,
    borderRadius: 4 },
  exportButtonExcel: {
    backgroundColor: '#388E3C' },
  exportButtonDisabled: {
    opacity: 0.6 },
  exportButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF' },
  scheduleField: {
    marginBottom: 16 },
  scheduleFieldLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8 },
  emailInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    minHeight: 80 },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066CC',
    padding: 12,
    borderRadius: 4 },
  scheduleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF' },
  emptyState: {
    alignItems: 'center',
    padding: 32 },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8 },
  historyItemIcon: {
    marginRight: 12 },
  historyItemContent: {
    flex: 1 },
  historyItemType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333' },
  historyItemPeriod: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2 },
  historyItemDate: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2 },
  historyItemDownload: {
    padding: 8 },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 4 },
  errorBannerText: {
    color: '#C62828',
    fontSize: 14 } };