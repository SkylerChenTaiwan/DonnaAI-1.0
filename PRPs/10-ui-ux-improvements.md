# PRP-10: UI/UX 介面優化

**功能名稱**: UI/UX 介面改進與優化  
**建立日期**: 2025-07-19  
**目標**: 解決現有介面的五個主要問題，提升使用者體驗  
**優先級**: 高  
**預估時間**: 4-6 小時  

## 📋 功能需求

### 1. 修正 + 按鈕行為
- **現況**: 點擊 + 號後，整個頁面會被 Modal 覆蓋
- **期望**: 從 navbar 向上延伸一個小型浮動面板，顯示三個操作按鈕，背景頁面保持可見但調暗

### 2. 調整 Navbar 位置
- **現況**: Navbar 太靠下，部分內容被裝置邊緣遮擋
- **期望**: 適當調高 Navbar 位置，確保完整顯示並留出安全邊距

### 3. 移除不必要的頁面標題
- **現況**: 每頁頂部都有標題（首頁、資料庫、小工具、設定）
- **期望**: 只保留設定頁的標題，其他頁面移除以節省空間

### 4. 增強資料庫頁面功能
- **現況**: 缺少篩選、排序、多選和欄位選擇功能
- **期望**: 在頁面頂部添加工具列，包含：
  - Filter 按鈕（篩選）
  - Sort 按鈕（排序）
  - 多選切換按鈕
  - 欄位選擇器

### 5. 優化首頁使用者資訊顯示
- **現況**: 顯示「歡迎回來」文字
- **期望**: 移除歡迎文字，改為顯示：
  - 使用者姓名（較大字體）
  - 使用者帳號/Email（較小字體）

## 🔍 技術研究與參考

### 現有程式碼結構
根據程式碼分析，需要修改的主要檔案：

1. **Navigation 元件**
   - 檔案：`src/navigation/MainTabNavigator.tsx`
   - 目前 tabBarStyle 高度：88px
   - 需要調整 paddingBottom 確保安全區域

2. **ActionModal 元件**
   - 檔案：`src/components/common/ActionModal.tsx`
   - 目前使用全螢幕 Modal
   - 需要改為 Popover 風格

3. **各頁面 Header**
   - 首頁：`src/screens/dashboard/EnhancedDashboard.tsx`
   - 資料庫：`src/screens/database/DatabaseScreen.tsx`
   - 小工具：`src/screens/tools/ToolsScreen.tsx`

4. **DataTable 元件**
   - 檔案：`src/components/common/DataTable.tsx`
   - 已有基礎功能，需要增強工具列

### 設計規範
- 主色調：`#007AFF`
- 背景色：`#F8F9FA`
- 卡片背景：`#FFFFFF`
- 邊框色：`#E5E5EA`
- 文字色：主要 `#1C1C1E`、次要 `#8E8E93`

### 參考資源
- React Native Safe Area Context: https://github.com/th3rdwave/react-native-safe-area-context
- React Native Popover: https://github.com/SteffeyDev/react-native-popover-view
- iOS Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/tab-bars

## 💻 實作計畫

### 第一階段：修正 Navbar 位置
```tsx
// MainTabNavigator.tsx 修改
tabBarStyle: {
  height: 88,
  paddingBottom: 20, // 增加底部安全間距
  paddingTop: 10,
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E5E5EA',
  position: 'absolute',
  bottom: 0,
  elevation: 0,
  shadowOpacity: 0,
}
```

### 第二階段：改造 ActionModal
```tsx
// 新建 ActionPopover.tsx 取代 ActionModal
import { Popover } from 'react-native-popover-view';

const ActionPopover = ({ isVisible, onClose, fromRef }) => {
  return (
    <Popover
      isVisible={isVisible}
      onRequestClose={onClose}
      from={fromRef}
      placement="top"
      popoverStyle={styles.popover}
      backgroundStyle={styles.backdrop}
    >
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person-add" size={24} color="#007AFF" />
          <Text>新增客戶</Text>
        </TouchableOpacity>
        {/* 其他按鈕... */}
      </View>
    </Popover>
  );
};
```

### 第三階段：移除頁面標題
```tsx
// 各頁面移除或條件渲染 header
// EnhancedDashboard.tsx
{/* 移除此部分
<View style={styles.pageHeader}>
  <Text style={styles.pageTitle}>首頁</Text>
</View>
*/}

// SettingsScreen.tsx 保留
<View style={styles.pageHeader}>
  <Text style={styles.pageTitle}>設定</Text>
</View>
```

### 第四階段：增強資料庫功能
```tsx
// DatabaseScreen.tsx 添加工具列
<View style={styles.toolbar}>
  <TouchableOpacity style={styles.toolButton}>
    <Ionicons name="filter" size={20} />
    <Text>篩選</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.toolButton}>
    <Ionicons name="swap-vertical" size={20} />
    <Text>排序</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.toolButton}>
    <Ionicons name="checkmark-circle" size={20} />
    <Text>多選</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.toolButton}>
    <Ionicons name="list" size={20} />
    <Text>欄位</Text>
  </TouchableOpacity>
</View>
```

### 第五階段：優化首頁使用者資訊
```tsx
// EnhancedDashboard.tsx
<View style={styles.userInfo}>
  <Text style={styles.userName}>{user?.name || '使用者'}</Text>
  <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
</View>
```

## 🧪 驗證計畫

### 功能驗證
1. **Navbar 位置**
   - 檢查在不同裝置上的顯示
   - 確認沒有被螢幕邊緣遮擋
   - 測試 iPhone 有瀏海和無瀏海機型

2. **ActionPopover**
   - 點擊 + 按鈕顯示 Popover
   - 背景適當調暗但保持可見
   - 點擊背景或按鈕關閉 Popover
   - 動畫流暢自然

3. **頁面標題**
   - 確認只有設定頁保留標題
   - 其他頁面空間被有效利用

4. **資料庫工具列**
   - 所有按鈕正常運作
   - 篩選和排序功能完整
   - 多選模式切換順暢
   - 欄位選擇器可自定義顯示

5. **使用者資訊**
   - 正確顯示使用者姓名和帳號
   - 排版美觀，資訊清晰

### 測試指令
```bash
# 開發模式測試
npx expo start

# 在 iOS 模擬器測試
i

# 在實機測試
掃描 QR Code
```

## 📝 實作步驟

1. **建立 ActionPopover 元件**
   - 安裝必要套件：`npm install react-native-popover-view`
   - 建立新元件替換 ActionModal
   - 修改 MainTabNavigator 的引用

2. **調整 Navbar 樣式**
   - 修改 tabBarStyle 加入安全邊距
   - 測試不同裝置的顯示效果

3. **移除頁面標題**
   - 逐一檢查各頁面檔案
   - 移除或條件渲染標題元件
   - 調整剩餘內容的間距

4. **實作資料庫工具列**
   - 在 DatabaseScreen 頂部加入工具列
   - 實作各按鈕的功能邏輯
   - 整合到 DataTable 元件

5. **更新首頁使用者資訊**
   - 修改 header 結構
   - 調整樣式和排版
   - 確保資訊正確顯示

## 🎯 成功標準

- [ ] Navbar 在所有裝置上完整顯示，無遮擋
- [ ] + 按鈕點擊後顯示小型 Popover，背景調暗但可見
- [ ] 除設定頁外，其他頁面無標題列
- [ ] 資料庫頁面有完整的篩選、排序、多選和欄位選擇功能
- [ ] 首頁顯示使用者姓名和帳號，無歡迎文字
- [ ] 所有修改符合現有設計規範
- [ ] 動畫流暢，使用體驗良好

## 📊 信心評分

**實作成功信心度: 9/10**

評分理由：
- 程式碼結構清晰，修改點明確
- 有現成的設計規範可遵循
- 大部分是 UI 調整，技術難度不高
- 需要的第三方套件穩定可靠
- 有完整的測試方案

## 🚨 注意事項

1. **安全區域處理**
   - 使用 react-native-safe-area-context 確保相容性
   - 特別注意 iPhone X 系列的底部安全區域

2. **動畫效能**
   - ActionPopover 使用原生動畫以確保流暢度
   - 避免在動畫中進行複雜計算

3. **向後相容**
   - 確保修改不影響現有功能
   - 保留原有的導航邏輯

4. **響應式設計**
   - 工具列按鈕在小螢幕上可能需要調整
   - 考慮使用 ScrollView 或更簡潔的圖示

## 📚 參考檔案

需要修改的主要檔案清單：
- `src/navigation/MainTabNavigator.tsx` - Navbar 調整
- `src/components/common/ActionModal.tsx` - 改為 Popover
- `src/screens/dashboard/EnhancedDashboard.tsx` - 首頁修改
- `src/screens/database/DatabaseScreen.tsx` - 資料庫工具列
- `src/screens/tools/ToolsScreen.tsx` - 移除標題
- `src/screens/settings/SettingsScreen.tsx` - 保留標題
- `src/components/common/DataTable.tsx` - 整合新功能

---

**執行前檢查清單**：
- [ ] 已備份現有程式碼
- [ ] 了解所有修改點
- [ ] 準備好測試環境
- [ ] 安裝必要的依賴套件