# 新功能開發流程 v2.0 (整合 Contains Studio Agents)

## 觸發方式
- **關鍵字**: `/開發`
- **自動執行**: 此工作流程
- **使用 Agents**: spec-writer, sprint-prioritizer, risk-assessor, studio-producer, backend-architect, ai-engineer, test-writer-fixer, code-reviewer, project-shipper

## 📋 Phase 1: 需求分析與規劃階段

### 步驟 1: 啟動 spec-writer Agent
```
功能規格撰寫：
- 分析功能需求和目標用戶
- 撰寫詳細的技術規格文件
- 定義 API 介面和資料結構
- 建立驗收標準和測試計劃
```

### 步驟 2: 啟動 sprint-prioritizer Agent
```
開發優先順序規劃：
- 將功能分解為可執行的任務
- 評估每個任務的複雜度和依賴關係
- 制定 6 天開發週期的執行計劃
- 識別關鍵路徑和風險點
```

### 步驟 3: 啟動 risk-assessor Agent
```
風險評估和緩解策略：
- 識別技術風險、時程風險、品質風險
- 分析第三方依賴和相容性問題
- 制定風險緩解計劃
- 建立應急方案
```

### 步驟 4: 啟動 studio-producer Agent
```
專案資源協調：
- 確認開發資源和時間配置
- 協調跨團隊依賴
- 建立里程碑檢查點
- 制定溝通和回報機制
```

## 🔧 Phase 2: 技術架構與設計階段

### 步驟 5: 啟動 backend-architect Agent
```
後端架構設計：
- 設計系統架構和資料流
- 選擇合適的技術棧和框架
- 設計 API 端點和資料庫結構
- 規劃效能和擴展性策略
```

### 步驟 6: 啟動 ai-engineer Agent (如適用)
```
AI/ML 功能整合：
- 評估 AI 功能需求和可行性
- 設計 AI 模型整合方案
- 規劃資料處理和訓練流程
- 建立 AI 服務的監控和評估機制
```

## 💻 Phase 3: 開發實作階段

### 步驟 7: 執行開發任務
```
根據 Phase 1-2 的規劃執行開發：
1. 按優先順序實作功能
2. 遵循架構設計和編碼標準
3. 實施持續整合和測試
4. 定期檢查進度和品質
```

### 步驟 8: 啟動 test-writer-fixer Agent
```
測試撰寫和維護：
- 撰寫單元測試和整合測試
- 建立端對端測試場景
- 實作測試自動化
- 修復測試失敗和維護測試套件
```

## 🔍 Phase 4: 品質檢查與優化階段

### 步驟 9: 啟動 code-reviewer Agent
```
程式碼審查和品質檢查：
- 檢查程式碼品質和最佳實踐
- 驗證架構設計的實作
- 識別效能瓶頸和安全問題
- 確保程式碼可維護性
```

### 步驟 10: 品質優化迭代
```
根據 Agent 建議優化：
1. 修復 Critical 問題
2. 優化效能和使用者體驗
3. 完善錯誤處理和邊界情況
4. 更新文件和註釋
```

## 🚀 Phase 5: 發布與部署階段

### 步驟 11: 啟動 project-shipper Agent
```
產品發布準備：
- 驗證所有功能完整性
- 準備發布說明和使用者文件
- 制定部署計劃和回滾策略
- 建立監控和警報機制
```

### 步驟 12: 最終驗證和發布
```
發布前檢查：
1. 執行完整測試套件
2. 進行使用者驗收測試
3. 檢查系統效能和穩定性
4. 執行部署並監控結果
```

## 📊 Agent 協作模式

### 平行執行階段
- **Phase 1**: spec-writer → sprint-prioritizer → risk-assessor → studio-producer
- **Phase 2**: backend-architect + ai-engineer (同時進行)
- **Phase 4**: code-reviewer + test-writer-fixer (互相配合)

### 序列執行階段
- **Phase 3**: 純開發階段（基於前面的規劃）
- **Phase 5**: project-shipper (最後驗證)

## 📋 輸出文件結構

### 自動生成文件
```
/docs/features/[feature-name]/
├── specification.md          # spec-writer 輸出
├── development-plan.md       # sprint-prioritizer 輸出  
├── risk-assessment.md        # risk-assessor 輸出
├── architecture-design.md    # backend-architect 輸出
├── ai-integration.md         # ai-engineer 輸出（如適用）
├── test-plan.md             # test-writer-fixer 輸出
├── code-review-report.md    # code-reviewer 輸出
├── release-checklist.md     # project-shipper 輸出
└── progress-tracking.md     # studio-producer 輸出
```

### 每日進度更新
```
/docs/progress/[feature-name]/
├── day1-planning.md
├── day2-architecture.md
├── day3-development.md
├── day4-development.md
├── day5-testing-optimization.md
└── day6-release.md
```

## ⚠️ 品質閥門

### Phase 1 完成標準
- [ ] 功能規格獲得 Product Owner 確認
- [ ] 開發計劃通過技術評審
- [ ] 所有 Critical 風險都有緩解方案
- [ ] 資源和時程得到確認

### Phase 2 完成標準
- [ ] 架構設計通過技術審查
- [ ] API 設計與前端團隊對齊
- [ ] 資料庫設計通過 DBA 審核
- [ ] 效能目標明確定義

### Phase 3 完成標準
- [ ] 所有功能開發完成
- [ ] 基本測試通過
- [ ] 程式碼符合團隊標準
- [ ] 文件更新完成

### Phase 4 完成標準
- [ ] 所有 Agent 建議的 Critical 問題已解決
- [ ] 測試覆蓋率 > 80%
- [ ] 效能測試通過
- [ ] 安全檢查通過

### Phase 5 完成標準
- [ ] 使用者驗收測試通過
- [ ] 發布文件完整
- [ ] 監控和警報設置完成
- [ ] 回滾計劃測試完成

## 🔄 迭代和回饋機制

### 每日檢查點
```
每天結束前檢查：
1. 當日目標完成度
2. 遇到的阻礙和解決方案  
3. 明日優先任務
4. 需要的支援或協調
```

### 里程碑檢查
```
Phase 完成後檢查：
1. 階段目標達成情況
2. Agent 建議實施狀況
3. 品質指標達成情況
4. 風險狀態更新
```

## 🚨 緊急情況處理

### Critical 問題處理流程
```
發現 Critical 問題時：
1. 立即停止當前開發
2. 組織緊急技術評估
3. 制定快速修復方案
4. 重新評估時程和範圍
5. 更新風險評估和緩解策略
```

### 時程壓力處理
```
時程緊張時的優先級：
1. 核心功能 > 附加功能
2. 功能完整性 > 效能優化
3. Critical bug 修復 > 程式碼重構
4. 使用者體驗 > 開發者體驗
```

## 📈 成功指標

### 量化指標
- 功能完成度: 100%
- 測試覆蓋率: > 80%
- Bug 密度: < 1 per KLOC
- 使用者滿意度: > 4.5/5
- 時程達成率: > 90%

### 質化指標
- 程式碼品質和可維護性
- 團隊協作效率
- 技術債務控制
- 學習和改進成果

---

**注意**：此流程會在使用 `/開發` 關鍵字時自動觸發，並整合所有相關的 Contains Studio Agents 進行協作開發。