/**
 * AdaptiveTabs - 簡化版標籤頁元件
 */

import React, { useState } from 'react';
import { Platform, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Tab {
  key: string;
  label: string;
  content?: React.ReactNode;
}

interface AdaptiveTabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  color?: string;
  testID?: string;
}

const DEFAULT_COLOR = '#FE7821';

const AdaptiveTabsWeb: React.FC<AdaptiveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  color = DEFAULT_COLOR,
  testID,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab || tabs[0]?.key);
  const currentTab = localActiveTab;
  
  const containerStyle: React.CSSProperties = {
    width: '100%',
  };
  
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1px solid #E3E1DC',
    overflowX: 'auto',
  };
  
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
    color: isActive ? color : '#666666',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
  });
  
  const contentStyle: React.CSSProperties = {
    padding: '16px',
  };
  
  const handleTabPress = (key: string) => {
    setLocalActiveTab(key);
    onTabChange?.(key);
  };
  
  return (
    <div style={containerStyle} data-testid={testID}>
      <div style={headerStyle}>
        {tabs.map((tab) => (
          <div
            key={tab.key}
            style={tabStyle(currentTab === tab.key)}
            onClick={() => handleTabPress(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div style={contentStyle}>
        {tabs.find(tab => tab.key === currentTab)?.content}
      </div>
    </div>
  );
};

const AdaptiveTabsNative: React.FC<AdaptiveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  color = DEFAULT_COLOR,
  testID,
}) => {
  const [localActiveTab, setLocalActiveTab] = useState(activeTab || tabs[0]?.key);
  const currentTab = localActiveTab;
  
  const handleTabPress = (key: string) => {
    setLocalActiveTab(key);
    onTabChange?.(key);
  };
  
  return (
    <View style={styles.container} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.header}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              currentTab === tab.key && { borderBottomColor: color },
            ]}
            onPress={() => handleTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                currentTab === tab.key && { color, fontWeight: '600' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.content}>
        {tabs.find(tab => tab.key === currentTab)?.content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#E3E1DC',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    color: '#666666',
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
});

export const AdaptiveTabs = Platform.select({
  web: AdaptiveTabsWeb,
  default: AdaptiveTabsNative,
}) as React.FC<AdaptiveTabsProps>;