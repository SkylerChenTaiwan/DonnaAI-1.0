# PRP-50: AI 業務訓練 UX 優化與功能增強

## Goal
優化 AI 業務訓練工具的使用者體驗，修正介面設計問題，加入會話暫停/恢復功能，隱藏即時指標，新增 AI 教練討論功能，並實作自動結束條件。

## Why
- **導航問題**：目前無法看到返回按鈕，使用者被困在 WebApp 中
- **視覺不一致**：WebApp 使用彩色設計與主應用的灰階設計系統衝突
- **UI 混亂**：輸入框上方出現不明白色區塊，影響使用體驗
- **資訊過載**：即時顯示信任度、興趣度等內部指標會干擾訓練專注度
- **缺乏彈性**：無法暫停訓練稍後繼續，只能結束整個會話
- **無明確目標**：訓練沒有自動結束條件，給人無止境的感覺
- **缺乏指導**：使用者無法與 AI 討論自己的表現獲得指導

## What
### 用戶可見行為
1. **導航修復**：WebApp 內顯示返回按鈕，可隨時返回主應用
2. **視覺統一**：採用主應用的灰階設計系統，移除彩色元素
3. **UI 清理**：修正輸入區域設計，移除神秘白色區塊
4. **簡化介面**：隱藏即時數值指標，只在訓練結束後顯示
5. **會話管理**：新增「暫停」按鈕，可保存進度稍後繼續
6. **AI 教練**：可展開的教練討論區，獲得即時指導
7. **自動結束**：達成交易(WON)或失去客戶(LOST)時自動結束
8. **訓練報告**：結束時顯示完整表現報告和改進建議

### 技術需求
1. 修改 WebApp HTML/CSS 採用灰階設計
2. 實作 WebApp 內的返回導航
3. 修正輸入區域佈局問題
4. 實作會話暫停/恢復機制
5. 新增 AI 教練對話功能
6. 監測終止狀態自動結束
7. 生成訓練報告

### Success Criteria
- [x] 返回按鈕在 WebApp 內正常顯示和運作
- [x] 整體視覺與主應用一致（灰階設計）
- [x] 輸入區域正常顯示，無異常白色區塊
- [x] 訓練中不顯示數值指標
- [x] 可暫停會話並稍後恢復
- [x] AI 教練功能正常運作
- [x] 達到 WON/LOST 狀態時自動結束
- [x] 顯示完整訓練報告

## All Needed Context

### Documentation & References
```yaml
# 現有設計系統
- file: src/theme/designSystem.ts
  why: 主應用的灰階設計系統定義，需要套用到 WebApp
  key_colors:
    primary: '#2C2C2C'
    background: '#F5F5F5', '#FFFFFF'
    text: '#1A1A1A', '#666666', '#999999'
    button_primary: '#2C2C2C'
    button_secondary: '#F7F7F7'
    border: '#E5E7EB', '#D1D5DB'

# WebApp 檔案
- file: src/webapps/apps/ai-roleplay/index.html
  why: 需要修改的 WebApp HTML
  current_issues:
    - 使用彩色設計 (#FF9500, #007AFF, #34C759, #FF3B30, #5856D6)
    - 缺少返回按鈕
    - 輸入區域佈局問題

# Native Bridge 通訊
- file: src/screens/tools/WebAppContainer.tsx
  why: Native Bridge 實作，需要擴展儲存/讀取功能
  current_apis:
    - saveData/getData (未完整實作)
    - navigate (已實作返回)
    - roleplay messages

# RolePlay 服務
- file: src/services/roleplay/dialogueEngine.ts
  why: 對話引擎，需要了解會話管理
  features:
    - generateHint() 已有提示功能
    - endSession() 結束會話
    
- file: src/services/roleplay/stateManager.ts
  why: 狀態管理，了解終止狀態
  terminal_states:
    - WON: 成功成交
    - LOST: 失去客戶

# 參考設計
- url: https://linear.app
  why: 極簡灰階設計參考

- url: https://www.notion.so
  why: 灰階 UI 組件參考
```

### Current Codebase tree
```bash
src/
├── webapps/apps/ai-roleplay/
│   └── index.html              # 需要修改的 WebApp
├── screens/tools/
│   └── WebAppContainer.tsx     # Native Bridge 容器
├── services/roleplay/          # 後端服務
│   ├── dialogueEngine.ts
│   ├── stateManager.ts
│   └── promptTemplates.ts
└── theme/
    └── designSystem.ts         # 設計系統
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: WebView 高度問題
// 問題：WebApp 設定 height: 100vh 會遮蓋 Native Header
// 解決：WebApp 需要考慮 Native Header 高度

// CRITICAL: 輸入框自動高度調整
// 問題：textarea 動態調整高度時產生白色區塊
// 原因：CSS transition 與 height: auto 衝突
// 解決：移除 transition 或使用固定高度

// GOTCHA: Native Bridge 異步通訊
// saveData/getData 需要 callback 機制
// 範例：
window.DonnaAI.getData('session', (data) => {
  // 處理返回的資料
});

// GOTCHA: 狀態轉換檢測
// StateType.WON 和 StateType.LOST 是終止狀態
// 需要在 processRolePlayMessage 中檢測並觸發結束

// GOTCHA: Safari WebView 樣式
// -webkit-appearance: none 避免預設樣式
// -webkit-tap-highlight-color: transparent 移除點擊高亮
```

## Implementation Blueprint

### Data models and structure

```typescript
// 會話持久化資料結構
interface SavedSession {
  sessionId: string;
  personaId: string;
  messages: Array<{
    sender: 'user' | 'customer';
    content: string;
    timestamp: string;
  }>;
  currentState: string;
  metrics: {
    trust: number;
    interest: number;
    turnCount: number;
  };
  pausedAt: string;
}

// AI 教練對話
interface CoachMessage {
  type: 'analysis' | 'suggestion' | 'feedback';
  content: string;
  context?: {
    recentMistake?: string;
    improvement?: string;
    nextStep?: string;
  };
}

// 訓練報告
interface TrainingReport {
  sessionId: string;
  duration: number;
  outcome: 'won' | 'lost' | 'paused';
  metrics: {
    finalTrust: number;
    finalInterest: number;
    totalTurns: number;
    stateChanges: number;
  };
  keyMoments: Array<{
    turn: number;
    event: string;
    impact: 'positive' | 'negative';
  }>;
  suggestions: string[];
}
```

### List of tasks to complete

```yaml
Task 1: 修改 WebApp 設計系統
MODIFY src/webapps/apps/ai-roleplay/index.html:
  - REPLACE 所有彩色 (#FF9500, #007AFF 等) 為灰階
  - UPDATE 按鈕樣式符合 DesignSystem
  - ADD 返回按鈕在頂部
  - FIX 輸入區域 CSS 移除 transition

Task 2: 隱藏即時指標
MODIFY src/webapps/apps/ai-roleplay/index.html:
  - HIDE metrics-bar 區域 (display: none)
  - CREATE hidden state storage for metrics
  - SHOW metrics only in final report

Task 3: 實作會話暫停/恢復
MODIFY src/screens/tools/WebAppContainer.tsx:
  - IMPLEMENT saveData with AsyncStorage
  - IMPLEMENT getData with callback
  - ADD pauseSession/resumeSession handlers

MODIFY src/webapps/apps/ai-roleplay/index.html:
  - ADD 暫停按鈕
  - IMPLEMENT saveSession function
  - CHECK for saved session on load
  - RESTORE session if exists

Task 4: 新增 AI 教練功能
MODIFY src/webapps/apps/ai-roleplay/index.html:
  - ADD collapsible coach section
  - CREATE coach chat interface
  - STYLE with gray theme

MODIFY src/screens/tools/WebAppContainer.tsx:
  - ADD getCoachAdvice handler
  - INTEGRATE with dialogue engine

Task 5: 實作自動結束條件
MODIFY src/screens/tools/WebAppContainer.tsx:
  - CHECK for WON/LOST states in processRolePlayMessage
  - TRIGGER auto-end when detected
  - GENERATE training report

MODIFY src/webapps/apps/ai-roleplay/index.html:
  - HANDLE auto-end event
  - DISPLAY training report UI
  - SHOW improvement suggestions

Task 6: 修復導航顯示
MODIFY src/webapps/apps/ai-roleplay/index.html:
  - ADD fixed header with back button
  - ADJUST container height (calc(100vh - 60px))
  - ENSURE header stays visible
```

### Per task pseudocode

```javascript
// Task 1: 設計系統更新
// 灰階色彩對應
const colorMapping = {
  '#FF9500': '#666666',  // Orange -> Secondary text
  '#007AFF': '#2C2C2C',  // Blue -> Primary
  '#34C759': '#666666',  // Green -> Secondary
  '#FF3B30': '#999999',  // Red -> Tertiary
  '#5856D6': '#999999',  // Purple -> Tertiary
  'colorful-bg': '#F7F7F7' // All colorful backgrounds -> Light gray
};

// 新增返回按鈕
const header = `
  <div class="app-header">
    <button class="back-button" onclick="handleBack()">
      <svg><!-- 返回箭頭 SVG --></svg>
      返回
    </button>
    <h1 class="header-title">AI 業務訓練</h1>
  </div>
`;

// Task 3: 會話暫停/恢復
// WebAppContainer.tsx
case 'saveData':
  try {
    await AsyncStorage.setItem(
      `@roleplay_${message.data.key}`,
      JSON.stringify(message.data.value)
    );
    // 回調成功
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'saveDataCallback',
      key: message.data.key,
      success: true
    }));
  } catch (error) {
    // 回調錯誤
  }
  break;

case 'getData':
  try {
    const value = await AsyncStorage.getItem(`@roleplay_${message.data.key}`);
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'getDataCallback',
      key: message.data.key,
      value: value ? JSON.parse(value) : null
    }));
  } catch (error) {
    // 錯誤處理
  }
  break;

// WebApp 中的暫停功能
function pauseSession() {
  const sessionData = {
    sessionId: state.sessionId,
    personaId: state.currentPersona.id,
    messages: state.messages,
    currentState: state.currentState,
    metrics: state.metrics,
    pausedAt: new Date().toISOString()
  };
  
  window.DonnaAI.saveData('current_session', sessionData);
  window.DonnaAI.sendMessage('roleplay', {
    action: 'pauseSession'
  });
}

// Task 4: AI 教練功能
function toggleCoach() {
  const coachSection = document.getElementById('coachSection');
  if (coachSection.classList.contains('expanded')) {
    coachSection.classList.remove('expanded');
  } else {
    coachSection.classList.add('expanded');
    requestCoachAdvice();
  }
}

function requestCoachAdvice() {
  const recentMessages = state.messages.slice(-3);
  
  window.DonnaAI.sendMessage('roleplay', {
    action: 'getCoachAdvice',
    data: {
      recentMessages,
      currentState: state.currentState,
      metrics: state.metrics
    },
    callbackId: generateCallbackId()
  });
}

// Task 5: 自動結束檢測
// WebAppContainer.tsx
const result = await rolePlayEngine.processUserMessage(content);

// 檢查終止狀態
if (result.state.id === 'WON' || result.state.id === 'LOST') {
  // 生成訓練報告
  const report = await generateTrainingReport(
    currentSessionId,
    result.state.id
  );
  
  return {
    ...result,
    autoEnd: true,
    outcome: result.state.id.toLowerCase(),
    report
  };
}
```

### Integration Points
```yaml
NATIVE_BRIDGE:
  - extend: saveData/getData with AsyncStorage
  - add: pauseSession/resumeSession
  - add: getCoachAdvice
  - modify: processRolePlayMessage for auto-end

WEBAPP_COMMUNICATION:
  - implement: callback handlers for async operations
  - add: session restoration on load
  - handle: auto-end events

UI_UPDATES:
  - grayscale: all color elements
  - fixed: header with navigation
  - hidden: real-time metrics
  - new: coach section
  - new: training report view
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# 檢查 TypeScript 編譯
npx tsc --noEmit

# 檢查程式碼風格
npm run lint

# Expected: 無錯誤（忽略現有的 BillingManagementSection 錯誤）
```

### Level 2: 視覺驗證
```bash
# 啟動開發伺服器
npm start

# 測試步驟：
# 1. 進入小工具 > AI 業務訓練
# 2. 確認看到灰階設計的介面
# 3. 確認頂部有返回按鈕
# 4. 確認沒有顯示即時數值
# 5. 輸入文字時確認無白色區塊
```

### Level 3: 功能測試
```javascript
// 測試腳本（在 WebApp console 執行）
// 1. 測試暫停/恢復
await testPauseResume();

// 2. 測試 AI 教練
await testCoachFunction();

// 3. 測試自動結束
await simulateWinScenario();
await simulateLossScenario();

async function testPauseResume() {
  // 開始會話
  startSession('cautious-sme-owner');
  
  // 發送幾個訊息
  await sendMessage('你好');
  await sendMessage('我想了解你們的產品');
  
  // 暫停
  pauseSession();
  
  // 重新載入頁面
  location.reload();
  
  // 檢查是否恢復
  console.assert(state.messages.length === 2, '訊息應該被恢復');
}
```

### Level 4: 邊界測試
```yaml
test_cases:
  - 長時間暫停後恢復
  - 切換不同 WebApp 後返回
  - 網路中斷時的暫停
  - 同時開啟 AI 教練和發送訊息
  - 快速達到終止狀態
```

## Final Validation Checklist
- [ ] 返回按鈕始終可見且可用
- [ ] 整體設計符合灰階主題
- [ ] 輸入區域無異常顯示
- [ ] 即時指標已隱藏
- [ ] 暫停功能正常運作
- [ ] 恢復會話資料完整
- [ ] AI 教練提供有用建議
- [ ] WON 狀態自動結束
- [ ] LOST 狀態自動結束
- [ ] 訓練報告資訊完整

## Anti-Patterns to Avoid
- ❌ 不要在 WebApp 中使用 100vh（會遮蓋 header）
- ❌ 不要在 textarea 使用 transition（造成白色區塊）
- ❌ 不要同步呼叫 Native Bridge（使用 callback）
- ❌ 不要在訓練中顯示內部指標
- ❌ 不要忘記清理暫存的會話資料
- ❌ 不要讓使用者無限訓練（設定結束條件）

## 實作優先順序
1. **Phase 1**: 修復視覺和導航問題（返回按鈕、灰階設計、輸入區域）
2. **Phase 2**: 實作暫停/恢復功能
3. **Phase 3**: 新增 AI 教練和自動結束
4. **Phase 4**: 完善訓練報告

## 預期成果
- 視覺體驗與主應用一致
- 使用者可隨時離開或暫停訓練
- 獲得 AI 教練的即時指導
- 明確的訓練目標和結束條件
- 完整的表現分析報告

**信心評分**: 8/10
- 扣分原因：
  - WebView 高度計算可能需要調試
  - AI 教練回應品質需要調教
- 加分原因：
  - 現有架構支援所需功能
  - 設計系統已明確定義
  - Native Bridge 機制已驗證