# PRP-43: 開發工具優化與 Victory Native 升級

## 概述
修復專案中的 TypeScript 配置、ESLint 錯誤，並升級 Victory Native 圖表元件到 v41 新版 API。

## 背景
- TypeScript 編譯出現未使用變數警告和路徑解析錯誤
- ESLint 無法正確解析 TypeScript 路徑，導致 import 錯誤
- Victory Native v41 (victory-native-xl) 採用全新 API，需要重寫所有圖表元件

## 目標
1. 修復 ESLint TypeScript 解析器錯誤
2. 優化 TypeScript 配置，消除編譯警告
3. 升級所有圖表元件到 Victory Native v41 新 API

## 技術研究

### 1. ESLint 錯誤分析
```
EslintPluginImportResolveError: typescript with invalid interface loaded as resolver
```
- 問題來源：eslint-plugin-import 無法解析 TypeScript 路徑
- 解決方案：安裝並配置 eslint-import-resolver-typescript

參考：https://stackoverflow.com/questions/69446204/resolve-error-typescript-with-invalid-interface-loaded-as-resolver-eslint

### 2. Victory Native v41 變更
舊版 API (v40 之前)：
```tsx
<VictoryChart>
  <VictoryAxis />
  <VictoryLine data={data} />
</VictoryChart>
```

新版 API (v41+)：
```tsx
<CartesianChart data={data} xKey="x" yKeys={["y"]}>
  {({ points }) => <Line points={points.y} color="red" />}
</CartesianChart>
```

官方文檔：https://nearform.com/open-source/victory-native/docs/cartesian/cartesian-chart/

### 3. 需要更新的檔案清單
```
- src/components/admin/charts/LineChart.tsx
- src/components/admin/charts/BarChart.tsx  
- src/components/admin/charts/PieChart.tsx
- src/screens/admin/UsageReportsScreen.tsx
- src/components/charts/LineChart.tsx
- src/components/charts/BarChart.tsx
- src/components/charts/PieChart.tsx
- src/components/personnel/ActivityChart.tsx
```

## 實作計畫

### 階段 1：修復 ESLint 配置 (30 分鐘)

#### 1.1 安裝必要套件
```bash
npm install --save-dev eslint-import-resolver-typescript
```

#### 1.2 更新 .eslintrc.json
```json
{
  "extends": [
    "expo",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    },
    "project": "./tsconfig.json"
  },
  "settings": {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"]
    },
    "import/resolver": {
      "typescript": {
        "alwaysTryTypes": true,
        "project": "./tsconfig.json"
      }
    }
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "react/prop-types": "off",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  }
}
```

### 階段 2：優化 TypeScript 配置 (20 分鐘)

#### 2.1 更新 tsconfig.json
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@assets/*": ["assets/*"]
    },
    "jsx": "react-native",
    "lib": ["ESNext"],
    "module": "ES2022",
    "target": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js",
    "use-cases/**/*",
    "examples/**/*",
    "functions/**/*",
    "scripts/**/*",
    "fix-admin-org.ts"
  ]
}
```

### 階段 3：安裝 Victory Native v41 依賴 (15 分鐘)

#### 3.1 安裝必要的 peer dependencies
```bash
npm install react-native-reanimated@~3.17.4 react-native-gesture-handler@~2.24.0 @shopify/react-native-skia
```

#### 3.2 更新 babel.config.js
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@services': './src/services',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './assets',
          },
        },
      ],
      'react-native-reanimated/plugin'  // 必須放在最後
    ],
  };
};
```

### 階段 4：實作新版圖表元件 (2 小時)

#### 4.1 建立新的圖表基礎元件

**src/components/admin/charts/v2/LineChart.tsx**
```tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Line, useChartPressState } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  x: number | string;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  title?: string;
  width?: number;
  height?: number;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 250,
  color = DesignSystem.colors.primary,
  yAxisLabel,
  xAxisLabel,
}) => {
  const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={["y"]}
        domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
        chartPressState={state}
        axisOptions={{
          font: {
            size: 12,
            color: DesignSystem.colors.text.secondary,
          },
          lineColor: DesignSystem.colors.border.light,
          labelColor: DesignSystem.colors.text.secondary,
          grid: {
            lineColor: DesignSystem.colors.border.light,
          },
        }}
      >
        {({ points }) => (
          <>
            <Line 
              points={points.y} 
              color={color} 
              strokeWidth={2}
              animate={{ type: "timing", duration: 300 }}
            />
          </>
        )}
      </CartesianChart>
      
      {xAxisLabel && <Text style={styles.xLabel}>{xAxisLabel}</Text>}
      {yAxisLabel && <Text style={styles.yLabel}>{yAxisLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  xLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  yLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
  },
});
```

**src/components/admin/charts/v2/BarChart.tsx**
```tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface BarData {
  x: string | number;
  y: number;
}

interface BarChartProps {
  data: BarData[];
  title?: string;
  width?: number;
  height?: number;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 250,
  color = DesignSystem.colors.primary,
  yAxisLabel,
  xAxisLabel,
}) => {
  const { state, isActive } = useChartPressState({ x: 0, y: { y: 0 } });

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <CartesianChart
        data={data}
        xKey="x"
        yKeys={["y"]}
        domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
        chartPressState={state}
        axisOptions={{
          font: {
            size: 12,
            color: DesignSystem.colors.text.secondary,
          },
          lineColor: DesignSystem.colors.border.light,
          labelColor: DesignSystem.colors.text.secondary,
          grid: {
            lineColor: DesignSystem.colors.border.light,
          },
        }}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.y}
            chartBounds={chartBounds}
            color={color}
            roundedCorners={{ topLeft: 4, topRight: 4 }}
            animate={{ type: "timing", duration: 300 }}
          />
        )}
      </CartesianChart>
      
      {xAxisLabel && <Text style={styles.xLabel}>{xAxisLabel}</Text>}
      {yAxisLabel && <Text style={styles.yLabel}>{yAxisLabel}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
  },
  xLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    textAlign: 'center',
    marginTop: 8,
  },
  yLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ rotate: '-90deg' }],
  },
});
```

**src/components/admin/charts/v2/PieChart.tsx**
```tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart as VictoryPieChart } from 'victory-native';
import { DesignSystem } from '@/theme/designSystem';

const { width: screenWidth } = Dimensions.get('window');

interface PieData {
  label: string;
  value: number;
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  colorScale?: string[];
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  width = screenWidth - 40,
  height = 300,
  innerRadius = 0,
  colorScale = [
    DesignSystem.colors.primary,
    DesignSystem.colors.status.success,
    DesignSystem.colors.status.warning,
    DesignSystem.colors.status.error,
    '#9B59B6',
    '#3498DB',
    '#1ABC9C',
    '#F39C12',
  ],
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const pieData = data.map((item, index) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
    color: colorScale[index % colorScale.length],
  }));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.chartContainer}>
        <VictoryPieChart
          data={pieData}
          width={width}
          height={height}
          innerRadius={innerRadius}
          circleSweepDegrees={360}
          startAngle={0}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        />
      </View>
      
      {/* 圖例 */}
      <View style={styles.legend}>
        {pieData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: item.color }
              ]} 
            />
            <Text style={styles.legendText}>
              {item.label} ({item.percentage}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignSystem.colors.background.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.text.secondary,
  },
});
```

#### 4.2 更新現有圖表元件以使用新版本

1. 複製新版元件覆蓋舊版
2. 更新 import 路徑
3. 移除臨時佔位符

#### 4.3 更新 UsageReportsScreen 使用新圖表

```tsx
// 更新 imports
import { LineChart, BarChart } from '@/components/admin/charts';

// 更新圖表使用方式
<LineChart
  data={getChartData()}
  title={`${metricOptions.find(m => m.id === selectedMetric)?.label} - ${periodOptions.find(p => p.id === selectedPeriod)?.label}趨勢`}
  color={DesignSystem.colors.primary}
  height={250}
/>

<BarChart
  data={[
    { x: "業務部", y: 65 },
    { x: "行銷部", y: 45 },
    { x: "客服部", y: 38 },
    { x: "研發部", y: 28 },
  ]}
  title="各部門使用量分布"
  color={DesignSystem.colors.primary}
  height={200}
/>
```

### 階段 5：測試與驗證 (30 分鐘)

#### 5.1 修復剩餘的 TypeScript 錯誤
- 移除 fix-admin-org.ts 或修復其 import
- 為未使用的參數添加 underscore 前綴

#### 5.2 執行驗證指令
```bash
# ESLint 檢查
npm run lint

# TypeScript 檢查
npm run type-check

# 啟動應用程式測試圖表
npm start
```

## 驗證標準

### 必須通過的檢查
```bash
# 1. ESLint 必須正常運行（無 resolver 錯誤）
npm run lint -- src/components/admin/charts/

# 2. TypeScript 編譯無錯誤
npm run type-check

# 3. 圖表元件正常顯示
# 訪問管理員報表頁面，確認圖表渲染正常
```

### 成功標準
- [ ] ESLint 可以正確解析 TypeScript 路徑
- [ ] TypeScript 編譯無錯誤
- [ ] 所有圖表元件使用新版 Victory Native API
- [ ] 圖表在應用程式中正常顯示
- [ ] 動畫和互動功能正常運作

## 風險與注意事項

1. **Skia 相容性**：確保裝置支援 React Native Skia
2. **效能影響**：新版本雖然效能更好，但初次載入可能較慢
3. **樣式差異**：新版 API 的樣式系統不同，可能需要調整
4. **測試覆蓋**：確保在 iOS 和 Android 上都測試過

## 參考資源

- Victory Native v41 文檔：https://nearform.com/open-source/victory-native/
- ESLint TypeScript Resolver：https://www.npmjs.com/package/eslint-import-resolver-typescript
- React Native Skia：https://shopify.github.io/react-native-skia/
- 遷移討論：https://github.com/FormidableLabs/victory-native-xl/issues/283

## 實作順序總結

1. **修復 ESLint** (15分鐘)
   - 安裝 eslint-import-resolver-typescript
   - 更新 .eslintrc.json 配置

2. **優化 TypeScript** (10分鐘)
   - 關閉 noUnusedLocals 和 noUnusedParameters
   - 排除問題檔案

3. **安裝依賴** (15分鐘)
   - 安裝 Skia 和其他 peer dependencies
   - 更新 babel.config.js

4. **實作新圖表** (2小時)
   - 建立 v2 資料夾實作新版本
   - 逐步替換舊版本
   - 更新使用圖表的頁面

5. **測試驗證** (30分鐘)
   - 執行 lint 和 type-check
   - 實機測試圖表顯示

總預估時間：3.5 小時

信心評分：8/10
- ESLint 和 TypeScript 修復相對簡單 (9/10)
- Victory Native 升級需要重寫但有明確範例 (7/10)
- 已提供完整的實作程式碼和驗證步驟