/**
 * 小工具頁面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Layout } from '@/components/common/Layout';
import { SearchBar } from '@/components/common/SearchBar';
import { ToolCard } from '@/components/common/ToolCard';
import { Ionicons } from '@expo/vector-icons';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
}

export const ToolsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 小工具資料（placeholder）
  const tools: Tool[] = [
    {
      id: '1',
      title: '語音記錄',
      description: '快速錄音並轉換為文字記錄',
      icon: 'mic-outline',
      color: '#FF3B30',
      category: '記錄工具',
    },
    {
      id: '2',
      title: '拜訪計畫',
      description: '規劃每日拜訪路線和行程',
      icon: 'map-outline',
      color: '#007AFF',
      category: '行程管理',
    },
    {
      id: '3',
      title: '銷售計算器',
      description: '計算佣金、折扣和報價',
      icon: 'calculator-outline',
      color: '#34C759',
      category: '銷售工具',
    },
    {
      id: '4',
      title: '名片掃描',
      description: '掃描名片自動建立客戶資料',
      icon: 'camera-outline',
      color: '#FF9500',
      category: '客戶管理',
    },
    {
      id: '5',
      title: '報表產生器',
      description: '自動產生月報和週報',
      icon: 'bar-chart-outline',
      color: '#5856D6',
      category: '報表分析',
    },
    {
      id: '6',
      title: '合約範本',
      description: '常用合約和文件範本',
      icon: 'document-text-outline',
      color: '#AF52DE',
      category: '文件管理',
    },
    {
      id: '7',
      title: 'AI 助手',
      description: '智能銷售建議和話術',
      icon: 'bulb-outline',
      color: '#32ADE6',
      category: 'AI 工具',
    },
    {
      id: '8',
      title: '競品分析',
      description: '競爭對手產品比較表',
      icon: 'analytics-outline',
      color: '#FFCC00',
      category: '市場分析',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // 模擬重新整理
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // 篩選工具
  const filteredTools = tools.filter((tool) =>
    searchQuery
      ? tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  // 按類別分組
  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const handleToolPress = (tool: Tool) => {
    console.log('Tool pressed:', tool.title);
    // 實作工具功能
  };

  return (
    <Layout style={styles.container}>
      {/* 搜尋欄 */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="搜尋工具..."
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {Object.entries(groupedTools).map(([category, categoryTools]) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.toolsGrid}>
              {categoryTools.map((tool) => (
                <View key={tool.id} style={styles.toolCardWrapper}>
                  <ToolCard
                    {...tool}
                    onPress={() => handleToolPress(tool)}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {filteredTools.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>沒有找到相關工具</Text>
          </View>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categorySection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  toolCardWrapper: {
    width: '50%',
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
});