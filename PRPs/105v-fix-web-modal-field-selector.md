# PRP-105: 修復 Web 平台 Modal 欄位選擇器顯示問題

**建立日期**: 2025-08-13  
**作者**: Claude  
**狀態**: ✅ 已執行  
**優先級**: 🔴 高（影響核心功能）  
**信心分數**: 9/10

## 📋 問題描述

資料匯入精靈中的欄位映射頁面，Web 平台的欄位選擇器 Modal 無法正常顯示。點擊欄位選擇按鈕後，Modal 應該彈出但實際上沒有顯示。

### 現象
- 點擊欄位選擇按鈕時，console.log 顯示狀態已改變
- Modal 元件在 DOM 中存在但不可見
- 影響欄位選擇器和關聯編輯器兩個 Modal

### 根本原因
Web 平台的 modalOverlay 樣式不完整，缺少關鍵的尺寸屬性。

## 🎯 目標

1. 修復 Web 平台的 Modal 顯示問題
2. 確保 Modal 正確覆蓋在其他內容上方
3. 保持 Native 平台的功能不受影響
4. 改善 Web 平台的使用體驗

## 📚 參考資料

### 內部參考
- **問題檔案**: `/src/components/import/stages/FieldMapper.tsx`
- **分析報告**: `/docs/error-reports/2025-08-13-field-selector-modal-issue.md`
- **方案比較**: `/docs/error-reports/2025-08-13-modal-solution-comparison.md`

### 現有模式
```javascript
// 當前問題程式碼 (FieldMapper.tsx line 1274-1288)
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
      right: 0,
      bottom: 0,
      zIndex: 9999
    }
  })
}
```

### 其他 Modal 實作參考
- `/src/components/common/SortModal.tsx` - 使用原生 Modal，無平台判斷
- `/src/components/common/ActionPopover.tsx` - 可能有類似模式

## 🛠️ 實作計畫

### 方案 A：修復 Web Modal 樣式（選定方案）

#### 1. 修正 modalOverlay 樣式
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
      right: 0,
      bottom: 0,
      width: '100vw',      // 新增：明確設定寬度
      height: '100vh',     // 新增：明確設定高度
      zIndex: 9999,
      display: 'flex',     // 新增：確保 flexbox 在 web 上生效
      justifyContent: 'center',
      alignItems: 'center'
    },
    default: {
      flex: 1
    }
  })
}
```

#### 2. 改進 Web 平台 Modal 容器
```javascript
// 修改 Web 平台的條件渲染邏輯
{Platform.OS === 'web' ? (
  showFieldSelector && (
    <View 
      style={styles.modalOverlay}
      // 新增：點擊遮罩關閉
      onTouchEnd={(e) => {
        if (e.target === e.currentTarget) {
          setShowFieldSelector(false);
        }
      }}
    >
      <View style={[styles.modalContent, { backgroundColor: colors.white }]}>
        {/* Modal 內容 */}
      </View>
    </View>
  )
) : (
  // Native Modal 保持不變
)}
```

#### 3. 增加鍵盤無障礙支援
```javascript
// 在 useEffect 中加入 Escape 鍵監聽
useEffect(() => {
  if (Platform.OS === 'web' && showFieldSelector) {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFieldSelector(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }
}, [showFieldSelector]);
```

## 📝 實作步驟

### 步驟 1：修復 modalOverlay 樣式
**檔案**: `/src/components/import/stages/FieldMapper.tsx`
**行號**: 約 1274-1288

1. 找到 `modalOverlay` 樣式定義
2. 更新 `Platform.select` 中的 web 樣式
3. 加入 width、height、display 屬性

### 步驟 2：修復關聯編輯器 Modal
**行號**: 檢查是否有相同問題

1. 搜尋第二個 Modal（關聯編輯器）
2. 確認是否使用相同的 modalOverlay 樣式
3. 如果是分開的樣式，一併修正

### 步驟 3：加入無障礙功能
1. 新增 Escape 鍵關閉功能
2. 確保點擊遮罩可關閉 Modal

### 步驟 4：測試驗證
1. Web 平台測試
2. Native 平台回歸測試
3. 多瀏覽器相容性測試

## 🧪 驗證門檻

### 語法檢查
```bash
# TypeScript 編譯檢查
npm run type-check

# Linting
npm run lint
```

### 功能測試清單
- [ ] Web 平台：欄位選擇器 Modal 可正常開啟
- [ ] Web 平台：關聯編輯器 Modal 可正常開啟
- [ ] Web 平台：點擊遮罩可關閉 Modal
- [ ] Web 平台：按 Escape 鍵可關閉 Modal
- [ ] Native 平台：功能未受影響
- [ ] 多重 Modal 不會互相干擾

### 瀏覽器測試
```bash
# 建置 Web 版本
npm run web:build

# 本地測試
npm run web

# 測試瀏覽器：Chrome、Safari、Firefox、Edge
```

## 🐛 錯誤處理

### 可能的問題
1. **z-index 衝突**：如果仍被其他元素覆蓋，調整 z-index 值
2. **flex 屬性不生效**：確保 display: 'flex' 明確設定
3. **vh/vw 單位問題**：某些環境可能不支援，改用 100% 並確保 html/body 高度

### 降級方案
如果方案 A 無效，考慮：
- 移除 Platform.OS 判斷，統一使用 React Native Modal
- 使用第三方 Modal 套件

## 📊 成功指標

1. **功能恢復**：Modal 在所有平台正常顯示
2. **無迴歸錯誤**：現有功能未受影響
3. **使用體驗**：Web 平台 Modal 操作流暢

## 🚀 部署計畫

1. 本地測試通過
2. 建置 Web 版本
3. 部署到測試環境
4. 驗證功能
5. 部署到生產環境

## 📈 信心評估

**信心分數：9/10**

評分理由：
- ✅ 問題原因明確（樣式不完整）
- ✅ 解決方案簡單直接
- ✅ 影響範圍可控
- ✅ 有完整的測試計畫
- ⚠️ 需要跨瀏覽器測試

## 🔄 任務清單

執行順序：
1. **備份現有程式碼**
2. **修復 modalOverlay 樣式** - Web 平台加入 width、height
3. **測試欄位選擇器 Modal** - 確認可正常顯示
4. **修復關聯編輯器 Modal** - 如有相同問題
5. **加入 Escape 鍵支援** - 改善使用體驗
6. **本地測試** - Web 和 Native 平台
7. **建置部署** - 部署到測試環境
8. **驗證** - 完整功能測試

---

*此 PRP 提供完整的實作指引，包含具體的程式碼修改和測試步驟，確保一次性成功修復 Modal 顯示問題。*