name: "設定頁面完成實作 PRP"
description: |

## Purpose
完成設定頁面的實作，移除不需要的功能，並確保剩餘功能都能正常運作且資料能持久化。根據使用者要求，需要移除：外觀主題、自動同步、資料使用、團隊通知、審批提醒、報表頻率等選項。

## Core Principles
1. **Context is King**: 包含所有必要的文件、範例和注意事項
2. **Validation Loops**: 提供可執行的測試讓 AI 能執行並修正
3. **Information Dense**: 使用程式碼庫中的關鍵字和模式
4. **Progressive Success**: 從簡單開始，驗證後再增強
5. **Global rules**: 遵循 CLAUDE.md 中的所有規則

---

## Goal
完成設定頁面實作，確保：
1. 移除不需要的設定選項（外觀主題、自動同步、資料使用、團隊通知、審批提醒、報表頻率）
2. 實作剩餘功能的持久化（推播通知、音效設定）
3. 完善現有功能（資料匯出、說明與支援、隱私權政策）
4. 確保設定在應用程式重啟後仍然保留

## Why
- **使用者體驗**：讓使用者的偏好設定能夠保存，提供一致的使用體驗
- **功能完整性**：確保設定頁面的所有功能都能正常運作，而非只是 UI
- **簡化介面**：移除不必要的選項，讓介面更簡潔直觀
- **專注核心功能**：只保留對使用者真正有價值的設定選項

## What
實作以下功能：
1. **推播通知**：切換開關，控制是否接收推播通知
2. **音效**：切換開關，控制應用程式音效（成功、錯誤、提示音）
3. **匯出資料**：將使用者資料匯出為 CSV 或 JSON 格式
4. **說明與支援**：導向幫助文件或支援頁面
5. **隱私權政策**：顯示隱私權政策內容
6. **版本資訊**：顯示應用程式版本號

### Success Criteria
- [ ] 設定值能夠持久化到 AsyncStorage 和 Firebase
- [ ] 推播通知開關能實際控制通知權限
- [ ] 音效開關能控制應用程式內的音效播放
- [ ] 資料匯出功能能正常匯出使用者資料
- [ ] 說明與支援、隱私權政策能正確導航或顯示內容
- [ ] 所有變更都能在應用程式重啟後保留

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: src/screens/settings/SettingsScreen.tsx
  why: 現有設定頁面實作，需要修改此檔案
  
- file: src/services/notifications.ts
  why: 推播通知服務，了解如何控制通知權限
  
- file: src/utils/tableExport.ts
  why: 資料匯出功能，可以直接使用
  
- file: src/hooks/useColumnSettings.ts
  why: AsyncStorage 使用模式參考
  
- file: src/services/firebase/organizations.ts
  why: Firebase 資料儲存模式參考

- url: https://docs.expo.dev/versions/latest/sdk/audio/
  why: expo-audio API 文件，用於音效播放功能

- url: https://docs.expo.dev/versions/latest/sdk/notifications/
  why: expo-notifications API 文件，了解權限控制
```

### Current Codebase tree
```bash
src/
├── screens/
│   └── settings/
│       └── SettingsScreen.tsx         # 設定主頁面
├── components/
│   └── settings/
│       ├── SettingSection.tsx         # 設定區塊元件
│       └── SettingItem.tsx           # 設定項目元件
├── services/
│   ├── notifications.ts              # 通知服務
│   └── firebase/
│       └── organizations.ts          # Firebase 服務參考
├── utils/
│   ├── tableExport.ts               # 資料匯出工具
│   └── sounds.ts                    # (待建立) 音效管理
├── types/
│   └── settings.ts                  # 設定類型定義
└── constants/
    └── storage.ts                   # AsyncStorage keys
```

### Desired Codebase tree with files to be added
```bash
src/
├── screens/
│   └── settings/
│       ├── SettingsScreen.tsx         # 更新：移除不需要的選項
│       ├── PrivacyPolicyScreen.tsx    # 新增：隱私權政策頁面
│       └── HelpSupportScreen.tsx      # 新增：說明與支援頁面
├── services/
│   └── settings.ts                   # 新增：設定服務（持久化）
├── utils/
│   └── sounds.ts                    # 新增：音效管理工具
├── hooks/
│   └── useSettings.ts               # 新增：設定狀態管理 Hook
└── assets/
    └── sounds/                      # 新增：音效檔案目錄
        ├── success.mp3
        ├── error.mp3
        └── notification.mp3
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: expo-notifications 需要在 app.json 中設定權限
// 必須在 expo.plugins 中包含 expo-notifications

// CRITICAL: expo-audio 在 SDK 53 使用新的 useAudioPlayer API
// 舊的 Audio.Sound API 已被棄用

// CRITICAL: AsyncStorage 有 6MB 的大小限制
// 不要儲存大量資料，只儲存設定值

// CRITICAL: Firebase 需要在組織範圍下建立集合
// 設定應該儲存在 organizations/{orgId}/settings/{userId}

// CRITICAL: iOS 需要在 Info.plist 中設定音訊背景模式
// 但我們只是播放短音效，不需要背景播放
```

## Implementation Blueprint

### Data models and structure

```typescript
// src/types/settings.ts - 更新設定介面
export interface UserSettings {
  // 通知設定
  notifications: {
    enabled: boolean;
    lastUpdated?: Date;
  };
  
  // 音效設定
  sounds: {
    enabled: boolean;
    volume?: number; // 0-1
  };
  
  // 元資料
  version: string;
  lastSynced?: Date;
}

// src/services/settings.ts - 設定服務介面
export interface SettingsService {
  loadSettings(): Promise<UserSettings>;
  saveSettings(settings: Partial<UserSettings>): Promise<void>;
  syncWithFirebase(): Promise<void>;
  resetToDefaults(): Promise<void>;
}
```

### list of tasks to be completed to fullfill the PRP in the order they should be completed

```yaml
Task 1: 建立設定服務和 Hook
CREATE src/services/settings.ts:
  - MIRROR pattern from: src/services/firebase/organizations.ts
  - 實作 AsyncStorage 和 Firebase 雙重儲存
  - 包含離線支援和同步機制

CREATE src/hooks/useSettings.ts:
  - MIRROR pattern from: src/hooks/useColumnSettings.ts
  - 使用 zustand 或 React Context 管理狀態
  - 自動同步到 AsyncStorage

Task 2: 建立音效管理工具
CREATE src/utils/sounds.ts:
  - 使用新的 expo-audio useAudioPlayer API
  - 預載入所有音效檔案
  - 提供 playSound(type) 介面

CREATE src/assets/sounds/:
  - 新增 success.mp3, error.mp3, notification.mp3
  - 使用免費音效或系統音效

Task 3: 更新設定頁面，移除不需要的選項
MODIFY src/screens/settings/SettingsScreen.tsx:
  - REMOVE: 外觀主題、自動同步、資料使用選項
  - REMOVE: 管理功能區塊（團隊通知、審批提醒、報表頻率）
  - INTEGRATE: useSettings hook
  - UPDATE: 推播通知切換邏輯
  - UPDATE: 音效切換邏輯
  - UPDATE: 資料匯出功能整合

Task 4: 實作推播通知控制
MODIFY src/services/notifications.ts:
  - ADD: enableNotifications() / disableNotifications() 方法
  - UPDATE: 根據設定決定是否顯示通知
  - HANDLE: iOS 權限撤銷情況

Task 5: 實作資料匯出功能
MODIFY src/screens/settings/SettingsScreen.tsx:
  - INTEGRATE: tableExport.ts 的匯出功能
  - 收集所有使用者資料（會議、任務、客戶等）
  - 提供 CSV 和 JSON 格式選擇

Task 6: 建立說明與支援頁面
CREATE src/screens/settings/HelpSupportScreen.tsx:
  - 顯示常見問題
  - 提供聯絡方式
  - 可選：整合 Intercom 或其他客服工具

Task 7: 建立隱私權政策頁面
CREATE src/screens/settings/PrivacyPolicyScreen.tsx:
  - 使用 WebView 顯示線上隱私權政策
  - 或使用 ScrollView 顯示本地內容
  - 包含最後更新日期

Task 8: 更新導航設定
MODIFY src/navigation files:
  - ADD: PrivacyPolicy 和 HelpSupport 路由
  - UPDATE: 設定頁面的導航邏輯
```

### Per task pseudocode

```typescript
// Task 1: 設定服務實作
// src/services/settings.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';

class SettingsService {
  private readonly STORAGE_KEY = '@donna_ai/user_settings';
  
  async loadSettings(): Promise<UserSettings> {
    // 1. 先從 AsyncStorage 載入（快速）
    const localSettings = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (localSettings) {
      // 2. 背景同步 Firebase（如果線上）
      this.syncWithFirebase().catch(console.error);
      return JSON.parse(localSettings);
    }
    
    // 3. 如果本地沒有，從 Firebase 載入
    const fbSettings = await this.loadFromFirebase();
    if (fbSettings) {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(fbSettings));
      return fbSettings;
    }
    
    // 4. 返回預設值
    return this.getDefaultSettings();
  }
  
  async saveSettings(updates: Partial<UserSettings>): Promise<void> {
    // PATTERN: 樂觀更新 - 先更新本地，再同步遠端
    const current = await this.loadSettings();
    const updated = { ...current, ...updates, lastSynced: new Date() };
    
    // 1. 立即儲存到 AsyncStorage
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    
    // 2. 背景同步到 Firebase
    this.syncToFirebase(updated).catch(console.error);
  }
}

// Task 2: 音效管理
// src/utils/sounds.ts
import { useAudioPlayer, AudioModule } from 'expo-audio';

class SoundManager {
  private players: Map<string, AudioPlayer> = new Map();
  private enabled: boolean = true;
  
  async initialize() {
    // 預載入所有音效
    const sounds = {
      success: require('../assets/sounds/success.mp3'),
      error: require('../assets/sounds/error.mp3'),
      notification: require('../assets/sounds/notification.mp3'),
    };
    
    for (const [key, source] of Object.entries(sounds)) {
      const player = await AudioModule.createPlayer(source);
      this.players.set(key, player);
    }
  }
  
  async playSound(type: 'success' | 'error' | 'notification') {
    if (!this.enabled) return;
    
    const player = this.players.get(type);
    if (player) {
      await player.seekTo(0); // 重置到開頭
      await player.play();
    }
  }
}

// Task 3: 更新設定頁面
// 主要是移除不需要的項目，整合新的 hooks
const sections = [
  {
    id: 'general',
    title: '一般設定',
    items: [
      {
        id: 'notifications',
        title: '推播通知',
        type: 'switch',
        value: settings.notifications.enabled,
        onValueChange: (value) => updateSettings({ notifications: { enabled: value } }),
      },
      {
        id: 'sounds',
        title: '音效',
        type: 'switch',
        value: settings.sounds.enabled,
        onValueChange: (value) => updateSettings({ sounds: { enabled: value } }),
      },
    ],
  },
  // 移除「資料與同步」區塊，只保留匯出功能
  {
    id: 'data',
    title: '資料管理',
    items: [
      {
        id: 'export',
        title: '匯出資料',
        type: 'action',
        action: handleExportData,
      },
    ],
  },
];

// Task 5: 資料匯出實作
async function handleExportData() {
  // 使用 ActionSheet 讓使用者選擇格式
  const format = await showActionSheet(['CSV', 'JSON', '取消']);
  if (format === '取消') return;
  
  // 收集所有資料
  const data = {
    meetings: await meetingService.getAllMeetings(),
    tasks: await taskService.getAllTasks(),
    customers: await customerService.getAllCustomers(),
    exportDate: new Date().toISOString(),
    version: Constants.expoConfig.version,
  };
  
  // 使用現有的 tableExport 工具
  if (format === 'CSV') {
    // 需要將巢狀資料轉換為表格格式
    await exportToCSV(flattenData(data), 'donna_ai_export');
  } else {
    await exportToJSON(data, 'donna_ai_export');
  }
}
```

### Integration Points
```yaml
ASYNCSTORAGE:
  - key: "@donna_ai/user_settings"
  - 結構: UserSettings 物件的 JSON
  
FIREBASE:
  - collection: "organizations/{orgId}/settings"
  - document: "{userId}"
  - 即時同步但不阻塞 UI
  
NAVIGATION:
  - add to: src/navigation/types.ts
  - screens: "PrivacyPolicy", "HelpSupport"
  - stack: SettingsStack
  
NOTIFICATIONS:
  - 整合: src/services/notifications.ts
  - 新增方法: enableNotifications(), disableNotifications()
  - 檢查權限: getPermissionsAsync()
```

## Validation Loop

### Level 1: Syntax & Style
```bash
# 檢查 TypeScript 類型
npm run typecheck

# 檢查程式碼風格
npm run lint

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Unit Tests
```typescript
// src/__tests__/services/settings.test.ts
describe('SettingsService', () => {
  it('應該載入預設設定', async () => {
    const settings = await settingsService.loadSettings();
    expect(settings.notifications.enabled).toBe(true);
    expect(settings.sounds.enabled).toBe(true);
  });
  
  it('應該儲存設定到 AsyncStorage', async () => {
    await settingsService.saveSettings({ 
      notifications: { enabled: false } 
    });
    const saved = await AsyncStorage.getItem('@donna_ai/user_settings');
    expect(JSON.parse(saved).notifications.enabled).toBe(false);
  });
  
  it('應該同步到 Firebase', async () => {
    // Mock Firebase 呼叫
    const spy = jest.spyOn(firestore, 'setDoc');
    await settingsService.syncWithFirebase();
    expect(spy).toHaveBeenCalled();
  });
});

// src/__tests__/utils/sounds.test.ts
describe('SoundManager', () => {
  it('應該預載入所有音效', async () => {
    await soundManager.initialize();
    expect(soundManager.isReady()).toBe(true);
  });
  
  it('應該在啟用時播放音效', async () => {
    soundManager.setEnabled(true);
    await soundManager.playSound('success');
    // 驗證播放被呼叫
  });
  
  it('應該在停用時不播放音效', async () => {
    soundManager.setEnabled(false);
    await soundManager.playSound('success');
    // 驗證播放未被呼叫
  });
});
```

```bash
# 執行測試
npm test -- --coverage

# If failing: Read error, understand root cause, fix code, re-run
```

### Level 3: Integration Test
```bash
# 啟動開發伺服器
npm start

# 手動測試流程：
1. 開啟設定頁面
2. 切換推播通知開關 - 應該要求權限或更新權限
3. 切換音效開關 - 測試其他頁面的音效是否停用
4. 點擊匯出資料 - 應該成功匯出檔案
5. 重啟應用程式 - 設定應該保留
6. 離線測試 - 設定應該仍可使用

# 預期結果：所有功能正常運作，設定能持久化
```

## Final validation Checklist
- [ ] 所有測試通過：`npm test`
- [ ] 無 TypeScript 錯誤：`npm run typecheck`
- [ ] 無 lint 錯誤：`npm run lint`
- [ ] 推播通知開關能實際控制通知
- [ ] 音效開關能控制應用程式音效
- [ ] 資料匯出產生有效的 CSV/JSON 檔案
- [ ] 設定在應用程式重啟後保留
- [ ] 離線時設定功能仍可使用
- [ ] Firebase 同步不影響 UI 效能

---

## Anti-Patterns to Avoid
- ❌ 不要在每次設定變更時都等待 Firebase 同步
- ❌ 不要將大量資料儲存在 AsyncStorage（6MB 限制）
- ❌ 不要忽略 iOS 的通知權限被使用者撤銷的情況
- ❌ 不要在主執行緒載入音效檔案
- ❌ 不要假設使用者永遠有網路連線
- ❌ 不要硬編碼隱私權政策內容（應該可以更新）

## Additional Notes

### 音效檔案來源建議
- 使用 Expo 內建的系統音效
- 或從 freesound.org 下載免費音效
- 保持檔案小於 100KB 以加快載入

### 權限處理注意事項
- iOS: 使用者可能在系統設定中關閉通知
- Android: 需要處理通知頻道設定
- 提供引導使用者到系統設定的選項

### 資料匯出考量
- 考慮資料量限制（大量資料可能造成記憶體問題）
- 提供匯出進度顯示
- 允許選擇匯出範圍（日期、類型等）

---

**信心評分：9/10**

此 PRP 提供了完整的實作指引，包含：
- 清楚的需求（移除特定功能）
- 現有程式碼的完整參考
- 詳細的實作步驟和模式
- 可執行的驗證方法
- 常見問題的解決方案

唯一扣分是音效檔案需要另外準備，但已提供明確的取得方式。