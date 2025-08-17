# PRP-119: 修復 AdaptiveModal Portal 問題 - 統一跨平台實現

## 目標
修復 AdaptiveModal 在 Web 平台上的渲染問題，移除 React DOM createPortal 依賴，統一使用 React Native Modal 實現跨平台相容性。

## 背景與問題分析

### 當前問題
1. **Web 平台破版**：Modal 內容直接渲染在頁面中，而非覆蓋層
2. **API 混用**：Web 版本使用 `react-dom` 的 `createPortal`，但 React Native Web 不支援
3. **平台不一致**：Web 和 Native 使用完全不同的實現方式

### 根本原因
```javascript
// 現有問題代碼 - AdaptiveModal.tsx line 7
import { createPortal } from 'react-dom';  // ❌ React Native Web 不支援

// line 134-144
if (typeof window !== 'undefined' && createPortal) {
  return createPortal(children, portalTarget);  // ❌ 失敗時內容仍被渲染
}
```

### 研究發現
- **React Native Web v0.14.0+ 支援 Modal**：https://necolas.github.io/react-native-web/docs/modal/
- **最佳實踐**：使用原生 Modal 而非絕對定位（2024 年建議）
- **參考資料**：https://solito.dev/recipes/modals

## 技術設計

### 方案選擇：混合方案（方案 C）
保持 Native 平台不變，修復 Web 平台實現

### 架構設計
```typescript
// 偽代碼展示方法
const AdaptiveModal = ({ visible, children, ...props }) => {
  // 移除 createPortal 依賴
  // 統一使用 React Native Modal
  
  if (Platform.OS === 'web') {
    // Web: 使用 React Native Modal（由 RNW 轉換）
    return <Modal visible={visible} transparent={true} {...props}>
      {renderContent()}
    </Modal>
  } else {
    // Native: 保持現有實現
    return <Modal visible={visible} transparent={true} {...props}>
      {renderNativeContent()}
    </Modal>
  }
}
```

## 實施計劃

### Phase 1: 準備工作（10 分鐘）
1. **備份現有檔案**
   ```bash
   cp src/components/adaptive/core/AdaptiveModal.tsx src/components/adaptive/core/AdaptiveModal.tsx.backup
   ```

2. **確認測試環境**
   ```bash
   npm run web:dev  # 確保 Web 開發伺服器運行
   ```

### Phase 2: 移除 createPortal 依賴（20 分鐘）

#### Task 2.1: 清理 imports
```typescript
// 移除
import { createPortal } from 'react-dom';

// 保留
import React, { forwardRef, useMemo, useCallback, useEffect } from 'react';
```

#### Task 2.2: 移除 WebPortal 元件
- 刪除 lines 111-145 的 WebPortal 實現
- 這個元件不再需要

#### Task 2.3: 修改 WebModal 實現
參考現有 NativeModal 實現（lines 516-787），重構 WebModal：

```typescript
const WebModal = forwardRef<any, AdaptiveModalProps>(
  ({ visible = false, children, ...props }, ref) => {
    // 使用 React Native Modal，讓 RNW 處理轉換
    const { Modal, View, TouchableOpacity } = require('react-native');
    
    if (!visible) return null;
    
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType={props.animationType || 'fade'}
        onRequestClose={props.onClose}
      >
        <View style={overlayStyles}>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={handleOverlayClick}
            style={absoluteFillObject}
          >
            <View style={contentStyles}>
              {children}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }
);
```

### Phase 3: 樣式調整（15 分鐘）

#### Task 3.1: 更新覆蓋層樣式
```typescript
const overlayStyleFinal = useMemo(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10000,  // 確保在最上層
}), []);
```

#### Task 3.2: 保留 CSS 作為後備
- 保留 `AdaptiveModal.css` 不變
- React Native Web 會自動應用適當的樣式

### Phase 4: 測試驗證（30 分鐘）

#### Task 4.1: 單元測試
```bash
# 執行現有測試
npm run test src/components/adaptive/core/__tests__/AdaptiveModal.test.tsx
```

#### Task 4.2: 視覺測試
```javascript
// 創建測試腳本 scripts/test-modal-visual.js
const testScenarios = [
  { platform: 'web', url: 'http://localhost:3002' },
  { action: 'navigate', path: '/admin/organization/1HuFLKCrQBOQUp3cURLv' },
  { action: 'click', selector: '[data-testid="assistance-tab"]' },
  { action: 'click', selector: '[data-testid="view-fields-button"]' },
  { action: 'screenshot', name: 'modal-displayed' },
  { action: 'verify', modal: 'visible', overlay: 'present' }
];
```

#### Task 4.3: 跨平台測試清單
- [ ] Web: Modal 顯示為覆蓋層
- [ ] Web: 背景半透明
- [ ] Web: 點擊背景關閉（如啟用）
- [ ] iOS: 保持現有行為
- [ ] Android: 保持現有行為

### Phase 5: 部署與監控（10 分鐘）

#### Task 5.1: Git 提交
```bash
git add -A
git commit -m "fix: 修復 AdaptiveModal Web 平台 Portal 問題

原因: React Native Web 不支援 createPortal API
效果: 
- 統一使用 React Native Modal
- 修復 Web 平台破版問題
- 保持 Native 平台相容性

PRP-119 實施完成"
```

#### Task 5.2: 監控指標
- 錯誤率：Portal 相關錯誤應降為 0
- 效能：渲染時間應保持或改善
- 用戶回饋：Modal 功能正常

## 驗證門檻

### 自動化測試
```bash
# 語法檢查
npm run lint

# 類型檢查
npm run typecheck

# 單元測試
npm test -- AdaptiveModal

# 視覺測試
node scripts/test-modal-visual.js
```

### 手動測試檢查清單
1. [ ] Web 平台：Modal 正確顯示為覆蓋層
2. [ ] Web 平台：無 createPortal 錯誤
3. [ ] iOS 模擬器：功能正常
4. [ ] Android 模擬器：功能正常
5. [ ] CustomFieldsModal：正常開啟/關閉

## 風險與緩解

### 風險 1: React Native Web Modal 相容性
- **緩解**：已確認 RNW v0.14.0+ 支援
- **後備**：保留 CSS 樣式可快速切換回絕對定位方案

### 風險 2: Native 平台回歸
- **緩解**：最小化 Native 代碼改動
- **測試**：充分的自動化測試覆蓋

### 風險 3: 第三方元件相依性
- **檢查**：確認沒有其他元件依賴 WebPortal
- **搜尋**：`grep -r "WebPortal" src/`

## 參考資料

### 內部檔案
- `/src/components/adaptive/core/AdaptiveModal.tsx` - 主要修改檔案
- `/src/components/adaptive/core/__tests__/AdaptiveModal.test.tsx` - 測試檔案
- `/docs/modal-portal-issue-analysis.md` - 問題分析文件

### 外部資源
- [React Native Web Modal 文檔](https://necolas.github.io/react-native-web/docs/modal/)
- [React Native Modal 官方文檔](https://reactnative.dev/docs/modal)
- [Solito Modal 最佳實踐](https://solito.dev/recipes/modals)
- [React Native Web GitHub Issue #1020](https://github.com/necolas/react-native-web/issues/1020)

## 成功標準

1. **功能性**：Modal 在所有平台正確顯示
2. **相容性**：iOS/Android 功能不受影響
3. **效能**：無明顯效能下降
4. **代碼品質**：通過所有 lint 和測試

## 實施時間估計

- Phase 1: 10 分鐘
- Phase 2: 20 分鐘
- Phase 3: 15 分鐘
- Phase 4: 30 分鐘
- Phase 5: 10 分鐘
- **總計**: 85 分鐘

## 信心評分

**8/10** - 高信心一次實施成功

### 評分理由
- ✅ 充分的研究和文檔支援
- ✅ 清晰的實施步驟
- ✅ 完整的測試計劃
- ✅ 風險已識別並有緩解措施
- ⚠️ 扣分：需要跨平台測試驗證

---

**PRP 狀態**: 待執行
**創建時間**: 2025-08-17
**預計執行時間**: 1.5 小時