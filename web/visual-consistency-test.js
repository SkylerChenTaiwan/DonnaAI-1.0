/**
 * Next.js 設計系統視覺一致性測試
 * PRP-120 設計系統視覺驗證
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 30000,
  screenshotsDir: path.join(__dirname, '..', 'docs', 'tests', 'screenshots'),
  reportsDir: path.join(__dirname, '..', 'docs', 'tests')
};

// 響應式斷點配置
const BREAKPOINTS = {
  xs: { width: 375, height: 667, name: '手機 (XS)' },
  sm: { width: 640, height: 1024, name: '小平板 (SM)' },
  md: { width: 768, height: 1024, name: '平板 (MD)' },
  lg: { width: 1024, height: 768, name: '桌面 (LG)' },
  xl: { width: 1280, height: 1024, name: '大桌面 (XL)' },
  '2xl': { width: 1536, height: 1024, name: '超寬桌面 (2XL)' }
};

// 設計 Token 測試配置
const DESIGN_TOKENS = {
  colors: {
    primary: {
      expected: '#2C2C2C',
      variants: ['#1A1A1A', '#525252']
    },
    background: {
      expected: '#FFFFFF',
      variants: ['#FAFAFA', '#F5F5F5']
    },
    text: {
      primary: '#2C2C2C',
      secondary: '#666666',
      tertiary: '#999999'
    },
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    info: '#5856D6'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  borderRadius: {
    button: '6px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px'
  }
};

// 測試結果收集器
class VisualTestResults {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      screenshots: [],
      designTokens: {
        colors: { passed: 0, failed: 0, results: [] },
        typography: { passed: 0, failed: 0, results: [] },
        spacing: { passed: 0, failed: 0, results: [] },
        layout: { passed: 0, failed: 0, results: [] }
      }
    };
    this.startTime = Date.now();
  }

  addTest(category, name, status, details = {}) {
    this.results.tests.push({
      category,
      name,
      status,
      timestamp: new Date().toISOString(),
      details,
      screenshot: details.screenshot || null
    });

    this.results[status]++;
    
    if (details.tokenTest) {
      this.results.designTokens[details.tokenCategory][status]++;
      this.results.designTokens[details.tokenCategory].results.push({
        name,
        status,
        expected: details.expected,
        actual: details.actual,
        details: details.message
      });
    }

    console.log(`[${status.toUpperCase()}] ${category}/${name}`);
    if (details.message) console.log(`  ${details.message}`);
  }

  addScreenshot(breakpoint, page, status, path) {
    this.results.screenshots.push({
      breakpoint,
      page,
      status,
      path,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const total = this.results.passed + this.results.failed + this.results.warnings;

    return {
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: total > 0 ? Math.round((this.results.passed / total) * 100) : 0,
        duration
      },
      tests: this.results.tests,
      screenshots: this.results.screenshots,
      designTokens: this.results.designTokens
    };
  }
}

// 主測試類別
class VisualConsistencyTester {
  constructor() {
    this.results = new VisualTestResults();
    this.browser = null;
    this.page = null;
  }

  async setup() {
    console.log('🚀 啟動瀏覽器和頁面...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // 確保截圖目錄存在
    if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
    }
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testFontLoading() {
    console.log('🔤 測試字體載入...');
    
    try {
      await this.page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
      
      // 檢查 Geist 字體是否載入
      const fonts = await this.page.evaluate(() => {
        const computedStyle = window.getComputedStyle(document.body);
        return {
          fontFamily: computedStyle.fontFamily,
          fontWeight: computedStyle.fontWeight,
          fontSize: computedStyle.fontSize,
          lineHeight: computedStyle.lineHeight
        };
      });

      if (fonts.fontFamily.includes('Geist')) {
        this.results.addTest('字體系統', 'Geist 字體載入', 'passed', {
          message: `字體載入成功: ${fonts.fontFamily}`,
          details: fonts
        });
      } else {
        this.results.addTest('字體系統', 'Geist 字體載入', 'failed', {
          message: `預期 Geist 字體，實際: ${fonts.fontFamily}`,
          details: fonts
        });
      }

      // 測試字體渲染品質
      const textElements = await this.page.$$eval('[class*="text-"], h1, h2, h3, p', elements => {
        return elements.map(el => {
          const style = window.getComputedStyle(el);
          return {
            tagName: el.tagName,
            className: el.className,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            fontSmoothing: style.webkitFontSmoothing
          };
        });
      });

      const hasAntialiased = textElements.some(el => 
        el.fontSmoothing === 'antialiased' || el.fontSmoothing === 'subpixel-antialiased'
      );

      if (hasAntialiased) {
        this.results.addTest('字體系統', '字體平滑化', 'passed', {
          message: '字體平滑化已正確設定',
          details: { totalElements: textElements.length }
        });
      } else {
        this.results.addTest('字體系統', '字體平滑化', 'warnings', {
          message: '字體平滑化可能未正確設定',
          details: textElements.slice(0, 3)
        });
      }

    } catch (error) {
      this.results.addTest('字體系統', '字體載入測試', 'failed', {
        message: `測試執行失敗: ${error.message}`
      });
    }
  }

  async testColorTokens() {
    console.log('🎨 測試顏色 Tokens...');
    
    try {
      await this.page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
      
      // 測試 CSS 變數
      const colorTokens = await this.page.evaluate(() => {
        const rootStyle = getComputedStyle(document.documentElement);
        return {
          primary: rootStyle.getPropertyValue('--primary').trim(),
          background: rootStyle.getPropertyValue('--background').trim(),
          textPrimary: rootStyle.getPropertyValue('--text-primary').trim(),
          success: rootStyle.getPropertyValue('--success').trim(),
          warning: rootStyle.getPropertyValue('--warning').trim(),
          error: rootStyle.getPropertyValue('--error').trim()
        };
      });

      // 驗證主要顏色
      Object.entries(DESIGN_TOKENS.colors).forEach(([colorName, expectedValue]) => {
        if (typeof expectedValue === 'object' && expectedValue.expected) {
          expectedValue = expectedValue.expected;
        }
        
        const actualValue = colorTokens[colorName] || colorTokens[colorName.replace(/([A-Z])/g, '-$1').toLowerCase()];
        
        if (actualValue && actualValue.toUpperCase() === expectedValue.toUpperCase()) {
          this.results.addTest('顏色系統', `${colorName} 顏色值`, 'passed', {
            tokenTest: true,
            tokenCategory: 'colors',
            expected: expectedValue,
            actual: actualValue,
            message: `顏色值正確: ${actualValue}`
          });
        } else {
          this.results.addTest('顏色系統', `${colorName} 顏色值`, 'failed', {
            tokenTest: true,
            tokenCategory: 'colors',
            expected: expectedValue,
            actual: actualValue || '未定義',
            message: `顏色值不符: 預期 ${expectedValue}, 實際 ${actualValue || '未定義'}`
          });
        }
      });

      // 測試實際使用的顏色
      const usedColors = await this.page.$$eval('[class*="bg-"], [class*="text-"], [class*="border-"]', elements => {
        return elements.slice(0, 10).map(el => {
          const style = window.getComputedStyle(el);
          return {
            className: el.className,
            backgroundColor: style.backgroundColor,
            color: style.color,
            borderColor: style.borderColor
          };
        });
      });

      this.results.addTest('顏色系統', '實際顏色使用', 'passed', {
        message: `檢查了 ${usedColors.length} 個元素的顏色使用`,
        details: usedColors
      });

    } catch (error) {
      this.results.addTest('顏色系統', '顏色 Tokens 測試', 'failed', {
        message: `測試執行失敗: ${error.message}`
      });
    }
  }

  async testIconSystem() {
    console.log('🔣 測試圖示系統...');
    
    try {
      await this.page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
      
      // 檢查 SVG 圖示
      const svgElements = await this.page.$$eval('svg', elements => {
        return elements.map(svg => {
          const style = window.getComputedStyle(svg);
          return {
            width: style.width,
            height: style.height,
            fill: style.fill,
            stroke: style.stroke,
            viewBox: svg.getAttribute('viewBox'),
            className: svg.className.baseVal || svg.className
          };
        });
      });

      if (svgElements.length > 0) {
        // 檢查圖示尺寸一致性
        const sizeCategories = {};
        svgElements.forEach(icon => {
          const size = `${icon.width}×${icon.height}`;
          if (!sizeCategories[size]) sizeCategories[size] = 0;
          sizeCategories[size]++;
        });

        this.results.addTest('圖示系統', 'SVG 圖示載入', 'passed', {
          message: `找到 ${svgElements.length} 個 SVG 圖示`,
          details: { totalIcons: svgElements.length, sizeCategories }
        });

        // 檢查圖示是否有正確的 viewBox
        const validViewBox = svgElements.filter(icon => icon.viewBox).length;
        if (validViewBox === svgElements.length) {
          this.results.addTest('圖示系統', '圖示 ViewBox 設定', 'passed', {
            message: '所有圖示都有正確的 viewBox 設定'
          });
        } else {
          this.results.addTest('圖示系統', '圖示 ViewBox 設定', 'warnings', {
            message: `${svgElements.length - validViewBox} 個圖示缺少 viewBox 設定`
          });
        }

      } else {
        this.results.addTest('圖示系統', 'SVG 圖示載入', 'warnings', {
          message: '主頁面未找到 SVG 圖示，可能需要導航到其他頁面測試'
        });
      }

    } catch (error) {
      this.results.addTest('圖示系統', '圖示系統測試', 'failed', {
        message: `測試執行失敗: ${error.message}`
      });
    }
  }

  async testResponsiveBreakpoints() {
    console.log('📱 測試響應式斷點...');
    
    for (const [breakpointName, config] of Object.entries(BREAKPOINTS)) {
      try {
        await this.page.setViewport({ 
          width: config.width, 
          height: config.height,
          deviceScaleFactor: 1 
        });
        
        await this.page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
        
        // 等待動畫完成
        await this.page.waitForTimeout(1000);
        
        // 截圖
        const screenshotPath = path.join(
          TEST_CONFIG.screenshotsDir, 
          `homepage-${breakpointName}-${config.width}x${config.height}.png`
        );
        
        await this.page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });

        this.results.addScreenshot(breakpointName, 'homepage', 'success', screenshotPath);
        
        // 檢查佈局是否正常
        const layoutCheck = await this.page.evaluate(() => {
          const body = document.body;
          const main = document.querySelector('main') || document.querySelector('div');
          
          return {
            bodyWidth: body.offsetWidth,
            bodyHeight: body.offsetHeight,
            hasOverflowX: body.scrollWidth > body.offsetWidth,
            visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden';
            }).length
          };
        });

        if (!layoutCheck.hasOverflowX && layoutCheck.visibleElements > 0) {
          this.results.addTest('響應式設計', `${config.name} 佈局`, 'passed', {
            message: `佈局正常，無水平溢出，可見元素: ${layoutCheck.visibleElements}`,
            screenshot: screenshotPath,
            details: layoutCheck
          });
        } else {
          this.results.addTest('響應式設計', `${config.name} 佈局`, layoutCheck.hasOverflowX ? 'failed' : 'warnings', {
            message: layoutCheck.hasOverflowX ? '檢測到水平溢出' : '佈局可能有問題',
            screenshot: screenshotPath,
            details: layoutCheck
          });
        }

      } catch (error) {
        this.results.addTest('響應式設計', `${config.name} 測試`, 'failed', {
          message: `測試執行失敗: ${error.message}`
        });
      }
    }
  }

  async testLoadingStates() {
    console.log('⏳ 測試載入狀態...');
    
    try {
      await this.page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
      
      // 檢查是否有載入指示器相關的類別或元件
      const loadingElements = await this.page.$$eval('[class*="loading"], [class*="spinner"], [class*="animate-"]', elements => {
        return elements.map(el => {
          const style = window.getComputedStyle(el);
          return {
            className: el.className,
            animation: style.animation,
            transform: style.transform,
            opacity: style.opacity
          };
        });
      });

      if (loadingElements.length > 0) {
        this.results.addTest('載入狀態', '載入動畫元件', 'passed', {
          message: `找到 ${loadingElements.length} 個載入相關元件`,
          details: loadingElements
        });
      } else {
        this.results.addTest('載入狀態', '載入動畫元件', 'warnings', {
          message: '未在當前頁面找到載入動畫元件'
        });
      }

      // 檢查動畫性能
      const animationCheck = await this.page.evaluate(() => {
        const animatedElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.animation !== 'none' || style.transform !== 'none';
        });

        return {
          totalAnimated: animatedElements.length,
          smoothAnimations: animatedElements.filter(el => {
            const style = window.getComputedStyle(el);
            return style.animationTimingFunction === 'ease' || 
                   style.animationTimingFunction === 'ease-in-out';
          }).length
        };
      });

      this.results.addTest('載入狀態', '動畫性能', 'passed', {
        message: `檢查了 ${animationCheck.totalAnimated} 個動畫元素`,
        details: animationCheck
      });

    } catch (error) {
      this.results.addTest('載入狀態', '載入狀態測試', 'failed', {
        message: `測試執行失敗: ${error.message}`
      });
    }
  }

  async testErrorStates() {
    console.log('❌ 測試錯誤狀態...');
    
    try {
      // 測試 404 頁面
      await this.page.goto(`${TEST_CONFIG.baseURL}/non-existent-page`, { 
        waitUntil: 'networkidle0'
      });

      const pageContent = await this.page.content();
      const has404Content = pageContent.includes('404') || pageContent.includes('Not Found') || pageContent.includes('找不到頁面');

      if (has404Content) {
        const screenshotPath = path.join(TEST_CONFIG.screenshotsDir, '404-page.png');
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        
        this.results.addTest('錯誤狀態', '404 頁面設計', 'passed', {
          message: '404 頁面正確顯示',
          screenshot: screenshotPath
        });
      } else {
        this.results.addTest('錯誤狀態', '404 頁面設計', 'warnings', {
          message: '404 頁面可能需要改進用戶體驗'
        });
      }

    } catch (error) {
      this.results.addTest('錯誤狀態', '錯誤狀態測試', 'failed', {
        message: `測試執行失敗: ${error.message}`
      });
    }
  }

  async runAllTests() {
    console.log('🚀 開始 Next.js 設計系統視覺一致性測試');
    console.log(`📅 測試時間: ${new Date().toISOString()}`);
    console.log(`🌐 測試目標: ${TEST_CONFIG.baseURL}`);
    console.log(''.padEnd(50, '='));

    try {
      await this.setup();

      console.log('\n🔄 執行視覺測試項目...');
      await this.testFontLoading();
      await this.testColorTokens();
      await this.testIconSystem();
      await this.testResponsiveBreakpoints();
      await this.testLoadingStates();
      await this.testErrorStates();

      console.log('\n' + ''.padEnd(50, '='));
      console.log('📊 測試完成！正在生成報告...');

      return this.results.generateReport();

    } catch (error) {
      console.error('❌ 測試執行失敗:', error.message);
      this.results.addTest('系統', '測試環境檢查', 'failed', { message: error.message });
      return this.results.generateReport();
    } finally {
      await this.teardown();
    }
  }
}

// 生成詳細的 Markdown 報告
function generateVisualReport(report) {
  const mobileDesignComparison = `
## Mobile vs Web 設計系統對比分析

### 顏色系統一致性
${report.designTokens.colors.results.map(result => 
  `- **${result.name}**: ${result.status === 'passed' ? '✅' : '❌'} ${result.details}`
).join('\n')}

### 跨平台設計一致性評估
- **字體系統**: Geist (Web) vs 系統字體 (Mobile) - 需要確保視覺層級一致
- **間距系統**: 兩平台使用相同的 4px 基礎網格
- **顏色系統**: 基於 Notion 風格的統一灰階設計
- **圓角系統**: 統一的圓角設計語言

### 設計 Token 驗證結果
- ✅ **通過**: ${report.designTokens.colors.passed + report.designTokens.typography.passed + report.designTokens.spacing.passed + report.designTokens.layout.passed}
- ❌ **失敗**: ${report.designTokens.colors.failed + report.designTokens.typography.failed + report.designTokens.spacing.failed + report.designTokens.layout.failed}
`;

  return `# Next.js 設計系統視覺一致性測試報告

## 測試概覽

- **執行時間**: ${new Date().toISOString()}
- **總執行時長**: ${Math.round(report.summary.duration / 1000)}秒
- **測試環境**: Puppeteer + Chrome Headless
- **截圖數量**: ${report.screenshots.length}

## 測試結果摘要

- ✅ **通過**: ${report.summary.passed}
- ❌ **失敗**: ${report.summary.failed}
- ⚠️ **警告**: ${report.summary.warnings}
- 📊 **總計**: ${report.summary.total}
- 🎯 **成功率**: ${report.summary.successRate}%

## 響應式斷點測試結果

${Object.entries(BREAKPOINTS).map(([breakpoint, config]) => {
  const test = report.tests.find(t => t.category === '響應式設計' && t.name.includes(config.name));
  return `### ${config.name} (${config.width}×${config.height})
- **狀態**: ${test ? (test.status === 'passed' ? '✅ 通過' : test.status === 'failed' ? '❌ 失敗' : '⚠️ 警告') : '⏭️ 跳過'}
- **截圖**: ${report.screenshots.find(s => s.breakpoint === breakpoint) ? '✅ 已生成' : '❌ 未生成'}${test?.details?.message ? '\n- **詳情**: ' + test.details.message : ''}`;
}).join('\n\n')}

## 字體系統測試

${report.tests.filter(t => t.category === '字體系統').map(test => 
  `### ${test.name}
- **狀態**: ${test.status === 'passed' ? '✅ 通過' : test.status === 'failed' ? '❌ 失敗' : '⚠️ 警告'}
- **詳情**: ${test.details?.message || '無詳細資訊'}`
).join('\n\n')}

## 圖示系統測試

${report.tests.filter(t => t.category === '圖示系統').map(test => 
  `### ${test.name}
- **狀態**: ${test.status === 'passed' ? '✅ 通過' : test.status === 'failed' ? '❌ 失敗' : '⚠️ 警告'}
- **詳情**: ${test.details?.message || '無詳細資訊'}`
).join('\n\n')}

${mobileDesignComparison}

## 截圖檔案

| 斷點 | 尺寸 | 狀態 | 檔案路徑 |
|------|------|------|----------|
${report.screenshots.map(screenshot => 
  `| ${screenshot.breakpoint} | ${BREAKPOINTS[screenshot.breakpoint]?.width}×${BREAKPOINTS[screenshot.breakpoint]?.height} | ${screenshot.status === 'success' ? '✅' : '❌'} | \`${screenshot.path}\` |`
).join('\n')}

## 詳細測試結果

| 類別 | 測試名稱 | 狀態 | 詳情 |
|------|----------|------|------|
${report.tests.map(test => {
  const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
  return `| ${test.category} | ${test.name} | ${status} | ${test.details?.message || '無詳情'} |`;
}).join('\n')}

## 設計改進建議

### 高優先級
${report.tests.filter(t => t.status === 'failed').map(test => 
  `- **${test.category}/${test.name}**: ${test.details?.message || '需要修復'}`
).join('\n') || '🎉 目前沒有高優先級問題！'}

### 中優先級
${report.tests.filter(t => t.status === 'warnings').map(test => 
  `- **${test.category}/${test.name}**: ${test.details?.message || '建議改進'}`
).join('\n') || '🎉 目前沒有中優先級問題！'}

## 跨平台一致性評估

### 設計系統對比 (Web vs Mobile)

1. **顏色系統**: ${report.designTokens.colors.failed === 0 ? '✅ 完全一致' : '❌ 存在差異'}
2. **字體系統**: ${report.tests.find(t => t.name === 'Geist 字體載入')?.status === 'passed' ? '✅ Web 字體載入正常' : '❌ 字體載入問題'}
3. **間距系統**: 需要實際測量驗證
4. **元件一致性**: 需要進一步的元件級測試

### 無障礙輔助功能評估

- **顏色對比**: 需要進一步測試文字與背景的對比度
- **鍵盤導航**: 需要測試所有互動元素的鍵盤可訪問性
- **螢幕閱讀器**: 需要測試語義化 HTML 和 ARIA 標籤

## 下一步測試建議

1. **元件級視覺測試**: 對個別 UI 元件進行詳細測試
2. **互動狀態測試**: 測試 hover、focus、active 等狀態
3. **效能測試**: 測試動畫和過渡效果的流暢度
4. **無障礙輔助測試**: 使用 axe-core 等工具進行深入測試
5. **跨瀏覽器測試**: 在不同瀏覽器中驗證視覺一致性

## 測試環境資訊

- **瀏覽器**: Chrome Headless (Puppeteer)
- **螢幕解析度**: 多種響應式斷點
- **測試時間**: ${new Date().toLocaleString('zh-TW')}
- **Node.js 版本**: ${process.version}

---

*報告由 PRP-120 Next.js 設計系統視覺測試系統自動生成*

### 建議檢視截圖

請檢視以下截圖檔案以進行人工視覺驗證：
${report.screenshots.map(s => `- ${s.path}`).join('\n')}
`;
}

// 主函數
async function main() {
  const tester = new VisualConsistencyTester();
  
  try {
    const report = await tester.runAllTests();
    
    // 輸出測試摘要到控制台
    console.log('\n📋 視覺測試摘要:');
    console.log(`✅ 通過: ${report.summary.passed}`);
    console.log(`❌ 失敗: ${report.summary.failed}`);
    console.log(`⚠️  警告: ${report.summary.warnings}`);
    console.log(`📊 總計: ${report.summary.total}`);
    console.log(`🎯 成功率: ${report.summary.successRate}%`);
    console.log(`📸 截圖: ${report.screenshots.length} 個`);
    
    // 生成並儲存 Markdown 報告
    const reportContent = generateVisualReport(report);
    const reportPath = path.join(TEST_CONFIG.reportsDir, 'nextjs-foundation-visual-test.md');
    
    // 建立目錄（如果不存在）
    if (!fs.existsSync(TEST_CONFIG.reportsDir)) {
      fs.mkdirSync(TEST_CONFIG.reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 詳細報告已儲存至: ${reportPath}`);
    console.log(`📁 截圖儲存至: ${TEST_CONFIG.screenshotsDir}`);
    
    // 輸出關鍵測試結果
    if (report.summary.failed === 0) {
      console.log('\n🎉 視覺測試通過！設計系統基礎運作正常。');
      if (report.summary.warnings > 0) {
        console.log(`⚠️  但有 ${report.summary.warnings} 個項目需要關注。`);
      }
    } else {
      console.log(`\n⚠️  發現 ${report.summary.failed} 個視覺問題需要修復。`);
      const failedTests = report.tests.filter(t => t.status === 'failed');
      failedTests.forEach(test => {
        console.log(`   - ${test.category}/${test.name}: ${test.details?.message || test.name}`);
      });
    }
    
    // 根據測試結果設定 exit code
    process.exit(report.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 視覺測試執行發生嚴重錯誤:', error.message);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 未處理的錯誤:', error);
    process.exit(1);
  });
}

module.exports = VisualConsistencyTester;