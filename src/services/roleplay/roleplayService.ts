/**
 * RolePlay 服務 - 透過 Cloud Functions 處理
 * 所有 AI 相關操作都在後端執行，保護 API Key
 */

import { functions } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import {
  CustomerPersona,
  RolePlaySession,
  DialogueOptions,
  AIResponse,
  RolePlayError,
  StateType
} from '@/types/roleplay';
import { generateSystemPrompt, generateStateAnalysisPrompt } from './promptTemplates';
import { customerPersonas } from './customerPersonas';

// Cloud Functions
const analyzeCustomerStateFn = httpsCallable(functions, 'analyzeCustomerState');
const generateCustomerResponseFn = httpsCallable(functions, 'generateCustomerResponse');
const processRolePlayDialogueFn = httpsCallable(functions, 'processRolePlayDialogue');
const getCoachAdviceFn = httpsCallable(functions, 'getCoachAdvice');

// 當前會話狀態
let currentSession: RolePlaySession | null = null;

/**
 * 開始新的角色扮演會話
 */
export async function startRolePlaySession(personaId: string): Promise<{
  sessionId: string;
  greeting: string;
  persona: CustomerPersona;
}> {
  try {
    const persona = customerPersonas.find(p => p.id === personaId);
    if (!persona) {
      throw new RolePlayError('找不到指定的客戶原型', 'PERSONA_NOT_FOUND');
    }

    // 建立新會話
    currentSession = {
      id: `session_${Date.now()}`,
      personaId,
      startTime: new Date(),
      messages: [],
      currentState: StateType.INITIAL_CONTACT,
      metrics: {
        trust: 5,
        interest: 5,
        objectionCount: 0,
        positiveResponseCount: 0
      }
    };

    // 生成開場白
    const systemPrompt = generateSystemPrompt(persona, currentSession.currentState, []);
    const greetingPrompt = `${systemPrompt}\n\n生成一個符合人物設定的開場白，表現出${persona.profile.attitude}的態度。`;

    const response = await generateCustomerResponseFn({
      systemPrompt: greetingPrompt,
      userMessage: "業務員走進來打招呼",
      customerProfile: persona,
      quickMode: false
    });

    const greeting = (response.data as any).customerResponse;

    // 記錄開場訊息
    currentSession.messages.push({
      id: `msg_${Date.now()}`,
      sender: 'customer',
      content: greeting,
      timestamp: new Date()
    });

    return {
      sessionId: currentSession.id,
      greeting,
      persona
    };
  } catch (error: any) {
    console.error('開始會話失敗:', error);
    throw new RolePlayError(
      '無法開始訓練會話',
      'SESSION_START_FAILED',
      error
    );
  }
}

/**
 * 處理用戶訊息
 */
export async function processUserMessage(
  content: string,
  options: DialogueOptions = {}
): Promise<AIResponse> {
  if (!currentSession) {
    throw new RolePlayError('沒有進行中的會話', 'NO_ACTIVE_SESSION');
  }

  try {
    // 記錄用戶訊息
    currentSession.messages.push({
      id: `msg_${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date()
    });

    // 取得客戶原型
    const persona = customerPersonas.find(p => p.id === currentSession.personaId);
    if (!persona) {
      throw new RolePlayError('客戶原型遺失', 'PERSONA_LOST');
    }

    // 準備提示
    const systemPrompt = generateSystemPrompt(
      persona,
      currentSession.currentState,
      currentSession.messages
    );

    const stateAnalysisPrompt = generateStateAnalysisPrompt(
      currentSession.messages,
      currentSession.metrics
    );

    // 呼叫 Cloud Function
    const response = await processRolePlayDialogueFn({
      systemPrompt,
      stateAnalysisPrompt,
      currentState: currentSession.currentState,
      userMessage: content,
      conversationHistory: currentSession.messages,
      enableHints: options.enableHints,
      useAdvancedModel: options.useAdvancedModel
    });

    const result = response.data as AIResponse;

    // 更新會話狀態
    if (result.stateChange) {
      currentSession.currentState = result.stateChange.to;
    }

    // 更新指標
    if (result.metrics) {
      currentSession.metrics = {
        ...currentSession.metrics,
        ...result.metrics
      };
    }

    // 記錄客戶回應
    currentSession.messages.push({
      id: `msg_${Date.now()}`,
      sender: 'customer',
      content: result.customerResponse,
      timestamp: new Date(),
      hint: result.hint
    });

    // 檢查是否自動結束
    if (shouldAutoEnd()) {
      result.autoEnd = true;
      result.outcome = currentSession.currentState === StateType.DEAL_CLOSED ? 'won' : 'lost';
      result.report = generateSessionReport();
    }

    return result;
  } catch (error: any) {
    console.error('處理訊息失敗:', error);
    throw new RolePlayError(
      '處理訊息失敗',
      'MESSAGE_PROCESSING_FAILED',
      error
    );
  }
}

/**
 * 取得 AI 教練建議
 */
export async function getCoachAdvice(data: {
  recentMessages: any[];
  currentState: string;
  metrics: any;
}): Promise<{ advice: { type: string; content: string } }> {
  try {
    const response = await getCoachAdviceFn(data);
    return response.data as any;
  } catch (error: any) {
    console.error('取得教練建議失敗:', error);
    throw new RolePlayError(
      '無法取得教練建議',
      'COACH_ADVICE_FAILED',
      error
    );
  }
}

/**
 * 結束會話
 */
export function endSession(): RolePlaySession | null {
  const session = currentSession;
  currentSession = null;
  return session;
}

/**
 * 暫停會話
 */
export function pauseSession(): RolePlaySession | null {
  return currentSession;
}

/**
 * 恢復會話
 */
export function resumeSession(session: RolePlaySession): void {
  currentSession = session;
}

/**
 * 檢查是否應該自動結束
 */
function shouldAutoEnd(): boolean {
  if (!currentSession) return false;

  // 達成交易或完全失去興趣
  if (currentSession.currentState === StateType.DEAL_CLOSED ||
      currentSession.currentState === StateType.LOST_INTEREST) {
    return true;
  }

  // 對話輪數過多
  if (currentSession.messages.filter(m => m.sender === 'user').length > 30) {
    return true;
  }

  // 興趣度過低
  if (currentSession.metrics.interest <= 2) {
    return true;
  }

  return false;
}

/**
 * 生成會話報告
 */
function generateSessionReport(): any {
  if (!currentSession) return null;

  const userMessages = currentSession.messages.filter(m => m.sender === 'user');
  const duration = Date.now() - currentSession.startTime.getTime();

  return {
    sessionId: currentSession.id,
    duration: Math.round(duration / 1000 / 60), // 分鐘
    turnCount: userMessages.length,
    finalState: currentSession.currentState,
    metrics: currentSession.metrics,
    suggestions: [
      '嘗試更早了解客戶的具體需求',
      '在展示價值時使用更多實際案例',
      '注意傾聽客戶的擔憂並適時回應'
    ]
  };
}