# PRP 執行標準規範

## 🚨 **重要宣告**
**所有 PRP 執行必須嚴格遵循此標準，不得跳過任何階段或檢查點。**

---

## 📋 **PRP 執行前置條件**

### **開始前檢查清單 (BEFORE_START)**
- [ ] 確認 PRP 檔案完整可讀
- [ ] 建立專案文件目錄結構
- [ ] 初始化 TodoWrite 追蹤清單
- [ ] 檢查所有依賴 PRP 是否已完成

### **文件目錄結構建立**
```bash
mkdir -p /docs/specs
mkdir -p /docs/ux  
mkdir -p /docs/types
mkdir -p /docs/risks
mkdir -p /docs/tests
mkdir -p /docs/agent-reports
```

---

## 🔄 **5 階段執行流程**

### **Phase 1: 規劃驗證階段 (MANDATORY)**

**必須執行的 4 個 Agent:**
- [ ] `spec-writer`: 技術規格撰寫
- [ ] `ux-flow-designer`: 用戶流程設計
- [ ] `typescript-type-guardian`: 型別定義
- [ ] `risk-assessor`: 風險評估

**必須產出的文件:**
- [ ] `/docs/specs/[prp-name]-technical-spec.md`
- [ ] `/docs/ux/[prp-name]-user-flow.md`
- [ ] `/docs/types/[prp-name]-data-models.ts`
- [ ] `/docs/risks/[prp-name]-risk-assessment.md`

**Phase 1 完成條件:**
- 所有 4 個 Agent 成功執行
- 所有文件已生成且內容完整
- 技術風險已識別並有應對策略

---

### **Phase 2: 後端服務實作**

**開發任務:**
- 根據技術規格實作後端邏輯
- 資料模型建立和驗證
- API 端點開發

**自動觸發的 Agent:**
- TypeScript 錯誤 → 觸發 `typescript-type-guardian`
- 重構程式碼 → 觸發 `code-refactor-optimizer`

**Phase 2 完成條件:**
- 後端功能實作完成
- Success Criteria Backend 項目驗證
- 無 Critical TypeScript 錯誤

---

### **Phase 3: 前端元件實作**

**開發任務:**
- 根據 UX 流程設計實作前端界面
- 元件整合和互動邏輯
- 響應式設計實作

**自動觸發的 Agent:**
- 修改 UI 元件 → 觸發 `ui-visual-tester` + `code-refactor-optimizer`
- 新功能完成 → 觸發 `interaction-tester` + `typescript-type-guardian`

**Phase 3 完成條件:**
- 前端界面實作完成
- Success Criteria Frontend 項目驗證
- UI 元件通過視覺測試

---

### **Phase 4: 系統整合**

**開發任務:**
- 前後端整合測試
- 端到端功能驗證
- 效能優化

**自動觸發的 Agent:**
- 整合測試失敗 → 觸發 `test-results-analyzer` + `interaction-tester`
- UI 顯示異常 → 觸發 `ui-visual-tester` + `ux-journey-analyzer`

**Phase 4 完成條件:**
- 系統整合完成
- Success Criteria UX 項目驗證
- 端到端流程正常運作

---

### **Phase 5: 測試與驗證階段 (MANDATORY)**

**必須執行的 5 個 Agent:**
- [ ] `interaction-tester`: 互動測試
- [ ] `ui-visual-tester`: 視覺測試
- [ ] `ux-journey-analyzer`: 用戶流程測試
- [ ] `typescript-type-guardian`: 型別安全檢查
- [ ] `code-refactor-optimizer`: 程式碼品質審查

**必須產出的測試報告:**
- [ ] `/docs/tests/[prp-name]-interaction-test.md`
- [ ] `/docs/tests/[prp-name]-visual-test.md`
- [ ] `/docs/tests/[prp-name]-ux-flow-test.md`
- [ ] `/docs/tests/[prp-name]-type-safety.md`
- [ ] `/docs/tests/[prp-name]-code-quality.md`

**Phase 5 完成條件:**
- 所有 5 個 Agent 成功執行
- 所有測試報告已生成
- 所有 Critical 問題已修復

---

## 📊 **品質閥門與強制停止點**

### **階段間檢查點**
1. **Phase 1 未完成** → 禁止進入開發階段
2. **Success Criteria 未驗證** → 禁止進入測試階段  
3. **Phase 5 未完成** → 禁止提交 Git
4. **測試報告缺失** → 禁止標記完成

### **Agent 檢查要求**
- 不執行 Agent 不能進入下一個 Phase
- Critical 問題必須修復才能繼續
- 所有檢查結果必須文件化至 `/docs/agent-reports/[date]-prp-[number]/`

---

## 📝 **PRP 檔案管理規則**

### **命名規則**
- **新建檔案**: `123-feature-name.md`
- **執行中**: 保持原名稱
- **完成後**: `123v-feature-name.md`

### **狀態追蹤**
1. **重新命名檔案**: 在編號後加上 `v`
2. **更新 PRPs/README.md**: 
   - 狀態改為 ✅ 已完成
   - 填入執行日期
   - 更新下一個 PRP 編號
3. **提交 Git 變更**: 包含檔案重新命名和狀態更新

---

## 🚨 **失敗預防與恢復機制**

### **自動觸發規則**
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
  on_ui_display_issue:
    - ui-visual-tester
    - ux-journey-analyzer
```

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

### **檢查觸發器**
- 每次 TodoWrite 更新時檢查 PRP 進度
- 每次提交 Git 前檢查完成度
- 每次 Agent 執行後更新狀態

---

## 🎯 **成功標準驗證**

### **Backend Success Criteria**
- [ ] 所有後端邏輯實作完成
- [ ] API 端點正常運作
- [ ] 資料模型驗證通過

### **Frontend Success Criteria**  
- [ ] 前端界面符合設計規格
- [ ] 使用者互動流暢無誤
- [ ] 響應式設計正確

### **UX Success Criteria**
- [ ] 用戶流程符合設計預期
- [ ] 無可用性障礙
- [ ] 整體使用體驗良好

---

## 📋 **TodoWrite 整合要求**

### **必須追蹤的任務**
- Phase 1: 4 個規劃 Agent 執行
- Phase 2-4: 開發任務與自動觸發 Agent
- Phase 5: 5 個驗證 Agent 執行
- 文件產出與品質檢查
- Success Criteria 逐項驗證

### **狀態更新頻率**
- 每完成一個 Agent → 立即標記完成
- 每完成一個階段 → 更新整體進度
- 每發現問題 → 新增修復任務

---

## ⚠️ **執行注意事項**

### **絕對不允許的行為**
1. ❌ 跳過任何 Phase
2. ❌ 跳過必要的 Agent 執行
3. ❌ 缺少必要文件就進入下一階段
4. ❌ 未驗證 Success Criteria 就標記完成
5. ❌ 有 Critical 問題未修復就繼續

### **強制執行機制**
- 每個階段都有檢查點，不符合條件立即停止
- 所有文件和報告必須完整才能繼續
- Git 提交前必須通過所有驗證

---

**🔥 記住：永遠不要再跳過 PRP 流程！每個 Phase 都是必要的！**

**此標準是不可妥協的品質保證機制，確保每個 PRP 都能達到生產級品質。**