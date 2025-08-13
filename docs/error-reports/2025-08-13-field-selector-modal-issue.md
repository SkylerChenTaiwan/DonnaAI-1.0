# 欄位選擇器 Modal 無法開啟問題分析報告

**日期**: 2025-08-13  
**報告者**: Claude  
**問題狀態**: 分析中

## 問題描述
使用者報告在資料匯入精靈的欄位映射頁面，無法打開欄位選擇器（下拉選單）。

## 技術調查結果

### 1. 程式碼結構分析
**檔案位置**: `/src/components/import/stages/FieldMapper.tsx`

#### 關鍵發現：
1. **Platform.OS 條件判斷問題**
   - Web 平台使用條件渲染 `{Platform.OS === 'web' ? ... : ...}`
   - Web 版本不使用真正的 Modal 元件，而是用 View 模擬
   - Native 版本使用 React Native 的 Modal 元件

2. **狀態管理**
   ```typescript
   const [showFieldSelector, setShowFieldSelector] = useState(false);
   const [currentMappingIndex, setCurrentMappingIndex] = useState<number>(-1);
   ```
   - 點擊時會設定 `showFieldSelector` 為 true
   - 有 console.log 偵錯訊息確認狀態變更

3. **Web 平台 Modal 實作**
   ```jsx
   {Platform.OS === 'web' ? (
     showFieldSelector && (
       <View style={styles.modalOverlay}>
         <View style={styles.modalContent}>
           // Modal 內容
         </View>
       </View>
     )
   ) : (
     <Modal visible={showFieldSelector}>
       // Native Modal
     </Modal>
   )}
   ```

### 2. 樣式問題分析

#### modalOverlay 樣式：
```javascript
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20,
  ...Platform.select({
    web: {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      // 可能缺少 width 和 height
    }
  })
}
```

### 3. 可能的問題原因

1. **Z-index 層級問題**
   - Web 平台的 modalOverlay 可能被其他元素覆蓋
   - 沒有設定適當的 z-index

2. **尺寸問題**
   - position: 'fixed' 需要明確的 width 和 height
   - flex: 1 在 fixed 定位下可能無效

3. **React Native Web 相容性**
   - View 元件在 Web 上渲染為 div
   - 某些樣式屬性可能不完全相容

4. **事件傳播問題**
   - TouchableOpacity/Pressable 在 Web 上的行為差異
   - 可能有事件冒泡或捕獲的問題

## 其他可能受影響的區域

需要檢查以下使用類似 Modal 模式的元件：
1. 關聯編輯器 Modal（同檔案）
2. 其他使用 Platform.OS 條件渲染 Modal 的地方
3. 下拉選單元件
4. 彈出式選擇器

## 建議解決方案

### 方案 A: 修復 Web Modal 樣式
```javascript
modalOverlay: {
  ...Platform.select({
    web: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
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

### 方案 B: 使用 React Native Web 的 Modal
- 移除 Platform.OS 判斷
- 統一使用 React Native 的 Modal 元件
- React Native Web 會自動處理相容性

### 方案 C: 使用第三方 Modal 套件
- 考慮使用更成熟的跨平台 Modal 解決方案
- 例如：react-native-modal 或自訂 Portal 實作

## 測試建議

1. **本地測試**
   - 在 Web 環境測試 Modal 開啟
   - 檢查開發者工具中的元素層級
   - 確認事件監聽器是否正確綁定

2. **跨平台測試**
   - 確保修復不影響 Native 平台
   - 測試所有使用 Modal 的頁面

3. **效能測試**
   - 確認 Modal 開關不會造成記憶體洩漏
   - 檢查重複開關的效能

## 下一步行動

1. 先在本地環境重現問題
2. 實施方案 A（最小改動）
3. 測試驗證
4. 如果方案 A 無效，考慮方案 B 或 C
5. 同步檢查其他類似問題