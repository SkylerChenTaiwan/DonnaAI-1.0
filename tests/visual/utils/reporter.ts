/**
 * 視覺測試報告生成器
 * 生成詳細的 HTML 測試報告和統計數據
 */

import fs from 'fs/promises';
import path from 'path';
import { ComparisonResult } from './compare';

// 測試結果介面
export interface TestResult {
  id: string;
  name: string;
  component: string;
  story: string;
  variant: string;
  platform: string;
  status: 'passed' | 'failed' | 'error';
  comparison?: ComparisonResult;
  error?: string;
  duration: number; // ms
  timestamp: Date;
  screenshots: {
    baseline?: string;
    actual?: string;
    diff?: string;
  };
}

// 報告配置
export interface ReportConfig {
  title: string;
  outputDir: string;
  includeImages: boolean;
  includeStats: boolean;
  theme: 'light' | 'dark';
  groupBy: 'component' | 'platform' | 'status';
  showPassed: boolean;
  showFailed: boolean;
  showErrors: boolean;
}

// 統計數據介面
export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  passRate: number;
  failRate: number;
  errorRate: number;
  totalDuration: number;
  averageDuration: number;
  components: number;
  platforms: number;
  variants: number;
  createdAt: Date;
}

// 報告生成器類別
export class VisualTestReporter {
  private config: ReportConfig;

  constructor(config: Partial<ReportConfig> = {}) {
    this.config = {
      title: '視覺回歸測試報告',
      outputDir: 'tests/visual/results/reports',
      includeImages: true,
      includeStats: true,
      theme: 'light',
      groupBy: 'component',
      showPassed: true,
      showFailed: true,
      showErrors: true,
      ...config,
    };
  }

  /**
   * 生成完整的 HTML 報告
   */
  async generateReport(results: TestResult[]): Promise<string> {
    const stats = this.calculateStats(results);
    const groupedResults = this.groupResults(results);
    
    const html = this.buildHTMLReport(stats, groupedResults, results);
    const reportPath = path.join(this.config.outputDir, 'visual-test-report.html');
    
    await this.ensureDir(this.config.outputDir);
    await fs.writeFile(reportPath, html, 'utf-8');
    
    // 生成 JSON 報告
    await this.generateJSONReport(results, stats);
    
    // 生成 CSS 文件
    await this.generateCSS();
    
    return reportPath;
  }

  /**
   * 生成 JSON 報告
   */
  async generateJSONReport(results: TestResult[], stats: TestStats): Promise<string> {
    const jsonReport = {
      metadata: {
        title: this.config.title,
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      stats,
      results,
    };

    const jsonPath = path.join(this.config.outputDir, 'visual-test-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(jsonReport, null, 2));
    
    return jsonPath;
  }

  /**
   * 計算測試統計
   */
  private calculateStats(results: TestResult[]): TestStats {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const averageDuration = total > 0 ? totalDuration / total : 0;
    
    const components = new Set(results.map(r => r.component)).size;
    const platforms = new Set(results.map(r => r.platform)).size;
    const variants = new Set(results.map(r => r.variant)).size;

    return {
      total,
      passed,
      failed,
      errors,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      failRate: total > 0 ? (failed / total) * 100 : 0,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      totalDuration,
      averageDuration,
      components,
      platforms,
      variants,
      createdAt: new Date(),
    };
  }

  /**
   * 分組測試結果
   */
  private groupResults(results: TestResult[]): Record<string, TestResult[]> {
    const groups: Record<string, TestResult[]> = {};

    for (const result of results) {
      let key: string;
      
      switch (this.config.groupBy) {
        case 'component':
          key = result.component;
          break;
        case 'platform':
          key = result.platform;
          break;
        case 'status':
          key = result.status;
          break;
        default:
          key = result.component;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
    }

    return groups;
  }

  /**
   * 建構 HTML 報告
   */
  private buildHTMLReport(
    stats: TestStats, 
    groupedResults: Record<string, TestResult[]>,
    allResults: TestResult[]
  ): string {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.title}</title>
    <link rel="stylesheet" href="./visual-report.css">
    <style>
        ${this.getInlineCSS()}
    </style>
</head>
<body class="theme-${this.config.theme}">
    <div class="report-container">
        ${this.buildHeader(stats)}
        ${this.config.includeStats ? this.buildStatsSection(stats) : ''}
        ${this.buildFilters()}
        ${this.buildResultsSection(groupedResults)}
        ${this.buildFooter()}
    </div>
    
    <script>
        ${this.getInlineJS()}
    </script>
</body>
</html>`;
  }

  /**
   * 建構報告標頭
   */
  private buildHeader(stats: TestStats): string {
    const statusClass = stats.failRate > 0 || stats.errorRate > 0 ? 'failed' : 'passed';
    
    return `
<header class="report-header">
    <div class="header-content">
        <h1 class="report-title">${this.config.title}</h1>
        <div class="report-meta">
            <span class="timestamp">生成時間: ${stats.createdAt.toLocaleString('zh-TW')}</span>
            <span class="status status-${statusClass}">
                ${stats.failed + stats.errors === 0 ? '✅ 全部通過' : '❌ 有失敗測試'}
            </span>
        </div>
    </div>
</header>`;
  }

  /**
   * 建構統計區塊
   */
  private buildStatsSection(stats: TestStats): string {
    return `
<section class="stats-section">
    <h2>測試統計</h2>
    <div class="stats-grid">
        <div class="stat-card total">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">總測試數</div>
        </div>
        <div class="stat-card passed">
            <div class="stat-number">${stats.passed}</div>
            <div class="stat-label">通過</div>
            <div class="stat-percentage">${stats.passRate.toFixed(1)}%</div>
        </div>
        <div class="stat-card failed">
            <div class="stat-number">${stats.failed}</div>
            <div class="stat-label">失敗</div>
            <div class="stat-percentage">${stats.failRate.toFixed(1)}%</div>
        </div>
        <div class="stat-card errors">
            <div class="stat-number">${stats.errors}</div>
            <div class="stat-label">錯誤</div>
            <div class="stat-percentage">${stats.errorRate.toFixed(1)}%</div>
        </div>
    </div>
    
    <div class="additional-stats">
        <div class="stat-item">
            <span class="stat-label">測試元件數:</span>
            <span class="stat-value">${stats.components}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">測試平台數:</span>
            <span class="stat-value">${stats.platforms}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">測試變體數:</span>
            <span class="stat-value">${stats.variants}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">總執行時間:</span>
            <span class="stat-value">${(stats.totalDuration / 1000).toFixed(2)}s</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">平均執行時間:</span>
            <span class="stat-value">${stats.averageDuration.toFixed(0)}ms</span>
        </div>
    </div>
</section>`;
  }

  /**
   * 建構篩選器
   */
  private buildFilters(): string {
    return `
<section class="filters-section">
    <div class="filters">
        <div class="filter-group">
            <label>狀態篩選:</label>
            <label class="filter-checkbox">
                <input type="checkbox" data-filter="passed" checked> 通過
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" data-filter="failed" checked> 失敗
            </label>
            <label class="filter-checkbox">
                <input type="checkbox" data-filter="error" checked> 錯誤
            </label>
        </div>
        <div class="filter-group">
            <label for="search">搜尋:</label>
            <input type="text" id="search" placeholder="搜尋測試名稱或元件...">
        </div>
    </div>
</section>`;
  }

  /**
   * 建構結果區塊
   */
  private buildResultsSection(groupedResults: Record<string, TestResult[]>): string {
    const resultHTML = Object.entries(groupedResults)
      .map(([groupName, results]) => this.buildResultGroup(groupName, results))
      .join('');

    return `
<section class="results-section">
    <h2>測試結果</h2>
    ${resultHTML}
</section>`;
  }

  /**
   * 建構結果分組
   */
  private buildResultGroup(groupName: string, results: TestResult[]): string {
    const resultItems = results
      .map(result => this.buildResultItem(result))
      .join('');

    const passed = results.filter(r => r.status === 'passed').length;
    const total = results.length;

    return `
<div class="result-group" data-group="${groupName}">
    <div class="group-header">
        <h3 class="group-title">${groupName}</h3>
        <div class="group-stats">
            <span class="group-count">${passed}/${total} 通過</span>
            <button class="toggle-group" data-target="${groupName}">收合</button>
        </div>
    </div>
    <div class="group-content" id="group-${groupName}">
        ${resultItems}
    </div>
</div>`;
  }

  /**
   * 建構單個測試結果項目
   */
  private buildResultItem(result: TestResult): string {
    const statusIcon = {
      passed: '✅',
      failed: '❌',
      error: '⚠️'
    }[result.status];

    const imagesHTML = this.config.includeImages && result.status === 'failed' 
      ? this.buildImagesSection(result) 
      : '';

    const comparisonHTML = result.comparison 
      ? this.buildComparisonDetails(result.comparison)
      : '';

    const errorHTML = result.error 
      ? `<div class="error-message">錯誤: ${result.error}</div>`
      : '';

    return `
<div class="result-item status-${result.status}" data-status="${result.status}" data-name="${result.name}">
    <div class="result-header">
        <div class="result-info">
            <span class="status-icon">${statusIcon}</span>
            <div class="result-details">
                <div class="result-name">${result.name}</div>
                <div class="result-meta">
                    <span class="component">${result.component}</span>
                    <span class="separator">•</span>
                    <span class="story">${result.story}</span>
                    <span class="separator">•</span>
                    <span class="variant">${result.variant}</span>
                    <span class="separator">•</span>
                    <span class="platform">${result.platform}</span>
                    <span class="separator">•</span>
                    <span class="duration">${result.duration}ms</span>
                </div>
            </div>
        </div>
        <button class="toggle-details" data-target="details-${result.id}">詳細</button>
    </div>
    <div class="result-content" id="details-${result.id}" style="display: none;">
        ${comparisonHTML}
        ${errorHTML}
        ${imagesHTML}
    </div>
</div>`;
  }

  /**
   * 建構圖片區塊
   */
  private buildImagesSection(result: TestResult): string {
    if (!result.screenshots) return '';

    const { baseline, actual, diff } = result.screenshots;
    
    return `
<div class="images-section">
    <div class="images-grid">
        ${baseline ? `
        <div class="image-container">
            <h4>基線圖片</h4>
            <img src="${baseline}" alt="基線圖片" class="screenshot baseline">
        </div>
        ` : ''}
        
        ${actual ? `
        <div class="image-container">
            <h4>實際圖片</h4>
            <img src="${actual}" alt="實際圖片" class="screenshot actual">
        </div>
        ` : ''}
        
        ${diff ? `
        <div class="image-container">
            <h4>差異圖片</h4>
            <img src="${diff}" alt="差異圖片" class="screenshot diff">
        </div>
        ` : ''}
    </div>
</div>`;
  }

  /**
   * 建構比較詳細資訊
   */
  private buildComparisonDetails(comparison: ComparisonResult): string {
    return `
<div class="comparison-details">
    <div class="comparison-stats">
        <div class="comparison-stat">
            <span class="label">不同像素:</span>
            <span class="value">${comparison.pixelDiffCount.toLocaleString()}</span>
        </div>
        <div class="comparison-stat">
            <span class="label">差異百分比:</span>
            <span class="value">${comparison.pixelDiffPercentage.toFixed(2)}%</span>
        </div>
        <div class="comparison-stat">
            <span class="label">閾值:</span>
            <span class="value">${comparison.metadata.threshold}</span>
        </div>
        <div class="comparison-stat">
            <span class="label">比較時間:</span>
            <span class="value">${comparison.metadata.comparisonTime}ms</span>
        </div>
    </div>
</div>`;
  }

  /**
   * 建構頁尾
   */
  private buildFooter(): string {
    return `
<footer class="report-footer">
    <p>由 DonnaAI 視覺回歸測試框架生成</p>
    <p>生成時間: ${new Date().toLocaleString('zh-TW')}</p>
</footer>`;
  }

  /**
   * 生成 CSS 文件
   */
  private async generateCSS(): Promise<void> {
    const css = `
/* 視覺測試報告樣式 */
:root {
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --background-color: #ffffff;
  --surface-color: #f8fafc;
  --text-color: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.theme-dark {
  --background-color: #1f2937;
  --surface-color: #374151;
  --text-color: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #4b5563;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

.report-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.report-header {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.report-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-passed { background: #dcfce7; color: #166534; }
.status-failed { background: #fef2f2; color: #dc2626; }

.stats-section {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  background: var(--background-color);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 2px solid transparent;
}

.stat-card.total { border-color: var(--primary-color); }
.stat-card.passed { border-color: var(--success-color); }
.stat-card.failed { border-color: var(--danger-color); }
.stat-card.errors { border-color: var(--warning-color); }

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.stat-percentage {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.additional-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  justify-content: space-between;
}

.filters-section {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: var(--shadow);
}

.filters {
  display: flex;
  gap: 24px;
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

#search {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--background-color);
  color: var(--text-color);
}

.results-section h2 {
  margin-bottom: 20px;
}

.result-group {
  background: var(--surface-color);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
}

.group-title {
  margin: 0;
  font-size: 1.25rem;
}

.group-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-group {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--text-color);
}

.result-item {
  border-bottom: 1px solid var(--border-color);
  padding: 16px 20px;
}

.result-item:last-child {
  border-bottom: none;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-icon {
  font-size: 1.25rem;
}

.result-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.result-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.separator {
  margin: 0 4px;
}

.toggle-details {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--text-color);
}

.result-content {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.images-section {
  margin-top: 16px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.image-container h4 {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.screenshot {
  max-width: 100%;
  height: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.comparison-details {
  background: var(--background-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.comparison-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.comparison-stat {
  display: flex;
  justify-content: space-between;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #dc2626;
  margin-bottom: 16px;
}

.report-footer {
  text-align: center;
  padding: 20px;
  margin-top: 40px;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .filters {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* 隱藏/顯示類別 */
.hidden { display: none !important; }
.show { display: block !important; }
`;

    const cssPath = path.join(this.config.outputDir, 'visual-report.css');
    await fs.writeFile(cssPath, css);
  }

  /**
   * 取得內聯 CSS
   */
  private getInlineCSS(): string {
    return `
      .hidden { display: none !important; }
      .show { display: block !important; }
    `;
  }

  /**
   * 取得內聯 JavaScript
   */
  private getInlineJS(): string {
    return `
// 報告互動功能
document.addEventListener('DOMContentLoaded', function() {
  // 篩選功能
  const filterCheckboxes = document.querySelectorAll('[data-filter]');
  const searchInput = document.getElementById('search');
  const resultItems = document.querySelectorAll('.result-item');
  
  function filterResults() {
    const checkedFilters = Array.from(filterCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.dataset.filter);
    
    const searchTerm = searchInput.value.toLowerCase();
    
    resultItems.forEach(item => {
      const status = item.dataset.status;
      const name = item.dataset.name.toLowerCase();
      
      const statusMatch = checkedFilters.includes(status);
      const searchMatch = !searchTerm || name.includes(searchTerm);
      
      item.style.display = statusMatch && searchMatch ? 'block' : 'none';
    });
  }
  
  filterCheckboxes.forEach(cb => cb.addEventListener('change', filterResults));
  searchInput.addEventListener('input', filterResults);
  
  // 展開/收合功能
  document.querySelectorAll('.toggle-details').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.dataset.target;
      const target = document.getElementById(targetId);
      
      if (target.style.display === 'none') {
        target.style.display = 'block';
        this.textContent = '收合';
      } else {
        target.style.display = 'none';
        this.textContent = '詳細';
      }
    });
  });
  
  // 分組展開/收合
  document.querySelectorAll('.toggle-group').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = 'group-' + this.dataset.target;
      const target = document.getElementById(targetId);
      
      if (target.style.display === 'none') {
        target.style.display = 'block';
        this.textContent = '收合';
      } else {
        target.style.display = 'none';
        this.textContent = '展開';
      }
    });
  });
});
`;
  }

  /**
   * 確保目錄存在
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 生成簡化的控制台報告
   */
  generateConsoleReport(results: TestResult[]): string {
    const stats = this.calculateStats(results);
    const failed = results.filter(r => r.status === 'failed');
    const errors = results.filter(r => r.status === 'error');

    let report = `\n📊 視覺回歸測試結果\n`;
    report += `${'='.repeat(50)}\n`;
    report += `總測試數: ${stats.total}\n`;
    report += `✅ 通過: ${stats.passed} (${stats.passRate.toFixed(1)}%)\n`;
    report += `❌ 失敗: ${stats.failed} (${stats.failRate.toFixed(1)}%)\n`;
    report += `⚠️  錯誤: ${stats.errors} (${stats.errorRate.toFixed(1)}%)\n`;
    report += `⏱️  執行時間: ${(stats.totalDuration / 1000).toFixed(2)}s\n`;

    if (failed.length > 0) {
      report += `\n❌ 失敗的測試:\n`;
      failed.forEach(result => {
        report += `  • ${result.name}\n`;
        if (result.comparison) {
          report += `    差異: ${result.comparison.pixelDiffPercentage.toFixed(2)}%\n`;
        }
      });
    }

    if (errors.length > 0) {
      report += `\n⚠️  錯誤的測試:\n`;
      errors.forEach(result => {
        report += `  • ${result.name}: ${result.error}\n`;
      });
    }

    return report;
  }
}

// 工具函數
export const createReporter = (config?: Partial<ReportConfig>): VisualTestReporter => {
  return new VisualTestReporter(config);
};

// 預設導出
export default VisualTestReporter;