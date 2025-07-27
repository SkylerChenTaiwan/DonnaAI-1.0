# PRP-49: AI RolePlay WebApp 整合與工具頁面清理

## Goal
移除小工具頁面的假工具，整合已完成的 AI RolePlay 訓練系統為可用的 WebApp，讓業務人員能夠在應用程式中直接使用 AI 客戶角色扮演功能進行銷售訓練。

## Why
- **用戶需求**：用戶發現小工具頁面都是假的placeholder，需要實際可用的工具
- **功能完整性**：後端 RolePlay 系統已完成，需要前端介面讓用戶使用
- **產品價值**：將 AI 訓練功能整合到主應用程式中，提供完整的使用體驗
- **清理冗餘**：移除無用的假工具，避免誤導用戶

## What
### 用戶可見行為
1. 小工具頁面只顯示實際可用的工具（計算器和 AI 業務訓練）
2. 點擊「AI 業務訓練」開啟訓練介面
3. 選擇客戶類型開始角色扮演對話
4. 與 AI 客戶進行即時對話練習
5. 獲得即時提示和表現評分

### 技術需求
1. 建立 AI RolePlay WebApp 的完整 HTML 介面
2. 整合後端 RolePlay 服務通過 Native Bridge
3. 移除所有 placeholder 工具
4. 實作對話介面和狀態顯示
5. 支援會話儲存和歷史記錄

### Success Criteria
- [x] 小工具頁面只顯示真實可用的工具
- [x] AI RolePlay WebApp 可正常載入和運行
- [x] 能夠選擇客戶原型並開始對話
- [x] 對話流暢且 AI 回應符合角色設定
- [x] 顯示即時提示和表現指標

## All Needed Context

### Documentation & References
```yaml
# 現有程式碼參考
- file: src/screens/tools/ToolsScreen.tsx
  why: 工具列表定義，需要清理假工具並新增 RolePlay

- file: src/webapps/webAppLoader.ts
  why: WebApp 載入機制，需要新增 RolePlay HTML

- file: src/screens/tools/WebAppContainer.tsx
  why: WebApp 容器和 Native Bridge 實作參考

- file: src/webapps/apps/calculator/index.html
  why: 現有 WebApp 實作模式參考

# 後端服務參考
- file: src/services/roleplay/dialogueEngine.ts
  why: 核心對話引擎 API

- file: src/services/roleplay/customerPersonas.ts
  why: 客戶原型定義和資料

- file: src/types/roleplay.ts
  why: TypeScript 類型定義

# API 呼叫模式
- file: src/services/api/gemini-integration.ts
  why: 了解 API 整合方式

# 設計參考
- url: https://mui.com/material-ui/react-chat/
  why: 聊天介面 UI 模式參考
```

### Current Codebase tree
```bash
src/
├── screens/tools/
│   ├── ToolsScreen.tsx          # 工具列表（有假工具）
│   └── WebAppContainer.tsx      # WebApp 容器
├── webapps/
│   ├── apps/
│   │   └── calculator/          # 現有計算器 WebApp
│   │       └── index.html
│   └── webAppLoader.ts          # WebApp 載入器
└── services/roleplay/           # 已完成的後端服務
    ├── dialogueEngine.ts
    ├── customerPersonas.ts
    ├── stateManager.ts
    └── promptTemplates.ts
```

### Desired Codebase tree
```bash
src/
├── screens/tools/
│   ├── ToolsScreen.tsx          # [修改] 只保留真實工具
│   └── WebAppContainer.tsx      # [修改] 支援 RolePlay API
├── webapps/
│   ├── apps/
│   │   ├── calculator/
│   │   └── ai-roleplay/         # [新增] AI 訓練 WebApp
│   │       └── index.html       # 完整訓練介面
│   └── webAppLoader.ts          # [修改] 加入 RolePlay
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: WebView 中的 Native Bridge 限制
// 1. 只能傳送可序列化的資料
// 2. 異步呼叫需要回調機制
// 3. 大型資料需要分批傳送

// CRITICAL: RolePlay 服務呼叫模式
// 後端服務在 Native 端，WebApp 需透過 bridge 呼叫
// 範例：
window.DonnaAI.sendMessage('roleplay', {
  action: 'startSession',
  personaId: 'cautious-sme-owner'
});

// GOTCHA: 對話狀態管理
// 狀態儲存在 Native 端，WebApp 只負責顯示
// 避免在 WebApp 中維護複雜狀態

// GOTCHA: 樣式一致性
// 使用與 Native App 相同的設計語言
// 參考 calculator WebApp 的樣式
```

## Implementation Blueprint

### Data models and structure

```typescript
// WebApp 與 Native 的通訊協議
interface RolePlayMessage {
  action: 'startSession' | 'sendMessage' | 'endSession' | 'getPersonas' | 'getHint';
  data?: any;
  callbackId?: string; // 用於異步回調
}

interface RolePlayCallback {
  callbackId: string;
  success: boolean;
  data?: any;
  error?: string;
}

// WebApp 內部狀態（簡化版）
interface WebAppState {
  sessionActive: boolean;
  currentPersona?: CustomerPersona;
  messages: Array<{
    id: string;
    sender: 'user' | 'customer';
    content: string;
    timestamp: Date;
    hint?: string;
  }>;
  metrics?: {
    trust: number;
    interest: number;
    turnCount: number;
  };
}
```

### List of tasks to complete

```yaml
Task 1: 清理 ToolsScreen 的假工具
MODIFY src/screens/tools/ToolsScreen.tsx:
  - REMOVE all placeholder tools except calculator
  - ADD AI RolePlay tool entry
  - KEEP calculator tool
  - UPDATE tool count and layout

Task 2: 建立 AI RolePlay WebApp 目錄
CREATE src/webapps/apps/ai-roleplay/:
  - CREATE index.html with complete UI
  - FOLLOW calculator app structure
  - USE existing CSS patterns

Task 3: 實作 RolePlay WebApp HTML
CREATE src/webapps/apps/ai-roleplay/index.html:
  - BUILD persona selection screen
  - CREATE chat interface
  - ADD performance metrics display
  - IMPLEMENT Native Bridge communication
  - STYLE consistent with app design

Task 4: 更新 WebApp 載入器
MODIFY src/webapps/webAppLoader.ts:
  - IMPORT roleplay HTML
  - ADD to webApps collection
  - EXPORT for tool integration

Task 5: 擴展 WebAppContainer 支援 RolePlay
MODIFY src/screens/tools/WebAppContainer.tsx:
  - ADD roleplay message handlers
  - IMPLEMENT callback mechanism
  - INTEGRATE with dialogueEngine
  - HANDLE session management

Task 6: 測試整合
TEST all features:
  - VERIFY tool appears in list
  - CHECK WebApp loads correctly
  - TEST persona selection
  - VALIDATE chat functionality
  - CONFIRM Native Bridge works
```

### Per task pseudocode

```javascript
// Task 3: RolePlay WebApp 核心邏輯
// index.html 的 JavaScript 部分

// 狀態管理
let state = {
  sessionActive: false,
  currentPersona: null,
  messages: [],
  metrics: { trust: 5, interest: 5, turnCount: 0 }
};

// 回調管理
const callbacks = new Map();

// 初始化
window.onDonnaAIReady = function() {
  console.log('RolePlay WebApp 已就緒');
  loadPersonas();
};

// 載入客戶原型
function loadPersonas() {
  const callbackId = generateCallbackId();
  callbacks.set(callbackId, (data) => {
    renderPersonaSelection(data.personas);
  });
  
  window.DonnaAI.sendMessage('roleplay', {
    action: 'getPersonas',
    callbackId
  });
}

// 開始訓練會話
function startSession(personaId) {
  const callbackId = generateCallbackId();
  callbacks.set(callbackId, (data) => {
    state.sessionActive = true;
    state.currentPersona = data.persona;
    
    // 顯示客戶開場白
    addMessage('customer', data.greeting);
    renderChatInterface();
  });
  
  window.DonnaAI.sendMessage('roleplay', {
    action: 'startSession',
    data: { personaId },
    callbackId
  });
}

// 發送訊息
function sendMessage(content) {
  if (!state.sessionActive) return;
  
  // 立即顯示用戶訊息
  addMessage('user', content);
  
  // 呼叫後端處理
  const callbackId = generateCallbackId();
  callbacks.set(callbackId, (data) => {
    // 顯示客戶回應
    addMessage('customer', data.response, data.hint);
    
    // 更新指標
    if (data.metrics) {
      state.metrics = data.metrics;
      updateMetricsDisplay();
    }
    
    // 處理狀態變化
    if (data.stateChange) {
      showStateChange(data.stateChange);
    }
  });
  
  window.DonnaAI.sendMessage('roleplay', {
    action: 'sendMessage',
    data: { content },
    callbackId
  });
}

// Task 5: WebAppContainer 擴展
// 新增 RolePlay 訊息處理

case 'roleplay':
  handleRolePlayMessage(message.data);
  break;

async function handleRolePlayMessage(data) {
  const { action, callbackId } = data;
  
  try {
    let result;
    
    switch (action) {
      case 'getPersonas':
        result = await getRolePlayPersonas();
        break;
        
      case 'startSession':
        result = await startRolePlaySession(data.data);
        break;
        
      case 'sendMessage':
        result = await processRolePlayMessage(data.data);
        break;
        
      case 'endSession':
        result = await endRolePlaySession();
        break;
    }
    
    // 回調 WebApp
    if (callbackId) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'roleplayCallback',
        callbackId,
        success: true,
        data: result
      }));
    }
  } catch (error) {
    // 錯誤回調
    if (callbackId) {
      webViewRef.current?.postMessage(JSON.stringify({
        type: 'roleplayCallback',
        callbackId,
        success: false,
        error: error.message
      }));
    }
  }
}
```

### Integration Points
```yaml
NATIVE_BRIDGE:
  - extend: WebAppContainer message handlers
  - add: roleplay action types
  - implement: async callback pattern
  
FIREBASE:
  - collection: roleplay_sessions
  - storage: conversation history
  - analytics: track training metrics
  
API_INTEGRATION:
  - service: dialogueEngine
  - method: WebApp -> Native -> Service
  - response: Service -> Native -> WebApp
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# 檢查 TypeScript 編譯
npx tsc --noEmit

# 檢查程式碼風格
npm run lint

# Expected: 無錯誤
```

### Level 2: WebApp 載入測試
```bash
# 啟動開發伺服器
npm start

# 測試步驟：
# 1. 開啟應用程式
# 2. 進入「小工具」頁面
# 3. 確認只顯示「銷售計算器」和「AI 業務訓練」
# 4. 點擊「AI 業務訓練」
# 5. 確認 WebApp 正常載入
```

### Level 3: 功能測試
```javascript
// 測試腳本（在 WebApp 中執行）
async function testRolePlay() {
  // 測試 1: 載入客戶原型
  console.log('測試載入客戶原型...');
  await loadPersonas();
  
  // 測試 2: 開始會話
  console.log('測試開始會話...');
  await startSession('cautious-sme-owner');
  
  // 測試 3: 發送訊息
  console.log('測試對話...');
  await sendMessage('您好，我想介紹我們的新產品');
  
  // 測試 4: 結束會話
  console.log('測試結束會話...');
  await endSession();
  
  console.log('所有測試完成！');
}
```

### Level 4: 效能驗證
```javascript
// 檢查回應時間
console.time('AI Response');
await sendMessage('測試訊息');
console.timeEnd('AI Response'); // 應該 < 3秒

// 檢查記憶體使用
console.log('Memory:', performance.memory);
```

## Final Validation Checklist
- [ ] 假工具已全部移除
- [ ] AI RolePlay 工具正常顯示
- [ ] WebApp 載入無錯誤
- [ ] 客戶原型列表正確顯示
- [ ] 對話功能正常運作
- [ ] AI 回應符合角色設定
- [ ] 即時提示正確顯示
- [ ] 效能指標即時更新
- [ ] Native Bridge 通訊穩定
- [ ] 錯誤處理完善

## Anti-Patterns to Avoid
- ❌ 不要在 WebApp 中直接呼叫 API（必須透過 Native）
- ❌ 不要在 WebApp 中儲存敏感資料
- ❌ 不要維護複雜的狀態邏輯（保持簡單）
- ❌ 不要忽略錯誤處理和用戶反饋
- ❌ 不要偏離現有的設計語言
- ❌ 不要忘記行動裝置優化

## 實作優先順序
1. **Phase 1**: 清理假工具，確保基礎架構正確
2. **Phase 2**: 建立基本 WebApp 介面和對話功能
3. **Phase 3**: 完善 UI 細節和效能優化

## 預期成果
- 小工具頁面展示真實可用的工具
- AI RolePlay 功能完整整合到應用程式
- 用戶可以隨時進行銷售訓練
- 提供流暢的對話體驗和即時反饋

**信心評分**: 9/10
- 扣分原因：WebApp 與 Native 的異步通訊可能需要調試
- 加分原因：
  - 有現成的 WebApp 模式可參考
  - 後端服務已完整實作
  - Native Bridge 機制已驗證可用