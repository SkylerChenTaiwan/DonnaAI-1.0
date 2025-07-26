/**
 * 回應快取系統
 * 快取相似的客戶回應以減少 API 呼叫，並提供變化重寫功能
 */

import { StateType, CacheItem } from '../../types/roleplay';
import { generateCustomerResponse } from '../api/gemini-integration';

// 快取配置
const CACHE_MAX_SIZE = 500;                    // 最大快取項目數
const CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24小時過期
const SIMILARITY_THRESHOLD = 0.8;              // 相似度閾值

// 快取統計
interface CacheStats {
  hits: number;
  misses: number;
  totalRequests: number;
  cacheSize: number;
  lastCleanup: Date;
}

// 快取鍵生成選項
interface CacheKeyOptions {
  state: StateType;
  userInput: string;
  personaId?: string;
  mood?: string;
}

/**
 * 回應快取管理器
 */
export class ResponseCache {
  private cache: Map<string, CacheItem>;
  private stats: CacheStats;
  private keywordIndex: Map<string, Set<string>>; // 關鍵字索引，加速查找

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      cacheSize: 0,
      lastCleanup: new Date()
    };
    this.keywordIndex = new Map();
  }

  /**
   * 查找相似的快取回應
   */
  async findSimilar(options: CacheKeyOptions): Promise<string | null> {
    this.stats.totalRequests++;

    // 生成快取鍵
    const cacheKey = this.generateCacheKey(options);
    
    // 精確匹配
    const exactMatch = this.cache.get(cacheKey);
    if (exactMatch && !this.isExpired(exactMatch)) {
      this.stats.hits++;
      exactMatch.hitCount++;
      
      // 重寫回應以避免重複
      return await this.rewriteResponse(exactMatch.response, options.state);
    }

    // 模糊匹配
    const similarKey = this.findSimilarKey(options);
    if (similarKey) {
      const similarItem = this.cache.get(similarKey);
      if (similarItem && !this.isExpired(similarItem)) {
        this.stats.hits++;
        similarItem.hitCount++;
        
        // 重寫回應
        return await this.rewriteResponse(similarItem.response, options.state);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * 儲存回應到快取
   */
  store(options: CacheKeyOptions, response: string): void {
    // 檢查快取大小
    if (this.cache.size >= CACHE_MAX_SIZE) {
      this.evictLeastUsed();
    }

    const cacheKey = this.generateCacheKey(options);
    const cacheItem: CacheItem = {
      key: cacheKey,
      response,
      state: options.state,
      timestamp: new Date(),
      hitCount: 0
    };

    this.cache.set(cacheKey, cacheItem);
    this.stats.cacheSize = this.cache.size;

    // 更新關鍵字索引
    this.updateKeywordIndex(options.userInput, cacheKey);

    // 定期清理
    if (this.shouldCleanup()) {
      this.cleanup();
    }
  }

  /**
   * 生成快取鍵
   */
  private generateCacheKey(options: CacheKeyOptions): string {
    const normalizedInput = this.normalizeInput(options.userInput);
    const components = [
      options.state,
      normalizedInput,
      options.personaId || 'default',
      options.mood || 'neutral'
    ];
    
    return components.join(':');
  }

  /**
   * 正規化輸入（用於快取鍵）
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, '') // 只保留中文、英文、數字
      .replace(/\s+/g, ' ')                      // 合併空格
      .substring(0, 50);                         // 限制長度
  }

  /**
   * 查找相似的快取鍵
   */
  private findSimilarKey(options: CacheKeyOptions): string | null {
    const targetKeywords = this.extractKeywords(options.userInput);
    let bestMatch: { key: string; score: number } | null = null;

    // 先通過關鍵字索引縮小搜索範圍
    const candidateKeys = new Set<string>();
    for (const keyword of targetKeywords) {
      const keys = this.keywordIndex.get(keyword);
      if (keys) {
        Array.from(keys).forEach(key => candidateKeys.add(key));
      }
    }

    // 計算相似度
    for (const candidateKey of Array.from(candidateKeys)) {
      const item = this.cache.get(candidateKey);
      if (!item || item.state !== options.state) continue;

      const similarity = this.calculateSimilarity(
        options.userInput,
        this.extractInputFromKey(candidateKey)
      );

      if (similarity >= SIMILARITY_THRESHOLD) {
        if (!bestMatch || similarity > bestMatch.score) {
          bestMatch = { key: candidateKey, score: similarity };
        }
      }
    }

    return bestMatch ? bestMatch.key : null;
  }

  /**
   * 計算文字相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const keywords1 = this.extractKeywords(text1);
    const keywords2 = this.extractKeywords(text2);

    if (keywords1.length === 0 || keywords2.length === 0) {
      return 0;
    }

    // Jaccard 相似度
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const union = Array.from(new Set([...keywords1, ...keywords2]));

    return intersection.length / union.length;
  }

  /**
   * 提取關鍵字
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      '的', '了', '是', '在', '我', '你', '他', '她', '它',
      '這', '那', '有', '和', '與', '或', '但', '因為', '所以',
      '嗎', '呢', '吧', '啊', '哦'
    ]);

    return text
      .toLowerCase()
      .split(/[\s，。！？、；：""''（）「」『』【】]/g)
      .filter(word => word.length >= 2 && !stopWords.has(word))
      .slice(0, 10); // 最多10個關鍵字
  }

  /**
   * 從快取鍵中提取輸入
   */
  private extractInputFromKey(key: string): string {
    const parts = key.split(':');
    return parts[1] || '';
  }

  /**
   * 更新關鍵字索引
   */
  private updateKeywordIndex(input: string, cacheKey: string): void {
    const keywords = this.extractKeywords(input);
    
    for (const keyword of keywords) {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(cacheKey);
    }
  }

  /**
   * 重寫回應以產生變化
   */
  private async rewriteResponse(
    original: string,
    state: StateType
  ): Promise<string> {
    try {
      // 根據狀態決定重寫策略
      const mood = this.getStateMood(state);
      const variation = this.generateVariation();

      const prompt = `
你現在處於${this.getStateDescription(state)}狀態。
請用${mood}的語氣，${variation}地重新表達以下內容：
"${original}"

要求：
1. 保持原意不變
2. 語氣符合當前狀態
3. 自然且不重複
4. 20-50字
`;

      // 使用 Gemini Flash 快速重寫
      const rewritten = await generateCustomerResponse(prompt, {
        useAdvancedModel: false,
        quickMode: true,
        maxOutputTokens: 150
      });

      return rewritten || original;
    } catch (error) {
      console.warn('重寫失敗，使用原始回應:', error);
      return original;
    }
  }

  /**
   * 獲取狀態描述
   */
  private getStateDescription(state: StateType): string {
    const descriptions: Record<StateType, string> = {
      [StateType.INITIAL]: '初次接觸',
      [StateType.INTERESTED]: '感興趣',
      [StateType.SKEPTICAL]: '懷疑',
      [StateType.PRICE_SHOCK]: '價格震驚',
      [StateType.NEGOTIATING]: '討價還價',
      [StateType.TECHNICAL_REVIEW]: '技術評估',
      [StateType.INTERNAL_DISCUSSION]: '內部討論',
      [StateType.READY_TO_BUY]: '準備購買',
      [StateType.OBJECTION]: '有異議',
      [StateType.CLOSING]: '即將成交',
      [StateType.LOST]: '失去興趣',
      [StateType.WON]: '成功成交'
    };
    return descriptions[state] || '一般';
  }

  /**
   * 獲取狀態對應的語氣
   */
  private getStateMood(state: StateType): string {
    const moods: Record<StateType, string> = {
      [StateType.INITIAL]: '禮貌但保持距離',
      [StateType.INTERESTED]: '積極且好奇',
      [StateType.SKEPTICAL]: '謹慎且懷疑',
      [StateType.PRICE_SHOCK]: '驚訝且抗拒',
      [StateType.NEGOTIATING]: '精明且算計',
      [StateType.TECHNICAL_REVIEW]: '專業且仔細',
      [StateType.INTERNAL_DISCUSSION]: '中立且保留',
      [StateType.READY_TO_BUY]: '友好且期待',
      [StateType.OBJECTION]: '堅定且防禦',
      [StateType.CLOSING]: '愉快且配合',
      [StateType.LOST]: '冷淡且疏離',
      [StateType.WON]: '滿意且友好'
    };
    return moods[state] || '平和';
  }

  /**
   * 生成變化指令
   */
  private generateVariation(): string {
    const variations = [
      '更委婉',
      '更直接',
      '加入一點疑問',
      '稍微猶豫',
      '更有自信',
      '略帶幽默',
      '更正式',
      '更口語化'
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  }

  /**
   * 檢查快取項是否過期
   */
  private isExpired(item: CacheItem): boolean {
    const age = Date.now() - item.timestamp.getTime();
    return age > CACHE_EXPIRATION_MS;
  }

  /**
   * 是否需要清理
   */
  private shouldCleanup(): boolean {
    const timeSinceLastCleanup = Date.now() - this.stats.lastCleanup.getTime();
    return timeSinceLastCleanup > 60 * 60 * 1000; // 每小時清理一次
  }

  /**
   * 清理過期項目
   */
  private cleanup(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.removeFromCache(key);
    }

    this.stats.lastCleanup = new Date();
    this.stats.cacheSize = this.cache.size;
  }

  /**
   * 驅逐最少使用的項目
   */
  private evictLeastUsed(): void {
    let leastUsed: { key: string; hitCount: number } | null = null;

    for (const [key, item] of Array.from(this.cache.entries())) {
      if (!leastUsed || item.hitCount < leastUsed.hitCount) {
        leastUsed = { key, hitCount: item.hitCount };
      }
    }

    if (leastUsed) {
      this.removeFromCache(leastUsed.key);
    }
  }

  /**
   * 從快取中移除項目
   */
  private removeFromCache(key: string): void {
    const item = this.cache.get(key);
    if (!item) return;

    // 從快取中刪除
    this.cache.delete(key);

    // 從關鍵字索引中刪除
    const input = this.extractInputFromKey(key);
    const keywords = this.extractKeywords(input);
    
    for (const keyword of keywords) {
      const keys = this.keywordIndex.get(keyword);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.keywordIndex.delete(keyword);
        }
      }
    }
  }

  /**
   * 獲取快取統計
   */
  getStats(): CacheStats & { hitRate: number } {
    const hitRate = this.stats.totalRequests > 0
      ? this.stats.hits / this.stats.totalRequests
      : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100
    };
  }

  /**
   * 清空快取
   */
  clear(): void {
    this.cache.clear();
    this.keywordIndex.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      cacheSize: 0,
      lastCleanup: new Date()
    };
  }

  /**
   * 預熱快取（載入常見回應）
   */
  async warmup(commonScenarios: Array<{
    state: StateType;
    inputs: string[];
    responses: string[];
    personaId?: string;
  }>): Promise<void> {
    for (const scenario of commonScenarios) {
      for (let i = 0; i < scenario.inputs.length; i++) {
        const response = scenario.responses[i % scenario.responses.length];
        
        this.store({
          state: scenario.state,
          userInput: scenario.inputs[i],
          personaId: scenario.personaId
        }, response);
      }
    }
  }
}