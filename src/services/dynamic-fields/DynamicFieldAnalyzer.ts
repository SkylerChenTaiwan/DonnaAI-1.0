/**
 * 動態欄位分析服務
 * 負責分析 CSV 欄位、推測資料類型、偵測 PII、提供智慧映射建議
 */

import {
  FieldDataType,
  PIIType,
  FieldAnalysis,
  CSVAnalysisResult,
  DynamicFieldConfig,
  FieldStatistics,
  DataQualityIssue,
  DetectedField,
  createSafeFieldKey,
  isValidFieldDataType,
  FIELD_TYPE_VALIDATION_RULES,
} from '@/types/dynamic-field-mapping';

/**
 * 欄位模式定義
 */
const FIELD_PATTERNS: Record<string, RegExp> = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\d\s\-\(\)\+\.]{7,20}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  date: /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/,
  datetime: /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?/,
  currency: /^[¥￥$€£₹₽¢]\s*[\d,]+\.?\d*$|^[\d,]+\.?\d*\s*[¥￥$€£₹₽¢元圓]$/,
  percentage: /^\d+\.?\d*\s*%$/,
  ssn: /^\d{3}-\d{2}-\d{4}$|^\d{9}$/,
  creditCard: /^\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}$/,
  idNumber: /^[A-Z][12]\d{8}$/, // 台灣身分證
  passport: /^[A-Z0-9]{6,9}$/,
};

/**
 * PII 欄位名稱關鍵字
 */
const PII_KEYWORDS: Record<PIIType, string[]> = {
  email: ['email', 'mail', '郵件', '信箱', 'e-mail'],
  phone: ['phone', 'tel', 'mobile', '電話', '手機', '聯絡'],
  ssn: ['ssn', 'social', 'security', '社會', '保險'],
  creditCard: ['credit', 'card', '信用卡', '卡號'],
  idNumber: ['id', 'identity', '身分證', '身份證'],
  passport: ['passport', '護照'],
  bankAccount: ['bank', 'account', '銀行', '帳號', '帳戶'],
};

export class DynamicFieldAnalyzer {
  private confidenceThreshold: number = 0.7;
  private maxSampleSize: number = 1000;

  /**
   * 分析 CSV 欄位
   */
  async analyzeCSV(
    headers: string[],
    data: any[][],
    options?: {
      maxRows?: number;
      detectPII?: boolean;
      useAI?: boolean;
    }
  ): Promise<CSVAnalysisResult> {
    const startTime = Date.now();
    const sampleData = data.slice(0, options?.maxRows || this.maxSampleSize);

    // 分析每個欄位
    const detectedFields: DetectedField[] = [];
    const fieldStatistics: Record<string, FieldStatistics> = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const columnData = sampleData.map(row => row[i]).filter(v => v != null);
      
      const field = await this.analyzeField(header, columnData, i);
      detectedFields.push(field);
      
      fieldStatistics[header] = this.calculateStatistics(columnData);
    }

    // 評估資料品質
    const dataQuality = this.assessDataQuality(detectedFields, sampleData);

    // 建立分析結果
    const result: CSVAnalysisResult = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileInfo: {
        fileName: '',
        fileSize: 0,
        encoding: 'UTF-8',
        delimiter: ',',
        hasHeader: true,
        rowCount: data.length,
        columnCount: headers.length,
        fileHash: '',
      },
      detectedFields,
      dataPreview: sampleData.slice(0, 10).map(row => {
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      }),
      statistics: {
        totalRecords: data.length,
        validRecords: data.filter(row => this.isValidRow(row)).length,
        errorRecords: 0,
        duplicateRecords: this.countDuplicates(data),
        completeness: this.calculateCompleteness(data),
        fieldStatistics,
      },
      dataQuality,
      analyzedAt: new Date() as any,
      processingTime: Date.now() - startTime,
    };

    return result;
  }

  /**
   * 分析單一欄位
   */
  private async analyzeField(
    header: string,
    samples: any[],
    index: number
  ): Promise<DetectedField> {
    const cleanedName = createSafeFieldKey(header);
    const { type, confidence } = this.inferDataType(samples);
    const { nullCount, uniqueCount } = this.calculateFieldMetrics(samples);
    const semanticType = this.inferSemanticType(header, samples);

    return {
      index,
      originalName: header,
      cleanedName,
      inferredType: type,
      typeConfidence: confidence,
      sampleValues: samples.slice(0, 5),
      nullCount,
      uniqueCount,
      possibleFormats: this.detectFormats(samples, type),
      semanticType,
    };
  }

  /**
   * 推測資料類型
   */
  private inferDataType(samples: any[]): { type: FieldDataType; confidence: number } {
    if (samples.length === 0) {
      return { type: 'text', confidence: 0.5 };
    }

    const typeScores: Record<FieldDataType, number> = {
      text: 0,
      number: 0,
      date: 0,
      datetime: 0,
      email: 0,
      phone: 0,
      url: 0,
      boolean: 0,
      json: 0,
      array: 0,
      currency: 0,
      percentage: 0,
      select: 0,
      multiselect: 0,
      longtext: 0,
      address: 0,
    };

    const validSamples = samples.filter(s => s != null && s !== '');
    if (validSamples.length === 0) {
      return { type: 'text', confidence: 0.5 };
    }

    // 檢測每種類型
    for (const sample of validSamples) {
      const sampleStr = String(sample);

      // Email
      if (FIELD_PATTERNS.email.test(sampleStr)) {
        typeScores.email++;
      }

      // Phone
      if (FIELD_PATTERNS.phone.test(sampleStr.replace(/[\s\-\(\)]/g, ''))) {
        typeScores.phone++;
      }

      // URL
      if (FIELD_PATTERNS.url.test(sampleStr)) {
        typeScores.url++;
      }

      // Date/DateTime
      if (FIELD_PATTERNS.datetime.test(sampleStr)) {
        typeScores.datetime++;
      } else if (FIELD_PATTERNS.date.test(sampleStr)) {
        typeScores.date++;
      }

      // Currency
      if (FIELD_PATTERNS.currency.test(sampleStr)) {
        typeScores.currency++;
      }

      // Percentage
      if (FIELD_PATTERNS.percentage.test(sampleStr)) {
        typeScores.percentage++;
      }

      // Number
      const num = Number(sampleStr.replace(/[,$]/g, ''));
      if (!isNaN(num) && isFinite(num)) {
        typeScores.number++;
      }

      // Boolean
      const boolValues = ['true', 'false', '是', '否', 'yes', 'no', '1', '0'];
      if (boolValues.includes(sampleStr.toLowerCase())) {
        typeScores.boolean++;
      }

      // JSON
      try {
        JSON.parse(sampleStr);
        typeScores.json++;
      } catch {}

      // Array
      if (sampleStr.includes(',') || sampleStr.includes(';')) {
        typeScores.array++;
      }

      // Long text (超過 200 字元)
      if (sampleStr.length > 200) {
        typeScores.longtext++;
      }

      // Address (包含地址關鍵字)
      const addressKeywords = ['路', '街', '巷', '弄', '號', '樓', '室', 'road', 'street', 'ave'];
      if (addressKeywords.some(kw => sampleStr.toLowerCase().includes(kw))) {
        typeScores.address++;
      }
    }

    // 計算每種類型的信心度
    const typeConfidences: Array<{ type: FieldDataType; confidence: number }> = [];
    for (const [type, score] of Object.entries(typeScores)) {
      const confidence = score / validSamples.length;
      if (confidence > 0) {
        typeConfidences.push({ type: type as FieldDataType, confidence });
      }
    }

    // 排序並選擇最高信心度的類型
    typeConfidences.sort((a, b) => b.confidence - a.confidence);

    if (typeConfidences.length > 0 && typeConfidences[0].confidence >= this.confidenceThreshold) {
      return typeConfidences[0];
    }

    // 檢查是否為選擇類型（唯一值較少）
    const uniqueValues = new Set(validSamples);
    if (uniqueValues.size <= 10 && uniqueValues.size < validSamples.length * 0.1) {
      return { type: 'select', confidence: 0.8 };
    }

    // 預設為文字
    return { type: 'text', confidence: 0.6 };
  }

  /**
   * 推測語意類型
   */
  private inferSemanticType(header: string, samples: any[]): string | undefined {
    const headerLower = header.toLowerCase();

    // 檢查 PII 類型
    for (const [piiType, keywords] of Object.entries(PII_KEYWORDS)) {
      if (keywords.some(kw => headerLower.includes(kw))) {
        return `pii:${piiType}`;
      }
    }

    // 檢查常見業務類型
    const businessTypes: Record<string, string[]> = {
      'customer_name': ['客戶', 'customer', 'client', '顧客'],
      'product': ['產品', 'product', '商品', 'item'],
      'price': ['價格', 'price', '金額', 'amount'],
      'quantity': ['數量', 'quantity', 'qty', '數目'],
      'status': ['狀態', 'status', '情況', 'state'],
      'category': ['類別', 'category', '分類', 'type'],
      'description': ['描述', 'description', '說明', 'desc'],
    };

    for (const [type, keywords] of Object.entries(businessTypes)) {
      if (keywords.some(kw => headerLower.includes(kw))) {
        return type;
      }
    }

    return undefined;
  }

  /**
   * 檢測可能的格式
   */
  private detectFormats(samples: any[], dataType: FieldDataType): string[] {
    const formats: Set<string> = new Set();

    switch (dataType) {
      case 'date':
        if (samples.some(s => /^\d{4}-\d{2}-\d{2}$/.test(String(s)))) {
          formats.add('YYYY-MM-DD');
        }
        if (samples.some(s => /^\d{2}\/\d{2}\/\d{4}$/.test(String(s)))) {
          formats.add('MM/DD/YYYY');
        }
        if (samples.some(s => /^\d{2}-\d{2}-\d{4}$/.test(String(s)))) {
          formats.add('DD-MM-YYYY');
        }
        break;

      case 'phone':
        if (samples.some(s => /^\+\d+/.test(String(s)))) {
          formats.add('International');
        }
        if (samples.some(s => /^\d{10}$/.test(String(s).replace(/\D/g, '')))) {
          formats.add('10-digit');
        }
        break;

      case 'currency':
        const currencies = ['USD', 'TWD', 'EUR', 'GBP', 'JPY', 'CNY'];
        for (const curr of currencies) {
          if (samples.some(s => String(s).includes(curr))) {
            formats.add(curr);
          }
        }
        break;
    }

    return Array.from(formats);
  }

  /**
   * 計算欄位指標
   */
  private calculateFieldMetrics(samples: any[]): { nullCount: number; uniqueCount: number } {
    const nullCount = samples.filter(s => s == null || s === '').length;
    const uniqueValues = new Set(samples.filter(s => s != null && s !== ''));
    return { nullCount, uniqueCount: uniqueValues.size };
  }

  /**
   * 計算統計資料
   */
  private calculateStatistics(samples: any[]): FieldStatistics {
    const validSamples = samples.filter(s => s != null && s !== '');
    const stats: FieldStatistics = {
      nullRatio: (samples.length - validSamples.length) / samples.length,
      uniqueRatio: new Set(validSamples).size / validSamples.length,
    };

    // 數值統計
    const numbers = validSamples
      .map(s => Number(String(s).replace(/[,$]/g, '')))
      .filter(n => !isNaN(n) && isFinite(n));

    if (numbers.length > 0) {
      stats.min = Math.min(...numbers);
      stats.max = Math.max(...numbers);
      stats.mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      
      // 計算中位數
      const sorted = numbers.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      stats.median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      
      // 計算標準差
      const variance = numbers.reduce((acc, n) => acc + Math.pow(n - stats.mean!, 2), 0) / numbers.length;
      stats.standardDeviation = Math.sqrt(variance);
    }

    // 字串統計
    const strings = validSamples.filter(s => typeof s === 'string');
    if (strings.length > 0) {
      const lengths = strings.map(s => s.length);
      stats.min = Math.min(...lengths);
      stats.max = Math.max(...lengths);
    }

    // 眾數（最常見的值）
    const frequency: Record<string, number> = {};
    for (const value of validSamples) {
      const key = String(value);
      frequency[key] = (frequency[key] || 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(frequency));
    const mode = Object.entries(frequency).find(([_, freq]) => freq === maxFreq);
    if (mode) {
      stats.mode = mode[0];
    }

    return stats;
  }

  /**
   * 評估資料品質
   */
  private assessDataQuality(fields: DetectedField[], data: any[][]): {
    overallScore: number;
    issues: DataQualityIssue[];
    recommendations: string[];
  } {
    const issues: DataQualityIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // 檢查空值問題
    for (const field of fields) {
      const nullRatio = field.nullCount / data.length;
      if (nullRatio > 0.5) {
        issues.push({
          type: 'missing_value',
          severity: nullRatio > 0.8 ? 'critical' : 'high',
          affectedFields: [field.originalName],
          affectedRecords: field.nullCount,
          description: `欄位 "${field.originalName}" 有 ${(nullRatio * 100).toFixed(1)}% 的空值`,
          suggestedFix: '考慮移除此欄位或設定預設值',
        });
        score -= 10;
      }
    }

    // 檢查類型推測信心度
    for (const field of fields) {
      if (field.typeConfidence < 0.5) {
        issues.push({
          type: 'inconsistent',
          severity: 'medium',
          affectedFields: [field.originalName],
          affectedRecords: 0,
          description: `欄位 "${field.originalName}" 的資料類型不一致`,
          suggestedFix: '檢查並清理資料格式',
        });
        score -= 5;
      }
    }

    // 檢查重複資料
    const duplicateCount = this.countDuplicates(data);
    if (duplicateCount > 0) {
      const duplicateRatio = duplicateCount / data.length;
      issues.push({
        type: 'duplicate',
        severity: duplicateRatio > 0.1 ? 'high' : 'low',
        affectedFields: [],
        affectedRecords: duplicateCount,
        description: `發現 ${duplicateCount} 筆重複記錄`,
        suggestedFix: '移除或合併重複記錄',
      });
      score -= duplicateRatio * 20;
    }

    // 產生建議
    if (issues.some(i => i.type === 'missing_value')) {
      recommendations.push('建議在匯入前填補空值或設定預設值');
    }
    if (issues.some(i => i.type === 'inconsistent')) {
      recommendations.push('建議統一資料格式後再匯入');
    }
    if (issues.some(i => i.type === 'duplicate')) {
      recommendations.push('建議設定唯一鍵以避免重複匯入');
    }

    return {
      overallScore: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  /**
   * 檢查是否為有效列
   */
  private isValidRow(row: any[]): boolean {
    // 至少有一個非空值
    return row.some(value => value != null && value !== '');
  }

  /**
   * 計算重複記錄數
   */
  private countDuplicates(data: any[][]): number {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const row of data) {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  /**
   * 計算完整度
   */
  private calculateCompleteness(data: any[][]): number {
    if (data.length === 0) return 0;

    let totalCells = 0;
    let filledCells = 0;

    for (const row of data) {
      for (const cell of row) {
        totalCells++;
        if (cell != null && cell !== '') {
          filledCells++;
        }
      }
    }

    return totalCells > 0 ? filledCells / totalCells : 0;
  }

  /**
   * 偵測 PII
   */
  detectPII(field: DetectedField): { isPII: boolean; piiType?: PIIType; confidence: number } {
    const headerLower = field.originalName.toLowerCase();
    
    // 檢查欄位名稱
    for (const [piiType, keywords] of Object.entries(PII_KEYWORDS)) {
      if (keywords.some(kw => headerLower.includes(kw))) {
        return { isPII: true, piiType: piiType as PIIType, confidence: 0.9 };
      }
    }

    // 檢查資料內容
    const samples = field.sampleValues;
    for (const [piiType, pattern] of Object.entries({
      email: FIELD_PATTERNS.email,
      ssn: FIELD_PATTERNS.ssn,
      creditCard: FIELD_PATTERNS.creditCard,
      idNumber: FIELD_PATTERNS.idNumber,
      passport: FIELD_PATTERNS.passport,
    })) {
      const matchCount = samples.filter(s => s != null && pattern.test(String(s))).length;
      if (matchCount > samples.length * 0.5) {
        return { isPII: true, piiType: piiType as PIIType, confidence: matchCount / samples.length };
      }
    }

    return { isPII: false, confidence: 0 };
  }

  /**
   * 建立欄位配置建議
   */
  createFieldConfig(field: DetectedField): DynamicFieldConfig {
    const piiDetection = this.detectPII(field);
    
    return {
      id: `field_${Date.now()}_${field.index}`,
      fieldKey: field.cleanedName,
      displayName: field.originalName,
      dataType: field.inferredType,
      description: field.semanticType,
      defaultValue: undefined,
      isSystem: false,
      isActive: true,
      isSearchable: field.inferredType !== 'longtext' && field.inferredType !== 'json',
      isSortable: ['text', 'number', 'date', 'datetime', 'currency', 'percentage'].includes(field.inferredType),
      validationRules: FIELD_TYPE_VALIDATION_RULES[field.inferredType] || [],
      formatting: this.getDefaultFormatting(field),
      security: {
        level: piiDetection.isPII ? 'confidential' : 'internal',
        readRoles: ['admin', 'user'],
        writeRoles: ['admin'],
        encrypted: piiDetection.isPII,
        auditLog: piiDetection.isPII,
        isPII: piiDetection.isPII,
        piiType: piiDetection.piiType,
      },
      usage: {
        usageCount: 0,
        nullRatio: field.nullCount / field.sampleValues.length,
        uniqueValueCount: field.uniqueCount,
      },
      metadata: {
        createdBy: 'system',
        createdAt: new Date() as any,
        updatedBy: 'system',
        updatedAt: new Date() as any,
        source: 'csv_import',
        originalName: field.originalName,
        tags: field.semanticType ? [field.semanticType] : [],
      },
    };
  }

  /**
   * 取得預設格式化設定
   */
  private getDefaultFormatting(field: DetectedField): any {
    switch (field.inferredType) {
      case 'date':
        return { dateFormat: field.possibleFormats?.[0] || 'YYYY-MM-DD' };
      case 'datetime':
        return { dateFormat: 'YYYY-MM-DD HH:mm:ss' };
      case 'currency':
        return {
          numberFormat: {
            decimals: 2,
            thousandsSeparator: ',',
            decimalSeparator: '.',
            prefix: '$',
          },
        };
      case 'percentage':
        return {
          numberFormat: {
            decimals: 2,
            suffix: '%',
          },
        };
      default:
        return undefined;
    }
  }
}