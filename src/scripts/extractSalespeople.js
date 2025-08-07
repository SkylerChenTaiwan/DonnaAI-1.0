/**
 * 從客戶 CSV 中提取業務員名單
 * 使用方法：node src/scripts/extractSalespeople.js [csv檔案路徑]
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('csv-parse');

// 取得命令行參數
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.log('使用方法：node src/scripts/extractSalespeople.js [csv檔案路徑]');
  console.log('範例：node src/scripts/extractSalespeople.js ~/Downloads/customers.csv');
  process.exit(1);
}

// 檢查檔案是否存在
if (!fs.existsSync(csvFilePath)) {
  console.error('❌ 檔案不存在:', csvFilePath);
  process.exit(1);
}

console.log('📂 讀取檔案:', csvFilePath);

// 用於儲存業務員資訊
const salespeopleMap = new Map();
const possibleSalesColumns = [
  '業務名稱', '負責業務', '業務員', '業務', '銷售員', '負責人',
  'salesperson', 'sales', 'responsible', '負責業務員'
];

// 讀取並解析 CSV
const results = [];
const fileContent = fs.readFileSync(csvFilePath, 'utf-8');

// 使用 csv-parse 解析
parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  encoding: 'utf-8'
}, (err, records) => {
  if (err) {
    console.error('❌ 解析 CSV 失敗:', err);
    process.exit(1);
  }

  console.log(`✅ 成功讀取 ${records.length} 筆資料\n`);

  // 找出業務員欄位
  const headers = Object.keys(records[0] || {});
  console.log('📋 CSV 欄位:', headers.join(', '));
  
  let salesColumn = null;
  for (const col of possibleSalesColumns) {
    if (headers.includes(col)) {
      salesColumn = col;
      break;
    }
  }

  if (!salesColumn) {
    // 嘗試模糊匹配
    for (const header of headers) {
      if (header.includes('業務') || header.includes('sales') || header.includes('負責')) {
        salesColumn = header;
        break;
      }
    }
  }

  if (!salesColumn) {
    console.log('\n⚠️  找不到業務員欄位，顯示所有欄位供您選擇：');
    headers.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h}`);
    });
    console.log('\n請修改腳本中的 possibleSalesColumns 陣列，加入正確的欄位名稱');
    process.exit(1);
  }

  console.log(`\n🔍 使用欄位「${salesColumn}」作為業務員名稱\n`);

  // 提取所有業務員
  records.forEach((record, index) => {
    const salesName = record[salesColumn];
    if (salesName && salesName.trim()) {
      const name = salesName.trim();
      if (!salespeopleMap.has(name)) {
        salespeopleMap.set(name, {
          name: name,
          count: 1,
          firstSeen: index + 2, // 行號（加上標題行）
          samples: [record]
        });
      } else {
        const info = salespeopleMap.get(name);
        info.count++;
        if (info.samples.length < 3) {
          info.samples.push(record);
        }
      }
    }
  });

  // 顯示統計
  console.log('=================================');
  console.log('     業務員統計分析');
  console.log('=================================\n');
  
  console.log(`找到 ${salespeopleMap.size} 位不同的業務員\n`);

  // 排序並顯示
  const sorted = Array.from(salespeopleMap.entries())
    .sort((a, b) => b[1].count - a[1].count);

  sorted.forEach(([name, info], index) => {
    console.log(`${index + 1}. ${name}`);
    console.log(`   負責客戶數: ${info.count}`);
    console.log(`   首次出現: 第 ${info.firstSeen} 行`);
    
    // 顯示樣本客戶
    if (info.samples.length > 0) {
      console.log('   樣本客戶:');
      info.samples.forEach((sample, i) => {
        const customerName = sample['客戶姓名'] || sample['客戶名稱'] || sample['姓名'] || sample['name'] || '(無名稱)';
        console.log(`     ${i + 1}. ${customerName}`);
      });
    }
    console.log('');
  });

  // 生成業務員匯入檔案
  const outputPath = path.join(path.dirname(csvFilePath), 'salespeople_to_import.csv');
  const csvContent = [
    ['姓名', 'Email', '密碼', '角色', '部門'].join(','),
    ...sorted.map(([name, info]) => {
      // 生成 Email（使用拼音或簡單處理）
      const emailName = name.toLowerCase().replace(/\s+/g, '');
      const email = `${emailName}@company.com`;
      const password = 'Pass@2024'; // 預設密碼
      const role = 'salesperson'; // 預設角色
      const department = '業務部'; // 預設部門
      
      return [
        name,
        email,
        password,
        role,
        department
      ].map(field => `"${field}"`).join(',');
    })
  ].join('\n');

  // 加入 BOM 以支援 Excel 開啟
  const bom = '\ufeff';
  fs.writeFileSync(outputPath, bom + csvContent, 'utf-8');
  
  console.log('=================================');
  console.log('     匯出業務員清單');
  console.log('=================================\n');
  console.log(`✅ 已生成業務員匯入檔案：`);
  console.log(`   ${outputPath}\n`);
  console.log('📝 檔案內容：');
  console.log('   - 姓名：從 CSV 提取');
  console.log('   - Email：自動生成（請手動修改）');
  console.log('   - 密碼：預設 Pass@2024（請通知用戶修改）');
  console.log('   - 角色：預設 salesperson');
  console.log('   - 部門：預設 業務部\n');
  console.log('⚠️  請注意：');
  console.log('   1. 檢查並修改 Email 地址');
  console.log('   2. 確認角色設定（salesperson/manager）');
  console.log('   3. 調整部門名稱');
  console.log('   4. 匯入後通知用戶修改密碼');
});