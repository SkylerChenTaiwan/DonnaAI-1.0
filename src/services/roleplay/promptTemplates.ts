/**
 * Prompt 模板管理系統
 * 集中管理所有 AI RolePlay 系統的提示詞，方便修改和優化
 */

import { StateType, PromptTemplate, PromptVariables } from '../../types/roleplay';

/**
 * RolePlay 系統的所有 Prompt 模板
 * 集中在此處，方便未來優化和 A/B 測試
 */
export const ROLEPLAY_PROMPTS = {
  // ===== 基礎系統 Prompts =====
  
  /**
   * 基礎系統提示
   * 定義客戶角色的基本行為
   */
  baseSystemPrompt: {
    template: `你現在扮演{{name}}，{{position}}，在{{industry}}工作。
個性特點：{{personality}}
態度傾向：{{attitude}}
主要反對理由：{{objections}}
感興趣的關鍵詞：{{buzzwords}}

請根據這個角色設定，以自然、真實的方式與業務員對話。`,
    variables: ['name', 'position', 'industry', 'personality', 'attitude', 'objections', 'buzzwords'],
    description: '客戶角色的基礎設定'
  } as PromptTemplate,
  
  // ===== 狀態分析相關 Prompts =====
  
  /**
   * 狀態分析 Prompt
   * 用於分析客戶當前的心理狀態
   */
  stateAnalysis: {
    template: `你是一個銷售對話分析專家。請根據以下對話歷史，判斷客戶當前的心理狀態。

# 對話摘要
- 已進行回合：{{turnCount}}
- 信任程度：{{trustLevel}}/10
- 關鍵事件：{{keyEvents}}

# 最近對話
{{recentDialogue}}

# 業務最新發言
{{userInput}}

# 可選狀態
{{availableStates}}

請分析客戶最可能處於哪個狀態，並說明原因。
輸出格式：使用 function calling 返回結構化資料`,
    variables: ['turnCount', 'trustLevel', 'keyEvents', 'recentDialogue', 'userInput', 'availableStates'],
    description: '分析客戶心理狀態的主要提示詞'
  } as PromptTemplate,

  /**
   * 狀態轉換分析 Prompt
   * 判斷是否應該轉換狀態
   */
  stateTransition: {
    template: `當前狀態：{{currentState}}
客戶剛說：「{{customerLastMessage}}」
業務回應：「{{userInput}}」

可能的狀態轉換：
{{possibleTransitions}}

請判斷是否應該轉換狀態，如果是，轉換到哪個狀態？為什麼？`,
    variables: ['currentState', 'customerLastMessage', 'userInput', 'possibleTransitions'],
    description: '判斷狀態轉換的提示詞'
  } as PromptTemplate,

  // ===== 客戶回應生成 Prompts =====

  /**
   * 客戶回應 Prompt - 完整版
   * 用於生成詳細、自然的客戶回應
   */
  customerResponseFull: {
    template: `# 角色設定
你現在是{{personaName}}，{{position}}，在{{industry}}產業工作。

# 個性特徵
{{personalityDescription}}

# 目前心理狀態：{{stateName}}
{{stateDescription}}

# 行為準則
- 開放程度：{{openness}}/10
- 耐心程度：{{patience}}/10
- 信任程度：{{trust}}/10
- 防禦心理：{{defensiveness}}/10

# 你的痛點
{{painPoints}}

# 內心想法（不要直接說出來）
{{hiddenThoughts}}

# 對話背景
{{conversationContext}}

業務剛說：「{{userInput}}」

請以{{personaName}}的身份，用符合當前心理狀態的方式回應。
要求：
1. 自然對話，不要太配合
2. 根據心理狀態調整語氣
3. 適當表現個性特徵
4. 回應長度：1-3句話`,
    variables: [
      'personaName', 'position', 'industry', 'personalityDescription',
      'stateName', 'stateDescription', 'openness', 'patience', 'trust',
      'defensiveness', 'painPoints', 'hiddenThoughts', 'conversationContext',
      'userInput'
    ],
    description: '生成完整客戶回應的主要提示詞'
  } as PromptTemplate,

  /**
   * 客戶回應 Prompt - 精簡版
   * 用於快速生成簡短回應（省錢）
   */
  customerResponseQuick: {
    template: `你是{{personaName}}，正處於{{stateName}}狀態。
語氣：{{mood}}
個性：{{personality}}
業務說：「{{userInput}}」

用1句話回應（20-40字），要符合你的狀態和個性。`,
    variables: ['personaName', 'stateName', 'mood', 'personality', 'userInput'],
    description: '快速生成客戶回應的精簡提示詞'
  } as PromptTemplate,

  /**
   * 特定狀態回應模板
   * 針對不同狀態的專門提示詞
   */
  stateSpecificResponses: {
    [StateType.INITIAL]: {
      template: `你是第一次接觸這個業務員。
保持禮貌但有距離感，不要太快相信對方。
常用語：「請問你們是...」「我們目前...」「可以簡單介紹嗎？」
業務說：「{{userInput}}」
回應（1句話）：`,
      variables: ['userInput']
    },
    [StateType.SKEPTICAL]: {
      template: `你對業務的說法感到懷疑。
表現出不太相信，需要更多證據。
常用語：「真的嗎？」「但是我聽說...」「有什麼證明嗎？」
業務說：「{{userInput}}」
回應（1句話）：`,
      variables: ['userInput']
    },
    [StateType.PRICE_SHOCK]: {
      template: `你對價格感到震驚。
表現出價格超出預期，需要理由接受。
常用語：「這麼貴！」「超出預算」「為什麼要這個價格？」
業務說：「{{userInput}}」
回應（1句話）：`,
      variables: ['userInput']
    },
    [StateType.NEGOTIATING]: {
      template: `你正在討價還價。
表現精明，試圖獲得更好條件。
常用語：「能不能...」「如果我們...可以便宜點嗎？」「競爭對手...」
業務說：「{{userInput}}」
回應（1句話）：`,
      variables: ['userInput']
    }
  },

  // ===== 提示生成 Prompts =====

  /**
   * 業務提示生成
   * 給業務員的即時建議
   */
  salesHint: {
    template: `客戶狀態：{{stateName}}
客戶剛說：「{{customerMessage}}」
情緒指標：信任{{trust}}/10，興趣{{interest}}/10

請給業務員一個簡短建議（不超過20字）。`,
    variables: ['stateName', 'customerMessage', 'trust', 'interest'],
    description: '生成業務提示的提示詞'
  } as PromptTemplate,

  /**
   * 策略建議生成
   * 更詳細的銷售策略
   */
  strategyAdvice: {
    template: `# 當前情況
狀態：{{stateName}}
已談{{turnCount}}回合
主要異議：{{mainObjections}}
客戶個性：{{personalityType}}

# 對話趨勢
{{trendAnalysis}}

請提供3個具體的應對策略，每個不超過30字。`,
    variables: ['stateName', 'turnCount', 'mainObjections', 'personalityType', 'trendAnalysis'],
    description: '生成銷售策略建議'
  } as PromptTemplate,

  // ===== 對話分析 Prompts =====

  /**
   * 對話品質評估
   * 評估業務員的表現
   */
  performanceEvaluation: {
    template: `# 對話記錄
{{dialogueHistory}}

# 評估標準
- 需求挖掘（是否了解客戶需求）
- 價值傳遞（是否清楚說明價值）
- 異議處理（是否妥善處理反對意見）
- 關係建立（是否建立信任）
- 推進技巧（是否有效推進銷售進程）

請為每個標準評分（1-10）並給出改進建議。`,
    variables: ['dialogueHistory'],
    description: '評估業務員表現'
  } as PromptTemplate,

  /**
   * 關鍵時刻識別
   * 找出對話中的關鍵轉折點
   */
  criticalMomentDetection: {
    template: `分析以下對話，找出3-5個關鍵時刻：
{{dialogueHistory}}

關鍵時刻定義：
- 客戶態度明顯轉變
- 重要資訊披露
- 決策點出現
- 錯失機會

輸出格式：
時刻X：[回合數] [描述] [影響]`,
    variables: ['dialogueHistory'],
    description: '識別對話中的關鍵時刻'
  } as PromptTemplate,

  /**
   * AI 教練分析
   * 提供即時的銷售指導
   */
  coachAnalysis: {
    template: `# 角色設定
你是一位資深銷售教練，正在指導業務人員進行 RolePlay 訓練。

# 當前情況
客戶狀態：{{currentState}}
信任度：{{trustLevel}}/10
興趣度：{{interestLevel}}/10
對話回合：{{turnCount}}

# 最近對話（最新3輪）
{{recentMessages}}

# 分析重點
1. 業務員做得好的地方
2. 需要改進的地方
3. 下一步建議

請提供簡潔明確的建議（不超過100字），幫助業務員提升表現。`,
    variables: ['currentState', 'trustLevel', 'interestLevel', 'turnCount', 'recentMessages'],
    description: 'AI 教練即時分析和建議'
  } as PromptTemplate,

  /**
   * 關鍵時刻教練建議
   * 針對特定情境的建議
   */
  criticalMomentCoaching: {
    template: `# 關鍵時刻識別
當前狀態：{{currentState}}
前一狀態：{{previousState}}
狀態變化原因：{{stateChangeReason}}

# 教練重點
{{coachingFocus}}

請提供針對性的建議，幫助業務員掌握這個關鍵時刻。`,
    variables: ['currentState', 'previousState', 'stateChangeReason', 'coachingFocus'],
    description: '關鍵時刻的教練建議'
  } as PromptTemplate,

  // ===== 系統指令 Prompts =====

  /**
   * 角色扮演系統指令
   * 整體行為準則
   */
  systemInstruction: {
    template: `你是一個專業的客戶角色扮演系統，用於訓練業務人員。

核心原則：
1. 真實性：表現得像真實客戶，不要太配合
2. 一致性：保持角色個性和狀態的一致
3. 挑戰性：適當給予業務員挑戰
4. 教育性：通過互動幫助業務員學習

禁止行為：
- 不要直接說出內心想法
- 不要無理取鬧
- 不要偏離角色設定
- 不要給出不切實際的回應

記住：你的目標是幫助業務員在安全環境中練習和提升。`,
    variables: [],
    description: '系統級別的行為指導'
  } as PromptTemplate
};

/**
 * Prompt 生成函數（類型安全）
 * 根據模板和變數生成最終的 prompt
 */
export function generatePrompt(
  promptKey: string,
  variables: PromptVariables
): string {
  // 支援巢狀鍵（如 'stateSpecificResponses.INITIAL'）
  const keys = promptKey.split('.');
  let prompt: any = ROLEPLAY_PROMPTS;
  
  for (const key of keys) {
    prompt = prompt[key];
    if (!prompt) {
      throw new Error(`找不到 Prompt 模板：${promptKey}`);
    }
  }

  // 確保是有效的模板
  if (!prompt.template) {
    throw new Error(`無效的 Prompt 模板：${promptKey}`);
  }

  let result = prompt.template;
  
  // 替換變數
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }
  
  // 檢查是否有未替換的變數
  const unreplaced = result.match(/{{(\w+)}}/g);
  if (unreplaced) {
    console.warn(`Prompt 中有未替換的變數：${unreplaced.join(', ')}`);
  }
  
  return result;
}

/**
 * 批量生成 prompts
 * 用於預先生成多個場景的 prompts
 */
export function batchGeneratePrompts(
  configs: Array<{
    promptKey: string;
    variables: PromptVariables;
  }>
): string[] {
  return configs.map(config => 
    generatePrompt(config.promptKey, config.variables)
  );
}

/**
 * 獲取 prompt 模板資訊
 * 用於除錯和文件生成
 */
export function getPromptInfo(promptKey: string): {
  template: string;
  variables: string[];
  description?: string;
} {
  const keys = promptKey.split('.');
  let prompt: any = ROLEPLAY_PROMPTS;
  
  for (const key of keys) {
    prompt = prompt[key];
    if (!prompt) {
      throw new Error(`找不到 Prompt 模板：${promptKey}`);
    }
  }

  return {
    template: prompt.template,
    variables: prompt.variables || [],
    description: prompt.description
  };
}

/**
 * 驗證變數完整性
 * 確保所有必要變數都已提供
 */
export function validatePromptVariables(
  promptKey: string,
  variables: PromptVariables
): { valid: boolean; missing: string[] } {
  const info = getPromptInfo(promptKey);
  const missing: string[] = [];

  for (const required of info.variables) {
    if (!(required in variables)) {
      missing.push(required);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Prompt 優化建議
 * 分析 prompt 使用情況，提供優化建議
 */
export class PromptOptimizer {
  private usageStats: Map<string, {
    count: number;
    avgResponseTime: number;
    avgResponseQuality: number;
  }> = new Map();

  /**
   * 記錄 prompt 使用
   */
  recordUsage(
    promptKey: string,
    responseTime: number,
    responseQuality: number
  ): void {
    const stats = this.usageStats.get(promptKey) || {
      count: 0,
      avgResponseTime: 0,
      avgResponseQuality: 0
    };

    stats.count++;
    stats.avgResponseTime = (stats.avgResponseTime * (stats.count - 1) + responseTime) / stats.count;
    stats.avgResponseQuality = (stats.avgResponseQuality * (stats.count - 1) + responseQuality) / stats.count;

    this.usageStats.set(promptKey, stats);
  }

  /**
   * 獲取優化建議
   */
  getOptimizationSuggestions(): Array<{
    promptKey: string;
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const suggestions: Array<{
      promptKey: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    for (const [promptKey, stats] of Array.from(this.usageStats.entries())) {
      // 高使用率但品質低的 prompt 需要優化
      if (stats.count > 100 && stats.avgResponseQuality < 0.6) {
        suggestions.push({
          promptKey,
          suggestion: '此 prompt 使用頻繁但品質偏低，建議重新設計',
          priority: 'high'
        });
      }

      // 回應時間過長的 prompt 需要簡化
      if (stats.avgResponseTime > 3000) {
        suggestions.push({
          promptKey,
          suggestion: '此 prompt 回應時間過長，建議簡化內容',
          priority: 'medium'
        });
      }
    }

    return suggestions;
  }
}

// 匯出單例優化器
export const promptOptimizer = new PromptOptimizer();

/**
 * Prompt A/B 測試支援
 */
export class PromptABTester {
  private variants: Map<string, Array<{
    variantId: string;
    template: PromptTemplate;
    performance: {
      uses: number;
      successRate: number;
    };
  }>> = new Map();

  /**
   * 添加測試變體
   */
  addVariant(
    promptKey: string,
    variantId: string,
    template: PromptTemplate
  ): void {
    if (!this.variants.has(promptKey)) {
      this.variants.set(promptKey, []);
    }

    this.variants.get(promptKey)!.push({
      variantId,
      template,
      performance: {
        uses: 0,
        successRate: 0
      }
    });
  }

  /**
   * 獲取測試變體
   * 使用 epsilon-greedy 策略
   */
  getVariant(promptKey: string, epsilon: number = 0.1): {
    variantId: string;
    template: PromptTemplate;
  } | null {
    const variants = this.variants.get(promptKey);
    if (!variants || variants.length === 0) {
      return null;
    }

    // Epsilon-greedy: 10% 探索，90% 利用
    if (Math.random() < epsilon) {
      // 隨機選擇（探索）
      const randomIndex = Math.floor(Math.random() * variants.length);
      return variants[randomIndex];
    } else {
      // 選擇表現最好的（利用）
      return variants.reduce((best, current) => 
        current.performance.successRate > best.performance.successRate ? current : best
      );
    }
  }

  /**
   * 記錄變體表現
   */
  recordPerformance(
    promptKey: string,
    variantId: string,
    success: boolean
  ): void {
    const variants = this.variants.get(promptKey);
    if (!variants) return;

    const variant = variants.find(v => v.variantId === variantId);
    if (!variant) return;

    variant.performance.uses++;
    variant.performance.successRate = 
      (variant.performance.successRate * (variant.performance.uses - 1) + (success ? 1 : 0)) / 
      variant.performance.uses;
  }
}

// 匯出單例 A/B 測試器
export const promptABTester = new PromptABTester();

/**
 * 生成系統提示詞
 * @param persona 客戶角色
 * @param currentState 當前狀態
 * @param messages 對話歷史
 * @returns 系統提示詞
 */
export function generateSystemPrompt(
  persona: any,
  currentState: any,
  messages: any[]
): string {
  // 基礎系統提示
  const basePrompt = generatePrompt('baseSystemPrompt', {
    name: persona.name,
    position: persona.profile.position || persona.position,
    industry: persona.profile.industry || persona.industry,
    personality: JSON.stringify(persona.profile.personality || {}),
    attitude: persona.profile.attitude || '謹慎',
    objections: persona.triggers?.negative?.join('、') || '',
    buzzwords: persona.triggers?.positive?.join('、') || ''
  });

  // 狀態特定提示
  const stateKey = `stateSpecificResponses.${currentState}`;
  let statePrompt = '';
  try {
    statePrompt = generatePrompt(stateKey, {
      userInput: '（業務員正在接近）',  // 預設值，實際對話時會被替換
      trust: 5,
      interest: 5
    });
  } catch (e) {
    // 如果找不到狀態特定提示，使用預設
    console.log(`找不到狀態提示: ${stateKey}`);
  }

  // 組合提示
  return `${basePrompt}\n\n目前狀態: ${currentState}\n${statePrompt}`;
}

/**
 * 生成狀態分析提示詞
 * @param messages 對話歷史
 * @param metrics 指標
 * @returns 狀態分析提示詞
 */
export function generateStateAnalysisPrompt(
  messages: any[],
  metrics: any
): string {
  // 準備最近對話
  const recentMessages = messages.slice(-5).map(msg => 
    `${msg.sender === 'user' ? '業務員' : '客戶'}: ${msg.content}`
  ).join('\n');

  return `分析以下對話，判斷客戶的心理狀態：

最近對話：
${recentMessages}

當前指標：
- 信任度: ${metrics.trust}/10
- 興趣度: ${metrics.interest}/10
- 異議次數: ${metrics.objectionCount || 0}
- 正面回應: ${metrics.positiveResponseCount || 0}

請判斷客戶目前的狀態，並提供理由。`;
}
