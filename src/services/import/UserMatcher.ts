/**
 * 用戶匹配服務
 * 智能識別和匹配 CSV 中的用戶資訊
 */

import { UserMatchResult } from '@/types/assignment';
import { User } from '@/types/user';
import { getFirebaseDb } from '@/services/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export class UserMatcher {
  private organizationUsers: User[] = [];
  private emailIndex: Map<string, User> = new Map();
  private nameIndex: Map<string, User> = new Map();
  private employeeIdIndex: Map<string, User> = new Map();
  private phoneIndex: Map<string, User> = new Map();
  private organizationId?: string;
  
  constructor(organizationIdOrUsers: string | User[]) {
    if (typeof organizationIdOrUsers === 'string') {
      this.organizationId = organizationIdOrUsers;
    } else {
      // 支援直接傳入用戶陣列（用於測試）
      this.organizationUsers = organizationIdOrUsers;
      this.buildIndexes();
    }
  }

  /**
   * 初始化匹配器，建立索引
   */
  async initialize(): Promise<void> {
    // 如果已經有用戶資料（從建構函數傳入），則不需要再載入
    if (this.organizationUsers.length === 0 && this.organizationId) {
      await this.loadOrganizationUsers();
      this.buildIndexes();
    }
  }

  /**
   * 載入組織用戶
   */
  private async loadOrganizationUsers(): Promise<void> {
    const db = getFirebaseDb();
    const usersQuery = query(
      collection(db, 'users'),
      where('organizationId', '==', this.organizationId)
    );
    
    const snapshot = await getDocs(usersQuery);
    this.organizationUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  }

  /**
   * 建立搜尋索引
   */
  private buildIndexes(): void {
    for (const user of this.organizationUsers) {
      // Email 索引
      if (user.email) {
        this.emailIndex.set(user.email.toLowerCase(), user);
      }
      
      // 姓名索引
      if (user.name) {
        this.nameIndex.set(user.name.toLowerCase(), user);
        
        // 也索引姓名的各種變體
        const nameParts = user.name.split(' ');
        if (nameParts.length > 1) {
          // 索引姓和名
          this.nameIndex.set(nameParts[0].toLowerCase(), user);
          this.nameIndex.set(nameParts[nameParts.length - 1].toLowerCase(), user);
          
          // 索引反向組合（處理中文姓名）
          const reversedName = nameParts.reverse().join('');
          this.nameIndex.set(reversedName.toLowerCase(), user);
        }
      }
      
      // 員工編號索引
      if (user.employeeId) {
        this.employeeIdIndex.set(user.employeeId.toLowerCase(), user);
      }
      
      // 電話號碼索引
      if (user.phoneNumber) {
        this.phoneIndex.set(user.phoneNumber.toLowerCase(), user);
      }
    }
  }

  /**
   * 匹配用戶
   */
  async matchUser(
    input: string,
    strategy: 'exact' | 'fuzzy' | 'smart' = 'smart'
  ): Promise<UserMatchResult | null> {
    const cleanInput = input.trim().toLowerCase();
    
    if (strategy === 'exact') {
      return this.exactMatch(cleanInput);
    } else if (strategy === 'fuzzy') {
      return this.fuzzyMatch(cleanInput);
    } else {
      // Smart 策略：先嘗試精確匹配，再嘗試模糊匹配
      const exactResult = this.exactMatch(cleanInput);
      if (exactResult) return exactResult;
      
      return this.fuzzyMatch(cleanInput);
    }
  }

  /**
   * 精確匹配
   */
  private exactMatch(input: string): UserMatchResult | null {
    // 檢查 Email
    if (this.emailIndex.has(input)) {
      const user = this.emailIndex.get(input)!;
      return {
        user,
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        matchType: 'exact',
        matchField: 'email',
        matchedField: 'email',
        confidence: 100
      };
    }
    
    // 檢查姓名
    if (this.nameIndex.has(input)) {
      const user = this.nameIndex.get(input)!;
      return {
        user,
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        matchType: 'exact',
        matchField: 'name',
        matchedField: 'name',
        confidence: 100
      };
    }
    
    // 檢查員工編號
    if (this.employeeIdIndex.has(input)) {
      const user = this.employeeIdIndex.get(input)!;
      return {
        user,
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        matchType: 'exact',
        matchField: 'employeeId',
        matchedField: 'employeeId',
        confidence: 100
      };
    }
    
    // 檢查電話號碼
    if (this.phoneIndex.has(input)) {
      const user = this.phoneIndex.get(input)!;
      return {
        user,
        userId: user.id,
        userName: user.name || user.email,
        userEmail: user.email,
        matchType: 'exact',
        matchField: 'phoneNumber',
        matchedField: 'phoneNumber',
        confidence: 100
      };
    }
    
    return null;
  }

  /**
   * 模糊匹配
   */
  private fuzzyMatch(input: string): UserMatchResult | null {
    let bestMatch: UserMatchResult | null = null;
    let highestScore = 0;
    
    // 檢查是否像 Email
    if (this.looksLikeEmail(input)) {
      for (const [email, user] of this.emailIndex) {
        const score = this.calculateSimilarity(input, email);
        if (score > highestScore && score > 0.7) {
          highestScore = score;
          bestMatch = {
            user,
            userId: user.id,
            userName: user.name || user.email,
            userEmail: user.email,
            matchType: 'fuzzy',
            matchField: 'email',
            matchedField: 'email',
            confidence: Math.round(score * 100),
            score
          };
        }
      }
    }
    
    // 姓名模糊匹配
    for (const [name, user] of this.nameIndex) {
      const score = this.calculateSimilarity(input, name);
      if (score > highestScore && score > 0.5) { // 降低門檻以匹配部分名稱
        highestScore = score;
        bestMatch = {
          user,
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          matchType: 'fuzzy',
          matchField: 'name',
          matchedField: 'name',
          confidence: Math.round(score * 100),
          score
        };
      }
    }
    
    // 員工編號模糊匹配（只有在非常接近時才匹配）
    for (const [employeeId, user] of this.employeeIdIndex) {
      const score = this.calculateSimilarity(input, employeeId);
      if (score > highestScore && score > 0.8) {
        highestScore = score;
        bestMatch = {
          user,
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          matchType: 'fuzzy',
          matchField: 'employeeId',
          matchedField: 'employeeId',
          confidence: Math.round(score * 100),
          score
        };
      }
    }
    
    // 電話號碼模糊匹配
    for (const [phone, user] of this.phoneIndex) {
      const score = this.calculateSimilarity(input, phone);
      if (score > highestScore && score > 0.8) {
        highestScore = score;
        bestMatch = {
          user,
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          matchType: 'fuzzy',
          matchField: 'phoneNumber',
          matchedField: 'phoneNumber',
          confidence: Math.round(score * 100),
          score
        };
      }
    }
    
    // 如果沒有找到足夠好的匹配，再嘗試部分匹配
    if (!bestMatch || highestScore < 0.5) {
      for (const user of this.organizationUsers) {
        // 檢查是否部分匹配
        if (user.name && user.name.toLowerCase().includes(input)) {
          const score = input.length / user.name.length; // 簡單的部分匹配分數
          if (score > highestScore) {
            highestScore = score;
            bestMatch = {
              user,
              userId: user.id,
              userName: user.name || user.email,
              userEmail: user.email,
              matchType: 'fuzzy',
              matchField: 'name',
              matchedField: 'name',
              confidence: Math.round(score * 100),
              score
            };
          }
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * 標準化字串
   */
  normalizeString(str: string): string {
    if (!str) return '';
    return str.toString().toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * 尋找最佳匹配
   */
  findBestMatch(input: string): UserMatchResult | null {
    return this.fuzzyMatch(this.normalizeString(input));
  }

  /**
   * 尋找所有匹配
   */
  findAllMatches(input: string, limit: number = 10): UserMatchResult[] {
    const normalizedInput = this.normalizeString(input);
    const matches: UserMatchResult[] = [];
    
    // 檢查精確匹配
    const exactMatch = this.exactMatch(normalizedInput);
    if (exactMatch) {
      matches.push(exactMatch);
    }
    
    // 模糊匹配所有用戶
    for (const user of this.organizationUsers) {
      if (matches.length >= limit) break;
      
      const scores = [];
      let matchField = 'multiple';
      
      if (user.email) {
        const emailScore = this.calculateSimilarity(normalizedInput, user.email.toLowerCase());
        scores.push(emailScore);
        if (emailScore === Math.max(...scores)) matchField = 'email';
      }
      if (user.name) {
        const nameScore = this.calculateSimilarity(normalizedInput, user.name.toLowerCase());
        scores.push(nameScore);
        if (nameScore === Math.max(...scores)) matchField = 'name';
      }
      if (user.employeeId) {
        const idScore = this.calculateSimilarity(normalizedInput, user.employeeId.toLowerCase());
        scores.push(idScore);
        if (idScore === Math.max(...scores)) matchField = 'employeeId';
      }
      if (user.phoneNumber) {
        const phoneScore = this.calculateSimilarity(normalizedInput, user.phoneNumber.toLowerCase());
        scores.push(phoneScore);
        if (phoneScore === Math.max(...scores)) matchField = 'phoneNumber';
      }
      
      const maxScore = Math.max(...scores, 0);
      if (maxScore > 0.3 && !matches.find(m => m.userId === user.id)) {
        matches.push({
          user,
          userId: user.id,
          userName: user.name || user.email,
          userEmail: user.email,
          matchType: 'fuzzy',
          matchField: matchField,
          matchedField: matchField,
          confidence: Math.round(maxScore * 100)
        });
      }
    }
    
    // 按信心度排序
    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }

  /**
   * 計算字符串相似度
   */
  calculateSimilarity(str1: string, str2: string): number {
    // 使用 Levenshtein 距離計算相似度
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLength);
  }

  /**
   * Levenshtein 距離算法
   */
  levenshteinDistance(str1: string, str2: string): number {
    // 將字串轉換為小寫以實現大小寫不敏感
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
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
            matrix[i - 1][j - 1] + 1, // 替換
            matrix[i][j - 1] + 1,     // 插入
            matrix[i - 1][j] + 1      // 刪除
          );
        }
      }
    }
    
    return matrix[s2.length][s1.length];
  }

  /**
   * 檢查字符串是否像 Email
   */
  private looksLikeEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  /**
   * 批量匹配用戶
   */
  async batchMatch(
    inputs: string[],
    strategy: 'exact' | 'fuzzy' | 'smart' = 'smart'
  ): Promise<Map<string, UserMatchResult | null>> {
    const results = new Map<string, UserMatchResult | null>();
    
    for (const input of inputs) {
      const result = await this.matchUser(input, strategy);
      results.set(input, result);
    }
    
    return results;
  }

  /**
   * 獲取匹配建議
   */
  getSuggestions(input: string, limit: number = 5): User[] {
    const cleanInput = input.trim().toLowerCase();
    const suggestions: Array<{ user: User; score: number }> = [];
    
    // 收集所有可能的匹配
    for (const user of this.organizationUsers) {
      let score = 0;
      
      // Email 相似度
      if (user.email) {
        const emailScore = this.calculateSimilarity(cleanInput, user.email.toLowerCase());
        score = Math.max(score, emailScore);
      }
      
      // 姓名相似度
      if (user.name) {
        const nameScore = this.calculateSimilarity(cleanInput, user.name.toLowerCase());
        score = Math.max(score, nameScore);
      }
      
      // 員工編號相似度
      if (user.employeeId) {
        const idScore = this.calculateSimilarity(cleanInput, user.employeeId.toLowerCase());
        score = Math.max(score, idScore);
      }
      
      if (score > 0.3) {
        suggestions.push({ user, score });
      }
    }
    
    // 排序並返回前 N 個
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.user);
  }

  /**
   * 智能識別 CSV 中的負責人欄位
   */
  detectAssigneeColumn(headers: string[], sampleData: any[]): string | null {
    const possibleColumns = [
      '負責人', '業務', '業務員', '銷售', '銷售員', '負責業務',
      'assignee', 'assigned_to', 'owner', 'salesperson', 'sales_rep',
      'representative', 'manager', '經理', '主管', 'email', 'user'
    ];
    
    // 先尋找完全匹配
    for (const header of headers) {
      const cleanHeader = header.toLowerCase().trim();
      if (possibleColumns.some(col => col.toLowerCase() === cleanHeader)) {
        return header;
      }
    }
    
    // 尋找部分匹配
    for (const header of headers) {
      const cleanHeader = header.toLowerCase().trim();
      if (possibleColumns.some(col => cleanHeader.includes(col.toLowerCase()))) {
        // 驗證該欄位是否包含用戶相關資料
        if (this.validateAssigneeColumn(header, sampleData)) {
          return header;
        }
      }
    }
    
    // 透過內容推測
    for (const header of headers) {
      if (this.validateAssigneeColumn(header, sampleData)) {
        return header;
      }
    }
    
    return null;
  }

  /**
   * 驗證欄位是否包含用戶資料
   */
  private validateAssigneeColumn(column: string, sampleData: any[]): boolean {
    let matchCount = 0;
    const sampleSize = Math.min(10, sampleData.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const value = sampleData[i][column];
      if (!value) continue;
      
      const stringValue = value.toString().trim();
      
      // 檢查是否像 Email
      if (this.looksLikeEmail(stringValue)) {
        matchCount++;
        continue;
      }
      
      // 檢查是否可能是姓名
      if (this.looksLikeName(stringValue)) {
        matchCount++;
        continue;
      }
    }
    
    // 如果超過 30% 的樣本看起來像用戶資料，認為這是負責人欄位
    return matchCount >= sampleSize * 0.3;
  }

  /**
   * 檢查字符串是否像姓名
   */
  private looksLikeName(str: string): boolean {
    // 中文姓名（2-4 個字）
    if (/^[\u4e00-\u9fa5]{2,4}$/.test(str)) {
      return true;
    }
    
    // 英文姓名（包含空格）
    if (/^[a-zA-Z]+(\s+[a-zA-Z]+)+$/.test(str)) {
      return true;
    }
    
    // 混合姓名
    if (/^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/.test(str)) {
      return true;
    }
    
    return false;
  }
}