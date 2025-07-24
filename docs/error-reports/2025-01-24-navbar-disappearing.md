# 導航欄消失問題分析報告

**日期**: 2025-01-24
**問題描述**: 底部導航欄（TabBar）在某些情況下消失

## 問題分析

### 1. 導航結構檢查

經過檢查，目前的導航結構如下：
- **AppNavigator**: 主導航器，使用 Stack Navigator
- **MainTabNavigator**: 底部標籤導航器，使用 Bottom Tab Navigator
- 所有主要頁面（Home、Database、Tools、Settings）都設置了 `headerShown: false`

### 2. 潛在問題點

#### 2.1 TabBar 樣式配置
```javascript
tabBarStyle: {
  height: 88,
  paddingBottom: 20,
  paddingTop: 10,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  position: 'absolute', // 🚨 關鍵問題
  bottom: 0,
  elevation: 0,
  shadowOpacity: 0,
}
```

**問題**: `position: 'absolute'` 可能導致 TabBar 被其他元素覆蓋。

#### 2.2 ActionPopover Modal
- 使用全屏 Modal (`<Modal transparent>`)
- 有一個覆蓋層 (overlay) 可能遮擋導航欄
- Modal 的樣式：
  ```javascript
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
  }
  ```

#### 2.3 頁面內容的 paddingBottom
- EnhancedDashboardV2 有設置 `paddingBottom: 120` 來避免被導航欄擋住
- 但如果導航欄是 `position: 'absolute'`，內容可能會覆蓋它

### 3. 可能的觸發場景

1. **打開 ActionPopover 時**
   - Modal 的 overlay 可能覆蓋導航欄
   - 雖然設置了 `bottom: panelBottom`，但可能計算有誤

2. **頁面滾動時**
   - 因為 TabBar 是 `position: 'absolute'`
   - 某些滾動內容可能覆蓋導航欄

3. **特定頁面**
   - Settings 頁面有 `headerShown: true`，其他頁面都是 `false`
   - 可能在頁面切換時出現問題

4. **開發者工具模態框**
   - 當開發者工具的 Modal 頁面打開時

## 解決方案

### 方案 1: 移除 absolute 定位（推薦）
**優點**:
- 導航欄永遠不會被覆蓋
- 更穩定的佈局

**缺點**:
- 可能需要調整所有頁面的 paddingBottom

**實施**:
```javascript
tabBarStyle: {
  height: 88,
  paddingBottom: 20,
  paddingTop: 10,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  // 移除 position: 'absolute'
  // 移除 bottom: 0
  elevation: 8, // 增加陰影
  shadowOpacity: 0.1,
}
```

### 方案 2: 調整 ActionPopover 的 overlay
**優點**:
- 最小化改動
- 只影響 Modal 行為

**缺點**:
- 只解決部分問題

**實施**:
```javascript
// 修改 overlay 的 bottom 值，不覆蓋導航欄
overlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: panelBottom || (tabBarHeight + insets.bottom),
  backgroundColor: '#000000',
}
```

### 方案 3: 使用 zIndex 層級管理
**優點**:
- 保持現有佈局
- 精確控制層級

**缺點**:
- 可能在不同設備上表現不一致

**實施**:
```javascript
tabBarStyle: {
  // ... 其他樣式
  zIndex: 999,
  elevation: 10,
}
```

## 建議

1. **優先採用方案 1**，徹底解決問題
2. 如果方案 1 影響太大，可以先採用方案 2 + 方案 3 的組合
3. 需要在多個設備和場景下測試驗證

## 影響評估

- **方案 1**: 需要檢查並調整所有頁面的底部間距
- **方案 2**: 只影響 ActionPopover 組件
- **方案 3**: 風險最小，但可能不能完全解決問題

## 下一步行動

1. 確認具體是在什麼情況下導航欄消失
2. 選擇合適的解決方案
3. 實施並測試
4. 監控是否還有其他相關問題