/**
 * 對話壓縮器
 * 將冗長的對話歷史壓縮成精簡的摘要，減少 AI API 使用成本
 */

import {
  CompressedDialogue,
  ImportanceLevel,
  StateType
} from '../../types/roleplay';

// 對話回合介面
export interface DialogueTurn {
  speaker: 'salesperson' | 'customer';
  message: string;
  timestamp: Date;
  stateAtTime?: StateType;
  importance?: ImportanceLevel;
}

// 壓縮選項
export interface CompressionOptions {
  maxRecentTurns: number;        // 保留最近幾輪完整對話
  targetTokens: number;          // 目標 token 數
  compressionLevel: 'none' | 'light' | 'aggressive';
  preserveKeywords: string[];    // 必須保留的關鍵字
}

// 關鍵字權重映射
const KEYWORD_WEIGHTS: Record<string, number> = {
  // 商業關鍵字
  '價格': 10,
  '預算': 10,
  '費用': 10,
  '折扣': 9,
  '合約': 9,
  '簽約': 10,
  
  // 決策關鍵字
  '決定': 8,
  '同意': 9,
  '批准': 9,
  '拒絕': 8,
  '考慮': 7,
  
  // 技術關鍵字
  '整合': 7,
  '安全': 7,
  '功能': 6,
  '需求': 8,
  
  // 情緒關鍵字
  '擔心': 8,
  '滿意': 7,
  '失望': 8,
  '興奮': 7,
  
  // 時間關鍵字
  '立即': 8,
  '緊急': 9,
  '下週': 6,
  '明天': 7
};

/**
 * 對話壓縮器類別
 */
export class DialogueCompressor {
  /**
   * 壓縮對話歷史
   */
  compress(
    dialogueHistory: DialogueTurn[],
    options: CompressionOptions = {
      maxRecentTurns: 3,
      targetTokens: 200,
      compressionLevel: 'light',
      preserveKeywords: []
    }
  ): CompressedDialogue[] {
    if (dialogueHistory.length === 0) {
      return [];
    }

    // 步驟 1: 分類對話重要性
    const classifiedTurns = this.classifyImportance(dialogueHistory);

    // 步驟 2: 根據壓縮等級處理
    switch (options.compressionLevel) {
      case 'none':
        return this.noCompression(classifiedTurns);
      case 'aggressive':
        return this.aggressiveCompression(classifiedTurns, options);
      case 'light':
      default:
        return this.lightCompression(classifiedTurns, options);
    }
  }

  /**
   * 分類對話重要性
   */
  private classifyImportance(turns: DialogueTurn[]): DialogueTurn[] {
    return turns.map(turn => {
      const importance = this.calculateImportance(turn);
      return { ...turn, importance };
    });
  }

  /**
   * 計算單個對話的重要性
   */
  private calculateImportance(turn: DialogueTurn): ImportanceLevel {
    const message = turn.message.toLowerCase();
    let score = 0;

    // 檢查關鍵字
    for (const [keyword, weight] of Object.entries(KEYWORD_WEIGHTS)) {
      if (message.includes(keyword.toLowerCase())) {
        score += weight;
      }
    }

    // 檢查特殊模式
    if (this.containsPrice(message)) score += 15;
    if (this.containsDecision(message)) score += 12;
    if (this.containsObjection(message)) score += 10;
    if (this.containsAgreement(message)) score += 12;
    if (this.isQuestion(message)) score += 5;

    // 狀態轉換時的對話更重要
    if (turn.stateAtTime && this.isTransitionState(turn.stateAtTime)) {
      score += 8;
    }

    // 根據分數決定重要性
    if (score >= 20) return ImportanceLevel.CRITICAL;
    if (score >= 12) return ImportanceLevel.IMPORTANT;
    if (score >= 5) return ImportanceLevel.NORMAL;
    return ImportanceLevel.TRIVIAL;
  }

  /**
   * 無壓縮（保留所有對話）
   */
  private noCompression(turns: DialogueTurn[]): CompressedDialogue[] {
    return turns.map((turn, index) => ({
      turnNumber: index + 1,
      summary: turn.message,
      keyPoints: this.extractKeyPoints(turn.message),
      emotionMetrics: this.analyzeEmotion(turn.message),
      importance: turn.importance || ImportanceLevel.NORMAL,
      timestamp: turn.timestamp
    }));
  }

  /**
   * 輕度壓縮
   */
  private lightCompression(
    turns: DialogueTurn[],
    options: CompressionOptions
  ): CompressedDialogue[] {
    const compressed: CompressedDialogue[] = [];
    const recentStartIndex = Math.max(0, turns.length - options.maxRecentTurns);

    // 處理舊對話（壓縮）
    if (recentStartIndex > 0) {
      const oldTurns = turns.slice(0, recentStartIndex);
      const compressedOld = this.compressOldDialogue(oldTurns, 'light');
      compressed.push(...compressedOld);
    }

    // 保留最近對話（完整）
    const recentTurns = turns.slice(recentStartIndex);
    for (let i = 0; i < recentTurns.length; i++) {
      const turn = recentTurns[i];
      compressed.push({
        turnNumber: recentStartIndex + i + 1,
        summary: turn.message,
        keyPoints: this.extractKeyPoints(turn.message),
        emotionMetrics: this.analyzeEmotion(turn.message),
        importance: turn.importance || ImportanceLevel.NORMAL,
        timestamp: turn.timestamp
      });
    }

    return compressed;
  }

  /**
   * 積極壓縮
   */
  private aggressiveCompression(
    turns: DialogueTurn[],
    options: CompressionOptions
  ): CompressedDialogue[] {
    const compressed: CompressedDialogue[] = [];
    const recentStartIndex = Math.max(0, turns.length - options.maxRecentTurns);

    // 只保留關鍵對話的摘要
    const oldTurns = turns.slice(0, recentStartIndex);
    const criticalOld = oldTurns.filter(
      t => t.importance === ImportanceLevel.CRITICAL || 
           t.importance === ImportanceLevel.IMPORTANT
    );

    // 批量壓縮關鍵對話
    if (criticalOld.length > 0) {
      const batchSummary = this.batchSummarize(criticalOld);
      compressed.push({
        turnNumber: 0, // 批量摘要
        summary: batchSummary,
        keyPoints: this.extractBatchKeyPoints(criticalOld),
        emotionMetrics: this.analyzeBatchEmotion(criticalOld),
        importance: ImportanceLevel.CRITICAL,
        timestamp: criticalOld[0].timestamp
      });
    }

    // 最近對話也要壓縮
    const recentTurns = turns.slice(recentStartIndex);
    for (let i = 0; i < recentTurns.length; i++) {
      const turn = recentTurns[i];
      compressed.push({
        turnNumber: recentStartIndex + i + 1,
        summary: this.summarizeTurn(turn),
        keyPoints: this.extractKeyPoints(turn.message, 3), // 只保留3個要點
        emotionMetrics: this.analyzeEmotion(turn.message),
        importance: turn.importance || ImportanceLevel.NORMAL,
        timestamp: turn.timestamp
      });
    }

    return compressed;
  }

  /**
   * 壓縮舊對話
   */
  private compressOldDialogue(
    turns: DialogueTurn[],
    level: 'light' | 'aggressive'
  ): CompressedDialogue[] {
    const compressed: CompressedDialogue[] = [];
    const batchSize = level === 'light' ? 5 : 10;

    // 分批處理
    for (let i = 0; i < turns.length; i += batchSize) {
      const batch = turns.slice(i, i + batchSize);
      
      // 如果批次中有重要對話，單獨處理
      const hasImportant = batch.some(
        t => t.importance === ImportanceLevel.CRITICAL ||
             t.importance === ImportanceLevel.IMPORTANT
      );

      if (hasImportant) {
        // 重要對話單獨保留
        batch.forEach((turn, index) => {
          if (turn.importance === ImportanceLevel.CRITICAL ||
              turn.importance === ImportanceLevel.IMPORTANT) {
            compressed.push({
              turnNumber: i + index + 1,
              summary: this.summarizeTurn(turn),
              keyPoints: this.extractKeyPoints(turn.message),
              emotionMetrics: this.analyzeEmotion(turn.message),
              importance: turn.importance!,
              timestamp: turn.timestamp
            });
          }
        });
      } else {
        // 一般對話批量壓縮
        compressed.push({
          turnNumber: i + 1,
          summary: this.batchSummarize(batch),
          keyPoints: this.extractBatchKeyPoints(batch),
          emotionMetrics: this.analyzeBatchEmotion(batch),
          importance: ImportanceLevel.NORMAL,
          timestamp: batch[0].timestamp
        });
      }
    }

    return compressed;
  }

  /**
   * 提取關鍵要點
   */
  private extractKeyPoints(message: string, maxPoints: number = 5): string[] {
    const keyPoints: string[] = [];
    const sentences = message.split(/[。！？]/);

    for (const sentence of sentences) {
      if (sentence.trim().length < 5) continue;

      // 檢查是否包含關鍵資訊
      let isKeyPoint = false;
      for (const keyword of Object.keys(KEYWORD_WEIGHTS)) {
        if (sentence.includes(keyword)) {
          isKeyPoint = true;
          break;
        }
      }

      if (isKeyPoint) {
        keyPoints.push(sentence.trim());
      }

      if (keyPoints.length >= maxPoints) break;
    }

    return keyPoints;
  }

  /**
   * 批量提取關鍵要點
   */
  private extractBatchKeyPoints(turns: DialogueTurn[]): string[] {
    const allKeyPoints: string[] = [];
    
    for (const turn of turns) {
      const points = this.extractKeyPoints(turn.message, 2);
      allKeyPoints.push(...points);
    }

    // 去重並限制數量
    return Array.from(new Set(allKeyPoints)).slice(0, 5);
  }

  /**
   * 分析情緒
   */
  private analyzeEmotion(message: string): Record<string, number> {
    const emotions = {
      trust: 5,
      interest: 5,
      frustration: 0,
      excitement: 0
    };

    const lowerMessage = message.toLowerCase();

    // 正面情緒
    if (lowerMessage.includes('很好') || lowerMessage.includes('不錯') || 
        lowerMessage.includes('滿意')) {
      emotions.trust += 2;
      emotions.interest += 1;
    }

    if (lowerMessage.includes('有興趣') || lowerMessage.includes('想了解')) {
      emotions.interest += 3;
      emotions.excitement += 1;
    }

    // 負面情緒
    if (lowerMessage.includes('擔心') || lowerMessage.includes('懷疑') ||
        lowerMessage.includes('不確定')) {
      emotions.trust -= 2;
      emotions.frustration += 1;
    }

    if (lowerMessage.includes('太貴') || lowerMessage.includes('超出預算')) {
      emotions.frustration += 2;
      emotions.interest -= 1;
    }

    // 正規化到 0-10
    for (const key in emotions) {
      emotions[key] = Math.max(0, Math.min(10, emotions[key]));
    }

    return emotions;
  }

  /**
   * 批量分析情緒
   */
  private analyzeBatchEmotion(turns: DialogueTurn[]): Record<string, number> {
    const totalEmotions = {
      trust: 0,
      interest: 0,
      frustration: 0,
      excitement: 0
    };

    for (const turn of turns) {
      const emotions = this.analyzeEmotion(turn.message);
      for (const key in emotions) {
        totalEmotions[key] += emotions[key];
      }
    }

    // 計算平均值
    const turnCount = turns.length;
    for (const key in totalEmotions) {
      totalEmotions[key] = Math.round(totalEmotions[key] / turnCount);
    }

    return totalEmotions;
  }

  /**
   * 摘要單個對話
   */
  private summarizeTurn(turn: DialogueTurn): string {
    const speaker = turn.speaker === 'salesperson' ? '業務' : '客戶';
    const message = turn.message;

    // 提取核心內容
    if (this.containsPrice(message)) {
      const priceMatch = message.match(/\d+[萬千百]?元?/);
      return `${speaker}：討論價格${priceMatch ? ' ' + priceMatch[0] : ''}`;
    }

    if (this.containsDecision(message)) {
      return `${speaker}：做出決定`;
    }

    if (this.containsObjection(message)) {
      return `${speaker}：提出異議`;
    }

    // 一般摘要：保留前30字
    const truncated = message.length > 30 ? message.substring(0, 30) + '...' : message;
    return `${speaker}：${truncated}`;
  }

  /**
   * 批量摘要
   */
  private batchSummarize(turns: DialogueTurn[]): string {
    const topics = new Set<string>();
    let hasPrice = false;
    let hasDecision = false;
    let hasObjection = false;

    for (const turn of turns) {
      if (this.containsPrice(turn.message)) hasPrice = true;
      if (this.containsDecision(turn.message)) hasDecision = true;
      if (this.containsObjection(turn.message)) hasObjection = true;

      // 提取主題
      const keyPoints = this.extractKeyPoints(turn.message, 1);
      keyPoints.forEach(point => topics.add(point));
    }

    const summaryParts: string[] = [];
    if (hasPrice) summaryParts.push('討論價格');
    if (hasDecision) summaryParts.push('決策過程');
    if (hasObjection) summaryParts.push('處理異議');
    
    if (summaryParts.length === 0) {
      summaryParts.push('一般討論');
    }

    return `${turns.length}輪對話：${summaryParts.join('、')}`;
  }

  /**
   * 輔助方法：檢查是否包含價格資訊
   */
  private containsPrice(message: string): boolean {
    return /價格|費用|成本|預算|報價|多少錢/.test(message);
  }

  /**
   * 輔助方法：檢查是否包含決策
   */
  private containsDecision(message: string): boolean {
    return /決定|同意|批准|確定|成交|簽約/.test(message);
  }

  /**
   * 輔助方法：檢查是否包含異議
   */
  private containsObjection(message: string): boolean {
    return /但是|可是|擔心|問題|困難|不行/.test(message);
  }

  /**
   * 輔助方法：檢查是否包含同意
   */
  private containsAgreement(message: string): boolean {
    return /好的|可以|沒問題|同意|OK/.test(message);
  }

  /**
   * 輔助方法：檢查是否為問句
   */
  private isQuestion(message: string): boolean {
    return /嗎|呢|？|什麼|如何|怎麼/.test(message);
  }

  /**
   * 輔助方法：檢查是否為轉換狀態
   */
  private isTransitionState(state: StateType): boolean {
    const transitionStates = [
      StateType.INTERESTED,
      StateType.PRICE_SHOCK,
      StateType.NEGOTIATING,
      StateType.READY_TO_BUY,
      StateType.OBJECTION,
      StateType.CLOSING
    ];
    return transitionStates.includes(state);
  }

  /**
   * 估算壓縮後的 token 數
   */
  estimateTokens(compressed: CompressedDialogue[]): number {
    let totalChars = 0;

    for (const dialogue of compressed) {
      totalChars += dialogue.summary.length;
      totalChars += dialogue.keyPoints.join('').length;
    }

    // 粗略估算：中文約 2 字元 = 1 token
    return Math.ceil(totalChars / 2);
  }

  /**
   * 格式化壓縮結果為文字
   */
  formatCompressed(compressed: CompressedDialogue[]): string {
    const parts: string[] = [];

    for (const dialogue of compressed) {
      if (dialogue.turnNumber === 0) {
        // 批量摘要
        parts.push(`[歷史摘要] ${dialogue.summary}`);
      } else {
        // 單輪對話
        const importance = dialogue.importance === ImportanceLevel.CRITICAL ? '⚠️' :
                          dialogue.importance === ImportanceLevel.IMPORTANT ? '❗' : '';
        parts.push(`${importance}回合${dialogue.turnNumber}: ${dialogue.summary}`);
      }

      // 只為重要對話加入關鍵點
      if (dialogue.importance === ImportanceLevel.CRITICAL && dialogue.keyPoints.length > 0) {
        parts.push(`  要點: ${dialogue.keyPoints.join('; ')}`);
      }
    }

    return parts.join('\n');
  }
}