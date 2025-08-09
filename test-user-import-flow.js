/**
 * 用戶匯入功能自動化測試腳本
 * 測試核心業務邏輯和資料處理流程
 */

const fs = require('fs');
const path = require('path');

// 模擬 CSV 解析 (簡化版本)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    return record;
  });
  
  return { headers, data };
}

// 模擬用戶資料驗證器
class UserDataValidator {
  static validateUser(userData) {
    const errors = [];
    const warnings = [];
    
    // 必填欄位檢查
    if (!userData.email || userData.email.trim() === '') {
      errors.push('電子信箱為必填欄位');
    } else {
      // Email 格式驗證
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push('電子信箱格式無效');
      }
    }
    
    if (!userData.name || userData.name.trim() === '') {
      errors.push('姓名為必填欄位');  
    }
    
    // 電話格式驗證 (選填但如果有就要正確)
    if (userData.phoneNumber && userData.phoneNumber.trim() !== '') {
      const phoneRegex = /^[\d\-\s\+\(\)]+$/;
      if (!phoneRegex.test(userData.phoneNumber)) {
        warnings.push('電話號碼格式可能不正確');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// 模擬智能欄位映射引擎
class FieldMappingEngine {
  static suggestMappings(headers) {
    const mappings = [];
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      let targetField = null;
      let confidence = 0;
      
      // Email 欄位映射
      if (lowerHeader.includes('email') || lowerHeader.includes('信箱') || lowerHeader.includes('mail')) {
        targetField = 'email';
        confidence = 0.95;
      }
      // 姓名欄位映射
      else if (lowerHeader.includes('name') || lowerHeader.includes('姓名') || lowerHeader.includes('名字')) {
        targetField = 'name';
        confidence = 0.90;
      }
      // 部門欄位映射
      else if (lowerHeader.includes('dept') || lowerHeader.includes('部門') || lowerHeader.includes('department')) {
        targetField = 'department';
        confidence = 0.85;
      }
      // 職位欄位映射
      else if (lowerHeader.includes('position') || lowerHeader.includes('職位') || lowerHeader.includes('title')) {
        targetField = 'position';
        confidence = 0.80;
      }
      // 電話欄位映射
      else if (lowerHeader.includes('phone') || lowerHeader.includes('電話') || lowerHeader.includes('手機')) {
        targetField = 'phoneNumber';
        confidence = 0.85;
      }
      
      if (targetField) {
        mappings.push({
          sourceField: header,
          targetField,
          confidence,
          isRequired: ['email', 'name'].includes(targetField),
          method: 'pattern'
        });
      }
    });
    
    return mappings;
  }
}

// 測試函數集合
class UserImportTester {
  constructor() {
    this.testResults = [];
  }
  
  // 記錄測試結果
  logTest(testName, success, message, data = null) {
    this.testResults.push({
      testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    });
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
    if (data && !success) {
      console.log('   詳細資料:', JSON.stringify(data, null, 2));
    }
  }
  
  // 測試檔案解析功能
  testFileParsingSimple() {
    console.log('\n📋 測試 1: 簡易模式檔案解析');
    
    try {
      const filePath = path.join(__dirname, 'test-users-simple.csv');
      const content = fs.readFileSync(filePath, 'utf8');
      const result = parseCSV(content);
      
      // 驗證解析結果
      const expectedHeaders = ['姓名', '電子信箱', '部門', '職位', '電話'];
      const headersMatch = expectedHeaders.every(h => result.headers.includes(h));
      
      this.logTest(
        '檔案解析',
        headersMatch && result.data.length === 5,
        `解析出 ${result.data.length} 筆資料，${result.headers.length} 個欄位`,
        { headers: result.headers, sampleData: result.data[0] }
      );
      
      return result;
      
    } catch (error) {
      this.logTest('檔案解析', false, `解析失敗: ${error.message}`);
      return null;
    }
  }
  
  // 測試智能欄位映射
  testFieldMapping(parseResult) {
    console.log('\n🧠 測試 2: 智能欄位映射');
    
    if (!parseResult) {
      this.logTest('欄位映射', false, '無法進行映射測試，解析結果為空');
      return null;
    }
    
    const mappings = FieldMappingEngine.suggestMappings(parseResult.headers);
    
    // 驗證映射結果
    const requiredFields = ['email', 'name'];
    const hasAllRequired = requiredFields.every(field => 
      mappings.some(m => m.targetField === field)
    );
    
    const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
    
    this.logTest(
      '智能欄位映射',
      hasAllRequired && avgConfidence > 0.8,
      `映射 ${mappings.length} 個欄位，平均信心度: ${Math.round(avgConfidence * 100)}%`,
      { mappings: mappings.map(m => ({ source: m.sourceField, target: m.targetField, confidence: m.confidence })) }
    );
    
    return mappings;
  }
  
  // 測試資料轉換
  testDataTransformation(parseResult, mappings) {
    console.log('\n🔄 測試 3: 資料轉換');
    
    if (!parseResult || !mappings) {
      this.logTest('資料轉換', false, '無法進行轉換測試，缺少必要資料');
      return null;
    }
    
    try {
      const transformedData = parseResult.data.map((row, index) => {
        const transformed = {
          id: `user_${index}`,
          isValid: true,
          validationErrors: [],
          isDuplicate: false,
          isEdited: false,
          isSelected: true
        };
        
        // 應用欄位映射
        mappings.forEach(mapping => {
          const sourceValue = row[mapping.sourceField] || '';
          transformed[mapping.targetField] = sourceValue;
        });
        
        return transformed;
      });
      
      this.logTest(
        '資料轉換',
        transformedData.length === parseResult.data.length,
        `成功轉換 ${transformedData.length} 筆資料`,
        { sampleTransformed: transformedData[0] }
      );
      
      return transformedData;
      
    } catch (error) {
      this.logTest('資料轉換', false, `轉換失敗: ${error.message}`);
      return null;
    }
  }
  
  // 測試資料驗證
  testDataValidation(transformedData) {
    console.log('\n✅ 測試 4: 資料驗證');
    
    if (!transformedData) {
      this.logTest('資料驗證', false, '無法進行驗證測試，轉換資料為空');
      return null;
    }
    
    let validCount = 0;
    let errorCount = 0;
    let warningCount = 0;
    const allErrors = [];
    
    const validatedData = transformedData.map(user => {
      const validation = UserDataValidator.validateUser(user);
      
      user.isValid = validation.isValid;
      user.validationErrors = validation.errors;
      
      if (validation.isValid) {
        validCount++;
      } else {
        errorCount++;
        allErrors.push(...validation.errors);
      }
      
      if (validation.warnings && validation.warnings.length > 0) {
        warningCount++;
      }
      
      return user;
    });
    
    // 檢查重複 email
    const emailCounts = {};
    validatedData.forEach((user, index) => {
      if (user.email) {
        emailCounts[user.email] = (emailCounts[user.email] || []).concat(index);
      }
    });
    
    Object.entries(emailCounts).forEach(([email, indices]) => {
      if (indices.length > 1) {
        indices.forEach(index => {
          validatedData[index].isDuplicate = true;
          validatedData[index].isValid = false;
          validatedData[index].validationErrors.push('電子信箱重複');
        });
      }
    });
    
    this.logTest(
      '資料驗證',
      validCount > 0,
      `驗證完成: ${validCount} 筆有效，${errorCount} 筆錯誤，${warningCount} 筆警告`,
      { 
        stats: { validCount, errorCount, warningCount },
        sampleErrors: allErrors.slice(0, 3)
      }
    );
    
    return validatedData;
  }
  
  // 測試錯誤處理
  testErrorHandling() {
    console.log('\n🚨 測試 5: 錯誤處理');
    
    try {
      // 測試無效檔案
      const invalidContent = "";
      const emptyResult = parseCSV(invalidContent);
      
      this.logTest(
        '空檔案處理',
        emptyResult.headers.length === 0 && emptyResult.data.length === 0,
        '正確處理空檔案'
      );
      
      // 測試錯誤資料檔案
      const errorFilePath = path.join(__dirname, 'test-users-invalid.csv');
      if (fs.existsSync(errorFilePath)) {
        const errorContent = fs.readFileSync(errorFilePath, 'utf8');
        const errorResult = parseCSV(errorContent);
        
        if (errorResult.data.length > 0) {
          const mappings = FieldMappingEngine.suggestMappings(errorResult.headers);
          const transformedErrorData = errorResult.data.map((row, index) => {
            const transformed = { id: `user_${index}` };
            mappings.forEach(mapping => {
              transformed[mapping.targetField] = row[mapping.sourceField] || '';
            });
            return transformed;
          });
          
          const validatedErrorData = transformedErrorData.map(user => {
            const validation = UserDataValidator.validateUser(user);
            return {
              ...user,
              isValid: validation.isValid,
              validationErrors: validation.errors
            };
          });
          
          const invalidCount = validatedErrorData.filter(u => !u.isValid).length;
          
          this.logTest(
            '錯誤資料檢測',
            invalidCount > 0,
            `正確檢測出 ${invalidCount} 筆無效資料`,
            { 
              totalData: validatedErrorData.length,
              invalidData: invalidCount,
              sampleErrors: validatedErrorData.filter(u => !u.isValid).slice(0, 2)
            }
          );
        }
      }
      
    } catch (error) {
      this.logTest('錯誤處理', false, `錯誤處理測試失敗: ${error.message}`);
    }
  }
  
  // 測試多檔案合併 (簡化版本)
  testMultiFileMerging() {
    console.log('\n🔗 測試 6: 多檔案合併');
    
    try {
      const file1Path = path.join(__dirname, 'test-users-departments.csv');
      const file2Path = path.join(__dirname, 'test-users-positions.csv');
      
      if (!fs.existsSync(file1Path) || !fs.existsSync(file2Path)) {
        this.logTest('多檔案合併', false, '測試檔案不存在，跳過合併測試');
        return;
      }
      
      const content1 = fs.readFileSync(file1Path, 'utf8');
      const content2 = fs.readFileSync(file2Path, 'utf8');
      
      const result1 = parseCSV(content1);
      const result2 = parseCSV(content2);
      
      // 簡化的合併邏輯（按 email 合併）
      const mergedData = [];
      const emailMap = new Map();
      
      // 處理第一個檔案
      result1.data.forEach(row => {
        if (row.email) {
          emailMap.set(row.email, { ...row, source: 'file1' });
        }
      });
      
      // 合併第二個檔案
      result2.data.forEach(row => {
        const emailKey = row.email_address || row.email;
        if (emailKey && emailMap.has(emailKey)) {
          const existing = emailMap.get(emailKey);
          emailMap.set(emailKey, { 
            ...existing, 
            ...row,
            email: emailKey, // 統一 email 欄位
            source: 'merged'
          });
        } else if (emailKey) {
          emailMap.set(emailKey, { 
            ...row, 
            email: emailKey,
            source: 'file2'
          });
        }
      });
      
      const mergedArray = Array.from(emailMap.values());
      
      this.logTest(
        '多檔案合併',
        mergedArray.length > 0,
        `合併結果: ${mergedArray.length} 筆資料，來源: ${result1.data.length} + ${result2.data.length} 筆`,
        { 
          originalCounts: [result1.data.length, result2.data.length],
          mergedCount: mergedArray.length,
          sampleMerged: mergedArray[0]
        }
      );
      
    } catch (error) {
      this.logTest('多檔案合併', false, `合併測試失敗: ${error.message}`);
    }
  }
  
  // 執行所有測試
  runAllTests() {
    console.log('🚀 開始執行用戶匯入功能測試...\n');
    
    const parseResult = this.testFileParsingSimple();
    const mappings = this.testFieldMapping(parseResult);
    const transformedData = this.testDataTransformation(parseResult, mappings);
    const validatedData = this.testDataValidation(transformedData);
    
    this.testErrorHandling();
    this.testMultiFileMerging();
    
    // 生成測試報告
    this.generateReport();
  }
  
  // 生成測試報告
  generateReport() {
    console.log('\n📊 測試報告摘要');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`總測試數: ${totalTests}`);
    console.log(`通過: ${passedTests} ✅`);
    console.log(`失敗: ${failedTests} ❌`);
    console.log(`通過率: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (failedTests > 0) {
      console.log('\n失敗的測試:');
      this.testResults.filter(r => !r.success).forEach(test => {
        console.log(`  - ${test.testName}: ${test.message}`);
      });
    }
    
    console.log('\n測試完成! 🎉');
    
    // 將結果寫入檔案
    const reportPath = path.join(__dirname, 'user-import-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      summary: {
        totalTests,
        passedTests,
        failedTests,
        passRate: Math.round((passedTests / totalTests) * 100),
        timestamp: new Date().toISOString()
      },
      results: this.testResults
    }, null, 2));
    
    console.log(`\n詳細結果已儲存至: ${reportPath}`);
  }
}

// 執行測試
if (require.main === module) {
  const tester = new UserImportTester();
  tester.runAllTests();
}

module.exports = { UserImportTester, UserDataValidator, FieldMappingEngine };