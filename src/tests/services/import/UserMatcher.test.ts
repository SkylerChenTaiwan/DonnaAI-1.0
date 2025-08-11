/**
 * UserMatcher 單元測試
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UserMatcher } from '@/services/import/UserMatcher';
import { User } from '@/types/user';
import { 
  mockUsers,
  edgeCaseData
} from '../../utils/assignmentMocks';
import {
  generateTestUsers,
  generateDuplicateUsers
} from '../../utils/testDataGenerator';

describe('UserMatcher', () => {
  let matcher: UserMatcher;
  let users: User[];

  beforeEach(() => {
    users = [...mockUsers];
    matcher = new UserMatcher(users);
  });

  describe('normalizeString', () => {
    it('應該正確標準化字串', () => {
      expect(matcher.normalizeString('  張三  ')).toBe('張三');
      expect(matcher.normalizeString('John Doe')).toBe('john doe');
      expect(matcher.normalizeString('TEST@EMAIL.COM')).toBe('test@email.com');
      expect(matcher.normalizeString('  Mixed   Spaces  ')).toBe('mixed spaces');
    });

    it('應該處理空字串和 undefined', () => {
      expect(matcher.normalizeString('')).toBe('');
      expect(matcher.normalizeString(undefined as any)).toBe('');
      expect(matcher.normalizeString(null as any)).toBe('');
    });

    it('應該處理特殊字元', () => {
      expect(matcher.normalizeString('user@#$%')).toBe('user@#$%');
      expect(matcher.normalizeString('名字（括號）')).toBe('名字（括號）');
      expect(matcher.normalizeString('user-name_123')).toBe('user-name_123');
    });
  });

  describe('levenshteinDistance', () => {
    it('應該計算正確的編輯距離', () => {
      expect(matcher.levenshteinDistance('', '')).toBe(0);
      expect(matcher.levenshteinDistance('abc', 'abc')).toBe(0);
      expect(matcher.levenshteinDistance('abc', 'ab')).toBe(1);
      expect(matcher.levenshteinDistance('abc', 'adc')).toBe(1);
      expect(matcher.levenshteinDistance('abc', 'def')).toBe(3);
    });

    it('應該處理中文字元', () => {
      expect(matcher.levenshteinDistance('張三', '張三')).toBe(0);
      expect(matcher.levenshteinDistance('張三', '李四')).toBe(2);
      expect(matcher.levenshteinDistance('張三', '張四')).toBe(1);
      expect(matcher.levenshteinDistance('王小明', '王大明')).toBe(1);
    });

    it('應該處理不同長度的字串', () => {
      expect(matcher.levenshteinDistance('short', 'a very long string')).toBe(14);
      expect(matcher.levenshteinDistance('', 'test')).toBe(4);
      expect(matcher.levenshteinDistance('test', '')).toBe(4);
    });

    it('應該不區分大小寫', () => {
      expect(matcher.levenshteinDistance('ABC', 'abc')).toBe(0);
      expect(matcher.levenshteinDistance('Test', 'TEST')).toBe(0);
      expect(matcher.levenshteinDistance('John Doe', 'john doe')).toBe(0);
    });
  });

  describe('findBestMatch', () => {
    it('應該找到完全匹配的用戶（姓名）', () => {
      const result = matcher.findBestMatch('張三');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('張三');
      expect(result?.confidence).toBe(100);
      expect(result?.matchedField).toBe('name');
    });

    it('應該找到完全匹配的用戶（Email）', () => {
      const result = matcher.findBestMatch('zhang@test.com');
      
      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('zhang@test.com');
      expect(result?.confidence).toBe(100);
      expect(result?.matchedField).toBe('email');
    });

    it('應該找到完全匹配的用戶（員工編號）', () => {
      const result = matcher.findBestMatch('EMP001');
      
      expect(result).not.toBeNull();
      expect(result?.user.employeeId).toBe('EMP001');
      expect(result?.confidence).toBe(100);
      expect(result?.matchedField).toBe('employeeId');
    });

    it('應該找到模糊匹配的用戶', () => {
      const result = matcher.findBestMatch('張');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('張三');
      expect(result?.confidence).toBeGreaterThan(50);
      expect(result?.confidence).toBeLessThan(100);
      expect(result?.matchedField).toBe('name');
    });

    it('應該找到相似 Email 的用戶', () => {
      const result = matcher.findBestMatch('zhang@test.co');
      
      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('zhang@test.com');
      expect(result?.confidence).toBeGreaterThan(80);
      expect(result?.matchedField).toBe('email');
    });

    it('應該返回 null 當沒有合適的匹配', () => {
      const result = matcher.findBestMatch('完全不存在的用戶');
      
      expect(result).toBeNull();
    });

    it('應該處理空字串', () => {
      const result = matcher.findBestMatch('');
      
      expect(result).toBeNull();
    });

    it('應該優先返回信心度最高的匹配', () => {
      // 添加一個名字相似的用戶
      const extendedUsers = [
        ...users,
        { ...users[0], id: 'similar', name: '張三丰', email: 'zhangsanfeng@test.com' }
      ];
      const extendedMatcher = new UserMatcher(extendedUsers);
      
      const result = extendedMatcher.findBestMatch('張三');
      
      expect(result?.user.name).toBe('張三'); // 完全匹配優先
      expect(result?.confidence).toBe(100);
    });

    it('應該處理英文名的部分匹配', () => {
      const result = matcher.findBestMatch('John');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('John Doe');
      expect(result?.confidence).toBeGreaterThan(60);
    });

    it('應該忽略大小寫差異', () => {
      const result = matcher.findBestMatch('JOHN DOE');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('John Doe');
      expect(result?.confidence).toBe(100);
    });
  });

  describe('findAllMatches', () => {
    it('應該返回所有可能的匹配', () => {
      const results = matcher.findAllMatches('張');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].confidence).toBeGreaterThanOrEqual(results[1]?.confidence || 0);
    });

    it('應該按信心度排序', () => {
      const results = matcher.findAllMatches('test');
      
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence);
      }
    });

    it('應該返回空陣列當沒有匹配', () => {
      const results = matcher.findAllMatches('完全不存在');
      
      expect(results).toEqual([]);
    });

    it('應該限制返回的結果數量', () => {
      const manyUsers = generateTestUsers(100);
      const largeMatcher = new UserMatcher(manyUsers);
      
      const results = largeMatcher.findAllMatches('用戶', 10);
      
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  describe('處理重複名稱', () => {
    it('應該處理多個相同名稱的用戶', () => {
      const duplicateUsers = generateDuplicateUsers('張三', 5);
      const duplicateMatcher = new UserMatcher(duplicateUsers);
      
      const result = duplicateMatcher.findBestMatch('張三');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('張三');
      expect(result?.confidence).toBe(100);
    });

    it('應該通過 Email 區分相同名稱的用戶', () => {
      const duplicateUsers = generateDuplicateUsers('張三', 3);
      const duplicateMatcher = new UserMatcher(duplicateUsers);
      
      const result = duplicateMatcher.findBestMatch('張三1@test.com');
      
      expect(result).not.toBeNull();
      expect(result?.user.email).toBe('張三1@test.com');
      expect(result?.matchedField).toBe('email');
    });

    it('應該通過員工編號區分相同名稱的用戶', () => {
      const duplicateUsers = generateDuplicateUsers('張三', 3);
      const duplicateMatcher = new UserMatcher(duplicateUsers);
      
      const result = duplicateMatcher.findBestMatch('DUP002');
      
      expect(result).not.toBeNull();
      expect(result?.user.employeeId).toBe('DUP002');
      expect(result?.matchedField).toBe('employeeId');
    });
  });

  describe('混合語言支援', () => {
    it('應該匹配中文名稱', () => {
      const result = matcher.findBestMatch('李四');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('李四');
    });

    it('應該匹配英文名稱', () => {
      const result = matcher.findBestMatch('John Doe');
      
      expect(result).not.toBeNull();
      expect(result?.user.name).toBe('John Doe');
    });

    it('應該處理中英混合的查詢', () => {
      const mixedUsers = [
        ...users,
        { ...users[0], id: 'mixed1', name: 'David 陳', email: 'david.chen@test.com' },
        { ...users[0], id: 'mixed2', name: 'Mary 林', email: 'mary.lin@test.com' }
      ];
      const mixedMatcher = new UserMatcher(mixedUsers);
      
      let result = mixedMatcher.findBestMatch('David 陳');
      expect(result?.user.name).toBe('David 陳');
      
      result = mixedMatcher.findBestMatch('David');
      expect(result?.user.name).toBe('David 陳');
      
      result = mixedMatcher.findBestMatch('陳');
      expect(result?.user.name).toBe('David 陳');
    });
  });

  describe('特殊字元處理', () => {
    it('應該處理包含特殊字元的名稱', () => {
      const specialUsers = [
        { ...users[0], id: 'special1', name: '張@三', email: 'zhang.san@test.com' },
        { ...users[0], id: 'special2', name: '李-四', email: 'li-si@test.com' },
        { ...users[0], id: 'special3', name: '王_五', email: 'wang_wu@test.com' }
      ];
      const specialMatcher = new UserMatcher(specialUsers);
      
      expect(specialMatcher.findBestMatch('張@三')?.user.name).toBe('張@三');
      expect(specialMatcher.findBestMatch('李-四')?.user.name).toBe('李-四');
      expect(specialMatcher.findBestMatch('王_五')?.user.name).toBe('王_五');
    });

    it('應該處理包含特殊字元的 Email', () => {
      const specialUsers = [
        { ...users[0], id: 'special1', name: 'Test User', email: 'user.name+tag@test.com' }
      ];
      const specialMatcher = new UserMatcher(specialUsers);
      
      const result = specialMatcher.findBestMatch('user.name+tag@test.com');
      expect(result?.user.email).toBe('user.name+tag@test.com');
    });
  });

  describe('效能測試', () => {
    it('應該快速處理大量用戶', () => {
      const manyUsers = generateTestUsers(1000);
      const largeMatcher = new UserMatcher(manyUsers);
      
      const startTime = performance.now();
      const result = largeMatcher.findBestMatch('用戶500');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // 100ms 內
      expect(result).not.toBeNull();
    });

    it('應該快速執行多次搜尋', () => {
      const manyUsers = generateTestUsers(500);
      const largeMatcher = new UserMatcher(manyUsers);
      
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        largeMatcher.findBestMatch(`用戶${i}`);
      }
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(500); // 500ms 內完成 100 次搜尋
    });
  });

  describe('邊界情況', () => {
    it('應該處理空用戶列表', () => {
      const emptyMatcher = new UserMatcher([]);
      
      const result = emptyMatcher.findBestMatch('任何查詢');
      expect(result).toBeNull();
    });

    it('應該處理非常長的查詢字串', () => {
      const longQuery = '這是一個非常非常非常長的查詢字串'.repeat(10);
      const result = matcher.findBestMatch(longQuery);
      
      // 不應該崩潰，返回 null 或低信心度匹配
      expect(result === null || result.confidence < 50).toBe(true);
    });

    it('應該處理包含數字的查詢', () => {
      const result1 = matcher.findBestMatch('0912345678');
      expect(result1?.user.phoneNumber).toBe('0912345678');
      
      const result2 = matcher.findBestMatch('EMP001');
      expect(result2?.user.employeeId).toBe('EMP001');
    });

    it('應該處理 undefined 和 null 欄位', () => {
      const incompleteUsers = [
        { 
          ...users[0], 
          id: 'incomplete', 
          employeeId: undefined,
          phoneNumber: null as any
        }
      ];
      const incompleteMatcher = new UserMatcher(incompleteUsers);
      
      // 不應該因為 undefined/null 欄位而崩潰
      const result = incompleteMatcher.findBestMatch('張三');
      expect(result).not.toBeNull();
    });
  });
});