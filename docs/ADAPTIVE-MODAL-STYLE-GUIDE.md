# AdaptiveModal 樣式指南

## 概述

AdaptiveModal 元件提供跨平台統一的模態框體驗，並具有智能的樣式優先級管理系統。本文件說明樣式優先級行為和最佳實踐。

## 樣式優先級系統

### 優先級層級

AdaptiveModal 使用 StylePriorityManager 來管理樣式優先級，從低到高的順序為：

1. **DEFAULT (1)**: 元件預設樣式
2. **SIZE_PRESET (11)**: 尺寸預設值 (`small`, `medium`, `large`, `fullscreen`)
3. **USER_STYLE (21)**: 通用 `style` prop
4. **PLATFORM_STYLE (31)**: 平台特定樣式 (`webStyle`/`nativeStyle`)
5. **CONTENT_STYLE (41)**: 內容特定樣式 (`contentStyle`)
6. **PROTECTED_SIZE (52)**: 保護的尺寸屬性（僅用於 `fullscreen`）

### 保護機制

當設定 `size="fullscreen"` 時，以下屬性會被自動保護，不會被其他樣式覆蓋：

- `width`
- `height`
- `maxWidth`
- `maxHeight`
- `minHeight`

## 使用範例

### 基本使用

```tsx
// ✅ 正確：使用 size 屬性設定尺寸
<AdaptiveModal
  visible={visible}
  size="fullscreen"
  onClose={handleClose}
>
  {content}
</AdaptiveModal>
```

### 樣式覆蓋行為

```tsx
// ⚠️ 警告：contentStyle 的尺寸屬性會被忽略（開發模式會有警告）
<AdaptiveModal
  visible={visible}
  size="fullscreen"
  contentStyle={{
    width: '50%',      // 被忽略
    height: '50%',     // 被忽略
    padding: 20,       // 生效
    backgroundColor: 'white'  // 生效
  }}
>
  {content}
</AdaptiveModal>
```

### 非 fullscreen 尺寸

```tsx
// ✅ 對於非 fullscreen 尺寸，contentStyle 可以覆蓋尺寸
<AdaptiveModal
  visible={visible}
  size="medium"
  contentStyle={{
    width: '500px',    // 生效
    height: '400px'    // 生效
  }}
>
  {content}
</AdaptiveModal>
```

## 開發模式警告

在開發模式下，當 `contentStyle` 嘗試覆蓋受保護的屬性時，會在控制台顯示警告：

```
⚠️ AdaptiveModal: contentStyle 嘗試覆蓋 size="fullscreen" 的屬性: width, height。
這些屬性將被忽略以保持 fullscreen 效果。
```

## 常見問題

### Q: 為什麼我的 contentStyle 設定的寬高沒有生效？

A: 當使用 `size="fullscreen"` 時，尺寸相關屬性會被保護以確保正確的全螢幕顯示。如果需要自定義尺寸，請使用其他 size 值或不設定 size。

### Q: 如何完全自定義 Modal 尺寸？

A: 有兩種方法：

1. 不設定 `size` 屬性，直接使用 `style` 或 `contentStyle`
2. 使用 `size="medium"` 或其他非 fullscreen 值，然後用 `contentStyle` 覆蓋

```tsx
// 方法 1：不設定 size
<AdaptiveModal
  visible={visible}
  contentStyle={{
    width: '80vw',
    height: '60vh'
  }}
>
  {content}
</AdaptiveModal>

// 方法 2：使用非 fullscreen size
<AdaptiveModal
  visible={visible}
  size="medium"
  contentStyle={{
    width: '80vw',
    height: '60vh'
  }}
>
  {content}
</AdaptiveModal>
```

### Q: 如何除錯樣式優先級問題？

A: 在開發模式下，StylePriorityManager 會輸出詳細的除錯資訊：

```tsx
<AdaptiveModal
  visible={visible}
  size="fullscreen"
  // 開啟除錯模式（開發環境預設開啟）
  debugStyle={true}
>
  {content}
</AdaptiveModal>
```

除錯資訊會顯示：
- 樣式來源列表
- 樣式衝突
- 最終解析的值

## 最佳實踐

### DO ✅

1. **優先使用 size 屬性**：讓預設的尺寸邏輯發揮作用
   ```tsx
   <AdaptiveModal size="fullscreen" />
   ```

2. **使用 contentStyle 調整非尺寸樣式**：如內邊距、背景色等
   ```tsx
   <AdaptiveModal
     size="fullscreen"
     contentStyle={{ padding: 20, backgroundColor: '#f5f5f5' }}
   />
   ```

3. **使用平台特定樣式處理平台差異**
   ```tsx
   <AdaptiveModal
     webStyle={{ backdropFilter: 'blur(5px)' }}
     nativeStyle={{ elevation: 5 }}
   />
   ```

### DON'T ❌

1. **避免在 fullscreen 模式下設定尺寸樣式**
   ```tsx
   // ❌ 錯誤
   <AdaptiveModal
     size="fullscreen"
     contentStyle={{ width: '90%', height: '90%' }}
   />
   ```

2. **避免混用多個尺寸定義方式**
   ```tsx
   // ❌ 錯誤：同時使用 size 和 style 定義尺寸
   <AdaptiveModal
     size="large"
     style={{ width: 800 }}
   />
   ```

3. **避免忽略開發模式的警告**
   - 開發模式的警告通常指出潛在的問題
   - 及時修正可以避免生產環境的 UI 問題

## 遷移指南

如果你的程式碼中有類似的 workaround：

```tsx
// 舊的 workaround
<AdaptiveModal
  size="fullscreen"
  webStyle={{
    width: '95vw',
    height: '95vh',
    maxWidth: '95vw',
    maxHeight: '95vh'
  }}
  contentStyle={{
    width: '100%',
    height: '100%'
  }}
/>
```

可以簡化為：

```tsx
// 新的正確用法
<AdaptiveModal
  size="fullscreen"
/>
```

系統會自動處理尺寸保護，確保 fullscreen 正確顯示。

## 相關文件

- [樣式系統架構](./WEB-STYLE-SYSTEM.md)
- [樣式開發指南](./STYLE-DEVELOPMENT-GUIDE.md)
- [Adaptive 元件使用規範](../CLAUDE.md#adaptive-元件使用規範強制執行)