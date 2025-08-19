/**
 * PRP-124 Phase 3: Query Suggestions and Auto-completion
 * 
 * @description 查詢建議和自動完成組件
 * @version 1.0.0
 * @date 2025-08-19
 * @author DonnaAI Team
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/Input';
import {
  Search,
  Clock,
  TrendingUp,
  Star,
  Users,
  DollarSign,
  BarChart3,
  Brain,
  Sparkles,
  Filter,
  Calendar,
  MapPin,
  Target,
  Zap,
  ArrowRight,
  X,
  BookmarkPlus,
  History,
  Lightbulb,
  ChevronRight,
  Hash,
  MessageCircle,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { 
  QuerySuggestion, 
  SuggestionType 
} from '@/docs/types/ai-query-data-models';

// ============================================================================
// 介面定義
// ============================================================================

interface QuerySuggestionsProps {
  /** 當前查詢文字 */
  query: string;
  /** 選擇建議回調 */
  onSelect: (suggestion: QuerySuggestion) => void;
  /** 自訂建議列表 */
  suggestions?: QuerySuggestion[];
  /** 顯示模式 */
  mode?: 'dropdown' | 'grid' | 'inline';
  /** 最大顯示數量 */
  maxItems?: number;
  /** 是否顯示分類 */
  showCategories?: boolean;
  /** 是否顯示熱門程度 */
  showPopularity?: boolean;
  /** 是否可自訂 */
  allowCustom?: boolean;
  /** 自訂 CSS 類別 */
  className?: string;
  /** 新增自訂建議回調 */
  onAddCustom?: (suggestion: Omit<QuerySuggestion, 'id'>) => void;
  /** 移除建議回調 */
  onRemove?: (suggestionId: string) => void;
}

interface SuggestionItemProps {
  suggestion: QuerySuggestion;
  onSelect: (suggestion: QuerySuggestion) => void;
  onRemove?: (suggestionId: string) => void;
  showPopularity?: boolean;
  mode?: 'dropdown' | 'grid' | 'inline';
  highlighted?: boolean;
}

interface SuggestionCategoryProps {
  category: SuggestionCategory;
  suggestions: QuerySuggestion[];
  onSelect: (suggestion: QuerySuggestion) => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface SuggestionCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
  priority: number;
}

// ============================================================================
// 建議分類配置
// ============================================================================

const SUGGESTION_CATEGORIES: Record<string, SuggestionCategory> = {
  revenue: {
    id: 'revenue',
    name: '營收分析',
    icon: DollarSign,
    color: 'text-green-600 bg-green-50 border-green-200',
    description: '營收、收入、獲利相關查詢',
    priority: 1
  },
  customer: {
    id: 'customer',
    name: '客戶分析',
    icon: Users,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: '客戶行為、滿意度、流失分析',
    priority: 2
  },
  performance: {
    id: 'performance',
    name: '績效分析',
    icon: Target,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: '團隊表現、KPI 追蹤',
    priority: 3
  },
  trend: {
    id: 'trend',
    name: '趨勢預測',
    icon: TrendingUp,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    description: '趨勢分析和預測',
    priority: 4
  },
  comparison: {
    id: 'comparison',
    name: '對比分析',
    icon: BarChart3,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: '數據對比和基準分析',
    priority: 5
  },
  operations: {
    id: 'operations',
    name: '營運分析',
    icon: Zap,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    description: '營運效率、流程優化',
    priority: 6
  }
};

// ============================================================================
// 建議資料
// ============================================================================

const DEFAULT_SUGGESTIONS: QuerySuggestion[] = [
  // 營收分析
  {
    id: 'revenue-1',
    text: '本月營收表現如何？',
    type: 'popular',
    category: 'revenue',
    icon: '💰',
    description: '查看當月營收數據和趨勢',
    relevance: 0.95,
    usageCount: 234,
    lastUsed: new Date('2024-01-15'),
    tags: ['營收', '月度', '表現']
  },
  {
    id: 'revenue-2',
    text: '與去年同期相比，營收成長多少？',
    type: 'popular',
    category: 'revenue',
    icon: '📈',
    description: '年度對比分析',
    relevance: 0.92,
    usageCount: 189,
    lastUsed: new Date('2024-01-14'),
    tags: ['營收', '成長', '年度對比']
  },
  {
    id: 'revenue-3',
    text: '預測下季度的營收目標',
    type: 'trending',
    category: 'revenue',
    icon: '🔮',
    description: '基於歷史數據預測未來營收',
    relevance: 0.88,
    usageCount: 145,
    lastUsed: new Date('2024-01-13'),
    tags: ['預測', '營收', '目標']
  },

  // 客戶分析
  {
    id: 'customer-1',
    text: '哪些客戶需要重點關注？',
    type: 'popular',
    category: 'customer',
    icon: '👥',
    description: '識別高價值和風險客戶',
    relevance: 0.90,
    usageCount: 201,
    lastUsed: new Date('2024-01-15'),
    tags: ['客戶', '重點', '關注']
  },
  {
    id: 'customer-2',
    text: '客戶滿意度趨勢分析',
    type: 'contextual',
    category: 'customer',
    icon: '😊',
    description: '分析客戶滿意度變化趨勢',
    relevance: 0.85,
    usageCount: 167,
    lastUsed: new Date('2024-01-12'),
    tags: ['客戶滿意度', '趨勢', '分析']
  },
  {
    id: 'customer-3',
    text: '新客戶獲取成本分析',
    type: 'template',
    category: 'customer',
    icon: '💵',
    description: '計算和分析客戶獲取成本',
    relevance: 0.82,
    usageCount: 134,
    lastUsed: new Date('2024-01-11'),
    tags: ['新客戶', '成本', '分析']
  },

  // 績效分析
  {
    id: 'performance-1',
    text: '團隊績效排名如何？',
    type: 'popular',
    category: 'performance',
    icon: '🏆',
    description: '查看團隊成員績效排名',
    relevance: 0.87,
    usageCount: 178,
    lastUsed: new Date('2024-01-14'),
    tags: ['團隊', '績效', '排名']
  },
  {
    id: 'performance-2',
    text: '本季 KPI 完成度統計',
    type: 'contextual',
    category: 'performance',
    icon: '🎯',
    description: '統計關鍵績效指標完成情況',
    relevance: 0.84,
    usageCount: 156,
    lastUsed: new Date('2024-01-13'),
    tags: ['KPI', '完成度', '統計']
  },

  // 趨勢預測
  {
    id: 'trend-1',
    text: '未來三個月的市場趨勢預測',
    type: 'trending',
    category: 'trend',
    icon: '📊',
    description: '基於數據分析預測市場走向',
    relevance: 0.79,
    usageCount: 123,
    lastUsed: new Date('2024-01-10'),
    tags: ['趨勢', '預測', '市場']
  },
  {
    id: 'trend-2',
    text: '季節性銷售模式分析',
    type: 'seasonal',
    category: 'trend',
    icon: '🌟',
    description: '分析銷售的季節性變化規律',
    relevance: 0.76,
    usageCount: 98,
    lastUsed: new Date('2024-01-09'),
    tags: ['季節性', '銷售', '模式']
  }
];

// ============================================================================
// 輔助函數
// ============================================================================

const getSuggestionIcon = (type: SuggestionType) => {
  switch (type) {
    case 'recent': return Clock;
    case 'popular': return TrendingUp;
    case 'contextual': return Search;
    case 'template': return Lightbulb;
    case 'seasonal': return Calendar;
    case 'personal': return Star;
    case 'trending': return Zap;
    default: return MessageCircle;
  }
};

const getSuggestionTypeLabel = (type: SuggestionType) => {
  const labels: Record<SuggestionType, string> = {
    recent: '最近',
    popular: '熱門',
    contextual: '相關',
    template: '範本',
    seasonal: '季節',
    personal: '個人',
    trending: '趨勢'
  };
  return labels[type] || type;
};

const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};

const calculateRelevanceScore = (suggestion: QuerySuggestion, query: string): number => {
  if (!query.trim()) return suggestion.relevance || 0;
  
  const queryLower = query.toLowerCase();
  const textLower = suggestion.text.toLowerCase();
  const categoryLower = suggestion.category?.toLowerCase() || '';
  const tags = suggestion.tags || [];
  
  let score = 0;
  
  // 完全匹配
  if (textLower === queryLower) score += 1.0;
  
  // 開頭匹配
  if (textLower.startsWith(queryLower)) score += 0.8;
  
  // 包含匹配
  if (textLower.includes(queryLower)) score += 0.6;
  
  // 分類匹配
  if (categoryLower.includes(queryLower)) score += 0.4;
  
  // 標籤匹配
  tags.forEach(tag => {
    if (tag.toLowerCase().includes(queryLower)) score += 0.3;
  });
  
  // 基礎相關性分數
  score += (suggestion.relevance || 0) * 0.2;
  
  // 使用次數影響
  score += Math.min((suggestion.usageCount || 0) / 1000, 0.2);
  
  return Math.min(score, 1.0);
};

// ============================================================================
// 建議項目組件
// ============================================================================

function SuggestionItem({
  suggestion,
  onSelect,
  onRemove,
  showPopularity = true,
  mode = 'dropdown',
  highlighted = false
}: SuggestionItemProps) {
  const TypeIcon = getSuggestionIcon(suggestion.type);
  const category = suggestion.category ? SUGGESTION_CATEGORIES[suggestion.category] : null;
  
  const handleClick = useCallback(() => {
    onSelect(suggestion);
  }, [suggestion, onSelect]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(suggestion.id);
    }
  }, [suggestion.id, onRemove]);

  if (mode === 'grid') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "p-4 rounded-lg border cursor-pointer transition-all",
          highlighted 
            ? "border-blue-500 bg-blue-50 shadow-md" 
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        )}
        onClick={handleClick}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {suggestion.icon ? (
              <span className="text-lg">{suggestion.icon}</span>
            ) : (
              <TypeIcon className="w-4 h-4 text-gray-400" />
            )}
            {category && (
              <Badge variant="outline" className={cn("text-xs", category.color)}>
                {category.name}
              </Badge>
            )}
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
        
        <h4 className="font-medium text-gray-900 text-sm mb-1">
          {suggestion.text}
        </h4>
        
        {suggestion.description && (
          <p className="text-xs text-gray-500 mb-2">
            {suggestion.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {getSuggestionTypeLabel(suggestion.type)}
            </Badge>
            {showPopularity && suggestion.usageCount && (
              <span className="text-xs text-gray-400">
                {suggestion.usageCount} 次使用
              </span>
            )}
          </div>
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: '#f8fafc' }}
      className={cn(
        "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors group",
        highlighted && "bg-blue-50 border-l-2 border-blue-500"
      )}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2 flex-shrink-0">
        {suggestion.icon ? (
          <span className="text-base">{suggestion.icon}</span>
        ) : (
          <TypeIcon className={cn(
            "w-4 h-4",
            highlighted ? "text-blue-500" : "text-gray-400"
          )} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          <span dangerouslySetInnerHTML={{ __html: highlightMatch(suggestion.text, '') }} />
        </p>
        {suggestion.description && (
          <p className="text-xs text-gray-500 truncate">
            {suggestion.description}
          </p>
        )}
      </div>

      <div className="flex items-center space-x-2 flex-shrink-0">
        {category && (
          <Badge variant="outline" className={cn("text-xs", category.color)}>
            {category.name}
          </Badge>
        )}
        
        <Badge variant="outline" className="text-xs">
          {getSuggestionTypeLabel(suggestion.type)}
        </Badge>

        {showPopularity && suggestion.usageCount && (
          <span className="text-xs text-gray-400">
            {suggestion.usageCount}
          </span>
        )}

        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// 建議分類組件
// ============================================================================

function SuggestionCategory({
  category,
  suggestions,
  onSelect,
  collapsed = false,
  onToggle
}: SuggestionCategoryProps) {
  const Icon = category.icon;

  return (
    <div className="mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full justify-between p-2 h-auto"
      >
        <div className="flex items-center space-x-2">
          <Icon className={cn("w-4 h-4", category.color.split(' ')[0])} />
          <span className="font-medium text-gray-900">{category.name}</span>
          <Badge variant="outline" className="text-xs">
            {suggestions.length}
          </Badge>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform",
          !collapsed && "rotate-90"
        )} />
      </Button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1"
          >
            {suggestions.map((suggestion) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={onSelect}
                mode="dropdown"
                showPopularity={false}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// 主要組件
// ============================================================================

export function QuerySuggestions({
  query,
  onSelect,
  suggestions = DEFAULT_SUGGESTIONS,
  mode = 'dropdown',
  maxItems = 10,
  showCategories = true,
  showPopularity = true,
  allowCustom = false,
  className,
  onAddCustom,
  onRemove
}: QuerySuggestionsProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // ============================================================================
  // 建議處理
  // ============================================================================

  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) {
      return suggestions
        .sort((a, b) => {
          // 先按類型排序，再按使用次數排序
          const typeWeight = {
            recent: 5,
            popular: 4,
            trending: 3,
            contextual: 2,
            template: 1,
            seasonal: 0,
            personal: 6
          };
          
          const aWeight = typeWeight[a.type] || 0;
          const bWeight = typeWeight[b.type] || 0;
          
          if (aWeight !== bWeight) return bWeight - aWeight;
          return (b.usageCount || 0) - (a.usageCount || 0);
        })
        .slice(0, maxItems);
    }

    return suggestions
      .map(suggestion => ({
        ...suggestion,
        score: calculateRelevanceScore(suggestion, query)
      }))
      .filter(suggestion => suggestion.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);
  }, [suggestions, query, maxItems]);

  const groupedSuggestions = useMemo(() => {
    if (!showCategories) return { uncategorized: filteredSuggestions };

    const groups: Record<string, QuerySuggestion[]> = {};
    
    filteredSuggestions.forEach(suggestion => {
      const categoryId = suggestion.category || 'uncategorized';
      if (!groups[categoryId]) groups[categoryId] = [];
      groups[categoryId].push(suggestion);
    });

    return groups;
  }, [filteredSuggestions, showCategories]);

  // ============================================================================
  // 事件處理
  // ============================================================================

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
          onSelect(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setSelectedIndex(-1);
        break;
    }
  }, [filteredSuggestions, selectedIndex, onSelect]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleCategoryToggle = useCallback((categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // ============================================================================
  // 渲染函數
  // ============================================================================

  if (filteredSuggestions.length === 0 && !allowCustom) {
    return (
      <Card className={cn("p-4 text-center", className)}>
        <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          {query.trim() ? '沒有找到相關建議' : '輸入查詢以獲得建議'}
        </p>
      </Card>
    );
  }

  if (mode === 'grid') {
    return (
      <div className={cn("grid gap-3", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSuggestions.map((suggestion, index) => (
            <SuggestionItem
              key={suggestion.id}
              suggestion={suggestion}
              onSelect={onSelect}
              onRemove={onRemove}
              showPopularity={showPopularity}
              mode="grid"
              highlighted={index === selectedIndex}
            />
          ))}
        </div>

        {allowCustom && onAddCustom && (
          <Button
            variant="dashed"
            onClick={() => {
              if (query.trim()) {
                onAddCustom({
                  text: query.trim(),
                  type: 'personal',
                  category: 'custom',
                  description: '自訂查詢',
                  relevance: 1.0,
                  usageCount: 0,
                  tags: []
                });
              }
            }}
            className="w-full flex items-center justify-center space-x-2 border-dashed"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>將 "{query}" 加入我的建議</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("max-h-80 overflow-y-auto", className)}>
      <div className="p-2">
        {/* 搜尋提示 */}
        {query.trim() && (
          <div className="flex items-center space-x-2 mb-3 p-2 bg-blue-50 rounded-lg">
            <Search className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-700">
              搜尋 "{query}" 的結果
            </span>
            <Badge variant="outline" className="ml-auto text-xs">
              {filteredSuggestions.length} 個結果
            </Badge>
          </div>
        )}

        {/* 分類顯示 */}
        {showCategories ? (
          <div className="space-y-2">
            {Object.entries(groupedSuggestions).map(([categoryId, categorySuggestions]) => {
              const category = SUGGESTION_CATEGORIES[categoryId];
              
              if (!category) {
                return categorySuggestions.map((suggestion, index) => (
                  <SuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onSelect={onSelect}
                    onRemove={onRemove}
                    showPopularity={showPopularity}
                    mode="dropdown"
                    highlighted={index === selectedIndex}
                  />
                ));
              }

              return (
                <SuggestionCategory
                  key={categoryId}
                  category={category}
                  suggestions={categorySuggestions}
                  onSelect={onSelect}
                  collapsed={collapsedCategories.has(categoryId)}
                  onToggle={() => handleCategoryToggle(categoryId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredSuggestions.map((suggestion, index) => (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                onSelect={onSelect}
                onRemove={onRemove}
                showPopularity={showPopularity}
                mode="dropdown"
                highlighted={index === selectedIndex}
              />
            ))}
          </div>
        )}

        {/* 自訂建議 */}
        {allowCustom && onAddCustom && query.trim() && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => {
                onAddCustom({
                  text: query.trim(),
                  type: 'personal',
                  category: 'custom',
                  description: '自訂查詢',
                  relevance: 1.0,
                  usageCount: 0,
                  tags: []
                });
              }}
              className="w-full justify-start text-blue-600 hover:bg-blue-50"
            >
              <BookmarkPlus className="w-4 h-4 mr-2" />
              將 "{query}" 加入我的建議
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default QuerySuggestions;