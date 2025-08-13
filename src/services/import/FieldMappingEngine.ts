/**
 * 智能欄位映射引擎
 * 使用 AI 和模式匹配來自動識別和映射欄位
 */

import {
  IFieldMappingEngine,
  FieldAnalysis,
  MappingSuggestion,
  MappingCorrection,
  DataType,
  FIELD_PATTERNS,
  DATA_FORMATS } from '@/types/intelligentImport';
import { FieldDefinition } from '@/types/organization';
import OpenAI from 'openai';

export class FieldMappingEngine implements IFieldMappingEngine {
  private confidenceThreshold: number = 0.7;
  private learningData: Map<string, MappingCorrection[]> = new Map();
  private openai: OpenAI | null = null;
  private embeddingsCache: Map<string, number[]> = new Map();

  constructor(openaiApiKey?: string) {
    if (openaiApiKey) {
      this.openai = new OpenAI({ 
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true 
      });
    }
  }

  /**
   * 分析欄位標題並推斷類型
   */
  async analyzeHeaders(
    headers: string[], 
    sampleData?: any[][]
  ): Promise<FieldAnalysis[]> {
    const analyses: FieldAnalysis[] = [];

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const samples = sampleData ? 
        sampleData.slice(0, 100).map(row => row[i]).filter(v => v != null) : 
        [];

      const analysis = await this.analyzeField(header, samples);
      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * 分析單個欄位
   */
  private async analyzeField(
    header: string, 
    samples: any[]
  ): Promise<FieldAnalysis> {
    // 使用模式匹配檢測類型
    const detectedType = this.detectTypeByPattern(header, samples);
    
    // 計算統計資料
    const statistics = this.calculateStatistics(samples);
    
    // 尋找可能的目標欄位
    const possibleTargets = await this.findPossibleTargets(header, detectedType);

    return {
      header,
      detectedType,
      confidence: this.calculateTypeConfidence(samples, detectedType),
      possibleTargets,
      samples: samples.slice(0, 5),
      statistics };
  }

  /**
   * 使用模式匹配檢測資料類型
   */
  private detectTypeByPattern(header: string, samples: any[]): DataType {
    const headerLower = header.toLowerCase();

    // 先檢查標題模式
    for (const [type, pattern] of Object.entries(FIELD_PATTERNS)) {
      if (pattern.test(header)) {
        // 映射到 DataType
        const typeMap: Record<string, DataType> = {
          'email': 'email',
          'phone': 'phone',
          'date': 'date',
          'amount': 'currency',
          'address': 'address',
          'id': 'text',
          'age': 'number',
          'gender': 'text',
          'status': 'text' };
        return typeMap[type] as DataType || 'text';
      }
    }

    // 分析樣本資料
    if (samples.length > 0) {
      const typeScores = this.analyzeDataTypes(samples);
      const bestType = Object.entries(typeScores)
        .sort(([, a], [, b]) => b - a)[0];
      
      if (bestType && bestType[1] > 0.8) {
        return bestType[0] as DataType;
      }
    }

    return 'text';
  }

  /**
   * 分析資料類型分數
   */
  private analyzeDataTypes(samples: any[]): Record<string, number> {
    const scores: Record<string, number> = {
      'email': 0,
      'phone': 0,
      'date': 0,
      'number': 0,
      'boolean': 0,
      'url': 0,
      'currency': 0,
      'percentage': 0,
      'text': 0.5, // 預設基礎分數
    };

    const validSamples = samples.filter(s => s != null && s !== '');
    if (validSamples.length === 0) return scores;

    // Email 檢測
    scores.email = validSamples.filter(s => 
      DATA_FORMATS.emailFormat.test(String(s))
    ).length / validSamples.length;

    // Phone 檢測
    scores.phone = validSamples.filter(s => {
      const str = String(s).replace(/[\s\-\(\)]/g, '');
      return DATA_FORMATS.phoneFormats.some(format => format.test(str));
    }).length / validSamples.length;

    // URL 檢測
    scores.url = validSamples.filter(s => 
      DATA_FORMATS.urlFormat.test(String(s))
    ).length / validSamples.length;

    // Date 檢測
    scores.date = validSamples.filter(s => {
      const str = String(s);
      // 檢查常見日期格式
      if (DATA_FORMATS.dateFormats.some(format => format.test(str))) {
        return true;
      }
      // 嘗試解析為日期
      const date = new Date(str);
      return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
    }).length / validSamples.length;

    // Number 檢測
    scores.number = validSamples.filter(s => {
      const num = Number(s);
      return !isNaN(num) && isFinite(num);
    }).length / validSamples.length;

    // Currency 檢測
    scores.currency = validSamples.filter(s => {
      const str = String(s);
      return /^[¥￥$€£₹₽¢]\s*[\d,]+\.?\d*$/.test(str) || 
             /^[\d,]+\.?\d*\s*[¥￥$€£₹₽¢元圓]$/.test(str) ||
             /^[\d,]+\.?\d{2}$/.test(str.replace(/[$,]/g, ''));
    }).length / validSamples.length;

    // Percentage 檢測
    scores.percentage = validSamples.filter(s => {
      const str = String(s);
      return /^\d+\.?\d*\s*%$/.test(str) || 
             (Number(s) >= 0 && Number(s) <= 1 && validSamples.every(v => Number(v) >= 0 && Number(v) <= 1));
    }).length / validSamples.length;

    // Boolean 檢測
    const booleanValues = new Set(['true', 'false', '是', '否', 'yes', 'no', '1', '0', 't', 'f']);
    scores.boolean = validSamples.filter(s => 
      booleanValues.has(String(s).toLowerCase())
    ).length / validSamples.length;

    return scores;
  }

  /**
   * 計算類型信心度
   */
  private calculateTypeConfidence(samples: any[], type: DataType): number {
    if (samples.length === 0) return 0.5;

    const typeScores = this.analyzeDataTypes(samples);
    const score = typeScores[type] || 0;

    // 如果分數很高，提高信心度
    if (score > 0.95) return 0.99;
    if (score > 0.8) return 0.9;
    if (score > 0.6) return 0.75;
    
    return score;
  }

  /**
   * 計算統計資料
   */
  private calculateStatistics(samples: any[]): any {
    const validSamples = samples.filter(s => s != null && s !== '');
    const uniqueValues = new Set(validSamples);

    const stats: any = {
      uniqueCount: uniqueValues.size,
      nullCount: samples.length - validSamples.length };

    // 字串長度統計
    const stringSamples = validSamples.filter(s => typeof s === 'string');
    if (stringSamples.length > 0) {
      const lengths = stringSamples.map(s => s.length);
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
      stats.averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    }

    return stats;
  }

  /**
   * 尋找可能的目標欄位
   */
  private async findPossibleTargets(
    header: string, 
    detectedType: DataType
  ): Promise<Array<{ field: string; score: number; reason: string }>> {
    const targets: Array<{ field: string; score: number; reason: string }> = [];

    // 常見欄位映射
    const commonMappings: Record<string, string[]> = {
      'name': ['客戶姓名', '姓名', '名稱', '聯絡人'],
      'email': ['電子郵件', '郵箱', 'Email'],
      'phone': ['電話', '手機', '聯絡電話'],
      'company': ['公司名稱', '企業', '組織'],
      'address': ['地址', '住址', '位置'],
      'date': ['日期', '建立日期', '更新日期'],
      'status': ['狀態', '情況', '進度'],
      'amount': ['金額', '價格', '總計'] };

    const headerLower = header.toLowerCase();
    
    for (const [key, mappings] of Object.entries(commonMappings)) {
      if (headerLower.includes(key)) {
        mappings.forEach(mapping => {
          targets.push({
            field: mapping,
            score: 0.8,
            reason: `標題包含 "${key}"`
          });
        });
      }
    }

    // 根據類型推薦
    const typeRecommendations: Record<DataType, string[]> = {
      'email': ['電子郵件', 'Email', '郵箱'],
      'phone': ['電話', '手機', '聯絡電話'],
      'date': ['日期', '建立日期', '更新日期'],
      'currency': ['金額', '價格', '總計', '費用'],
      'text': ['備註', '描述', '說明'],
      'number': ['數量', '編號', '序號'],
      'boolean': ['狀態', '啟用', '有效'],
      'url': ['網址', '連結', 'URL'],
      'percentage': ['百分比', '比率', '完成度'],
      'address': ['地址', '住址', '位置'] };

    const typeRecs = typeRecommendations[detectedType];
    if (typeRecs) {
      typeRecs.forEach(rec => {
        if (!targets.find(t => t.field === rec)) {
          targets.push({
            field: rec,
            score: 0.6,
            reason: `類型為 ${detectedType}`
          });
        }
      });
    }

    return targets.slice(0, 5);
  }

  /**
   * 建議欄位映射
   */
  async suggestMapping(
    source: string, 
    targets: FieldDefinition[]
  ): Promise<MappingSuggestion> {
    const suggestions: Array<{
      targetField: string;
      confidence: number;
      method: 'pattern' | 'ai' | 'exact' | 'fuzzy';
    }> = [];

    // 1. 精確匹配
    const exactMatch = targets.find(t => 
      t.name === source || t.label === source
    );
    if (exactMatch) {
      suggestions.push({
        targetField: exactMatch.name,
        confidence: 1.0,
        method: 'exact'
      });
    }

    // 2. 模式匹配
    for (const target of targets) {
      const patternScore = this.calculatePatternScore(source, target);
      if (patternScore > 0.5) {
        suggestions.push({
          targetField: target.name,
          confidence: patternScore,
          method: 'pattern'
        });
      }
    }

    // 3. 模糊匹配
    for (const target of targets) {
      const fuzzyScore = this.calculateFuzzyScore(source, target.label);
      if (fuzzyScore > 0.6) {
        suggestions.push({
          targetField: target.name,
          confidence: fuzzyScore,
          method: 'fuzzy'
        });
      }
    }

    // 4. AI 輔助匹配（如果有 OpenAI）
    if (this.openai) {
      try {
        const aiSuggestions = await this.getAISuggestions(source, targets);
        suggestions.push(...aiSuggestions);
      } catch (error) {
        console.warn('AI 匹配失敗:', error);
      }
    }

    // 排序並選擇最佳匹配
    suggestions.sort((a, b) => b.confidence - a.confidence);
    const bestMatch = suggestions[0] || {
      targetField: '',
      confidence: 0,
      method: 'pattern' as const
    };

    return {
      sourceField: source,
      bestMatch,
      alternatives: suggestions.slice(1, 4).map(s => ({
        targetField: s.targetField,
        confidence: s.confidence,
        reason: `${s.method} 匹配`
      }))
    };
  }

  /**
   * 計算模式匹配分數
   */
  private calculatePatternScore(source: string, target: FieldDefinition): number {
    const sourceLower = source.toLowerCase();
    const targetLower = target.label.toLowerCase();

    // 檢查是否包含相同的關鍵詞
    const keywords = ['name', 'email', 'phone', 'date', 'status', 'amount'];
    for (const keyword of keywords) {
      if (sourceLower.includes(keyword) && targetLower.includes(keyword)) {
        return 0.8;
      }
    }

    // 檢查中文同義詞
    const synonyms: Record<string, string[]> = {
      '姓名': ['名字', '名稱', '客戶名'],
      '電話': ['手機', '聯絡電話', '電話號碼'],
      '郵件': ['郵箱', '電子郵件', 'email'],
      '地址': ['住址', '位置', '地點'],
      '日期': ['時間', '日子'],
      '狀態': ['情況', '進度', '階段'] };

    for (const [key, values] of Object.entries(synonyms)) {
      if (source.includes(key) || values.some(v => source.includes(v))) {
        if (target.label.includes(key) || values.some(v => target.label.includes(v))) {
          return 0.75;
        }
      }
    }

    return 0;
  }

  /**
   * 計算模糊匹配分數（Levenshtein距離）
   */
  private calculateFuzzyScore(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(
      str1.toLowerCase(), 
      str2.toLowerCase()
    );
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1;
    return 1 - (distance / maxLength);
  }

  /**
   * Levenshtein 距離算法
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
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

    return matrix[str2.length][str1.length];
  }

  /**
   * 使用 AI 獲取映射建議
   */
  private async getAISuggestions(
    source: string, 
    targets: FieldDefinition[]
  ): Promise<Array<{
    targetField: string;
    confidence: number;
    method: 'ai';
  }>> {
    if (!this.openai) return [];

    try {
      // 獲取來源欄位的 embedding
      const sourceEmbedding = await this.getEmbedding(source);
      
      // 獲取目標欄位的 embeddings
      const targetEmbeddings = await Promise.all(
        targets.map(t => this.getEmbedding(t.label))
      );

      // 計算相似度
      const similarities = targetEmbeddings.map((emb, idx) => ({
        targetField: targets[idx].name,
        similarity: this.cosineSimilarity(sourceEmbedding, emb)
      }));

      // 排序並返回高相似度的結果
      return similarities
        .filter(s => s.similarity > 0.7)
        .sort((a, b) => b.similarity - a.similarity)
        .map(s => ({
          targetField: s.targetField,
          confidence: s.similarity,
          method: 'ai' as const
        }));
    } catch (error) {
      console.error('AI 建議失敗:', error);
      return [];
    }
  }

  /**
   * 獲取文字的 embedding
   */
  private async getEmbedding(text: string): Promise<number[]> {
    if (!this.openai) return [];

    // 檢查快取
    if (this.embeddingsCache.has(text)) {
      return this.embeddingsCache.get(text)!;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text });

      const embedding = response.data[0].embedding;
      
      // 快取結果
      this.embeddingsCache.set(text, embedding);
      
      return embedding;
    } catch (error) {
      console.error('獲取 embedding 失敗:', error);
      return [];
    }
  }

  /**
   * 計算餘弦相似度
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length || vec1.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * 從用戶修正中學習
   */
  async learnFromCorrections(corrections: MappingCorrection[]): Promise<void> {
    corrections.forEach(correction => {
      const key = `${correction.sourceField}-${correction.userCorrection}`;
      
      if (!this.learningData.has(key)) {
        this.learningData.set(key, []);
      }
      
      this.learningData.get(key)!.push(correction);
    });

    // 可以在這裡實作更複雜的機器學習邏輯
    // 例如：訓練一個簡單的分類器或更新權重
  }

  /**
   * 獲取信心度閾值
   */
  getConfidenceThreshold(): number {
    return this.confidenceThreshold;
  }

  /**
   * 設定信心度閾值
   */
  setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * 獲取學習資料統計
   */
  getLearningStatistics(): {
    totalCorrections: number;
    uniqueMappings: number;
    mostCommonCorrections: Array<{
      source: string;
      target: string;
      count: number;
    }>;
  } {
    let totalCorrections = 0;
    const correctionCounts = new Map<string, number>();

    this.learningData.forEach((corrections, key) => {
      totalCorrections += corrections.length;
      correctionCounts.set(key, corrections.length);
    });

    const mostCommon = Array.from(correctionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [source, target] = key.split('-');
        return { source, target, count };
      });

    return {
      totalCorrections,
      uniqueMappings: this.learningData.size,
      mostCommonCorrections: mostCommon
    };
  }
}