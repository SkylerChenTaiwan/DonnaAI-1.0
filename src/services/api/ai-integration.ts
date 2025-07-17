/**
 * AI API 整合服務
 * 處理與 AI 模型的通訊，包含欄位提取、文字分析等功能
 */

import {
  AIFieldExtractionRequest,
  AIFieldExtractionResponse,
  AIFieldMapping
} from '../../types/custom-fields';
import {
  AIModel,
  AIProcessingRequest,
  AIProcessingResponse,
  AITaskType
} from '../../types/ai-processing';

// AI API 配置
interface AIAPIConfig {
  apiKey: string;
  endpoint: string;
  model: AIModel;
  maxRetries: number;
  timeout: number;
}

// 預設配置（實際應用中應從環境變數讀取）
const DEFAULT_CONFIG: AIAPIConfig = {
  apiKey: process.env.VITE_AI_API_KEY || '',
  endpoint: process.env.VITE_AI_API_ENDPOINT || 'https://api.openai.com/v1',
  model: 'gpt-4' as AIModel,
  maxRetries: 3,
  timeout: 30000 // 30 秒
};

/**
 * 呼叫 AI API 進行欄位提取
 */
export async function callAIFieldExtraction(
  request: AIFieldExtractionRequest
): Promise<AIFieldExtractionResponse> {
  try {
    const prompt = generateFieldExtractionPrompt(request);
    
    const aiResponse = await callAIAPI({
      messages: [
        {
          role: 'system',
          content: '你是一個專業的資料分析助手，擅長從文字中提取結構化資訊。請以 JSON 格式回應。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: DEFAULT_CONFIG.model,
      temperature: 0.3, // 較低的溫度以獲得更一致的結果
      response_format: { type: 'json_object' }
    });
    
    const parsedResponse = parseAIFieldExtractionResponse(
      aiResponse,
      request.fieldDefinitions
    );
    
    return parsedResponse;
  } catch (error) {
    console.error('AI 欄位提取失敗:', error);
    throw new Error('AI 欄位提取處理失敗');
  }
}

/**
 * 處理欄位描述，生成結構化的 AI 理解
 */
export async function processFieldDescription(
  description: string,
  fieldType: string
): Promise<string> {
  try {
    const prompt = `
請分析以下欄位描述，並生成一個結構化的說明，幫助 AI 更好地理解這個欄位：

欄位描述：${description}
欄位類型：${fieldType}

請提供：
1. 欄位的主要用途
2. 可能的值範圍或格式
3. 與其他欄位的潛在關聯
4. 提取時的關鍵詞或模式
`;
    
    const aiResponse = await callAIAPI({
      messages: [
        {
          role: 'system',
          content: '你是一個資料架構專家，擅長設計和理解資料欄位。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: DEFAULT_CONFIG.model,
      temperature: 0.5
    });
    
    return aiResponse.content || description;
  } catch (error) {
    console.error('處理欄位描述失敗:', error);
    // 失敗時返回原始描述
    return description;
  }
}

/**
 * 通用 AI 處理函數
 */
export async function processAIRequest(
  request: AIProcessingRequest
): Promise<AIProcessingResponse> {
  const startTime = Date.now();
  
  try {
    let result: any;
    
    switch (request.taskType) {
      case 'transcription':
        result = await processTranscription(request);
        break;
      case 'summary':
        result = await processSummary(request);
        break;
      case 'field_extraction':
        result = await processFieldExtraction(request);
        break;
      case 'action_extraction':
        result = await processActionExtraction(request);
        break;
      case 'sentiment_analysis':
        result = await processSentimentAnalysis(request);
        break;
      default:
        throw new Error(`不支援的任務類型: ${request.taskType}`);
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      requestId: request.id,
      taskType: request.taskType,
      model: request.model || DEFAULT_CONFIG.model,
      output: result.output,
      metadata: {
        processingTime,
        tokensUsed: result.tokensUsed || 0,
        cost: calculateCost(result.tokensUsed || 0),
        confidence: result.confidence
      },
      processedAt: new Date(),
      success: true
    } as AIProcessingResponse;
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    return {
      requestId: request.id,
      taskType: request.taskType,
      model: request.model || DEFAULT_CONFIG.model,
      output: {},
      metadata: {
        processingTime,
        tokensUsed: 0,
        cost: 0
      },
      processedAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    } as AIProcessingResponse;
  }
}

/**
 * 驗證 AI 回應格式
 */
export function validateAIResponse(response: any): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  // 基本驗證
  if (response.error) {
    return false;
  }
  
  // 根據不同類型的回應進行驗證
  if (response.fieldMappings && Array.isArray(response.fieldMappings)) {
    return response.fieldMappings.every((mapping: any) => 
      mapping.fieldKey && 
      typeof mapping.confidence === 'number'
    );
  }
  
  return true;
}

// === 私有輔助函數 ===

/**
 * 生成欄位提取提示
 */
function generateFieldExtractionPrompt(request: AIFieldExtractionRequest): string {
  let prompt = `從以下內容中提取指定欄位的資訊：\n\n`;
  prompt += `內容：\n${request.content}\n\n`;
  
  if (request.contextualInfo) {
    if (request.contextualInfo.customerName) {
      prompt += `客戶名稱：${request.contextualInfo.customerName}\n`;
    }
    if (request.contextualInfo.previousRecords) {
      prompt += `相關紀錄：${request.contextualInfo.previousRecords.join(', ')}\n`;
    }
    prompt += '\n';
  }
  
  prompt += `需要提取的欄位：\n`;
  request.fieldDefinitions.forEach((field, index) => {
    prompt += `${index + 1}. ${field.fieldName} (${field.fieldKey})\n`;
    prompt += `   類型：${field.fieldType}\n`;
    if (field.aiInterpretation) {
      prompt += `   說明：${field.aiInterpretation}\n`;
    }
    if (field.examples && field.examples.length > 0) {
      prompt += `   範例：${field.examples.join(', ')}\n`;
    }
  });
  
  prompt += `\n請以 JSON 格式回應，格式如下：
{
  "fieldMappings": [
    {
      "fieldKey": "欄位鍵值",
      "extractedValue": "提取的值",
      "confidence": 0.9,
      "reason": "判斷原因",
      "requiresConfirmation": false,
      "alternatives": [{"value": "替代值", "confidence": 0.7}]
    }
  ],
  "suggestedActions": ["建議的後續行動"]
}`;
  
  return prompt;
}

/**
 * 解析 AI 欄位提取回應
 */
function parseAIFieldExtractionResponse(
  aiResponse: any,
  fieldDefinitions: any[]
): AIFieldExtractionResponse {
  try {
    const parsed = typeof aiResponse.content === 'string' 
      ? JSON.parse(aiResponse.content) 
      : aiResponse.content;
    
    const fieldMappings: AIFieldMapping[] = parsed.fieldMappings || [];
    
    // 確保所有欄位都有對應（即使是空值）
    const fieldKeys = new Set(fieldMappings.map(m => m.fieldKey));
    fieldDefinitions.forEach(fieldDef => {
      if (!fieldKeys.has(fieldDef.fieldKey)) {
        fieldMappings.push({
          fieldKey: fieldDef.fieldKey,
          extractedValue: null,
          confidence: 0,
          requiresConfirmation: true
        });
      }
    });
    
    return {
      fieldMappings,
      processingMetadata: {
        modelUsed: DEFAULT_CONFIG.model,
        processingTime: 0,
        totalConfidence: calculateAverageConfidence(fieldMappings)
      },
      suggestedActions: parsed.suggestedActions || []
    };
  } catch (error) {
    console.error('解析 AI 回應失敗:', error);
    
    // 返回空的欄位對應
    return {
      fieldMappings: fieldDefinitions.map(fieldDef => ({
        fieldKey: fieldDef.fieldKey,
        extractedValue: null,
        confidence: 0,
        requiresConfirmation: true
      })),
      processingMetadata: {
        modelUsed: DEFAULT_CONFIG.model,
        processingTime: 0,
        totalConfidence: 0
      },
      suggestedActions: []
    };
  }
}

/**
 * 呼叫 AI API（底層函數）
 */
async function callAIAPI(params: any): Promise<any> {
  const { apiKey, endpoint, maxRetries, timeout } = DEFAULT_CONFIG;
  
  if (!apiKey) {
    throw new Error('未設定 AI API 金鑰');
  }
  
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '呼叫 AI API 失敗');
      }
      
      const data = await response.json();
      return data.choices[0].message;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      // 指數退避
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
  
  throw new Error('AI API 呼叫超過最大重試次數');
}

// === 特定任務處理函數 ===

async function processTranscription(request: AIProcessingRequest): Promise<any> {
  // TODO: 實作音訊轉文字
  throw new Error('音訊轉文字功能尚未實作');
}

async function processSummary(request: AIProcessingRequest): Promise<any> {
  const prompt = `請為以下內容生成一個簡潔的摘要（約 100-200 字）：\n\n${request.input.text}`;
  
  const response = await callAIAPI({
    messages: [
      { role: 'system', content: '你是一個專業的內容摘要助手。' },
      { role: 'user', content: prompt }
    ],
    model: DEFAULT_CONFIG.model,
    temperature: 0.5
  });
  
  return {
    output: { summary: response.content },
    tokensUsed: response.usage?.total_tokens || 0,
    confidence: 0.9
  };
}

async function processFieldExtraction(request: AIProcessingRequest): Promise<any> {
  // 使用專門的欄位提取函數
  const extractionRequest: AIFieldExtractionRequest = {
    content: request.input.text || '',
    fieldDefinitions: request.input.context?.fieldDefinitions || [],
    contextualInfo: request.input.context?.contextualInfo
  };
  
  const response = await callAIFieldExtraction(extractionRequest);
  
  return {
    output: { extractedFields: response.fieldMappings },
    confidence: response.processingMetadata.totalConfidence
  };
}

async function processActionExtraction(request: AIProcessingRequest): Promise<any> {
  const prompt = `從以下內容中提取所有行動項目和待辦事項：\n\n${request.input.text}`;
  
  const response = await callAIAPI({
    messages: [
      { role: 'system', content: '你是一個專業的任務分析助手。' },
      { role: 'user', content: prompt }
    ],
    model: DEFAULT_CONFIG.model,
    temperature: 0.3
  });
  
  // 解析行動項目
  const actionItems = response.content
    .split('\n')
    .filter((line: string) => line.trim())
    .map((line: string) => line.replace(/^[-*]\s*/, '').trim());
  
  return {
    output: { actionItems },
    confidence: 0.85
  };
}

async function processSentimentAnalysis(request: AIProcessingRequest): Promise<any> {
  const prompt = `分析以下內容的情感傾向，返回 -1（負面）到 1（正面）的分數：\n\n${request.input.text}`;
  
  const response = await callAIAPI({
    messages: [
      { role: 'system', content: '你是一個情感分析專家。' },
      { role: 'user', content: prompt }
    ],
    model: DEFAULT_CONFIG.model,
    temperature: 0.3
  });
  
  // 解析情感分數
  const scoreMatch = response.content.match(/-?\d*\.?\d+/);
  const score = scoreMatch ? parseFloat(scoreMatch[0]) : 0;
  const label = score < -0.3 ? 'negative' : score > 0.3 ? 'positive' : 'neutral';
  
  return {
    output: { sentiment: { score, label } },
    confidence: 0.8
  };
}

// === 輔助函數 ===

function calculateAverageConfidence(fieldMappings: AIFieldMapping[]): number {
  if (fieldMappings.length === 0) return 0;
  const sum = fieldMappings.reduce((acc, mapping) => acc + mapping.confidence, 0);
  return sum / fieldMappings.length;
}

function calculateCost(tokensUsed: number): number {
  // 簡化的成本計算（實際應根據不同模型調整）
  const costPerToken = 0.00003; // GPT-4 approximate
  return tokensUsed * costPerToken;
}