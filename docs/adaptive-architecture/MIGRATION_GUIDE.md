# Adaptive Architecture 遷移指南

## 概述

本指南將協助您將現有的 React Native 專案遷移到 Adaptive Architecture 統一架構系統。遷移過程分為多個階段，可以逐步進行，確保專案穩定性。

## 📋 遷移檢查清單

### 預備階段
- [ ] 建立程式碼備份
- [ ] 執行現有測試確保功能正常
- [ ] 安裝必要工具和依賴
- [ ] 建立遷移分支

### 階段一：基礎設施
- [ ] 設定 Platform Adapter
- [ ] 整合 Design System
- [ ] 配置 ESLint 規則
- [ ] 建立驗證流程

### 階段二：元件遷移  
- [ ] 遷移核心元件 (View, Text, Button)
- [ ] 遷移表單元件 (TextInput, Picker)
- [ ] 遷移佈局元件
- [ ] 更新樣式系統

### 階段三：進階功能
- [ ] 設定視覺回歸測試
- [ ] 整合 CI/CD 流程
- [ ] 效能優化
- [ ] 文檔更新

---

## 🚀 階段一：基礎設施設定

### 1.1 安裝工具依賴

```bash
# 安裝開發工具
npm install --save-dev typescript @typescript-eslint/parser
npm install --save-dev @types/node glob pixelmatch puppeteer

# 如果使用 Storybook
npm install --save-dev @storybook/react-native
```

### 1.2 建立 Platform Adapter

建立基礎平台適配器：

```bash
mkdir -p src/components/adaptive/platform
```

複製以下檔案到專案中：
- `src/components/adaptive/platform/PlatformAdapter.ts`
- `src/components/adaptive/platform/WebStyleAdapter.ts` 
- `src/components/adaptive/platform/NativeStyleAdapter.ts`

### 1.3 整合 Design System

```typescript
// src/theme/designSystem.ts
export const DesignSystem = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    // ... 現有顏色系統
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  // ... 其他設計 tokens
};
```

### 1.4 配置 ESLint 規則

建立 `tools/eslint-plugin-adaptive/` 目錄並複製 ESLint plugin 檔案：

```javascript
// .eslintrc.js
module.exports = {
  plugins: ['adaptive'],
  rules: {
    'adaptive/no-direct-platform-os': 'warn', // 開始時使用 warn
    'adaptive/prefer-adaptive-components': 'off', // 暫時關閉
    'adaptive/enforce-design-system': 'warn',
  }
};
```

---

## 🔧 階段二：元件遷移

### 2.1 建立遷移計劃

使用自動化工具分析現有程式碼：

```bash
# 生成遷移計劃
npx ts-node tools/migration-assistant/migrator.ts --plan

# 查看遷移計劃
cat MIGRATION-PLAN.md
```

### 2.2 遷移優先順序

#### 高優先級 (核心元件)
1. **View → AdaptiveView**
2. **Text → AdaptiveText**  
3. **TouchableOpacity → AdaptiveButton**

#### 中優先級 (互動元件)
4. **TextInput → AdaptiveInput**
5. **Image → AdaptiveImage**
6. **Modal → AdaptiveModal**

#### 低優先級 (特殊元件)
7. 自定義元件
8. 第三方元件包裝

### 2.3 逐步遷移策略

#### 策略 A: 檔案級遷移 (建議)

逐個檔案完整遷移：

```typescript
// 遷移前 - UserProfile.tsx
import { View, Text, TouchableOpacity } from 'react-native';

export const UserProfile = ({ user }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
      <TouchableOpacity style={styles.button} onPress={handleEdit}>
        <Text>編輯</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  name: {
    fontSize: 18,
    color: '#333333',
  },
  button: {
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 8,
  }
});
```

```typescript
// 遷移後 - UserProfile.tsx
import { 
  AdaptiveView, 
  AdaptiveText, 
  AdaptiveButton 
} from '@components/adaptive/core';
import { DesignSystem } from '@theme/designSystem';

export const UserProfile = ({ user }) => {
  return (
    <AdaptiveView style={styles.container}>
      <AdaptiveText variant="heading" style={styles.name}>
        {user.name}
      </AdaptiveText>
      <AdaptiveButton variant="primary" onPress={handleEdit}>
        編輯
      </AdaptiveButton>
    </AdaptiveView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: DesignSystem.spacing.md,
    backgroundColor: DesignSystem.colors.background.card,
  },
  name: {
    color: DesignSystem.colors.text.primary,
  }
});
```

#### 策略 B: 混合使用 (漸進式)

在同一檔案中混合使用新舊元件：

```typescript
// 過渡期間
import { View } from 'react-native';  // 舊元件
import { AdaptiveText, AdaptiveButton } from '@components/adaptive/core'; // 新元件

export const MixedComponent = () => {
  return (
    <View style={styles.container}> {/* 暫時保留 */}
      <AdaptiveText variant="heading">標題</AdaptiveText>
      <AdaptiveButton variant="primary" onPress={handlePress}>
        按鈕
      </AdaptiveButton>
    </View>
  );
};
```

### 2.4 自動化遷移

使用遷移工具進行部分自動化：

```bash
# 模擬遷移 (查看會發生什麼變化)
npx ts-node tools/migration-assistant/migrator.ts --dry-run

# 自動遷移高信心度項目
npx ts-node tools/migration-assistant/migrator.ts --auto --confidence-threshold 0.8

# 手動遷移剩餘項目
npx ts-node tools/migration-assistant/migrator.ts --interactive
```

### 2.5 常見遷移模式

#### Platform.OS 檢查

```typescript
// 遷移前
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web 特定邏輯
}

// 遷移後  
import { PlatformAdapter } from '@components/adaptive/platform';

const adapter = PlatformAdapter.getInstance();
if (adapter.isWeb) {
  // Web 特定邏輯
}
```

#### 樣式系統

```typescript
// 遷移前
const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    backgroundColor: '#f8f9fa',
  }
});

// 遷移後
const styles = StyleSheet.create({
  container: {
    padding: DesignSystem.spacing.md,
    margin: DesignSystem.spacing.sm, 
    backgroundColor: DesignSystem.colors.background.default,
  }
});
```

#### 條件渲染

```typescript
// 遷移前
{Platform.OS === 'web' ? (
  <div className="web-specific">Web 內容</div>
) : (
  <View>Native 內容</View>
)}

// 遷移後 - 使用 Adaptive 元件統一處理
<AdaptiveView>
  {/* 統一內容，平台差異由元件內部處理 */}
</AdaptiveView>
```

---

## 🧪 階段三：測試與驗證

### 3.1 設定視覺回歸測試

```bash
# 建立測試目錄結構
mkdir -p tests/visual/{__tests__,utils,scripts}

# 複製視覺測試檔案
cp -r tools/visual-testing/* tests/visual/
```

### 3.2 建立元件測試

```typescript
// tests/components/AdaptiveButton.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AdaptiveButton } from '@components/adaptive/core';

describe('AdaptiveButton', () => {
  it('should render correctly', () => {
    const { getByText } = render(
      <AdaptiveButton>測試按鈕</AdaptiveButton>
    );
    
    expect(getByText('測試按鈕')).toBeTruthy();
  });
  
  it('should handle press events', () => {
    const mockPress = jest.fn();
    const { getByText } = render(
      <AdaptiveButton onPress={mockPress}>點擊我</AdaptiveButton>
    );
    
    fireEvent.press(getByText('點擊我'));
    expect(mockPress).toHaveBeenCalled();
  });
});
```

### 3.3 執行驗證

```bash
# 執行完整驗證
./tools/validation/run-validation.sh --mode full

# 檢查遷移進度
npx ts-node tools/migration-assistant/migrator.ts --progress

# 生成品質報告
./tools/validation/run-validation.sh --format html --output migration-report.html
```

---

## 📊 遷移監控

### 進度追蹤指標

| 指標 | 目標 | 當前 | 狀態 |
|------|------|------|------|
| Adaptive 元件使用率 | 90% | - | ⏳ |
| Design System 覆蓋率 | 80% | - | ⏳ |
| Platform.OS 直接使用 | < 5 處 | - | ⏳ |
| ESLint 錯誤 | 0 | - | ⏳ |

### 追蹤命令

```bash
# 檢查進度
./tools/validation/run-validation.sh --mode quick

# 詳細分析
npx ts-node tools/code-analysis/analyzer.ts
```

---

## ⚠️ 常見問題與解決方案

### 問題 1: 樣式在 Web 上不正確

**症狀**: 元件在 Web 平台上樣式錯亂或不生效

**原因**: 全域 CSS 覆蓋或樣式特異性不足

**解決方案**:
```typescript
// 使用內聯樣式提高優先級
if (adapter.isWeb) {
  return (
    <div style={{ 
      padding: '16px',
      backgroundColor: '#ffffff',
      // 使用 !important 強制覆蓋
      color: '#333333 !important'
    }}>
      {children}
    </div>
  );
}
```

### 問題 2: TypeScript 類型錯誤

**症狀**: Adaptive 元件類型檢查失敗

**解決方案**:
```typescript
// 確保正確的類型定義
interface AdaptiveButtonProps {
  onPress?: () => void;  // Native
  onClick?: () => void;  // Web
  children: React.ReactNode;
}
```

### 問題 3: 效能問題

**症狀**: 頁面載入緩慢或記憶體使用過高

**解決方案**:
```typescript
// 使用 React.memo 優化
export const OptimizedComponent = React.memo(({ title }) => {
  return <AdaptiveText>{title}</AdaptiveText>;
});

// 延遲載入非關鍵元件
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
```

---

## 🎯 遷移後檢查清單

### 功能檢查
- [ ] 所有頁面正常載入
- [ ] 互動功能正常工作
- [ ] 表單提交和驗證
- [ ] 導航和路由
- [ ] API 呼叫和資料載入

### 視覺檢查
- [ ] UI 佈局正確
- [ ] 顏色和字體一致
- [ ] 響應式設計正常
- [ ] 動畫和過渡效果
- [ ] 不同螢幕尺寸適配

### 效能檢查  
- [ ] 頁面載入時間
- [ ] 記憶體使用量
- [ ] 包大小影響
- [ ] 滾動流暢度

### 品質檢查
- [ ] ESLint 檢查通過
- [ ] TypeScript 編譯無錯誤
- [ ] 單元測試通過
- [ ] 視覺回歸測試通過

---

## 📈 遷移後優化

### 效能優化

```typescript
// 使用 PlatformAdapter 快取
const adapter = useMemo(() => PlatformAdapter.getInstance(), []);

// 樣式快取
const styles = useMemo(() => 
  adapter.getStyleAdapter().adaptStyles(componentStyles), 
  [adapter]
);
```

### 程式碼分割

```typescript
// 按平台分割程式碼
const WebSpecificComponent = React.lazy(() => 
  import('./components/WebSpecificComponent')
);

const NativeSpecificComponent = React.lazy(() =>
  import('./components/NativeSpecificComponent')
);
```

---

## 🔄 持續改進

### 建立回饋機制

1. **定期檢查**: 每週執行驗證報告
2. **效能監控**: 追蹤關鍵效能指標
3. **使用者回饋**: 收集實際使用體驗
4. **程式碼審查**: 確保新程式碼符合架構原則

### 團隊培訓

1. **架構原則**: 理解 Adaptive Architecture 核心概念
2. **工具使用**: 熟悉開發和驗證工具
3. **最佳實踐**: 遵循統一的程式碼風格和模式
4. **故障排除**: 常見問題的解決方法

---

## 📚 相關資源

- [架構概覽](./README.md) - 完整架構介紹
- [開發者指南](./DEVELOPER_GUIDE.md) - API 文檔和開發指南  
- [最佳實踐](./BEST_PRACTICES.md) - 進階使用模式
- [故障排除](./TROUBLESHOOTING.md) - 問題解決指南

---

需要協助？請建立 issue 或聯絡開發團隊。