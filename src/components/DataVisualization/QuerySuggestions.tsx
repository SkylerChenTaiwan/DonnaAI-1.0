/**
 * 查詢建議元件
 * 顯示快速查詢範本和歷史記錄
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
  Platform
} from 'react-native';
import { QUERY_TEMPLATES, QueryTemplate } from '../../types/data-visualization';
import { useQuerySuggestions } from '../../stores/queryStore';
import { colors } from '../../theme/colors';

interface QuerySuggestionsProps {
  onSelectSuggestion: (query: string) => void;
}

export const QuerySuggestions: React.FC<QuerySuggestionsProps> = ({
  onSelectSuggestion
}) => {
  const historySuggestions = useQuerySuggestions();

  // 按類別分組範本
  const groupedTemplates = QUERY_TEMPLATES.reduce((groups, template) => {
    if (!groups[template.category]) {
      groups[template.category] = [];
    }
    groups[template.category].push(template);
    return groups;
  }, {} as Record<string, QueryTemplate[]>);

  // 類別標籤
  const categoryLabels: Record<string, string> = {
    sales: '銷售分析',
    tasks: '任務管理',
    meetings: '會議紀錄',
    performance: '績效分析',
    'ai-usage': 'AI 使用'
  };

  // 類別圖示
  const categoryIcons: Record<string, string> = {
    sales: '📊',
    tasks: '✅',
    meetings: '📅',
    performance: '🎯',
    'ai-usage': '🤖'
  };

  const renderTemplateCard = (template: QueryTemplate) => (
    <TouchableOpacity
      key={template.id}
      style={styles.templateCard}
      onPress={() => onSelectSuggestion(template.query)}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateIcon}>
          {template.icon || categoryIcons[template.category]}
        </Text>
        <Text style={styles.templateTitle}>{template.title}</Text>
      </View>
      <Text style={styles.templateDescription}>{template.description}</Text>
      <Text style={styles.templateQuery}>"{template.query}"</Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = (query: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.historyItem}
      onPress={() => onSelectSuggestion(query)}
    >
      <Text style={styles.historyIcon}>🕒</Text>
      <Text style={styles.historyText} numberOfLines={2}>
        {query}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 標題 */}
      <View style={styles.header}>
        <Text style={styles.title}>智能資料分析</Text>
        <Text style={styles.subtitle}>
          用自然語言查詢您的資料，AI 將自動生成圖表
        </Text>
      </View>

      {/* 歷史查詢 */}
      {historySuggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近查詢</Text>
          <View style={styles.historyContainer}>
            {historySuggestions.map(renderHistoryItem)}
          </View>
        </View>
      )}

      {/* 快速範本 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>查詢範本</Text>
        
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {categoryIcons[category]} {categoryLabels[category]}
            </Text>
            <View style={styles.templatesGrid}>
              {templates.map(renderTemplateCard)}
            </View>
          </View>
        ))}
      </View>

      {/* 幫助提示 */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>💡 查詢提示</Text>
        <View style={styles.helpTips}>
          <Text style={styles.helpTip}>
            • 使用自然語言描述，如「顯示本月的客戶拜訪數量」
          </Text>
          <Text style={styles.helpTip}>
            • 可以指定時間範圍，如「最近30天」、「本季度」
          </Text>
          <Text style={styles.helpTip}>
            • 可以比較不同組別，如「各團隊的任務完成率」
          </Text>
          <Text style={styles.helpTip}>
            • 支援趨勢分析，如「會議時長變化趨勢」
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  },
  section: {
    marginTop: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 20
  },
  categorySection: {
    marginBottom: 25
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 10,
    paddingHorizontal: 20
  },
  templatesGrid: {
    paddingHorizontal: 20,
    gap: 10
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    ...(Platform.OS === 'web' ? {} : { shadowOffset: { width: 0, height: 1 } }),
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  templateIcon: {
    fontSize: 20,
    marginRight: 8
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18
  },
  templateQuery: {
    fontSize: 13,
    color: colors.primary,
    fontStyle: 'italic',
    backgroundColor: '#f0f8ff',
    padding: 8,
    borderRadius: 6
  },
  historyContainer: {
    paddingHorizontal: 20
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 10
  },
  historyText: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  helpSection: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10
  },
  helpTips: {
    gap: 5
  },
  helpTip: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18
  }
});