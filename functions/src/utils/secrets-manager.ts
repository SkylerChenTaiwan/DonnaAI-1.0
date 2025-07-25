/**
 * Secrets 管理工具
 * 統一管理 API 金鑰和敏感資訊
 */

import { defineSecret } from 'firebase-functions/params';

// 定義 secrets
export const openaiApiKey = defineSecret('OPENAI_API_KEY');
export const claudeApiKey = defineSecret('CLAUDE_API_KEY');
export const geminiApiKey = defineSecret('GEMINI_API_KEY');

// 輔助函數：取得 API 金鑰
export function getOpenAIKey(): string {
  const key = openaiApiKey.value();
  if (!key) {
    throw new Error('OpenAI API key not configured');
  }
  return key;
}

export function getClaudeKey(): string {
  const key = claudeApiKey.value();
  if (!key) {
    throw new Error('Claude API key not configured');
  }
  return key;
}

export function getGeminiKey(): string {
  const key = geminiApiKey.value();
  if (!key) {
    throw new Error('Gemini API key not configured');
  }
  return key;
}

// 檢查所有必要的 secrets 是否已設定
export function validateSecrets(): void {
  const required = [
    { name: 'OPENAI_API_KEY', value: openaiApiKey.value() },
    { name: 'CLAUDE_API_KEY', value: claudeApiKey.value() },
    { name: 'GEMINI_API_KEY', value: geminiApiKey.value() }
  ];

  const missing = required.filter(secret => !secret.value);
  
  if (missing.length > 0) {
    console.warn('Missing secrets:', missing.map(s => s.name).join(', '));
  }
}