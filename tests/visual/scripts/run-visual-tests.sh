#!/bin/bash

# 視覺回歸測試執行腳本
# 自動化執行跨平台視覺測試並生成報告

set -e # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 項目配置
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
VISUAL_TESTS_DIR="$PROJECT_ROOT/tests/visual"
RESULTS_DIR="$VISUAL_TESTS_DIR/results"
SNAPSHOTS_DIR="$VISUAL_TESTS_DIR/snapshots"
REPORTS_DIR="$RESULTS_DIR/reports"

# 預設配置
STORYBOOK_PORT=6006
STORYBOOK_URL="http://localhost:$STORYBOOK_PORT"
PLATFORM="web"
UPDATE_SNAPSHOTS=false
PARALLEL_JOBS=4
COMPONENTS=""
STORIES=""
DEBUG=false
HEADLESS=true
BROWSER="chromium"
TIMEOUT=60000

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

# 幫助資訊
show_help() {
    cat << EOF
視覺回歸測試執行腳本

使用方式:
    $0 [選項]

選項:
    -h, --help              顯示此幫助資訊
    -p, --platform PLATFORM 指定測試平台 (web|native|all) [預設: web]
    -u, --update            更新快照基線
    -j, --jobs NUMBER       並行任務數 [預設: 4]
    -c, --components LIST   指定要測試的元件 (逗號分隔)
    -s, --stories LIST      指定要測試的 stories (逗號分隔)
    -d, --debug             啟用除錯模式
    --no-headless           顯示瀏覽器視窗
    --browser BROWSER       指定瀏覽器 (chromium|firefox|webkit) [預設: chromium]
    --timeout MILLISECONDS  設定超時時間 [預設: 60000]
    --storybook-url URL     Storybook URL [預設: http://localhost:6006]
    --clean                 清理舊的測試結果
    --report-only           僅生成報告，不執行測試
    --ci                    CI 模式 (無互動)

範例:
    # 執行所有 web 平台測試
    $0 --platform web

    # 更新 AdaptiveButton 的快照
    $0 --update --components AdaptiveButton

    # 除錯模式執行特定 story
    $0 --debug --stories "AdaptiveButton--Primary"

    # CI 模式執行測試
    $0 --ci --platform all --parallel 8

    # 僅生成報告
    $0 --report-only
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
            -p|--platform)
                PLATFORM="$2"
                shift 2
                ;;
            -u|--update)
                UPDATE_SNAPSHOTS=true
                shift
                ;;
            -j|--jobs)
                PARALLEL_JOBS="$2"
                shift 2
                ;;
            -c|--components)
                COMPONENTS="$2"
                shift 2
                ;;
            -s|--stories)
                STORIES="$2"
                shift 2
                ;;
            -d|--debug)
                DEBUG=true
                HEADLESS=false
                PARALLEL_JOBS=1
                shift
                ;;
            --no-headless)
                HEADLESS=false
                shift
                ;;
            --browser)
                BROWSER="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --storybook-url)
                STORYBOOK_URL="$2"
                shift 2
                ;;
            --clean)
                clean_results
                exit 0
                ;;
            --report-only)
                generate_report_only
                exit 0
                ;;
            --ci)
                export CI=true
                HEADLESS=true
                shift
                ;;
            *)
                log_error "未知參數: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 檢查依賴
check_dependencies() {
    log_info "檢查依賴項目..."

    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安裝"
        exit 1
    fi

    # 檢查 npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安裝"
        exit 1
    fi

    # 檢查項目依賴
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "找不到 package.json"
        exit 1
    fi

    # 檢查 visual tests 目錄
    if [[ ! -d "$VISUAL_TESTS_DIR" ]]; then
        log_error "找不到視覺測試目錄: $VISUAL_TESTS_DIR"
        exit 1
    fi

    log_success "依賴檢查完成"
}

# 確保目錄存在
ensure_directories() {
    log_info "建立必要目錄..."
    
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$SNAPSHOTS_DIR/web"
    mkdir -p "$SNAPSHOTS_DIR/native"
    mkdir -p "$REPORTS_DIR"
    mkdir -p "$RESULTS_DIR/diffs"
    mkdir -p "$RESULTS_DIR/received"
    
    log_success "目錄建立完成"
}

# 啟動 Storybook
start_storybook() {
    if [[ "$PLATFORM" == "native" ]]; then
        return 0
    fi

    log_info "檢查 Storybook 服務..."
    
    # 檢查 Storybook 是否已在運行
    if curl -s "$STORYBOOK_URL" > /dev/null 2>&1; then
        log_success "Storybook 已在運行: $STORYBOOK_URL"
        return 0
    fi

    log_info "啟動 Storybook..."
    
    # 在背景啟動 Storybook
    cd "$PROJECT_ROOT"
    npm run storybook > "$RESULTS_DIR/storybook.log" 2>&1 &
    STORYBOOK_PID=$!
    
    # 等待 Storybook 啟動
    log_info "等待 Storybook 啟動..."
    for i in {1..30}; do
        if curl -s "$STORYBOOK_URL" > /dev/null 2>&1; then
            log_success "Storybook 已啟動"
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
    log_error "Storybook 啟動失敗"
    if [[ -n "$STORYBOOK_PID" ]]; then
        kill "$STORYBOOK_PID" 2>/dev/null || true
    fi
    exit 1
}

# 停止 Storybook
stop_storybook() {
    if [[ -n "$STORYBOOK_PID" ]]; then
        log_info "停止 Storybook..."
        kill "$STORYBOOK_PID" 2>/dev/null || true
        wait "$STORYBOOK_PID" 2>/dev/null || true
        log_success "Storybook 已停止"
    fi
}

# 執行 Web 平台測試
run_web_tests() {
    log_info "執行 Web 平台視覺測試..."
    
    cd "$VISUAL_TESTS_DIR"
    
    # 設定環境變數
    export PLATFORM=web
    export STORYBOOK_URL="$STORYBOOK_URL"
    export HEADLESS="$HEADLESS"
    export DEBUG="$DEBUG"
    export UPDATE_SNAPSHOTS="$UPDATE_SNAPSHOTS"
    export BROWSER="$BROWSER"
    export TIMEOUT="$TIMEOUT"
    
    # 建構 Jest 命令
    local jest_cmd="npx jest --config=config/jest.config.js"
    
    if [[ "$UPDATE_SNAPSHOTS" == "true" ]]; then
        jest_cmd="$jest_cmd --updateSnapshot"
    fi
    
    if [[ "$PARALLEL_JOBS" -gt 1 ]]; then
        jest_cmd="$jest_cmd --maxWorkers=$PARALLEL_JOBS"
    fi
    
    if [[ -n "$COMPONENTS" ]]; then
        jest_cmd="$jest_cmd --testNamePattern=\"$COMPONENTS\""
    fi
    
    if [[ -n "$STORIES" ]]; then
        jest_cmd="$jest_cmd --testNamePattern=\"$STORIES\""
    fi
    
    if [[ "$DEBUG" == "true" ]]; then
        jest_cmd="$jest_cmd --verbose --detectOpenHandles"
    fi
    
    # 執行測試
    if eval "$jest_cmd"; then
        log_success "Web 平台測試完成"
        return 0
    else
        log_error "Web 平台測試失敗"
        return 1
    fi
}

# 執行 Native 平台測試
run_native_tests() {
    log_info "執行 Native 平台視覺測試..."
    
    # 檢查是否有 Detox 配置
    if [[ ! -f "$PROJECT_ROOT/.detoxrc.js" ]]; then
        log_warning "找不到 Detox 配置，跳過 Native 測試"
        return 0
    fi
    
    cd "$PROJECT_ROOT"
    
    # 設定環境變數
    export PLATFORM=native
    export DEBUG="$DEBUG"
    export UPDATE_SNAPSHOTS="$UPDATE_SNAPSHOTS"
    
    # 執行 Native 測試
    if npx detox test --configuration ios.sim.debug; then
        log_success "Native 平台測試完成"
        return 0
    else
        log_error "Native 平台測試失敗"
        return 1
    fi
}

# 生成測試報告
generate_report() {
    log_info "生成測試報告..."
    
    cd "$VISUAL_TESTS_DIR"
    
    # 執行報告生成腳本
    if node -e "
        const { createReporter } = require('./utils/reporter');
        const fs = require('fs');
        const path = require('path');
        
        async function generateReport() {
            try {
                const resultsPath = path.join('$RESULTS_DIR', 'test-results.json');
                
                if (!fs.existsSync(resultsPath)) {
                    console.log('找不到測試結果，生成空報告');
                    return;
                }
                
                const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
                const reporter = createReporter({
                    outputDir: '$REPORTS_DIR',
                    title: '視覺回歸測試報告'
                });
                
                const reportPath = await reporter.generateReport(results);
                console.log('報告已生成:', reportPath);
            } catch (error) {
                console.error('生成報告失敗:', error);
                process.exit(1);
            }
        }
        
        generateReport();
    "; then
        log_success "測試報告生成完成"
        log_info "報告位置: $REPORTS_DIR/visual-test-report.html"
    else
        log_error "測試報告生成失敗"
        return 1
    fi
}

# 僅生成報告
generate_report_only() {
    log_info "僅生成測試報告..."
    ensure_directories
    generate_report
}

# 清理舊結果
clean_results() {
    log_info "清理舊的測試結果..."
    
    if [[ -d "$RESULTS_DIR" ]]; then
        rm -rf "$RESULTS_DIR"
        log_success "測試結果已清理"
    fi
    
    ensure_directories
}

# 顯示測試摘要
show_summary() {
    log_info "測試執行摘要"
    echo "=================================="
    echo "平台: $PLATFORM"
    echo "更新快照: $UPDATE_SNAPSHOTS"
    echo "並行任務: $PARALLEL_JOBS"
    echo "除錯模式: $DEBUG"
    echo "無頭模式: $HEADLESS"
    echo "瀏覽器: $BROWSER"
    
    if [[ -n "$COMPONENTS" ]]; then
        echo "測試元件: $COMPONENTS"
    fi
    
    if [[ -n "$STORIES" ]]; then
        echo "測試 Stories: $STORIES"
    fi
    
    echo "=================================="
}

# 清理函數
cleanup() {
    log_info "清理資源..."
    stop_storybook
    
    # 清理臨時文件
    rm -f "$RESULTS_DIR"/*.tmp 2>/dev/null || true
    
    log_success "清理完成"
}

# 主要執行函數
main() {
    # 解析參數
    parse_arguments "$@"
    
    # 顯示摘要
    show_summary
    
    # 設定清理陷阱
    trap cleanup EXIT INT TERM
    
    # 檢查依賴
    check_dependencies
    
    # 確保目錄存在
    ensure_directories
    
    # 記錄開始時間
    START_TIME=$(date +%s)
    
    local web_success=true
    local native_success=true
    
    # 根據平台執行測試
    case "$PLATFORM" in
        web)
            start_storybook
            run_web_tests || web_success=false
            ;;
        native)
            run_native_tests || native_success=false
            ;;
        all)
            start_storybook
            run_web_tests || web_success=false
            run_native_tests || native_success=false
            ;;
        *)
            log_error "不支援的平台: $PLATFORM"
            exit 1
            ;;
    esac
    
    # 生成報告
    generate_report
    
    # 計算執行時間
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # 顯示結果
    echo ""
    log_info "視覺測試執行完成"
    log_info "執行時間: ${DURATION}s"
    
    if [[ "$web_success" == "false" || "$native_success" == "false" ]]; then
        log_error "測試執行失敗"
        exit 1
    else
        log_success "所有測試執行成功"
        log_info "查看報告: $REPORTS_DIR/visual-test-report.html"
    fi
}

# 執行主函數
main "$@"