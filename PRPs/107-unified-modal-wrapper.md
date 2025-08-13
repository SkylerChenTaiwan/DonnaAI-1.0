# PRP-107: 建立統一 Modal 包裝元件

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: 🔄 待執行  
**優先級**: 🔴 高  
**類型**: 🏗️ 架構重構  
**信心分數**: 9/10  
**前置條件**: PRP-106 完成（Modal 審計）

## 📋 背景

React Native Web 對 Modal 的支援有限，導致需要大量 Platform.OS 條件判斷。建立統一的 Modal 包裝元件可以：
- 封裝平台差異
- 簡化使用方式
- 確保一致的行為

## 🎯 目標

1. 建立可跨平台使用的 UnifiedModal 元件
2. 完全封裝 Platform.OS 邏輯
3. 提供一致的 API 介面
4. 支援所有現有 Modal 功能

## 🏗️ 技術設計

### 元件架構

```typescript
// /src/components/common/UnifiedModal.tsx
interface UnifiedModalProps {
  visible: boolean;
  onClose?: () => void;
  onRequestClose?: () => void;
  animationType?: 'none' | 'slide' | 'fade';
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
  transparent?: boolean;
  children: React.ReactNode;
  // Web 特定屬性
  webOverlayStyle?: ViewStyle;
  webContentStyle?: ViewStyle;
  webZIndex?: number;
  webClickOutsideToClose?: boolean;
  webEscapeKeyToClose?: boolean;
}
```

### 實作策略

#### Native 平台
```typescript
// 直接使用 React Native Modal
return (
  <Modal
    visible={visible}
    onRequestClose={onRequestClose || onClose}
    animationType={animationType}
    presentationStyle={presentationStyle}
    transparent={transparent}
    statusBarTranslucent
  >
    {children}
  </Modal>
);
```

#### Web 平台
```typescript
// 使用 Portal + 絕對定位
return createPortal(
  visible ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: webZIndex || 999999,
        ...overlayStyles
      }}
      onClick={handleOverlayClick}
      onKeyDown={handleEscapeKey}
    >
      <div style={contentStyles}>
        {children}
      </div>
    </div>
  ) : null,
  document.body
);
```

## 📝 實作步驟

### 步驟 1：建立基礎元件結構
```bash
# 建立元件檔案
touch src/components/common/UnifiedModal.tsx
touch src/components/common/UnifiedModal.web.tsx
```

### 步驟 2：實作 Native 版本
```typescript
// UnifiedModal.tsx (Native)
import { Modal } from 'react-native';

export const UnifiedModal = (props) => {
  return <Modal {...nativeProps}>{children}</Modal>;
};
```

### 步驟 3：實作 Web 版本
```typescript
// UnifiedModal.web.tsx
import { createPortal } from 'react-dom';

export const UnifiedModal = (props) => {
  // Portal 實作
  // 焦點管理
  // 鍵盤事件處理
  // 動畫支援
};
```

### 步驟 4：建立測試檔案
```typescript
// __tests__/UnifiedModal.test.tsx
describe('UnifiedModal', () => {
  // Native 測試
  // Web 測試
  // 跨平台行為一致性測試
});
```

### 步驟 5：建立使用文件
```markdown
// docs/unified-modal-usage.md
# UnifiedModal 使用指南
- API 文件
- 遷移指南
- 最佳實踐
```

## 🧪 測試計劃

### 功能測試
- [ ] Native: Modal 正常顯示/隱藏
- [ ] Web: Portal 正確渲染
- [ ] Web: 點擊外部關閉功能
- [ ] Web: ESC 鍵關閉功能
- [ ] Web: 焦點管理正確
- [ ] 動畫效果在兩平台一致

### 相容性測試
- [ ] iOS Safari
- [ ] Chrome
- [ ] Firefox
- [ ] React Native iOS
- [ ] React Native Android

### 效能測試
- [ ] 記憶體洩漏檢查
- [ ] Portal 清理驗證
- [ ] 事件監聽器清理

## 📊 成功指標

1. **技術指標**
   - Zero Platform.OS 檢查在使用端
   - 100% 測試覆蓋率
   - 無 TypeScript 錯誤

2. **使用者體驗**
   - 行為在所有平台一致
   - 無視覺差異
   - 響應速度快

## ⚠️ 風險評估

### 風險項目
1. **Portal 相容性** (中風險)
   - 緩解：提供 fallback 方案
   
2. **焦點管理複雜度** (低風險)
   - 緩解：使用 focus-trap 函式庫

3. **動畫同步** (低風險)
   - 緩解：使用 CSS transitions

## 📁 影響檔案

### 新增檔案
- `/src/components/common/UnifiedModal.tsx`
- `/src/components/common/UnifiedModal.web.tsx`
- `/src/components/common/__tests__/UnifiedModal.test.tsx`
- `/docs/unified-modal-usage.md`

### 修改檔案
- `/src/components/common/index.ts` (匯出新元件)

## ⏱️ 預估時間

- 元件開發：45 分鐘
- 測試撰寫：30 分鐘
- 文件撰寫：15 分鐘
- **總計：90 分鐘**

## 🔄 相依性

### 前置 PRP
- PRP-106：Modal 審計（已完成）

### 後續 PRP
- PRP-108：遷移 FieldMapper.tsx
- PRP-109：遷移其他 Modal

## 📝 實作檢查清單

開發前：
- [ ] 確認 PRP-106 審計結果
- [ ] 準備測試環境
- [ ] 安裝必要套件（如 focus-trap）

開發中：
- [ ] 建立基礎元件結構
- [ ] 實作 Native 版本
- [ ] 實作 Web 版本
- [ ] 撰寫單元測試
- [ ] 跨平台測試

開發後：
- [ ] 更新文件
- [ ] Code Review
- [ ] 效能測試
- [ ] 準備遷移指南

---

*此 PRP 是 Plan B 的核心元件，將作為所有 Modal 遷移的基礎。*