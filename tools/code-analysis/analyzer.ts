/**
 * Adaptive Architecture 程式碼分析工具
 * 檢測程式碼中不符合統一架構模式的地方
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import * as parser from '@typescript-eslint/parser';
import { AST_NODE_TYPES } from '@typescript-eslint/types';

// 分析結果介面
export interface AnalysisResult {
  filePath: string;
  issues: Issue[];
  metrics: FileMetrics;
}

export interface Issue {
  type: IssueType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  rule: string;
  suggestion?: string;
}

export type IssueType = 
  | 'direct-platform-usage'
  | 'native-component-usage'
  | 'hardcoded-style'
  | 'missing-adaptive-import'
  | 'web-specific-code'
  | 'design-system-violation'
  | 'accessibility-issue';

export interface FileMetrics {
  totalLines: number;
  platformChecks: number;
  nativeComponentUsage: number;
  adaptiveComponentUsage: number;
  designSystemUsage: number;
  webSpecificCode: number;
  adaptiveCoverage: number; // 百分比
}

export interface ProjectMetrics {
  totalFiles: number;
  totalIssues: number;
  issuesByType: Record<IssueType, number>;
  overallAdaptiveCoverage: number;
  designSystemCoverage: number;
  topIssues: Array<{ file: string; issueCount: number }>;
}

// 程式碼分析器
export class CodeAnalyzer {
  private nativeComponents = new Set([
    'View', 'Text', 'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback',
    'TextInput', 'Image', 'ScrollView', 'FlatList', 'SectionList', 'Modal',
    'Switch', 'Slider', 'Picker', 'ActivityIndicator', 'RefreshControl'
  ]);

  private adaptiveComponents = new Set([
    'AdaptiveView', 'AdaptiveText', 'AdaptiveButton', 'AdaptiveInput', 
    'AdaptiveImage', 'AdaptiveModal', 'AdaptiveSelect'
  ]);

  private webSpecificAPIs = new Set([
    'document', 'window', 'localStorage', 'sessionStorage', 'navigator',
    'location', 'history', 'fetch', 'XMLHttpRequest', 'addEventListener',
    'removeEventListener', 'querySelector', 'getElementById'
  ]);

  private designSystemTokens = new Set([
    'DesignSystem.colors', 'DesignSystem.spacing', 'DesignSystem.typography',
    'DesignSystem.borderRadius', 'DesignSystem.shadows'
  ]);

  /**
   * 分析整個專案
   */
  async analyzeProject(projectPath: string, options: AnalysisOptions = {}): Promise<ProjectMetrics> {
    const {
      include = ['**/*.{ts,tsx,js,jsx}'],
      exclude = ['**/node_modules/**', '**/dist/**', '**/build/**'],
      ignoreTests = true
    } = options;

    // 找出所有需要分析的文件
    const patterns = include.map(pattern => path.join(projectPath, pattern));
    const files = await Promise.all(
      patterns.map(pattern => glob(pattern, { ignore: exclude }))
    );

    let allFiles = files.flat();

    // 過濾測試文件
    if (ignoreTests) {
      allFiles = allFiles.filter(file => 
        !file.includes('.test.') && 
        !file.includes('.spec.') && 
        !file.includes('__tests__')
      );
    }

    console.log(`分析 ${allFiles.length} 個文件...`);

    // 分析每個文件
    const results = await Promise.all(
      allFiles.map(file => this.analyzeFile(file))
    );

    // 彙總結果
    return this.aggregateResults(results);
  }

  /**
   * 分析單個文件
   */
  async analyzeFile(filePath: string): Promise<AnalysisResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues: Issue[] = [];
      const metrics: FileMetrics = {
        totalLines: content.split('\n').length,
        platformChecks: 0,
        nativeComponentUsage: 0,
        adaptiveComponentUsage: 0,
        designSystemUsage: 0,
        webSpecificCode: 0,
        adaptiveCoverage: 0,
      };

      // 解析 AST
      let ast;
      try {
        ast = parser.parse(content, {
          sourceType: 'module',
          ecmaVersion: 2020,
          ecmaFeatures: {
            jsx: true,
            globalReturn: false,
          },
        });
      } catch (parseError) {
        issues.push({
          type: 'design-system-violation',
          severity: 'error',
          message: `解析錯誤: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          line: 1,
          column: 1,
          rule: 'parse-error',
        });
        
        return { filePath, issues, metrics };
      }

      // 遍歷 AST 節點
      this.traverseAST(ast, (node: any, parent: any) => {
        this.analyzeNode(node, parent, issues, metrics, content);
      });

      // 計算適應性覆蓋率
      const totalComponentUsage = metrics.nativeComponentUsage + metrics.adaptiveComponentUsage;
      if (totalComponentUsage > 0) {
        metrics.adaptiveCoverage = (metrics.adaptiveComponentUsage / totalComponentUsage) * 100;
      }

      return { filePath, issues, metrics };

    } catch (error) {
      const issues: Issue[] = [{
        type: 'design-system-violation',
        severity: 'error',
        message: `分析文件失敗: ${error instanceof Error ? error.message : String(error)}`,
        line: 1,
        column: 1,
        rule: 'analysis-error',
      }];

      const metrics: FileMetrics = {
        totalLines: 0,
        platformChecks: 0,
        nativeComponentUsage: 0,
        adaptiveComponentUsage: 0,
        designSystemUsage: 0,
        webSpecificCode: 0,
        adaptiveCoverage: 0,
      };

      return { filePath, issues, metrics };
    }
  }

  /**
   * 分析 AST 節點
   */
  private analyzeNode(
    node: any,
    parent: any,
    issues: Issue[],
    metrics: FileMetrics,
    sourceCode: string
  ): void {
    const loc = node.loc || { start: { line: 1, column: 1 } };

    switch (node.type) {
      case AST_NODE_TYPES.ImportDeclaration:
        this.analyzeImportDeclaration(node, issues, metrics, loc);
        break;

      case AST_NODE_TYPES.MemberExpression:
        this.analyzeMemberExpression(node, issues, metrics, loc);
        break;

      case AST_NODE_TYPES.JSXOpeningElement:
        this.analyzeJSXElement(node, issues, metrics, loc);
        break;

      case AST_NODE_TYPES.Property:
        this.analyzePropertyNode(node, issues, metrics, loc);
        break;

      case AST_NODE_TYPES.Identifier:
        this.analyzeIdentifier(node, parent, issues, metrics, loc);
        break;
    }
  }

  /**
   * 分析 import 宣告
   */
  private analyzeImportDeclaration(
    node: any,
    issues: Issue[],
    metrics: FileMetrics,
    loc: any
  ): void {
    if (node.source?.value === 'react-native') {
      // 檢查是否匯入原生元件
      node.specifiers?.forEach((specifier: any) => {
        if (specifier.imported && this.nativeComponents.has(specifier.imported.name)) {
          issues.push({
            type: 'native-component-usage',
            severity: 'warning',
            message: `建議使用 Adaptive${specifier.imported.name} 替代 ${specifier.imported.name}`,
            line: loc.start.line,
            column: loc.start.column,
            rule: 'prefer-adaptive-components',
            suggestion: `import { Adaptive${specifier.imported.name} } from '@components/adaptive/core'`,
          });
        }

        if (specifier.imported?.name === 'Platform') {
          issues.push({
            type: 'direct-platform-usage',
            severity: 'error',
            message: '不應直接匯入 Platform，請使用 PlatformAdapter',
            line: loc.start.line,
            column: loc.start.column,
            rule: 'no-direct-platform',
            suggestion: `import { PlatformAdapter } from '@components/adaptive/platform'`,
          });
        }
      });
    }

    // 檢查是否匯入 Adaptive 元件
    if (node.source?.value?.includes('adaptive')) {
      node.specifiers?.forEach((specifier: any) => {
        if (specifier.imported && this.adaptiveComponents.has(specifier.imported.name)) {
          metrics.adaptiveComponentUsage++;
        }
      });
    }

    // 檢查設計系統匯入
    if (node.source?.value?.includes('designSystem') || node.source?.value?.includes('theme')) {
      metrics.designSystemUsage++;
    }
  }

  /**
   * 分析成員表達式 (如 Platform.OS)
   */
  private analyzeMemberExpression(
    node: any,
    issues: Issue[],
    metrics: FileMetrics,
    loc: any
  ): void {
    // 檢查 Platform.OS 使用
    if (node.object?.name === 'Platform' && node.property?.name === 'OS') {
      metrics.platformChecks++;
      issues.push({
        type: 'direct-platform-usage',
        severity: 'error',
        message: '不應直接使用 Platform.OS，請使用 PlatformAdapter.getInstance().isWeb',
        line: loc.start.line,
        column: loc.start.column,
        rule: 'no-direct-platform',
        suggestion: 'PlatformAdapter.getInstance().isWeb',
      });
    }

    // 檢查設計系統使用
    if (node.object?.name === 'DesignSystem') {
      metrics.designSystemUsage++;
    }

    // 檢查 Web 特有 API
    if (this.webSpecificAPIs.has(node.object?.name || '')) {
      metrics.webSpecificCode++;
      
      if (!this.isInPlatformCheck(node)) {
        issues.push({
          type: 'web-specific-code',
          severity: 'warning',
          message: `Web 特有 API "${node.object.name}" 應該包裝在平台檢查中`,
          line: loc.start.line,
          column: loc.start.column,
          rule: 'wrap-web-apis',
          suggestion: `if (PlatformAdapter.getInstance().isWeb) { ${node.object.name}... }`,
        });
      }
    }
  }

  /**
   * 分析 JSX 元素
   */
  private analyzeJSXElement(
    node: any,
    issues: Issue[],
    metrics: FileMetrics,
    loc: any
  ): void {
    const componentName = node.name?.name;
    
    if (!componentName) return;

    // 檢查原生元件使用
    if (this.nativeComponents.has(componentName)) {
      metrics.nativeComponentUsage++;
      issues.push({
        type: 'native-component-usage',
        severity: 'warning',
        message: `建議使用 Adaptive${componentName} 替代 ${componentName}`,
        line: loc.start.line,
        column: loc.start.column,
        rule: 'prefer-adaptive-components',
        suggestion: `<Adaptive${componentName}>`,
      });
    }

    // 檢查 Adaptive 元件使用
    if (this.adaptiveComponents.has(componentName)) {
      metrics.adaptiveComponentUsage++;
    }

    // 檢查 JSX 屬性
    node.attributes?.forEach((attr: any) => {
      if (attr.type === 'JSXAttribute') {
        this.analyzeJSXAttribute(attr, issues, metrics, componentName, loc);
      }
    });
  }

  /**
   * 分析 JSX 屬性
   */
  private analyzeJSXAttribute(
    attr: any,
    issues: Issue[],
    metrics: FileMetrics,
    componentName: string,
    loc: any
  ): void {
    const attrName = attr.name?.name;
    
    if (!attrName) return;

    // 檢查 Web 特有屬性
    const webSpecificProps = ['className', 'onClick', 'onMouseEnter', 'onMouseLeave'];
    
    if (webSpecificProps.includes(attrName) && !componentName.includes('Web')) {
      issues.push({
        type: 'web-specific-code',
        severity: 'info',
        message: `"${attrName}" 是 Web 特有屬性，建議同時提供跨平台等效屬性`,
        line: loc.start.line,
        column: loc.start.column,
        rule: 'cross-platform-props',
      });
    }

    // 檢查無障礙屬性
    if (attrName.startsWith('accessibility') || attrName.startsWith('aria-')) {
      // 這是好的，不記錄為問題
    } else if (componentName.startsWith('Adaptive') && !attr.name?.name?.includes('accessibility')) {
      // 可能缺少無障礙屬性
    }
  }

  /**
   * 分析屬性節點（樣式等）
   */
  private analyzePropertyNode(
    node: any,
    issues: Issue[],
    metrics: FileMetrics,
    loc: any
  ): void {
    const propertyName = node.key?.name || node.key?.value;
    const propertyValue = node.value?.value;

    if (!propertyName) return;

    // 檢查硬編碼顏色
    if (['color', 'backgroundColor', 'borderColor'].includes(propertyName)) {
      if (typeof propertyValue === 'string' && this.isHardcodedColor(propertyValue)) {
        issues.push({
          type: 'hardcoded-style',
          severity: 'warning',
          message: `避免硬編碼顏色 "${propertyValue}"，請使用 DesignSystem.colors`,
          line: loc.start.line,
          column: loc.start.column,
          rule: 'use-design-tokens',
          suggestion: 'DesignSystem.colors.primary',
        });
      }
    }

    // 檢查硬編碼間距
    const spacingProps = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                         'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    
    if (spacingProps.includes(propertyName)) {
      if (typeof propertyValue === 'number' && propertyValue !== 0) {
        issues.push({
          type: 'hardcoded-style',
          severity: 'info',
          message: `考慮使用 DesignSystem.spacing 替代硬編碼間距 "${propertyValue}"`,
          line: loc.start.line,
          column: loc.start.column,
          rule: 'use-design-tokens',
          suggestion: 'DesignSystem.spacing.md',
        });
      }
    }
  }

  /**
   * 分析識別符
   */
  private analyzeIdentifier(
    node: any,
    parent: any,
    issues: Issue[],
    metrics: FileMetrics,
    loc: any
  ): void {
    // 檢查 Web 特有全域變數
    if (this.webSpecificAPIs.has(node.name) && !this.isInPlatformCheck(node)) {
      metrics.webSpecificCode++;
      issues.push({
        type: 'web-specific-code',
        severity: 'warning',
        message: `Web 特有 API "${node.name}" 應該包裝在平台檢查中`,
        line: loc.start.line,
        column: loc.start.column,
        rule: 'wrap-web-apis',
      });
    }
  }

  /**
   * 遍歷 AST
   */
  private traverseAST(node: any, callback: (node: any, parent: any) => void, parent: any = null): void {
    callback(node, parent);

    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach((child: any) => {
            if (child && typeof child === 'object') {
              this.traverseAST(child, callback, node);
            }
          });
        } else if (node[key].type) {
          this.traverseAST(node[key], callback, node);
        }
      }
    }
  }

  /**
   * 檢查是否為硬編碼顏色
   */
  private isHardcodedColor(value: string): boolean {
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value) ||
           /^rgba?\([^)]+\)$/.test(value) ||
           /^hsla?\([^)]+\)$/.test(value);
  }

  /**
   * 檢查節點是否在平台檢查內
   */
  private isInPlatformCheck(node: any): boolean {
    // 簡化版檢查，實際應該檢查父節點中是否有平台條件
    // 這裡返回 false 表示需要更詳細的實現
    return false;
  }

  /**
   * 彙總分析結果
   */
  private aggregateResults(results: AnalysisResult[]): ProjectMetrics {
    const totalFiles = results.length;
    const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
    
    // 按類型統計問題
    const issuesByType: Record<IssueType, number> = {
      'direct-platform-usage': 0,
      'native-component-usage': 0,
      'hardcoded-style': 0,
      'missing-adaptive-import': 0,
      'web-specific-code': 0,
      'design-system-violation': 0,
      'accessibility-issue': 0,
    };

    results.forEach(result => {
      result.issues.forEach(issue => {
        issuesByType[issue.type]++;
      });
    });

    // 計算整體適應性覆蓋率
    const totalAdaptiveUsage = results.reduce((sum, result) => 
      sum + result.metrics.adaptiveComponentUsage, 0);
    const totalNativeUsage = results.reduce((sum, result) => 
      sum + result.metrics.nativeComponentUsage, 0);
    
    const overallAdaptiveCoverage = totalAdaptiveUsage + totalNativeUsage > 0 ?
      (totalAdaptiveUsage / (totalAdaptiveUsage + totalNativeUsage)) * 100 : 0;

    // 計算設計系統覆蓋率
    const totalDesignSystemUsage = results.reduce((sum, result) => 
      sum + result.metrics.designSystemUsage, 0);
    const designSystemCoverage = totalFiles > 0 ? 
      (totalDesignSystemUsage / totalFiles) * 100 : 0;

    // 找出問題最多的文件
    const topIssues = results
      .map(result => ({
        file: result.filePath,
        issueCount: result.issues.length,
      }))
      .sort((a, b) => b.issueCount - a.issueCount)
      .slice(0, 10);

    return {
      totalFiles,
      totalIssues,
      issuesByType,
      overallAdaptiveCoverage,
      designSystemCoverage,
      topIssues,
    };
  }
}

// 分析選項介面
export interface AnalysisOptions {
  include?: string[];
  exclude?: string[];
  ignoreTests?: boolean;
}

// 工具函數
export const createAnalyzer = (): CodeAnalyzer => {
  return new CodeAnalyzer();
};

// 預設導出
export default CodeAnalyzer;