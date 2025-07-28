/**
 * AI RolePlay Cloud Functions
 * 處理 AI 業務訓練的後端邏輯
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiKey } from "../utils/secrets-manager";
import { validateAuth } from "../utils/auth-validator";

// Gemini 模型配置
const GEMINI_MODEL = "gemini-2.0-flash-001";
const GEMINI_PRO_MODEL = "gemini-1.5-pro";

// 初始化 Gemini AI
let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = getGeminiKey();
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * 分析客戶心理狀態
 */
export const analyzeCustomerState = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  // 驗證用戶身份
  await validateAuth(request);
  
  const { prompt, useAdvancedModel } = request.data;
  
  if (!prompt) {
    throw new HttpsError("invalid-argument", "缺少必要參數：prompt");
  }
  
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_MODEL,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 簡單解析回應
    const stateMatch = text.match(/狀態[：:]\s*(\S+)/);
    const confidenceMatch = text.match(/信心度[：:]\s*([\d.]+)/);
    const reasonMatch = text.match(/原因[：:]\s*(.+)/);
    
    return {
      state: stateMatch ? stateMatch[1] : "初次接觸",
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7,
      reason: reasonMatch ? reasonMatch[1] : text.substring(0, 100)
    };
  } catch (error: any) {
    console.error("分析狀態失敗:", error);
    throw new HttpsError("internal", "AI 分析失敗", error.message);
  }
});

/**
 * 生成客戶回應
 */
export const generateCustomerResponse = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  // 驗證用戶身份
  await validateAuth(request);
  
  const { systemPrompt, userMessage, useAdvancedModel, quickMode } = request.data;
  
  if (!systemPrompt || !userMessage) {
    throw new HttpsError("invalid-argument", "缺少必要參數");
  }
  
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: quickMode ? GEMINI_MODEL : (useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_MODEL),
    });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: quickMode ? 100 : 500,
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
      },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    
    return {
      customerResponse: response.text(),
      confidence: 0.85
    };
  } catch (error: any) {
    console.error("生成回應失敗:", error);
    throw new HttpsError("internal", "AI 生成失敗", error.message);
  }
});

/**
 * 處理完整的 RolePlay 對話
 */
export const processRolePlayDialogue = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  // 驗證用戶身份
  await validateAuth(request);
  
  const {
    systemPrompt,
    currentState,
    userMessage,
    conversationHistory,
    enableHints,
    useAdvancedModel
  } = request.data;
  
  if (!systemPrompt || !userMessage) {
    throw new HttpsError("invalid-argument", "缺少必要參數");
  }
  
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_MODEL,
    });

    // 組合 prompt 一次生成所有內容
    const combinedPrompt = `${systemPrompt}

目前狀態：${currentState}

# 對話歷史
${conversationHistory?.slice(-5).map((msg: any) => 
  `${msg.sender === 'user' ? '業務員' : '客戶'}: ${msg.content}`
).join('\n') || '（首次對話）'}

# 業務員說
${userMessage}

# 請以客戶身份回應，並在回應後分析：
1. 客戶回應內容（1-3句話，自然對話）
2. 客戶當前狀態（初次接觸/產生興趣/評估考慮/準備決策/達成交易/失去興趣）
3. 狀態改變原因（如果有變化）
4. 信任度變化（-2到+2）
5. 興趣度變化（-2到+2）

格式：
客戶回應：[回應內容]
當前狀態：[狀態]
狀態原因：[原因]
信任度變化：[數字]
興趣度變化：[數字]`;

    const result = await model.generateContent(combinedPrompt);
    const response = await result.response;
    const text = response.text();
    
    // 解析回應
    const responseMatch = text.match(/客戶回應[：:]\s*(.+?)(?=\n|$)/);
    const stateMatch = text.match(/當前狀態[：:]\s*(\S+)/);
    const reasonMatch = text.match(/狀態原因[：:]\s*(.+?)(?=\n|$)/);
    const trustMatch = text.match(/信任度變化[：:]\s*([-+]?\d+)/);
    const interestMatch = text.match(/興趣度變化[：:]\s*([-+]?\d+)/);
    
    const newState = stateMatch ? stateMatch[1] : currentState;
    
    const resultData: any = {
      customerResponse: responseMatch ? responseMatch[1].trim() : "我需要再考慮一下。",
      stateChange: newState !== currentState ? {
        from: currentState,
        to: newState,
        reason: reasonMatch ? reasonMatch[1].trim() : "狀態維持不變"
      } : null,
      metrics: {
        trust: 5 + (trustMatch ? parseInt(trustMatch[1]) : 0),
        interest: 5 + (interestMatch ? parseInt(interestMatch[1]) : 0),
      }
    };
    
    // 生成提示（如果啟用）
    if (enableHints) {
      resultData.hint = generateHint(newState, conversationHistory);
    }
    
    return resultData;
  } catch (error: any) {
    console.error("處理對話失敗:", error);
    throw new HttpsError("internal", "對話處理失敗", error.message);
  }
});

/**
 * 獲取 AI 教練建議
 */
export const getCoachAdvice = onCall({
  cors: true,
  maxInstances: 10,
}, async (request) => {
  // 驗證用戶身份  
  await validateAuth(request);
  
  const { recentMessages, currentState, metrics } = request.data;
  
  if (!recentMessages || recentMessages.length === 0) {
    throw new HttpsError("invalid-argument", "缺少對話歷史");
  }
  
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: GEMINI_MODEL,
    });

    // 構建對話摘要
    const conversationSummary = recentMessages
      .slice(-5)
      .map((msg: any) => `${msg.sender === 'user' ? '業務員' : '客戶'}: ${msg.content}`)
      .join('\n');

    const prompt = `你是一位資深銷售教練，正在指導業務人員進行訓練。

當前情況：
- 客戶狀態：${currentState}
- 信任度：${metrics?.trust || 5}/10
- 興趣度：${metrics?.interest || 5}/10

最近對話：
${conversationSummary}

請分析業務員的表現並提供具體建議（不超過100字）。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      advice: {
        type: "coaching",
        content: response.text()
      }
    };
  } catch (error: any) {
    console.error("生成建議失敗:", error);
    throw new HttpsError("internal", "AI 建議生成失敗", error.message);
  }
});

/**
 * 輔助函數：生成提示
 */
function generateHint(state: string, conversationHistory: any[]): string {
  const hints: Record<string, string[]> = {
    "初次接觸": ["建立信任", "了解需求", "展現專業"],
    "產生興趣": ["深挖痛點", "展示價值", "案例分享"],
    "評估考慮": ["處理異議", "強調優勢", "消除顧慮"],
    "準備決策": ["創造急迫感", "提供優惠", "協助決策"],
    "達成交易": ["確認細節", "建立期待", "後續服務"],
    "失去興趣": ["重新吸引", "了解原因", "調整策略"]
  };
  
  const stateHints = hints[state] || hints["初次接觸"];
  return stateHints[Math.floor(Math.random() * stateHints.length)];
}