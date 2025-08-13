# Modal 實作方案比較分析

**日期**: 2025-08-13  
**分析者**: Claude

## 方案 B：統一使用 React Native Modal

### ✅ **優點**

1. **架構一致性**
   - 單一程式碼路徑，無需 Platform.OS 判斷
   - 降低維護複雜度
   - 避免平台特定的 bug

2. **程式碼簡潔**
   ```jsx
   // 簡單統一的寫法
   <Modal visible={showFieldSelector}>
     {content}
   </Modal>
   ```

3. **React Native Web 自動處理**
   - RNW 0.14.0+ 版本已支援 Modal
   - 自動處理 Web 平台的相容性轉換

### ❌ **缺點與限制**

1. **React Native Web Modal 限制**
   - **不完整的 API 支援**：並非所有 props 都被支援
   - **多重 Modal 問題**：同時顯示多個 Modal 可能導致凍結
   - **Focus 管理**：需要手動處理焦點陷阱和鍵盤導航

2. **Web 平台特有問題**
   - **無 position: fixed 支援**：RNW 使用 absolute 定位模擬
   - **Z-index 層級**：可能被其他絕對定位元素覆蓋
   - **Escape 鍵處理**：需要手動實作關閉功能

3. **效能考量**
   - RNW Modal 在 Web 上會創建額外的 DOM 層級
   - 可能影響 SEO（如果需要）

4. **自訂樣式限制**
   - Web 上的 Modal 樣式可能需要額外的 CSS 調整
   - 動畫效果可能不一致

## 方案 A：修復現有 Web 樣式

### ✅ **優點**
- 完全控制 Web 平台的行為
- 可以優化 Web 特定的使用體驗
- 避免 RNW Modal 的限制

### ❌ **缺點**
- 需要維護兩套程式碼
- 增加測試複雜度

## 方案 C：使用第三方套件

### 選項 1：react-native-modal
- ✅ 更豐富的功能（滑動關閉、自訂動畫）
- ✅ 更好的跨平台支援
- ❌ 增加依賴
- ❌ 仍基於原生 Modal，繼承其限制

### 選項 2：自訂 Portal 實作
- ✅ 完全控制渲染行為
- ✅ 解決多重 Modal 問題
- ❌ 需要較多開發工作
- ❌ 需要自行處理無障礙功能

## 🎯 **建議**

### 短期解決方案（立即修復）
**採用方案 A**：修復現有 Web 樣式
```javascript
modalOverlay: {
  ...Platform.select({
    web: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    default: {
      flex: 1
    }
  })
}
```

### 長期架構改善
1. **評估 react-native-modal**
   - 測試其 Web 相容性
   - 評估對現有功能的影響

2. **建立統一的 Modal 元件**
   ```typescript
   // components/common/UniversalModal.tsx
   export const UniversalModal = ({ visible, children, ...props }) => {
     if (Platform.OS === 'web') {
       // 使用 Portal 或自訂實作
       return <WebModal visible={visible} {...props}>{children}</WebModal>
     }
     return <Modal visible={visible} {...props}>{children}</Modal>
   }
   ```

3. **逐步遷移**
   - 先修復緊急問題
   - 建立新的統一元件
   - 逐步替換所有 Modal 使用

## 測試重點

無論選擇哪個方案，都需要測試：
1. 單一 Modal 開關
2. 多重 Modal 場景
3. 鍵盤無障礙（Tab、Escape）
4. 行動裝置觸控
5. 不同瀏覽器相容性