/**
 * 欄位關聯視覺化元件
 * 使用圖形化方式展示不同資料庫之間的欄位關聯
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import Svg, { Line, Circle, Text as SvgText, G, Rect, Path } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { DesignSystem } from '@/theme/designSystem';
import { FieldRelation, DatabaseType } from '@/types/import';

interface RelationshipVisualizerProps {
  relations: FieldRelation[];
  databases: {
    source: DatabaseType;
    target: DatabaseType;
  };
  sourceFields: string[];
  targetFields: string[];
  onRelationSelect?: (relation: FieldRelation) => void;
  onRelationDelete?: (relationId: string) => void;
  height?: number;
}

interface Node {
  id: string;
  label: string;
  database: 'source' | 'target';
  x: number;
  y: number;
  fieldName: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  relation: FieldRelation;
  bidirectional: boolean;
}

const RelationshipVisualizer: React.FC<RelationshipVisualizerProps> = ({
  relations,
  databases,
  sourceFields,
  targetFields,
  onRelationSelect,
  onRelationDelete,
  height = 400
}) => {
  const colors = DesignSystem.colors;
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  
  const containerRef = useRef<View>(null);

  // 計算節點位置
  useEffect(() => {
    const { width } = Dimensions.get('window');
    const effectiveWidth = width - 40; // 留出 padding
    
    // 建立節點
    const sourceNodes: Node[] = sourceFields.map((field, index) => ({
      id: `source_${field}`,
      label: field,
      database: 'source',
      x: effectiveWidth * 0.2,
      y: 60 + (index * 50),
      fieldName: field
    }));

    const targetNodes: Node[] = targetFields.map((field, index) => ({
      id: `target_${field}`,
      label: field,
      database: 'target',
      x: effectiveWidth * 0.8,
      y: 60 + (index * 50),
      fieldName: field
    }));

    setNodes([...sourceNodes, ...targetNodes]);

    // 建立邊
    const newEdges: Edge[] = relations.map(relation => ({
      id: relation.id,
      source: `source_${relation.sourceField}`,
      target: `target_${relation.targetField}`,
      relation,
      bidirectional: relation.bidirectional
    }));

    setEdges(newEdges);
    setDimensions({ width: effectiveWidth, height });
  }, [sourceFields, targetFields, relations, height]);

  // 獲取關聯類型的顏色
  const getRelationColor = (relationType: string): string => {
    switch (relationType) {
      case 'one-to-one':
        return colors.primary;
      case 'one-to-many':
        return colors.success;
      case 'many-to-many':
        return colors.warning;
      default:
        return colors.gray500;
    }
  };

  // 獲取關聯類型的標籤
  const getRelationLabel = (relationType: string): string => {
    switch (relationType) {
      case 'one-to-one':
        return '1:1';
      case 'one-to-many':
        return '1:N';
      case 'many-to-many':
        return 'N:N';
      default:
        return '';
    }
  };

  // 處理關聯選擇
  const handleRelationPress = (edge: Edge) => {
    setSelectedRelation(edge.id);
    if (onRelationSelect) {
      onRelationSelect(edge.relation);
    }
  };

  // 渲染箭頭
  const renderArrow = (x: number, y: number, angle: number, color: string) => {
    const arrowSize = 8;
    const path = `
      M ${x} ${y}
      L ${x - arrowSize} ${y - arrowSize/2}
      L ${x - arrowSize} ${y + arrowSize/2}
      Z
    `;
    
    return (
      <Path
        d={path}
        fill={color}
        transform={`rotate(${angle}, ${x}, ${y})`}
      />
    );
  };

  // 渲染關聯線
  const renderEdge = (edge: Edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return null;

    const color = getRelationColor(edge.relation.relationType);
    const isSelected = selectedRelation === edge.id;
    const strokeWidth = isSelected ? 3 : 2;
    const opacity = isSelected ? 1 : 0.7;

    // 計算曲線控制點
    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;
    const curveOffset = 30;
    
    // 計算箭頭角度
    const angle = Math.atan2(
      targetNode.y - sourceNode.y,
      targetNode.x - sourceNode.x
    ) * 180 / Math.PI;

    return (
      <G key={edge.id}>
        {/* 關聯線 */}
        <Line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={targetNode.x}
          y2={targetNode.y}
          stroke={color}
          strokeWidth={strokeWidth}
          opacity={opacity}
          strokeDasharray={edge.relation.isOptional ? "5,5" : undefined}
          onPress={() => handleRelationPress(edge)}
        />
        
        {/* 箭頭 */}
        {renderArrow(targetNode.x - 20, targetNode.y, angle, color)}
        
        {/* 雙向箭頭 */}
        {edge.bidirectional && renderArrow(
          sourceNode.x + 20, 
          sourceNode.y, 
          angle + 180, 
          color
        )}
        
        {/* 關聯類型標籤 */}
        <Rect
          x={midX - 20}
          y={midY - 10}
          width={40}
          height={20}
          fill={colors.background}
          stroke={color}
          strokeWidth={1}
          rx={4}
        />
        <SvgText
          x={midX}
          y={midY + 4}
          fontSize={10}
          fill={color}
          textAnchor="middle"
        >
          {getRelationLabel(edge.relation.relationType)}
        </SvgText>
      </G>
    );
  };

  // 渲染節點
  const renderNode = (node: Node) => {
    const isSource = node.database === 'source';
    const bgColor = isSource ? colors.primary : colors.success;
    const hasRelation = edges.some(e => 
      e.source === node.id || e.target === node.id
    );
    
    return (
      <G key={node.id}>
        {/* 節點背景 */}
        <Rect
          x={node.x - 60}
          y={node.y - 15}
          width={120}
          height={30}
          fill={hasRelation ? bgColor : colors.gray200}
          opacity={0.2}
          rx={15}
        />
        
        {/* 節點圓圈 */}
        <Circle
          cx={node.x}
          cy={node.y}
          r={6}
          fill={hasRelation ? bgColor : colors.gray400}
        />
        
        {/* 節點標籤 */}
        <SvgText
          x={isSource ? node.x - 70 : node.x + 70}
          y={node.y + 4}
          fontSize={12}
          fill={colors.text}
          textAnchor={isSource ? 'end' : 'start'}
        >
          {node.label}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={styles.container} ref={containerRef}>
      {/* 標題欄 */}
      <View style={styles.header}>
        <View style={styles.databaseLabel}>
          <MaterialIcons 
            name="storage" 
            size={16} 
            color={colors.primary} 
          />
          <Text style={[styles.databaseText, { color: colors.primary }]}>
            {databases.source}
          </Text>
        </View>
        
        <MaterialIcons 
          name="sync-alt" 
          size={20} 
          color={colors.gray500} 
        />
        
        <View style={styles.databaseLabel}>
          <MaterialIcons 
            name="storage" 
            size={16} 
            color={colors.success} 
          />
          <Text style={[styles.databaseText, { color: colors.success }]}>
            {databases.target}
          </Text>
        </View>
      </View>

      {/* SVG 視覺化 */}
      <ScrollView 
        style={styles.svgContainer}
        horizontal={Platform.OS === 'web'}
        showsHorizontalScrollIndicator={false}
      >
        <Svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        >
          {/* 渲染所有邊 */}
          {edges.map(edge => renderEdge(edge))}
          
          {/* 渲染所有節點 */}
          {nodes.map(node => renderNode(node))}
        </Svg>
      </ScrollView>

      {/* 圖例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>一對一</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>一對多</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>多對多</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderStyle: 'dashed' }]} />
          <Text style={styles.legendText}>可選</Text>
        </View>
      </View>

      {/* 選中的關聯詳情 */}
      {selectedRelation && (
        <View style={[styles.detailPanel, { backgroundColor: colors.background }]}>
          {(() => {
            const edge = edges.find(e => e.id === selectedRelation);
            if (!edge) return null;
            
            return (
              <>
                <Text style={styles.detailTitle}>關聯詳情</Text>
                <Text style={styles.detailText}>
                  {edge.relation.sourceField} → {edge.relation.targetField}
                </Text>
                <Text style={styles.detailText}>
                  類型: {getRelationLabel(edge.relation.relationType)}
                </Text>
                {edge.relation.description && (
                  <Text style={styles.detailText}>
                    說明: {edge.relation.description}
                  </Text>
                )}
                {onRelationDelete && (
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.error }]}
                    onPress={() => onRelationDelete(edge.relation.id)}
                  >
                    <MaterialIcons name="delete" size={16} color={colors.white} />
                    <Text style={[styles.deleteButtonText, { color: colors.white }]}>
                      刪除關聯
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20
  },
  databaseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  databaseText: {
    fontSize: 14,
    fontWeight: '600'
  },
  svgContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendLine: {
    width: 20,
    height: 0,
    borderTopWidth: 2,
    borderTopColor: '#666'
  },
  legendText: {
    fontSize: 11,
    color: '#666'
  },
  detailPanel: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500'
  }
});

export default RelationshipVisualizer;