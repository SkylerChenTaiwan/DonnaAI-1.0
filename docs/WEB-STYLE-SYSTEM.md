# Web 平台樣式系統指南

## 📋 問題背景

在開發 DonnaAI Web 版本時，我們遇到了嚴重的樣式衝突問題：
- 輸入框沒有內邊距（文字貼邊）
- 圖標顯示為方框（□）
- 樣式修改後部署不生效

### 圖標載入問題（已解決）
**問題**：所有圖標顯示為方框（□）
**原因**：React Native Web 不會自動處理 @expo/vector-icons 的字體載入
**解決方案**：手動創建 @font-face 定義

```css
/* src/styles/iconFonts.css */
@font-face {
  font-family: 'Ionicons';
  src: url('/assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.[hash].ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

在 App.tsx 導入：
```typescript
import './src/styles/iconFonts.css';
```

## 🔍 問題根源分析

### 1. 全域 CSS 影響
```typescript
// App.tsx
import './src/components/database/web/styles/NotionDatabaseV4.css';
```
- NotionDatabaseV4.css 是全域 CSS，會影響整個應用程式
- 全域 CSS 的優先級可能覆蓋 React Native Web 生成的樣式

### 2. React Native Web 樣式處理
- React Native Web 將 `StyleSheet.create()` 轉換為 CSS-in-JS
- 生成的樣式可能是類別名稱或內聯樣式
- 優先級：內聯樣式 > CSS 類別 > CSS 變數

### 3. 樣式系統衝突
```
React Native StyleSheet → CSS-in-JS → 可能被全域 CSS 覆蓋
```

## ✅ 解決方案

### 方案一：使用原生 HTML 元素（推薦）

在 Web 平台使用原生 HTML 元素並套用內聯樣式：

```typescript
// FormInput.tsx
export const FormInput: React.FC<FormInputProps> = ({ ...props }) => {
  // Web 平台使用原生 HTML input
  if (Platform.OS === 'web') {
    const webInputStyle = {
      width: '100%',
      padding: '12px 16px',
      border: `1px solid ${DesignSystem.colors.border.light}`,
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '20px',
      minHeight: '48px',
      backgroundColor: DesignSystem.colors.background.surface,
      color: DesignSystem.colors.text.primary,
      outline: 'none',
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
    };

    return (
      <input
        type="text"
        style={webInputStyle}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e: any) => props.onChangeText?.(e.target.value)}
      />
    );
  }

  // Native 平台使用 React Native TextInput
  return <TextInput style={styles.input} {...props} />;
};
```

### 方案二：限制全域 CSS 作用範圍

修改全域 CSS，移除對 body 和 #root 的設定：

```css
/* 錯誤：影響全域 */
body {
  background-color: #fbfbfa !important;
}

/* 正確：限制在特定元件 */
.notion-database-wrapper {
  background-color: #fbfbfa;
}
```

### 方案三：使用更高優先級的樣式

使用 `!important` 或更特定的選擇器（不推薦，僅作為臨時解決方案）

## 🚫 常見錯誤

### 1. 依賴 React Native Web 的樣式轉換
```typescript
// 錯誤：可能被全域 CSS 覆蓋
const styles = StyleSheet.create({
  input: {
    padding: 16,  // 可能無效
  }
});
```

### 2. 在 Web 平台使用 Platform.select 的樣式
```typescript
// 錯誤：樣式可能不夠具體
...Platform.select({
  web: {
    outlineStyle: 'none',
  }
})
```

### 3. 忘記清理 Metro 快取
```bash
# 建置前清理快取
rm -rf .expo && rm -rf node_modules/.cache
npm run web:build
```

## 📝 開發檢查清單

開發新的 Web 元件時，請確認：

- [ ] 是否有全域 CSS 會影響此元件？
- [ ] 是否需要為 Web 平台使用原生 HTML 元素？
- [ ] 內聯樣式是否完整（包含所有必要屬性）？
- [ ] 是否測試過本地和生產環境？
- [ ] 是否清理過快取並重新建置？

## 🔧 調試技巧

### 1. 檢查實際應用的樣式
```javascript
// 在瀏覽器控制台執行
const element = document.querySelector('input');
console.log(window.getComputedStyle(element));
```

### 2. 驗證建置輸出
```bash
# 檢查編譯後的檔案是否包含修改
grep -c "padding.*16" dist-web/_expo/static/js/web/index-*.js
```

### 3. 強制清除 CDN 快取
```javascript
// firebase.json
{
  "headers": [{
    "source": "**/*.@(js|css)",
    "headers": [{
      "key": "Cache-Control",
      "value": "no-cache, must-revalidate"
    }]
  }]
}
```

## 🏗️ 架構建議

### 1. 元件結構
```
components/
  common/
    FormInput/
      index.tsx        # 導出邏輯
      FormInput.tsx    # Native 實作
      FormInput.web.tsx # Web 實作
      styles.ts        # 共用樣式
```

### 2. 樣式優先級策略
1. **Web 平台**：使用內聯樣式或 CSS Modules
2. **Native 平台**：使用 StyleSheet.create()
3. **共用樣式**：定義在 DesignSystem 中

### 3. 測試流程
```bash
# 1. 本地測試
npm run web:dev

# 2. 建置測試
npm run web:build
cd dist-web && npx serve -l 3002

# 3. 部署測試
npm run web:deploy
```

## 📚 相關資源

- [React Native Web 文件](https://necolas.github.io/react-native-web/)
- [Expo Web 最佳實踐](https://docs.expo.dev/guides/web/)
- [CSS 優先級規則](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)

## 💡 經驗教訓

1. **不要假設 React Native Web 會完美轉換樣式**
   - 某些樣式屬性可能不被支援
   - 優先級可能不如預期

2. **全域 CSS 是危險的**
   - 盡量避免使用全域選擇器
   - 使用 CSS Modules 或 CSS-in-JS

3. **Web 平台需要特殊處理**
   - 考慮使用原生 HTML 元素
   - 使用內聯樣式確保優先級

4. **快取是調試的敵人**
   - 開發時設定適當的快取策略
   - 記得清理本地和 CDN 快取

## 🔄 持續改進

- [ ] 考慮移除全域 CSS，改用 CSS Modules
- [ ] 建立 Web 專用元件庫
- [ ] 實作自動化樣式測試
- [ ] 建立樣式系統文件

---

*最後更新：2024-08-08*
*問題案例：Onboarding 元件輸入框樣式問題*