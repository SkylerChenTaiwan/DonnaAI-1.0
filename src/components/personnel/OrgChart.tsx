/**
 * 組織圖元件 - 負責渲染組織架構樹狀圖
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, { Line, G } from 'react-native-svg';
import { OrgNode, DragDropEvent } from '@/types/organization';
import { TeamMember } from '@/screens/personnel/PersonnelScreen';
import { OrgNodeComponent } from './OrgNode';
import { DragDropProvider } from './DragDropHandler';
import { DesignSystem } from '@/theme/designSystem';

interface OrgChartProps {
  teamMembers: TeamMember[];
  searchQuery?: string;
  onNodePress?: (node: OrgNode) => void;
  onNodeExpand?: (nodeId: string) => void;
  draggable?: boolean;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;
const HORIZONTAL_SPACING = 40;
const VERTICAL_SPACING = 80;

export function OrgChart({ 
  teamMembers, 
  searchQuery = '',
  onNodePress,
  onNodeExpand,
  draggable = false
}: OrgChartProps) {
  // 處理拖放開始
  const handleDragStart = (node: OrgNode) => {
    console.log('開始拖動:', node.user.name);
  };
  
  // 處理放置
  const handleDrop = (event: DragDropEvent) => {
    console.log('放置事件:', event);
    // TODO: 實作組織結構更新邏輯
  };
  // 構建組織樹結構
  const orgTree = useMemo(() => {
    // 找出所有主管和管理員
    const managers = teamMembers.filter(m => 
      m.role === 'admin' || m.role === 'manager'
    );
    
    // 找出最高層級（沒有上級的）
    const topLevel = managers.filter(m => {
      // TODO: 需要 reportingTo 欄位來判斷
      // 暫時以 admin 作為最高層級
      return m.role === 'admin';
    });

    // 建立節點映射
    const nodeMap = new Map<string, OrgNode>();
    
    // 先建立所有節點
    teamMembers.forEach(member => {
      const node: OrgNode = {
        id: member.id,
        user: member as any, // TODO: 轉換為 EnhancedUser
        children: [],
        expanded: true,
        position: { x: 0, y: 0 },
      };
      nodeMap.set(member.id, node);
    });

    // 建立父子關係
    // TODO: 需要實際的上下級關係資料
    // 暫時以角色層級模擬
    const adminNodes = teamMembers
      .filter(m => m.role === 'admin')
      .map(m => nodeMap.get(m.id)!);
    
    const managerNodes = teamMembers
      .filter(m => m.role === 'manager')
      .map(m => nodeMap.get(m.id)!);
    
    const salespersonNodes = teamMembers
      .filter(m => m.role === 'salesperson')
      .map(m => nodeMap.get(m.id)!);

    // 簡單的層級結構：admin -> managers -> salespersons
    adminNodes.forEach(admin => {
      admin.children = managerNodes;
    });
    
    if (managerNodes.length > 0) {
      const nodesPerManager = Math.ceil(salespersonNodes.length / managerNodes.length);
      managerNodes.forEach((manager, index) => {
        const start = index * nodesPerManager;
        const end = start + nodesPerManager;
        manager.children = salespersonNodes.slice(start, end);
      });
    }

    return adminNodes[0] || null;
  }, [teamMembers]);

  // 計算節點位置
  const calculateNodePositions = (node: OrgNode, x: number, y: number): void => {
    node.position = { x, y };
    
    if (node.expanded && node.children.length > 0) {
      const totalWidth = node.children.length * (NODE_WIDTH + HORIZONTAL_SPACING) - HORIZONTAL_SPACING;
      const startX = x - totalWidth / 2 + NODE_WIDTH / 2;
      
      node.children.forEach((child, index) => {
        const childX = startX + index * (NODE_WIDTH + HORIZONTAL_SPACING);
        const childY = y + NODE_HEIGHT + VERTICAL_SPACING;
        calculateNodePositions(child, childX, childY);
      });
    }
  };

  // 計算圖表尺寸
  const { chartWidth, chartHeight } = useMemo(() => {
    if (!orgTree) return { chartWidth: 0, chartHeight: 0 };
    
    const screenWidth = Dimensions.get('window').width;
    const startX = screenWidth / 2;
    const startY = 50;
    
    calculateNodePositions(orgTree, startX, startY);
    
    // 找出最大的 x 和 y 值
    let maxX = 0;
    let maxY = 0;
    
    const findMaxValues = (node: OrgNode) => {
      maxX = Math.max(maxX, node.position!.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.position!.y + NODE_HEIGHT);
      
      if (node.expanded) {
        node.children.forEach(findMaxValues);
      }
    };
    
    findMaxValues(orgTree);
    
    return {
      chartWidth: Math.max(maxX + 100, screenWidth),
      chartHeight: maxY + 100,
    };
  }, [orgTree]);

  // 渲染連接線
  const renderConnections = (node: OrgNode): React.ReactNode[] => {
    if (!node.expanded || node.children.length === 0) return [];
    
    const connections: React.ReactNode[] = [];
    const parentX = node.position!.x + NODE_WIDTH / 2;
    const parentY = node.position!.y + NODE_HEIGHT;
    
    node.children.forEach((child, index) => {
      const childX = child.position!.x + NODE_WIDTH / 2;
      const childY = child.position!.y;
      
      connections.push(
        <Line
          key={`${node.id}-${child.id}`}
          x1={parentX}
          y1={parentY}
          x2={childX}
          y2={childY}
          stroke={DesignSystem.colors.border.medium}
          strokeWidth={2}
        />
      );
      
      // 遞迴渲染子節點的連接線
      connections.push(...renderConnections(child));
    });
    
    return connections;
  };

  // 渲染節點
  const renderNodes = (node: OrgNode): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    
    // 檢查是否符合搜尋條件
    const matchesSearch = !searchQuery || 
      node.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    nodes.push(
      <View
        key={node.id}
        style={[
          styles.nodeContainer,
          {
            position: 'absolute',
            left: node.position!.x,
            top: node.position!.y,
            opacity: matchesSearch ? 1 : 0.3,
          },
        ]}
      >
        <OrgNodeComponent
          node={node}
          onPress={() => onNodePress?.(node)}
          onExpand={() => onNodeExpand?.(node.id)}
          draggable={draggable}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      </View>
    );
    
    // 遞迴渲染子節點
    if (node.expanded) {
      node.children.forEach(child => {
        nodes.push(...renderNodes(child));
      });
    }
    
    return nodes;
  };

  if (!orgTree) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>沒有組織資料</Text>
      </View>
    );
  }

  const content = (
    <ScrollView
      style={styles.container}
      horizontal
      showsHorizontalScrollIndicator={true}
      showsVerticalScrollIndicator={true}
    >
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[
          styles.contentContainer,
          { width: chartWidth, height: chartHeight },
        ]}
      >
        {/* SVG 連接線層 */}
        <Svg
          width={chartWidth}
          height={chartHeight}
          style={StyleSheet.absoluteFillObject}
        >
          <G>{renderConnections(orgTree)}</G>
        </Svg>
        
        {/* 節點層 */}
        {renderNodes(orgTree)}
      </ScrollView>
    </ScrollView>
  );
  
  // 如果啟用拖放，包裹 DragDropProvider
  if (draggable) {
    return <DragDropProvider>{content}</DragDropProvider>;
  }
  
  return content;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    position: 'relative',
  },
  nodeContainer: {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: DesignSystem.colors.text.secondary,
  },
});