/**
 * AI 處理 API Cloud Function
 * 提供統一的 AI 處理 HTTP 端點
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// 初始化服務
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors.default({origin: true});

// 初始化 AI 客戶端
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

export interface AIProcessingRequest {
  action: "analyze" | "extract" | "summarize" | "interpret";
  content: string;
  context?: Record<string, any>;
  model?: "openai" | "anthropic";
  options?: {
    temperature?: number;
    maxTokens?: number;
    language?: string;
  };
}

export interface AIProcessingResponse {
  success: boolean;
  result: any;
  metadata: {
    model: string;
    processingTime: number;
    tokensUsed?: number;
  };
  error?: string;
}

/**
 * 統一的 AI 處理 API
 */
export const aiProcessingAPI = functions.https.onRequest(async (req: functions.Request, res: functions.Response) => {
  // 初始化 AI 客戶端（如果尚未初始化）
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  if (!anthropic && process.env.CLAUDE_API_KEY) {
    anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
  }
  
  corsHandler(req, res, async () => {
    try {
      // 驗證請求方法
      if (req.method !== "POST") {
        res.status(405).json({error: "只接受 POST 請求"});
        return;
      }

      // 驗證認證
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({error: "未提供認證令牌"});
        return;
      }

      const idToken = authHeader.split("Bearer ")[1];
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        res.status(401).json({error: "無效的認證令牌"});
        return;
      }

      // 解析請求
      const request = req.body as AIProcessingRequest;

      if (!request.action || !request.content) {
        res.status(400).json({error: "缺少必要參數"});
        return;
      }

      const startTime = Date.now();

      // 執行 AI 處理
      const result = await processAIRequest(request, decodedToken.uid);

      const processingTime = Date.now() - startTime;

      const response: AIProcessingResponse = {
        success: true,
        result,
        metadata: {
          model: request.model || "openai",
          processingTime,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("AI 處理失敗:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "內部伺服器錯誤",
      } as AIProcessingResponse);
    }
  });
});

/**
 * 處理 AI 請求
 */
async function processAIRequest(
  request: AIProcessingRequest,
  userId: string
): Promise<any> {
  // 記錄使用情況
  await logAIUsage(userId, request.action);

  switch (request.action) {
  case "analyze":
    return await analyzeContent(request);
  case "extract":
    return await extractInformation(request);
  case "summarize":
    return await summarizeContent(request);
  case "interpret":
    return await interpretFieldDescription(request);
  default:
    throw new Error(`不支援的動作: ${request.action}`);
  }
}

/**
 * 分析內容
 */
async function analyzeContent(request: AIProcessingRequest): Promise<any> {
  const systemPrompt = `你是一個專業的內容分析助手。請分析提供的內容並提供詳細的見解。
使用繁體中文回應。`;

  const userPrompt = request.content;

  if (request.model === "anthropic" && anthropic) {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: request.options?.maxTokens || 1000,
      temperature: request.options?.temperature || 0.3,
      system: systemPrompt,
      messages: [{role: "user", content: userPrompt}],
    });

    return {
      analysis: response.content[0].type === "text" ? response.content[0].text : "",
      context: request.context,
    };
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      temperature: request.options?.temperature || 0.3,
      max_tokens: request.options?.maxTokens || 1000,
    });

    return {
      analysis: response.choices[0]?.message?.content || "",
      context: request.context,
    };
  } else {
    throw new Error("沒有可用的 AI 服務");
  }
}

/**
 * 提取資訊
 */
async function extractInformation(request: AIProcessingRequest): Promise<any> {
  const systemPrompt = `你是一個專業的資訊提取助手。請從內容中提取結構化資訊。
${request.context?.instructions || ""}
請以 JSON 格式回應。使用繁體中文。`;

  const userPrompt = request.content;

  if (openai) {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      response_format: {type: "json_object"},
      temperature: 0.2,
      max_tokens: request.options?.maxTokens || 1500,
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } else {
    throw new Error("提取功能需要 OpenAI 服務");
  }
}

/**
 * 摘要內容
 */
async function summarizeContent(request: AIProcessingRequest): Promise<any> {
  const systemPrompt = `你是一個專業的摘要助手。請提供簡潔但完整的摘要。
摘要長度：${request.context?.length || "100-200字"}
使用繁體中文。`;

  const userPrompt = `請摘要以下內容：\n\n${request.content}`;

  if (request.model === "anthropic" && anthropic) {
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 500,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{role: "user", content: userPrompt}],
    });

    return {
      summary: response.content[0].type === "text" ? response.content[0].text : "",
    };
  } else if (openai) {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return {
      summary: response.choices[0]?.message?.content || "",
    };
  } else {
    throw new Error("沒有可用的 AI 服務");
  }
}

/**
 * 解釋欄位描述
 */
async function interpretFieldDescription(request: AIProcessingRequest): Promise<any> {
  const systemPrompt = `你是一個專業的欄位解釋助手。使用者會描述他們想要追蹤的欄位，
你需要將其轉換為結構化的欄位定義。

請提供：
1. 結構化的欄位說明
2. 可能的欄位類型（text, number, date, select, boolean）
3. 提取規則和提示
4. 範例值
5. 同義詞或相關詞彙

以 JSON 格式回應，使用繁體中文。`;

  const userPrompt = `使用者描述：${request.content}`;

  if (openai) {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      response_format: {type: "json_object"},
      temperature: 0.3,
      max_tokens: 800,
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  } else {
    throw new Error("解釋功能需要 OpenAI 服務");
  }
}

/**
 * 記錄 AI 使用情況
 */
async function logAIUsage(userId: string, action: string): Promise<void> {
  try {
    const usageRef = db.collection("aiUsageLogs").doc();
    await usageRef.set({
      userId,
      action,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("記錄 AI 使用失敗:", error);
    // 不中斷主要流程
  }
}