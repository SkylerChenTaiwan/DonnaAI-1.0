#!/bin/bash

# Firebase 認證系統互動測試執行腳本
# 執行所有認證相關的互動測試並生成報告

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 項目信息
PROJECT_NAME="DonnaAI Firebase 認證互動測試"
VERSION="1.0.0"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}🔥 $PROJECT_NAME${NC}"
echo -e "${BLUE}📅 執行時間: $DATE${NC}"
echo -e "${BLUE}🔧 版本: $VERSION${NC}"
echo ""

# 檢查必要工具
check_dependencies() {
    echo -e "${YELLOW}🔍 檢查相依性...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安裝${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安裝${NC}"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 找不到 package.json${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 相依性檢查完成${NC}"
}

# 安裝測試相依性
install_dependencies() {
    echo -e "${YELLOW}📦 安裝測試相依性...${NC}"
    
    # 檢查是否需要安裝測試套件
    if ! npm list --depth=0 @testing-library/react-native &> /dev/null; then
        echo -e "${CYAN}Installing testing dependencies...${NC}"
        npm install --save-dev \
            @testing-library/react-native \
            @testing-library/jest-native \
            jest-html-reporters \
            jest-junit \
            react-test-renderer
    fi
    
    echo -e "${GREEN}✅ 相依性安裝完成${NC}"
}

# 清理舊的測試結果
cleanup_old_results() {
    echo -e "${YELLOW}🧹 清理舊的測試結果...${NC}"
    
    rm -rf coverage/interaction
    rm -rf coverage/html-report
    rm -rf junit-interaction.xml
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 執行單元測試
run_unit_tests() {
    echo -e "${YELLOW}🧪 執行 Firebase 認證服務單元測試...${NC}"
    
    npx jest \
        --config=jest.config.interaction.js \
        --testPathPattern="src/tests/services/firebase/auth.interaction.test.ts" \
        --coverage \
        --verbose \
        --no-cache
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 單元測試通過${NC}"
    else
        echo -e "${RED}❌ 單元測試失敗 (退出碼: $exit_code)${NC}"
        return $exit_code
    fi
}

# 執行組件測試
run_component_tests() {
    echo -e "${YELLOW}🎭 執行認證畫面組件測試...${NC}"
    
    npx jest \
        --config=jest.config.interaction.js \
        --testPathPattern="src/tests/screens/auth/" \
        --coverage \
        --verbose \
        --no-cache
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 組件測試通過${NC}"
    else
        echo -e "${RED}❌ 組件測試失敗 (退出碼: $exit_code)${NC}"
        return $exit_code
    fi
}

# 執行狀態管理測試
run_store_tests() {
    echo -e "${YELLOW}🏪 執行認證狀態管理測試...${NC}"
    
    npx jest \
        --config=jest.config.interaction.js \
        --testPathPattern="src/tests/stores/authStore.interaction.test.ts" \
        --coverage \
        --verbose \
        --no-cache
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 狀態管理測試通過${NC}"
    else
        echo -e "${RED}❌ 狀態管理測試失敗 (退出碼: $exit_code)${NC}"
        return $exit_code
    fi
}

# 執行整合測試
run_integration_tests() {
    echo -e "${YELLOW}🔗 執行整合測試...${NC}"
    
    npx jest \
        --config=jest.config.interaction.js \
        --testPathPattern="interaction.test" \
        --coverage \
        --verbose \
        --no-cache \
        --runInBand
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 整合測試通過${NC}"
    else
        echo -e "${RED}❌ 整合測試失敗 (退出碼: $exit_code)${NC}"
        return $exit_code
    fi
}

# 執行 E2E 測試 (可選)
run_e2e_tests() {
    echo -e "${YELLOW}🎯 執行端到端測試...${NC}"
    
    if command -v detox &> /dev/null && [ -f ".detoxrc.json" ]; then
        echo -e "${CYAN}Running Detox E2E tests...${NC}"
        
        # iOS 模擬器測試
        if [[ "$OSTYPE" == "darwin"* ]]; then
            detox build --configuration ios.sim.debug
            detox test --configuration ios.sim.debug --cleanup e2e/auth.e2e.js
        fi
        
        # Android 模擬器測試
        if command -v adb &> /dev/null; then
            detox build --configuration android.emu.debug
            detox test --configuration android.emu.debug --cleanup e2e/auth.e2e.js
        fi
        
        echo -e "${GREEN}✅ E2E 測試完成${NC}"
    else
        echo -e "${YELLOW}⚠️  跳過 E2E 測試 (Detox 未配置)${NC}"
    fi
}

# 生成測試報告
generate_reports() {
    echo -e "${YELLOW}📊 生成測試報告...${NC}"
    
    # 創建報告目錄
    mkdir -p docs/tests/reports
    
    # 複製覆蓋率報告
    if [ -d "coverage/interaction" ]; then
        cp -r coverage/interaction/* docs/tests/reports/
        echo -e "${GREEN}✅ 覆蓋率報告已複製到 docs/tests/reports/${NC}"
    fi
    
    # 生成測試摘要
    cat > docs/tests/reports/test-summary.md << EOF
# Firebase 認證互動測試摘要

**執行時間**: $DATE
**測試版本**: $VERSION

## 測試結果

### 單元測試
- 測試文件: src/tests/services/firebase/auth.interaction.test.ts
- 狀態: 查看詳細報告

### 組件測試
- 測試文件: 
  - src/tests/screens/auth/LoginScreen.interaction.test.tsx
  - src/tests/screens/auth/RegisterScreen.interaction.test.tsx
- 狀態: 查看詳細報告

### 狀態管理測試
- 測試文件: src/tests/stores/authStore.interaction.test.ts
- 狀態: 查看詳細報告

### 測試覆蓋率
- 詳細覆蓋率報告: [查看 HTML 報告](./lcov-report/index.html)
- JUnit 報告: junit-interaction.xml

## 測試命令

\`\`\`bash
# 執行所有互動測試
npm run test:auth:interaction

# 執行特定測試文件
npx jest --config=jest.config.interaction.js src/tests/services/firebase/auth.interaction.test.ts

# 執行測試並生成覆蓋率報告
npx jest --config=jest.config.interaction.js --coverage
\`\`\`

## 下一步

1. 檢查測試覆蓋率報告
2. 修復任何失敗的測試
3. 根據報告改進代碼質量
4. 定期執行測試以確保功能穩定性
EOF
    
    echo -e "${GREEN}✅ 測試摘要已生成${NC}"
}

# 顯示測試結果
display_results() {
    echo ""
    echo -e "${BLUE}📋 測試執行完成${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ -f "coverage/interaction/lcov-report/index.html" ]; then
        echo -e "${GREEN}📊 覆蓋率報告: coverage/interaction/lcov-report/index.html${NC}"
    fi
    
    if [ -f "coverage/interaction/html-report/interaction-test-report.html" ]; then
        echo -e "${GREEN}📋 詳細測試報告: coverage/interaction/html-report/interaction-test-report.html${NC}"
    fi
    
    if [ -f "docs/tests/reports/test-summary.md" ]; then
        echo -e "${GREEN}📝 測試摘要: docs/tests/reports/test-summary.md${NC}"
    fi
    
    echo ""
    echo -e "${PURPLE}🚀 建議的後續步驟:${NC}"
    echo -e "${CYAN}   1. 檢查覆蓋率報告並改進測試覆蓋${NC}"
    echo -e "${CYAN}   2. 修復任何發現的問題${NC}"
    echo -e "${CYAN}   3. 將測試集成到 CI/CD 流程${NC}"
    echo -e "${CYAN}   4. 定期執行測試確保代碼品質${NC}"
}

# 錯誤處理
handle_error() {
    local exit_code=$1
    echo ""
    echo -e "${RED}❌ 測試執行失敗 (退出碼: $exit_code)${NC}"
    echo -e "${YELLOW}🔍 請檢查上述錯誤訊息並修復問題後重新執行${NC}"
    exit $exit_code
}

# 主執行流程
main() {
    echo -e "${BLUE}🚀 開始 Firebase 認證互動測試...${NC}"
    echo ""
    
    # 檢查相依性
    check_dependencies || handle_error $?
    
    # 安裝測試相依性
    install_dependencies || handle_error $?
    
    # 清理舊結果
    cleanup_old_results || handle_error $?
    
    # 執行測試
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}🧪 開始執行測試套件${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # 逐步執行測試
    run_unit_tests || handle_error $?
    echo ""
    
    run_component_tests || handle_error $?
    echo ""
    
    run_store_tests || handle_error $?
    echo ""
    
    run_integration_tests || handle_error $?
    echo ""
    
    # E2E 測試 (可選，錯誤不會中斷流程)
    run_e2e_tests || echo -e "${YELLOW}⚠️  E2E 測試遇到問題，但不影響整體結果${NC}"
    echo ""
    
    # 生成報告
    generate_reports || handle_error $?
    
    # 顯示結果
    display_results
    
    echo -e "${GREEN}🎉 Firebase 認證互動測試執行完成！${NC}"
}

# 執行主流程
main "$@"