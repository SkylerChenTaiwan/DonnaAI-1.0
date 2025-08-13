/**
 * 虛擬滾動元件 - 優化大量資料的渲染效能
 */

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { VirtualScrollerProps } from './types';
import { NOTION_DEFAULTS } from './constants';

export const VirtualScroller: React.FC<VirtualScrollerProps> = ({
  items,
  rowHeight,
  overscan = NOTION_DEFAULTS.OVERSCAN_COUNT,
  onScroll,
  renderRow,
  className,
  style }) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Calculate visible range
  const { startIndex, endIndex, offsetY } = useMemo(() => {
    const visibleStartIndex = Math.floor(scrollTop / rowHeight);
    const visibleEndIndex = Math.ceil((scrollTop + containerHeight) / rowHeight);
    
    // Add overscan
    const start = Math.max(0, visibleStartIndex - overscan);
    const end = Math.min(items.length - 1, visibleEndIndex + overscan);
    
    // Calculate offset for the visible items
    const offset = start * rowHeight;
    
    return {
      startIndex: start,
      endIndex: end,
      offsetY: offset };
  }, [scrollTop, containerHeight, rowHeight, overscan, items.length]);
  
  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);
  
  // Total height for scrollbar
  const totalHeight = items.length * rowHeight;
  
  // Handle scroll with RAF for performance
  const handleScroll = useCallback((event: any) => {
    const { y } = event.nativeEvent.contentOffset;
    
    // Use RAF for smooth scrolling
    if (Platform.OS === 'web') {
      requestAnimationFrame(() => {
        setScrollTop(y);
        onScroll?.(y);
      });
    } else {
      setScrollTop(y);
      onScroll?.(y);
    }
    
    // Set scrolling state
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set scrolling to false after scroll ends
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);
  
  // Handle container layout
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setContainerHeight(height);
  }, []);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <ScrollView
      ref={scrollViewRef}
      style={StyleSheet.flatten([styles.container, style])}
      onScroll={handleScroll}
      onLayout={handleLayout}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={Platform.OS !== 'web'}
      // Web-specific props
      {...(Platform.OS === 'web' ? {
        className: `notion-virtual-scroller ${className || ''}`,
        style: {
          ...style,
          // Custom scrollbar styles for web
          scrollbarWidth: 'thin',
          scrollbarColor: '#D3D1CB #FFFFFF' } as any } : {})}
    >
      {/* Total height spacer */}
      <View style={{ height: totalHeight }}>
        {/* Visible items container */}
        <View
          style={[
            styles.itemsContainer,
            {
              transform: Platform.OS === 'web' ? `translateY(${offsetY}px)` : [{ translateY: offsetY }] },
          ]}
        >
          {visibleItems.map((item, index) => (
            <View
              key={item.id || `${startIndex + index}`}
              style={StyleSheet.flatten([
                styles.rowContainer,
                {
                  height: rowHeight,
                  // Reduce quality during scrolling for performance
                  opacity: isScrolling ? 0.99 : 1 },
              ])}
            >
              {renderRow(item, startIndex + index)}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  
  itemsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0 },
  
  rowContainer: {
    width: '100%',
    overflow: 'hidden' } });

// Performance optimization hook for virtual scrolling
export const useVirtualScroll = (
  items: any[],
  rowHeight: number,
  containerHeight: number,
  scrollTop: number,
  overscan: number = NOTION_DEFAULTS.OVERSCAN_COUNT
) => {
  return useMemo(() => {
    const visibleStartIndex = Math.floor(scrollTop / rowHeight);
    const visibleEndIndex = Math.ceil((scrollTop + containerHeight) / rowHeight);
    
    const startIndex = Math.max(0, visibleStartIndex - overscan);
    const endIndex = Math.min(items.length - 1, visibleEndIndex + overscan);
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1),
      offsetY: startIndex * rowHeight,
      totalHeight: items.length * rowHeight };
  }, [items, rowHeight, containerHeight, scrollTop, overscan]);
};