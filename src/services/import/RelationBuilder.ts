/**
 * 多檔案關聯建立器
 * 自動偵測和建立檔案之間的關聯關係
 */

import {
  IRelationBuilder,
  FileRelation } from '@/types/intelligentImport';

interface ParsedFile {
  name: string;
  headers: string[];
  data: any[][];
  rowCount: number;
}

interface CommonKey {
  field1: string;
  field2: string;
  similarity: number;
  dataOverlap: number;
}

export class RelationBuilder implements IRelationBuilder {
  private readonly similarityThreshold: number = 0.7;
  private readonly dataOverlapThreshold: number = 0.3;
  private readonly sampleSize: number = 100;

  /**
   * 自動偵測檔案之間的關聯
   */
  detectRelations(files: ParsedFile[]): FileRelation[] {
    const relations: FileRelation[] = [];

    // 比較每對檔案
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const fileRelations = this.detectFilePairRelations(
          files[i], 
          files[j], 
          i, 
          j
        );
        relations.push(...fileRelations);
      }
    }

    // 排序關聯（按信心度）
    relations.sort((a, b) => b.confidence - a.confidence);

    // 移除衝突的關聯
    return this.resolveConflicts(relations);
  }

  /**
   * 偵測兩個檔案之間的關聯
   */
  private detectFilePairRelations(
    file1: ParsedFile,
    file2: ParsedFile,
    file1Index: number,
    file2Index: number
  ): FileRelation[] {
    const relations: FileRelation[] = [];

    // 尋找可能的關聯鍵
    const commonKeys = this.findCommonKeys(file1, file2);

    // 為每個可能的關聯建立 FileRelation
    for (const key of commonKeys) {
      const relationType = this.detectRelationType(file1, file2, key);
      const confidence = this.calculateConfidence(file1, file2, key, relationType);

      relations.push({
        sourceFile: file1Index,
        sourceField: key.field1,
        targetFile: file2Index,
        targetField: key.field2,
        relationType,
        joinType: 'left', // 預設使用 left join
        confidence,
        matchedSamples: this.getMatchedSamples(file1, file2, key) });
    }

    return relations;
  }

  /**
   * 尋找兩個檔案之間的共同鍵
   */
  private findCommonKeys(file1: ParsedFile, file2: ParsedFile): CommonKey[] {
    const keys: CommonKey[] = [];

    // 1. 基於欄位名稱的相似度
    for (const header1 of file1.headers) {
      for (const header2 of file2.headers) {
        const similarity = this.calculateFieldSimilarity(header1, header2);
        
        if (similarity >= this.similarityThreshold) {
          // 檢查資料重疊
          const dataOverlap = this.calculateDataOverlap(
            file1, 
            file2, 
            header1, 
            header2
          );

          if (dataOverlap >= this.dataOverlapThreshold) {
            keys.push({
              field1: header1,
              field2: header2,
              similarity,
              dataOverlap });
          }
        }
      }
    }

    // 2. 基於資料內容的相似度（即使欄位名稱不同）
    if (keys.length === 0) {
      const contentBasedKeys = this.detectByDataContent(file1, file2);
      keys.push(...contentBasedKeys);
    }

    // 3. 檢查特殊的 ID 欄位
    const idKeys = this.detectIdFields(file1, file2);
    keys.push(...idKeys);

    // 去重並排序
    return this.deduplicateAndSort(keys);
  }

  /**
   * 計算欄位名稱相似度
   */
  private calculateFieldSimilarity(field1: string, field2: string): number {
    const f1 = field1.toLowerCase().trim();
    const f2 = field2.toLowerCase().trim();

    // 完全匹配
    if (f1 === f2) {
      return 1.0;
    }

    // 檢查是否包含相同的關鍵詞
    const keywords = this.extractKeywords(f1);
    const keywords2 = this.extractKeywords(f2);
    
    const commonKeywords = keywords.filter(k => keywords2.includes(k));
    if (commonKeywords.length > 0) {
      return 0.8 + (0.2 * commonKeywords.length / Math.max(keywords.length, keywords2.length));
    }

    // 使用 Jaro-Winkler 距離
    return this.jaroWinklerDistance(f1, f2);
  }

  /**
   * 提取關鍵詞
   */
  private extractKeywords(text: string): string[] {
    const keywords = [
      'id', 'key', 'code', '編號', '代碼',
      'name', '名稱', '姓名',
      'customer', '客戶', 'client',
      'order', '訂單', 'purchase',
      'product', '產品', '商品',
      'user', '用戶', '使用者',
      'company', '公司', '企業',
      'date', '日期', '時間',
      'email', '郵件', '信箱',
      'phone', '電話', '手機',
    ];

    return keywords.filter(k => text.includes(k));
  }

  /**
   * Jaro-Winkler 距離算法
   */
  private jaroWinklerDistance(s1: string, s2: string): number {
    const jaro = this.jaroDistance(s1, s2);
    
    // 計算共同前綴長度
    let prefixLength = 0;
    for (let i = 0; i < Math.min(s1.length, s2.length, 4); i++) {
      if (s1[i] === s2[i]) {
        prefixLength++;
      } else {
        break;
      }
    }

    // Jaro-Winkler 公式
    const p = 0.1; // 縮放因子
    return jaro + prefixLength * p * (1 - jaro);
  }

  /**
   * Jaro 距離算法
   */
  private jaroDistance(s1: string, s2: string): number {
    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // 尋找匹配
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0;

    // 計算轉置
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      
      while (!s2Matches[k]) k++;
      
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    return (matches / s1.length + 
            matches / s2.length + 
            (matches - transpositions / 2) / matches) / 3;
  }

  /**
   * 計算資料重疊度
   */
  private calculateDataOverlap(
    file1: ParsedFile,
    file2: ParsedFile,
    field1: string,
    field2: string
  ): number {
    const col1Index = file1.headers.indexOf(field1);
    const col2Index = file2.headers.indexOf(field2);

    if (col1Index === -1 || col2Index === -1) {
      return 0;
    }

    // 取樣資料
    const samples1 = this.getSampleData(file1.data, col1Index);
    const samples2 = this.getSampleData(file2.data, col2Index);

    // 建立集合
    const set1 = new Set(samples1.map(v => this.normalizeValue(v)));
    const set2 = new Set(samples2.map(v => this.normalizeValue(v)));

    // 計算交集
    const intersection = new Set(
      Array.from(set1).filter(x => set2.has(x))
    );

    // 計算重疊率
    const minSize = Math.min(set1.size, set2.size);
    if (minSize === 0) return 0;

    return intersection.size / minSize;
  }

  /**
   * 標準化值（用於比較）
   */
  private normalizeValue(value: any): string {
    if (value == null) return '';
    
    return String(value)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  /**
   * 獲取樣本資料
   */
  private getSampleData(data: any[][], colIndex: number): any[] {
    const samples: any[] = [];
    const step = Math.max(1, Math.floor(data.length / this.sampleSize));

    for (let i = 0; i < data.length && samples.length < this.sampleSize; i += step) {
      if (data[i] && data[i][colIndex] != null) {
        samples.push(data[i][colIndex]);
      }
    }

    return samples;
  }

  /**
   * 基於資料內容偵測關聯
   */
  private detectByDataContent(file1: ParsedFile, file2: ParsedFile): CommonKey[] {
    const keys: CommonKey[] = [];

    for (let i = 0; i < file1.headers.length; i++) {
      for (let j = 0; j < file2.headers.length; j++) {
        const overlap = this.calculateDataOverlap(
          file1,
          file2,
          file1.headers[i],
          file2.headers[j]
        );

        if (overlap >= this.dataOverlapThreshold * 1.5) {
          // 資料重疊度很高，即使欄位名稱不同也可能是關聯
          keys.push({
            field1: file1.headers[i],
            field2: file2.headers[j],
            similarity: 0.5, // 名稱相似度較低
            dataOverlap: overlap });
        }
      }
    }

    return keys;
  }

  /**
   * 偵測 ID 欄位
   */
  private detectIdFields(file1: ParsedFile, file2: ParsedFile): CommonKey[] {
    const keys: CommonKey[] = [];
    const idPatterns = [
      /^(id|ID|Id)$/,
      /_id$/i,
      /^.*(編號|代碼|code|key).*$/i,
    ];

    // 尋找可能的 ID 欄位
    const idFields1 = file1.headers.filter(h => 
      idPatterns.some(p => p.test(h))
    );
    const idFields2 = file2.headers.filter(h => 
      idPatterns.some(p => p.test(h))
    );

    // 檢查 ID 欄位之間的資料重疊
    for (const id1 of idFields1) {
      for (const id2 of idFields2) {
        const overlap = this.calculateDataOverlap(file1, file2, id1, id2);
        
        if (overlap >= this.dataOverlapThreshold) {
          keys.push({
            field1: id1,
            field2: id2,
            similarity: 0.9, // ID 欄位優先級較高
            dataOverlap: overlap });
        }
      }
    }

    return keys;
  }

  /**
   * 去重並排序關聯鍵
   */
  private deduplicateAndSort(keys: CommonKey[]): CommonKey[] {
    const uniqueKeys = new Map<string, CommonKey>();

    for (const key of keys) {
      const id = `${key.field1}-${key.field2}`;
      const existing = uniqueKeys.get(id);
      
      if (!existing || key.similarity * key.dataOverlap > existing.similarity * existing.dataOverlap) {
        uniqueKeys.set(id, key);
      }
    }

    return Array.from(uniqueKeys.values())
      .sort((a, b) => (b.similarity * b.dataOverlap) - (a.similarity * a.dataOverlap));
  }

  /**
   * 偵測關聯類型
   */
  private detectRelationType(
    file1: ParsedFile,
    file2: ParsedFile,
    key: CommonKey
  ): 'one-to-one' | 'one-to-many' | 'many-to-many' {
    const col1Index = file1.headers.indexOf(key.field1);
    const col2Index = file2.headers.indexOf(key.field2);

    if (col1Index === -1 || col2Index === -1) {
      return 'many-to-many';
    }

    // 計算唯一值比例
    const values1 = file1.data.map(row => row[col1Index]);
    const values2 = file2.data.map(row => row[col2Index]);

    const unique1 = new Set(values1.filter(v => v != null));
    const unique2 = new Set(values2.filter(v => v != null));

    const uniqueRatio1 = unique1.size / values1.length;
    const uniqueRatio2 = unique2.size / values2.length;

    // 判斷關聯類型
    if (uniqueRatio1 > 0.95 && uniqueRatio2 > 0.95) {
      return 'one-to-one';
    } else if (uniqueRatio1 > 0.95 || uniqueRatio2 > 0.95) {
      return 'one-to-many';
    } else {
      return 'many-to-many';
    }
  }

  /**
   * 計算關聯信心度
   */
  private calculateConfidence(
    file1: ParsedFile,
    file2: ParsedFile,
    key: CommonKey,
    relationType: string
  ): number {
    let confidence = 0;

    // 基礎分數：欄位相似度和資料重疊度
    confidence = (key.similarity * 0.4) + (key.dataOverlap * 0.6);

    // 根據關聯類型調整
    if (relationType === 'one-to-one') {
      confidence *= 1.1; // 一對一關聯通常更可靠
    } else if (relationType === 'many-to-many') {
      confidence *= 0.9; // 多對多關聯需要更謹慎
    }

    // 檢查是否為 ID 欄位
    const isId = /id|key|code|編號|代碼/i.test(key.field1) || 
                 /id|key|code|編號|代碼/i.test(key.field2);
    if (isId) {
      confidence *= 1.15;
    }

    return Math.min(1, confidence);
  }

  /**
   * 獲取匹配的樣本資料
   */
  private getMatchedSamples(
    file1: ParsedFile,
    file2: ParsedFile,
    key: CommonKey
  ): Array<{ sourceValue: any; targetValue: any }> {
    const samples: Array<{ sourceValue: any; targetValue: any }> = [];
    
    const col1Index = file1.headers.indexOf(key.field1);
    const col2Index = file2.headers.indexOf(key.field2);

    if (col1Index === -1 || col2Index === -1) {
      return samples;
    }

    // 建立索引
    const index2 = new Map<string, any>();
    for (const row of file2.data) {
      const value = this.normalizeValue(row[col2Index]);
      if (value && !index2.has(value)) {
        index2.set(value, row[col2Index]);
      }
    }

    // 尋找匹配
    for (const row of file1.data) {
      const value1 = row[col1Index];
      const normalized = this.normalizeValue(value1);
      
      if (normalized && index2.has(normalized)) {
        samples.push({
          sourceValue: value1,
          targetValue: index2.get(normalized) });

        if (samples.length >= 5) {
          break;
        }
      }
    }

    return samples;
  }

  /**
   * 解決關聯衝突
   */
  private resolveConflicts(relations: FileRelation[]): FileRelation[] {
    const resolved: FileRelation[] = [];
    const usedFields = new Set<string>();

    for (const relation of relations) {
      const fieldKey1 = `${relation.sourceFile}-${relation.sourceField}`;
      const fieldKey2 = `${relation.targetFile}-${relation.targetField}`;

      // 檢查欄位是否已經被使用
      if (!usedFields.has(fieldKey1) && !usedFields.has(fieldKey2)) {
        resolved.push(relation);
        usedFields.add(fieldKey1);
        usedFields.add(fieldKey2);
      }
    }

    return resolved;
  }

  /**
   * 驗證關聯
   */
  validateRelation(
    relation: FileRelation,
    data1: any[],
    data2: any[]
  ): boolean {
    // 檢查資料重疊
    const set1 = new Set(data1.map(v => this.normalizeValue(v)));
    const set2 = new Set(data2.map(v => this.normalizeValue(v)));
    
    const intersection = new Set(
      Array.from(set1).filter(x => set2.has(x))
    );

    // 至少要有一些重疊
    return intersection.size > 0;
  }

  /**
   * 優化 join 順序
   */
  optimizeJoinOrder(relations: FileRelation[]): FileRelation[] {
    // 根據關聯類型和信心度優化順序
    return relations.sort((a, b) => {
      // 優先處理一對一關聯
      if (a.relationType === 'one-to-one' && b.relationType !== 'one-to-one') {
        return -1;
      }
      if (b.relationType === 'one-to-one' && a.relationType !== 'one-to-one') {
        return 1;
      }

      // 其次按信心度排序
      return b.confidence - a.confidence;
    });
  }
}