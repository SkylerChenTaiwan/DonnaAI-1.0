/**
 * 用戶欄位映射引擎
 * 繼承自 FieldMappingEngine，加入用戶特定的映射邏輯
 */

import { FieldMappingEngine } from '@/services/import/FieldMappingEngine';
import { UserFieldMapping } from '@/types/userImport';
import { DataType } from '@/types/intelligentImport';

export class UserFieldMappingEngine extends FieldMappingEngine {
  // 用戶特定的欄位模式（支援中英文）
  private readonly USER_FIELD_PATTERNS: Record<string, RegExp[]> = {
    email: [
      /^(email|mail|電子郵件|電郵|信箱|e-mail|郵箱)$/i,
      /^(用戶郵件|使用者信箱|帳號|用戶帳號|登入帳號)$/i,
      /^(user_?email|member_?email|account_?email|login_?email)$/i,
      /^(郵件地址|電子信箱|聯絡信箱)$/i,
    ],
    name: [
      /^(name|姓名|名字|全名|用戶名|使用者名稱)$/i,
      /^(員工姓名|成員名稱|人員姓名|用戶姓名)$/i,
      /^(full_?name|user_?name|member_?name|display_?name|real_?name)$/i,
      /^(真實姓名|顯示名稱|會員姓名)$/i,
    ],
    department: [
      /^(department|dept|部門|單位|處室|科別)$/i,
      /^(所屬部門|隸屬單位|工作部門|服務單位)$/i,
      /^(division|section|team|group|unit)$/i,
      /^(組別|團隊|小組|分部)$/i,
    ],
    position: [
      /^(position|title|職位|職稱|職務|頭銜)$/i,
      /^(工作職稱|職級|職等|崗位)$/i,
      /^(job_?title|role_?title|designation|rank)$/i,
      /^(工作崗位|擔任職務|現職)$/i,
    ],
    phoneNumber: [
      /^(phone|phoneNumber|電話|手機|聯絡電話|行動電話)$/i,
      /^(聯絡方式|連絡電話|電話號碼|手機號碼)$/i,
      /^(mobile|cell|contact_?number|tel|telephone)$/i,
      /^(分機|辦公室電話|公司電話)$/i,
    ],
    role: [
      /^(role|角色|權限|權限等級|用戶類型|使用者類型)$/i,
      /^(permission|access_?level|user_?type|member_?type)$/i,
      /^(身份|權限角色|系統角色)$/i,
    ],
  };

  // 欄位類型映射
  private readonly FIELD_TYPE_MAP: Record<string, DataType> = {
    email: 'email',
    name: 'text',
    department: 'text',
    position: 'text',
    phoneNumber: 'phone',
    role: 'text',
  };

  constructor(openaiApiKey?: string) {
    super(openaiApiKey);
  }

  /**
   * 為用戶資料生成智能映射建議
   */
  async suggestMappings(headers: string[], sampleData?: any[][]): Promise<UserFieldMapping[]> {
    const mappings: UserFieldMapping[] = [];
    const usedSources = new Set<string>();

    // 定義目標欄位的優先順序 - 所有欄位都是選填的
    const targetFields = [
      { field: 'email', required: false },
      { field: 'name', required: false },
      { field: 'role', required: false },
      { field: 'department', required: false },
      { field: 'position', required: false },
      { field: 'phoneNumber', required: false },
    ];

    for (const target of targetFields) {
      const mapping = await this.findBestMapping(
        target.field,
        headers,
        usedSources,
        sampleData
      );

      if (mapping.sourceField) {
        usedSources.add(mapping.sourceField);
      }

      mappings.push({
        ...mapping,
        isRequired: target.required,
        dataType: this.getFieldDataType(target.field),
      });
    }

    return mappings;
  }

  /**
   * 尋找最佳映射
   */
  private async findBestMapping(
    targetField: string,
    headers: string[],
    usedSources: Set<string>,
    sampleData?: any[][]
  ): Promise<UserFieldMapping> {
    let bestMatch: {
      sourceField: string;
      confidence: number;
      method: 'pattern' | 'ai' | 'exact' | 'fuzzy';
    } | null = null;

    // 1. 嘗試精確匹配
    for (const header of headers) {
      if (usedSources.has(header)) continue;

      if (header.toLowerCase() === targetField.toLowerCase()) {
        bestMatch = {
          sourceField: header,
          confidence: 1.0,
          method: 'exact',
        };
        break;
      }
    }

    // 2. 嘗試模式匹配
    if (!bestMatch) {
      const patterns = this.USER_FIELD_PATTERNS[targetField];
      if (patterns) {
        for (const header of headers) {
          if (usedSources.has(header)) continue;

          for (const pattern of patterns) {
            if (pattern.test(header)) {
              const confidence = this.calculatePatternConfidence(header, targetField);
              if (!bestMatch || confidence > bestMatch.confidence) {
                bestMatch = {
                  sourceField: header,
                  confidence,
                  method: 'pattern',
                };
              }
            }
          }
        }
      }
    }

    // 3. 嘗試模糊匹配
    if (!bestMatch) {
      for (const header of headers) {
        if (usedSources.has(header)) continue;

        const similarity = this.calculateSimilarity(targetField, header);
        if (similarity > 0.6) {
          if (!bestMatch || similarity > bestMatch.confidence) {
            bestMatch = {
              sourceField: header,
              confidence: similarity,
              method: 'fuzzy',
            };
          }
        }
      }
    }

    // 4. 如果啟用 AI 且仍無匹配，使用 AI
    if (!bestMatch && this.openai) {
      try {
        const aiSuggestion = await this.getAISuggestion(targetField, headers, sampleData);
        if (aiSuggestion && !usedSources.has(aiSuggestion.field)) {
          bestMatch = {
            sourceField: aiSuggestion.field,
            confidence: aiSuggestion.confidence,
            method: 'ai',
          };
        }
      } catch (error) {
        console.error('AI 建議失敗:', error);
      }
    }

    return {
      sourceField: bestMatch?.sourceField || '',
      targetField,
      confidence: bestMatch?.confidence || 0,
      isRequired: false,
      dataType: this.getFieldDataType(targetField),
      method: bestMatch?.method,
    };
  }

  /**
   * 計算模式匹配的信心度
   */
  private calculatePatternConfidence(sourceField: string, targetField: string): number {
    const sourceLower = sourceField.toLowerCase();
    const targetLower = targetField.toLowerCase();

    // 完全匹配
    if (sourceLower === targetLower) return 1.0;

    // 包含目標欄位名
    if (sourceLower.includes(targetLower)) return 0.9;

    // 目標欄位包含來源
    if (targetLower.includes(sourceLower)) return 0.85;

    // 基本模式匹配
    return 0.75;
  }

  /**
   * 計算字串相似度
   */
  private calculateSimilarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase()
    );

    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein 編輯距離
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  /**
   * 使用 AI 獲取映射建議
   */
  private async getAISuggestion(
    targetField: string,
    headers: string[],
    sampleData?: any[][]
  ): Promise<{ field: string; confidence: number } | null> {
    if (!this.openai) return null;

    try {
      const prompt = this.buildAIPrompt(targetField, headers, sampleData);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一個資料映射專家，幫助識別 CSV 欄位對應關係。請分析欄位名稱和樣本資料，找出最可能對應的欄位。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      const result = response.choices[0]?.message?.content;
      if (result) {
        // 解析 AI 回應
        const match = result.match(/欄位：(.+?)，信心度：([\d.]+)/);
        if (match) {
          const suggestedField = match[1].trim();
          const confidence = parseFloat(match[2]);
          
          if (headers.includes(suggestedField)) {
            return { field: suggestedField, confidence };
          }
        }
      }
    } catch (error) {
      console.error('AI API 調用失敗:', error);
    }

    return null;
  }

  /**
   * 建立 AI 提示
   */
  private buildAIPrompt(
    targetField: string,
    headers: string[],
    sampleData?: any[][]
  ): string {
    let prompt = `請幫我找出最適合對應到「${targetField}」欄位的來源欄位。\n\n`;
    prompt += `可用的來源欄位：${headers.join(', ')}\n\n`;

    if (sampleData && sampleData.length > 0) {
      prompt += '部分樣本資料：\n';
      const samples = sampleData.slice(0, 3);
      samples.forEach((row, index) => {
        prompt += `第 ${index + 1} 列：\n`;
        headers.forEach((header, colIndex) => {
          if (row[colIndex]) {
            prompt += `  ${header}: ${row[colIndex]}\n`;
          }
        });
      });
    }

    prompt += `\n請回覆格式：欄位：[欄位名稱]，信心度：[0-1的數值]`;
    return prompt;
  }

  /**
   * 取得欄位的資料類型
   */
  private getFieldDataType(field: string): 'email' | 'text' | 'phone' | 'select' | 'date' {
    const typeMap: Record<string, 'email' | 'text' | 'phone' | 'select' | 'date'> = {
      email: 'email',
      name: 'text',
      department: 'text',
      position: 'text',
      phoneNumber: 'phone',
      role: 'select',
    };

    return typeMap[field] || 'text';
  }

  /**
   * 驗證映射完整性
   */
  validateMappings(mappings: UserFieldMapping[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 檢查必填欄位
    const requiredFields = ['email', 'name'];
    for (const field of requiredFields) {
      const mapping = mappings.find(m => m.targetField === field);
      if (!mapping || !mapping.sourceField) {
        errors.push(`必填欄位「${field}」未映射`);
      }
    }

    // 檢查重複映射
    const sourceCounts = new Map<string, number>();
    for (const mapping of mappings) {
      if (mapping.sourceField) {
        const count = (sourceCounts.get(mapping.sourceField) || 0) + 1;
        sourceCounts.set(mapping.sourceField, count);
      }
    }

    for (const [source, count] of sourceCounts.entries()) {
      if (count > 1) {
        errors.push(`來源欄位「${source}」被映射多次`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}