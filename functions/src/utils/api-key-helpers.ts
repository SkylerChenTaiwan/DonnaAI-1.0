/**
 * API Key 輔助函數
 * 處理 v1 到 v2 的遷移
 */

import { openaiApiKey, claudeApiKey, geminiApiKey } from "./secrets-manager";

// 延遲初始化的 API Keys
let _openaiKey: string | undefined;
let _claudeKey: string | undefined;
let _geminiKey: string | undefined;

/**
 * 獲取 OpenAI API Key
 */
export function getOpenAIApiKey(): string | undefined {
  if (!_openaiKey) {
    try {
      _openaiKey = openaiApiKey.value();
    } catch {
      _openaiKey = process.env.OPENAI_API_KEY;
    }
  }
  return _openaiKey;
}

/**
 * 獲取 Claude API Key
 */
export function getClaudeApiKey(): string | undefined {
  if (!_claudeKey) {
    try {
      _claudeKey = claudeApiKey.value();
    } catch {
      _claudeKey = process.env.CLAUDE_API_KEY;
    }
  }
  return _claudeKey;
}

/**
 * 獲取 Gemini API Key
 */
export function getGeminiApiKey(): string | undefined {
  if (!_geminiKey) {
    try {
      _geminiKey = geminiApiKey.value();
    } catch {
      _geminiKey = process.env.GEMINI_API_KEY;
    }
  }
  return _geminiKey;
}