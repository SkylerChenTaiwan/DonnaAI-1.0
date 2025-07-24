# PRP: 按鈕系統重新設計 - 現代化灰色極簡風格

## 📋 背景

目前專案中的按鈕樣式需要更新為更現代、極簡的灰色設計系統。根據研究，我們將參考 Linear 和 2024 年的設計趨勢，實現一個無陰影、扁平化、具有細膩互動狀態的按鈕系統。

## 🔍 現況分析

### 現有按鈕元件
1. **Button.tsx** (`/src/components/common/Button.tsx`) - 主要按鈕元件
   - 變體：primary, secondary, outline
   - 尺寸：small, medium, large
   - 問題：陰影過重、圓角可能不夠細膩

2. **IconButton.tsx** (`/src/components/ui/IconButton.tsx`) - 圖標按鈕
   - 變體：primary, secondary, ghost
   - 尺寸：sm (32px), md (40px), lg (48px)

3. **SearchButton.tsx** (`/src/components/common/SearchButton.tsx`) - 搜尋按鈕
   - 圓形設計，深灰背景 (#404040)

4. **TouchableOpacity 按鈕** - 分佈在 69+ 個檔案中
   - 各種自定義按鈕樣式（backButton, closeButton, actionButton 等）

### 現有設計系統
- 主色調：#525252（中等灰色）
- 已有 Notion 風格的灰階調色板
- 使用 React Native StyleSheet API

## 🎯 設計目標

### 參考靈感
- **Linear 設計系統**：極簡、無陰影、高對比度
- **2024 設計趨勢**：扁平化、細膩的 hover 狀態、無背景文字按鈕

### 核心設計原則
1. **無陰影設計**：移除所有 elevation 和 shadow
2. **細膩互動狀態**：使用顏色透明度變化而非陰影
3. **更精緻的圓角**：從 8px 調整為 6px
4. **改進的色彩系統**：更細膩的灰階變化
5. **更好的對比度**：確保可訪問性

## 📐 新設計規格

### 按鈕變體設計

```typescript
// 主要按鈕樣式定義
const buttonStyles = {
  // 基礎樣式 - 移除所有陰影
  base: {
    borderRadius: 6, // 更細膩的圓角
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    transition: 'all 0.15s ease', // 平滑過渡
  },
  
  // 主要按鈕 - 深灰色
  primary: {
    backgroundColor: '#2C2C2C', // 更深的灰色，類似 Linear
    borderWidth: 0,
  },
  primaryHover: {
    backgroundColor: '#3C3C3C', // 輕微提亮
  },
  primaryPressed: {
    backgroundColor: '#1C1C1C', // 按下時變暗
  },
  
  // 次要按鈕 - 淺灰背景
  secondary: {
    backgroundColor: '#F7F7F7', // 極淺灰
    borderWidth: 0,
  },
  secondaryHover: {
    backgroundColor: '#ECECEC',
  },
  secondaryPressed: {
    backgroundColor: '#E0E0E0',
  },
  
  // 輪廓按鈕 - 透明背景
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  outlineHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderColor: '#A0A0A0',
  },
  
  // Ghost 按鈕 - 無邊框透明
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  ghostHover: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  // 文字按鈕 - 極簡風格
  text: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  textHover: {
    opacity: 0.7,
  }
};

// 尺寸調整 - 更緊湊
const sizes = {
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
  }
};

// 文字樣式 - 更細的字重
const textStyles = {
  primary: {
    color: '#FFFFFF',
    fontWeight: '500', // 從 600 改為 500
  },
  secondary: {
    color: '#2C2C2C',
    fontWeight: '500',
  },
  outline: {
    color: '#2C2C2C',
    fontWeight: '500',
  },
  ghost: {
    color: '#2C2C2C',
    fontWeight: '500',
  },
  text: {
    color: '#2C2C2C',
    fontWeight: '400',
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: 'rgba(44, 44, 44, 0.3)',
  }
};

// 停用狀態 - 更細膩
const disabledStyles = {
  opacity: 0.5,
  cursor: 'not-allowed',
};
```

### 圖標按鈕更新

```typescript
// IconButton 尺寸調整
const iconSizes = {
  sm: 28, // 從 32px 縮小
  md: 36, // 從 40px 縮小  
  lg: 44, // 從 48px 縮小
};

// 圖標按鈕樣式
const iconButtonStyles = {
  primary: {
    backgroundColor: '#2C2C2C',
  },
  secondary: {
    backgroundColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
  }
};
```

## 🛠 實施計畫

### 第一階段：設計系統更新
1. 更新 `/src/theme/designSystem.ts`
   - 調整主色調為 #2C2C2C
   - 新增 hover 和 pressed 狀態顏色
   - 移除陰影系統中的按鈕陰影
   - 調整圓角系統

### 第二階段：核心元件更新
2. 更新 `/src/components/common/Button.tsx`
   - 實施新的樣式系統
   - 移除所有陰影
   - 添加 hover 和 pressed 狀態處理
   - 新增 'ghost' 和 'text' 變體

3. 更新 `/src/components/ui/IconButton.tsx`
   - 調整尺寸系統
   - 實施新的顏色方案
   - 移除陰影

4. 更新 `/src/components/common/SearchButton.tsx`
   - 調整背景色為新的灰階
   - 移除陰影效果

### 第三階段：全域按鈕樣式統一
5. 建立 `/src/components/common/ButtonStyles.ts`
   - 匯出統一的按鈕樣式常量
   - 供 TouchableOpacity 使用

6. 批量更新所有 TouchableOpacity 按鈕
   - 使用統一的樣式常量
   - 確保一致性

### 第四階段：測試與調整
7. 視覺回歸測試
   - 檢查所有畫面的按鈕顯示
   - 確保對比度符合 WCAG 標準

8. 互動測試
   - 測試所有按鈕的點擊反饋
   - 確保動畫流暢

## 📍 關鍵檔案路徑

### 需要更新的核心檔案
- `/src/theme/designSystem.ts` - 設計系統常量
- `/src/components/common/Button.tsx` - 主按鈕元件
- `/src/components/ui/IconButton.tsx` - 圖標按鈕元件
- `/src/components/common/SearchButton.tsx` - 搜尋按鈕元件

### 需要批量更新的檔案（包含 TouchableOpacity）
主要集中在以下目錄：
- `/src/screens/` - 所有畫面檔案
- `/src/components/` - 所有元件檔案
- `/src/navigation/` - 導航相關元件

## 🧪 驗證步驟

### 程式碼品質檢查
```bash
# 執行 ESLint 檢查
npm run lint

# 執行 TypeScript 類型檢查
npm run typecheck
```

### 視覺驗證
1. 啟動應用程式
2. 逐一檢查每個畫面的按鈕顯示
3. 測試不同狀態（正常、hover、pressed、disabled）
4. 確認在 iOS 和 Android 上的顯示一致性

### 可訪問性檢查
- 確保按鈕文字與背景的對比度 >= 4.5:1
- 確保停用狀態可識別
- 確保焦點狀態清晰可見

## 🔗 參考資源

### 設計參考
- Linear 設計系統：https://linear.app/brand
- Linear UI 重新設計：https://linear.app/blog/how-we-redesigned-the-linear-ui
- Figma Linear 設計系統：https://www.figma.com/community/file/1222872653732371433/linear-design-system

### 技術參考
- React Native Button 最佳實踐
- 現代按鈕設計趨勢（2024）
- 無障礙按鈕設計指南

## ⚠️ 注意事項

1. **保持一致性**：確保所有按鈕遵循新的設計系統
2. **效能考量**：避免過度使用動畫影響效能
3. **向後相容**：確保更新不會破壞現有功能
4. **漸進式更新**：可以分批次更新，先更新核心元件

## 📊 預期效果

- 更現代、專業的視覺外觀
- 更好的視覺層次和對比度
- 更細膩的互動體驗
- 統一的按鈕系統，減少維護成本

## 🎯 成功標準

1. 所有按鈕採用新的設計系統
2. 無陰影、扁平化設計實施完成
3. 互動狀態流暢自然
4. 通過所有測試驗證
5. 獲得使用者正面反饋

---

**信心評分：9/10**

此 PRP 提供了完整的實施路徑，包含詳細的設計規格、程式碼範例和驗證步驟。唯一的不確定性在於 React Native 中 hover 狀態的實現可能需要特殊處理。