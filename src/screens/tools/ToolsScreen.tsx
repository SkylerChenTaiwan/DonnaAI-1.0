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
import { Icon } from '@/components/common/Icon';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types/navigation';
import { getWebAppHTML } from '@/webapps/webAppLoader';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
  webApp?: {
    type: 'local' | 'remote';
    source: string;
  };
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ToolsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();

  // 實際可用的工具
  const tools: Tool[] = [
    {
      id: '1',
      title: '銷售計算器',
      description: '計算佣金、折扣和報價',
      icon: 'calculator-outline',
      color: '#34C759',
      category: '銷售工具',
      webApp: {
        type: 'local',
        source: 'calculator',
      },
    },
    {
      id: '2',
      title: 'AI 業務訓練',
      description: '與 AI 客戶進行角色扮演銷售訓練',
      icon: 'people-outline',
      color: '#FF3B30',
      category: 'AI 工具',
      webApp: {
        type: 'local',
        source: 'ai-roleplay',
      },
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
    
    // 如果工具有 WebApp，導航到 WebApp 容器
    if (tool.webApp) {
      if (tool.webApp.type === 'local') {
        const html = getWebAppHTML(tool.webApp.source);
        if (html) {
          navigation.navigate('WebApp', {
            toolId: tool.id,
            title: tool.title,
            source: { html }
          });
        } else {
          console.error('找不到 WebApp:', tool.webApp.source);
        }
      } else {
        navigation.navigate('WebApp', {
          toolId: tool.id,
          title: tool.title,
          source: { uri: tool.webApp.source }
        });
      }
    } else {
      // 其他工具的處理邏輯
      console.log('此工具尚未實作');
    }
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
            <Icon name="search-outline" size={48} color="#C7C7CC" />
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
    backgroundColor: '#F5F5F5',
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