# 樣式開發指南

## 🎯 快速參考

### Web 平台元件模板

```typescript
import React from 'react';
import { Platform } from 'react-native';

export const MyComponent = ({ ...props }) => {
  // Web 平台特殊處理
  if (Platform.OS === 'web') {
    const webStyles = {
      // 使用內聯樣式，確保優先級
      padding: '12px 16px',
      border: '1px solid #E3E1DC',
      // 記得加上 box-sizing
      boxSizing: 'border-box' as const,
      // 繼承字體
      fontFamily: 'inherit',
    };
    
    return <div style={webStyles}>{props.children}</div>;
  }
  
  // Native 平台
  return <View style={styles.container}>{props.children}</View>;
};
```

## ⚠️ 必須避免的錯誤

### ❌ 錯誤 1：只依賴 StyleSheet
```typescript
// 這可能在 Web 上無效！
const styles = StyleSheet.create({
  input: {
    padding: 16,  // Web 上可能被覆蓋
  }
});

<TextInput style={styles.input} />
```

### ✅ 正確做法：Web 使用內聯樣式
```typescript
if (Platform.OS === 'web') {
  return (
    <input 
      style={{
        padding: '16px',  // 內聯樣式優先級最高
      }}
    />
  );
}
```

### ❌ 錯誤 2：使用全域 CSS 選擇器
```css
/* 不要這樣做！ */
body {
  background: #fff;
}

input {
  padding: 10px;
}
```

### ✅ 正確做法：使用類別選擇器
```css
.my-component-input {
  padding: 10px;
}
```

### ❌ 錯誤 3：忘記處理 Web 平台差異
```typescript
// 這在 Web 上可能不工作
<TextInput 
  onChangeText={handleChange}
  style={styles.input}
/>
```

### ✅ 正確做法：區分平台
```typescript
if (Platform.OS === 'web') {
  return (
    <input 
      onChange={(e) => handleChange(e.target.value)}
      style={webStyles}
    />
  );
}
```

## 📋 開發前檢查清單

在開始開發新元件前，請問自己：

1. **這個元件會在 Web 上使用嗎？**
   - 是 → 需要特殊處理
   - 否 → 使用標準 React Native

2. **有全域 CSS 會影響嗎？**
   - 檢查 `App.tsx` 的 CSS 導入
   - 檢查 `NotionDatabaseV4.css`

3. **需要表單元素嗎？**
   - Web 使用原生 `<input>`, `<select>`, `<textarea>`
   - Native 使用 `TextInput`, `Picker`

## 🛠️ 實用工具函數

### 1. 跨平台輸入元件
```typescript
export const CrossPlatformInput = ({ value, onChange, ...props }) => {
  if (Platform.OS === 'web') {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1px solid #E3E1DC',
          borderRadius: '8px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        {...props}
      />
    );
  }
  
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      style={styles.input}
      {...props}
    />
  );
};
```

### 2. 樣式合併助手
```typescript
export const mergeWebStyles = (...styles: any[]) => {
  if (Platform.OS === 'web') {
    return Object.assign({}, ...styles);
  }
  return StyleSheet.flatten(styles);
};
```

### 3. Web 安全的樣式值
```typescript
export const webSafeValue = (value: number | string) => {
  if (Platform.OS === 'web') {
    return typeof value === 'number' ? `${value}px` : value;
  }
  return value;
};
```

## 🔍 調試指南

### 1. 檢查樣式是否生效
```javascript
// 瀏覽器控制台
document.querySelectorAll('input').forEach(input => {
  const styles = window.getComputedStyle(input);
  console.log('Padding:', styles.padding);
  console.log('Border:', styles.border);
});
```

### 2. 檢查 CSS 優先級
```javascript
// 查看所有應用的樣式規則
const element = document.querySelector('.my-element');
const rules = window.getMatchedCSSRules(element);
console.log(rules);
```

### 3. 驗證建置輸出
```bash
# 檢查樣式是否被編譯
grep "padding.*16" dist-web/_expo/static/js/web/*.js
```

## 🏆 最佳實踐

### 1. 元件檔案結構
```
MyComponent/
  ├── index.tsx           # 導出點
  ├── MyComponent.tsx     # 主元件
  ├── MyComponent.web.tsx # Web 專用版本
  ├── MyComponent.ios.tsx # iOS 專用版本
  └── styles.ts          # 共用樣式
```

### 2. 樣式定義順序
```typescript
const webStyles = {
  // 1. 佈局
  display: 'flex',
  width: '100%',
  
  // 2. 間距
  padding: '12px',
  margin: '8px',
  
  // 3. 邊框
  border: '1px solid #ccc',
  borderRadius: '8px',
  
  // 4. 文字
  fontSize: '14px',
  color: '#333',
  
  // 5. 其他
  cursor: 'pointer',
  transition: 'all 0.2s',
};
```

### 3. 響應式設計
```typescript
const getResponsiveStyles = () => {
  if (Platform.OS === 'web') {
    return {
      '@media (max-width: 768px)': {
        padding: '8px',
      },
      '@media (min-width: 769px)': {
        padding: '16px',
      },
    };
  }
  return {};
};
```

## 📝 檢查清單模板

複製此模板用於新元件開發：

```markdown
## 元件名稱：___________

### 開發前
- [ ] 確認是否需要 Web 支援
- [ ] 檢查全域 CSS 影響
- [ ] 準備 Web/Native 分支邏輯

### 開發中
- [ ] Web 使用內聯樣式
- [ ] 處理平台差異（onChange vs onChangeText）
- [ ] 添加 box-sizing: border-box
- [ ] 測試本地 Web 版本

### 開發後
- [ ] 清理 Metro 快取
- [ ] 建置並測試 dist-web
- [ ] 檢查瀏覽器控制台錯誤
- [ ] 驗證樣式優先級
```

## 🚀 快速修復指令

```bash
# 清理並重建
rm -rf .expo node_modules/.cache dist-web
npm run web:build

# 本地測試
cd dist-web && npx serve -l 3002

# 檢查樣式
grep -r "padding.*16" dist-web/_expo/static/

# 部署
npm run web:deploy
```

---

*記住：在 Web 平台上，內聯樣式是你的好朋友！*