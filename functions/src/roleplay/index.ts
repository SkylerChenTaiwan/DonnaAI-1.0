/**
 * AI RolePlay Cloud Functions
 * 處理 AI 業務訓練的後端邏輯
 */

import * as functions from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI, FunctionCallingMode } from "@google/generative-ai";
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
  const userId = await validateAuth(request);
  
  const { prompt, useAdvancedModel } = request.data;
  
  if (!prompt) {
    throw new HttpsError("invalid-argument", "缺少必要參數：prompt");
  }
  
  try {
    const stateAnalysisFunction = {
      name: "analyzeCustomerState",
      description: "分析客戶心理狀態",
      parameters: {
        type: "object",
        properties: {
          state: {
            type: "string",
            enum: ["初次接觸", "產生興趣", "評估考慮", "準備決策", "達成交易", "失去興趣"],
            description: "客戶當前心理狀態"
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "分析信心度 0-1"
          },
          reason: {
            type: "string",
            description: "狀態判斷原因"
          },
          suggestedResponse: {
            type: "string",
            description: "建議的回應策略"
          }
        },
        required: ["state", "confidence", "reason"]
      }
    };

    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_MODEL,
      systemInstruction: "你是一個銷售心理分析專家，專門分析客戶在銷售對話中的心理狀態。",
    });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
      tools: [{
        functionDeclarations: [stateAnalysisFunction]
      }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.ANY,
          allowedFunctionNames: ["analyzeCustomerState"]
        }
      }
    });

    const result = response.response;
    const functionCall = result.candidates?.[0]?.content?.parts?.[0]?.functionCall;
    
    if (!functionCall || functionCall.name !== "analyzeCustomerState") {
      throw new Error("無法分析客戶狀態");
    }

    return functionCall.args;
  } catch (error: any) {
    console.error("狀態分析錯誤:", error);
    throw new HttpsError("internal", "狀態分析失敗", error.message);
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
  const userId = await validateAuth(request);
  
  const { systemPrompt, userMessage, customerProfile, useAdvancedModel, quickMode } = request.data;
  
  if (!systemPrompt || !userMessage) {
    throw new HttpsError("invalid-argument", "缺少必要參數");
  }
  
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: useAdvancedModel ? GEMINI_PRO_MODEL : GEMINI_MODEL,
      systemInstruction: systemPrompt,
    });

    const maxOutputTokens = quickMode ? 150 : 500;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      }
    });

    const text = response.response.text();
    
    return {
      customerResponse: text,
      confidence: 0.9
    };
  } catch (error: any) {
    console.error("生成客戶回應錯誤:", error);
    throw new HttpsError("internal", "生成回應失敗", error.message);
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
  const userId = await validateAuth(request);
  
  const {
    systemPrompt,
    stateAnalysisPrompt,
    currentState,
    userMessage,
    conversationHistory,
    enableHints,
    useAdvancedModel
  } = request.data;
  
  try {
    // 步驟 1: 分析狀態
    const stateAnalysis = await analyzeCustomerState.run({
      data: { prompt: stateAnalysisPrompt, useAdvancedModel },
      auth: request.auth,
      rawRequest: request.rawRequest
    });
    
    // 步驟 2: 生成客戶回應
    const responseData = await generateCustomerResponse.run({
      data: {
        systemPrompt,
        userMessage,
        useAdvancedModel,
        quickMode: stateAnalysis.data.confidence > 0.8
      },
      auth: request.auth,
      rawRequest: request.rawRequest
    });
    
    // 步驟 3: 組合結果
    return {
      customerResponse: responseData.data.customerResponse,
      stateChange: stateAnalysis.data.state !== currentState ? {
        from: currentState,
        to: stateAnalysis.data.state,
        reason: stateAnalysis.data.reason
      } : undefined,
      hint: enableHints ? stateAnalysis.data.suggestedResponse : undefined,
      confidence: stateAnalysis.data.confidence,
      metrics: {
        trust: calculateTrustScore(conversationHistory),
        interest: calculateInterestScore(conversationHistory),
        turnCount: conversationHistory?.length || 0
      }
    };
  } catch (error: any) {
    console.error("RolePlay 對話處理錯誤:", error);
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
  const userId = await validateAuth(request);
  
  const { recentMessages, currentState, metrics } = request.data;
  
  try {
    const model = getGeminiClient().getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: "你是一位經驗豐富的銷售教練，幫助業務員改進銷售技巧。",
    });

    const prompt = `
目前客戶狀態：${currentState}
信任度：${metrics.trust}/10
興趣度：${metrics.interest}/10

最近對話：
${recentMessages.map((msg: any) => `${msg.sender}: ${msg.content}`).join('\n')}

請提供一個簡短的建議（不超過50字），幫助業務員改進銷售策略。
`;

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });

    return {
      advice: {
        type: "suggestion",
        content: response.response.text()
      }
    };
  } catch (error: any) {
    console.error("生成教練建議錯誤:", error);
    throw new HttpsError("internal", "生成建議失敗", error.message);
  }
});

// 輔助函數：計算信任分數
function calculateTrustScore(conversationHistory: any[]): number {
  if (!conversationHistory || conversationHistory.length === 0) return 5;
  
  // 簡單的信任度計算邏輯
  let trust = 5;
  conversationHistory.forEach(msg => {
    if (msg.sender === "user") {
      // 正面關鍵詞增加信任
      if (msg.content.match(/了解|明白|確實|好的|沒問題/)) {
        trust = Math.min(10, trust + 0.3);
      }
      // 提供價值增加信任
      if (msg.content.match(/解決|幫助|提升|改善|優化/)) {
        trust = Math.min(10, trust + 0.5);
      }
    }
  });
  
  return Math.round(trust * 10) / 10;
}

// 輔助函數：計算興趣分數
function calculateInterestScore(conversationHistory: any[]): number {
  if (!conversationHistory || conversationHistory.length === 0) return 5;
  
  // 簡單的興趣度計算邏輯
  let interest = 5;
  conversationHistory.forEach(msg => {
    if (msg.sender === "customer") {
      // 提問表示興趣
      if (msg.content.includes("？") || msg.content.includes("?")) {
        interest = Math.min(10, interest + 0.4);
      }
      // 負面回應降低興趣
      if (msg.content.match(/不需要|沒興趣|太貴|算了/)) {
        interest = Math.max(0, interest - 1);
      }
    }
  });
  
  return Math.round(interest * 10) / 10;
}