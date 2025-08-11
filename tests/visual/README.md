# 視覺回歸測試框架

## 概述

本框架提供跨平台 Adaptive Components 的視覺回歸測試，確保元件在不同平台上的一致性和穩定性。

## 目錄結構

```
tests/visual/
├── README.md                 # 本文件
├── config/                   # 配置文件
│   ├── jest.config.js       # Jest 配置
│   ├── puppeteer.config.js  # Puppeteer 配置
│   └── storybook.config.js  # Storybook 配置
├── stories/                  # Storybook stories
│   ├── AdaptiveView.stories.tsx
│   ├── AdaptiveText.stories.tsx
│   ├── AdaptiveButton.stories.tsx
│   ├── AdaptiveInput.stories.tsx
│   ├── AdaptiveSelect.stories.tsx
│   ├── AdaptiveImage.stories.tsx
│   └── AdaptiveModal.stories.tsx
├── snapshots/               # 基準截圖
│   ├── web/                # Web 平台截圖
│   └── native/             # Native 平台截圖
├── utils/                  # 測試工具
│   ├── screenshot.ts       # 截圖工具
│   ├── compare.ts          # 圖片比較工具
│   └── reporter.ts         # 測試報告生成器
├── scripts/                # 執行腳本
│   ├── run-visual-tests.sh # 執行視覺測試
│   ├── update-snapshots.sh # 更新基準截圖
│   └── ci-integration.sh   # CI/CD 整合
└── results/                # 測試結果
    ├── diffs/              # 差異圖片
    └── reports/            # 測試報告
```

## 功能特色

### 🔄 跨平台測試
- **Web 平台**: 使用 Puppeteer 進行瀏覽器截圖
- **Native 平台**: 使用 Detox 進行模擬器截圖
- **一致性檢查**: 比較兩平台渲染差異

### 📸 智能截圖
- **自動化截圖**: 遍歷所有 Storybook stories
- **多狀態捕獲**: hover、focus、disabled 等狀態
- **響應式測試**: 多種螢幕尺寸測試

### 🔍 精確比較
- **像素級比較**: 檢測細微的視覺變化
- **閾值設定**: 可配置的差異容忍度
- **智能遮罩**: 忽略動態內容區域

### 📊 詳細報告
- **視覺化差異**: 高亮顯示變更區域
- **統計數據**: 通過率、失敗率統計
- **歷史追蹤**: 長期變化趨勢分析

## 快速開始

### 1. 安裝依賴
```bash
npm install --save-dev @storybook/react @storybook/addon-essentials
npm install --save-dev puppeteer jest-image-snapshot
npm install --save-dev detox detox-cli
```

### 2. 啟動 Storybook
```bash
npm run storybook
```

### 3. 執行視覺測試
```bash
# 執行所有視覺測試
npm run test:visual

# 僅測試特定元件
npm run test:visual -- --component AdaptiveButton

# 更新基準截圖
npm run test:visual:update
```

### 4. 查看測試報告
```bash
# 開啟測試報告
npm run test:visual:report
```

## 配置選項

### 測試配置 (`config/visual-test.config.js`)
```javascript
module.exports = {
  // 平台設定
  platforms: ['web', 'native'],
  
  // 截圖設定
  screenshot: {
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 },
    omitBackground: false,
  },
  
  // 比較設定
  comparison: {
    threshold: 0.2,            // 差異閾值 (0-1)
    enableAntialiasingCheck: false,
    allowSizeMismatch: false,
  },
  
  // 響應式測試
  viewports: [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ],
};
```

## 最佳實踐

### Story 編寫
1. **完整狀態覆蓋**: 包含所有可能的元件狀態
2. **獨立性**: 每個 story 應該獨立，不依賴外部狀態
3. **一致性**: 使用統一的樣式和佈局

### 截圖管理
1. **基準更新**: 僅在確認變更正確時更新基準
2. **版本控制**: 基準截圖應納入版本控制
3. **清理機制**: 定期清理過期的截圖

### CI/CD 整合
1. **自動化執行**: 每次 PR 自動執行視覺測試
2. **失敗處理**: 視覺測試失敗時阻止合併
3. **報告存檔**: 保存測試報告供後續分析

## 故障排除

### 常見問題

#### 1. 截圖不一致
```bash
# 檢查字體渲染差異
npm run test:visual -- --debug --component AdaptiveText

# 更新字體配置
# 修改 config/visual-test.config.js 中的字體設定
```

#### 2. Native 測試失敗
```bash
# 檢查模擬器狀態
detox test --configuration ios.sim.debug

# 重置模擬器
xcrun simctl erase all
```

#### 3. 性能問題
```bash
# 使用並行測試
npm run test:visual -- --maxWorkers=4

# 僅測試變更的元件
npm run test:visual -- --changedComponents
```

## 命令參考

### 測試命令
- `npm run test:visual` - 執行所有視覺測試
- `npm run test:visual:web` - 僅測試 Web 平台
- `npm run test:visual:native` - 僅測試 Native 平台
- `npm run test:visual:update` - 更新所有基準截圖
- `npm run test:visual:clean` - 清理測試結果

### 開發命令
- `npm run storybook` - 啟動 Storybook 開發服務器
- `npm run storybook:build` - 構建靜態 Storybook
- `npm run test:visual:debug` - 調試模式執行測試

## 貢獻指南

### 新增元件測試
1. 在 `stories/` 目錄建立對應的 `.stories.tsx` 文件
2. 定義所有必要的狀態和變體
3. 執行 `npm run test:visual:update` 生成基準截圖
4. 提交 PR 包含新的 story 和基準截圖

### 更新測試框架
1. 遵循現有的代碼風格和架構
2. 添加適當的測試覆蓋
3. 更新相關文檔
4. 與團隊討論重大變更

---

## 技術支援

如有問題或建議，請：
1. 查看本文件的故障排除章節
2. 搜索現有的 GitHub Issues
3. 建立新的 Issue 並提供詳細資訊
4. 聯繫開發團隊進行討論