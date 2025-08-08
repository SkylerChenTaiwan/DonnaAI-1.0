/**
 * 階段 1: 資料庫選擇器
 * 讓使用者選擇要匯入資料的目標資料庫
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { MaterialIcon } from '@/components/common/MaterialIcon';
import { Icon } from '@/components/common/Icon';
import { DesignSystem } from '@/theme/designSystem';
import { DatabaseType } from '@/types/import';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/services/firebase/config';
import { getFieldDefinitions } from '@/services/firebase/fieldDefinitions';
import { FieldConfig } from '@/types/fieldDefinitions';

interface DatabaseSelectorProps {
  selectedDatabase: DatabaseType | null;
  onSelect: (database: DatabaseType) => void;
  organizationId: string;
}

interface DatabaseOption {
  type: DatabaseType;
  label: string;
  description: string;
  icon: string;
  iconFamily: 'MaterialIcons' | 'Ionicons';
  color: string;
  stats?: {
    totalCount: number;
    lastImport?: Date;
    customFields: number;
  };
}

const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  selectedDatabase,
  onSelect,
  organizationId
}) => {
  const colors = DesignSystem.colors;
  const [loading, setLoading] = useState(false);
  const [databaseStats, setDatabaseStats] = useState<Record<DatabaseType, any>>({});
  const [fieldCounts, setFieldCounts] = useState<Record<DatabaseType, number>>({});

  // 資料庫選項配置
  const databaseOptions: DatabaseOption[] = [
    {
      type: 'customers',
      label: '客戶資料庫',
      description: '匯入客戶基本資料、聯絡資訊、公司資料等',
      icon: 'people',
      iconFamily: 'MaterialIcons',
      color: '#4CAF50'
    },
    {
      type: 'users',
      label: '用戶資料庫',
      description: '匯入業務員、團隊成員、管理人員等用戶資料',
      icon: 'person-add',
      iconFamily: 'MaterialIcons',
      color: '#9C27B0'
    },
    {
      type: 'records',
      label: '訪談記錄',
      description: '匯入訪談記錄、會議筆記、互動歷史等',
      icon: 'note-text',
      iconFamily: 'MaterialCommunityIcons',
      color: '#2196F3'
    },
    {
      type: 'tasks',
      label: '任務清單',
      description: '匯入待辦事項、工作任務、專案進度等',
      icon: 'check-circle',
      iconFamily: 'MaterialIcons',
      color: '#FF9800'
    }
  ];

  // 載入資料庫統計資訊
  useEffect(() => {
    loadDatabaseStats();
  }, [organizationId]);

  const loadDatabaseStats = async () => {
    setLoading(true);
    try {
      const stats: Record<string, any> = {};
      const fields: Record<string, number> = {};

      // 載入每個資料庫的統計資訊
      for (const option of databaseOptions) {
        const collectionName = option.type;
        
        // 取得記錄數量
        const db = getFirebaseDb();
        const q = query(
          collection(db, collectionName),
          where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(q);
        
        // 取得欄位定義
        const fieldDefs = await getFieldDefinitions(collectionName, organizationId);
        
        stats[collectionName] = {
          totalCount: snapshot.size,
          lastImport: null, // TODO: 從匯入歷史取得
          customFields: fieldDefs.filter(f => !isDefaultField(f)).length
        };
        
        fields[collectionName] = fieldDefs.length;
      }

      setDatabaseStats(stats);
      setFieldCounts(fields);
    } catch (error) {
      console.error('載入資料庫統計失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 判斷是否為預設欄位
  const isDefaultField = (field: FieldConfig): boolean => {
    const defaultFieldKeys = [
      'name', 'email', 'phone', 'company', // 客戶預設欄位
      'title', 'description', 'dueDate', 'priority', 'status', // 任務預設欄位
      'content', 'createdAt', 'customerId' // 記錄預設欄位
    ];
    return defaultFieldKeys.includes(field.key);
  };

  // 渲染資料庫選項卡片
  const renderDatabaseCard = (option: DatabaseOption) => {
    const isSelected = selectedDatabase === option.type;
    const stats = databaseStats[option.type];
    const fieldCount = fieldCounts[option.type] || 0;

    const IconComponent = option.iconFamily === 'Ionicons' 
      ? Icon 
      : MaterialIcon;

    return (
      <TouchableOpacity
        key={option.type}
        style={[
          styles.card,
          {
            backgroundColor: colors.white,
            borderColor: isSelected ? colors.primary : colors.gray200,
            borderWidth: isSelected ? 2 : 1
          }
        ]}
        onPress={() => onSelect(option.type)}
        activeOpacity={0.7}
      >
        {/* 選中標記 */}
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
            <Icon name="checkmark" size={16} color={colors.white} />
          </View>
        )}

        {/* 圖標和標題 */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
            <IconComponent 
              name={option.icon as any} 
              size={32} 
              color={option.color} 
            />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {option.label}
            </Text>
            <Text style={[styles.cardDescription, { color: colors.gray600 }]}>
              {option.description}
            </Text>
          </View>
        </View>

        {/* 統計資訊 */}
        {stats && (
          <View style={[styles.statsContainer, { borderTopColor: colors.gray100 }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.totalCount.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>
                現有記錄
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {fieldCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>
                欄位數量
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.customFields || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray500 }]}>
                自訂欄位
              </Text>
            </View>
          </View>
        )}

        {/* 功能標籤 */}
        <View style={styles.featuresContainer}>
          <View style={[styles.featureTag, { backgroundColor: colors.gray100 }]}>
            <MaterialIcon name="merge-type" size={12} color={colors.gray600} />
            <Text style={[styles.featureText, { color: colors.gray600 }]}>
              支援合併
            </Text>
          </View>
          <View style={[styles.featureTag, { backgroundColor: colors.gray100 }]}>
            <MaterialIcon name="link" size={12} color={colors.gray600} />
            <Text style={[styles.featureText, { color: colors.gray600 }]}>
              跨表關聯
            </Text>
          </View>
          <View style={[styles.featureTag, { backgroundColor: colors.gray100 }]}>
            <MaterialIcon name="add-circle-outline" size={12} color={colors.gray600} />
            <Text style={[styles.featureText, { color: colors.gray600 }]}>
              動態欄位
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 說明文字 */}
      <View style={styles.instructionContainer}>
        <MaterialIcon name="info-outline" size={20} color={colors.primary} />
        <Text style={[styles.instruction, { color: colors.gray600 }]}>
          請選擇要匯入資料的目標資料庫。系統將根據您的選擇載入對應的欄位結構。
        </Text>
      </View>

      {/* 載入中狀態 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.gray600 }]}>
            正在載入資料庫資訊...
          </Text>
        </View>
      ) : (
        /* 資料庫選項列表 */
        <View style={styles.cardsContainer}>
          {databaseOptions.map(renderDatabaseCard)}
        </View>
      )}

      {/* 提示訊息 */}
      {selectedDatabase && (
        <View style={[styles.tipContainer, { backgroundColor: colors.primary + '10' }]}>
          <MaterialIcon name="lightbulb-outline" size={16} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.primary }]}>
            已選擇 {databaseOptions.find(o => o.type === selectedDatabase)?.label}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 8
  },
  instruction: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  cardsContainer: {
    gap: 16
  },
  card: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative'
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardTitleContainer: {
    flex: 1
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  cardDescription: {
    fontSize: 12,
    lineHeight: 18
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    marginBottom: 12,
    borderTopWidth: 1
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  statLabel: {
    fontSize: 10
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4
  },
  featureText: {
    fontSize: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 24,
    gap: 8
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500'
  }
});

export default DatabaseSelector;