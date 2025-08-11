#!/bin/bash

# CI/CD 視覺測試整合腳本
# 用於在持續整合環境中執行視覺回歸測試

set -e # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CI 環境檢測
if [[ -n "$CI" || -n "$GITHUB_ACTIONS" || -n "$GITLAB_CI" || -n "$JENKINS_URL" ]]; then
    export CI_ENVIRONMENT=true
else
    export CI_ENVIRONMENT=false
fi

# 項目配置
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../" && pwd)
VISUAL_TESTS_DIR="$PROJECT_ROOT/tests/visual"
RESULTS_DIR="$VISUAL_TESTS_DIR/results"
REPORTS_DIR="$RESULTS_DIR/reports"

# CI 配置
PLATFORM="web"
PARALLEL_JOBS=${CI_PARALLEL_JOBS:-4}
TIMEOUT=${CI_TIMEOUT:-120000}
RETRY_COUNT=${CI_RETRY_COUNT:-2}
FAIL_ON_VISUAL_DIFF=${FAIL_ON_VISUAL_DIFF:-true}
UPLOAD_ARTIFACTS=${UPLOAD_ARTIFACTS:-true}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
TEAMS_WEBHOOK_URL=${TEAMS_WEBHOOK_URL:-""}

# 日誌函數
log_info() {
    echo -e "${BLUE}[CI-INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[CI-SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[CI-WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[CI-ERROR]${NC} $1"
}

# 幫助資訊
show_help() {
    cat << EOF
CI/CD 視覺測試整合腳本

環境變數:
    CI_PARALLEL_JOBS        並行任務數 [預設: 4]
    CI_TIMEOUT             超時時間 (ms) [預設: 120000]
    CI_RETRY_COUNT         重試次數 [預設: 2]
    FAIL_ON_VISUAL_DIFF    視覺差異時是否失敗 [預設: true]
    UPLOAD_ARTIFACTS       是否上傳測試產出 [預設: true]
    SLACK_WEBHOOK_URL      Slack 通知 Webhook URL
    TEAMS_WEBHOOK_URL      Microsoft Teams Webhook URL

使用方式:
    $0 [選項]

選項:
    -h, --help              顯示此幫助資訊
    -p, --platform PLATFORM 指定測試平台 (web|native|all) [預設: web]
    --pr-mode              PR 模式 - 僅測試變更的元件
    --baseline-branch BRANCH 基線分支 [預設: main]
    --compare-branch BRANCH 比較分支 [預設: current]
    --artifact-retention DAYS 測試產出保留天數 [預設: 30]
    --notification-level LEVEL 通知級別 (all|failures|none) [預設: failures]

範例:
    # CI 環境執行全部測試
    $0

    # PR 模式僅測試變更
    $0 --pr-mode

    # 指定基線分支比較
    $0 --baseline-branch develop --compare-branch feature/new-component
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
            --pr-mode)
                export PR_MODE=true
                shift
                ;;
            --baseline-branch)
                export BASELINE_BRANCH="$2"
                shift 2
                ;;
            --compare-branch)
                export COMPARE_BRANCH="$2"
                shift 2
                ;;
            --artifact-retention)
                export ARTIFACT_RETENTION_DAYS="$2"
                shift 2
                ;;
            --notification-level)
                export NOTIFICATION_LEVEL="$2"
                shift 2
                ;;
            *)
                log_error "未知參數: $1"
                exit 1
                ;;
        esac
    done
}

# 檢測 CI 環境
detect_ci_environment() {
    log_info "檢測 CI/CD 環境..."
    
    if [[ -n "$GITHUB_ACTIONS" ]]; then
        export CI_PROVIDER="GitHub Actions"
        export CI_BUILD_URL="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID"
        export CI_COMMIT_SHA="$GITHUB_SHA"
        export CI_BRANCH="${GITHUB_HEAD_REF:-$GITHUB_REF_NAME}"
        export CI_PR_NUMBER="$GITHUB_EVENT_NUMBER"
    elif [[ -n "$GITLAB_CI" ]]; then
        export CI_PROVIDER="GitLab CI"
        export CI_BUILD_URL="$CI_PIPELINE_URL"
        export CI_COMMIT_SHA="$CI_COMMIT_SHA"
        export CI_BRANCH="$CI_COMMIT_REF_NAME"
        export CI_PR_NUMBER="$CI_MERGE_REQUEST_IID"
    elif [[ -n "$JENKINS_URL" ]]; then
        export CI_PROVIDER="Jenkins"
        export CI_BUILD_URL="$BUILD_URL"
        export CI_COMMIT_SHA="$GIT_COMMIT"
        export CI_BRANCH="$GIT_BRANCH"
    else
        export CI_PROVIDER="Unknown"
        export CI_COMMIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        export CI_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    fi
    
    log_info "CI 提供者: $CI_PROVIDER"
    log_info "分支: $CI_BRANCH"
    log_info "提交: ${CI_COMMIT_SHA:0:8}"
    
    if [[ -n "$CI_PR_NUMBER" ]]; then
        log_info "PR 編號: $CI_PR_NUMBER"
    fi
}

# 準備 CI 環境
prepare_ci_environment() {
    log_info "準備 CI 環境..."
    
    # 設定 CI 環境變數
    export CI=true
    export NODE_ENV=test
    export HEADLESS=true
    
    # 設定顯示器 (Linux CI 環境)
    if command -v xvfb-run >/dev/null 2>&1; then
        export DISPLAY=:99.0
        Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
        log_info "啟動虛擬顯示器"
    fi
    
    # 增加檔案描述符限制
    ulimit -n 4096 2>/dev/null || true
    
    # 建立必要目錄
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$REPORTS_DIR"
    
    log_success "CI 環境準備完成"
}

# 安裝依賴
install_dependencies() {
    log_info "安裝依賴套件..."
    
    cd "$PROJECT_ROOT"
    
    # 檢查 package.json
    if [[ ! -f "package.json" ]]; then
        log_error "找不到 package.json"
        exit 1
    fi
    
    # 使用快取友善的安裝方式
    if command -v npm >/dev/null 2>&1; then
        npm ci --prefer-offline --no-audit
    elif command -v yarn >/dev/null 2>&1; then
        yarn install --frozen-lockfile --prefer-offline
    else
        log_error "找不到 npm 或 yarn"
        exit 1
    fi
    
    log_success "依賴安裝完成"
}

# 獲取變更的元件
get_changed_components() {
    if [[ "$PR_MODE" != "true" ]]; then
        return 0
    fi
    
    log_info "檢測變更的元件..."
    
    local baseline_branch="${BASELINE_BRANCH:-main}"
    local compare_branch="${COMPARE_BRANCH:-HEAD}"
    
    # 獲取變更的文件
    local changed_files=$(git diff --name-only "$baseline_branch"..."$compare_branch" | grep -E '\.(tsx?|jsx?)$' || echo "")
    
    if [[ -z "$changed_files" ]]; then
        log_info "沒有檢測到相關文件變更"
        return 0
    fi
    
    # 提取變更的元件名稱
    local components=""
    while IFS= read -r file; do
        if [[ "$file" =~ src/components/adaptive/core/([^/]+)\.(tsx?|jsx?) ]]; then
            local component_name=$(basename "${BASH_REMATCH[1]}" .tsx)
            component_name=$(basename "$component_name" .ts)
            
            if [[ -n "$components" ]]; then
                components="$components,$component_name"
            else
                components="$component_name"
            fi
        fi
    done <<< "$changed_files"
    
    if [[ -n "$components" ]]; then
        export CHANGED_COMPONENTS="$components"
        log_info "檢測到變更的元件: $components"
    else
        log_info "沒有檢測到變更的 Adaptive 元件"
    fi
}

# 執行視覺測試
run_visual_tests() {
    log_info "執行視覺測試..."
    
    local test_script="$VISUAL_TESTS_DIR/scripts/run-visual-tests.sh"
    
    # 檢查測試腳本
    if [[ ! -f "$test_script" ]]; then
        log_error "找不到測試腳本: $test_script"
        exit 1
    fi
    
    # 建構測試命令
    local cmd="$test_script"
    cmd="$cmd --platform $PLATFORM"
    cmd="$cmd --jobs $PARALLEL_JOBS"
    cmd="$cmd --timeout $TIMEOUT"
    cmd="$cmd --ci"
    
    if [[ -n "$CHANGED_COMPONENTS" ]]; then
        cmd="$cmd --components \"$CHANGED_COMPONENTS\""
    fi
    
    # 執行測試（帶重試）
    local attempt=1
    local success=false
    
    while [[ $attempt -le $((RETRY_COUNT + 1)) ]]; do
        log_info "測試執行 (嘗試 $attempt/$((RETRY_COUNT + 1)))"
        
        if eval "$cmd"; then
            success=true
            break
        else
            log_warning "測試執行失敗 (嘗試 $attempt/$((RETRY_COUNT + 1)))"
            
            if [[ $attempt -le $RETRY_COUNT ]]; then
                log_info "等待 10 秒後重試..."
                sleep 10
            fi
        fi
        
        ((attempt++))
    done
    
    if [[ "$success" == "false" ]]; then
        log_error "視覺測試失敗"
        return 1
    fi
    
    log_success "視覺測試完成"
    return 0
}

# 分析測試結果
analyze_results() {
    log_info "分析測試結果..."
    
    local results_file="$RESULTS_DIR/test-results.json"
    
    if [[ ! -f "$results_file" ]]; then
        log_warning "找不到測試結果文件"
        return 0
    fi
    
    # 使用 Node.js 解析結果
    local analysis=$(node -e "
        const fs = require('fs');
        const results = JSON.parse(fs.readFileSync('$results_file', 'utf8'));
        
        const stats = {
            total: results.length,
            passed: results.filter(r => r.status === 'passed').length,
            failed: results.filter(r => r.status === 'failed').length,
            errors: results.filter(r => r.status === 'error').length,
        };
        
        stats.passRate = stats.total > 0 ? (stats.passed / stats.total * 100).toFixed(1) : 0;
        
        console.log(JSON.stringify(stats));
    ")
    
    # 提取統計數據
    local total=$(echo "$analysis" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).total)")
    local passed=$(echo "$analysis" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).passed)")
    local failed=$(echo "$analysis" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).failed)")
    local errors=$(echo "$analysis" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).errors)")
    local pass_rate=$(echo "$analysis" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).passRate)")
    
    # 導出統計變數供後續使用
    export TEST_TOTAL="$total"
    export TEST_PASSED="$passed"
    export TEST_FAILED="$failed"
    export TEST_ERRORS="$errors"
    export TEST_PASS_RATE="$pass_rate"
    
    log_info "測試統計:"
    log_info "  總計: $total"
    log_info "  通過: $passed ($pass_rate%)"
    log_info "  失敗: $failed"
    log_info "  錯誤: $errors"
    
    # 判斷是否應該失敗 CI
    if [[ "$FAIL_ON_VISUAL_DIFF" == "true" && ($failed -gt 0 || $errors -gt 0) ]]; then
        export CI_SHOULD_FAIL=true
        log_error "檢測到視覺差異或錯誤，CI 將失敗"
    else
        export CI_SHOULD_FAIL=false
        log_success "測試結果分析完成"
    fi
}

# 上傳測試產出
upload_artifacts() {
    if [[ "$UPLOAD_ARTIFACTS" != "true" ]]; then
        return 0
    fi
    
    log_info "準備上傳測試產出..."
    
    # 創建產出壓縮檔
    local artifact_name="visual-test-artifacts-$(date +%Y%m%d-%H%M%S)"
    local artifact_path="$RESULTS_DIR/$artifact_name.tar.gz"
    
    cd "$VISUAL_TESTS_DIR"
    tar -czf "$artifact_path" \
        results/reports/ \
        results/diffs/ \
        results/received/ \
        --exclude="*.log" \
        2>/dev/null || true
    
    # 根據 CI 提供者上傳產出
    case "$CI_PROVIDER" in
        "GitHub Actions")
            if [[ -n "$GITHUB_ACTIONS" ]]; then
                echo "::set-output name=artifact-path::$artifact_path"
                echo "視覺測試產出已準備: $artifact_path"
            fi
            ;;
        "GitLab CI")
            # GitLab CI 使用 artifacts 配置自動收集
            echo "視覺測試產出位置: $RESULTS_DIR"
            ;;
        *)
            log_info "視覺測試產出位置: $artifact_path"
            ;;
    esac
    
    log_success "測試產出準備完成"
}

# 發送通知
send_notifications() {
    local notification_level="${NOTIFICATION_LEVEL:-failures}"
    
    if [[ "$notification_level" == "none" ]]; then
        return 0
    fi
    
    if [[ "$notification_level" == "failures" && "$CI_SHOULD_FAIL" != "true" ]]; then
        return 0
    fi
    
    local status_emoji=""
    local status_text=""
    local color=""
    
    if [[ "$CI_SHOULD_FAIL" == "true" ]]; then
        status_emoji="❌"
        status_text="失敗"
        color="danger"
    else
        status_emoji="✅"
        status_text="成功"
        color="good"
    fi
    
    local message="$status_emoji 視覺回歸測試$status_text
    
分支: $CI_BRANCH
提交: ${CI_COMMIT_SHA:0:8}
總測試數: $TEST_TOTAL
通過率: $TEST_PASS_RATE%
失敗: $TEST_FAILED
錯誤: $TEST_ERRORS"
    
    if [[ -n "$CI_BUILD_URL" ]]; then
        message="$message
        
查看詳情: $CI_BUILD_URL"
    fi
    
    # 發送 Slack 通知
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        send_slack_notification "$message" "$color"
    fi
    
    # 發送 Teams 通知
    if [[ -n "$TEAMS_WEBHOOK_URL" ]]; then
        send_teams_notification "$message" "$color"
    fi
}

# 發送 Slack 通知
send_slack_notification() {
    local message="$1"
    local color="$2"
    
    log_info "發送 Slack 通知..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"text\": \"$message\",
                \"footer\": \"視覺回歸測試\",
                \"ts\": $(date +%s)
            }]
        }" \
        "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || log_warning "Slack 通知發送失敗"
}

# 發送 Teams 通知
send_teams_notification() {
    local message="$1"
    local color="$2"
    
    log_info "發送 Teams 通知..."
    
    local theme_color=""
    case "$color" in
        "good") theme_color="00FF00" ;;
        "danger") theme_color="FF0000" ;;
        *) theme_color="0078D4" ;;
    esac
    
    curl -X POST -H 'Content-Type: application/json' \
        --data "{
            \"@type\": \"MessageCard\",
            \"@context\": \"http://schema.org/extensions\",
            \"themeColor\": \"$theme_color\",
            \"summary\": \"視覺回歸測試結果\",
            \"sections\": [{
                \"activityTitle\": \"視覺回歸測試結果\",
                \"text\": \"$message\"
            }]
        }" \
        "$TEAMS_WEBHOOK_URL" > /dev/null 2>&1 || log_warning "Teams 通知發送失敗"
}

# 設定 GitHub Actions 輸出
set_github_outputs() {
    if [[ -n "$GITHUB_ACTIONS" ]]; then
        echo "test-total=$TEST_TOTAL" >> "$GITHUB_OUTPUT"
        echo "test-passed=$TEST_PASSED" >> "$GITHUB_OUTPUT"
        echo "test-failed=$TEST_FAILED" >> "$GITHUB_OUTPUT"
        echo "test-errors=$TEST_ERRORS" >> "$GITHUB_OUTPUT"
        echo "test-pass-rate=$TEST_PASS_RATE" >> "$GITHUB_OUTPUT"
        echo "ci-should-fail=$CI_SHOULD_FAIL" >> "$GITHUB_OUTPUT"
    fi
}

# 清理函數
cleanup() {
    log_info "清理 CI 資源..."
    
    # 停止背景程序
    jobs -p | xargs -r kill 2>/dev/null || true
    
    # 清理臨時文件
    rm -f /tmp/visual-test-* 2>/dev/null || true
    
    log_success "清理完成"
}

# 主要執行函數
main() {
    # 設定清理陷阱
    trap cleanup EXIT INT TERM
    
    # 解析參數
    parse_arguments "$@"
    
    # 檢測 CI 環境
    detect_ci_environment
    
    # 準備 CI 環境
    prepare_ci_environment
    
    # 安裝依賴
    install_dependencies
    
    # 獲取變更的元件 (PR 模式)
    get_changed_components
    
    # 記錄開始時間
    START_TIME=$(date +%s)
    
    log_info "開始 CI 視覺測試流程"
    log_info "平台: $PLATFORM"
    log_info "並行任務: $PARALLEL_JOBS"
    log_info "重試次數: $RETRY_COUNT"
    
    # 執行視覺測試
    if ! run_visual_tests; then
        export CI_SHOULD_FAIL=true
        log_error "視覺測試執行失敗"
    else
        # 分析測試結果
        analyze_results
    fi
    
    # 上傳測試產出
    upload_artifacts
    
    # 設定 GitHub Actions 輸出
    set_github_outputs
    
    # 發送通知
    send_notifications
    
    # 計算執行時間
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    # 最終結果
    echo ""
    log_info "CI 視覺測試流程完成"
    log_info "執行時間: ${DURATION}s"
    
    if [[ "$CI_SHOULD_FAIL" == "true" ]]; then
        log_error "CI 流程失敗"
        exit 1
    else
        log_success "CI 流程成功"
    fi
}

# 執行主函數
main "$@"