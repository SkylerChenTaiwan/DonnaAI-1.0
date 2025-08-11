# Adaptive Architecture 統一架構系統

## 概述

Adaptive Architecture 是一套完整的跨平台架構解決方案，旨在解決 React Native Web 開發中的平台兼容性問題，提供統一的開發體驗和高品質的程式碼。

### 🎯 核心目標

- **平台一致性**: 在 Web 和 Native 平台提供一致的 UI/UX 體驗
- **開發效率**: 減少重複程式碼，提升開發速度
- **程式碼品質**: 通過自動化工具確保程式碼品質和一致性
- **維護性**: 統一的架構模式，降低維護成本

### 🏗️ 架構概覽

```
Adaptive Architecture
├── 🔧 Platform Adapters      # 平台適配層
├── 🧩 Adaptive Components    # 統一元件庫  
├── 🎨 Design System         # 設計系統
├── 👁️ Visual Testing        # 視覺回歸測試
├── 🛠️ Development Tools     # 開發工具
└── ✅ Validation Framework  # 驗證框架
```

## 📋 目錄

- [快速開始](#快速開始)
- [核心概念](#核心概念)
- [元件指南](#元件指南)
- [開發工作流程](#開發工作流程)
- [最佳實踐](#最佳實踐)
- [工具使用](#工具使用)
- [故障排除](#故障排除)

---

## 快速開始

### 安裝依賴

```bash
npm install
```

### 基本使用

```typescript
import { AdaptiveView, AdaptiveText, AdaptiveButton } from '@components/adaptive/core';
import { DesignSystem } from '@theme/designSystem';

function MyComponent() {
  return (
    <AdaptiveView style={{ padding: DesignSystem.spacing.md }}>
      <AdaptiveText variant="heading">
        歡迎使用 Adaptive Architecture
      </AdaptiveText>
      <AdaptiveButton 
        variant="primary" 
        onPress={() => console.log('按鈕點擊')}
      >
        開始使用
      </AdaptiveButton>
    </AdaptiveView>
  );
}
```

### 執行驗證

```bash
# 快速驗證
./tools/validation/run-validation.sh --mode quick

# 完整驗證
./tools/validation/run-validation.sh --mode full --format html
```

---

## 核心概念

### 1. Platform Adapter (平台適配器)

Platform Adapter 是架構的核心，負責處理平台差異：

```typescript
import { PlatformAdapter } from '@components/adaptive/platform';

const adapter = PlatformAdapter.getInstance();

// 平台檢測
if (adapter.isWeb) {
  // Web 特定邏輯
} else {
  // Native 特定邏輯
}

// 樣式適配
const styles = adapter.getStyleAdapter().adaptStyles({
  padding: 16,
  backgroundColor: '#ffffff'
});
```

**核心功能:**
- 🔍 統一平台檢測 (取代散亂的 `Platform.OS` 使用)
- 🎨 自動樣式轉換 (React Native ↔ CSS)
- 🔧 平台特定 API 包裝

### 2. Adaptive Components (自適應元件)

統一的跨平台元件庫，自動適配不同平台：

```typescript
import { 
  AdaptiveView,    // 取代 View/div
  AdaptiveText,    // 取代 Text/span  
  AdaptiveButton,  // 統一按鈕元件
  AdaptiveInput,   // 統一輸入元件
} from '@components/adaptive/core';

// 自動平台適配
<AdaptiveButton 
  variant="primary"
  size="large" 
  onPress={handlePress}      // Native
  onClick={handlePress}      // Web (自動處理)
>
  點擊我
</AdaptiveButton>
```

**主要優勢:**
- ✅ 自動平台適配
- ✅ 統一的 API 介面
- ✅ 內建無障礙支援
- ✅ TypeScript 類型安全

### 3. Design System (設計系統)

統一的設計 tokens 系統：

```typescript
import { DesignSystem } from '@theme/designSystem';

const styles = StyleSheet.create({
  container: {
    padding: DesignSystem.spacing.lg,          // 16px
    backgroundColor: DesignSystem.colors.primary, // #007bff
    borderRadius: DesignSystem.borderRadius.md,    // 8px
  },
  text: {
    ...DesignSystem.typography.body,           // 字體樣式
    color: DesignSystem.colors.text.primary,   // 文字顏色
  }
});
```

**涵蓋範圍:**
- 🎨 顏色系統 (主色、次色、狀態色)
- 📏 間距系統 (xs, sm, md, lg, xl)  
- 📝 字體系統 (標題、正文、說明)
- 🔲 圓角系統
- 🌟 陰影系統

---

## 元件指南

### AdaptiveView

統一的容器元件，取代 `View`(Native) 和 `div`(Web)：

```typescript
<AdaptiveView 
  style={styles.container}
  accessible={true}
  testID="main-container"
>
  {/* 內容 */}
</AdaptiveView>
```

### AdaptiveText

統一的文字元件，支援變體和樣式：

```typescript
<AdaptiveText 
  variant="heading"           // heading | body | caption
  color="primary"            // 語義化顏色
  weight="bold"              // normal | bold
  align="center"             // left | center | right
>
  標題文字
</AdaptiveText>
```

### AdaptiveButton

統一的按鈕元件，支援多種變體：

```typescript
<AdaptiveButton
  variant="primary"          // primary | secondary | outline
  size="large"              // small | medium | large
  disabled={false}
  loading={isLoading}
  onPress={handlePress}
  leftIcon={<Icon name="star" />}
>
  提交
</AdaptiveButton>
```

### AdaptiveInput

統一的輸入元件：

```typescript
<AdaptiveInput
  variant="outline"          // filled | outline
  placeholder="請輸入..."
  value={value}
  onChangeText={setValue}
  secureTextEntry={isPassword}
  leftIcon={<Icon name="user" />}
  error={errorMessage}
/>
```

---

## 開發工作流程

### 1. 建立新元件

```typescript
// 1. 建立 Web 版本
const WebMyComponent = (props: MyComponentProps) => (
  <div style={webStyles}>
    {/* Web 實作 */}
  </div>
);

// 2. 建立 Native 版本  
const NativeMyComponent = (props: MyComponentProps) => (
  <View style={nativeStyles}>
    {/* Native 實作 */}
  </View>
);

// 3. 建立 Adaptive 版本
export const AdaptiveMyComponent = forwardRef<any, MyComponentProps>((props, ref) => {
  const adapter = PlatformAdapter.getInstance();
  
  if (adapter.isWeb) {
    return <WebMyComponent {...props} ref={ref} />;
  } else {
    return <NativeMyComponent {...props} ref={ref} />;
  }
});
```

### 2. 使用設計 Tokens

```typescript
// ❌ 避免硬編碼
const styles = {
  margin: 16,
  color: '#333333'
};

// ✅ 使用設計 tokens
const styles = {
  margin: DesignSystem.spacing.md,
  color: DesignSystem.colors.text.primary
};
```

### 3. 平台特定處理

```typescript
import { PlatformAdapter } from '@components/adaptive/platform';

const adapter = PlatformAdapter.getInstance();

// ❌ 避免直接使用 Platform.OS
if (Platform.OS === 'web') {
  // Web 邏輯
}

// ✅ 使用 PlatformAdapter
if (adapter.isWeb) {
  // Web 邏輯
} else {
  // Native 邏輯
}
```

---

## 最佳實踐

### 🎯 元件設計原則

1. **單一職責**: 每個元件只負責一個特定功能
2. **平台無關**: 元件介面不應包含平台特定邏輯  
3. **可組合性**: 元件應該能夠靈活組合
4. **無障礙**: 預設支援無障礙功能

### 📝 程式碼風格

```typescript
// ✅ 良好的元件結構
interface MyComponentProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}) => {
  const adapter = PlatformAdapter.getInstance();
  const styles = adapter.getStyleAdapter().adaptStyles(componentStyles);
  
  return (
    <AdaptiveButton
      variant={variant}
      disabled={disabled}
      onPress={onPress}
      style={styles.button}
      accessibilityLabel={title}
    >
      <AdaptiveText variant="button">
        {title}
      </AdaptiveText>
    </AdaptiveButton>
  );
};
```

### 🧪 測試策略

```typescript
// 元件測試
describe('MyComponent', () => {
  it('should render correctly on web', () => {
    // Web 平台測試
  });
  
  it('should render correctly on native', () => {
    // Native 平台測試
  });
  
  it('should handle press events', () => {
    // 互動測試
  });
});

// 視覺回歸測試
describe('MyComponent Visual Tests', () => {
  it('should match visual snapshot', () => {
    // Storybook + Puppeteer 測試
  });
});
```

---

## 工具使用

### 🔍 程式碼分析

```bash
# 檢查架構合規性
npx ts-node tools/code-analysis/analyzer.ts

# 檢查設計系統使用率
npx ts-node tools/design-system-checker/checker.ts

# 生成遷移計劃
npx ts-node tools/migration-assistant/migrator.ts --plan
```

### 🧹 ESLint 規則

在 `.eslintrc.js` 中啟用 Adaptive 規則：

```javascript
module.exports = {
  plugins: ['adaptive'],
  extends: ['plugin:adaptive/recommended'],
  rules: {
    'adaptive/no-direct-platform-os': 'error',
    'adaptive/prefer-adaptive-components': 'warn',
    'adaptive/enforce-design-system': 'warn',
  }
};
```

### 📊 品質監控

```bash
# 完整驗證
./tools/validation/run-validation.sh --mode full

# 快速檢查
./tools/validation/run-validation.sh --mode quick

# 生成 HTML 報告
./tools/validation/run-validation.sh --format html --output report.html
```

---

## 故障排除

### 常見問題

#### Q: 元件在 Web 上樣式不正確

**A:** 檢查是否有全域 CSS 覆蓋，使用內聯樣式或提高特異性：

```typescript
// 使用內聯樣式確保優先級
const webStyles = {
  padding: '16px !important',
  backgroundColor: '#ffffff',
};
```

#### Q: Platform.OS 檢查不工作

**A:** 使用 PlatformAdapter 替代：

```typescript
// ❌ 
if (Platform.OS === 'web') {}

// ✅
const adapter = PlatformAdapter.getInstance();
if (adapter.isWeb) {}
```

#### Q: 設計 tokens 未生效

**A:** 確認正確匯入和使用：

```typescript
import { DesignSystem } from '@theme/designSystem';

// 確保路徑正確
const styles = StyleSheet.create({
  container: {
    padding: DesignSystem.spacing.md, // 不是 DesignSystem.spacing['md']
  }
});
```

### 除錯工具

```typescript
// 啟用除錯模式
PlatformAdapter.getInstance().setDebugMode(true);

// 檢查當前平台資訊
console.log(PlatformAdapter.getInstance().getPlatformInfo());
```

---

## 相關文件

- [遷移指南](./MIGRATION_GUIDE.md) - 如何將現有程式碼遷移到 Adaptive Architecture
- [開發者指南](./DEVELOPER_GUIDE.md) - 詳細的開發指南和 API 文檔
- [最佳實踐](./BEST_PRACTICES.md) - 深入的最佳實踐和模式
- [故障排除](./TROUBLESHOOTING.md) - 完整的問題解決指南

---

## 貢獻

歡迎貢獻！請閱讀 [貢獻指南](./CONTRIBUTING.md) 了解如何參與開發。

## 授權

MIT License - 詳見 [LICENSE](./LICENSE) 文件。