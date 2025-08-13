/**
 * 資料類型推斷器
 * 自動檢測和推斷資料欄位的類型
 */

import {
  IDataTypeInferrer,
  DataType,
  DATA_FORMATS } from '@/types/intelligentImport';

export class DataTypeInferrer implements IDataTypeInferrer {
  private readonly sampleSize: number = 100;
  private readonly confidenceThreshold: number = 0.8;

  /**
   * 推斷單一欄位的資料類型
   */
  inferType(values: any[]): DataType {
    if (!values || values.length === 0) {
      return 'text';
    }

    // 取樣分析
    const samples = this.getSamples(values);
    
    // 計算每種類型的分數
    const typeScores = this.calculateTypeScores(samples);
    
    // 選擇最高分的類型
    const bestType = Object.entries(typeScores)
      .sort(([, a], [, b]) => b - a)
      .find(([, score]) => score >= this.confidenceThreshold);

    return (bestType?.[0] as DataType) || 'text';
  }

  /**
   * 推斷所有欄位的類型
   */
  inferAllTypes(data: any[][]): Map<string, DataType> {
    const typeMap = new Map<string, DataType>();
    
    if (!data || data.length === 0) {
      return typeMap;
    }

    const headers = data[0];
    const rows = data.slice(1);

    for (let colIndex = 0; colIndex < headers.length; colIndex++) {
      const columnValues = rows.map(row => row[colIndex]);
      const inferredType = this.inferType(columnValues);
      typeMap.set(headers[colIndex], inferredType);
    }

    return typeMap;
  }

  /**
   * 獲取特定類型的信心度
   */
  getTypeConfidence(values: any[], type: DataType): number {
    const samples = this.getSamples(values);
    const scores = this.calculateTypeScores(samples);
    return scores[type] || 0;
  }

  /**
   * 獲取樣本資料
   */
  private getSamples(values: any[]): any[] {
    // 過濾空值
    const nonNullValues = values.filter(v => 
      v !== null && v !== undefined && v !== ''
    );

    // 如果資料量小，全部使用
    if (nonNullValues.length <= this.sampleSize) {
      return nonNullValues;
    }

    // 隨機抽樣
    const samples: any[] = [];
    const step = Math.floor(nonNullValues.length / this.sampleSize);
    
    for (let i = 0; i < nonNullValues.length; i += step) {
      if (samples.length < this.sampleSize) {
        samples.push(nonNullValues[i]);
      }
    }

    return samples;
  }

  /**
   * 計算各種類型的分數
   */
  private calculateTypeScores(samples: any[]): Record<DataType, number> {
    if (samples.length === 0) {
      return { text: 1 };
    }

    const scores: Record<DataType, number> = {
      email: this.scoreEmail(samples),
      phone: this.scorePhone(samples),
      date: this.scoreDate(samples),
      number: this.scoreNumber(samples),
      boolean: this.scoreBoolean(samples),
      url: this.scoreUrl(samples),
      currency: this.scoreCurrency(samples),
      percentage: this.scorePercentage(samples),
      address: this.scoreAddress(samples),
      text: 0.3, // 基礎分數
    };

    // 標準化分數
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      Object.keys(scores).forEach(key => {
        scores[key as DataType] = scores[key as DataType] / maxScore;
      });
    }

    return scores;
  }

  /**
   * Email 類型評分
   */
  private scoreEmail(samples: any[]): number {
    const validEmails = samples.filter(s => {
      const str = String(s).trim();
      return DATA_FORMATS.emailFormat.test(str);
    });

    const score = validEmails.length / samples.length;
    
    // 額外檢查：確保有 @ 和 .
    const hasAtAndDot = samples.every(s => {
      const str = String(s);
      return str.includes('@') && str.includes('.');
    });

    return hasAtAndDot ? score * 1.2 : score;
  }

  /**
   * Phone 類型評分
   */
  private scorePhone(samples: any[]): number {
    const validPhones = samples.filter(s => {
      const str = String(s).replace(/[\s\-\(\)\+]/g, '');
      
      // 檢查是否為純數字
      if (!/^\d+$/.test(str)) {
        return false;
      }

      // 檢查長度（台灣手機10碼，市話8-9碼）
      if (str.length < 7 || str.length > 15) {
        return false;
      }

      // 檢查常見格式
      return DATA_FORMATS.phoneFormats.some(format => 
        format.test(String(s).trim())
      );
    });

    const score = validPhones.length / samples.length;

    // 額外檢查：是否有一致的格式
    const formats = new Set(samples.map(s => 
      String(s).replace(/\d/g, 'N')
    ));
    
    const hasConsistentFormat = formats.size <= 3;
    
    return hasConsistentFormat ? score * 1.1 : score;
  }

  /**
   * Date 類型評分
   */
  private scoreDate(samples: any[]): number {
    const validDates = samples.filter(s => {
      const str = String(s).trim();
      
      // 檢查常見日期格式
      const hasDateFormat = DATA_FORMATS.dateFormats.some(format => 
        format.test(str)
      );
      
      if (hasDateFormat) {
        return true;
      }

      // 嘗試解析日期
      const date = new Date(str);
      if (isNaN(date.getTime())) {
        return false;
      }

      // 檢查合理的年份範圍
      const year = date.getFullYear();
      return year >= 1900 && year <= 2100;
    });

    const score = validDates.length / samples.length;

    // 額外檢查：日期的一致性
    const parsedDates = samples.map(s => new Date(String(s)));
    const validParsedDates = parsedDates.filter(d => !isNaN(d.getTime()));
    
    if (validParsedDates.length > 0) {
      const years = validParsedDates.map(d => d.getFullYear());
      const yearRange = Math.max(...years) - Math.min(...years);
      
      // 如果年份範圍合理，增加分數
      if (yearRange < 100) {
        return score * 1.1;
      }
    }

    return score;
  }

  /**
   * Number 類型評分
   */
  private scoreNumber(samples: any[]): number {
    const validNumbers = samples.filter(s => {
      const num = Number(String(s).replace(/,/g, ''));
      return !isNaN(num) && isFinite(num);
    });

    const score = validNumbers.length / samples.length;

    // 檢查是否為整數
    const allIntegers = validNumbers.every(s => {
      const num = Number(String(s).replace(/,/g, ''));
      return Number.isInteger(num);
    });

    // 檢查數字範圍
    const numbers = validNumbers.map(s => 
      Number(String(s).replace(/,/g, ''))
    );
    
    if (numbers.length > 0) {
      const range = Math.max(...numbers) - Math.min(...numbers);
      const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
      
      // 如果範圍合理，可能是 ID 或數量
      if (range > 0 && range / avg < 1000) {
        return score * 1.1;
      }
    }

    return allIntegers ? score * 1.05 : score;
  }

  /**
   * Boolean 類型評分
   */
  private scoreBoolean(samples: any[]): number {
    const booleanValues = new Set([
      'true', 'false',
      'yes', 'no',
      '是', '否',
      '有', '無',
      '1', '0',
      't', 'f',
      'y', 'n',
    ]);

    const validBooleans = samples.filter(s => {
      const str = String(s).toLowerCase().trim();
      return booleanValues.has(str);
    });

    const score = validBooleans.length / samples.length;

    // 檢查是否只有兩種值
    const uniqueValues = new Set(samples.map(s => 
      String(s).toLowerCase().trim()
    ));
    
    if (uniqueValues.size === 2) {
      return score * 1.2;
    }

    return score;
  }

  /**
   * URL 類型評分
   */
  private scoreUrl(samples: any[]): number {
    const validUrls = samples.filter(s => {
      const str = String(s).trim();
      
      // 基本 URL 格式檢查
      if (!DATA_FORMATS.urlFormat.test(str)) {
        return false;
      }

      // 嘗試解析 URL
      try {
        new URL(str);
        return true;
      } catch {
        return false;
      }
    });

    const score = validUrls.length / samples.length;

    // 檢查是否有一致的域名
    const domains = new Set(
      validUrls.map(s => {
        try {
          return new URL(String(s)).hostname;
        } catch {
          return null;
        }
      }).filter(d => d !== null)
    );

    // 如果域名相對集中，可能是相關連結
    if (domains.size > 0 && domains.size <= samples.length / 3) {
      return score * 1.1;
    }

    return score;
  }

  /**
   * Currency 類型評分
   */
  private scoreCurrency(samples: any[]): number {
    const currencyPatterns = [
      /^[¥￥$€£₹₽¢]\s*[\d,]+\.?\d*$/,
      /^[\d,]+\.?\d*\s*[¥￥$€£₹₽¢元圓]$/,
      /^NT\$?\s*[\d,]+\.?\d*$/,
      /^USD?\s*[\d,]+\.?\d*$/,
      /^[\d,]+\.?\d{2}$/,
    ];

    const validCurrency = samples.filter(s => {
      const str = String(s).trim();
      
      // 檢查貨幣格式
      const hasPattern = currencyPatterns.some(pattern => 
        pattern.test(str)
      );
      
      if (hasPattern) {
        return true;
      }

      // 檢查是否為帶小數的數字（可能是金額）
      const cleanStr = str.replace(/[$,¥￥€£]/g, '');
      const num = Number(cleanStr);
      
      if (!isNaN(num) && cleanStr.includes('.')) {
        // 檢查是否恰好有兩位小數
        const parts = cleanStr.split('.');
        return parts[1]?.length === 2;
      }

      return false;
    });

    const score = validCurrency.length / samples.length;

    // 檢查數值範圍（金額通常為正數）
    const amounts = samples.map(s => {
      const cleanStr = String(s).replace(/[^0-9.-]/g, '');
      return Number(cleanStr);
    }).filter(n => !isNaN(n));

    const allPositive = amounts.every(n => n >= 0);
    
    return allPositive ? score * 1.1 : score;
  }

  /**
   * Percentage 類型評分
   */
  private scorePercentage(samples: any[]): number {
    const validPercentages = samples.filter(s => {
      const str = String(s).trim();
      
      // 檢查是否有百分號
      if (str.endsWith('%')) {
        const numStr = str.slice(0, -1);
        const num = Number(numStr);
        return !isNaN(num);
      }

      // 檢查是否為 0-1 之間的小數
      const num = Number(str);
      if (!isNaN(num) && num >= 0 && num <= 1) {
        // 確保大多數值都在 0-1 之間
        return true;
      }

      // 檢查是否為 0-100 之間的數字
      if (!isNaN(num) && num >= 0 && num <= 100) {
        // 需要更多上下文才能確定
        return false;
      }

      return false;
    });

    const score = validPercentages.length / samples.length;

    // 檢查一致性
    const hasPercentSign = samples.some(s => String(s).includes('%'));
    const allHavePercentSign = samples.every(s => String(s).includes('%'));
    
    if (hasPercentSign && allHavePercentSign) {
      return score * 1.2;
    }

    return score;
  }

  /**
   * Address 類型評分
   */
  private scoreAddress(samples: any[]): number {
    const addressKeywords = [
      '路', '街', '巷', '弄', '號', '樓',
      '市', '區', '縣', '鄉', '鎮', '里', '村',
      '省', '國', '州',
      'Road', 'Street', 'Avenue', 'Lane',
      'City', 'District', 'County',
    ];

    const validAddresses = samples.filter(s => {
      const str = String(s).trim();
      
      // 檢查長度（地址通常較長）
      if (str.length < 5) {
        return false;
      }

      // 檢查是否包含地址關鍵詞
      const hasKeyword = addressKeywords.some(keyword => 
        str.includes(keyword)
      );

      if (hasKeyword) {
        return true;
      }

      // 檢查是否有數字和文字混合（門牌號碼）
      const hasNumber = /\d/.test(str);
      const hasText = /[a-zA-Z\u4e00-\u9fa5]/.test(str);
      
      return hasNumber && hasText && str.length > 10;
    });

    const score = validAddresses.length / samples.length;

    // 檢查格式一致性
    const avgLength = samples.reduce((sum, s) => 
      sum + String(s).length, 0
    ) / samples.length;
    
    // 地址通常有一定長度
    if (avgLength > 15) {
      return score * 1.1;
    }

    return score;
  }

  /**
   * 獲取類型的詳細分析報告
   */
  getDetailedAnalysis(values: any[]): {
    inferredType: DataType;
    confidence: number;
    typeScores: Record<DataType, number>;
    samples: any[];
    statistics: {
      totalValues: number;
      nonNullValues: number;
      uniqueValues: number;
      mostCommonValue?: any;
      mostCommonValueCount?: number;
    };
  } {
    const samples = this.getSamples(values);
    const typeScores = this.calculateTypeScores(samples);
    const inferredType = this.inferType(values);
    const confidence = typeScores[inferredType] || 0;

    // 計算統計資料
    const nonNullValues = values.filter(v => 
      v !== null && v !== undefined && v !== ''
    );
    const valueCounts = new Map<any, number>();
    
    nonNullValues.forEach(v => {
      const key = String(v);
      valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
    });

    const sortedCounts = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      inferredType,
      confidence,
      typeScores,
      samples: samples.slice(0, 5),
      statistics: {
        totalValues: values.length,
        nonNullValues: nonNullValues.length,
        uniqueValues: valueCounts.size,
        mostCommonValue: sortedCounts[0]?.[0],
        mostCommonValueCount: sortedCounts[0]?.[1] } };
  }
}