/**
 * AI 分析服務
 * 使用 AI 模型分析轉錄文字
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import * as functions from "firebase-functions";

// 從環境變數獲取 API 金鑰
const openaiApiKey = functions.config().openai?.api_key;
const anthropicApiKey = functions.config().anthropic?.api_key;

// 初始化 AI 客戶端
const openai = openaiApiKey ? new OpenAI({apiKey: openaiApiKey}) : null;
const anthropic = anthropicApiKey ? new Anthropic({apiKey: anthropicApiKey}) : null;

export interface AnalysisResult {
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  sentiment: "positive" | "neutral" | "negative";
  suggestedFollowUp?: string;
}

export interface AnalysisContext {
  type: "meeting" | "call" | "note" | "other";
  customerName?: string;
  participantNames?: string[];
}

/**
 * 分析轉錄文字
 */
export async function analyzeTranscription(
  transcription: string,
  context: AnalysisContext
): Promise<AnalysisResult> {
  try {
    // 優先使用 OpenAI，如果不可用則使用 Anthropic
    if (openai) {
      return await analyzeWithOpenAI(transcription, context);
    } else if (anthropic) {
      return await analyzeWithAnthropic(transcription, context);
    } else {
      throw new Error("沒有可用的 AI 服務");
    }
  } catch (error) {
    console.error("AI 分析失敗:", error);
    // 返回基本分析結果
    return {
      summary: transcription.substring(0, 200) + "...",
      actionItems: [],
      keyTopics: [],
      sentiment: "neutral",
    };
  }
}

/**
 * 使用 OpenAI 分析
 */
async function analyzeWithOpenAI(
  transcription: string,
  context: AnalysisContext
): Promise<AnalysisResult> {
  if (!openai) throw new Error("OpenAI 客戶端未初始化");

  const systemPrompt = `你是一個專業的會議分析助手。請分析以下${getContextDescription(context)}的轉錄內容，並以繁體中文回應。

請提供：
1. 摘要：簡潔的內容總結（100-200字）
2. 行動項目：具體可執行的任務清單
3. 關鍵主題：討論的主要議題
4. 情緒分析：整體對話的情緒傾向（positive/neutral/negative）
5. 建議跟進：下一步的建議行動

請以 JSON 格式回應。`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {role: "system", content: systemPrompt},
      {role: "user", content: transcription},
    ],
    response_format: {type: "json_object"},
    temperature: 0.3,
    max_tokens: 1000,
  });

  const result = JSON.parse(response.choices[0]?.message?.content || "{}");

  return {
    summary: result.summary || "",
    actionItems: result.actionItems || [],
    keyTopics: result.keyTopics || [],
    sentiment: result.sentiment || "neutral",
    suggestedFollowUp: result.suggestedFollowUp,
  };
}

/**
 * 使用 Anthropic 分析
 */
async function analyzeWithAnthropic(
  transcription: string,
  context: AnalysisContext
): Promise<AnalysisResult> {
  if (!anthropic) throw new Error("Anthropic 客戶端未初始化");

  const systemPrompt = `你是一個專業的會議分析助手。請分析${getContextDescription(context)}的轉錄內容，並以繁體中文回應。

請提供以下分析：
1. 摘要：簡潔的內容總結（100-200字）
2. 行動項目：具體可執行的任務清單
3. 關鍵主題：討論的主要議題
4. 情緒分析：整體對話的情緒傾向（positive/neutral/negative）
5. 建議跟進：下一步的建議行動

請嚴格按照以下 JSON 格式回應：
{
  "summary": "摘要內容",
  "actionItems": ["行動項目1", "行動項目2"],
  "keyTopics": ["主題1", "主題2"],
  "sentiment": "positive/neutral/negative",
  "suggestedFollowUp": "建議跟進事項"
}`;

  const response = await anthropic.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: 1000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: transcription,
      },
    ],
  });

  // 從回應中提取 JSON
  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Anthropic");
  }

  try {
    const result = JSON.parse(content.text);
    return {
      summary: result.summary || "",
      actionItems: result.actionItems || [],
      keyTopics: result.keyTopics || [],
      sentiment: result.sentiment || "neutral",
      suggestedFollowUp: result.suggestedFollowUp,
    };
  } catch (error) {
    console.error("解析 Anthropic 回應失敗:", error);
    // 嘗試從文字中提取資訊
    return {
      summary: content.text.substring(0, 200) + "...",
      actionItems: [],
      keyTopics: [],
      sentiment: "neutral",
    };
  }
}

/**
 * 獲取上下文描述
 */
function getContextDescription(context: AnalysisContext): string {
  let description = "";

  switch (context.type) {
    case "meeting":
      description = "會議";
      break;
    case "call":
      description = "通話";
      break;
    case "note":
      description = "筆記";
      break;
    default:
      description = "對話";
  }

  if (context.customerName) {
    description = `與客戶 ${context.customerName} 的${description}`;
  }

  if (context.participantNames && context.participantNames.length > 0) {
    const participants = context.participantNames.join("、");
    description += `（參與者：${participants}）`;
  }

  return description;
}