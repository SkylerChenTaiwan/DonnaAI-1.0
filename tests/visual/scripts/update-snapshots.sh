#!/bin/bash

# 視覺測試快照更新腳本
# 用於更新基準快照圖片

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
SNAPSHOTS_DIR="$VISUAL_TESTS_DIR/snapshots"

# 預設配置
PLATFORM="web"
COMPONENTS=""
STORIES=""
BACKUP=true
FORCE=false
INTERACTIVE=true

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
視覺測試快照更新腳本

使用方式:
    $0 [選項]

選項:
    -h, --help              顯示此幫助資訊
    -p, --platform PLATFORM 指定平台 (web|native|all) [預設: web]
    -c, --components LIST   指定要更新的元件 (逗號分隔)
    -s, --stories LIST      指定要更新的 stories (逗號分隔)
    --no-backup            不備份現有快照
    --force                 強制更新，不詢問確認
    --non-interactive       非互動模式
    --list                  列出現有快照
    --clean                 清理無效的快照
    --restore BACKUP_DIR    從備份還原快照

範例:
    # 更新所有 web 快照
    $0 --platform web

    # 更新特定元件快照
    $0 --components AdaptiveButton,AdaptiveText

    # 強制更新特定 story
    $0 --force --stories "AdaptiveButton--Primary"

    # 列出現有快照
    $0 --list

    # 清理無效快照
    $0 --clean

    # 從備份還原
    $0 --restore ./snapshots-backup-20231201
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
            -c|--components)
                COMPONENTS="$2"
                shift 2
                ;;
            -s|--stories)
                STORIES="$2"
                shift 2
                ;;
            --no-backup)
                BACKUP=false
                shift
                ;;
            --force)
                FORCE=true
                INTERACTIVE=false
                shift
                ;;
            --non-interactive)
                INTERACTIVE=false
                shift
                ;;
            --list)
                list_snapshots
                exit 0
                ;;
            --clean)
                clean_invalid_snapshots
                exit 0
                ;;
            --restore)
                restore_snapshots "$2"
                exit 0
                ;;
            *)
                log_error "未知參數: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 列出現有快照
list_snapshots() {
    log_info "列出現有快照..."
    
    if [[ ! -d "$SNAPSHOTS_DIR" ]]; then
        log_warning "快照目錄不存在: $SNAPSHOTS_DIR"
        return
    fi
    
    echo "快照目錄: $SNAPSHOTS_DIR"
    echo ""
    
    for platform in web native; do
        platform_dir="$SNAPSHOTS_DIR/$platform"
        if [[ -d "$platform_dir" ]]; then
            local count=$(find "$platform_dir" -name "*.png" | wc -l)
            echo "📱 $platform 平台: $count 個快照"
            
            if [[ $count -gt 0 ]]; then
                find "$platform_dir" -name "*.png" | sort | while read -r file; do
                    local basename=$(basename "$file" .png)
                    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
                    local modified=$(stat -f%Sm -t%Y-%m-%d\ %H:%M:%S "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | cut -d. -f1)
                    printf "  • %-50s %8s bytes  %s\n" "$basename" "$size" "$modified"
                done
            fi
            echo ""
        fi
    done
}

# 備份現有快照
backup_snapshots() {
    if [[ "$BACKUP" == "false" ]]; then
        return 0
    fi
    
    if [[ ! -d "$SNAPSHOTS_DIR" ]]; then
        log_info "沒有現有快照需要備份"
        return 0
    fi
    
    local backup_dir="${SNAPSHOTS_DIR}-backup-$(date +%Y%m%d-%H%M%S)"
    log_info "備份現有快照到: $backup_dir"
    
    cp -r "$SNAPSHOTS_DIR" "$backup_dir"
    
    log_success "快照備份完成"
    echo "備份位置: $backup_dir"
    echo "如需還原，請執行: $0 --restore \"$backup_dir\""
}

# 從備份還原快照
restore_snapshots() {
    local backup_dir="$1"
    
    if [[ -z "$backup_dir" ]]; then
        log_error "請指定備份目錄"
        exit 1
    fi
    
    if [[ ! -d "$backup_dir" ]]; then
        log_error "備份目錄不存在: $backup_dir"
        exit 1
    fi
    
    log_info "從備份還原快照..."
    log_info "備份來源: $backup_dir"
    log_info "還原目標: $SNAPSHOTS_DIR"
    
    if [[ "$INTERACTIVE" == "true" ]]; then
        echo -n "確定要還原快照嗎？這將覆蓋現有的快照 (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "取消還原操作"
            exit 0
        fi
    fi
    
    # 備份當前快照
    if [[ -d "$SNAPSHOTS_DIR" ]]; then
        local current_backup="${SNAPSHOTS_DIR}-current-backup-$(date +%Y%m%d-%H%M%S)"
        log_info "備份當前快照到: $current_backup"
        cp -r "$SNAPSHOTS_DIR" "$current_backup"
    fi
    
    # 還原快照
    rm -rf "$SNAPSHOTS_DIR"
    cp -r "$backup_dir" "$SNAPSHOTS_DIR"
    
    log_success "快照還原完成"
}

# 清理無效快照
clean_invalid_snapshots() {
    log_info "清理無效的快照..."
    
    if [[ ! -d "$SNAPSHOTS_DIR" ]]; then
        log_warning "快照目錄不存在"
        return
    fi
    
    local cleaned=0
    
    # 尋找並清理空的快照文件
    find "$SNAPSHOTS_DIR" -name "*.png" -size 0 | while read -r file; do
        log_warning "刪除空快照: $(basename "$file")"
        rm "$file"
        ((cleaned++))
    done
    
    # 尋找並清理損壞的 PNG 文件
    find "$SNAPSHOTS_DIR" -name "*.png" | while read -r file; do
        if ! file "$file" | grep -q PNG; then
            log_warning "刪除損壞快照: $(basename "$file")"
            rm "$file"
            ((cleaned++))
        fi
    done
    
    # 清理空目錄
    find "$SNAPSHOTS_DIR" -type d -empty -delete 2>/dev/null || true
    
    log_success "清理完成，共清理 $cleaned 個無效快照"
}

# 確認更新操作
confirm_update() {
    if [[ "$FORCE" == "true" ]]; then
        return 0
    fi
    
    if [[ "$INTERACTIVE" == "false" ]]; then
        return 0
    fi
    
    echo ""
    echo "即將更新視覺測試快照"
    echo "========================="
    echo "平台: $PLATFORM"
    
    if [[ -n "$COMPONENTS" ]]; then
        echo "元件: $COMPONENTS"
    else
        echo "元件: 所有元件"
    fi
    
    if [[ -n "$STORIES" ]]; then
        echo "Stories: $STORIES"
    else
        echo "Stories: 所有 Stories"
    fi
    
    echo "備份現有快照: $BACKUP"
    echo "========================="
    echo ""
    
    echo -n "確定要繼續嗎？(y/N): "
    read -r response
    
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log_info "取消更新操作"
        exit 0
    fi
}

# 更新 Web 平台快照
update_web_snapshots() {
    log_info "更新 Web 平台快照..."
    
    # 使用現有的測試腳本，加上 --update 參數
    local cmd="$VISUAL_TESTS_DIR/scripts/run-visual-tests.sh"
    cmd="$cmd --platform web --update"
    
    if [[ -n "$COMPONENTS" ]]; then
        cmd="$cmd --components \"$COMPONENTS\""
    fi
    
    if [[ -n "$STORIES" ]]; then
        cmd="$cmd --stories \"$STORIES\""
    fi
    
    if eval "$cmd"; then
        log_success "Web 平台快照更新完成"
        return 0
    else
        log_error "Web 平台快照更新失敗"
        return 1
    fi
}

# 更新 Native 平台快照
update_native_snapshots() {
    log_info "更新 Native 平台快照..."
    
    # 使用現有的測試腳本，加上 --update 參數
    local cmd="$VISUAL_TESTS_DIR/scripts/run-visual-tests.sh"
    cmd="$cmd --platform native --update"
    
    if [[ -n "$COMPONENTS" ]]; then
        cmd="$cmd --components \"$COMPONENTS\""
    fi
    
    if [[ -n "$STORIES" ]]; then
        cmd="$cmd --stories \"$STORIES\""
    fi
    
    if eval "$cmd"; then
        log_success "Native 平台快照更新完成"
        return 0
    else
        log_error "Native 平台快照更新失敗"
        return 1
    fi
}

# 顯示更新摘要
show_update_summary() {
    log_info "快照更新摘要"
    echo "=================================="
    
    # 統計快照數量
    for platform in web native; do
        platform_dir="$SNAPSHOTS_DIR/$platform"
        if [[ -d "$platform_dir" ]]; then
            local count=$(find "$platform_dir" -name "*.png" | wc -l)
            echo "$platform 平台: $count 個快照"
        fi
    done
    
    echo "=================================="
}

# 驗證更新結果
validate_snapshots() {
    log_info "驗證更新的快照..."
    
    local errors=0
    
    for platform in web native; do
        platform_dir="$SNAPSHOTS_DIR/$platform"
        if [[ ! -d "$platform_dir" ]]; then
            continue
        fi
        
        find "$platform_dir" -name "*.png" | while read -r file; do
            # 檢查文件大小
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
            if [[ $size -eq 0 ]]; then
                log_error "空快照文件: $(basename "$file")"
                ((errors++))
            fi
            
            # 檢查 PNG 格式
            if ! file "$file" | grep -q PNG; then
                log_error "無效 PNG 文件: $(basename "$file")"
                ((errors++))
            fi
        done
    done
    
    if [[ $errors -eq 0 ]]; then
        log_success "快照驗證通過"
        return 0
    else
        log_error "發現 $errors 個問題"
        return 1
    fi
}

# 主要執行函數
main() {
    # 解析參數
    parse_arguments "$@"
    
    # 確認更新操作
    confirm_update
    
    # 備份現有快照
    backup_snapshots
    
    # 記錄開始時間
    START_TIME=$(date +%s)
    
    local success=true
    
    # 根據平台更新快照
    case "$PLATFORM" in
        web)
            update_web_snapshots || success=false
            ;;
        native)
            update_native_snapshots || success=false
            ;;
        all)
            update_web_snapshots || success=false
            update_native_snapshots || success=false
            ;;
        *)
            log_error "不支援的平台: $PLATFORM"
            exit 1
            ;;
    esac
    
    # 驗證結果
    validate_snapshots
    
    # 顯示摘要
    show_update_summary
    
    # 計算執行時間
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo ""
    log_info "快照更新完成"
    log_info "執行時間: ${DURATION}s"
    
    if [[ "$success" == "false" ]]; then
        log_error "快照更新失敗"
        exit 1
    else
        log_success "快照更新成功"
        
        # 提示後續操作
        echo ""
        log_info "後續建議:"
        echo "1. 執行測試驗證新快照: $VISUAL_TESTS_DIR/scripts/run-visual-tests.sh"
        echo "2. 檢查並提交變更到版本控制"
        
        if [[ "$BACKUP" == "true" ]]; then
            echo "3. 如有問題，可使用備份還原快照"
        fi
    fi
}

# 執行主函數
main "$@"