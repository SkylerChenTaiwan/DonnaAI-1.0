# PRP-47: AI 業務訓練 RolePlay 系統

## Goal
建立一個 AI 驅動的業務訓練系統，讓業務人員可以透過與 AI 扮演的客戶進行對話練習，獲得即時回饋和指導，提升銷售技巧。

## Why
- **業務價值**：資深業務時間有限，無法大量指導新人練習，AI 可以提供無限練習機會
- **用戶影響**：新進業務可以安全環境下練習，降低實戰失敗成本
- **整合價值**：與現有的小工具系統整合，成為業務培訓的核心功能
- **問題解決**：解決業務訓練資源不足、練習機會少、缺乏即時回饋的問題

## What
### 用戶可見行為
1. 在「小工具」頁面新增「AI 業務訓練」工具
2. 選擇客戶類型和情境開始練習
3. 與 AI 客戶進行對話，AI 表現真實客戶行為
4. 獲得即時提示和事後分析報告
5. 追蹤個人進步和弱點改善

### 技術需求
1. 混合 AI 架構：GPT-3.5 為主、關鍵時刻用 GPT-4
2. 對話壓縮技術：減少 90% token 使用
3. 狀態機管理客戶心理狀態
4. 智慧快取系統避免重複 API 呼叫
5. WebApp 架構整合到現有小工具系統

### Success Criteria
- [ ] 每次對話成本控制在 $0.03 美元以內
- [ ] AI 客戶行為真實度達到資深業務認可
- [ ] 提供至少 10 種客戶原型
- [ ] 即時回饋延遲小於 2 秒
- [ ] 支援對話歷史記錄和進度追蹤

## All Needed Context

### Documentation & References
```yaml
# AI API 文檔
- url: https://platform.openai.com/docs/guides/function-calling
  why: GPT-3.5/4 function calling 用於結構化輸出
  
- url: https://platform.openai.com/docs/guides/prompt-engineering
  why: Prompt 優化技巧，特別是 role-playing 部分

- url: https://docs.anthropic.com/claude/docs/prompt-engineering
  why: Claude 的角色扮演最佳實踐（備選方案）

# 現有程式碼參考
- file: src/services/api/gemini-integration.ts
  why: AI 整合模式、快取實作、環境變數管理

- file: src/screens/tools/WebAppContainer.tsx
  why: WebApp 容器模式、JavaScript Bridge 實作

- file: src/webapps/webAppLoader.ts
  why: WebApp 載入機制

- file: functions/src/ai-processing-api.ts
  why: Firebase Functions AI 處理模式（如需後端處理）

# 設計文檔
- docfile: docs/plans/features/roleplay-state-machine-architecture.md
  why: 狀態機架構設計詳細說明

- docfile: docs/plans/features/roleplay-compression-techniques.md
  why: 對話壓縮技術實作細節

- docfile: docs/plans/features/roleplay-implementation-detail.md
  why: 完整實作架構和成本優化
```

### Current Codebase tree
```bash
src/
├── screens/tools/
│   ├── ToolsScreen.tsx          # 小工具列表頁
│   └── WebAppContainer.tsx      # WebApp 容器
├── webapps/
│   ├── apps/
│   │   └── calculator/          # 現有計算器 WebApp
│   └── webAppLoader.ts          # WebApp 載入器
├── services/
│   └── api/
│       └── gemini-integration.ts # AI API 整合參考
└── types/
    └── navigation.ts            # 導航類型定義
```

### Desired Codebase tree
```bash
src/
├── screens/tools/
│   ├── ToolsScreen.tsx          # [修改] 新增 AI 訓練工具
│   └── WebAppContainer.tsx      # 現有容器
├── webapps/
│   ├── apps/
│   │   ├── calculator/
│   │   └── ai-roleplay/         # [新增] AI 訓練 WebApp
│   │       └── index.html       # 訓練介面
│   └── webAppLoader.ts          # [修改] 新增載入器
├── services/
│   ├── api/
│   │   ├── gemini-integration.ts
│   │   └── openai-integration.ts # [新增] OpenAI API 整合
│   └── roleplay/                # [新增] RolePlay 核心邏輯
│       ├── stateManager.ts      # 狀態機管理
│       ├── dialogueCompressor.ts # 對話壓縮
│       ├── responseCache.ts     # 回應快取
│       └── customerPersonas.ts  # 客戶原型定義
└── types/
    ├── navigation.ts
    └── roleplay.ts              # [新增] RolePlay 類型定義
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: OpenAI API 在 React Native 需要特殊處理
// 不能直接 import openai，需要使用 fetch API
// 參考：https://github.com/openai/openai-node/issues/18

// CRITICAL: WebView 中的 JavaScript Bridge 限制
// postMessage 只能傳送可序列化的資料
// 大型物件需要分批傳送

// CRITICAL: React Native 環境變數
// 必須使用 EXPO_PUBLIC_ 前綴
// 例如：EXPO_PUBLIC_OPENAI_API_KEY

// GOTCHA: Token 計算
// GPT-3.5: ~4 字元 = 1 token（英文）
// 中文：~2 字元 = 1 token
// 系統需要預估 token 使用量

// GOTCHA: API 速率限制
// OpenAI: 3500 RPM (GPT-3.5), 500 RPM (GPT-4)
// 需要實作速率限制和重試機制
```

## Implementation Blueprint

### Data models and structure

```typescript
// types/roleplay.ts
export interface CustomerPersona {
  id: string;
  name: string;
  profile: {
    industry: string;
    companySize: string;
    position: string;
    personality: PersonalityTraits;
    painPoints: string[];
    budget: BudgetProfile;
    decisionProcess: string;
  };
  triggers: {
    positive: string[];
    negative: string[];
  };
}

export interface CustomerState {
  id: StateType;
  name: string;
  description: string;
  behaviors: {
    openness: number;      // 0-10
    patience: number;      // 0-10
    trust: number;         // 0-10
    defensiveness: number; // 0-10
  };
  responsePatterns: string[];
  transitions: StateTransition[];
}

export interface DialogueSession {
  sessionId: string;
  userId: string;
  persona: CustomerPersona;
  currentState: CustomerState;
  conversationHistory: CompressedDialogue[];
  metrics: SessionMetrics;
  startTime: Date;
  endTime?: Date;
}

export interface CompressedDialogue {
  turnNumber: number;
  summary: string;
  keyPoints: string[];
  emotionMetrics: Record<string, number>;
  importance: 'critical' | 'important' | 'normal' | 'trivial';
}
```

### List of tasks to complete

```yaml
Task 1: 建立 TypeScript 類型定義
CREATE src/types/roleplay.ts:
  - DEFINE all interfaces for RolePlay system
  - INCLUDE persona, state, dialogue types
  - EXPORT for use across modules

Task 2: 實作 OpenAI API 整合
CREATE src/services/api/openai-integration.ts:
  - MIRROR pattern from: src/services/api/gemini-integration.ts
  - IMPLEMENT function calling for structured output
  - ADD retry logic and rate limiting
  - USE environment variables with EXPO_PUBLIC_ prefix

Task 3: 建立狀態機管理器
CREATE src/services/roleplay/stateManager.ts:
  - IMPLEMENT state machine logic
  - DEFINE state transitions
  - TRACK customer emotional state
  - PROVIDE state analysis for AI

Task 4: 實作對話壓縮器
CREATE src/services/roleplay/dialogueCompressor.ts:
  - COMPRESS dialogue history to reduce tokens
  - EXTRACT key points and metrics
  - IMPLEMENT sliding window compression
  - MAINTAIN critical information

Task 5: 建立回應快取系統
CREATE src/services/roleplay/responseCache.ts:
  - CACHE similar responses
  - IMPLEMENT similarity detection
  - ADD cache expiration logic
  - PROVIDE rewrite functionality

Task 6: 定義客戶原型
CREATE src/services/roleplay/customerPersonas.ts:
  - DEFINE 10 customer archetypes
  - INCLUDE industry variations
  - ADD personality traits
  - SPECIFY triggers and pain points

Task 7: 建立 WebApp 介面
CREATE src/webapps/apps/ai-roleplay/index.html:
  - BUILD chat interface
  - ADD scenario selection
  - IMPLEMENT real-time hints
  - INCLUDE performance metrics

Task 8: 更新 WebApp 載入器
MODIFY src/webapps/webAppLoader.ts:
  - ADD ai-roleplay to webApps collection
  - EXPORT for tool integration

Task 9: 整合到小工具頁面
MODIFY src/screens/tools/ToolsScreen.tsx:
  - ADD AI training tool entry
  - SET proper icon and color
  - CONFIGURE WebApp source

Task 10: 實作核心對話邏輯
CREATE src/services/roleplay/dialogueEngine.ts:
  - ORCHESTRATE all components
  - HANDLE user input processing
  - MANAGE AI responses
  - TRACK session progress

Task 11: 建立測試套件
CREATE src/__tests__/roleplay/:
  - TEST state transitions
  - VERIFY compression efficiency
  - CHECK cache functionality
  - VALIDATE AI responses
```

### Per task pseudocode

```python
# Task 2: OpenAI Integration
async def callOpenAI(prompt: str, options: CallOptions):
    # PATTERN: 使用 fetch 而非 SDK（React Native 限制）
    headers = {
        'Authorization': f'Bearer {EXPO_PUBLIC_OPENAI_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # CRITICAL: Function calling for structured output
    body = {
        'model': options.model || 'gpt-3.5-turbo',
        'messages': messages,
        'functions': [{
            'name': 'analyzeState',
            'parameters': {
                'type': 'object',
                'properties': {
                    'state': {'type': 'string'},
                    'confidence': {'type': 'number'},
                    'reason': {'type': 'string'}
                }
            }
        }],
        'temperature': 0.8,
        'max_tokens': options.maxTokens || 150
    }
    
    # PATTERN: Retry with exponential backoff
    @retry(attempts=3, backoff=exponential)
    async def makeRequest():
        response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        })
        
        if response.status === 429:  # Rate limit
            await delay(1000)
            throw new Error('Rate limited')
        
        return response.json()

# Task 4: Dialogue Compression
def compressDialogue(history: Dialogue[]):
    compressed = {
        'metrics': {
            'turns': len(history),
            'trust': calculateTrust(history),
            'keywords': extractKeywords(history)
        },
        'recent': history[-3:],  # Keep last 3 turns
        'keyEvents': []
    }
    
    # PATTERN: Importance-based compression
    for turn in history:
        importance = classifyImportance(turn)
        if importance in ['critical', 'important']:
            compressed.keyEvents.append({
                'summary': summarizeTurn(turn),
                'type': importance
            })
    
    return compressed  # ~200 tokens vs ~2000 original

# Task 5: Response Cache
class ResponseCache:
    def findSimilar(input: str, state: str):
        # PATTERN: Simple keyword matching (upgradeable to embeddings)
        cacheKey = f"{state}:{normalizeInput(input)}"
        
        if cacheKey in self.cache:
            original = self.cache[cacheKey]
            # CRITICAL: Rewrite to avoid repetition
            return self.rewriteResponse(original)
        
        return None
    
    def rewriteResponse(original: str):
        # Use GPT-3.5 for quick rewrite
        prompt = f"換個方式說（保持{state}語氣）：{original}"
        return await callOpenAI(prompt, {
            model: 'gpt-3.5-turbo',
            maxTokens: 50,
            temperature: 0.7
        })
```

### Integration Points
```yaml
ENVIRONMENT:
  - add to: .env
  - pattern: "EXPO_PUBLIC_OPENAI_API_KEY=sk-..."
  
NAVIGATION:
  - Already supports WebApp navigation
  - No changes needed
  
FIREBASE:
  - add collection: roleplay_sessions
  - add collection: training_progress
  - indexes: 
    - roleplay_sessions: [userId, timestamp]
    - training_progress: [userId, personaId]
  
WEBVIEW:
  - Reuse existing JavaScript Bridge
  - Add new message types:
    - saveSession
    - getProgress
    - updateMetrics
```

## Validation Loop

### Level 1: TypeScript & Linting
```bash
# 檢查 TypeScript 類型
npx tsc --noEmit

# 檢查程式碼風格
npm run lint

# Expected: 無錯誤。如有錯誤，根據訊息修正
```

### Level 2: Unit Tests
```typescript
// src/__tests__/roleplay/stateManager.test.ts
describe('StateManager', () => {
  test('應該正確轉換狀態', () => {
    const manager = new StateManager();
    manager.setState('INITIAL');
    
    manager.processInput('詢問痛點');
    expect(manager.getState()).toBe('INTERESTED');
  });
  
  test('應該處理無效轉換', () => {
    const manager = new StateManager();
    manager.setState('ENDING');
    
    manager.processInput('介紹產品');
    expect(manager.getState()).toBe('ENDING'); // 不應轉換
  });
});

// src/__tests__/roleplay/compression.test.ts
describe('DialogueCompressor', () => {
  test('應該壓縮對話到目標大小', () => {
    const history = generateMockHistory(20); // 20 turns
    const compressed = compressor.compress(history);
    
    const tokens = estimateTokens(compressed);
    expect(tokens).toBeLessThan(300); // Target: <300 tokens
  });
});
```

```bash
# 執行測試
npm test -- roleplay/

# Expected: 全部通過。如失敗，修正程式碼後重跑
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm start

# 測試 WebApp 載入
# 1. 開啟應用程式
# 2. 進入「小工具」
# 3. 點擊「AI 業務訓練」
# 4. 應該看到訓練介面

# 測試對話功能
# 1. 選擇客戶類型
# 2. 開始對話
# 3. 輸入「您好，請問您們目前用什麼系統管理客戶？」
# 4. 應該收到符合客戶個性的回應
```

### Level 4: Cost Validation
```typescript
// 測試成本計算
describe('Cost Optimization', () => {
  test('單次對話成本應低於 $0.03', async () => {
    const session = await runMockSession(20); // 20 turns
    
    const cost = calculateSessionCost(session);
    expect(cost).toBeLessThan(0.03);
    
    console.log(`Session cost: $${cost.toFixed(4)}`);
    console.log(`Tokens used: ${session.totalTokens}`);
  });
});
```

## Final Validation Checklist
- [ ] TypeScript 編譯無錯誤
- [ ] 所有測試通過
- [ ] 單次對話成本 < $0.03
- [ ] AI 回應延遲 < 2 秒
- [ ] 對話壓縮率 > 85%
- [ ] 快取命中率 > 30%
- [ ] WebApp 正常載入
- [ ] 狀態轉換邏輯正確
- [ ] 資深業務測試認可真實度

## Anti-Patterns to Avoid
- ❌ 不要直接傳送完整對話歷史給 AI（太貴）
- ❌ 不要讓 AI 自由發揮角色（會太配合）
- ❌ 不要忽略速率限制（會被封鎖）
- ❌ 不要在前端儲存 API 金鑰（使用環境變數）
- ❌ 不要每次都呼叫 GPT-4（用 GPT-3.5 為主）
- ❌ 不要忽略快取機會（相似問題很多）

---

## 實作優先順序
1. **Phase 1 (MVP)**: 基本對話功能、單一客戶類型、無快取
2. **Phase 2**: 加入狀態機、對話壓縮、成本優化
3. **Phase 3**: 完整客戶原型庫、快取系統、進度追蹤

## 預期成果
- 業務人員可隨時練習銷售技巧
- AI 客戶表現真實，提供有效訓練
- 成本可控，適合大規模使用
- 整合現有系統，使用體驗一致

**信心評分**: 8/10
- 扣分原因：OpenAI API 在 React Native 的整合可能有額外挑戰
- 加分原因：現有 WebApp 架構完善，AI 整合模式清楚