/**
 * 欄位提取 Cloud Function
 * 提供 HTTP 端點供前端呼叫進行欄位提取
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as cors from "cors";
import OpenAI from "openai";

// 初始化服務
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const corsHandler = cors({origin: true});

// 從環境變數獲取 API 金鑰
const openaiApiKey = functions.config().openai?.api_key;
const openai = openaiApiKey ? new OpenAI({apiKey: openaiApiKey}) : null;

export interface FieldExtractionRequest {
  content: string;
  fieldDefinitions: Array<{
    fieldKey: string;
    fieldName: string;
    fieldType: string;
    aiInterpretation?: string;
    examples?: string[];
  }>;
  contextualInfo?: {
    customerName?: string;
    previousRecords?: string[];
  };
}

export interface FieldExtractionResponse {
  fieldMappings: Array<{
    fieldKey: string;
    confidence: number;
    extractedValue: any;
    reason?: string;
    requiresConfirmation?: boolean;
    alternatives?: Array<{
      value: any;
      confidence: number;
    }>;
  }>;
  processingMetadata: {
    modelUsed: string;
    processingTime: number;
    totalConfidence: number;
  };
  suggestedActions?: string[];
}

/**
 * HTTP 函數：提取欄位
 */
export const extractFieldsFromContent = functions.https.onRequest(
  async (req, res) => {
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
        try {
          await admin.auth().verifyIdToken(idToken);
        } catch (error) {
          res.status(401).json({error: "無效的認證令牌"});
          return;
        }

        // 解析請求內容
        const request = req.body as FieldExtractionRequest;

        if (!request.content || !request.fieldDefinitions) {
          res.status(400).json({error: "缺少必要參數"});
          return;
        }

        const startTime = Date.now();

        // 執行欄位提取
        const result = await performFieldExtraction(request);

        const processingTime = Date.now() - startTime;

        // 計算總信心分數
        const totalConfidence = result.fieldMappings.length > 0
          ? result.fieldMappings.reduce((sum, m) => sum + m.confidence, 0) /
            result.fieldMappings.length
          : 0;

        const response: FieldExtractionResponse = {
          fieldMappings: result.fieldMappings,
          processingMetadata: {
            modelUsed: "openai-gpt-4",
            processingTime,
            totalConfidence,
          },
          suggestedActions: result.suggestedActions,
        };

        res.status(200).json(response);
      } catch (error) {
        console.error("欄位提取失敗:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "內部伺服器錯誤",
        });
      }
    });
  }
);

/**
 * 執行欄位提取
 */
async function performFieldExtraction(
  request: FieldExtractionRequest
): Promise<{
  fieldMappings: FieldExtractionResponse["fieldMappings"];
  suggestedActions?: string[];
}> {
  if (!openai) {
    throw new Error("AI 服務未配置");
  }

  // 構建系統提示
  const systemPrompt = buildSystemPrompt(request.fieldDefinitions);

  // 構建使用者提示
  const userPrompt = buildUserPrompt(request);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {role: "system", content: systemPrompt},
        {role: "user", content: userPrompt},
      ],
      response_format: {type: "json_object"},
      temperature: 0.2,
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");

    // 格式化並驗證結果
    const fieldMappings = formatFieldMappings(
      result.fieldMappings || result.fields || [],
      request.fieldDefinitions
    );

    return {
      fieldMappings,
      suggestedActions: result.suggestedActions || [],
    };
  } catch (error) {
    console.error("AI 處理失敗:", error);
    throw new Error("AI 處理失敗");
  }
}

/**
 * 構建系統提示
 */
function buildSystemPrompt(fieldDefinitions: FieldExtractionRequest["fieldDefinitions"]): string {
  return `你是一個專業的資料提取助手。你的任務是從提供的內容中提取指定的欄位值。

欄位定義：
${fieldDefinitions.map((field) => `
- ${field.fieldName} (${field.fieldKey})
  類型: ${field.fieldType}
  說明: ${field.aiInterpretation || field.fieldName}
  ${field.examples?.length ? `範例: ${field.examples.join(", ")}` : ""}
`).join("\n")}

對於每個欄位，請提供：
1. fieldKey: 欄位鍵值
2. extractedValue: 提取的值（找不到則為 null）
3. confidence: 信心分數（0-1）
4. reason: 提取的理由或無法提取的原因
5. requiresConfirmation: 是否建議人工確認
6. alternatives: 其他可能的值（如果有）

額外提供：
- suggestedActions: 基於內容的建議後續行動

請以 JSON 格式回應。`;
}

/**
 * 構建使用者提示
 */
function buildUserPrompt(request: FieldExtractionRequest): string {
  let prompt = `請從以下內容中提取欄位值：\n\n${request.content}`;

  if (request.contextualInfo) {
    prompt += "\n\n額外資訊：";
    if (request.contextualInfo.customerName) {
      prompt += `\n- 客戶名稱: ${request.contextualInfo.customerName}`;
    }
    if (request.contextualInfo.previousRecords?.length) {
      prompt += `\n- 相關歷史紀錄摘要:\n${request.contextualInfo.previousRecords.join("\n")}`;
    }
  }

  return prompt;
}

/**
 * 格式化欄位對應結果
 */
function formatFieldMappings(
  rawMappings: any[],
  fieldDefinitions: FieldExtractionRequest["fieldDefinitions"]
): FieldExtractionResponse["fieldMappings"] {
  const mappings: FieldExtractionResponse["fieldMappings"] = [];
  const fieldKeys = new Set(fieldDefinitions.map((f) => f.fieldKey));

  for (const mapping of rawMappings) {
    // 確保欄位鍵值有效
    if (!mapping.fieldKey || !fieldKeys.has(mapping.fieldKey)) {
      continue;
    }

    // 確保信心分數在有效範圍內
    const confidence = Math.max(0, Math.min(1, mapping.confidence || 0));

    mappings.push({
      fieldKey: mapping.fieldKey,
      confidence,
      extractedValue: mapping.extractedValue !== undefined ? mapping.extractedValue : null,
      reason: mapping.reason,
      requiresConfirmation: mapping.requiresConfirmation ?? confidence < 0.7,
      alternatives: mapping.alternatives,
    });
  }

  // 為未提取到的欄位添加空值
  for (const fieldDef of fieldDefinitions) {
    if (!mappings.find((m) => m.fieldKey === fieldDef.fieldKey)) {
      mappings.push({
        fieldKey: fieldDef.fieldKey,
        confidence: 0,
        extractedValue: null,
        reason: "未在內容中找到相關資訊",
        requiresConfirmation: true,
      });
    }
  }

  return mappings;
}