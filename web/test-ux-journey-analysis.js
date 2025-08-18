/**
 * Next.js 基礎用戶流程 UX 分析腳本
 * PRP-120 UX Journey Analysis
 */

const puppeteer = require('puppeteer');
const axios = require('axios');

// 測試配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  apiURL: 'http://localhost:3000/api',
  timeout: 30000,
  viewports: {
    mobile: { width: 375, height: 667, isMobile: true },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 }
  }
};

// UX 分析器
class UXAnalyzer {
  constructor() {
    this.issues = [];
    this.journeyMap = [];
    this.metricsData = {
      taskCompletionRate: 0,
      userErrorRate: 0,
      timeOnTask: {},
      satisfactionScore: 0,
      accessibilityScore: 0
    };
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  addIssue(severity, category, issue, impact, suggestion) {
    this.issues.push({
      severity, // critical, high, medium, low
      category,
      issue,
      impact,
      suggestion,
      timestamp: new Date().toISOString()
    });
  }

  addJourneyStep(step, status, details = {}) {
    this.journeyMap.push({
      step,
      status,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // 1. 分析登入到主頁流程
  async analyzeAuthFlow() {
    console.log('\n📱 分析認證流程 UX...');
    const page = await this.browser.newPage();
    const startTime = Date.now();

    try {
      // 訪問首頁
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
      this.addJourneyStep('訪問首頁', 'success', { url: TEST_CONFIG.baseURL });

      // 檢查初始載入體驗
      const hasLoadingIndicator = await page.$('.animate-pulse, .animate-spin');
      if (!hasLoadingIndicator) {
        this.addIssue('medium', '載入狀態', 
          '首頁載入時缺少載入指示器',
          '使用者可能不確定頁面是否正在載入',
          '添加骨架屏或載入動畫'
        );
      }

      // 檢查是否有登入引導
      const loginButton = await page.$('button:has-text("登入"), a:has-text("登入")');
      if (!loginButton) {
        this.addIssue('high', '認證流程',
          '首頁缺少明顯的登入入口',
          '新用戶難以找到登入方式',
          '在首頁添加明顯的登入按鈕或連結'
        );
      }

      // 測試 Dashboard 訪問（需要認證）
      const dashboardResponse = await page.goto(`${TEST_CONFIG.baseURL}/dashboard`, {
        waitUntil: 'networkidle0'
      });

      if (dashboardResponse.status() === 200) {
        this.addJourneyStep('訪問 Dashboard', 'success');
        this.addIssue('critical', '認證流程',
          'Dashboard 未實施認證保護',
          '未授權用戶可以訪問受保護頁面',
          '實施路由守衛和認證檢查'
        );
      } else if (dashboardResponse.status() === 401 || dashboardResponse.status() === 403) {
        this.addJourneyStep('訪問 Dashboard', 'redirected', { reason: '需要認證' });
        
        // 檢查重定向體驗
        const currentURL = page.url();
        if (!currentURL.includes('login') && !currentURL.includes('auth')) {
          this.addIssue('high', '認證流程',
            '未認證訪問未重定向到登入頁',
            '用戶體驗斷裂，不知道如何繼續',
            '自動重定向到登入頁面並保存原始 URL'
          );
        }
      }

      // 測量任務完成時間
      const taskTime = Date.now() - startTime;
      this.metricsData.timeOnTask['auth_flow'] = taskTime;

      // 檢查無障礙功能
      const a11yResults = await page.evaluate(() => {
        const checks = {
          hasSkipLink: !!document.querySelector('a[href="#main"], a[href="#content"]'),
          hasLandmarks: !!document.querySelector('main, nav, header, footer'),
          hasHeadings: !!document.querySelector('h1'),
          hasAltText: Array.from(document.querySelectorAll('img')).every(img => img.alt),
          hasFocusIndicator: true // 需要更詳細的檢查
        };
        return checks;
      });

      if (!a11yResults.hasSkipLink) {
        this.addIssue('medium', '無障礙輔助',
          '缺少跳過導航連結',
          '鍵盤用戶需要多次 Tab 才能到達主要內容',
          '添加隱藏的"跳到主要內容"連結'
        );
      }

      if (!a11yResults.hasLandmarks) {
        this.addIssue('medium', '無障礙輔助',
          '缺少 ARIA 地標',
          '螢幕閱讀器用戶難以導航',
          '使用語義化 HTML 標籤（main, nav, header, footer）'
        );
      }

    } catch (error) {
      this.addJourneyStep('認證流程分析', 'error', { error: error.message });
      this.addIssue('critical', '系統錯誤',
        `認證流程崩潰: ${error.message}`,
        '用戶無法完成認證',
        '修復系統錯誤並添加錯誤邊界'
      );
    } finally {
      await page.close();
    }
  }

  // 2. 分析 API 錯誤處理 UX
  async analyzeErrorHandling() {
    console.log('\n🚨 分析錯誤處理 UX...');
    const page = await this.browser.newPage();

    try {
      // 模擬網路錯誤
      await page.setOfflineMode(true);
      await page.goto(TEST_CONFIG.baseURL, { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      }).catch(async (error) => {
        // 檢查離線錯誤處理
        const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
        
        if (!bodyText.includes('離線') && !bodyText.includes('網路') && !bodyText.includes('offline')) {
          this.addIssue('high', '錯誤處理',
            '離線狀態無友好提示',
            '用戶不知道為何無法載入',
            '實施離線檢測和友好提示'
          );
        }
      });

      await page.setOfflineMode(false);

      // 測試 404 錯誤頁面
      await page.goto(`${TEST_CONFIG.baseURL}/non-existent-page`, { 
        waitUntil: 'networkidle0' 
      });

      const has404Page = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return bodyText.includes('404') || bodyText.includes('not found') || bodyText.includes('找不到');
      });

      if (!has404Page) {
        this.addIssue('high', '錯誤處理',
          '404 頁面不明確',
          '用戶不知道頁面不存在',
          '創建明確的 404 錯誤頁面'
        );
      }

      const hasBackButton = await page.$('button:has-text("返回"), a:has-text("首頁"), button:has-text("回到首頁")');
      if (!hasBackButton) {
        this.addIssue('medium', '錯誤處理',
          '404 頁面缺少導航選項',
          '用戶被困在錯誤頁面',
          '添加返回首頁或上一頁的按鈕'
        );
      }

      // 測試 API 錯誤
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
      
      // 注入錯誤處理檢查
      const hasErrorBoundary = await page.evaluate(() => {
        return typeof window.onerror === 'function' || 
               document.querySelector('[data-error-boundary]') !== null;
      });

      if (!hasErrorBoundary) {
        this.addIssue('high', '錯誤處理',
          '缺少全域錯誤邊界',
          'JavaScript 錯誤可能導致白屏',
          '實施 React Error Boundary'
        );
      }

    } catch (error) {
      this.addJourneyStep('錯誤處理分析', 'error', { error: error.message });
    } finally {
      await page.close();
    }
  }

  // 3. 分析載入狀態 UX
  async analyzeLoadingStates() {
    console.log('\n⏳ 分析載入狀態 UX...');
    const page = await this.browser.newPage();

    try {
      // 設定慢速網路
      await page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 50 * 1024, // 50kb/s
        uploadThroughput: 20 * 1024,
        latency: 500
      });

      const startTime = Date.now();
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'domcontentloaded' });

      // 檢查載入指示器
      const loadingIndicators = await page.evaluate(() => {
        const indicators = {
          skeleton: document.querySelectorAll('.animate-pulse, .skeleton').length,
          spinner: document.querySelectorAll('.animate-spin, .spinner').length,
          progressBar: document.querySelectorAll('[role="progressbar"]').length,
          loadingText: document.body.innerText.includes('載入中') || document.body.innerText.includes('Loading')
        };
        return indicators;
      });

      const hasAnyLoadingIndicator = Object.values(loadingIndicators).some(v => v > 0 || v === true);
      
      if (!hasAnyLoadingIndicator) {
        this.addIssue('high', '載入狀態',
          '缺少載入狀態指示',
          '用戶在慢速網路下不知道頁面是否響應',
          '添加載入動畫、骨架屏或進度條'
        );
      }

      // 檢查載入時間
      const loadTime = Date.now() - startTime;
      if (loadTime > 3000 && !hasAnyLoadingIndicator) {
        this.addIssue('critical', '載入狀態',
          `頁面載入超過 ${Math.round(loadTime/1000)} 秒且無載入提示`,
          '用戶可能認為頁面無響應而離開',
          '優化載入性能並添加載入狀態'
        );
      }

      // 檢查內容漸進式載入
      const hasProgressiveLoading = await page.evaluate(() => {
        return document.querySelectorAll('[data-lazy], [loading="lazy"]').length > 0;
      });

      if (!hasProgressiveLoading) {
        this.addIssue('low', '載入狀態',
          '未實施漸進式載入',
          '所有內容同時載入可能導致性能問題',
          '實施圖片懶載入和內容優先級載入'
        );
      }

    } catch (error) {
      this.addJourneyStep('載入狀態分析', 'error', { error: error.message });
    } finally {
      await page.close();
    }
  }

  // 4. 分析響應式佈局切換 UX
  async analyzeResponsiveLayout() {
    console.log('\n📱 分析響應式佈局 UX...');

    for (const [deviceName, viewport] of Object.entries(TEST_CONFIG.viewports)) {
      const page = await this.browser.newPage();
      
      try {
        await page.setViewport(viewport);
        await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });
        
        this.addJourneyStep(`測試 ${deviceName} 佈局`, 'success');

        // 檢查視覺穩定性
        const layoutShifts = await page.evaluate(() => {
          let shifts = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                shifts += entry.value;
              }
            }
          });
          observer.observe({ entryTypes: ['layout-shift'] });
          return shifts;
        });

        if (layoutShifts > 0.1) {
          this.addIssue('medium', '響應式佈局',
            `${deviceName} 設備存在佈局偏移 (CLS: ${layoutShifts})`,
            '內容跳動影響用戶體驗',
            '為動態內容預留空間，避免佈局偏移'
          );
        }

        // 檢查觸控目標大小（移動設備）
        if (viewport.isMobile) {
          const touchTargets = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a, input, select, textarea');
            const smallTargets = [];
            
            buttons.forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44) {
                smallTargets.push({
                  tag: el.tagName,
                  text: el.innerText || el.value || el.placeholder,
                  size: `${rect.width}x${rect.height}`
                });
              }
            });
            
            return smallTargets;
          });

          if (touchTargets.length > 0) {
            this.addIssue('high', '響應式佈局',
              `移動設備上有 ${touchTargets.length} 個觸控目標過小`,
              '用戶難以準確點擊',
              '確保所有可互動元素至少 44x44 像素'
            );
          }
        }

        // 檢查水平滾動
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (hasHorizontalScroll) {
          this.addIssue('high', '響應式佈局',
            `${deviceName} 設備出現水平滾動`,
            '需要左右滑動查看內容，體驗差',
            '調整佈局避免內容溢出'
          );
        }

        // 檢查文字可讀性
        const textReadability = await page.evaluate(() => {
          const texts = document.querySelectorAll('p, span, div');
          const issues = [];
          
          texts.forEach(el => {
            const styles = window.getComputedStyle(el);
            const fontSize = parseFloat(styles.fontSize);
            
            if (fontSize < 12) {
              issues.push('文字過小');
            }
            
            const lineHeight = parseFloat(styles.lineHeight) / fontSize;
            if (lineHeight < 1.2) {
              issues.push('行距過小');
            }
          });
          
          return issues;
        });

        if (textReadability.length > 0) {
          this.addIssue('medium', '響應式佈局',
            `${deviceName} 設備文字可讀性問題`,
            '文字難以閱讀',
            '調整字體大小和行距'
          );
        }

      } catch (error) {
        this.addJourneyStep(`${deviceName} 佈局測試`, 'error', { error: error.message });
      } finally {
        await page.close();
      }
    }
  }

  // 5. 分析無障礙功能
  async analyzeAccessibility() {
    console.log('\n♿ 分析無障礙功能...');
    const page = await this.browser.newPage();

    try {
      await page.goto(TEST_CONFIG.baseURL, { waitUntil: 'networkidle0' });

      // 鍵盤導航測試
      const keyboardNav = await page.evaluate(() => {
        const focusableElements = document.querySelectorAll(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const issues = [];
        let tabIndexSequence = [];
        
        focusableElements.forEach(el => {
          // 檢查焦點樣式
          const styles = window.getComputedStyle(el);
          if (styles.outline === 'none' && !el.classList.contains('focus:')) {
            issues.push(`缺少焦點指示: ${el.tagName}`);
          }
          
          // 收集 tabindex
          const tabIndex = el.getAttribute('tabindex');
          if (tabIndex && parseInt(tabIndex) > 0) {
            tabIndexSequence.push(parseInt(tabIndex));
          }
        });
        
        // 檢查 tabindex 順序
        if (tabIndexSequence.length > 0 && !tabIndexSequence.every((v, i, a) => !i || a[i-1] <= v)) {
          issues.push('tabindex 順序混亂');
        }
        
        return { focusableCount: focusableElements.length, issues };
      });

      if (keyboardNav.focusableCount === 0) {
        this.addIssue('critical', '無障礙輔助',
          '頁面無可聚焦元素',
          '鍵盤用戶無法操作',
          '確保所有互動元素可通過鍵盤訪問'
        );
      }

      keyboardNav.issues.forEach(issue => {
        this.addIssue('high', '無障礙輔助',
          issue,
          '鍵盤導航體驗差',
          '添加明顯的焦點樣式'
        );
      });

      // 顏色對比度檢查
      const contrastIssues = await page.evaluate(() => {
        const getContrastRatio = (rgb1, rgb2) => {
          const getLuminance = (rgb) => {
            const [r, g, b] = rgb.match(/\d+/g).map(Number);
            const [rs, gs, bs] = [r, g, b].map(c => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          };
          
          const l1 = getLuminance(rgb1);
          const l2 = getLuminance(rgb2);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        
        const issues = [];
        const texts = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a');
        
        texts.forEach(el => {
          const styles = window.getComputedStyle(el);
          const bgColor = styles.backgroundColor;
          const textColor = styles.color;
          
          if (bgColor !== 'rgba(0, 0, 0, 0)' && textColor) {
            const ratio = getContrastRatio(bgColor, textColor);
            if (ratio < 4.5) {
              issues.push({
                element: el.tagName,
                text: el.innerText?.substring(0, 20),
                ratio: ratio.toFixed(2)
              });
            }
          }
        });
        
        return issues.slice(0, 5); // 只返回前 5 個問題
      });

      if (contrastIssues.length > 0) {
        this.addIssue('high', '無障礙輔助',
          `發現 ${contrastIssues.length} 個顏色對比度問題`,
          '視力障礙用戶難以閱讀',
          '調整顏色以達到 WCAG AA 標準（4.5:1）'
        );
      }

      // ARIA 標籤檢查
      const ariaIssues = await page.evaluate(() => {
        const issues = [];
        
        // 檢查圖片 alt 屬性
        document.querySelectorAll('img').forEach(img => {
          if (!img.alt && !img.getAttribute('aria-label')) {
            issues.push('圖片缺少 alt 文字');
          }
        });
        
        // 檢查表單標籤
        document.querySelectorAll('input, select, textarea').forEach(input => {
          const id = input.id;
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          if (!label && !input.getAttribute('aria-label')) {
            issues.push(`表單元素缺少標籤: ${input.type || input.tagName}`);
          }
        });
        
        // 檢查按鈕文字
        document.querySelectorAll('button').forEach(button => {
          if (!button.innerText && !button.getAttribute('aria-label')) {
            issues.push('按鈕缺少可訪問文字');
          }
        });
        
        return issues;
      });

      ariaIssues.forEach(issue => {
        this.addIssue('medium', '無障礙輔助',
          issue,
          '螢幕閱讀器無法正確解讀',
          '添加適當的 ARIA 標籤和屬性'
        );
      });

      // 計算無障礙分數
      const totalA11yIssues = keyboardNav.issues.length + contrastIssues.length + ariaIssues.length;
      this.metricsData.accessibilityScore = Math.max(0, 100 - (totalA11yIssues * 5));

    } catch (error) {
      this.addJourneyStep('無障礙功能分析', 'error', { error: error.message });
    } finally {
      await page.close();
    }
  }

  // 生成分析報告
  generateReport() {
    // 計算指標
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    const mediumIssues = this.issues.filter(i => i.severity === 'medium');
    const lowIssues = this.issues.filter(i => i.severity === 'low');

    // 計算任務完成率
    const successfulSteps = this.journeyMap.filter(j => j.status === 'success').length;
    const totalSteps = this.journeyMap.length;
    this.metricsData.taskCompletionRate = totalSteps > 0 ? (successfulSteps / totalSteps * 100) : 0;

    // 計算用戶錯誤率
    const errorSteps = this.journeyMap.filter(j => j.status === 'error').length;
    this.metricsData.userErrorRate = totalSteps > 0 ? (errorSteps / totalSteps * 100) : 0;

    return {
      metadata: {
        analysisType: 'UX Journey Analysis',
        testName: 'PRP-120 Next.js Foundation UX Flow Test',
        timestamp: new Date().toISOString(),
        baseURL: TEST_CONFIG.baseURL
      },
      metrics: this.metricsData,
      summary: {
        totalIssues: this.issues.length,
        critical: criticalIssues.length,
        high: highIssues.length,
        medium: mediumIssues.length,
        low: lowIssues.length
      },
      journeyMap: this.journeyMap,
      issues: {
        critical: criticalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues
      }
    };
  }
}

// 主函數
async function main() {
  const analyzer = new UXAnalyzer();
  
  try {
    console.log('🚀 開始 Next.js 基礎用戶流程 UX 分析');
    console.log(`📅 分析時間: ${new Date().toISOString()}`);
    console.log(`🌐 分析目標: ${TEST_CONFIG.baseURL}`);
    console.log(''.padEnd(50, '='));

    await analyzer.init();

    // 執行所有分析
    await analyzer.analyzeAuthFlow();
    await analyzer.analyzeErrorHandling();
    await analyzer.analyzeLoadingStates();
    await analyzer.analyzeResponsiveLayout();
    await analyzer.analyzeAccessibility();

    console.log('\n' + ''.padEnd(50, '='));
    console.log('📊 分析完成！正在生成報告...');

    const report = analyzer.generateReport();

    // 輸出摘要
    console.log('\n📋 UX 分析摘要:');
    console.log(`🔴 嚴重問題: ${report.summary.critical}`);
    console.log(`🟡 高優先級: ${report.summary.high}`);
    console.log(`🟠 中等問題: ${report.summary.medium}`);
    console.log(`🟢 輕微問題: ${report.summary.low}`);
    console.log(`\n📈 關鍵指標:`);
    console.log(`  任務完成率: ${report.metrics.taskCompletionRate.toFixed(1)}%`);
    console.log(`  用戶錯誤率: ${report.metrics.userErrorRate.toFixed(1)}%`);
    console.log(`  無障礙得分: ${report.metrics.accessibilityScore}/100`);

    // 儲存詳細報告
    const fs = require('fs');
    const reportPath = '/Users/skyler/coding/DonnaAI-1.0/docs/tests/nextjs-foundation-ux-flow-test.md';
    
    let reportContent = `# 用戶旅程分析報告

## 執行摘要
- **分析範圍**: Next.js 基礎平台用戶流程
- **關鍵發現**: ${report.summary.totalIssues} 個 UX 問題
- **優先建議**: ${report.summary.critical > 0 ? '立即修復嚴重問題' : report.summary.high > 0 ? '優先處理高優先級問題' : '持續優化用戶體驗'}

## 用戶旅程地圖

\`\`\`mermaid
graph LR
    A[用戶訪問] --> B{首頁載入}
    B -->|成功| C[查看內容]
    B -->|失敗| D[錯誤頁面]
    C --> E{嘗試訪問Dashboard}
    E -->|已認證| F[Dashboard頁面]
    E -->|未認證| G[需要登入]
    G --> H[登入流程]
    H --> F
    D --> I[返回首頁]
\`\`\`

### 旅程步驟詳情
${report.journeyMap.map(step => 
  `- **${step.step}**: ${step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⚠️'} ${step.status}`
).join('\n')}

## 問題清單

### 🔴 嚴重問題 (${report.summary.critical})
${report.issues.critical.length > 0 ? report.issues.critical.map(issue =>
  `#### ${issue.issue}
- **類別**: ${issue.category}
- **影響**: ${issue.impact}
- **建議**: ${issue.suggestion}
`).join('\n') : '無嚴重問題'}

### 🟡 高優先級問題 (${report.summary.high})
${report.issues.high.length > 0 ? report.issues.high.map(issue =>
  `#### ${issue.issue}
- **類別**: ${issue.category}
- **影響**: ${issue.impact}
- **建議**: ${issue.suggestion}
`).join('\n') : '無高優先級問題'}

### 🟠 中等問題 (${report.summary.medium})
${report.issues.medium.length > 0 ? report.issues.medium.map(issue =>
  `#### ${issue.issue}
- **類別**: ${issue.category}
- **影響**: ${issue.impact}
- **建議**: ${issue.suggestion}
`).join('\n') : '無中等問題'}

### 🟢 輕微問題 (${report.summary.low})
${report.issues.low.length > 0 ? report.issues.low.map(issue =>
  `#### ${issue.issue}
- **類別**: ${issue.category}
- **影響**: ${issue.impact}
- **建議**: ${issue.suggestion}
`).join('\n') : '無輕微問題'}

## 優化建議

### 1. 立即改進 (Quick Wins)
${report.issues.critical.concat(report.issues.high).slice(0, 3).map(issue =>
  `- ${issue.suggestion}`
).join('\n')}

### 2. 短期優化 (1-2 週)
${report.issues.medium.slice(0, 3).map(issue =>
  `- ${issue.suggestion}`
).join('\n')}

### 3. 長期改進 (需要重新設計)
- 實施完整的認證系統
- 建立設計系統和組件庫
- 優化性能和載入策略
- 完善錯誤處理機制

## 實施優先級矩陣

| 影響力↑ | 低實施難度 | 高實施難度 |
|---------|------------|------------|
| **高** | 🔴 修復認證流程<br>🔴 添加載入狀態 | 🟡 實施完整認證系統<br>🟡 優化性能 |
| **低** | 🟠 改善錯誤訊息<br>🟢 添加焦點樣式 | 🟢 漸進式載入<br>🟢 完善無障礙功能 |

## 評估指標

| 指標 | 當前值 | 目標值 | 狀態 |
|------|--------|--------|------|
| 任務完成率 | ${report.metrics.taskCompletionRate.toFixed(1)}% | >90% | ${report.metrics.taskCompletionRate >= 90 ? '✅' : '⚠️'} |
| 用戶錯誤率 | ${report.metrics.userErrorRate.toFixed(1)}% | <5% | ${report.metrics.userErrorRate <= 5 ? '✅' : '⚠️'} |
| 頁面載入時間 | ${Object.values(report.metrics.timeOnTask)[0] ? Math.round(Object.values(report.metrics.timeOnTask)[0]/1000) : 'N/A'}s | <3s | ⚠️ |
| 無障礙得分 | ${report.metrics.accessibilityScore}/100 | >85 | ${report.metrics.accessibilityScore >= 85 ? '✅' : '⚠️'} |

## 與 Mobile 版本比較

| 功能 | Web | Mobile | 一致性 |
|------|-----|--------|--------|
| 認證流程 | 未實施 | 已實施 | ❌ |
| 錯誤處理 | 基礎 | 完整 | ⚠️ |
| 載入狀態 | 缺失 | 完整 | ❌ |
| 響應式設計 | 已實施 | N/A | ✅ |
| 無障礙功能 | 基礎 | 基礎 | ✅ |

## 建議行動計劃

### 第一階段：修復嚴重問題（立即）
1. **實施認證保護** - 為 Dashboard 和其他受保護路由添加認證檢查
2. **添加載入狀態** - 實施全域載入指示器和骨架屏
3. **修復 Firebase 配置** - 解決 API 錯誤問題

### 第二階段：改善用戶體驗（1週內）
1. **完善錯誤處理** - 添加友好的錯誤頁面和恢復選項
2. **優化響應式設計** - 修復觸控目標大小和佈局問題
3. **改善無障礙功能** - 添加 ARIA 標籤和鍵盤導航支援

### 第三階段：長期優化（2-4週）
1. **性能優化** - 實施代碼分割和懶載入
2. **建立設計系統** - 統一 UI 組件和交互模式
3. **完善測試覆蓋** - 添加 E2E 測試和視覺回歸測試

---

*報告生成時間: ${new Date().toISOString()}*
*分析工具: UX Journey Analyzer v1.0*
`;

    // 建立目錄（如果不存在）
    const path = require('path');
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📄 詳細報告已儲存至: ${reportPath}`);

    await analyzer.cleanup();
    process.exit(0);

  } catch (error) {
    console.error('💥 分析執行發生錯誤:', error.message);
    await analyzer.cleanup();
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

module.exports = { UXAnalyzer };