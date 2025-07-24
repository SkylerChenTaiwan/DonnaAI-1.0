name: "Smart Analytics Dialog Redesign"
description: |

## Purpose
將智能分析頁面重新設計為一個從導航欄延伸的對話式覆蓋層，提供簡潔的自然語言查詢介面，並允許用戶保存喜歡的分析結果到主頁。

## Core Principles
1. **簡潔對話式介面**: 移除複雜的UI，專注於對話體驗
2. **覆蓋層設計**: 類似 ActionPopover，從導航欄自然延伸
3. **即時預覽**: 快速顯示分析結果
4. **一鍵保存**: 輕鬆將結果保存到主頁
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
重新設計智能分析介面為：
- 從導航欄中間按鈕彈出的覆蓋層對話框
- 簡潔的對話式查詢介面
- 快速顯示圖表結果
- 一鍵保存到主頁的儀表板

## Why
- 當前介面過於複雜，不符合快速查詢的使用場景
- 全螢幕頁面打斷了用戶的工作流程
- 需要更直覺的對話式體驗
- 保存功能應該更加明顯和便捷

## What
重新設計包含：
1. **AnalyticsDialog 組件**: 取代 SmartAnalyticsScreen
2. **對話式介面**: 簡化的查詢輸入和結果顯示
3. **覆蓋層動畫**: 從導航欄平滑展開
4. **快速保存**: 一鍵保存結果到主頁

### Success Criteria
- [ ] 對話框從導航欄平滑展開
- [ ] 簡潔的對話式查詢介面
- [ ] 即時顯示分析結果
- [ ] 一鍵保存功能正常運作
- [ ] 保存的報表顯示在主頁
- [ ] 良好的動畫和過渡效果

## All Needed Context

### Documentation & References
```yaml
# 現有組件和模式
- file: /src/components/common/ActionPopover.tsx
  why: 參考覆蓋層實現模式，包含動畫和定位邏輯
  
- file: /src/screens/analytics/SmartAnalyticsScreen.tsx
  why: 當前實現，需要提取核心查詢邏輯
  
- file: /src/components/DataVisualization/QueryInterface.tsx
  why: 查詢介面組件，可以簡化後重用
  
- file: /src/components/charts/ChartDisplay.tsx
  why: 圖表顯示組件，直接重用

- file: /src/services/firebase/managerActions.ts
  why: saveReport 函數實現
  
- file: /src/stores/queryStore.ts
  why: 查詢狀態管理，包含 Gemini API 整合

# React Native 動畫文檔
- url: https://reactnative.dev/docs/animated
  why: 實現平滑的展開/收合動畫
  
- url: https://reactnative.dev/docs/modal
  why: Modal 組件參考
```

### Current Codebase tree
```bash
src/
├── components/
│   ├── common/
│   │   └── ActionPopover.tsx        # 覆蓋層模式參考
│   └── DataVisualization/
│       ├── QueryInterface.tsx       # 查詢介面
│       └── ChartDisplay.tsx         # 圖表顯示
├── screens/
│   └── analytics/
│       └── SmartAnalyticsScreen.tsx # 當前實現
└── stores/
    └── queryStore.ts                # 查詢狀態管理
```

### Desired Codebase tree
```bash
src/
├── components/
│   ├── analytics/
│   │   ├── AnalyticsDialog.tsx     # 新增：對話框主組件
│   │   ├── QueryChat.tsx           # 新增：簡化的對話介面
│   │   └── QuickSaveButton.tsx     # 新增：快速保存按鈕
│   └── common/
│       └── ActionPopover.tsx        # 保留作為參考
└── navigation/
    └── MainTabNavigator.tsx         # 修改：整合新的對話框
```

### Known Gotchas
```typescript
// CRITICAL: 動畫性能 - 使用 useNativeDriver
// React Native 動畫必須使用 native driver 以獲得流暢效果

// CRITICAL: Modal 在 Android 的返回鍵處理
// 需要正確處理 onRequestClose

// CRITICAL: 鍵盤處理
// 在顯示鍵盤時調整對話框位置

// CRITICAL: 保存報表需要必填欄位
// name, query, chartType, chartData, isPublic
```

## Implementation Blueprint

### Data models
```typescript
// 對話框狀態
interface AnalyticsDialogState {
  visible: boolean;
  query: string;
  isProcessing: boolean;
  result?: {
    chartType: string;
    chartData: any;
    interpretation: string;
  };
  error?: string;
}

// 快速保存配置
interface QuickSaveConfig {
  name: string;
  isPublic: boolean;
  tags?: string[];
}
```

### List of tasks

```yaml
Task 1:
CREATE src/components/analytics/AnalyticsDialog.tsx:
  - MIRROR: ActionPopover 的覆蓋層結構
  - USE: Modal 組件作為基礎
  - ADD: 從底部滑入的動畫
  - STYLE: 半屏高度，圓角頂部

Task 2:
CREATE src/components/analytics/QueryChat.tsx:
  - SIMPLIFY: 從 QueryInterface 提取核心功能
  - REMOVE: 建議列表、澄清表單等複雜功能
  - KEEP: 基本的文字輸入和發送按鈕
  - ADD: 對話氣泡樣式顯示歷史

Task 3:
MODIFY src/navigation/MainTabNavigator.tsx:
  - FIND: handleManagerActionPress 函數
  - REPLACE: navigation.navigate 改為顯示對話框
  - ADD: AnalyticsDialog 組件和狀態管理
  - PRESERVE: 現有的導航邏輯

Task 4:
CREATE src/components/analytics/QuickSaveButton.tsx:
  - DESIGN: 浮動按鈕樣式
  - SHOW: 只在有結果時顯示
  - DIALOG: 簡單的命名對話框
  - INTEGRATE: 調用 saveReport

Task 5:
INTEGRATE with queryStore:
  - USE: 現有的 processQuery 函數
  - SUBSCRIBE: 查詢狀態更新
  - HANDLE: 錯誤和載入狀態

Task 6:
ADD animations:
  - SLIDE: 從底部滑入效果
  - FADE: 背景遮罩淡入
  - SPRING: 彈性動畫參數
  - GESTURE: 下滑關閉手勢

Task 7:
HANDLE keyboard:
  - ADJUST: 對話框位置when鍵盤顯示
  - USE: KeyboardAvoidingView
  - TEST: iOS 和 Android 行為

Task 8:
TEST save functionality:
  - VERIFY: 報表保存到 Firestore
  - CHECK: 主頁顯示保存的報表
  - CONFIRM: 權限正確
```

### Pseudocode

```typescript
// Task 1: AnalyticsDialog 主結構
const AnalyticsDialog = () => {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  const show = () => {
    setVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11
    }).start();
  };
  
  const hide = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true
    }).start(() => setVisible(false));
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={hide}
    >
      <TouchableWithoutFeedback onPress={hide}>
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.dialog,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0]
                  })
                }]
              }
            ]}
          >
            <QueryChat />
            {result && <ChartDisplay data={result} />}
            {result && <QuickSaveButton onSave={handleSave} />}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Task 2: 簡化的查詢介面
const QueryChat = () => {
  const [query, setQuery] = useState('');
  const { processQuery, isProcessing } = useQueryStore();
  
  const handleSend = async () => {
    if (!query.trim()) return;
    
    // 添加到對話歷史
    addMessage({ type: 'user', text: query });
    
    // 處理查詢
    const result = await processQuery(query);
    
    // 添加結果到對話
    addMessage({ 
      type: 'assistant', 
      text: result.interpretation,
      chart: result.chartData 
    });
    
    setQuery('');
  };
  
  return (
    <View style={styles.chatContainer}>
      <ScrollView style={styles.messages}>
        {messages.map(renderMessage)}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="詢問關於您的業務數據..."
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity onPress={handleSend}>
          <Ionicons name="send" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

### Integration Points
```yaml
NAVIGATION:
  - modify: MainTabNavigator 整合對話框
  - trigger: 從中間按鈕觸發
  - state: 本地狀態管理對話框顯示
  
QUERY_STORE:
  - use: processQuery 函數處理查詢
  - subscribe: 狀態更新
  - handle: 錯誤處理
  
SAVE_FUNCTIONALITY:
  - call: saveReport from managerActions
  - data: 包含 name, query, chartType, chartData
  - refresh: SavedReportsGrid 自動更新
```

## Validation Loop

### Level 1: TypeScript 檢查
```bash
# 檢查所有 TypeScript 錯誤
npx tsc --noEmit

# 預期：無錯誤
```

### Level 2: 動畫測試
```typescript
// 測試動畫流暢度
describe('AnalyticsDialog Animations', () => {
  it('should animate smoothly on open', () => {
    const { getByTestId } = render(<AnalyticsDialog />);
    fireEvent.press(getByTestId('open-button'));
    
    // 驗證動畫值
    expect(slideAnim._value).toBe(0);
    // 等待動畫完成
    await waitFor(() => {
      expect(slideAnim._value).toBe(1);
    });
  });
  
  it('should handle gesture dismissal', () => {
    // 測試下滑關閉
  });
});
```

### Level 3: 查詢功能測試
```typescript
// 測試查詢處理
describe('Query Processing', () => {
  it('should process natural language queries', async () => {
    const { getByPlaceholder, getByText } = render(<QueryChat />);
    const input = getByPlaceholder('詢問關於您的業務數據...');
    
    fireEvent.changeText(input, '本月銷售額');
    fireEvent.submitEditing(input);
    
    await waitFor(() => {
      expect(getByText(/銷售額/)).toBeTruthy();
    });
  });
});
```

### Level 4: 保存功能測試
```bash
# 手動測試流程
1. 開啟對話框
2. 輸入查詢："本月銷售趨勢"
3. 等待結果顯示
4. 點擊保存按鈕
5. 輸入報表名稱
6. 確認保存
7. 返回主頁檢查是否顯示
```

## Final Validation Checklist
- [ ] 對話框動畫流暢
- [ ] 鍵盤處理正確
- [ ] 查詢功能正常
- [ ] 圖表正確顯示
- [ ] 保存功能運作
- [ ] 保存的報表顯示在主頁
- [ ] 手勢關閉功能
- [ ] 錯誤處理完善
- [ ] 載入狀態清晰

---

## Anti-Patterns to Avoid
- ❌ 不要使用全螢幕 - 保持半屏設計
- ❌ 不要過度複雜化介面 - 保持簡潔
- ❌ 不要忽略動畫性能 - 使用 native driver
- ❌ 不要忘記鍵盤處理 - 特別是 Android
- ❌ 不要硬編碼高度 - 使用響應式設計

## 實作優先順序
1. 基礎對話框結構和動畫
2. 簡化的查詢介面
3. 整合查詢處理邏輯
4. 添加保存功能
5. 完善動畫和手勢

## 設計考量
- 使用半透明背景增加層次感
- 圓角頂部符合 iOS 設計語言
- 保持與 ActionPopover 一致的動畫風格
- 對話氣泡樣式提升對話感
- 浮動保存按鈕不干擾內容

---

**信心等級：8/10** - 有明確的參考模式（ActionPopover），核心功能已存在（查詢處理、保存功能），主要工作是UI重構和動畫實現。挑戰在於確保流暢的動畫效果和良好的用戶體驗。