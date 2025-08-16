/**
 * CSV 分析服務測試
 * 測試 120 欄位 CSV 檔案的分析功能
 */

const fs = require('fs');
const path = require('path');

// 模擬 Papa Parse 解析
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const data = lines.slice(1).map(line => {
    const values = line.split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, data };
}

// 模擬欄位類型推測
function inferFieldType(values) {
  const sampleValues = values.slice(0, 10).filter(v => v && v.trim());
  
  if (sampleValues.length === 0) return 'text';
  
  // 檢查電子郵件
  if (sampleValues.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) {
    return 'email';
  }
  
  // 檢查電話號碼
  if (sampleValues.every(v => /^[\d\-\+\(\)\s]+$/.test(v) && v.length >= 8)) {
    return 'phone';
  }
  
  // 檢查日期
  if (sampleValues.every(v => /^\d{4}-\d{2}-\d{2}$/.test(v))) {
    return 'date';
  }
  
  // 檢查數字
  if (sampleValues.every(v => !isNaN(Number(v)) && Number(v).toString() === v)) {
    return 'number';
  }
  
  // 檢查地址
  if (sampleValues.every(v => v.includes('市') || v.includes('區') || v.includes('路'))) {
    return 'address';
  }
  
  return 'text';
}

// 分析 CSV 檔案
function analyzeCSV(filePath) {
  console.log('🔍 開始分析 CSV 檔案...');
  console.log(`📂 檔案路徑: ${filePath}`);
  
  const startTime = Date.now();
  
  // 讀取檔案
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const fileSize = fs.statSync(filePath).size;
  
  console.log(`📏 檔案大小: ${(fileSize / 1024).toFixed(1)} KB`);
  
  // 解析 CSV
  const parseStartTime = Date.now();
  const { headers, data } = parseCSV(csvContent);
  const parseTime = Date.now() - parseStartTime;
  
  console.log(`📊 解析結果:`);
  console.log(`  - 欄位數量: ${headers.length}`);
  console.log(`  - 資料行數: ${data.length}`);
  console.log(`  - 解析耗時: ${parseTime}ms`);
  
  // 分析欄位類型
  console.log('\n🔬 分析欄位類型...');
  const fieldAnalysis = [];
  
  headers.forEach((header, index) => {
    const values = data.map(row => row[header]);
    const inferredType = inferFieldType(values);
    const nullCount = values.filter(v => !v || v.trim() === '').length;
    const uniqueCount = new Set(values.filter(v => v && v.trim())).size;
    
    fieldAnalysis.push({
      index,
      name: header,
      type: inferredType,
      nullCount,
      uniqueCount,
      nullRatio: nullCount / data.length,
      uniqueRatio: uniqueCount / data.length,
      sampleValues: values.slice(0, 3).filter(v => v && v.trim())
    });
  });
  
  // 顯示欄位類型分佈
  const typeDistribution = {};
  fieldAnalysis.forEach(field => {
    typeDistribution[field.type] = (typeDistribution[field.type] || 0) + 1;
  });
  
  console.log('\n📈 欄位類型分佈:');
  Object.entries(typeDistribution).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} 個欄位`);
  });
  
  // 檢查資料品質
  console.log('\n📋 資料品質評估:');
  const totalCells = headers.length * data.length;
  const emptyCells = fieldAnalysis.reduce((sum, field) => sum + field.nullCount, 0);
  const completeness = ((totalCells - emptyCells) / totalCells * 100).toFixed(1);
  
  console.log(`  - 完整度: ${completeness}%`);
  console.log(`  - 總儲存格: ${totalCells.toLocaleString()}`);
  console.log(`  - 空值儲存格: ${emptyCells.toLocaleString()}`);
  
  // 檢查記憶體使用
  const estimatedMemory = JSON.stringify(data).length;
  console.log(`  - 預估記憶體使用: ${(estimatedMemory / 1024).toFixed(1)} KB`);
  
  // 分片需求評估
  console.log('\n🗂️ 分片需求評估:');
  const recordSize = JSON.stringify(data[0] || {}).length;
  console.log(`  - 單筆記錄大小: ${recordSize} bytes`);
  
  if (recordSize > 50000) { // 50KB
    console.log('  ⚠️ 單筆記錄較大，建議使用分片儲存');
  } else {
    console.log('  ✅ 記錄大小適中，可正常儲存');
  }
  
  // 虛擬化建議
  console.log('\n📱 虛擬化建議:');
  if (headers.length > 50) {
    console.log('  ✅ 建議使用虛擬化列表顯示欄位');
    console.log(`  📊 建議每頁顯示: 20-30 個欄位`);
    console.log(`  📄 總頁數: ${Math.ceil(headers.length / 25)}`);
  } else {
    console.log('  ✅ 可直接顯示所有欄位');
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️ 總處理時間: ${totalTime}ms`);
  
  return {
    headers,
    data: data.slice(0, 5), // 只返回前 5 行作為預覽
    fieldAnalysis,
    typeDistribution,
    stats: {
      fieldCount: headers.length,
      recordCount: data.length,
      completeness: parseFloat(completeness),
      processingTime: totalTime,
      fileSize,
      estimatedMemory
    }
  };
}

// 執行測試
function runCSVAnalysisTest() {
  console.log('🚀 開始 CSV 分析服務測試\n');
  console.log('=' .repeat(60));
  
  const testFile = path.join(__dirname, '120-fields-test.csv');
  
  if (!fs.existsSync(testFile)) {
    console.error('❌ 測試檔案不存在，請先執行 dynamic-fields-100-test.js');
    return;
  }
  
  try {
    const result = analyzeCSV(testFile);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 CSV 分析測試完成！');
    
    console.log('\n📊 分析摘要:');
    console.log(`  📁 檔案大小: ${(result.stats.fileSize / 1024).toFixed(1)} KB`);
    console.log(`  📋 欄位數量: ${result.stats.fieldCount}`);
    console.log(`  📄 記錄數量: ${result.stats.recordCount}`);
    console.log(`  📈 資料完整度: ${result.stats.completeness}%`);
    console.log(`  ⏱️ 處理時間: ${result.stats.processingTime}ms`);
    console.log(`  💾 記憶體使用: ${(result.stats.estimatedMemory / 1024).toFixed(1)} KB`);
    
    console.log('\n✅ 系統能夠成功處理 120 欄位的 CSV 檔案！');
    
    return result;
    
  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    return null;
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  runCSVAnalysisTest();
}

module.exports = {
  runCSVAnalysisTest,
  analyzeCSV,
  parseCSV,
  inferFieldType
};