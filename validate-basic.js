#!/usr/bin/env node

/**
 * 基本驗證腳本
 * 檢查 Adaptive Architecture 系統的基本功能
 */

const fs = require('fs');
const path = require('path');

// 檢查項目
const checks = [
  {
    name: '檢查核心檔案結構',
    test: () => {
      const requiredFiles = [
        'src/components/adaptive/platform/PlatformAdapter.ts',
        'src/components/adaptive/core/AdaptiveView.tsx',
        'src/components/adaptive/core/AdaptiveText.tsx',
        'src/components/adaptive/core/AdaptiveButton.tsx',
        'tools/validation/unified-validator.ts',
        'tools/code-analysis/analyzer.ts',
        'tools/design-system-checker/checker.ts',
        'tools/migration-assistant/migrator.ts',
        'docs/adaptive-architecture/README.md',
      ];
      
      const missing = requiredFiles.filter(file => 
        !fs.existsSync(path.join(__dirname, file))
      );
      
      return {
        success: missing.length === 0,
        message: missing.length === 0 
          ? `所有 ${requiredFiles.length} 個核心檔案都存在` 
          : `缺少 ${missing.length} 個檔案: ${missing.join(', ')}`,
        details: { required: requiredFiles.length, missing: missing.length }
      };
    }
  },
  
  {
    name: '檢查設計系統',
    test: () => {
      try {
        const designSystemPath = path.join(__dirname, 'src/theme/designSystem.ts');
        if (!fs.existsSync(designSystemPath)) {
          return { success: false, message: '找不到設計系統檔案' };
        }
        
        const content = fs.readFileSync(designSystemPath, 'utf8');
        const hasColors = content.includes('colors');
        const hasSpacing = content.includes('spacing');
        const hasTypography = content.includes('typography');
        
        const foundTokens = [hasColors, hasSpacing, hasTypography].filter(Boolean).length;
        
        return {
          success: foundTokens >= 2,
          message: `找到 ${foundTokens}/3 個主要設計 token 類別`,
          details: { colors: hasColors, spacing: hasSpacing, typography: hasTypography }
        };
      } catch (error) {
        return { success: false, message: `檢查設計系統時出錯: ${error.message}` };
      }
    }
  },
  
  {
    name: '檢查 Adaptive 元件',
    test: () => {
      const componentPath = path.join(__dirname, 'src/components/adaptive/core');
      if (!fs.existsSync(componentPath)) {
        return { success: false, message: 'Adaptive 元件目錄不存在' };
      }
      
      const components = fs.readdirSync(componentPath)
        .filter(file => file.endsWith('.tsx'))
        .map(file => file.replace('.tsx', ''));
      
      const expectedComponents = ['AdaptiveView', 'AdaptiveText', 'AdaptiveButton', 'AdaptiveInput'];
      const foundComponents = expectedComponents.filter(comp => components.includes(comp));
      
      return {
        success: foundComponents.length >= 3,
        message: `找到 ${foundComponents.length}/${expectedComponents.length} 個核心 Adaptive 元件`,
        details: { expected: expectedComponents, found: foundComponents }
      };
    }
  },
  
  {
    name: '檢查工具完整性',
    test: () => {
      const toolsPath = path.join(__dirname, 'tools');
      if (!fs.existsSync(toolsPath)) {
        return { success: false, message: 'tools 目錄不存在' };
      }
      
      const expectedTools = [
        'code-analysis',
        'design-system-checker', 
        'migration-assistant',
        'validation',
        'eslint-plugin-adaptive'
      ];
      
      const foundTools = expectedTools.filter(tool => 
        fs.existsSync(path.join(toolsPath, tool))
      );
      
      return {
        success: foundTools.length === expectedTools.length,
        message: `找到 ${foundTools.length}/${expectedTools.length} 個開發工具`,
        details: { expected: expectedTools, found: foundTools }
      };
    }
  },
  
  {
    name: '檢查測試框架',
    test: () => {
      const testPath = path.join(__dirname, 'tests/visual');
      if (!fs.existsSync(testPath)) {
        return { success: false, message: '視覺測試目錄不存在' };
      }
      
      const hasUtils = fs.existsSync(path.join(testPath, 'utils'));
      const hasStories = fs.existsSync(path.join(testPath, 'stories'));
      const hasTests = fs.existsSync(path.join(testPath, '__tests__'));
      
      const components = [hasUtils, hasStories, hasTests].filter(Boolean).length;
      
      return {
        success: components >= 2,
        message: `視覺測試框架 ${components}/3 個元件可用`,
        details: { utils: hasUtils, stories: hasStories, tests: hasTests }
      };
    }
  },
  
  {
    name: '檢查文檔完整性',
    test: () => {
      const docsPath = path.join(__dirname, 'docs/adaptive-architecture');
      if (!fs.existsSync(docsPath)) {
        return { success: false, message: '文檔目錄不存在' };
      }
      
      const expectedDocs = [
        'README.md',
        'MIGRATION_GUIDE.md',
        'DEVELOPER_GUIDE.md',
        'BEST_PRACTICES.md'
      ];
      
      const foundDocs = expectedDocs.filter(doc => 
        fs.existsSync(path.join(docsPath, doc))
      );
      
      return {
        success: foundDocs.length === expectedDocs.length,
        message: `找到 ${foundDocs.length}/${expectedDocs.length} 個主要文檔`,
        details: { expected: expectedDocs, found: foundDocs }
      };
    }
  },
  
  {
    name: '檢查 CI/CD 整合',
    test: () => {
      const githubWorkflow = path.join(__dirname, '.github/workflows/adaptive-validation.yml');
      const qualityGates = path.join(__dirname, 'tools/validation/quality-gates.json');
      
      const hasWorkflow = fs.existsSync(githubWorkflow);
      const hasQualityGates = fs.existsSync(qualityGates);
      
      return {
        success: hasWorkflow && hasQualityGates,
        message: `CI/CD 整合: ${hasWorkflow ? '✓' : '✗'} GitHub Actions, ${hasQualityGates ? '✓' : '✗'} 品質門檻`,
        details: { workflow: hasWorkflow, qualityGates: hasQualityGates }
      };
    }
  }
];

// 執行驗證
console.log('🔍 Adaptive Architecture 基本驗證');
console.log('=' .repeat(50));

let passedChecks = 0;
const results = [];

checks.forEach((check, index) => {
  try {
    const result = check.test();
    const status = result.success ? '✅' : '❌';
    
    console.log(`${index + 1}. ${status} ${check.name}`);
    console.log(`   ${result.message}`);
    
    if (result.details) {
      console.log(`   詳情: ${JSON.stringify(result.details, null, 2).replace(/\n/g, '\\n   ')}`);
    }
    
    console.log('');
    
    if (result.success) passedChecks++;
    results.push({ name: check.name, ...result });
    
  } catch (error) {
    console.log(`${index + 1}. ❌ ${check.name}`);
    console.log(`   錯誤: ${error.message}`);
    console.log('');
    
    results.push({ name: check.name, success: false, message: error.message });
  }
});

// 總結
console.log('=' .repeat(50));
console.log(`📊 驗證結果: ${passedChecks}/${checks.length} 項檢查通過`);

const successRate = (passedChecks / checks.length) * 100;
let status = '';
let emoji = '';

if (successRate >= 90) {
  status = '優秀';
  emoji = '🎉';
} else if (successRate >= 75) {
  status = '良好';
  emoji = '✅';
} else if (successRate >= 60) {
  status = '需要改進';
  emoji = '⚠️';
} else {
  status = '需要修復';
  emoji = '❌';
}

console.log(`${emoji} 系統狀態: ${status} (${successRate.toFixed(1)}%)`);

// 建議
if (passedChecks < checks.length) {
  console.log('');
  console.log('🔧 改進建議:');
  
  results.filter(r => !r.success).forEach(result => {
    console.log(`• ${result.name}: ${result.message}`);
  });
}

// 保存結果
const reportPath = path.join(__dirname, 'validation-report.json');
const report = {
  timestamp: new Date().toISOString(),
  overallScore: successRate,
  status: status,
  passedChecks,
  totalChecks: checks.length,
  results: results
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 詳細報告已保存: ${reportPath}`);

// 退出碼
process.exit(passedChecks === checks.length ? 0 : 1);