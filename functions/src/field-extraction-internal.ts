/**
 * 內部欄位提取服務
 * 供 Cloud Functions 內部使用
 */

import * as admin from "firebase-admin";
import OpenAI from "openai";
import { getOpenAIApiKey } from "./utils/api-key-helpers";

// 初始化 Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// 初始化 OpenAI 客戶端
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!openai) {
    const key = getOpenAIApiKey();
    if (key) {
      openai = new OpenAI({apiKey: key});
    }
  }
  return openai;
}

interface FieldMapping {
  fieldKey: string;
  confidence: number;
  extractedValue: any;
  reason?: string;
  requiresConfirmation?: boolean;
}

/**
 * 從轉錄文字中提取自訂欄位
 */
export async function extractFieldsFromTranscription(
  recordId: string,
  transcription: string,
  summary: string,
  organizationId: string
): Promise<{mappings: FieldMapping[]; averageConfidence: number} | null> {
  try {
    // 獲取組織的自訂欄位定義
    const fieldDefsSnapshot = await db
      .collection("customFieldDefinitions")
      .where("organizationId", "==", organizationId)
      .where("entityType", "==", "customer")
      .get();

    if (fieldDefsSnapshot.empty) {
      console.log("沒有找到自訂欄位定義");
      return null;
    }

    const fieldDefinitions = fieldDefsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 使用 AI 提取欄位
    const mappings = await extractFieldsWithAI(
      transcription,
      summary,
      fieldDefinitions
    );

    if (mappings.length === 0) {
      return null;
    }

    // 計算平均信心分數
    const averageConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;

    return {mappings, averageConfidence};
  } catch (error) {
    console.error("提取欄位失敗:", error);
    return null;
  }
}

/**
 * 使用 AI 提取欄位值
 */
async function extractFieldsWithAI(
  transcription: string,
  summary: string,
  fieldDefinitions: any[]
): Promise<FieldMapping[]> {
  if (!openai) {
    console.error("OpenAI 客戶端未初始化");
    return [];
  }

  // 準備欄位描述
  const fieldDescriptions = fieldDefinitions.map((field) => ({
    fieldKey: field.fieldKey,
    fieldName: field.fieldName,
    fieldType: field.fieldType,
    description: field.aiFieldInterpretation?.aiProcessedDescription || field.fieldName,
    examples: field.aiFieldInterpretation?.examples || [],
  }));

  const systemPrompt = `你是一個專業的資料提取助手。請從會議內容中提取以下自訂欄位的值。

欄位定義：
${JSON.stringify(fieldDescriptions, null, 2)}

請分析提供的轉錄文字和摘要，提取每個欄位的值。對於每個欄位，請提供：
1. extractedValue: 提取的值（如果找不到則為 null）
2. confidence: 信心分數（0-1）
3. reason: 提取或無法提取的原因
4. requiresConfirmation: 是否建議人工確認（信心度低於 0.7 時為 true）

請以 JSON 陣列格式回應，每個元素包含 fieldKey、extractedValue、confidence、reason 和 requiresConfirmation。`;

  try {
    const client = getOpenAI();
    if (!client) {
      throw new Error("OpenAI client not initialized");
    }
    const response = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {role: "system", content: systemPrompt},
        {
          role: "user",
          content: `轉錄文字：\n${transcription}\n\n摘要：\n${summary}`,
        },
      ],
      response_format: {type: "json_object"},
      temperature: 0.2,
      max_tokens: 1500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    const extractedFields = result.fields || result.mappings || [];

    // 驗證和格式化結果
    const mappings: FieldMapping[] = [];
    for (const field of extractedFields) {
      if (field.fieldKey && field.confidence !== undefined) {
        mappings.push({
          fieldKey: field.fieldKey,
          confidence: Math.max(0, Math.min(1, field.confidence)),
          extractedValue: field.extractedValue,
          reason: field.reason,
          requiresConfirmation: field.requiresConfirmation || field.confidence < 0.7,
        });
      }
    }

    return mappings;
  } catch (error) {
    console.error("AI 欄位提取失敗:", error);
    return [];
  }
}