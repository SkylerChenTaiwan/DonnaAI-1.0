/**
 * 核心對話引擎
 * 整合所有 RolePlay 組件，管理對話流程
 */

import {
  DialogueSession,
  CustomerPersona,
  StateType,
  AIResponse,
  DialogueOptions,
  SessionMetrics,
  CompressedDialogue,
  ImportanceLevel,
  RolePlayError
} from '../../types/roleplay';

import { StateManager } from './stateManager';
import { DialogueCompressor, DialogueTurn } from './dialogueCompressor';
import { ResponseCache } from './responseCache';
import { generatePrompt, ROLEPLAY_PROMPTS, promptOptimizer } from './promptTemplates';
import { 
  getPersonaById, 
  generatePersonalityDescription,
  generatePersonaGreeting,
  getPersonaFocusPoints
} from './customerPersonas';

import {
  processRolePlayDialogue,
  analyzeCustomerState,
  generateCustomerResponse
} from '../api/gemini-integration';

// 對話引擎配置
interface EngineConfig {
  enableHints: boolean;
  compressionLevel: 'none' | 'light' | 'aggressive';
  useCache: boolean;
  maxTurns: number;
  costLimit: number; // 單次對話成本上限（美元）
}

// 對話引擎狀態
interface EngineState {
  session: DialogueSession;
  stateManager: StateManager;
  compressor: DialogueCompressor;
  cache: ResponseCache;
  dialogueHistory: DialogueTurn[];
  totalCost: number;
  config: EngineConfig;
}

/**
 * 對話引擎類別
 * 管理整個 RolePlay 對話流程
 */
export class DialogueEngine {
  private state: EngineState | null = null;
  private static instance: DialogueEngine;

  // 單例模式
  static getInstance(): DialogueEngine {
    if (!DialogueEngine.instance) {
      DialogueEngine.instance = new DialogueEngine();
    }
    return DialogueEngine.instance;
  }

  /**
   * 初始化新的對話會話
   */
  async initializeSession(
    userId: string,
    personaId: string,
    config: Partial<EngineConfig> = {}
  ): Promise<DialogueSession> {
    // 獲取客戶原型
    const persona = getPersonaById(personaId);
    if (!persona) {
      throw new RolePlayError('找不到指定的客戶原型', 'PERSONA_NOT_FOUND');
    }

    // 建立預設配置
    const fullConfig: EngineConfig = {
      enableHints: true,
      compressionLevel: 'light',
      useCache: true,
      maxTurns: 50,
      costLimit: 0.01,
      ...config
    };

    // 初始化組件
    const stateManager = new StateManager(persona.initialState);
    const compressor = new DialogueCompressor();
    const cache = new ResponseCache();

    // 建立會話
    const session: DialogueSession = {
      sessionId: this.generateSessionId(),
      userId,
      persona,
      currentState: stateManager.getCurrentStateInfo(),
      conversationHistory: [],
      metrics: {
        totalTurns: 0,
        trustProgression: [stateManager.getEmotionalMetrics().trust],
        stateChanges: [],
        keyMoments: []
      },
      startTime: new Date()
    };

    // 設定引擎狀態
    this.state = {
      session,
      stateManager,
      compressor,
      cache,
      dialogueHistory: [],
      totalCost: 0,
      config: fullConfig
    };

    // 預熱快取（如果啟用）
    if (fullConfig.useCache) {
      await this.warmupCache(persona);
    }

    return session;
  }

  /**
   * 獲取客戶的開場白
   */
  async getInitialGreeting(): Promise<string> {
    if (!this.state) {
      throw new RolePlayError('會話尚未初始化', 'SESSION_NOT_INITIALIZED');
    }

    const greeting = generatePersonaGreeting(this.state.session.persona);
    
    // 記錄到對話歷史
    this.state.dialogueHistory.push({
      speaker: 'customer',
      message: greeting,
      timestamp: new Date(),
      stateAtTime: this.state.session.currentState.id
    });

    return greeting;
  }

  /**
   * 處理用戶輸入並生成回應
   */
  async processUserInput(userInput: string): Promise<AIResponse> {
    if (!this.state) {
      throw new RolePlayError('會話尚未初始化', 'SESSION_NOT_INITIALIZED');
    }

    const startTime = Date.now();

    try {
      // 更新對話計數
      this.state.session.metrics.totalTurns++;

      // 檢查對話回合限制
      if (this.state.session.metrics.totalTurns > this.state.config.maxTurns) {
        throw new RolePlayError('已達到最大對話回合數', 'MAX_TURNS_REACHED');
      }

      // 記錄業務輸入
      this.state.dialogueHistory.push({
        speaker: 'salesperson',
        message: userInput,
        timestamp: new Date()
      });

      // 步驟 1: 檢查快取
      let customerResponse: string | null = null;
      
      if (this.state.config.useCache) {
        customerResponse = await this.state.cache.findSimilar({
          state: this.state.session.currentState.id,
          userInput,
          personaId: this.state.session.persona.id
        });
      }

      // 步驟 2: 準備對話上下文
      const compressedHistory = this.compressDialogueHistory();
      const contextPrompt = this.buildContextPrompt(compressedHistory);

      // 步驟 3: 分析狀態（如果需要）
      let stateAnalysisResult = null;
      const possibleTransitions = this.state.stateManager.analyzePossibleTransitions(userInput);
      
      if (possibleTransitions.length > 0 || !customerResponse) {
        stateAnalysisResult = await this.analyzeStateTransition(
          userInput,
          contextPrompt,
          possibleTransitions
        );
      }

      // 步驟 4: 生成客戶回應（如果快取未命中）
      if (!customerResponse) {
        customerResponse = await this.generateResponse(
          userInput,
          contextPrompt,
          stateAnalysisResult
        );

        // 儲存到快取
        if (this.state.config.useCache) {
          this.state.cache.store({
            state: this.state.session.currentState.id,
            userInput,
            personaId: this.state.session.persona.id
          }, customerResponse);
        }
      }

      // 步驟 5: 處理狀態轉換
      let stateChange = undefined;
      if (stateAnalysisResult && stateAnalysisResult.state !== this.state.session.currentState.id) {
        const transitioned = this.state.stateManager.transitionTo(
          stateAnalysisResult.state,
          stateAnalysisResult.reason
        );

        if (transitioned) {
          stateChange = {
            from: this.state.session.currentState.id,
            to: stateAnalysisResult.state,
            reason: stateAnalysisResult.reason
          };

          // 更新會話狀態
          this.state.session.currentState = this.state.stateManager.getCurrentStateInfo();
          this.state.session.metrics.stateChanges.push({
            ...stateChange,
            turn: this.state.session.metrics.totalTurns
          });

          // 記錄關鍵時刻
          this.recordKeyMoment('狀態轉換', stateAnalysisResult.reason);
        }
      }

      // 步驟 6: 生成提示（如果啟用）
      let hint: string | undefined;
      if (this.state.config.enableHints) {
        hint = await this.generateHint(customerResponse);
      }

      // 記錄客戶回應
      this.state.dialogueHistory.push({
        speaker: 'customer',
        message: customerResponse,
        timestamp: new Date(),
        stateAtTime: this.state.session.currentState.id,
        importance: this.determineImportance(customerResponse, stateChange)
      });

      // 更新指標
      this.updateMetrics();

      // 估算成本
      const responseCost = this.estimateCost();
      this.state.totalCost += responseCost;

      // 檢查成本限制
      if (this.state.totalCost > this.state.config.costLimit) {
        console.warn(`對話成本超過限制：$${this.state.totalCost.toFixed(4)}`);
      }

      // 記錄效能數據
      const responseTime = Date.now() - startTime;
      const confidence = stateAnalysisResult?.confidence || 0.9;
      
      promptOptimizer.recordUsage(
        'customerResponseFull',
        responseTime,
        confidence
      );

      // 構建回應
      const response: AIResponse = {
        customerResponse,
        stateChange,
        hint,
        confidence,
        internalThought: this.state.session.currentState.hiddenThoughts?.[0]
      };

      return response;

    } catch (error) {
      console.error('對話處理錯誤:', error);
      throw new RolePlayError(
        '對話處理失敗',
        'DIALOGUE_PROCESSING_ERROR',
        error
      );
    }
  }

  /**
   * 壓縮對話歷史
   */
  private compressDialogueHistory(): CompressedDialogue[] {
    if (!this.state) return [];

    return this.state.compressor.compress(
      this.state.dialogueHistory,
      {
        maxRecentTurns: 3,
        targetTokens: 200,
        compressionLevel: this.state.config.compressionLevel,
        preserveKeywords: getPersonaFocusPoints(this.state.session.persona)
      }
    );
  }

  /**
   * 建立對話上下文提示詞
   */
  private buildContextPrompt(compressed: CompressedDialogue[]): string {
    if (!this.state) return '';

    const formatted = this.state.compressor.formatCompressed(compressed);
    return formatted;
  }

  /**
   * 分析狀態轉換
   */
  private async analyzeStateTransition(
    userInput: string,
    context: string,
    possibleTransitions: any[]
  ): Promise<{
    state: StateType;
    confidence: number;
    reason: string;
    suggestedResponse?: string;
  }> {
    if (!this.state) {
      throw new RolePlayError('會話未初始化', 'SESSION_NOT_INITIALIZED');
    }

    const prompt = generatePrompt('stateAnalysis', {
      turnCount: this.state.session.metrics.totalTurns,
      trustLevel: this.state.stateManager.getEmotionalMetrics().trust,
      keyEvents: this.extractKeyEvents(),
      recentDialogue: context,
      userInput,
      availableStates: this.formatAvailableStates(possibleTransitions)
    });

    // 關鍵決策時使用進階模型
    const useAdvanced = this.isKeyDecisionPoint();

    return await analyzeCustomerState(prompt, useAdvanced);
  }

  /**
   * 生成客戶回應
   */
  private async generateResponse(
    userInput: string,
    context: string,
    stateAnalysis: any
  ): Promise<string> {
    if (!this.state) return '';

    const persona = this.state.session.persona;
    const currentState = this.state.session.currentState;
    const emotions = this.state.stateManager.getEmotionalMetrics();

    // 決定使用完整版還是精簡版
    const useQuickMode = 
      this.state.session.metrics.totalTurns > 20 || // 對話較長時
      currentState.id === StateType.INITIAL ||      // 初始狀態
      emotions.trust > 7;                           // 高信任度時

    let prompt: string;

    if (useQuickMode) {
      // 使用精簡版
      prompt = generatePrompt('customerResponseQuick', {
        personaName: persona.name,
        stateName: currentState.name,
        mood: this.getCurrentMood(),
        personality: generatePersonalityDescription(persona),
        userInput
      });
    } else {
      // 使用完整版
      prompt = generatePrompt('customerResponseFull', {
        personaName: persona.name,
        position: persona.profile.position,
        industry: persona.profile.industry,
        personalityDescription: generatePersonalityDescription(persona),
        stateName: currentState.name,
        stateDescription: currentState.description,
        openness: currentState.behaviors.openness,
        patience: currentState.behaviors.patience,
        trust: currentState.behaviors.trust,
        defensiveness: currentState.behaviors.defensiveness,
        painPoints: persona.profile.painPoints.join('、'),
        hiddenThoughts: currentState.hiddenThoughts?.join('；') || '無',
        conversationContext: context,
        userInput
      });
    }

    return await generateCustomerResponse(prompt, {
      useAdvancedModel: this.isKeyDecisionPoint(),
      quickMode: useQuickMode
    });
  }

  /**
   * 生成業務提示
   */
  private async generateHint(customerResponse: string): Promise<string> {
    if (!this.state) return '';

    const emotions = this.state.stateManager.getEmotionalMetrics();
    
    const prompt = generatePrompt('salesHint', {
      stateName: this.state.session.currentState.name,
      customerMessage: customerResponse,
      trust: emotions.trust,
      interest: emotions.interest
    });

    // 提示總是使用快速模式
    return await generateCustomerResponse(prompt, {
      useAdvancedModel: false,
      quickMode: true,
      maxOutputTokens: 50
    });
  }

  /**
   * 更新會話指標
   */
  private updateMetrics(): void {
    if (!this.state) return;

    const emotions = this.state.stateManager.getEmotionalMetrics();
    this.state.session.metrics.trustProgression.push(emotions.trust);

    // 檢測關鍵時刻
    if (emotions.trust >= 8 && this.state.session.metrics.trustProgression.length > 1) {
      const prevTrust = this.state.session.metrics.trustProgression[
        this.state.session.metrics.trustProgression.length - 2
      ];
      if (prevTrust < 8) {
        this.recordKeyMoment('建立高度信任', '信任度突破8分', 'positive');
      }
    }

    if (emotions.frustration >= 7) {
      this.recordKeyMoment('客戶情緒惡化', '挫折感達到7分', 'negative');
    }
  }

  /**
   * 記錄關鍵時刻
   */
  private recordKeyMoment(
    event: string,
    detail: string,
    impact: 'positive' | 'negative' | 'neutral' = 'neutral'
  ): void {
    if (!this.state) return;

    this.state.session.metrics.keyMoments.push({
      turn: this.state.session.metrics.totalTurns,
      event: `${event}: ${detail}`,
      impact
    });
  }

  /**
   * 結束對話會話
   */
  async endSession(feedbackNotes?: string): Promise<DialogueSession> {
    if (!this.state) {
      throw new RolePlayError('會話尚未初始化', 'SESSION_NOT_INITIALIZED');
    }

    // 設定結束時間
    this.state.session.endTime = new Date();
    
    // 加入回饋
    if (feedbackNotes) {
      this.state.session.feedbackNotes = feedbackNotes;
    }

    // 計算最終分數
    this.state.session.metrics.score = this.calculatePerformanceScore();

    // 決定最終結果
    const finalState = this.state.session.currentState.id;
    if (finalState === StateType.WON) {
      this.state.session.metrics.finalOutcome = 'won';
    } else if (finalState === StateType.LOST) {
      this.state.session.metrics.finalOutcome = 'lost';
    } else {
      this.state.session.metrics.finalOutcome = 'ongoing';
    }

    // 保存最終會話狀態
    const finalSession = { ...this.state.session };

    // 清理狀態
    this.state = null;

    return finalSession;
  }

  /**
   * 計算表現分數
   */
  private calculatePerformanceScore(): number {
    if (!this.state) return 0;

    let score = 50; // 基礎分數

    // 根據最終狀態調整
    const finalState = this.state.session.currentState.id;
    if (finalState === StateType.WON) {
      score += 30;
    } else if (finalState === StateType.CLOSING || finalState === StateType.READY_TO_BUY) {
      score += 20;
    } else if (finalState === StateType.LOST) {
      score -= 20;
    }

    // 根據信任度調整
    const finalTrust = this.state.stateManager.getEmotionalMetrics().trust;
    score += (finalTrust - 5) * 2; // 每點信任度±2分

    // 根據效率調整（回合數）
    const turns = this.state.session.metrics.totalTurns;
    if (turns < 15 && finalState === StateType.WON) {
      score += 10; // 快速成交加分
    } else if (turns > 30) {
      score -= 5; // 拖太久扣分
    }

    // 根據關鍵時刻調整
    const positiveEvents = this.state.session.metrics.keyMoments.filter(
      m => m.impact === 'positive'
    ).length;
    const negativeEvents = this.state.session.metrics.keyMoments.filter(
      m => m.impact === 'negative'
    ).length;
    
    score += (positiveEvents - negativeEvents) * 3;

    // 限制在 0-100 範圍
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 獲取對話分析報告
   */
  getSessionAnalysis(): {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  } | null {
    if (!this.state) return null;

    const analysis = {
      summary: this.generateSessionSummary(),
      strengths: this.identifyStrengths(),
      weaknesses: this.identifyWeaknesses(),
      suggestions: this.generateSuggestions()
    };

    return analysis;
  }

  /**
   * 輔助方法：生成會話摘要
   */
  private generateSessionSummary(): string {
    if (!this.state) return '';

    const outcome = this.state.session.metrics.finalOutcome || 'ongoing';
    const turns = this.state.session.metrics.totalTurns;
    const stateChanges = this.state.session.metrics.stateChanges.length;

    return `${turns}回合對話，經歷${stateChanges}次狀態轉換，結果：${outcome}`;
  }

  /**
   * 輔助方法：識別優勢
   */
  private identifyStrengths(): string[] {
    if (!this.state) return [];

    const strengths: string[] = [];
    const emotions = this.state.stateManager.getEmotionalMetrics();

    if (emotions.trust >= 7) {
      strengths.push('成功建立客戶信任');
    }

    if (this.state.session.metrics.totalTurns < 20 && 
        this.state.session.currentState.id === StateType.CLOSING) {
      strengths.push('高效推進銷售進程');
    }

    const positiveEvents = this.state.session.metrics.keyMoments.filter(
      m => m.impact === 'positive'
    ).length;
    if (positiveEvents >= 3) {
      strengths.push('多次創造正面轉折');
    }

    return strengths;
  }

  /**
   * 輔助方法：識別弱點
   */
  private identifyWeaknesses(): string[] {
    if (!this.state) return [];

    const weaknesses: string[] = [];
    const emotions = this.state.stateManager.getEmotionalMetrics();

    if (emotions.frustration >= 6) {
      weaknesses.push('未能有效處理客戶情緒');
    }

    if (emotions.trust <= 3) {
      weaknesses.push('未能建立基本信任');
    }

    const negativeEvents = this.state.session.metrics.keyMoments.filter(
      m => m.impact === 'negative'
    ).length;
    if (negativeEvents >= 3) {
      weaknesses.push('多次錯失機會或處理不當');
    }

    return weaknesses;
  }

  /**
   * 輔助方法：生成建議
   */
  private generateSuggestions(): string[] {
    if (!this.state) return [];

    const suggestions: string[] = [];
    
    suggestions.push(this.state.stateManager.getSuggestedStrategy());

    if (this.state.session.metrics.totalTurns > 30) {
      suggestions.push('嘗試更快識別客戶需求，避免對話過長');
    }

    if (this.state.session.currentState.id === StateType.OBJECTION) {
      suggestions.push('學習更多異議處理技巧');
    }

    return suggestions;
  }

  /**
   * 輔助方法：提取關鍵事件
   */
  private extractKeyEvents(): string {
    if (!this.state) return '無';

    return this.state.session.metrics.keyMoments
      .slice(-3) // 最近3個
      .map(m => m.event)
      .join('；') || '無';
  }

  /**
   * 輔助方法：格式化可用狀態
   */
  private formatAvailableStates(transitions: any[]): string {
    return transitions
      .map(t => `${t.toState}: ${t.condition}`)
      .join('\n');
  }

  /**
   * 輔助方法：判斷是否為關鍵決策點
   */
  private isKeyDecisionPoint(): boolean {
    if (!this.state) return false;

    const currentState = this.state.session.currentState.id;
    const keyStates = [
      StateType.NEGOTIATING,
      StateType.READY_TO_BUY,
      StateType.CLOSING,
      StateType.OBJECTION
    ];

    return keyStates.includes(currentState);
  }

  /**
   * 輔助方法：獲取當前情緒
   */
  private getCurrentMood(): string {
    if (!this.state) return '中性';

    const emotions = this.state.stateManager.getEmotionalMetrics();
    
    if (emotions.frustration >= 7) return '沮喪';
    if (emotions.excitement >= 7) return '興奮';
    if (emotions.trust >= 7) return '信任';
    if (emotions.interest >= 7) return '感興趣';
    if (emotions.trust <= 3) return '懷疑';
    
    return '中性';
  }

  /**
   * 輔助方法：判斷重要性
   */
  private determineImportance(
    message: string,
    stateChange?: any
  ): ImportanceLevel {
    if (stateChange) return ImportanceLevel.CRITICAL;
    
    if (message.includes('決定') || message.includes('同意')) {
      return ImportanceLevel.CRITICAL;
    }
    
    if (message.includes('但是') || message.includes('擔心')) {
      return ImportanceLevel.IMPORTANT;
    }

    return ImportanceLevel.NORMAL;
  }

  /**
   * 輔助方法：估算成本
   */
  private estimateCost(): number {
    // Gemini Flash: $0.075/百萬字元
    // Gemini Pro: $0.30/百萬字元
    // 假設平均每次呼叫 1000 字元
    const flashCostPerCall = 0.075 / 1000; // $0.000075
    const proCostPerCall = 0.30 / 1000;    // $0.0003

    // 根據是否使用進階模型計算
    return this.isKeyDecisionPoint() ? proCostPerCall : flashCostPerCall;
  }

  /**
   * 輔助方法：預熱快取
   */
  private async warmupCache(persona: CustomerPersona): Promise<void> {
    // 為常見場景預載入回應
    const commonScenarios = [
      {
        state: StateType.INITIAL,
        inputs: ['你好', '請問有什麼事', '介紹一下'],
        responses: persona.profile.personality.friendly > 7 
          ? ['您好！請問怎麼稱呼？', '歡迎！有什麼可以幫您？']
          : ['什麼事？', '請說重點']
      },
      {
        state: StateType.PRICE_SHOCK,
        inputs: ['這是市場價格', '物超所值', '投資回報很高'],
        responses: ['還是太貴了', '超出我們預算', '需要再考慮']
      }
    ];

    await this.state?.cache.warmup(commonScenarios.map(s => ({
      ...s,
      personaId: persona.id
    })));
  }

  /**
   * 輔助方法：生成會話ID
   */
  private generateSessionId(): string {
    return `roleplay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取當前會話狀態（用於除錯）
   */
  getCurrentState(): any {
    if (!this.state) return null;

    return {
      sessionId: this.state.session.sessionId,
      currentState: this.state.session.currentState.id,
      turns: this.state.session.metrics.totalTurns,
      emotions: this.state.stateManager.getEmotionalMetrics(),
      totalCost: this.state.totalCost,
      cacheStats: this.state.cache.getStats()
    };
  }
}

// 匯出單例
export const dialogueEngine = DialogueEngine.getInstance();