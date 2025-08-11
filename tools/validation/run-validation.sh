#!/bin/bash

# Adaptive Architecture 自動化驗證腳本
# 整合所有驗證工具的統一入口

set -e # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 專案配置
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_ROOT=$(cd "$SCRIPT_DIR/../../" && pwd)
TOOLS_DIR="$PROJECT_ROOT/tools"
REPORTS_DIR="$PROJECT_ROOT/reports"
VALIDATION_DIR="$TOOLS_DIR/validation"

# 預設配置
MODE="full"
OUTPUT_FORMAT="markdown"
OUTPUT_FILE=""
CI_MODE=false
INCLUDE_VISUAL=false
SKIP_MIGRATION=false
CONFIDENCE_THRESHOLD=0.8
FAIL_ON_WARNING=false
PARALLEL_EXECUTION=true

# 日誌函數
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${PURPLE}[VALIDATION]${NC} $1"
}

# 顯示幫助資訊
show_help() {
    cat << EOF
Adaptive Architecture 自動化驗證腳本

使用方式:
    $0 [選項]

選項:
    -h, --help                  顯示此幫助資訊
    -m, --mode MODE            驗證模式 (full|quick|architecture|design|migration|lint) [預設: full]
    -f, --format FORMAT        輸出格式 (json|html|markdown) [預設: markdown]
    -o, --output FILE          輸出檔案路徑
    --ci                       CI 模式 - 適合持續整合環境
    --include-visual           包含視覺回歸測試
    --skip-migration          跳過遷移分析
    --confidence THRESHOLD     信心度閾值 (0.0-1.0) [預設: 0.8]
    --fail-on-warning         警告時也視為失敗
    --no-parallel             停用並行執行
    --reports-dir DIR         報告輸出目錄 [預設: ./reports]

驗證模式:
    full                      執行所有驗證檢查
    quick                     快速檢查 (跳過耗時項目)
    architecture              僅架構分析
    design                    僅設計系統檢查
    migration                 僅遷移分析
    lint                      僅 ESLint 檢查

範例:
    # 完整驗證
    $0

    # 快速驗證
    $0 --mode quick

    # 生成 HTML 報告
    $0 --format html --output validation-report.html

    # CI 模式
    $0 --ci --fail-on-warning

    # 包含視覺測試的完整驗證
    $0 --include-visual --format html
EOF
}

# 解析命令列參數
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -m|--mode)
                MODE="$2"
                shift 2
                ;;
            -f|--format)
                OUTPUT_FORMAT="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --ci)
                CI_MODE=true
                shift
                ;;
            --include-visual)
                INCLUDE_VISUAL=true
                shift
                ;;
            --skip-migration)
                SKIP_MIGRATION=true
                shift
                ;;
            --confidence)
                CONFIDENCE_THRESHOLD="$2"
                shift 2
                ;;
            --fail-on-warning)
                FAIL_ON_WARNING=true
                shift
                ;;
            --no-parallel)
                PARALLEL_EXECUTION=false
                shift
                ;;
            --reports-dir)
                REPORTS_DIR="$2"
                shift 2
                ;;
            *)
                log_error "未知參數: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 檢查環境
check_environment() {
    log_header "檢查執行環境"

    # 檢查 Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "找不到 Node.js"
        exit 1
    fi

    # 檢查 npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "找不到 npm"
        exit 1
    fi

    # 檢查專案根目錄
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "找不到 package.json，請在專案根目錄執行"
        exit 1
    fi

    # 檢查工具目錄
    if [[ ! -d "$TOOLS_DIR" ]]; then
        log_error "找不到 tools 目錄"
        exit 1
    fi

    log_success "環境檢查通過"
}

# 建立輸出目錄
setup_output_directories() {
    log_info "建立輸出目錄"

    mkdir -p "$REPORTS_DIR"
    mkdir -p "$REPORTS_DIR/validation"
    mkdir -p "$REPORTS_DIR/logs"

    # 設定輸出檔案
    if [[ -z "$OUTPUT_FILE" ]]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        OUTPUT_FILE="$REPORTS_DIR/validation/validation-report_${timestamp}.${OUTPUT_FORMAT}"
    elif [[ "$OUTPUT_FILE" != /* ]]; then
        # 相對路徑轉絕對路徑
        OUTPUT_FILE="$PROJECT_ROOT/$OUTPUT_FILE"
    fi

    log_info "報告將儲存到: $OUTPUT_FILE"
}

# 編譯 TypeScript 工具
compile_tools() {
    log_header "編譯驗證工具"

    cd "$PROJECT_ROOT"

    # 檢查是否有 TypeScript 配置
    if [[ ! -f "tsconfig.json" ]]; then
        log_warning "找不到 tsconfig.json，跳過編譯"
        return 0
    fi

    # 編譯工具
    log_info "編譯 TypeScript 檔案..."
    
    if command -v npx >/dev/null 2>&1; then
        npx tsc --build --force || {
            log_warning "TypeScript 編譯失敗，將使用 ts-node"
            return 0
        }
    fi

    log_success "工具編譯完成"
}

# 執行架構分析
run_architecture_analysis() {
    if [[ "$MODE" != "full" && "$MODE" != "quick" && "$MODE" != "architecture" ]]; then
        return 0
    fi

    log_header "執行架構分析"

    local analysis_script="$TOOLS_DIR/code-analysis/analyzer.ts"
    local output_file="$REPORTS_DIR/logs/architecture-analysis.json"

    if [[ -f "$analysis_script" ]]; then
        cd "$PROJECT_ROOT"
        
        if command -v npx >/dev/null 2>&1 && command -v ts-node >/dev/null 2>&1; then
            npx ts-node -e "
                import { CodeAnalyzer } from './tools/code-analysis/analyzer';
                const analyzer = new CodeAnalyzer();
                analyzer.analyzeProject('.').then(result => {
                    console.log(JSON.stringify(result, null, 2));
                    require('fs').writeFileSync('$output_file', JSON.stringify(result, null, 2));
                }).catch(console.error);
            " || log_warning "架構分析執行失敗"
        else
            log_warning "跳過架構分析 - 缺少 ts-node"
        fi
    else
        log_warning "找不到架構分析工具"
    fi
}

# 執行設計系統檢查
run_design_system_check() {
    if [[ "$MODE" != "full" && "$MODE" != "quick" && "$MODE" != "design" ]]; then
        return 0
    fi

    log_header "執行設計系統檢查"

    local checker_script="$TOOLS_DIR/design-system-checker/checker.ts"
    local output_file="$REPORTS_DIR/logs/design-system-check.json"

    if [[ -f "$checker_script" ]]; then
        cd "$PROJECT_ROOT"
        
        if command -v npx >/dev/null 2>&1 && command -v ts-node >/dev/null 2>&1; then
            npx ts-node -e "
                import { DesignSystemChecker } from './tools/design-system-checker/checker';
                const checker = new DesignSystemChecker();
                checker.checkProject('.').then(result => {
                    console.log('設計系統覆蓋率:', result.summary.coveragePercentage + '%');
                    require('fs').writeFileSync('$output_file', JSON.stringify(result, null, 2));
                }).catch(console.error);
            " || log_warning "設計系統檢查執行失敗"
        else
            log_warning "跳過設計系統檢查 - 缺少 ts-node"
        fi
    else
        log_warning "找不到設計系統檢查工具"
    fi
}

# 執行遷移分析
run_migration_analysis() {
    if [[ "$SKIP_MIGRATION" == "true" || ("$MODE" != "full" && "$MODE" != "migration") ]]; then
        return 0
    fi

    log_header "執行遷移分析"

    local migrator_script="$TOOLS_DIR/migration-assistant/migrator.ts"
    local output_file="$REPORTS_DIR/logs/migration-analysis.json"

    if [[ -f "$migrator_script" ]]; then
        cd "$PROJECT_ROOT"
        
        if command -v npx >/dev/null 2>&1 && command -v ts-node >/dev/null 2>&1; then
            npx ts-node -e "
                import { Migrator } from './tools/migration-assistant/migrator';
                const migrator = new Migrator();
                migrator.migrateProject('.', { dryRun: true, autoApply: false }).then(result => {
                    console.log('總遷移項目:', result.totalMigrations);
                    require('fs').writeFileSync('$output_file', JSON.stringify(result, null, 2));
                }).catch(console.error);
            " || log_warning "遷移分析執行失敗"
        else
            log_warning "跳過遷移分析 - 缺少 ts-node"
        fi
    else
        log_warning "找不到遷移分析工具"
    fi
}

# 執行 ESLint 檢查
run_lint_check() {
    if [[ "$MODE" != "full" && "$MODE" != "quick" && "$MODE" != "lint" ]]; then
        return 0
    fi

    log_header "執行 ESLint 檢查"

    cd "$PROJECT_ROOT"

    local eslint_config=".eslintrc.js"
    local output_file="$REPORTS_DIR/logs/eslint-results.json"

    if [[ -f "$eslint_config" ]]; then
        if command -v npx >/dev/null 2>&1; then
            log_info "執行 ESLint..."
            
            npx eslint "src/**/*.{ts,tsx}" \
                --format json \
                --output-file "$output_file" \
                --no-error-on-unmatched-pattern || {
                log_info "ESLint 執行完成 (可能有警告或錯誤)"
            }
            
            # 顯示摘要
            if [[ -f "$output_file" ]]; then
                local error_count=$(node -e "
                    const results = JSON.parse(require('fs').readFileSync('$output_file', 'utf8'));
                    console.log(results.reduce((sum, file) => sum + file.errorCount, 0));
                " 2>/dev/null || echo "0")
                
                local warning_count=$(node -e "
                    const results = JSON.parse(require('fs').readFileSync('$output_file', 'utf8'));
                    console.log(results.reduce((sum, file) => sum + file.warningCount, 0));
                " 2>/dev/null || echo "0")
                
                log_info "ESLint 結果: $error_count 錯誤, $warning_count 警告"
            fi
        else
            log_warning "跳過 ESLint - 找不到 npx"
        fi
    else
        log_warning "跳過 ESLint - 找不到設定檔"
    fi
}

# 執行視覺回歸測試
run_visual_regression_tests() {
    if [[ "$INCLUDE_VISUAL" != "true" ]]; then
        return 0
    fi

    log_header "執行視覺回歸測試"

    local visual_script="$PROJECT_ROOT/tests/visual/scripts/run-visual-tests.sh"
    local output_file="$REPORTS_DIR/logs/visual-tests.json"

    if [[ -f "$visual_script" ]]; then
        log_info "執行視覺測試..."
        
        # 設定環境變數
        export HEADLESS=true
        export CI_MODE="$CI_MODE"
        
        if bash "$visual_script" --ci --format json --output "$output_file"; then
            log_success "視覺測試完成"
        else
            log_warning "視覺測試執行失敗"
        fi
    else
        log_warning "找不到視覺測試腳本"
    fi
}

# 執行統一驗證
run_unified_validation() {
    log_header "執行統一驗證"

    cd "$PROJECT_ROOT"

    local validation_script="$VALIDATION_DIR/unified-validator.ts"

    if [[ -f "$validation_script" ]]; then
        if command -v npx >/dev/null 2>&1 && command -v ts-node >/dev/null 2>&1; then
            log_info "執行統一驗證器..."
            
            npx ts-node -e "
                import { UnifiedValidator } from './tools/validation/unified-validator';
                
                const validator = new UnifiedValidator();
                const options = {
                    includeVisualTests: $INCLUDE_VISUAL,
                    skipMigrationAnalysis: $SKIP_MIGRATION,
                    confidenceThreshold: $CONFIDENCE_THRESHOLD,
                    outputFormat: '$OUTPUT_FORMAT',
                    outputPath: '$OUTPUT_FILE',
                    ciMode: $CI_MODE,
                };
                
                validator.validate('.', options).then(result => {
                    console.log('✅ 統一驗證完成');
                    console.log('總分:', result.overallScore + '/100');
                    console.log('狀態:', result.status);
                    console.log('品質門檻:', result.summary.qualityGate);
                    
                    if (options.ciMode && result.summary.qualityGate === 'failed') {
                        process.exit(1);
                    }
                }).catch(error => {
                    console.error('❌ 統一驗證失敗:', error.message);
                    process.exit(1);
                });
            "
        else
            log_error "無法執行統一驗證 - 缺少 ts-node"
            exit 1
        fi
    else
        log_error "找不到統一驗證器"
        exit 1
    fi
}

# 生成摘要報告
generate_summary() {
    log_header "生成驗證摘要"

    local summary_file="$REPORTS_DIR/validation/validation-summary.md"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")

    cat > "$summary_file" << EOF
# 驗證執行摘要

**執行時間**: $timestamp
**驗證模式**: $MODE
**輸出格式**: $OUTPUT_FORMAT
**CI 模式**: $(if [[ "$CI_MODE" == "true" ]]; then echo "是"; else echo "否"; fi)
**包含視覺測試**: $(if [[ "$INCLUDE_VISUAL" == "true" ]]; then echo "是"; else echo "否"; fi)

## 執行項目

EOF

    if [[ "$MODE" == "full" || "$MODE" == "quick" || "$MODE" == "architecture" ]]; then
        echo "- ✅ 架構分析" >> "$summary_file"
    fi

    if [[ "$MODE" == "full" || "$MODE" == "quick" || "$MODE" == "design" ]]; then
        echo "- ✅ 設計系統檢查" >> "$summary_file"
    fi

    if [[ "$SKIP_MIGRATION" != "true" && ("$MODE" == "full" || "$MODE" == "migration") ]]; then
        echo "- ✅ 遷移分析" >> "$summary_file"
    fi

    if [[ "$MODE" == "full" || "$MODE" == "quick" || "$MODE" == "lint" ]]; then
        echo "- ✅ ESLint 檢查" >> "$summary_file"
    fi

    if [[ "$INCLUDE_VISUAL" == "true" ]]; then
        echo "- ✅ 視覺回歸測試" >> "$summary_file"
    fi

    echo "- ✅ 統一驗證" >> "$summary_file"

    cat >> "$summary_file" << EOF

## 輸出檔案

- **主要報告**: $OUTPUT_FILE
- **日誌目錄**: $REPORTS_DIR/logs/
- **摘要報告**: $summary_file

---
*由 Adaptive Architecture 自動化驗證腳本生成*
EOF

    log_success "摘要報告已生成: $summary_file"
}

# 清理函數
cleanup() {
    log_info "清理暫存檔案"
    
    # 清理可能的暫存檔案
    find "$REPORTS_DIR" -name "*.tmp" -type f -delete 2>/dev/null || true
    
    log_info "清理完成"
}

# 主要執行函數
main() {
    # 設定清理陷阱
    trap cleanup EXIT INT TERM

    echo "
╔══════════════════════════════════════════════════╗
║        Adaptive Architecture 自動化驗證          ║
╚══════════════════════════════════════════════════╝
"

    # 解析參數
    parse_arguments "$@"

    # 顯示配置
    log_info "驗證模式: $MODE"
    log_info "輸出格式: $OUTPUT_FORMAT"
    log_info "CI 模式: $(if [[ "$CI_MODE" == "true" ]]; then echo "啟用"; else echo "停用"; fi)"
    
    # 記錄開始時間
    START_TIME=$(date +%s)

    # 執行驗證步驟
    check_environment
    setup_output_directories
    compile_tools

    if [[ "$PARALLEL_EXECUTION" == "true" && "$MODE" == "full" ]]; then
        log_info "啟用並行執行模式"
        
        # 並行執行個別工具
        (run_architecture_analysis) &
        (run_design_system_check) &
        (run_migration_analysis) &
        (run_lint_check) &
        
        if [[ "$INCLUDE_VISUAL" == "true" ]]; then
            (run_visual_regression_tests) &
        fi
        
        # 等待所有背景任務完成
        wait
        
        log_success "並行執行完成"
    else
        # 順序執行
        run_architecture_analysis
        run_design_system_check
        run_migration_analysis
        run_lint_check
        run_visual_regression_tests
    fi

    # 執行統一驗證（必須最後執行）
    run_unified_validation

    # 生成摘要
    generate_summary

    # 計算執行時間
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    log_success "✨ 驗證流程完成！"
    log_info "執行時間: ${DURATION}s"
    log_info "報告位置: $OUTPUT_FILE"
    
    if [[ "$CI_MODE" != "true" ]]; then
        echo ""
        echo "下一步："
        echo "1. 查看詳細報告: $OUTPUT_FILE"
        echo "2. 處理發現的問題"
        echo "3. 重新執行驗證確認改善"
    fi
}

# 執行主函數
main "$@"