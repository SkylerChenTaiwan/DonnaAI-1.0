/**
 * 設計系統使用率檢查工具
 * 分析專案中設計系統 tokens 的使用情況並提供改進建議
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { DesignSystem } from '../../src/theme/designSystem';

// 檢查結果介面
export interface DesignSystemUsageReport {
  summary: UsageSummary;
  fileReports: FileReport[];
  recommendations: Recommendation[];
  coverage: CoverageMetrics;
}

export interface UsageSummary {
  totalFiles: number;
  filesUsingDesignSystem: number;
  hardcodedValues: number;
  designSystemTokens: number;
  coveragePercentage: number;
}

export interface FileReport {
  filePath: string;
  hardcodedValues: HardcodedValue[];
  designSystemUsage: DesignSystemUsage[];
  coverageScore: number;
  suggestions: Suggestion[];
}

export interface HardcodedValue {
  type: 'color' | 'spacing' | 'typography' | 'borderRadius' | 'shadow';
  value: string | number;
  property: string;
  line: number;
  column: number;
  suggestedToken?: string;
  confidence: number; // 0-1
}

export interface DesignSystemUsage {
  token: string;
  category: string;
  line: number;
  column: number;
  context: string;
}

export interface Suggestion {
  type: 'replace-hardcoded' | 'use-token' | 'consistent-spacing' | 'accessible-color';
  message: string;
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
}

export interface Recommendation {
  category: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedFiles: string[];
  estimatedEffort: string;
}

export interface CoverageMetrics {
  colors: TokenCoverage;
  spacing: TokenCoverage;
  typography: TokenCoverage;
  borderRadius: TokenCoverage;
  shadows: TokenCoverage;
}

export interface TokenCoverage {
  used: string[];
  unused: string[];
  usageCount: number;
  coveragePercentage: number;
}

// 設計系統檢查器
export class DesignSystemChecker {
  private designTokens = this.extractDesignTokens();
  
  /**
   * 從 DesignSystem 提取所有可用的 tokens
   */
  private extractDesignTokens() {
    return {
      colors: this.flattenObject(DesignSystem.colors, 'DesignSystem.colors'),
      spacing: this.flattenObject(DesignSystem.spacing, 'DesignSystem.spacing'),
      typography: this.flattenObject(DesignSystem.typography, 'DesignSystem.typography'),
      borderRadius: this.flattenObject(DesignSystem.borderRadius, 'DesignSystem.borderRadius'),
      shadows: this.flattenObject(DesignSystem.shadows || {}, 'DesignSystem.shadows'),
    };
  }

  /**
   * 扁平化物件結構
   */
  private flattenObject(obj: any, prefix: string): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = `${prefix}.${key}`;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    
    return result;
  }

  /**
   * 檢查整個專案的設計系統使用率
   */
  async checkProject(projectPath: string, options: CheckOptions = {}): Promise<DesignSystemUsageReport> {
    const {
      include = ['src/**/*.{ts,tsx,js,jsx}'],
      exclude = ['**/node_modules/**', '**/*.test.*', '**/*.spec.*'],
      ignoreFiles = [],
    } = options;

    // 找出所有需要檢查的文件
    const patterns = include.map(pattern => path.join(projectPath, pattern));
    const files = await Promise.all(
      patterns.map(pattern => glob(pattern, { ignore: exclude }))
    );

    let allFiles = files.flat().filter(file => 
      !ignoreFiles.some(ignored => file.includes(ignored))
    );

    console.log(`檢查 ${allFiles.length} 個文件的設計系統使用率...`);

    // 檢查每個文件
    const fileReports = await Promise.all(
      allFiles.map(file => this.checkFile(file))
    );

    // 彙總結果
    return this.generateReport(fileReports);
  }

  /**
   * 檢查單個文件
   */
  async checkFile(filePath: string): Promise<FileReport> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      const hardcodedValues: HardcodedValue[] = [];
      const designSystemUsage: DesignSystemUsage[] = [];
      const suggestions: Suggestion[] = [];

      // 逐行分析
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // 檢查硬編碼值
        this.findHardcodedValues(line, lineNumber, hardcodedValues);
        
        // 檢查設計系統使用
        this.findDesignSystemUsage(line, lineNumber, designSystemUsage);
      }

      // 生成改進建議
      this.generateSuggestions(hardcodedValues, suggestions);

      // 計算覆蓋率分數
      const coverageScore = this.calculateCoverageScore(hardcodedValues, designSystemUsage);

      return {
        filePath,
        hardcodedValues,
        designSystemUsage,
        coverageScore,
        suggestions,
      };

    } catch (error) {
      console.error(`檢查文件失敗: ${filePath}`, error);
      return {
        filePath,
        hardcodedValues: [],
        designSystemUsage: [],
        coverageScore: 0,
        suggestions: [],
      };
    }
  }

  /**
   * 找出硬編碼值
   */
  private findHardcodedValues(line: string, lineNumber: number, hardcodedValues: HardcodedValue[]): void {
    // 檢查硬編碼顏色
    const colorMatches = line.matchAll(/(color|backgroundColor|borderColor)\s*:\s*['"`]?(#[0-9A-Fa-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)['"`]?/g);
    
    for (const match of colorMatches) {
      const value = match[2];
      if (this.isHardcodedColor(value)) {
        const suggestedToken = this.findClosestColorToken(value);
        
        hardcodedValues.push({
          type: 'color',
          value,
          property: match[1],
          line: lineNumber,
          column: match.index || 0,
          suggestedToken,
          confidence: suggestedToken ? this.calculateColorConfidence(value, suggestedToken) : 0.5,
        });
      }
    }

    // 檢查硬編碼間距
    const spacingMatches = line.matchAll(/(margin|padding|gap|top|right|bottom|left|width|height)[^:]*:\s*(\d+(?:\.\d+)?)\s*(?:px)?/g);
    
    for (const match of spacingMatches) {
      const value = parseFloat(match[2]);
      if (value > 0) {
        const suggestedToken = this.findClosestSpacingToken(value);
        
        hardcodedValues.push({
          type: 'spacing',
          value,
          property: match[1],
          line: lineNumber,
          column: match.index || 0,
          suggestedToken,
          confidence: suggestedToken ? 0.8 : 0.3,
        });
      }
    }

    // 檢查硬編碼字體大小
    const fontSizeMatches = line.matchAll(/fontSize\s*:\s*(\d+(?:\.\d+)?)/g);
    
    for (const match of fontSizeMatches) {
      const value = parseFloat(match[1]);
      const suggestedToken = this.findClosestTypographyToken(value);
      
      hardcodedValues.push({
        type: 'typography',
        value,
        property: 'fontSize',
        line: lineNumber,
        column: match.index || 0,
        suggestedToken,
        confidence: suggestedToken ? 0.9 : 0.4,
      });
    }

    // 檢查硬編碼邊框圓角
    const borderRadiusMatches = line.matchAll(/borderRadius\s*:\s*(\d+(?:\.\d+)?)/g);
    
    for (const match of borderRadiusMatches) {
      const value = parseFloat(match[1]);
      const suggestedToken = this.findClosestBorderRadiusToken(value);
      
      hardcodedValues.push({
        type: 'borderRadius',
        value,
        property: 'borderRadius',
        line: lineNumber,
        column: match.index || 0,
        suggestedToken,
        confidence: suggestedToken ? 0.9 : 0.5,
      });
    }
  }

  /**
   * 找出設計系統使用
   */
  private findDesignSystemUsage(line: string, lineNumber: number, designSystemUsage: DesignSystemUsage[]): void {
    const dsMatches = line.matchAll(/DesignSystem\.(\w+(?:\.\w+)*)/g);
    
    for (const match of designSystemUsage) {
      const token = `DesignSystem.${match[1]}`;
      let category = 'unknown';
      
      if (token.includes('.colors.')) category = 'colors';
      else if (token.includes('.spacing.')) category = 'spacing';
      else if (token.includes('.typography.')) category = 'typography';
      else if (token.includes('.borderRadius.')) category = 'borderRadius';
      else if (token.includes('.shadows.')) category = 'shadows';
      
      designSystemUsage.push({
        token,
        category,
        line: lineNumber,
        column: match.index || 0,
        context: line.trim(),
      });
    }
  }

  /**
   * 生成改進建議
   */
  private generateSuggestions(hardcodedValues: HardcodedValue[], suggestions: Suggestion[]): void {
    // 為高信心度的硬編碼值生成替換建議
    hardcodedValues
      .filter(hv => hv.confidence > 0.7 && hv.suggestedToken)
      .forEach(hv => {
        suggestions.push({
          type: 'replace-hardcoded',
          message: `將硬編碼的 ${hv.type} 值替換為設計系統 token`,
          before: `${hv.property}: ${hv.value}`,
          after: `${hv.property}: ${hv.suggestedToken}`,
          impact: hv.type === 'color' ? 'high' : 'medium',
        });
      });

    // 檢查間距一致性
    const spacingValues = hardcodedValues
      .filter(hv => hv.type === 'spacing')
      .map(hv => hv.value as number);
    
    const uniqueSpacingValues = [...new Set(spacingValues)];
    if (uniqueSpacingValues.length > 5) {
      suggestions.push({
        type: 'consistent-spacing',
        message: '該文件使用了過多不同的間距值，建議統一使用設計系統間距',
        before: `多種間距值: ${uniqueSpacingValues.slice(0, 3).join(', ')}...`,
        after: 'DesignSystem.spacing.sm, DesignSystem.spacing.md, ...',
        impact: 'medium',
      });
    }

    // 檢查顏色無障礙性
    const colorValues = hardcodedValues.filter(hv => hv.type === 'color');
    if (colorValues.length > 0) {
      suggestions.push({
        type: 'accessible-color',
        message: '建議檢查顏色對比度是否符合無障礙標準',
        before: '硬編碼顏色可能不符合對比度要求',
        after: '使用設計系統中已驗證的顏色組合',
        impact: 'high',
      });
    }
  }

  /**
   * 計算覆蓋率分數
   */
  private calculateCoverageScore(
    hardcodedValues: HardcodedValue[],
    designSystemUsage: DesignSystemUsage[]
  ): number {
    const totalStyleDeclarations = hardcodedValues.length + designSystemUsage.length;
    
    if (totalStyleDeclarations === 0) return 100; // 沒有樣式聲明
    
    return (designSystemUsage.length / totalStyleDeclarations) * 100;
  }

  /**
   * 生成完整報告
   */
  private generateReport(fileReports: FileReport[]): DesignSystemUsageReport {
    const totalFiles = fileReports.length;
    const filesUsingDesignSystem = fileReports.filter(report => 
      report.designSystemUsage.length > 0
    ).length;
    
    const totalHardcodedValues = fileReports.reduce((sum, report) => 
      sum + report.hardcodedValues.length, 0
    );
    
    const totalDesignSystemTokens = fileReports.reduce((sum, report) => 
      sum + report.designSystemUsage.length, 0
    );
    
    const coveragePercentage = totalFiles > 0 ? 
      (filesUsingDesignSystem / totalFiles) * 100 : 0;

    // 生成建議
    const recommendations = this.generateRecommendations(fileReports);

    // 計算各類別覆蓋率
    const coverage = this.calculateTokenCoverage(fileReports);

    const summary: UsageSummary = {
      totalFiles,
      filesUsingDesignSystem,
      hardcodedValues: totalHardcodedValues,
      designSystemTokens: totalDesignSystemTokens,
      coveragePercentage,
    };

    return {
      summary,
      fileReports,
      recommendations,
      coverage,
    };
  }

  /**
   * 生成整體建議
   */
  private generateRecommendations(fileReports: FileReport[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 分析最常見的硬編碼值
    const colorIssues = fileReports.filter(report => 
      report.hardcodedValues.some(hv => hv.type === 'color')
    );

    if (colorIssues.length > fileReports.length * 0.3) {
      recommendations.push({
        category: 'colors',
        priority: 'high',
        title: '建立統一的顏色系統',
        description: '專案中存在大量硬編碼顏色，建議全面採用設計系統顏色 tokens',
        affectedFiles: colorIssues.map(r => r.filePath),
        estimatedEffort: '2-3 天',
      });
    }

    const spacingIssues = fileReports.filter(report => 
      report.hardcodedValues.some(hv => hv.type === 'spacing')
    );

    if (spacingIssues.length > fileReports.length * 0.4) {
      recommendations.push({
        category: 'spacing',
        priority: 'medium',
        title: '統一間距系統',
        description: '建議使用設計系統的間距 scale 來確保一致的視覺韻律',
        affectedFiles: spacingIssues.map(r => r.filePath),
        estimatedEffort: '1-2 天',
      });
    }

    // 低覆蓋率文件
    const lowCoverageFiles = fileReports.filter(report => report.coverageScore < 50);
    
    if (lowCoverageFiles.length > 0) {
      recommendations.push({
        category: 'coverage',
        priority: 'high',
        title: '提升設計系統覆蓋率',
        description: '這些文件的設計系統使用率較低，建議優先重構',
        affectedFiles: lowCoverageFiles.map(r => r.filePath),
        estimatedEffort: '1 週',
      });
    }

    return recommendations;
  }

  /**
   * 計算各類別 token 覆蓋率
   */
  private calculateTokenCoverage(fileReports: FileReport[]): CoverageMetrics {
    const allUsage = fileReports.flatMap(report => report.designSystemUsage);
    
    const categories = ['colors', 'spacing', 'typography', 'borderRadius', 'shadows'];
    const coverage: any = {};

    for (const category of categories) {
      const categoryUsage = allUsage.filter(usage => usage.category === category);
      const usedTokens = [...new Set(categoryUsage.map(usage => usage.token))];
      const availableTokens = Object.keys(this.designTokens[category as keyof typeof this.designTokens] || {});
      
      coverage[category] = {
        used: usedTokens,
        unused: availableTokens.filter(token => !usedTokens.includes(token)),
        usageCount: categoryUsage.length,
        coveragePercentage: availableTokens.length > 0 ? 
          (usedTokens.length / availableTokens.length) * 100 : 0,
      };
    }

    return coverage as CoverageMetrics;
  }

  // 輔助方法
  private isHardcodedColor(value: string): boolean {
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value) ||
           /^rgba?\([^)]+\)$/.test(value) ||
           /^hsla?\([^)]+\)$/.test(value) ||
           ['red', 'blue', 'green', 'white', 'black', 'gray', 'yellow'].includes(value.toLowerCase());
  }

  private findClosestColorToken(value: string): string | undefined {
    // 簡化版：實際應該計算顏色相似度
    const colors = this.designTokens.colors;
    
    // 常見顏色對應
    const colorMapping: Record<string, string> = {
      '#000000': 'DesignSystem.colors.text.primary',
      '#ffffff': 'DesignSystem.colors.background.card',
      '#f0f0f0': 'DesignSystem.colors.background.default',
      'red': 'DesignSystem.colors.status.error',
      'green': 'DesignSystem.colors.status.success',
      'blue': 'DesignSystem.colors.primary',
    };

    return colorMapping[value.toLowerCase()];
  }

  private findClosestSpacingToken(value: number): string | undefined {
    const spacing = Object.entries(DesignSystem.spacing);
    let closest = null;
    let minDiff = Infinity;

    for (const [key, spaceValue] of spacing) {
      const diff = Math.abs(value - (spaceValue as number));
      if (diff < minDiff) {
        minDiff = diff;
        closest = `DesignSystem.spacing.${key}`;
      }
    }

    return minDiff <= 4 ? closest : undefined; // 允許 4px 的誤差
  }

  private findClosestTypographyToken(value: number): string | undefined {
    const typography = Object.entries(DesignSystem.typography);
    
    for (const [key, typo] of typography) {
      if (typeof typo === 'object' && typo.fontSize === value) {
        return `DesignSystem.typography.${key}.fontSize`;
      }
    }

    return undefined;
  }

  private findClosestBorderRadiusToken(value: number): string | undefined {
    const borderRadius = Object.entries(DesignSystem.borderRadius);
    
    for (const [key, radius] of borderRadius) {
      if (radius === value) {
        return `DesignSystem.borderRadius.${key}`;
      }
    }

    return undefined;
  }

  private calculateColorConfidence(hardcoded: string, suggested: string): number {
    // 簡化版：實際應該計算顏色相似度
    return 0.8;
  }
}

// 檢查選項介面
export interface CheckOptions {
  include?: string[];
  exclude?: string[];
  ignoreFiles?: string[];
}

// 工具函數
export const createDesignSystemChecker = (): DesignSystemChecker => {
  return new DesignSystemChecker();
};

// 預設導出
export default DesignSystemChecker;