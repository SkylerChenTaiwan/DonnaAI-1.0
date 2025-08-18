# PRP 執行流程追蹤器

## 🚨 **為什麼 PRP 執行一直失敗？**

### **根本問題：認知錯誤**
```
❌ 錯誤認知：PRP = 需求文件 + 直接編碼
✅ 正確理解：PRP = 多階段流程 + Agent 協作驅動

❌ 錯誤流程：讀 PRP → 寫程式碼 → 提交 Git
✅ 正確流程：讀 PRP → Phase 1 規劃 → Phase 2-4 開發 → Phase 5 測試 → 提交
```

### **具體失敗案例分析**
1. **PRP-122**: 跳過所有 Agent 階段，直接實作 Firebase
2. **PRP-123**: 跳過所有 Agent 階段，直接實作儀表板
3. **結果**: 程式碼完成但缺乏規格、測試、風險評估

## 📋 **PRP 執行強制檢查清單**

### **開始前 (BEFORE_START)**
- [ ] 確認 PRP 檔案完整可讀
- [ ] 建立專案文件目錄結構
- [ ] 初始化 TodoWrite 追蹤清單
- [ ] 檢查所有依賴 PRP 是否已完成

### **Phase 1: 規劃驗證 (MANDATORY)**
**必須執行的 4 個 Agent:**
- [ ] `spec-writer`: 技術規格撰寫
- [ ] `ux-flow-designer`: 用戶流程設計
- [ ] `typescript-type-guardian`: 型別定義
- [ ] `risk-assessor`: 風險評估

**產出文件檢查:**
- [ ] `/docs/specs/[prp-name]-technical-spec.md`
- [ ] `/docs/ux/[prp-name]-user-flow.md`
- [ ] `/docs/types/[prp-name]-data-models.ts`
- [ ] `/docs/risks/[prp-name]-risk-assessment.md`

### **Phase 2-4: 開發階段 (WITH_MONITORING)**
**開發中 Agent 監控:**
- [ ] 修改 UI 元件 → 觸發 `ui-visual-tester`
- [ ] 新功能完成 → 觸發 `interaction-tester`
- [ ] TypeScript 錯誤 → 觸發 `typescript-type-guardian`
- [ ] 重構程式碼 → 觸發 `code-refactor-optimizer`

**階段性檢查:**
- [ ] Success Criteria Backend 項目驗證
- [ ] Success Criteria Frontend 項目驗證
- [ ] Success Criteria UX 項目驗證

### **Phase 5: 測試驗證 (MANDATORY)**
**必須執行的 5 個 Agent:**
- [ ] `interaction-tester`: 互動測試
- [ ] `ui-visual-tester`: 視覺測試
- [ ] `ux-journey-analyzer`: 用戶流程測試
- [ ] `typescript-type-guardian`: 型別安全檢查
- [ ] `code-refactor-optimizer`: 程式碼品質審查

**測試報告檢查:**
- [ ] `/docs/tests/[prp-name]-interaction-test.md`
- [ ] `/docs/tests/[prp-name]-visual-test.md`
- [ ] `/docs/tests/[prp-name]-ux-flow-test.md`
- [ ] `/docs/tests/[prp-name]-type-safety.md`
- [ ] `/docs/tests/[prp-name]-code-quality.md`

### **完成後 (AFTER_COMPLETION)**
- [ ] 所有 Success Criteria 已驗證
- [ ] 所有測試報告已生成
- [ ] Git 提交包含完整變更
- [ ] PRP 狀態更新為完成
- [ ] 更新 TASK.md 進度

## 🔧 **PRP 執行流程自動化**

### **1. 建立目錄結構**
```bash
mkdir -p /docs/specs
mkdir -p /docs/ux  
mkdir -p /docs/types
mkdir -p /docs/risks
mkdir -p /docs/tests
```

### **2. PRP 開始檢查清單**
```yaml
prp_execution_status:
  prp_id: "PRP-XXX"
  status: "not_started" # not_started, phase1, phase2-4, phase5, completed
  phase1_agents_completed: 
    spec_writer: false
    ux_flow_designer: false  
    typescript_type_guardian: false
    risk_assessor: false
  phase5_agents_completed:
    interaction_tester: false
    ui_visual_tester: false
    ux_journey_analyzer: false
    typescript_type_guardian_final: false
    code_refactor_optimizer: false
  success_criteria_verified:
    backend: false
    frontend: false
    ux: false
```

### **3. Agent 觸發規則**
```yaml
auto_trigger_rules:
  on_ui_component_change: 
    - ui-visual-tester
    - code-refactor-optimizer
  on_new_feature_complete:
    - interaction-tester  
    - typescript-type-guardian
  on_typescript_error:
    - typescript-type-guardian
  on_test_failure:
    - test-results-analyzer
    - interaction-tester
```

## 🚨 **失敗預防措施**

### **強制停止點**
1. **Phase 1 未完成** → 禁止進入開發階段
2. **Success Criteria 未驗證** → 禁止進入測試階段  
3. **Phase 5 未完成** → 禁止提交 Git
4. **測試報告缺失** → 禁止標記完成

### **檢查觸發器**
- 每次 TodoWrite 更新時檢查 PRP 進度
- 每次提交 Git 前檢查完成度
- 每次 Agent 執行後更新狀態

### **失敗恢復機制**
```yaml
failure_recovery:
  if_agent_skipped:
    action: "立即補充執行缺失的 Agent"
    priority: "高"
  if_documentation_missing:
    action: "生成缺失的規格和測試報告" 
    priority: "高"
  if_success_criteria_unverified:
    action: "逐項驗證並記錄結果"
    priority: "中"
```

## 📊 **當前 PRP 狀態追蹤**

### **PRP-122: Firebase Web SDK 整合**
```yaml
status: "completed_incorrectly"
missing_phase1_agents: [spec-writer, ux-flow-designer, typescript-type-guardian, risk-assessor]
missing_phase5_agents: [interaction-tester, ui-visual-tester, ux-journey-analyzer, typescript-type-guardian, code-refactor-optimizer]
missing_documents: 
  - /docs/specs/firebase-web-integration-spec.md
  - /docs/ux/authentication-user-flow.md
  - /docs/types/firebase-web-types.ts
  - /docs/risks/firebase-security-risk-assessment.md
  - /docs/tests/* (所有測試報告)
recovery_needed: true
```

### **PRP-123: 儀表板分析整合**
```yaml
status: "completed_incorrectly"  
missing_phase1_agents: [spec-writer, ux-flow-designer, typescript-type-guardian, risk-assessor]
missing_phase5_agents: [interaction-tester, ui-visual-tester, ux-journey-analyzer, typescript-type-guardian, code-refactor-optimizer]
missing_documents:
  - /docs/specs/dashboard-analytics-technical-spec.md
  - /docs/ux/dashboard-user-journey-flow.md
  - /docs/types/dashboard-data-models.ts
  - /docs/risks/dashboard-performance-risk-assessment.md
  - /docs/tests/* (所有測試報告)
recovery_needed: true
```

### **PRP-124: AI 分析查詢介面**
```yaml
status: "not_started"
next_action: "執行 Phase 1 規劃 Agent"
correct_execution_planned: true
```

### **PRP-125: Notion 資料庫管理**
```yaml
status: "not_started"
next_action: "等待 PRP-124 完成"
correct_execution_planned: true
```

## 🎯 **立即行動計劃**

### **第一優先：建立執行機制** 
1. ✅ 建立此追蹤文件
2. ⏳ 建立目錄結構
3. ⏳ 設定 Agent 觸發規則

### **第二優先：補救已完成的 PRP**
1. ⏳ PRP-122 補充所有缺失的 Agent 和文件
2. ⏳ PRP-123 補充所有缺失的 Agent 和文件

### **第三優先：正確執行新 PRP**
1. ⏳ PRP-124 完整 Phase 1-5 執行
2. ⏳ PRP-125 完整 Phase 1-5 執行

---

**記住：永遠不要再跳過 PRP 流程！每個 Phase 都是必要的！**