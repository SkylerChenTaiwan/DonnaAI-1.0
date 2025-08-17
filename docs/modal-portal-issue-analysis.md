# CustomFieldsModal Portal 問題分析報告

## 問題描述
Modal 顯示為頁面內容的一部分，而不是覆蓋層（Overlay）

## 根本原因

### 1. React Native Web 的限制
- **createPortal 不被支援** - React Native Web 不支援 React DOM 的 Portal API
- **Modal 組件不相容** - React Native 的 Modal 在 Web 上行為不同

### 2. 當前實現的問題
```javascript
// AdaptiveModal.tsx line 507-511
return portal ? (
  <WebPortal target={portalTarget}>
    {modalContent}
  </WebPortal>
) : modalContent;  // 問題：Portal 失敗時仍返回內容
```

當 Portal 創建失敗時，Modal 內容直接被返回並渲染在組件樹中。

### 3. WebPortal 實現問題
```javascript
// line 134-144
try {
  if (typeof window !== 'undefined' && createPortal) {
    return createPortal(children, portalTarget);
  }
} catch (error) {
  console.error('❌ Portal creation failed:', error);
}
// 降級方案：不渲染任何內容
return null;
```

雖然有錯誤處理，但主組件仍然返回 modalContent。

## 網路資料支持

根據 Stack Overflow 和 React Native 社區：
1. "React Native doesn't have position: 'fixed'. That said, if you use position: 'absolute' for an element at the root of your app, it will render on top of every other element."
2. "For Android platform, regardless of the zIndex, elevation, component that comes after a component has higher zIndex."
3. "React doesn't support the createPortal() API on the server"

## 解決方案

### 方案 A：移除 Portal 依賴（推薦）
```javascript
// 不使用 Portal，直接使用固定定位
const WebModal = () => {
  if (!visible) return null;
  
  return (
    <div
      className="adaptive-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        ...overlayStyleFinal
      }}
    >
      {modalContent}
    </div>
  );
};
```

### 方案 B：條件渲染在根層級
將 Modal 渲染邏輯移到應用的根層級（App.tsx），確保它總是在 DOM 樹的最後。

### 方案 C：使用第三方庫
考慮使用專為 React Native Web 設計的 Modal 庫。

## 建議的修復步驟

1. **立即修復**：修改 AdaptiveModal.tsx，移除 Portal 邏輯
2. **測試驗證**：確保 Modal 在所有平台上正常工作
3. **長期優化**：考慮重構整個 Modal 系統

## 預期結果
- Modal 顯示為覆蓋層，有半透明背景
- 內容居中顯示
- 點擊背景可以關閉（如果啟用）
- 不破壞頁面佈局