# Contains Studio Agents 工作流程定義

## 錯誤處理工作流程

### 觸發條件
- 使用者輸入 `/錯誤`
- 偵測到編譯錯誤
- 測試失敗
- 執行時期錯誤

### 執行步驟

#### 1. 初始分析 (test-results-analyzer)
```yaml
agent: test-results-analyzer
輸入:
  - 錯誤訊息
  - 測試輸出
  - 相關檔案路徑
輸出:
  - 錯誤分類報告
  - 影響範圍評估
  - 初步建議
```

#### 2. 深入追蹤 (bug-hunter) - 條件觸發
```yaml
agent: bug-hunter
觸發條件: 需要找出問題引入的時間點
輸入:
  - 錯誤特徵
  - 可能的時間範圍
輸出:
  - 引入問題的 commit
  - 相關變更內容
  - 影響分析
```

#### 3. 修復執行 (test-writer-fixer)
```yaml
agent: test-writer-fixer
輸入:
  - 錯誤分析報告
  - 需要修復的檔案
  - 測試失敗詳情
輸出:
  - 修復後的程式碼
  - 更新的測試
  - 修復說明
```

#### 4. 品質審查 (code-reviewer)
```yaml
agent: code-reviewer
輸入:
  - 修復的程式碼變更
  - 原始問題描述
輸出:
  - 審查意見
  - 改進建議
  - 核准/拒絕決定
```

#### 5. 流程優化 (workflow-optimizer)
```yaml
agent: workflow-optimizer
輸入:
  - 整個修復過程
  - 花費時間統計
輸出:
  - 流程改進建議
  - 自動化機會
  - 預防措施
```

### 實際執行範例

```markdown
使用者：TypeScript 編譯錯誤，請幫我分析
助理：我會協調相關 agents 來處理這個問題。

## 🔍 test-results-analyzer 分析中...
發現 3 個型別錯誤：
- src/components/Dashboard.tsx: 介面不匹配
- src/services/api.ts: 返回型別錯誤  
- src/utils/helpers.ts: 參數型別錯誤

影響範圍：會影響整個應用程式的建置

## 🕵️ bug-hunter 追蹤中...
找到問題來源：
- Commit: abc123 "更新 API 介面定義"
- 作者：開發者 A
- 時間：2 小時前
- 變更：修改了共用的型別定義檔案

## 🔧 test-writer-fixer 修復中...
正在修復 3 個檔案：
1. 更新 Dashboard.tsx 的 props 型別
2. 修正 api.ts 的返回型別定義
3. 調整 helpers.ts 的參數型別

測試結果：所有測試通過 ✅

## 👀 code-reviewer 審查中...
審查通過，修復符合 TypeScript 最佳實踐
建議：考慮增加更嚴格的型別檢查規則

## 📊 workflow-optimizer 建議：
1. 在 pre-commit hook 加入型別檢查
2. CI 管道加入更嚴格的編譯選項
3. 考慮使用 strict mode
```

## PRP 管理工作流程

### 觸發條件
- 建立新的 PRP 檔案
- 使用者輸入 `/開發` 或 `/PRP`
- 開始新功能開發

### 執行階段

#### 規劃階段 (Day 1-2)

##### 1. 優先級規劃 (sprint-prioritizer)
```yaml
agent: sprint-prioritizer
輸入:
  - PRP 目標描述
  - 可用時間（6天）
  - 現有任務清單
輸出:
  - 任務優先級排序
  - 每日計劃
  - 關鍵里程碑
```

##### 2. 規格撰寫 (spec-writer)
```yaml
agent: spec-writer
輸入:
  - 功能需求
  - 技術限制
  - 使用者故事
輸出:
  - 詳細技術規格
  - API 設計
  - 資料模型
  - 驗收條件
```

##### 3. 風險評估 (risk-assessor)
```yaml
agent: risk-assessor
輸入:
  - 技術規格
  - 依賴關係
  - 時程限制
輸出:
  - 風險矩陣
  - 緩解策略
  - 應急計劃
```

#### 執行階段 (Day 3-5)

##### 4. 專案協調 (studio-producer)
```yaml
agent: studio-producer
輸入:
  - 開發計劃
  - 團隊資源
  - 依賴關係
輸出:
  - 每日進度更新
  - 障礙排除
  - 資源調配
```

##### 5. 程式碼管理 (code-shipper)
```yaml
agent: code-shipper
輸入:
  - 功能分支
  - 程式碼變更
  - 測試結果
輸出:
  - 合併策略
  - 版本標籤
  - 部署準備
```

#### 發布階段 (Day 6)

##### 6. 發布管理 (project-shipper)
```yaml
agent: project-shipper
輸入:
  - 完成的功能
  - 測試報告
  - 部署計劃
輸出:
  - 發布檢查清單
  - 部署腳本
  - 回滾計劃
  - 監控設定
```

### 實際執行範例

```markdown
使用者：我要開發使用者通知系統
助理：啟動 PRP 工作流程，協調相關 agents。

## 📅 Day 1-2: 規劃階段

### sprint-prioritizer 制定計劃：
優先級排序：
1. 高：通知資料模型設計
2. 高：即時通知 API
3. 中：通知偏好設定
4. 低：通知歷史記錄

6天計劃：
- Day 1-2：規劃和設計
- Day 3：實作核心 API
- Day 4：前端整合
- Day 5：測試和優化
- Day 6：部署準備

### spec-writer 技術規格：
```typescript
// 通知資料模型
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// API 端點
POST /api/notifications - 建立通知
GET /api/notifications - 取得通知列表
PATCH /api/notifications/:id - 標記已讀
```

### risk-assessor 風險評估：
- 技術風險：中 - WebSocket 連線管理
- 時程風險：低 - 時間充足
- 整合風險：中 - 需要更新多個前端元件

緩解措施：
- 先實作輪詢，再升級到 WebSocket
- 準備 fallback 機制

## 🚀 Day 3-5: 執行階段

### studio-producer 協調進度：
Day 3 ✅：
- 完成資料模型
- 實作基本 API
- 單元測試通過

Day 4 🔄：
- 前端元件開發中
- 遇到樣式問題，已解決
- 整合測試進行中

### code-shipper 管理分支：
- Feature branch: feature/user-notifications
- 3 個 PR 已合併到開發分支
- 程式碼覆蓋率：85%

## 🎯 Day 6: 發布準備

### project-shipper 發布檢查：
✅ 所有測試通過
✅ 文件更新完成
✅ 資料庫遷移準備好
✅ 監控告警設定
✅ 回滾計劃就緒

部署步驟：
1. 執行資料庫遷移
2. 部署後端服務
3. 更新前端應用
4. 驗證功能正常
5. 監控系統狀態
```

## Agents 協作規則

### 1. 資訊傳遞
- 每個 agent 的輸出成為下一個 agent 的輸入
- 使用結構化格式（YAML/JSON）傳遞資料
- 保留完整的上下文資訊

### 2. 決策權限
- 每個 agent 在其專業領域有決策權
- 重大決策需要使用者確認
- 衝突由使用者裁決

### 3. 平行執行
- 可以同時執行的 agents：
  - spec-writer + risk-assessor
  - 多個 code-reviewer（不同模組）
  - test-writer-fixer + performance-optimizer

### 4. 失敗處理
- 任何 agent 失敗不影響其他 agent
- 提供失敗原因和建議
- 可以手動重試或跳過

## 最佳實踐

### 1. 明確的任務描述
- 提供充足的上下文
- 說明期望的結果
- 指出任何限制條件

### 2. 適時的人工介入
- 在關鍵決策點暫停
- 審查 agent 的建議
- 提供額外指導

### 3. 持續改進
- 記錄每次執行的結果
- 分析成功和失敗案例
- 優化 agent 組合和流程

### 4. 文件追蹤
- 所有 agent 輸出都保存到相應目錄
- 錯誤報告：/docs/error-reports/
- PRP 計劃：/docs/plans/
- 測試報告：/docs/test-reports/