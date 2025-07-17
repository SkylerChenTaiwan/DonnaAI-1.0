name: AI 會議記錄與智能分析系統
description: |
  實作完整的 AI 會議記錄功能，支援實時錄音、音訊編輯、AI 智能分析、
  自動資料提取和會議提醒通知。提供多種補救錄音方式，包含語音摘要和文字輸入。

## Core Principles

1. **Context is King**: 本 PRP 充分利用現有的後端基礎設施（85% 已完成），專注於前端音訊處理和使用者體驗
2. **Validation Loops**: 每個功能模組都有對應的測試和驗證機制，確保音訊處理、AI 分析和使用者互動的可靠性
3. **Information Dense**: 提供完整的實作指南、程式碼範例和整合說明，基於 Expo 生態系統和 Firebase 後端
4. **Progressive Success**: 按照使用者故事流程實作，從基礎錄音到進階 AI 分析，確保每個步驟都可獨立驗證
5. **Global rules**: 遵循 CLAUDE.md 的所有規則，特別是繁體中文註解和 Git 提交規範

## Goal

實作完整的 AI 會議記錄系統，支援：
1. 會議提醒推播通知
2. 實時音訊錄製與即時狀態回饋
3. 簡單音訊編輯功能（剪切、去除不需要部分）
4. AI 自動轉錄與智能分析
5. 結構化資料提取與使用者確認流程
6. 多種補救錄音方式（語音摘要、文字輸入）

## Why

- **Business Value**: 解決業務員會議記錄的痛點，提供自動化的 CRM 資料更新和任務生成
- **Efficiency**: 減少手動資料輸入時間，提高資料準確性和一致性
- **Integration**: 充分整合現有的 AI 分析能力和資料庫系統
- **Problems Solved**: 
  - 會議記錄遺漏或不完整
  - 手動 CRM 資料更新耗時
  - 重要任務和跟進事項遺失
  - 客戶資訊更新不及時

## What

### User-Visible Behavior

**主要流程（用戶故事 1）：**
1. 會議前收到推播提醒「記得錄音」
2. 開會時啟動錄音功能，即時顯示錄音狀態
3. 會議結束停止錄音，系統自動建立會議記錄
4. 選擇「立即處理」或「先編輯再處理」
5. 如選擇立即處理：音訊 → 逐字稿 → AI 分析 → 資料提取建議
6. 使用者確認/修改 AI 建議，完成 CRM 更新

**編輯流程（用戶故事 2）：**
1. 選擇「先編輯再處理」
2. 簡單音訊剪輯介面，移除不需要的部分
3. 編輯完成後進入 AI 處理流程

**補救流程（用戶故事 3-4）：**
1. 會後發現忘記錄音，可選擇「語音摘要」或「文字摘要」
2. 語音摘要：錄製口述會議內容，進入 AI 處理流程
3. 文字摘要：直接輸入文字，進入 AI 分析流程

### Technical Requirements

- React Native + Expo 音訊錄製與播放
- Expo Notifications 推播通知系統
- 音訊檔案上傳至 Firebase Storage
- 整合現有的 Cloud Functions AI 處理管道
- 實時狀態同步與進度顯示
- 音訊波形視覺化與編輯功能
- 離線錄音支援與同步機制

## Success Criteria

- [ ] 成功實作會議提醒推播通知系統
- [ ] 實時音訊錄製功能，支援背景錄音
- [ ] 音訊編輯功能，支援剪切和片段移除
- [ ] AI 轉錄與分析流程完整運作
- [ ] 結構化資料提取與使用者確認介面
- [ ] 補救錄音功能（語音摘要、文字輸入）
- [ ] 整合現有客戶和任務資料庫
- [ ] 離線錄音與自動同步機制
- [ ] 音訊檔案壓縮與儲存優化
- [ ] 完整的錯誤處理與使用者回饋
- [ ] 單元測試覆蓋率 > 80%
- [ ] 通過所有平台測試（iOS/Android）

## Context

### Documentation & References

```yaml
expo_docs:
  - url: https://docs.expo.dev/versions/latest/sdk/audio/
    sections: ["Audio Recording", "Permissions", "Background Audio"]
  - url: https://docs.expo.dev/versions/latest/sdk/notifications/
    sections: ["Push Notifications", "Local Notifications", "Scheduling"]
  - url: https://docs.expo.dev/push-notifications/push-notifications-setup/
    sections: ["FCM Setup", "iOS Configuration", "Device Registration"]

react_native_audio:
  - url: https://github.com/OzkanAbdullahoglu/react-native-audio-trimmer
    sections: ["Audio Buffer Manipulation", "Trimming Implementation"]
  - url: https://medium.com/trackstack/simple-audio-waveform-with-wavesurfer-js-and-react-ae6c0653b240
    sections: ["Waveform Visualization", "Audio Editing UI"]

existing_codebase:
  - file: functions/src/audio-processing.ts
    purpose: 完整的後端音訊處理管道，支援多格式轉錄
  - file: functions/src/ai-analysis.ts
    purpose: AI 分析服務，支援 OpenAI 和 Anthropic
  - file: src/services/firebase/records.ts
    purpose: 會議記錄 CRUD 服務，音訊檔案上傳
  - file: src/types/record.ts
    purpose: 完整的會議記錄類型定義
  - file: src/services/firebase/ai-confirmations.ts
    purpose: AI 建議確認流程管理
```

### Current Codebase Strengths

我們已經具備的基礎設施（85% 完成度）：
```
後端服務 ✅:
├── functions/src/audio-processing.ts     # 音訊轉錄 Cloud Function
├── functions/src/ai-analysis.ts          # AI 分析服務
├── functions/src/ai-processing-api.ts    # 統一 AI API 端點
└── functions/src/field-extraction.ts     # 欄位提取服務

資料庫服務 ✅:
├── src/services/firebase/records.ts      # 會議記錄 CRUD
├── src/services/firebase/customers.ts    # 客戶資料管理
├── src/services/firebase/tasks.ts        # 任務管理
└── src/services/firebase/ai-confirmations.ts # AI 確認流程

類型定義 ✅:
├── src/types/record.ts                   # 會議記錄類型
├── src/types/custom-fields.ts           # 自訂欄位類型
└── src/types/task.ts                     # 任務類型

需要新增 ❌:
├── 前端音訊錄製組件
├── 音訊編輯功能
├── 推播通知服務
└── 會議相關 UI 組件
```

### Known Gotchas & Library Quirks

**Expo Audio 限制：**
- 音訊錄製在 iOS 模擬器中不支援，需要實體設備測試
- 同一時間只能有一個錄製實例存在
- 背景錄音需要在 `app.json` 中配置 `UIBackgroundModes: ["audio"]`
- Web 平台需要 HTTPS 才能存取麥克風

**推播通知限制：**
- 不支援 Expo Go，只能在獨立應用中運作
- Android 模擬器和 iOS 模擬器不支援推播通知
- 需要實體設備和 Firebase FCM 配置

**音訊編輯挑戰：**
- React Native 缺乏原生音訊編輯 API
- 需要使用 audio buffer 操作進行剪輯
- 大檔案處理可能面臨記憶體限制

## Implementation Blueprint

### Data Models Extension

基於現有的 `RecordDoc` 類型，擴充支援音訊錄製功能：

```typescript
// 擴充 src/types/record.ts
interface RecordDoc extends FirestoreDoc {
  // 現有欄位...
  
  // 音訊錄製相關
  audioRecordingState?: {
    status: 'recording' | 'paused' | 'stopped' | 'editing' | 'processing';
    startTime?: Timestamp;
    endTime?: Timestamp;
    duration?: number;          // 秒數
    fileSize?: number;          // bytes
    format?: string;            // mp3, wav, m4a
    trimSettings?: {            // 編輯設定
      originalDuration: number;
      trimStart: number;        // 秒數
      trimEnd: number;          // 秒數
    };
  };
  
  // 處理偏好設定
  processingPreference?: 'immediate' | 'edit_first' | 'manual';
  
  // 補救錄音標識
  recordingType?: 'live' | 'voice_summary' | 'text_summary';
  
  // 使用者確認狀態
  userConfirmationStatus?: {
    aiSuggestionsReviewed: boolean;
    customModifications?: Record<string, any>;
    confirmedAt?: Timestamp;
    rejectedSuggestions?: string[];
  };
}

// 新增音訊編輯相關類型
interface AudioEditingSession {
  recordId: string;
  originalAudioUrl: string;
  editedAudioUrl?: string;
  waveformData?: number[];     // 波形視覺化資料
  editHistory: Array<{
    action: 'trim' | 'cut' | 'volume_adjust';
    timestamp: Date;
    parameters: Record<string, any>;
  }>;
  isEditing: boolean;
}

// 推播通知類型
interface MeetingReminder {
  id: string;
  meetingId?: string;
  userId: string;
  scheduledTime: Timestamp;
  reminderType: 'pre_meeting' | 'in_meeting' | 'post_meeting';
  notificationSent: boolean;
  userResponse?: 'dismissed' | 'snoozed' | 'started_recording';
}
```

### Task List

```yaml
tasks:
  - id: setup-audio-dependencies
    name: 設置音訊相關依賴
    dependencies: []
    description: |
      安裝和配置 expo-av、expo-notifications 和音訊編輯相關套件
      更新 app.json 支援背景音訊和推播通知
      配置 Firebase FCM 推播通知服務
      
  - id: implement-notification-system
    name: 實作推播通知系統
    dependencies: [setup-audio-dependencies]
    description: |
      建立 src/services/notifications.ts
      實作會議提醒通知邏輯
      整合 Firebase FCM 和 Expo Notifications
      建立通知權限請求流程
      
  - id: implement-audio-recording
    name: 實作音訊錄製組件
    dependencies: [setup-audio-dependencies]
    description: |
      建立 src/components/audio/AudioRecorder.tsx
      實作錄音控制（開始/暫停/停止/恢復）
      實作錄音狀態視覺化（時間、波形、狀態）
      處理錄音權限和錯誤狀態
      支援背景錄音功能
      
  - id: implement-audio-editing
    name: 實作音訊編輯功能
    dependencies: [implement-audio-recording]
    description: |
      建立 src/components/audio/AudioEditor.tsx
      實作音訊波形顯示
      實作簡單剪輯功能（剪切、移除片段）
      音訊預覽播放功能
      編輯歷史記錄與復原功能
      
  - id: implement-recording-workflow
    name: 實作錄音流程控制
    dependencies: [implement-audio-recording]
    description: |
      建立 src/screens/meetings/RecordingScreen.tsx
      實作錄音完成後的選擇流程
      整合「立即處理」vs「先編輯」邏輯
      音訊檔案上傳到 Firebase Storage
      觸發後端 AI 處理流程
      
  - id: implement-ai-confirmation-ui
    name: 實作 AI 建議確認介面
    dependencies: [implement-recording-workflow]
    description: |
      建立 src/components/ai/ConfirmationInterface.tsx
      顯示 AI 提取的客戶資料和任務建議
      支援使用者修改和補充
      整合現有的 ai-confirmations 服務
      批次確認和個別確認功能
      
  - id: implement-makeup-recording
    name: 實作補救錄音功能
    dependencies: [implement-recording-workflow]
    description: |
      實作會後語音摘要錄製
      實作文字摘要輸入介面
      整合補救錄音與正常錄音的 AI 處理流程
      建立補救錄音的 UI 提示和引導
      
  - id: implement-meeting-screens
    name: 實作會議相關畫面
    dependencies: [implement-ai-confirmation-ui]
    description: |
      更新 src/screens/meetings/MeetingsScreen.tsx
      建立會議列表、詳情、編輯畫面
      整合錄音狀態顯示
      實作會議搜尋和篩選功能
      
  - id: integrate-existing-services
    name: 整合現有服務
    dependencies: [implement-meeting-screens]
    description: |
      擴充 src/services/firebase/records.ts 支援音訊錄製
      更新 src/stores/ 相關狀態管理
      整合客戶和任務資料庫服務
      確保跨資料庫查詢正常運作
      
  - id: implement-offline-support
    name: 實作離線支援
    dependencies: [integrate-existing-services]
    description: |
      實作離線錄音與本地存儲
      離線時的狀態管理和資料同步
      網路恢復後的自動上傳和處理
      離線錄音的品質優化
      
  - id: optimize-and-test
    name: 優化與測試
    dependencies: [implement-offline-support]
    description: |
      音訊檔案壓縮和品質優化
      記憶體使用優化和大檔案處理
      撰寫單元測試和整合測試
      跨平台測試（iOS/Android）
      性能測試和用戶體驗優化
```

### Per Task Pseudocode

#### Task: setup-audio-dependencies
```bash
# 1. 安裝音訊和通知相關依賴
npm install expo-av expo-notifications expo-file-system

# 2. 更新 app.json 配置
# 添加背景音訊和推播通知權限
{
  "expo": {
    "plugins": [
      "expo-av",
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#2563eb"
      }]
    ],
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"],
        "NSMicrophoneUsageDescription": "此應用需要錄音權限來記錄會議內容"
      }
    },
    "android": {
      "permissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}

# 3. 配置 Firebase FCM
# 在 Firebase Console 設置 FCM 服務
# 下載並配置 google-services.json (Android) 和 GoogleService-Info.plist (iOS)
```

#### Task: implement-audio-recording
```typescript
// src/components/audio/AudioRecorder.tsx
import { useState, useEffect, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [duration, setDuration] = useState(0);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  // 1. 初始化音訊模式
  const initializeAudio = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
    });
  };

  // 2. 開始錄音
  const startRecording = async () => {
    if (permissionResponse?.status !== 'granted') {
      await requestPermission();
    }
    
    await initializeAudio();
    
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    
    setRecording(recording);
    setRecordingStatus('recording');
    
    // 設置狀態更新計時器
    const timer = setInterval(async () => {
      const status = await recording.getStatusAsync();
      setDuration(status.durationMillis / 1000);
    }, 1000);
  };

  // 3. 停止錄音並處理檔案
  const stopRecording = async () => {
    if (!recording) return;
    
    setRecording(null);
    setRecordingStatus('stopped');
    
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    
    const uri = recording.getURI();
    if (uri) {
      // 檔案壓縮和格式轉換（如需要）
      onRecordingComplete(uri);
    }
  };

  // 4. 錄音控制 UI
  return (
    <View>
      <RecordingStatusDisplay status={recordingStatus} duration={duration} />
      <RecordingControls 
        onStart={startRecording}
        onStop={stopRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        status={recordingStatus}
      />
      <WaveformVisualization recording={recording} />
    </View>
  );
};
```

#### Task: implement-ai-confirmation-ui
```typescript
// src/components/ai/ConfirmationInterface.tsx
import { useState, useEffect } from 'react';
import { useAIConfirmationStore } from '../../stores/aiConfirmationStore';

export const ConfirmationInterface = ({ recordId }: { recordId: string }) => {
  const { 
    confirmationData, 
    updateFieldMapping, 
    confirmSuggestions, 
    rejectSuggestions 
  } = useAIConfirmationStore();

  // 1. 載入 AI 建議
  useEffect(() => {
    loadAIConfirmationData(recordId);
  }, [recordId]);

  // 2. 處理使用者修改
  const handleFieldModification = (fieldKey: string, newValue: any) => {
    updateFieldMapping(fieldKey, {
      ...confirmationData.fieldMappings[fieldKey],
      extractedValue: newValue,
      userModified: true
    });
  };

  // 3. 批次確認
  const handleBatchConfirm = async () => {
    const confirmedMappings = confirmationData.fieldMappings.filter(
      mapping => mapping.confidence > 0.7 || mapping.userModified
    );
    
    await confirmSuggestions(recordId, confirmedMappings);
    
    // 觸發 CRM 更新
    await updateCustomerDatabase(confirmedMappings);
    await createTasksFromSuggestions(confirmationData.taskSuggestions);
  };

  return (
    <ScrollView>
      {/* 客戶資料建議 */}
      <CustomerDataSuggestions 
        suggestions={confirmationData.customerFieldMappings}
        onModify={handleFieldModification}
      />
      
      {/* 任務建議 */}
      <TaskSuggestions 
        suggestions={confirmationData.taskSuggestions}
        onModify={handleTaskModification}
      />
      
      {/* 確認按鈕 */}
      <ConfirmationButtons 
        onConfirmAll={handleBatchConfirm}
        onRejectAll={handleBatchReject}
        onSelectiveConfirm={handleSelectiveConfirm}
      />
    </ScrollView>
  );
};
```

### Integration Points

本功能與現有系統的整合點：

**Cloud Functions 整合：**
- `functions/src/audio-processing.ts` - 直接使用現有的音訊轉錄功能
- `functions/src/ai-analysis.ts` - 整合現有的 AI 分析管道
- `functions/src/field-extraction.ts` - 使用現有的欄位提取服務

**資料庫整合：**
- `src/services/firebase/records.ts` - 擴充支援音訊錄製狀態
- `src/services/firebase/customers.ts` - 整合 AI 建議的客戶資料更新
- `src/services/firebase/tasks.ts` - 整合從會議內容自動產生的任務

**狀態管理整合：**
- `src/stores/recordStore.ts` - 擴充支援錄音狀態管理
- `src/stores/aiConfirmationStore.ts` - 直接使用現有的 AI 確認狀態管理

## Validation Loop

### Level 1: Syntax & Style ✓
```bash
# TypeScript 編譯檢查
npm run type-check

# ESLint 檢查
npm run lint

# 格式化檢查
npm run format:check
```

### Level 2: Unit Tests ✓
```bash
# 執行所有單元測試
npm run test

# 音訊功能測試
npm run test src/components/audio/

# AI 確認介面測試
npm run test src/components/ai/

# 測試覆蓋率檢查（目標 > 80%）
npm run test:coverage
```

### Level 3: Integration Test ✓
```bash
# 啟動 Firebase 模擬器
npm run emulators:start

# 執行整合測試
npm run test:integration

# 測試項目：
# - 音訊錄製和上傳流程
# - AI 處理和確認流程
# - 推播通知功能
# - 離線錄音和同步
```

### Level 4: Platform Testing ✓
```bash
# iOS 實體設備測試
npx expo run:ios --device

# Android 實體設備測試
npx expo run:android --device

# 測試項目：
# - 音訊錄製權限和功能
# - 背景錄音能力
# - 推播通知接收
# - 音訊品質和檔案大小
```

## Final Validation Checklist

### 功能驗證
- [ ] 會議提醒推播通知正常運作 ✓
- [ ] 實時音訊錄製功能穩定 ✓
- [ ] 音訊編輯功能滿足需求 ✓
- [ ] AI 轉錄準確率符合預期 ✓
- [ ] 資料提取和確認流程順暢 ✓
- [ ] 補救錄音功能完整 ✓
- [ ] 離線錄音和同步機制穩定 ✓

### 技術驗證
- [ ] 所有 TypeScript 類型檢查通過 ✓
- [ ] 單元測試覆蓋率 > 80% ✓
- [ ] 整合測試全部通過 ✓
- [ ] iOS 和 Android 平台測試通過 ✓
- [ ] 音訊檔案大小和品質優化 ✓
- [ ] 記憶體使用在合理範圍 ✓

### 用戶體驗驗證
- [ ] 錄音介面直觀易用 ✓
- [ ] AI 建議確認流程清晰 ✓
- [ ] 錯誤處理和使用者回饋完善 ✓
- [ ] 載入狀態和進度指示明確 ✓
- [ ] 多語言支援（繁體中文）✓

## Anti-Patterns to Avoid

- ❌ 不要在錄音過程中進行重量級操作（避免影響錄音品質）
- ❌ 不要忽略音訊檔案的記憶體管理（及時釋放不需要的音訊物件）
- ❌ 不要在主執行緒進行音訊檔案處理（使用 Web Workers 或背景處理）
- ❌ 不要忽略不同平台的音訊格式相容性
- ❌ 不要在沒有權限時嘗試錄音（提供清晰的權限請求說明）
- ❌ 不要忽略音訊檔案的安全性（上傳前進行加密）
- ❌ 不要在網路不穩定時強制上傳大檔案（實作斷點續傳）

---

**信心評分: 9/10**

本 PRP 充分利用現有的 85% 後端基礎設施，專注於前端音訊處理和使用者體驗實作。
有完整的技術研究支撐、清晰的實作路徑和詳細的驗證機制。
唯一的不確定性在於音訊編輯功能的 React Native 實作複雜度，但已有開源專案可參考。