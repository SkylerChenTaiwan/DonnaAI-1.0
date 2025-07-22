# PRP-21: 記錄模態框 UI 簡化與優化

## Goal
簡化新增記錄模態框的使用者介面，移除多餘的標題和選項，創造更直觀、美觀的錄音體驗。將選擇錄音用途的步驟移到錄音完成後，讓使用者能更快速地開始錄音。

## Why
- **降低認知負荷**: 當前介面有太多標題和選項（新增紀錄、建立紀錄、改用文字輸入、語音輸入、選擇錄音用途），造成使用者困惑
- **提升使用效率**: 直接顯示錄音按鈕，讓使用者能立即開始核心操作
- **改善視覺體驗**: 參考現代錄音應用的簡潔設計，創造更專業、美觀的介面
- **優化操作流程**: 將次要選項（文字輸入）和錄音用途選擇移到更合適的時機

## What
重新設計 CreateRecordModal 的介面和流程：

### 主要改進項目：
1. **簡化主介面**
   - 移除多餘的標題和說明文字
   - 中央放置大型錄音按鈕作為視覺焦點
   - 頂部放置小型文字連結切換到文字輸入

2. **重新排序操作流程**
   - 開啟模態框 → 直接顯示錄音介面
   - 錄音完成後 → 選擇錄音用途
   - 選擇用途後 → 儲存記錄

3. **優化視覺設計**
   - 採用更現代的錄音介面設計
   - 錄音按鈕使用橘色主題（#FF6B35）
   - 簡潔的波形顯示和計時器
   - 清晰的視覺層次結構

### 參考設計
用戶提供的截圖顯示了一個優秀的錄音介面設計：
- 中央大型錄音按鈕
- 上方顯示錄音波形
- 簡潔的計時器顯示
- 最小化的UI元素

### Success Criteria
- [x] 開啟 CreateRecordModal 直接看到錄音按鈕，無需選擇
- [x] 頂部有明顯但不干擾的「文字輸入」連結
- [x] 錄音完成後才出現用途選擇
- [x] 整體視覺更簡潔、專業
- [x] 保持所有現有功能，只優化流程和UI

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/screens/modals/CreateRecordModal.tsx
  why: 需要重新設計此模態框的介面和流程
  
- file: src/components/input/AudioInput.tsx
  why: 需要修改錄音組件，移除初始的用途選擇階段
  
- file: src/components/audio/AudioRecorder.tsx
  why: 了解錄音組件的介面，可能需要調整樣式
  
- file: src/components/modals/InputMethodLink.tsx
  why: 使用此組件顯示切換到文字輸入的連結
  
- file: src/theme/colors.ts
  why: 使用新的橘色主題系統
  
- file: PRPs/16v-ui-color-scheme-update.md
  why: 參考新的色彩系統定義
```

### Current Codebase tree
```bash
src/
├── screens/modals/
│   └── CreateRecordModal.tsx          # 主要修改目標
├── components/
│   ├── input/
│   │   └── AudioInput.tsx             # 需要簡化流程
│   ├── audio/
│   │   └── AudioRecorder.tsx          # 錄音UI組件
│   └── modals/
│       └── InputMethodLink.tsx        # 切換連結組件
└── theme/
    └── colors.ts                      # 橘色主題定義
```

### Desired Codebase tree with files to be added and responsibility of file
```bash
src/
├── screens/modals/
│   └── CreateRecordModal.tsx          # 修改：簡化介面，重新設計佈局
├── components/
│   ├── input/
│   │   ├── AudioInput.tsx             # 修改：移除初始用途選擇
│   │   └── SimplifiedAudioInput.tsx   # 新增：簡化版錄音組件
│   └── modals/
│       └── RecordPurposeSelector.tsx  # 新增：錄音用途選擇器組件
```

### Known Gotchas & Library Quirks
```typescript
// CRITICAL: 錄音權限處理
// 必須在開始錄音前請求權限，但不要在UI中過度強調

// CRITICAL: 模態框狀態管理
// 錄音完成後需要保持音頻數據，同時切換到用途選擇

// CRITICAL: 導航參數
// 保持與現有 mode 參數的兼容性

// CRITICAL: 主題顏色使用
// 使用新的橘色主題系統：
// primary: "#FF5C00" -> 改為 "#FF6B35"（根據現有代碼）
// 確保與其他組件的一致性
```

## Implementation Blueprint

### Data models and structure

```typescript
// 更新錄音流程狀態
type RecordingFlow = 'recording' | 'purpose-selection' | 'saving';

// 錄音用途選擇器的 props
interface RecordPurposeSelectorProps {
  visible: boolean;
  onSelect: (purpose: AudioPurpose) => void;
  onCancel: () => void;
  audioUri: string;
  duration: number;
}

// 簡化的音頻輸入 props
interface SimplifiedAudioInputProps {
  onComplete: (audioUri: string, duration: number) => void;
  disabled?: boolean;
}
```

### List of tasks to be completed in the order they should be completed

```yaml
Task 1: 創建錄音用途選擇器組件
CREATE src/components/modals/RecordPurposeSelector.tsx:
  - 創建模態框組件顯示錄音用途選項
  - 使用與 ActionPopover 相似的底部彈出設計
  - 顯示各個用途選項（會議、筆記、任務、客戶、其他）
  - 選擇後回調並關閉

Task 2: 創建簡化版音頻輸入組件
CREATE src/components/input/SimplifiedAudioInput.tsx:
  - 基於 AudioInput 但移除用途選擇階段
  - 直接顯示錄音介面
  - 中央大型錄音按鈕（使用橘色主題）
  - 簡潔的波形顯示
  - 錄音完成後回調音頻數據

Task 3: 重新設計 CreateRecordModal
MODIFY src/screens/modals/CreateRecordModal.tsx:
  - 簡化標題為單一的「新增紀錄」
  - 移除多餘的說明文字
  - 音頻模式：使用 SimplifiedAudioInput
  - 頂部添加小型 InputMethodLink 切換到文字
  - 錄音完成後顯示 RecordPurposeSelector
  - 選擇用途後才儲存

Task 4: 優化視覺設計
UPDATE 樣式定義:
  - 使用橘色主題（#FF6B35）作為錄音按鈕
  - 增大錄音按鈕尺寸（80x80 或更大）
  - 優化間距和對齊
  - 確保文字輸入連結不過於突出
  - 波形使用柔和的灰色調

Task 5: 調整錄音組件樣式
MODIFY src/components/audio/AudioRecorder.tsx 樣式:
  - 調整錄音按鈕顏色和大小
  - 優化波形顯示樣式
  - 確保與整體設計一致

Task 6: 測試和優化流程
VALIDATE:
  - 測試完整錄音流程
  - 確保狀態管理正確
  - 驗證錯誤處理
  - 優化過渡動畫
```

### Per task pseudocode

```typescript
// Task 1: RecordPurposeSelector
const RecordPurposeSelector = ({ visible, onSelect, onCancel, audioUri, duration }) => {
  const purposes = [
    { key: 'meeting', title: '會議記錄', icon: 'people-outline' },
    { key: 'note', title: '補充記錄', icon: 'document-text-outline' },
    { key: 'task', title: '任務說明', icon: 'checkbox-outline' },
    { key: 'customer', title: '客戶通話', icon: 'call-outline' },
    { key: 'other', title: '其他用途', icon: 'mic-outline' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <Text style={styles.title}>選擇錄音類型</Text>
          <Text style={styles.duration}>
            錄音長度：{formatDuration(duration)}
          </Text>
          {purposes.map(purpose => (
            <TouchableOpacity
              key={purpose.key}
              style={styles.purposeOption}
              onPress={() => onSelect(purpose.key)}
            >
              <Ionicons name={purpose.icon} size={24} />
              <Text>{purpose.title}</Text>
            </TouchableOpacity>
          ))}
          <Button title="取消" variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
};

// Task 2: SimplifiedAudioInput
const SimplifiedAudioInput = ({ onComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  
  return (
    <View style={styles.container}>
      {/* 波形顯示區域 */}
      <View style={styles.waveformContainer}>
        {isRecording && <WaveformVisualizer />}
      </View>
      
      {/* 計時器 */}
      <Text style={styles.timer}>{formatDuration(duration)}</Text>
      
      {/* 錄音按鈕 */}
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recording]}
        onPress={handleRecordPress}
        disabled={disabled}
      >
        <Ionicons 
          name={isRecording ? "stop" : "mic"} 
          size={40} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      {/* 提示文字 */}
      <Text style={styles.hint}>
        {isRecording ? '點擊停止錄音' : '點擊開始錄音'}
      </Text>
    </View>
  );
};

// Task 3: 重新設計 CreateRecordModal
const CreateRecordModal = () => {
  const [recordingData, setRecordingData] = useState(null);
  const [showPurposeSelector, setShowPurposeSelector] = useState(false);
  
  const handleAudioComplete = (audioUri, duration) => {
    setRecordingData({ audioUri, duration });
    setShowPurposeSelector(true);
  };
  
  const handlePurposeSelect = async (purpose) => {
    // 儲存錄音與選定的用途
    await saveRecording({
      ...recordingData,
      purpose,
      type: purpose === 'meeting' ? 'meeting' : 'note',
    });
    navigation.goBack();
  };
  
  return (
    <Layout style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>新增紀錄</Text>
        <View style={styles.spacer} />
      </View>
      
      {mode === 'audio' ? (
        <View style={styles.content}>
          {/* 文字輸入連結 - 小而不突兀 */}
          <TouchableOpacity
            style={styles.textInputLink}
            onPress={switchToText}
          >
            <Text style={styles.linkText}>使用文字輸入</Text>
            <Ionicons name="arrow-forward" size={16} color="#FF6B35" />
          </TouchableOpacity>
          
          {/* 簡化的錄音介面 */}
          <SimplifiedAudioInput
            onComplete={handleAudioComplete}
            disabled={loading}
          />
        </View>
      ) : (
        // 文字輸入模式保持不變
      )}
      
      {/* 錄音用途選擇器 */}
      <RecordPurposeSelector
        visible={showPurposeSelector}
        onSelect={handlePurposeSelect}
        onCancel={() => setShowPurposeSelector(false)}
        audioUri={recordingData?.audioUri}
        duration={recordingData?.duration}
      />
    </Layout>
  );
};
```

### Integration Points
```yaml
NAVIGATION:
  - 保持現有的路由參數結構
  - mode 參數繼續支援 'audio' | 'text'

STATE_MANAGEMENT:
  - 錄音數據需要在組件間傳遞
  - 用途選擇後才進行實際儲存

UI/UX:
  - 使用現有的橘色主題系統
  - 保持與其他模態框的視覺一致性
  - 確保過渡動畫流暢

ERROR_HANDLING:
  - 錄音權限被拒絕時的處理
  - 錄音失敗時的重試機制
  - 儲存失敗時的錯誤提示
```

## Validation Loop

### Level 1: Syntax & Style  
```bash
# 執行 TypeScript 編譯檢查
npm run type-check

# 執行 ESLint 檢查
npm run lint

# 預期：無錯誤，如有警告需評估是否修復
```

### Level 2: Component Tests
```typescript
// 測試簡化的錄音流程
describe('SimplifiedAudioInput', () => {
  test('直接顯示錄音按鈕無需選擇', () => {
    const { getByTestId, queryByText } = render(
      <SimplifiedAudioInput onComplete={jest.fn()} />
    );
    
    expect(getByTestId('record-button')).toBeTruthy();
    expect(queryByText('選擇錄音用途')).toBeFalsy();
  });
  
  test('錄音完成後觸發回調', async () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <SimplifiedAudioInput onComplete={onComplete} />
    );
    
    // 模擬錄音流程
    fireEvent.press(getByTestId('record-button'));
    await waitFor(() => {
      fireEvent.press(getByTestId('record-button')); // 停止
    });
    
    expect(onComplete).toHaveBeenCalledWith(
      expect.any(String), // audioUri
      expect.any(Number)  // duration
    );
  });
});

// 測試用途選擇器
describe('RecordPurposeSelector', () => {
  test('顯示所有用途選項', () => {
    const { getByText } = render(
      <RecordPurposeSelector
        visible={true}
        onSelect={jest.fn()}
        onCancel={jest.fn()}
        audioUri="test.mp3"
        duration={30}
      />
    );
    
    expect(getByText('會議記錄')).toBeTruthy();
    expect(getByText('補充記錄')).toBeTruthy();
    expect(getByText('任務說明')).toBeTruthy();
    expect(getByText('客戶通話')).toBeTruthy();
    expect(getByText('其他用途')).toBeTruthy();
  });
});
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm start

# 手動測試流程：
# 1. 點擊 + 按鈕選擇「紀錄」
# 2. 應直接看到錄音介面，中央有大錄音按鈕
# 3. 頂部應有「使用文字輸入」連結
# 4. 點擊錄音按鈕開始錄音
# 5. 再次點擊停止錄音
# 6. 應出現用途選擇器
# 7. 選擇用途後儲存成功

# 視覺檢查：
# - 錄音按鈕應為橘色 (#FF6B35)
# - 介面應簡潔無多餘標題
# - 文字輸入連結應小而不突兀
```

## Final validation Checklist
- [ ] 所有測試通過：`npm test`
- [ ] 無 TypeScript 錯誤：`npm run type-check`
- [ ] 無 ESLint 警告：`npm run lint`
- [ ] 開啟模態框直接顯示錄音介面
- [ ] 文字輸入連結位置合適且功能正常
- [ ] 錄音完成後才出現用途選擇
- [ ] 視覺設計簡潔專業
- [ ] 橘色主題應用正確
- [ ] 所有原有功能保持正常

---

## Anti-Patterns to Avoid
- ❌ 不要在錄音前強制選擇用途
- ❌ 不要顯示多餘的標題和說明文字
- ❌ 不要讓文字輸入連結過於突出
- ❌ 不要破壞現有的功能邏輯
- ❌ 不要忽略錯誤處理
- ❌ 不要使用舊的藍色主題顏色

## PRP 信心評分
**評分: 8.5/10**

這個 PRP 具有很高的實作成功信心，因為：
- ✅ 需求明確，有參考截圖
- ✅ 主要是 UI 重新排列，技術風險低
- ✅ 基於現有組件，不需要新的技術棧
- ✅ 有清晰的實作步驟和驗證方法

扣分原因：
- ⚠️ 需要協調多個組件的狀態管理
- ⚠️ 錄音權限和錯誤處理需要仔細測試

---

執行此 PRP 時的重要提醒：
1. 保持介面極度簡潔，避免添加任何不必要的元素
2. 確保錄音按鈕足夠大且易於點擊（建議至少 80x80 像素）
3. 文字輸入連結應該存在但不搶眼
4. 用途選擇器應該快速流暢，不打斷使用者流程
5. 所有顏色使用新的橘色主題系統