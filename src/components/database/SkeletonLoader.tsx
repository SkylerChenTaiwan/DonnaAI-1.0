/**
 * Notion 風格骨架屏載入組件
 * 提供漸進式載入動畫效果
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Platform } from 'react-native';
import { responsive } from '@/styles/web';

interface SkeletonLoaderProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  fadeInDelays?: number[];
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  fadeInDelays = [0, 200, 400, 600, 800], // 漸進式顯示延遲
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimations = useRef(
    Array(rows).fill(null).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Shimmer 動畫
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true })
    ).start();

    // 漸進式淡入動畫
    fadeAnimations.forEach((anim, index) => {
      const delay = fadeInDelays[index] || index * 100;
      setTimeout(() => {
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true }).start();
      }, delay);
    });
  }, []);

  const translateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300] });

  // 生成隨機寬度（模擬真實資料的不同長度）
  const getRandomWidth = () => {
    const widths = ['30%', '50%', '70%', '85%', '100%'];
    return widths[Math.floor(Math.random() * widths.length)];
  };

  // 渲染 Shimmer 效果
  const renderShimmer = () => (
    <Animated.View
      style={[
        styles.shimmerGradient,
        {
          transform: Platform.OS === 'web' ? `translateX(${0}px)` : [{ translateX: 0 }] },
      ]}
    />
  );

  // 渲染骨架單元格
  const renderSkeletonCell = (width: string | number = '100%') => (
    <View style={[styles.skeletonCell, { width }]}>
      <View style={styles.shimmerContainer}>
        <View style={styles.shimmerBase} />
        {renderShimmer()}
      </View>
    </View>
  );

  // 渲染表頭骨架
  const renderSkeletonHeader = () => (
    <View style={styles.skeletonHeader}>
      {Array(columns).fill(null).map((_, index) => (
        <View key={`header-${index}`} style={styles.headerCellContainer}>
          {renderSkeletonCell(responsive({ mobile: 60, tablet: 80, desktop: 100 }))}
        </View>
      ))}
    </View>
  );

  // 渲染表格行骨架
  const renderSkeletonRow = (rowIndex: number) => (
    <Animated.View
      key={`row-${rowIndex}`}
      style={[
        styles.skeletonRow,
        {
          opacity: fadeAnimations[rowIndex] },
      ]}
    >
      {Array(columns).fill(null).map((_, colIndex) => (
        <View key={`cell-${rowIndex}-${colIndex}`} style={styles.cellContainer}>
          {renderSkeletonCell(
            colIndex === 0 
              ? responsive({ mobile: 80, tablet: 100, desktop: 120 }) 
              : getRandomWidth()
          )}
        </View>
      ))}
    </Animated.View>
  );

  return (
    <View style={styles.skeletonContainer}>
      {/* 表格標題骨架 */}
      {showHeader && renderSkeletonHeader()}
      
      {/* 表格行骨架 */}
      {Array(rows).fill(null).map((_, index) => renderSkeletonRow(index))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonContainer: {
    flex: 1,
    backgroundColor: '#fff' },
  skeletonHeader: {
    flexDirection: 'row',
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    paddingVertical: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec' },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: responsive({ mobile: 8, tablet: 12, desktop: 16 }),
    paddingVertical: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec' },
  headerCellContainer: {
    flex: 1,
    marginHorizontal: responsive({ mobile: 6, tablet: 8, desktop: 10 }) },
  cellContainer: {
    flex: 1,
    marginHorizontal: responsive({ mobile: 6, tablet: 8, desktop: 10 }) },
  skeletonCell: {
    height: responsive({ mobile: 12, tablet: 14, desktop: 16 }),
    borderRadius: responsive({ mobile: 6, tablet: 8, desktop: 10 }),
    overflow: 'hidden' },
  shimmerContainer: {
    flex: 1,
    overflow: 'hidden' },
  shimmerBase: {
    flex: 1,
    backgroundColor: '#e3e2e0' },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: Platform.select({
      web: 'transparent',
      default: 'transparent' }),
    // 使用偽元素在 Web 上創建漸變效果
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)' } }) } });

// 進階骨架屏組件 - 支援更複雜的佈局
export const AdvancedSkeletonLoader: React.FC<{
  layout?: 'table' | 'card' | 'list';
  count?: number;
}> = ({ layout = 'table', count = 5 }) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true })
    ).start();
  }, []);

  const renderCardSkeleton = () => (
    <View style={advancedStyles.card}>
      <View style={advancedStyles.cardHeader}>
        <View style={[advancedStyles.skeleton, advancedStyles.avatar]} />
        <View style={advancedStyles.cardHeaderText}>
          <View style={[advancedStyles.skeleton, { width: '60%' }]} />
          <View style={[advancedStyles.skeleton, { width: '40%', marginTop: 4 }]} />
        </View>
      </View>
      <View style={advancedStyles.cardBody}>
        <View style={[advancedStyles.skeleton, { width: '100%' }]} />
        <View style={[advancedStyles.skeleton, { width: '80%', marginTop: 8 }]} />
        <View style={[advancedStyles.skeleton, { width: '90%', marginTop: 8 }]} />
      </View>
    </View>
  );

  const renderListSkeleton = () => (
    <View style={advancedStyles.listItem}>
      <View style={[advancedStyles.skeleton, advancedStyles.listIcon]} />
      <View style={advancedStyles.listContent}>
        <View style={[advancedStyles.skeleton, { width: '70%' }]} />
        <View style={[advancedStyles.skeleton, { width: '50%', marginTop: 4, height: 10 }]} />
      </View>
      <View style={[advancedStyles.skeleton, advancedStyles.listAction]} />
    </View>
  );

  switch (layout) {
    case 'card':
      return (
        <View style={advancedStyles.container}>
          {Array(count).fill(null).map((_, index) => (
            <View key={`card-${index}`}>
              {renderCardSkeleton()}
            </View>
          ))}
        </View>
      );
    
    case 'list':
      return (
        <View style={advancedStyles.container}>
          {Array(count).fill(null).map((_, index) => (
            <View key={`list-${index}`}>
              {renderListSkeleton()}
            </View>
          ))}
        </View>
      );
    
    default:
      return <SkeletonLoader rows={count} />;
  }
};

const advancedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff' },
  skeleton: {
    backgroundColor: '#e3e2e0',
    borderRadius: responsive({ mobile: 4, tablet: 6, desktop: 8 }),
    height: responsive({ mobile: 12, tablet: 14, desktop: 16 }) },
  // 卡片骨架樣式
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eeeeec',
    borderRadius: responsive({ mobile: 8, tablet: 10, desktop: 12 }),
    padding: responsive({ mobile: 16, tablet: 20, desktop: 24 }),
    marginBottom: responsive({ mobile: 12, tablet: 16, desktop: 20 }) },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsive({ mobile: 12, tablet: 16, desktop: 20 }) },
  avatar: {
    width: responsive({ mobile: 40, tablet: 48, desktop: 56 }),
    height: responsive({ mobile: 40, tablet: 48, desktop: 56 }),
    borderRadius: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    marginRight: responsive({ mobile: 12, tablet: 14, desktop: 16 }) },
  cardHeaderText: {
    flex: 1 },
  cardBody: {
    marginTop: responsive({ mobile: 8, tablet: 10, desktop: 12 }) },
  // 列表骨架樣式
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: responsive({ mobile: 12, tablet: 16, desktop: 20 }),
    paddingHorizontal: responsive({ mobile: 16, tablet: 20, desktop: 24 }),
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeec' },
  listIcon: {
    width: responsive({ mobile: 24, tablet: 28, desktop: 32 }),
    height: responsive({ mobile: 24, tablet: 28, desktop: 32 }),
    borderRadius: responsive({ mobile: 4, tablet: 6, desktop: 8 }),
    marginRight: responsive({ mobile: 12, tablet: 14, desktop: 16 }) },
  listContent: {
    flex: 1,
    marginRight: responsive({ mobile: 12, tablet: 14, desktop: 16 }) },
  listAction: {
    width: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    height: responsive({ mobile: 20, tablet: 24, desktop: 28 }),
    borderRadius: responsive({ mobile: 10, tablet: 12, desktop: 14 }) } });