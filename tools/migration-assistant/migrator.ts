/**
 * Adaptive Architecture 遷移助理工具
 * 自動化檢測和重構現有程式碼以符合統一架構
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import * as parser from '@typescript-eslint/parser';
import { AST_NODE_TYPES } from '@typescript-eslint/types';

// 遷移結果介面
export interface MigrationResult {
  filePath: string;
  migrations: Migration[];
  status: 'success' | 'partial' | 'failed';
  warnings: string[];
  errors: string[];
}

export interface Migration {
  type: MigrationType;
  description: string;
  original: string;
  replacement: string;
  line: number;
  column: number;
  confidence: number; // 0-1
  manual: boolean; // 是否需要手動處理
}

export type MigrationType = 
  | 'platform-os-replacement'
  | 'component-replacement'
  | 'import-replacement'
  | 'style-token-replacement'
  | 'web-api-wrapping'
  | 'prop-migration';

export interface MigrationOptions {
  include?: string[];
  exclude?: string[];
  dryRun?: boolean;
  autoApply?: boolean;
  confidenceThreshold?: number;
  backupOriginal?: boolean;
}

export interface ProjectMigrationReport {
  totalFiles: number;
  migratedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  totalMigrations: number;
  migrationsByType: Record<MigrationType, number>;
  highRiskMigrations: Migration[];
  manualMigrations: Migration[];
}

// 自動化遷移工具
export class Migrator {
  private componentMapping = {
    'View': 'AdaptiveView',
    'Text': 'AdaptiveText',
    'TouchableOpacity': 'AdaptiveButton',
    'TouchableHighlight': 'AdaptiveButton',
    'TouchableWithoutFeedback': 'AdaptiveButton',
    'TextInput': 'AdaptiveInput',
    'Image': 'AdaptiveImage',
    'Modal': 'AdaptiveModal',
  };

  private webAPIMapping = {
    'document': 'PlatformAdapter.getInstance().isWeb ? document : undefined',
    'window': 'PlatformAdapter.getInstance().isWeb ? window : undefined',
    'localStorage': 'PlatformAdapter.getInstance().getStorage()',
    'fetch': 'PlatformAdapter.getInstance().fetch',
  };

  private styleTokenMapping = {
    // 常見顏色對應
    '#000000': 'DesignSystem.colors.text.primary',
    '#ffffff': 'DesignSystem.colors.background.card',
    '#f0f0f0': 'DesignSystem.colors.background.default',
    '#007bff': 'DesignSystem.colors.primary',
    '#dc3545': 'DesignSystem.colors.status.error',
    '#28a745': 'DesignSystem.colors.status.success',
    '#ffc107': 'DesignSystem.colors.status.warning',
    
    // 常見間距對應
    '4': 'DesignSystem.spacing.xs',
    '8': 'DesignSystem.spacing.sm', 
    '12': 'DesignSystem.spacing.md',
    '16': 'DesignSystem.spacing.lg',
    '20': 'DesignSystem.spacing.xl',
    '24': 'DesignSystem.spacing.xxl',
  };

  /**
   * 遷移整個專案
   */
  async migrateProject(
    projectPath: string, 
    options: MigrationOptions = {}
  ): Promise<ProjectMigrationReport> {
    const {
      include = ['**/*.{ts,tsx,js,jsx}'],
      exclude = ['**/node_modules/**', '**/dist/**', '**/build/**'],
      dryRun = false,
      autoApply = false,
      confidenceThreshold = 0.8,
      backupOriginal = true,
    } = options;

    console.log(`開始遷移專案: ${projectPath}`);
    console.log(`模式: ${dryRun ? '模擬' : '實際'}, 自動套用: ${autoApply}, 閾值: ${confidenceThreshold}`);

    // 找出所有需要遷移的文件
    const patterns = include.map(pattern => path.join(projectPath, pattern));
    const files = await Promise.all(
      patterns.map(pattern => glob(pattern, { ignore: exclude }))
    );

    const allFiles = files.flat().filter(file => 
      !file.includes('.test.') && 
      !file.includes('.spec.') &&
      !file.includes('__tests__')
    );

    console.log(`找到 ${allFiles.length} 個文件需要檢查`);

    // 遷移每個文件
    const results = await Promise.all(
      allFiles.map(file => this.migrateFile(file, {
        dryRun,
        autoApply,
        confidenceThreshold,
        backupOriginal,
      }))
    );

    return this.generateMigrationReport(results);
  }

  /**
   * 遷移單個文件
   */
  async migrateFile(
    filePath: string, 
    options: Partial<MigrationOptions> = {}
  ): Promise<MigrationResult> {
    const {
      dryRun = false,
      autoApply = false,
      confidenceThreshold = 0.8,
      backupOriginal = true,
    } = options;

    try {
      const originalContent = await fs.readFile(filePath, 'utf-8');
      const migrations: Migration[] = [];
      const warnings: string[] = [];
      const errors: string[] = [];

      // 解析 AST
      let ast;
      try {
        ast = parser.parse(originalContent, {
          sourceType: 'module',
          ecmaVersion: 2020,
          ecmaFeatures: {
            jsx: true,
            globalReturn: false,
          },
        });
      } catch (parseError) {
        errors.push(`解析錯誤: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        return {
          filePath,
          migrations: [],
          status: 'failed',
          warnings,
          errors,
        };
      }

      // 檢測需要遷移的模式
      this.detectMigrationPatterns(ast, originalContent, migrations);

      // 篩選高信心度的遷移
      const highConfidenceMigrations = migrations.filter(m => m.confidence >= confidenceThreshold);
      const lowConfidenceMigrations = migrations.filter(m => m.confidence < confidenceThreshold);

      // 添加警告
      if (lowConfidenceMigrations.length > 0) {
        warnings.push(`${lowConfidenceMigrations.length} 個低信心度的遷移需要手動檢查`);
      }

      let newContent = originalContent;
      let appliedMigrations = 0;

      // 套用遷移
      if (!dryRun && migrations.length > 0) {
        // 備份原始文件
        if (backupOriginal) {
          const backupPath = `${filePath}.backup`;
          await fs.writeFile(backupPath, originalContent);
        }

        // 按行號排序（從後往前應用避免位置偏移）
        const sortedMigrations = autoApply ? 
          highConfidenceMigrations.filter(m => !m.manual).sort((a, b) => b.line - a.line) :
          [];

        for (const migration of sortedMigrations) {
          try {
            newContent = this.applyMigration(newContent, migration);
            appliedMigrations++;
          } catch (error) {
            errors.push(`應用遷移失敗 (行 ${migration.line}): ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        // 寫入新內容
        if (appliedMigrations > 0) {
          await fs.writeFile(filePath, newContent);
        }
      }

      const status = errors.length > 0 ? 'failed' : 
                   (appliedMigrations < migrations.length ? 'partial' : 'success');

      return {
        filePath,
        migrations,
        status,
        warnings,
        errors,
      };

    } catch (error) {
      return {
        filePath,
        migrations: [],
        status: 'failed',
        warnings: [],
        errors: [`遷移失敗: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * 檢測需要遷移的模式
   */
  private detectMigrationPatterns(ast: any, sourceCode: string, migrations: Migration[]): void {
    const lines = sourceCode.split('\n');

    this.traverseAST(ast, (node: any, parent: any) => {
      const loc = node.loc || { start: { line: 1, column: 1 } };

      switch (node.type) {
        case AST_NODE_TYPES.ImportDeclaration:
          this.detectImportMigrations(node, migrations, loc);
          break;

        case AST_NODE_TYPES.MemberExpression:
          this.detectPlatformOSMigrations(node, migrations, loc, lines);
          this.detectWebAPIMigrations(node, migrations, loc, lines);
          break;

        case AST_NODE_TYPES.JSXOpeningElement:
          this.detectComponentMigrations(node, migrations, loc, lines);
          break;

        case AST_NODE_TYPES.Property:
          this.detectStyleMigrations(node, migrations, loc, lines);
          break;
      }
    });
  }

  /**
   * 檢測 import 遷移
   */
  private detectImportMigrations(node: any, migrations: Migration[], loc: any): void {
    if (node.source?.value === 'react-native') {
      // 檢查原生元件匯入
      node.specifiers?.forEach((specifier: any) => {
        if (specifier.imported && this.componentMapping[specifier.imported.name]) {
          const adaptiveComponent = this.componentMapping[specifier.imported.name];
          
          migrations.push({
            type: 'import-replacement',
            description: `將 ${specifier.imported.name} 匯入替換為 ${adaptiveComponent}`,
            original: `import { ${specifier.imported.name} } from 'react-native'`,
            replacement: `import { ${adaptiveComponent} } from '@components/adaptive/core'`,
            line: loc.start.line,
            column: loc.start.column,
            confidence: 0.9,
            manual: false,
          });
        }

        if (specifier.imported?.name === 'Platform') {
          migrations.push({
            type: 'import-replacement',
            description: '將 Platform 匯入替換為 PlatformAdapter',
            original: `import { Platform } from 'react-native'`,
            replacement: `import { PlatformAdapter } from '@components/adaptive/platform'`,
            line: loc.start.line,
            column: loc.start.column,
            confidence: 0.95,
            manual: false,
          });
        }
      });
    }
  }

  /**
   * 檢測 Platform.OS 遷移
   */
  private detectPlatformOSMigrations(
    node: any, 
    migrations: Migration[], 
    loc: any, 
    lines: string[]
  ): void {
    if (node.object?.name === 'Platform' && node.property?.name === 'OS') {
      const line = lines[loc.start.line - 1] || '';
      
      migrations.push({
        type: 'platform-os-replacement',
        description: '將 Platform.OS 替換為 PlatformAdapter',
        original: 'Platform.OS',
        replacement: 'PlatformAdapter.getInstance().isWeb',
        line: loc.start.line,
        column: loc.start.column,
        confidence: 0.8,
        manual: line.includes('===') || line.includes('!=='), // 需要手動處理條件比較
      });
    }
  }

  /**
   * 檢測 Web API 遷移
   */
  private detectWebAPIMigrations(
    node: any, 
    migrations: Migration[], 
    loc: any, 
    lines: string[]
  ): void {
    const apiName = node.object?.name || node.property?.name;
    
    if (apiName && this.webAPIMapping[apiName]) {
      const line = lines[loc.start.line - 1] || '';
      
      migrations.push({
        type: 'web-api-wrapping',
        description: `包裝 Web API "${apiName}" 使其跨平台相容`,
        original: apiName,
        replacement: this.webAPIMapping[apiName],
        line: loc.start.line,
        column: loc.start.column,
        confidence: 0.7,
        manual: true, // Web API 通常需要手動檢查上下文
      });
    }
  }

  /**
   * 檢測元件遷移
   */
  private detectComponentMigrations(
    node: any, 
    migrations: Migration[], 
    loc: any, 
    lines: string[]
  ): void {
    const componentName = node.name?.name;
    
    if (componentName && this.componentMapping[componentName]) {
      const adaptiveComponent = this.componentMapping[componentName];
      
      migrations.push({
        type: 'component-replacement',
        description: `將 ${componentName} 替換為 ${adaptiveComponent}`,
        original: `<${componentName}`,
        replacement: `<${adaptiveComponent}`,
        line: loc.start.line,
        column: loc.start.column,
        confidence: 0.85,
        manual: false,
      });
    }
  }

  /**
   * 檢測樣式遷移
   */
  private detectStyleMigrations(
    node: any, 
    migrations: Migration[], 
    loc: any, 
    lines: string[]
  ): void {
    const propertyName = node.key?.name || node.key?.value;
    const propertyValue = node.value?.value;

    if (!propertyName || !propertyValue) return;

    // 檢查硬編碼顏色
    if (['color', 'backgroundColor', 'borderColor'].includes(propertyName)) {
      const colorToken = this.styleTokenMapping[String(propertyValue)];
      
      if (colorToken) {
        migrations.push({
          type: 'style-token-replacement',
          description: `將硬編碼顏色替換為設計系統 token`,
          original: `${propertyName}: '${propertyValue}'`,
          replacement: `${propertyName}: ${colorToken}`,
          line: loc.start.line,
          column: loc.start.column,
          confidence: 0.9,
          manual: false,
        });
      }
    }

    // 檢查硬編碼間距
    const spacingProps = ['margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
                         'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    
    if (spacingProps.includes(propertyName)) {
      const spacingToken = this.styleTokenMapping[String(propertyValue)];
      
      if (spacingToken) {
        migrations.push({
          type: 'style-token-replacement',
          description: `將硬編碼間距替換為設計系統 token`,
          original: `${propertyName}: ${propertyValue}`,
          replacement: `${propertyName}: ${spacingToken}`,
          line: loc.start.line,
          column: loc.start.column,
          confidence: 0.8,
          manual: false,
        });
      }
    }
  }

  /**
   * 套用遷移
   */
  private applyMigration(content: string, migration: Migration): string {
    const lines = content.split('\n');
    const targetLine = lines[migration.line - 1];
    
    if (!targetLine) {
      throw new Error(`行號 ${migration.line} 不存在`);
    }

    // 簡化替換邏輯
    const newLine = targetLine.replace(migration.original, migration.replacement);
    lines[migration.line - 1] = newLine;
    
    return lines.join('\n');
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
   * 生成遷移報告
   */
  private generateMigrationReport(results: MigrationResult[]): ProjectMigrationReport {
    const totalFiles = results.length;
    const migratedFiles = results.filter(r => r.status === 'success').length;
    const partialFiles = results.filter(r => r.status === 'partial').length;
    const failedFiles = results.filter(r => r.status === 'failed').length;

    const allMigrations = results.flatMap(r => r.migrations);
    const totalMigrations = allMigrations.length;

    // 按類型統計
    const migrationsByType: Record<MigrationType, number> = {
      'platform-os-replacement': 0,
      'component-replacement': 0,
      'import-replacement': 0,
      'style-token-replacement': 0,
      'web-api-wrapping': 0,
      'prop-migration': 0,
    };

    allMigrations.forEach(migration => {
      migrationsByType[migration.type]++;
    });

    // 高風險和手動遷移
    const highRiskMigrations = allMigrations.filter(m => m.confidence < 0.5);
    const manualMigrations = allMigrations.filter(m => m.manual);

    return {
      totalFiles,
      migratedFiles,
      skippedFiles: partialFiles,
      failedFiles,
      totalMigrations,
      migrationsByType,
      highRiskMigrations,
      manualMigrations,
    };
  }

  /**
   * 生成遷移計劃
   */
  async generateMigrationPlan(
    projectPath: string, 
    outputPath?: string
  ): Promise<void> {
    console.log('生成遷移計劃...');

    const report = await this.migrateProject(projectPath, { 
      dryRun: true,
      autoApply: false,
      confidenceThreshold: 0.0, // 包含所有遷移
    });

    const planContent = this.formatMigrationPlan(report);
    
    const planPath = outputPath || path.join(projectPath, 'MIGRATION-PLAN.md');
    await fs.writeFile(planPath, planContent);
    
    console.log(`遷移計劃已保存到: ${planPath}`);
  }

  /**
   * 格式化遷移計劃
   */
  private formatMigrationPlan(report: ProjectMigrationReport): string {
    const now = new Date().toISOString().split('T')[0];
    
    return `# Adaptive Architecture 遷移計劃

生成日期: ${now}

## 概要

- **總文件數**: ${report.totalFiles}
- **需要遷移的文件**: ${report.migratedFiles + report.skippedFiles}
- **總遷移項目**: ${report.totalMigrations}

## 遷移類型統計

${Object.entries(report.migrationsByType)
  .map(([type, count]) => `- **${type}**: ${count}`)
  .join('\n')}

## 高風險遷移 (${report.highRiskMigrations.length})

${report.highRiskMigrations.slice(0, 10).map(m => 
  `- \`${m.original}\` → \`${m.replacement}\` (信心度: ${(m.confidence * 100).toFixed(1)}%)`
).join('\n')}

## 需要手動處理 (${report.manualMigrations.length})

${report.manualMigrations.slice(0, 10).map(m => 
  `- **${m.type}**: ${m.description}`
).join('\n')}

## 建議執行順序

1. **Phase 1**: Import 和 Component 替換 (低風險)
2. **Phase 2**: Style Token 遷移 (中風險)
3. **Phase 3**: Platform.OS 和 Web API 處理 (高風險，需手動)

## 執行指令

\`\`\`bash
# 模擬遷移 (查看會發生什麼變化)
node -e "require('./tools/migration-assistant/migrator').migrateProject('.', { dryRun: true })"

# 自動套用低風險遷移
node -e "require('./tools/migration-assistant/migrator').migrateProject('.', { autoApply: true, confidenceThreshold: 0.8 })"

# 全面手動遷移
node -e "require('./tools/migration-assistant/migrator').migrateProject('.', { dryRun: false, autoApply: false })"
\`\`\`

---
*此計劃由 Adaptive Architecture Migration Assistant 自動生成*
`;
  }
}

// 工具函數
export const createMigrator = (): Migrator => {
  return new Migrator();
};

// CLI 介面
export const runMigration = async (args: string[]) => {
  const migrator = new Migrator();
  
  if (args.includes('--plan')) {
    await migrator.generateMigrationPlan('.');
  } else if (args.includes('--dry-run')) {
    const report = await migrator.migrateProject('.', { dryRun: true });
    console.log('遷移模擬完成:', report);
  } else {
    const report = await migrator.migrateProject('.', { 
      autoApply: args.includes('--auto'),
      backupOriginal: !args.includes('--no-backup'),
    });
    console.log('遷移完成:', report);
  }
};

// 預設導出
export default Migrator;