/**
 * 狀態檢查工具元件
 * 用於查看和除錯應用程式狀態
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Alert
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useAuthStore } from '@/stores/authStore';
import { useTaskStore } from '@/stores/taskStore';
import { useRecordStore } from '@/stores/recordStore';
import { DEV_TOOLS_CONSTANTS } from '@/config/constants';

interface StoreData {
  name: string;
  icon: string;
  data: any;
  getState: () => any;
}

/**
 * 狀態檢查工具
 * 顯示所有 Zustand store 的當前狀態
 */
export const StateInspector: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // 取得所有 store 的狀態
  const stores: StoreData[] = [
    {
      name: 'Auth Store',
      icon: '🔐',
      data: useAuthStore(),
      getState: useAuthStore.getState
    },
    {
      name: 'Task Store',
      icon: '✅',
      data: useTaskStore(),
      getState: useTaskStore.getState
    },
    {
      name: 'Records Store',
      icon: '📋',
      data: useRecordStore(),
      getState: useRecordStore.getState
    }
  ];
  
  /**
   * 自動重新整理
   */
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, DEV_TOOLS_CONSTANTS.STATE_UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  /**
   * 切換 store 展開狀態
   */
  const toggleStore = (storeName: string) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(storeName)) {
      newExpanded.delete(storeName);
    } else {
      newExpanded.add(storeName);
    }
    setExpandedStores(newExpanded);
  };
  
  /**
   * 過濾狀態資料
   */
  const filterData = (data: any, query: string): any => {
    if (!query) return data;
    
    const lowerQuery = query.toLowerCase();
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.filter(item => 
          JSON.stringify(item).toLowerCase().includes(lowerQuery)
        );
      } else {
        const filtered: any = {};
        for (const [key, value] of Object.entries(data)) {
          if (key.toLowerCase().includes(lowerQuery) ||
              JSON.stringify(value).toLowerCase().includes(lowerQuery)) {
            filtered[key] = value;
          }
        }
        return filtered;
      }
    }
    
    return data;
  };
  
  /**
   * 渲染狀態值
   */
  const renderValue = (value: any, path: string = '', depth: number = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);
    
    if (value === null) {
      return <Text style={styles.nullValue}>{indent}null</Text>;
    }
    
    if (value === undefined) {
      return <Text style={styles.undefinedValue}>{indent}undefined</Text>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Text style={[styles.booleanValue, value && styles.trueValue]}>
          {indent}{value.toString()}
        </Text>
      );
    }
    
    if (typeof value === 'string') {
      return <Text style={styles.stringValue}>{indent}"{value}"</Text>;
    }
    
    if (typeof value === 'number') {
      return <Text style={styles.numberValue}>{indent}{value}</Text>;
    }
    
    if (typeof value === 'function') {
      return <Text style={styles.functionValue}>{indent}[Function]</Text>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <Text style={styles.arrayValue}>{indent}[]</Text>;
      }
      
      return (
        <View>
          <Text style={styles.arrayValue}>{indent}[</Text>
          {value.map((item, index) => (
            <View key={index}>
              {renderValue(item, `${path}[${index}]`, depth + 1)}
              {index < value.length - 1 && <Text>,</Text>}
            </View>
          ))}
          <Text style={styles.arrayValue}>{indent}]</Text>
        </View>
      );
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <Text style={styles.objectValue}>{indent}{'{}'}</Text>;
      }
      
      return (
        <View>
          <Text style={styles.objectValue}>{indent}{'{'}</Text>
          {keys.map((key, index) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSelectedPath(`${path}.${key}`)}
              activeOpacity={0.7}
            >
              <View style={styles.keyValuePair}>
                <Text style={styles.objectKey}>{indent}  {key}:</Text>
                {renderValue(value[key], `${path}.${key}`, depth + 1)}
                {index < keys.length - 1 && <Text>,</Text>}
              </View>
            </TouchableOpacity>
          ))}
          <Text style={styles.objectValue}>{indent}{'}'}</Text>
        </View>
      );
    }
    
    return <Text style={styles.unknownValue}>{indent}[Unknown]</Text>;
  };
  
  /**
   * 複製狀態到剪貼簿
   */
  const copyToClipboard = async (data: any, storeName: string) => {
    try {
      const json = JSON.stringify(data, null, 2);
      await Clipboard.setString(json);
      Alert.alert('複製成功', `${storeName} 的狀態已複製到剪貼簿`);
    } catch (error) {
      Alert.alert('複製失敗', '無法複製狀態資料');
    }
  };
  
  /**
   * 匯出所有狀態
   */
  const exportAllStates = async () => {
    try {
      const allStates: any = {};
      stores.forEach(store => {
        allStates[store.name] = store.getState();
      });
      
      const json = JSON.stringify(allStates, null, 2);
      await Clipboard.setString(json);
      Alert.alert('匯出成功', '所有狀態已複製到剪貼簿');
    } catch (error) {
      Alert.alert('匯出失敗', '無法匯出狀態資料');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 標題列 */}
      <View style={styles.header}>
        <Text style={styles.title}>狀態檢查工具</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => setAutoRefresh(!autoRefresh)}
          activeOpacity={0.7}
        >
          <Text style={[styles.refreshIcon, autoRefresh && styles.activeRefresh]}>
            🔄
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 搜尋列 */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="搜尋狀態..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* 狀態列表 */}
      <ScrollView 
        style={styles.storeList}
        showsVerticalScrollIndicator={true}
      >
        {stores.map(store => {
          const filteredData = filterData(store.data, searchQuery);
          const isExpanded = expandedStores.has(store.name);
          
          return (
            <View key={store.name} style={styles.storeContainer}>
              <TouchableOpacity
                style={styles.storeHeader}
                onPress={() => toggleStore(store.name)}
                activeOpacity={0.7}
              >
                <Text style={styles.storeIcon}>{store.icon}</Text>
                <Text style={styles.storeName}>{store.name}</Text>
                <View style={styles.storeActions}>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(store.getState(), store.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.copyIcon}>📋</Text>
                  </TouchableOpacity>
                  <Text style={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.storeContent}>
                  <ScrollView 
                    horizontal
                    showsHorizontalScrollIndicator={true}
                  >
                    <View style={styles.jsonContainer}>
                      {renderValue(filteredData, store.name)}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      
      {/* 底部工具列 */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={exportAllStates}
          activeOpacity={0.7}
        >
          <Text style={styles.toolbarIcon}>💾</Text>
          <Text style={styles.toolbarText}>匯出全部</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setExpandedStores(new Set(stores.map(s => s.name)))}
          activeOpacity={0.7}
        >
          <Text style={styles.toolbarIcon}>📂</Text>
          <Text style={styles.toolbarText}>全部展開</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setExpandedStores(new Set())}
          activeOpacity={0.7}
        >
          <Text style={styles.toolbarIcon}>📁</Text>
          <Text style={styles.toolbarText}>全部收合</Text>
        </TouchableOpacity>
      </View>
      
      {/* 路徑提示 */}
      {selectedPath && (
        <View style={styles.pathTooltip}>
          <Text style={styles.pathText}>{selectedPath}</Text>
          <TouchableOpacity
            onPress={() => setSelectedPath(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closePathIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C'
  },
  refreshButton: {
    padding: 8
  },
  refreshIcon: {
    fontSize: 20,
    color: '#718096'
  },
  activeRefresh: {
    color: '#3182CE'
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748'
  },
  clearButton: {
    padding: 4
  },
  clearIcon: {
    fontSize: 16,
    color: '#A0AEC0'
  },
  storeList: {
    flex: 1
  },
  storeContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden'
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  storeIcon: {
    fontSize: 20,
    marginRight: 12
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748'
  },
  storeActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  copyButton: {
    marginRight: 12
  },
  copyIcon: {
    fontSize: 16
  },
  expandIcon: {
    fontSize: 12,
    color: '#718096'
  },
  storeContent: {
    backgroundColor: '#F7FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  jsonContainer: {
    padding: 16
  },
  keyValuePair: {
    flexDirection: 'row',
    marginVertical: 2
  },
  objectKey: {
    color: '#805AD5',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    marginRight: 8
  },
  stringValue: {
    color: '#22863A',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  numberValue: {
    color: '#005CC5',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  booleanValue: {
    color: '#E36209',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  trueValue: {
    color: '#22863A'
  },
  nullValue: {
    color: '#6A737D',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  undefinedValue: {
    color: '#6A737D',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  functionValue: {
    color: '#6F42C1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  arrayValue: {
    color: '#032F62',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  objectValue: {
    color: '#032F62',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  unknownValue: {
    color: '#DC3545',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  toolbarButton: {
    alignItems: 'center',
    padding: 8
  },
  toolbarIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  toolbarText: {
    fontSize: 12,
    color: '#4A5568'
  },
  pathTooltip: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#2D3748',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center'
  },
  pathText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  closePathIcon: {
    color: '#E2E8F0',
    fontSize: 14,
    marginLeft: 12
  }
});